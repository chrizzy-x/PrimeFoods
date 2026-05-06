// Edge Function: update-order-status
// PATCH /functions/v1/update-order-status
// Allows kitchen staff/owners to transition order status according to allowed state machine.
// Customers may only cancel their own pending orders.

import {
  corsHeaders,
  createServiceClient,
  createSupabaseClient,
  errorResponse,
  handleCors,
  requireAuth,
  successResponse,
} from '../_shared/utils.ts';

type OrderStatus =
  | 'pending'
  | 'confirmed'
  | 'preparing'
  | 'ready_for_pickup'
  | 'out_for_delivery'
  | 'delivered'
  | 'cancelled';

// Allowed transitions per actor role
const KITCHEN_TRANSITIONS: Record<string, OrderStatus[]> = {
  pending: ['confirmed', 'cancelled'],
  confirmed: ['preparing', 'cancelled'],
  preparing: ['ready_for_pickup'],
  ready_for_pickup: ['out_for_delivery', 'delivered'],
  out_for_delivery: ['delivered'],
};

const CUSTOMER_TRANSITIONS: Record<string, OrderStatus[]> = {
  pending: ['cancelled'],
};

interface UpdateOrderStatusBody {
  order_id: string;
  status: string;
  cancellation_reason?: string;
}

function isValidUUID(value: unknown): value is string {
  if (typeof value !== 'string') return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
}

const VALID_STATUSES: OrderStatus[] = [
  'pending',
  'confirmed',
  'preparing',
  'ready_for_pickup',
  'out_for_delivery',
  'delivered',
  'cancelled',
];

function validateBody(body: unknown): body is UpdateOrderStatusBody {
  if (typeof body !== 'object' || body === null) return false;
  const b = body as Record<string, unknown>;
  if (!isValidUUID(b['order_id'])) return false;
  if (!VALID_STATUSES.includes(b['status'] as OrderStatus)) return false;
  return true;
}

Deno.serve(async (req: Request) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  if (req.method !== 'PATCH') {
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

  const serviceClient = createServiceClient();
  const userClient = createSupabaseClient(req);

  // Fetch caller's profile
  const { data: profile, error: profileError } = await userClient
    .from('profiles')
    .select('role')
    .eq('id', userId)
    .single();

  if (profileError || !profile) {
    return errorResponse('Profile not found', 'NOT_FOUND', 404);
  }

  // Fetch the order with restaurant info
  const { data: order, error: orderError } = await serviceClient
    .from('orders')
    .select('id, status, customer_id, restaurant_id, restaurants(owner_id)')
    .eq('id', body.order_id)
    .single();

  if (orderError || !order) {
    return errorResponse('Order not found', 'NOT_FOUND', 404);
  }

  const currentStatus = order.status as OrderStatus;
  const targetStatus = body.status as OrderStatus;

  const isKitchenMember =
    profile.role === 'admin' ||
    profile.role === 'kitchen_staff' ||
    (profile.role === 'kitchen_owner' &&
      (order.restaurants as { owner_id: string } | null)?.owner_id === userId);

  const isOwner = order.customer_id === userId;

  // Determine allowed transitions based on caller
  let allowedTransitions: OrderStatus[] = [];
  if (isKitchenMember) {
    allowedTransitions = KITCHEN_TRANSITIONS[currentStatus] ?? [];
  } else if (isOwner && profile.role === 'customer') {
    allowedTransitions = CUSTOMER_TRANSITIONS[currentStatus] ?? [];
  } else {
    return errorResponse('Forbidden', 'FORBIDDEN', 403);
  }

  if (!allowedTransitions.includes(targetStatus)) {
    return errorResponse(
      `Cannot transition order from '${currentStatus}' to '${targetStatus}'`,
      'INVALID_TRANSITION',
      422,
    );
  }

  // Build update payload
  const updatePayload: Record<string, unknown> = { status: targetStatus };

  if (targetStatus === 'confirmed') updatePayload['confirmed_at'] = new Date().toISOString();
  if (targetStatus === 'preparing') updatePayload['prepared_at'] = null; // will be set when ready
  if (targetStatus === 'delivered') updatePayload['delivered_at'] = new Date().toISOString();
  if (targetStatus === 'cancelled') {
    updatePayload['cancelled_at'] = new Date().toISOString();
    updatePayload['cancellation_reason'] = body.cancellation_reason ?? null;
  }

  const { data: updated, error: updateError } = await serviceClient
    .from('orders')
    .update(updatePayload)
    .eq('id', body.order_id)
    .select('id, status, updated_at')
    .single();

  if (updateError || !updated) {
    return errorResponse('Failed to update order', 'INTERNAL_ERROR', 500);
  }

  return successResponse({
    order_id: updated.id,
    status: updated.status,
    updated_at: updated.updated_at,
  });
});
