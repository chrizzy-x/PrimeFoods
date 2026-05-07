-- Migration: 0001_initial_schema
-- Description: Core schema for Prime Foods platform
-- Creates: profiles, restaurants, menu_categories, menu_items,
--          orders, order_items, deliveries, reviews

-- Enable required extensions
create extension if not exists "uuid-ossp";

-- ─── Custom Types ─────────────────────────────────────────────────────────────

create type user_role as enum (
  'customer',
  'kitchen_staff',
  'kitchen_owner',
  'admin'
);

create type order_status as enum (
  'pending',
  'confirmed',
  'preparing',
  'ready_for_pickup',
  'out_for_delivery',
  'delivered',
  'cancelled'
);

create type delivery_method as enum (
  'delivery',
  'pickup'
);

create type payment_status as enum (
  'unpaid',
  'paid',
  'refunded'
);

create type menu_item_status as enum (
  'available',
  'unavailable',
  'seasonal'
);

create type restaurant_status as enum (
  'active',
  'inactive',
  'suspended'
);

create type delivery_status as enum (
  'assigned',
  'picked_up',
  'in_transit',
  'delivered',
  'failed'
);

-- ─── Profiles ─────────────────────────────────────────────────────────────────
-- Extends Supabase auth.users with application-level profile data.

create table public.profiles (
  id           uuid primary key references auth.users(id) on delete cascade,
  email        text not null unique,
  full_name    text not null,
  avatar_url   text,
  phone        text,
  role         user_role not null default 'customer',
  push_token   text,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

comment on table public.profiles is 'Application-level user profiles extending auth.users.';

-- ─── Restaurants ──────────────────────────────────────────────────────────────

create table public.restaurants (
  id                           uuid primary key default uuid_generate_v4(),
  owner_id                     uuid not null references public.profiles(id) on delete restrict,
  name                         text not null,
  description                  text,
  logo_url                     text,
  cover_image_url              text,
  address                      text not null,
  city                         text not null,
  latitude                     numeric(10, 7),
  longitude                    numeric(10, 7),
  phone                        text not null,
  email                        text,
  cuisine_type                 text[] not null default '{}',
  status                       restaurant_status not null default 'active',
  average_rating               numeric(3, 2) not null default 0,
  total_reviews                integer not null default 0,
  estimated_delivery_minutes   integer not null default 30,
  minimum_order_amount         numeric(10, 2) not null default 0,
  delivery_fee                 numeric(10, 2) not null default 0,
  is_open                      boolean not null default false,
  opening_hours                jsonb not null default '{}',
  created_at                   timestamptz not null default now(),
  updated_at                   timestamptz not null default now(),

  constraint restaurants_rating_range check (average_rating between 0 and 5),
  constraint restaurants_delivery_mins_positive check (estimated_delivery_minutes > 0),
  constraint restaurants_min_order_non_negative check (minimum_order_amount >= 0),
  constraint restaurants_delivery_fee_non_negative check (delivery_fee >= 0)
);

comment on table public.restaurants is 'Kitchen/restaurant entities managed by Prime Kitchen.';

create index restaurants_owner_id_idx on public.restaurants(owner_id);
create index restaurants_city_idx on public.restaurants(city);
create index restaurants_status_idx on public.restaurants(status);

-- ─── Menu Categories ──────────────────────────────────────────────────────────

create table public.menu_categories (
  id             uuid primary key default uuid_generate_v4(),
  restaurant_id  uuid not null references public.restaurants(id) on delete cascade,
  name           text not null,
  description    text,
  sort_order     integer not null default 0,
  is_visible     boolean not null default true,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

comment on table public.menu_categories is 'Groupings for menu items within a restaurant.';

create index menu_categories_restaurant_id_idx on public.menu_categories(restaurant_id);

-- ─── Menu Items ───────────────────────────────────────────────────────────────

create table public.menu_items (
  id                        uuid primary key default uuid_generate_v4(),
  restaurant_id             uuid not null references public.restaurants(id) on delete cascade,
  category_id               uuid references public.menu_categories(id) on delete set null,
  name                      text not null,
  description               text,
  price                     numeric(10, 2) not null,
  image_url                 text,
  allergens                 text[] not null default '{}',
  dietary_tags              text[] not null default '{}',
  status                    menu_item_status not null default 'available',
  preparation_time_minutes  integer not null default 15,
  sort_order                integer not null default 0,
  created_at                timestamptz not null default now(),
  updated_at                timestamptz not null default now(),

  constraint menu_items_price_positive check (price >= 0),
  constraint menu_items_prep_time_positive check (preparation_time_minutes > 0)
);

comment on table public.menu_items is 'Individual items available for order on a restaurant menu.';

create index menu_items_restaurant_id_idx on public.menu_items(restaurant_id);
create index menu_items_category_id_idx on public.menu_items(category_id);
create index menu_items_status_idx on public.menu_items(status);

-- ─── Orders ───────────────────────────────────────────────────────────────────

create table public.orders (
  id                      uuid primary key default uuid_generate_v4(),
  customer_id             uuid not null references public.profiles(id) on delete restrict,
  restaurant_id           uuid not null references public.restaurants(id) on delete restrict,
  status                  order_status not null default 'pending',
  delivery_method         delivery_method not null,
  payment_status          payment_status not null default 'unpaid',
  delivery_address        text,
  delivery_notes          text,
  subtotal                numeric(10, 2) not null,
  delivery_fee            numeric(10, 2) not null default 0,
  tax                     numeric(10, 2) not null default 0,
  total                   numeric(10, 2) not null,
  estimated_delivery_at   timestamptz,
  confirmed_at            timestamptz,
  prepared_at             timestamptz,
  delivered_at            timestamptz,
  cancelled_at            timestamptz,
  cancellation_reason     text,
  created_at              timestamptz not null default now(),
  updated_at              timestamptz not null default now(),

  constraint orders_subtotal_positive check (subtotal >= 0),
  constraint orders_total_positive check (total >= 0),
  constraint orders_delivery_address_required
    check (delivery_method = 'pickup' or delivery_address is not null)
);

comment on table public.orders is 'Customer food orders placed via Prime Foods.';

create index orders_customer_id_idx on public.orders(customer_id);
create index orders_restaurant_id_idx on public.orders(restaurant_id);
create index orders_status_idx on public.orders(status);
create index orders_created_at_idx on public.orders(created_at desc);

-- ─── Order Items ──────────────────────────────────────────────────────────────

create table public.order_items (
  id                    uuid primary key default uuid_generate_v4(),
  order_id              uuid not null references public.orders(id) on delete cascade,
  menu_item_id          uuid not null references public.menu_items(id) on delete restrict,
  quantity              integer not null,
  unit_price            numeric(10, 2) not null,
  total_price           numeric(10, 2) not null,
  special_instructions  text,
  created_at            timestamptz not null default now(),

  constraint order_items_quantity_positive check (quantity > 0),
  constraint order_items_unit_price_positive check (unit_price >= 0),
  constraint order_items_total_price_positive check (total_price >= 0)
);

comment on table public.order_items is 'Individual line items belonging to an order.';

create index order_items_order_id_idx on public.order_items(order_id);
create index order_items_menu_item_id_idx on public.order_items(menu_item_id);

-- ─── Deliveries ───────────────────────────────────────────────────────────────

create table public.deliveries (
  id                    uuid primary key default uuid_generate_v4(),
  order_id              uuid not null unique references public.orders(id) on delete cascade,
  driver_id             uuid references public.profiles(id) on delete set null,
  status                delivery_status not null default 'assigned',
  pickup_address        text not null,
  dropoff_address       text not null,
  driver_latitude       numeric(10, 7),
  driver_longitude      numeric(10, 7),
  estimated_arrival_at  timestamptz,
  picked_up_at          timestamptz,
  delivered_at          timestamptz,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

comment on table public.deliveries is 'Delivery tracking records for orders with delivery_method = delivery.';

create index deliveries_order_id_idx on public.deliveries(order_id);
create index deliveries_driver_id_idx on public.deliveries(driver_id);
create index deliveries_status_idx on public.deliveries(status);

-- ─── Reviews ──────────────────────────────────────────────────────────────────

create table public.reviews (
  id             uuid primary key default uuid_generate_v4(),
  customer_id    uuid not null references public.profiles(id) on delete cascade,
  restaurant_id  uuid not null references public.restaurants(id) on delete cascade,
  order_id       uuid not null unique references public.orders(id) on delete cascade,
  rating         integer not null,
  comment        text,
  is_visible     boolean not null default true,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),

  constraint reviews_rating_range check (rating between 1 and 5)
);

comment on table public.reviews is 'Customer reviews for restaurant orders.';

create index reviews_restaurant_id_idx on public.reviews(restaurant_id);
create index reviews_customer_id_idx on public.reviews(customer_id);

-- ─── Updated-at Trigger ───────────────────────────────────────────────────────

create or replace function public.handle_updated_at()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_updated_at
  before update on public.profiles
  for each row execute function public.handle_updated_at();

create trigger restaurants_updated_at
  before update on public.restaurants
  for each row execute function public.handle_updated_at();

create trigger menu_categories_updated_at
  before update on public.menu_categories
  for each row execute function public.handle_updated_at();

create trigger menu_items_updated_at
  before update on public.menu_items
  for each row execute function public.handle_updated_at();

create trigger orders_updated_at
  before update on public.orders
  for each row execute function public.handle_updated_at();

create trigger deliveries_updated_at
  before update on public.deliveries
  for each row execute function public.handle_updated_at();

create trigger reviews_updated_at
  before update on public.reviews
  for each row execute function public.handle_updated_at();

-- ─── Auto-create Profile on Sign-up ──────────────────────────────────────────

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    coalesce((new.raw_user_meta_data->>'role')::user_role, 'customer')
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ─── Auto-update Restaurant Rating on Review ──────────────────────────────────

create or replace function public.update_restaurant_rating()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.restaurants
  set
    average_rating = (
      select round(avg(rating)::numeric, 2)
      from public.reviews
      where restaurant_id = coalesce(new.restaurant_id, old.restaurant_id)
        and is_visible = true
    ),
    total_reviews = (
      select count(*)
      from public.reviews
      where restaurant_id = coalesce(new.restaurant_id, old.restaurant_id)
        and is_visible = true
    )
  where id = coalesce(new.restaurant_id, old.restaurant_id);
  return coalesce(new, old);
end;
$$;

create trigger reviews_update_restaurant_rating
  after insert or update or delete on public.reviews
  for each row execute function public.update_restaurant_rating();
