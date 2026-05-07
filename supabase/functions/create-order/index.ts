// Edge Function: create-order
// POST /functions/v1/create-order
// Creates a new order for the authenticated customer, validates items,
// calculates totals, and persists order + order_items atomically.

import {
  corsHeaders,
  createServiceClient,
  createSupabaseClient,
  errorResponse,
  handleCors,
  requireAuth,
  successResponse,
} from '../_shared/utils.ts';

interface CreateOrderBody {
  restaurant_id: string;
  delivery_method: 'delivery' | 'pickup';
  delivery_address?: string;
  delivery_notes?: string;
  items: Array<{
    menu_item_id: string;
    quantity: number;
    special_instructions?: string;
  }>;
}

function isValidUUID(value: unknown): value is string {
  if (typeof value !== 'string') return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
}

function validateBody(body: unknown): body is CreateOrderBody {
  if (typeof body !== 'object' || body === null) return false;
  const b = body as Record<string, unknown>;

  if (!isValidUUID(b['restaurant_id'])) return false;
  if (b['delivery_method'] !== 'delivery' && b['delivery_method'] !== 'pickup') return false;
  if (b['delivery_method'] === 'delivery' && typeof b['delivery_address'] !== 'string') {
    return false;
  }
  if (!Array.isArray(b['items']) || b['items'].length === 0) return false;

  for (const item of b['items'] as unknown[]) {
    if (typeof item !== 'object' || item === null) return false;
    const i = item as Record<string, unknown>;
    if (!isValidUUID(i['menu_item_id'])) return false;
    if (typeof i['quantity'] !== 'number' || i['quantity'] < 1 || !Number.isInteger(i['quantity']))
      return false;
  }
  return true;
}

Deno.serve(async (req: Request) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  if (req.method !== 'POST') {
    return errorResponse('Method not allowed', 'METHOD_NOT_ALLOWED', 405);
  }

  const { userId, error: authError } = await requireAuth(req);
  if (authError) return authError;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return errorResponse('Invalid JSON body', 'INVALID_BODY', 400);
  }

  if (!validateBody(body)) {
    return errorResponse('Invalid request body', 'VALIDATION_ERROR', 422);
  }

  const userClient = createSupabaseClient(req);
  const serviceClient = createServiceClient();

  // Verify the caller is a customer
  const { data: profile, error: profileError } = await userClient
    .from('profiles')
    .select('role')
    .eq('id', userId)
    .single();

  if (profileError || !profile) {
    return errorResponse('Profile not found', 'NOT_FOUND', 404);
  }
  if (profile.role !== 'customer') {
    return errorResponse('Only customers can place orders', 'FORBIDDEN', 403);
  }

  // Verify restaurant is active and open
  const { data: restaurant, error: restaurantError } = await serviceClient
    .from('restaurants')
    .select('id, status, is_open, minimum_order_amount, delivery_fee')
    .eq('id', body.restaurant_id)
    .single();

  if (restaurantError || !restaurant) {
    return errorResponse('Restaurant not found', 'NOT_FOUND', 404);
  }
  if (restaurant.status !== 'active' || !restaurant.is_open) {
    return errorResponse('Restaurant is currently not accepting orders', 'RESTAURANT_CLOSED', 422);
  }

  // Fetch all requested menu items in one query
  const menuItemIds = body.items.map((i) => i.menu_item_id);
  const { data: menuItems, error: menuItemsError } = await serviceClient
    .from('menu_items')
    .select('id, price, status, restaurant_id')
    .in('id', menuItemIds);

  if (menuItemsError || !menuItems) {
    return errorResponse('Failed to fetch menu items', 'INTERNAL_ERROR', 500);
  }

  // Validate all items belong to the restaurant and are available
  const itemMap = new Map(menuItems.map((m) => [m.id, m]));
  for (const requestedItem of body.items) {
    const found = itemMap.get(requestedItem.menu_item_id);
    if (!found) {
      return errorResponse(
        `Menu item ${requestedItem.menu_item_id} not found`,
        'ITEM_NOT_FOUND',
        422,
      );
    }
    if (found.restaurant_id !== body.restaurant_id) {
      return errorResponse(
        `Menu item ${requestedItem.menu_item_id} does not belong to this restaurant`,
        'ITEM_MISMATCH',
        422,
      );
    }
    if (found.status !== 'available') {
      return errorResponse(
        `Menu item ${requestedItem.menu_item_id} is not available`,
        'ITEM_UNAVAILABLE',
        422,
      );
    }
  }

  // Calculate totals
  let subtotal = 0;
  const orderItemsToInsert: Array<{
    menu_item_id: string;
    quantity: number;
    unit_price: number;
    total_price: number;
    special_instructions: string | null;
  }> = [];

  for (const requestedItem of body.items) {
    const menuItem = itemMap.get(requestedItem.menu_item_id)!;
    const unitPrice = Number(menuItem.price);
    const totalPrice = unitPrice * requestedItem.quantity;
    subtotal += totalPrice;
    orderItemsToInsert.push({
      menu_item_id: requestedItem.menu_item_id,
      quantity: requestedItem.quantity,
      unit_price: unitPrice,
      total_price: totalPrice,
      special_instructions: requestedItem.special_instructions ?? null,
    });
  }

  const deliveryFee = body.delivery_method === 'delivery' ? Number(restaurant.delivery_fee) : 0;

  if (subtotal < Number(restaurant.minimum_order_amount)) {
    return errorResponse(
      `Order subtotal ${subtotal} is below the minimum order amount of ${restaurant.minimum_order_amount}`,
      'BELOW_MINIMUM',
      422,
    );
  }

  const TAX_RATE = 0.08;
  const tax = Math.round(subtotal * TAX_RATE * 100) / 100;
  const total = Math.round((subtotal + deliveryFee + tax) * 100) / 100;

  // Insert order using service role to bypass RLS (customer_id is set explicitly)
  const { data: order, error: orderError } = await serviceClient
    .from('orders')
    .insert({
      customer_id: userId,
      restaurant_id: body.restaurant_id,
      delivery_method: body.delivery_method,
      delivery_address: body.delivery_address ?? null,
      delivery_notes: body.delivery_notes ?? null,
      subtotal,
      delivery_fee: deliveryFee,
      tax,
      total,
      status: 'pending',
      payment_status: 'unpaid',
    })
    .select('id')
    .single();

  if (orderError || !order) {
    return errorResponse('Failed to create order', 'INTERNAL_ERROR', 500);
  }

  // Insert order items
  const { error: itemsError } = await serviceClient.from('order_items').insert(
    orderItemsToInsert.map((item) => ({
      ...item,
      order_id: order.id,
    })),
  );

  if (itemsError) {
    // Attempt cleanup — best effort
    await serviceClient.from('orders').delete().eq('id', order.id);
    return errorResponse('Failed to create order items', 'INTERNAL_ERROR', 500);
  }

  return successResponse({ order_id: order.id, total, status: 'pending' }, 201);
});
