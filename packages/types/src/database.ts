// Database entity types aligned with Supabase schema

export type UUID = string;
export type ISODateString = string;

// ─── Enums ────────────────────────────────────────────────────────────────────

export type UserRole = 'customer' | 'kitchen_staff' | 'kitchen_owner' | 'admin';
export type OrderStatus =
  | 'pending'
  | 'confirmed'
  | 'preparing'
  | 'ready_for_pickup'
  | 'out_for_delivery'
  | 'delivered'
  | 'cancelled';
export type DeliveryMethod = 'delivery' | 'pickup';
export type PaymentStatus = 'unpaid' | 'paid' | 'refunded';
export type MenuItemStatus = 'available' | 'unavailable' | 'seasonal';
export type RestaurantStatus = 'active' | 'inactive' | 'suspended';
export type DeliveryStatus =
  | 'assigned'
  | 'picked_up'
  | 'in_transit'
  | 'delivered'
  | 'failed';

// ─── Database Row Types ───────────────────────────────────────────────────────

export interface Profile {
  id: UUID;
  email: string;
  full_name: string;
  avatar_url: string | null;
  phone: string | null;
  role: UserRole;
  push_token: string | null;
  created_at: ISODateString;
  updated_at: ISODateString;
}

export interface Restaurant {
  id: UUID;
  owner_id: UUID;
  name: string;
  description: string | null;
  logo_url: string | null;
  cover_image_url: string | null;
  address: string;
  city: string;
  latitude: number | null;
  longitude: number | null;
  phone: string;
  email: string | null;
  cuisine_type: string[];
  status: RestaurantStatus;
  average_rating: number;
  total_reviews: number;
  estimated_delivery_minutes: number;
  minimum_order_amount: number;
  delivery_fee: number;
  is_open: boolean;
  opening_hours: Record<string, { open: string; close: string }>;
  created_at: ISODateString;
  updated_at: ISODateString;
}

export interface MenuCategory {
  id: UUID;
  restaurant_id: UUID;
  name: string;
  description: string | null;
  sort_order: number;
  is_visible: boolean;
  created_at: ISODateString;
  updated_at: ISODateString;
}

export interface MenuItem {
  id: UUID;
  restaurant_id: UUID;
  category_id: UUID | null;
  name: string;
  description: string | null;
  price: number;
  image_url: string | null;
  allergens: string[];
  dietary_tags: string[];
  status: MenuItemStatus;
  preparation_time_minutes: number;
  sort_order: number;
  created_at: ISODateString;
  updated_at: ISODateString;
}

export interface Order {
  id: UUID;
  customer_id: UUID;
  restaurant_id: UUID;
  status: OrderStatus;
  delivery_method: DeliveryMethod;
  payment_status: PaymentStatus;
  delivery_address: string | null;
  delivery_notes: string | null;
  subtotal: number;
  delivery_fee: number;
  tax: number;
  total: number;
  estimated_delivery_at: ISODateString | null;
  confirmed_at: ISODateString | null;
  prepared_at: ISODateString | null;
  delivered_at: ISODateString | null;
  cancelled_at: ISODateString | null;
  cancellation_reason: string | null;
  created_at: ISODateString;
  updated_at: ISODateString;
}

export interface OrderItem {
  id: UUID;
  order_id: UUID;
  menu_item_id: UUID;
  quantity: number;
  unit_price: number;
  total_price: number;
  special_instructions: string | null;
  created_at: ISODateString;
}

export interface Delivery {
  id: UUID;
  order_id: UUID;
  driver_id: UUID | null;
  status: DeliveryStatus;
  pickup_address: string;
  dropoff_address: string;
  driver_latitude: number | null;
  driver_longitude: number | null;
  estimated_arrival_at: ISODateString | null;
  picked_up_at: ISODateString | null;
  delivered_at: ISODateString | null;
  created_at: ISODateString;
  updated_at: ISODateString;
}

export interface Review {
  id: UUID;
  customer_id: UUID;
  restaurant_id: UUID;
  order_id: UUID;
  rating: number;
  comment: string | null;
  is_visible: boolean;
  created_at: ISODateString;
  updated_at: ISODateString;
}

// ─── Joined / View Types ──────────────────────────────────────────────────────

export interface OrderWithItems extends Order {
  items: OrderItem[];
  restaurant: Pick<Restaurant, 'id' | 'name' | 'logo_url'>;
}

export interface MenuItemWithCategory extends MenuItem {
  category: Pick<MenuCategory, 'id' | 'name'> | null;
}

export interface RestaurantWithMenu extends Restaurant {
  categories: Array<MenuCategory & { items: MenuItem[] }>;
}

// ─── API Payload Types ────────────────────────────────────────────────────────

export interface CreateOrderPayload {
  restaurant_id: UUID;
  delivery_method: DeliveryMethod;
  delivery_address?: string;
  delivery_notes?: string;
  items: Array<{
    menu_item_id: UUID;
    quantity: number;
    special_instructions?: string;
  }>;
}

export interface UpdateOrderStatusPayload {
  order_id: UUID;
  status: OrderStatus;
  cancellation_reason?: string;
}

export interface UpdateRestaurantPayload {
  name?: string;
  description?: string;
  phone?: string;
  address?: string;
  city?: string;
  estimated_delivery_minutes?: number;
  minimum_order_amount?: number;
  delivery_fee?: number;
  is_open?: boolean;
  opening_hours?: Record<string, { open: string; close: string }>;
}

// ─── API Response Envelope ────────────────────────────────────────────────────

export interface ApiSuccess<T> {
  data: T;
  error: null;
}

export interface ApiError {
  data: null;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}

export type ApiResponse<T> = ApiSuccess<T> | ApiError;

// ─── Realtime Event Types ─────────────────────────────────────────────────────

export interface OrderStatusEvent {
  order_id: UUID;
  status: OrderStatus;
  updated_at: ISODateString;
}

export interface DriverLocationEvent {
  delivery_id: UUID;
  latitude: number;
  longitude: number;
  updated_at: ISODateString;
}
