// Edge Function: get-restaurant-menu
// GET /functions/v1/get-restaurant-menu?restaurant_id=<uuid>
// Returns the full menu (categories + available items) for a restaurant.
// Public endpoint — no auth required; returns only visible categories and available items.

import {
  corsHeaders,
  createServiceClient,
  errorResponse,
  handleCors,
  successResponse,
} from '../_shared/utils.ts';

function isValidUUID(value: string | null): value is string {
  if (!value) return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
}

Deno.serve(async (req: Request) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  if (req.method !== 'GET') {
    return errorResponse('Method not allowed', 'METHOD_NOT_ALLOWED', 405);
  }

  const url = new URL(req.url);
  const restaurantId = url.searchParams.get('restaurant_id');

  if (!isValidUUID(restaurantId)) {
    return errorResponse('Valid restaurant_id query parameter is required', 'VALIDATION_ERROR', 422);
  }

  const serviceClient = createServiceClient();

  // Fetch restaurant basic info
  const { data: restaurant, error: restaurantError } = await serviceClient
    .from('restaurants')
    .select(
      'id, name, description, logo_url, cover_image_url, address, city, cuisine_type, average_rating, total_reviews, estimated_delivery_minutes, minimum_order_amount, delivery_fee, is_open, opening_hours',
    )
    .eq('id', restaurantId)
    .eq('status', 'active')
    .single();

  if (restaurantError || !restaurant) {
    return errorResponse('Restaurant not found', 'NOT_FOUND', 404);
  }

  // Fetch visible categories
  const { data: categories, error: categoriesError } = await serviceClient
    .from('menu_categories')
    .select('id, name, description, sort_order')
    .eq('restaurant_id', restaurantId)
    .eq('is_visible', true)
    .order('sort_order', { ascending: true });

  if (categoriesError) {
    return errorResponse('Failed to fetch menu categories', 'INTERNAL_ERROR', 500);
  }

  // Fetch available items
  const { data: items, error: itemsError } = await serviceClient
    .from('menu_items')
    .select(
      'id, category_id, name, description, price, image_url, allergens, dietary_tags, preparation_time_minutes, sort_order',
    )
    .eq('restaurant_id', restaurantId)
    .eq('status', 'available')
    .order('sort_order', { ascending: true });

  if (itemsError) {
    return errorResponse('Failed to fetch menu items', 'INTERNAL_ERROR', 500);
  }

  // Group items by category
  const categoryMap = new Map(
    (categories ?? []).map((c) => [c.id, { ...c, items: [] as typeof items }]),
  );

  const uncategorized: typeof items = [];
  for (const item of items ?? []) {
    if (item.category_id && categoryMap.has(item.category_id)) {
      categoryMap.get(item.category_id)!.items.push(item);
    } else {
      uncategorized.push(item);
    }
  }

  const menu = {
    restaurant,
    categories: Array.from(categoryMap.values()),
    uncategorized_items: uncategorized,
  };

  return successResponse(menu);
});
