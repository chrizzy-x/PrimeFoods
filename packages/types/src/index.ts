// ─── Prime Foods Web Types (spec) ────────────────────────────────────────────

export type Profile = {
  id: string;
  full_name: string;
  phone: string;
  avatar_url?: string;
  role: 'customer' | 'staff' | 'admin';
  created_at: string;
};

export type Category = {
  id: string;
  name: string;
  emoji: string;
  sort_order: number;
};

export type MenuItem = {
  id: string;
  name: string;
  description: string;
  price: number;
  image_url?: string;
  category_id: string;
  category?: Category;
  is_available: boolean;
  prep_time_minutes: number;
  calories?: number;
  is_featured: boolean;
};

export type OrderStatus =
  | 'pending'
  | 'accepted'
  | 'preparing'
  | 'ready'
  | 'collected'
  | 'cancelled';

export type OrderItem = {
  id: string;
  order_id: string;
  menu_item_id: string;
  menu_item?: MenuItem;
  quantity: number;
  unit_price: number;
  subtotal: number;
  notes?: string;
};

export type Order = {
  id: string;
  customer_id: string;
  customer?: Profile;
  items: OrderItem[];
  status: OrderStatus;
  total: number;
  notes?: string;
  created_at: string;
  updated_at: string;
};

// ─── Legacy types (used by prime-foods-mobile) ────────────────────────────────

export type {
  UUID,
  ISODateString,
  UserRole,
  DeliveryMethod,
  PaymentStatus,
  MenuItemStatus,
  RestaurantStatus,
  DeliveryStatus,
  Restaurant,
  MenuCategory,
  Delivery,
  Review,
  OrderWithItems,
  MenuItemWithCategory,
  RestaurantWithMenu,
  CreateOrderPayload,
  UpdateOrderStatusPayload,
  UpdateRestaurantPayload,
  ApiSuccess,
  ApiError,
  ApiResponse,
  OrderStatusEvent,
  DriverLocationEvent,
} from './database.js';
