-- Migration: 0003_prime_foods_schema
-- Description: Prime Foods simplified schema (replaces complex multi-restaurant schema)
-- Creates: categories, menu_items, orders, order_items; recreates profiles

-- ─── Drop legacy tables (cascade removes dependent triggers, RLS policies, FKs) ──

DROP TABLE IF EXISTS public.reviews CASCADE;
DROP TABLE IF EXISTS public.deliveries CASCADE;
DROP TABLE IF EXISTS public.order_items CASCADE;
DROP TABLE IF EXISTS public.orders CASCADE;
DROP TABLE IF EXISTS public.menu_items CASCADE;
DROP TABLE IF EXISTS public.menu_categories CASCADE;
DROP TABLE IF EXISTS public.restaurants CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;

-- ─── Drop legacy enums ────────────────────────────────────────────────────────

DROP TYPE IF EXISTS public.delivery_status CASCADE;
DROP TYPE IF EXISTS public.restaurant_status CASCADE;
DROP TYPE IF EXISTS public.menu_item_status CASCADE;
DROP TYPE IF EXISTS public.payment_status CASCADE;
DROP TYPE IF EXISTS public.delivery_method CASCADE;
DROP TYPE IF EXISTS public.order_status CASCADE;
DROP TYPE IF EXISTS public.user_role CASCADE;

-- ─── Drop legacy functions ────────────────────────────────────────────────────

DROP FUNCTION IF EXISTS public.update_restaurant_rating() CASCADE;
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS public.handle_updated_at() CASCADE;
DROP FUNCTION IF EXISTS public.current_user_role() CASCADE;

-- ─── New enum ─────────────────────────────────────────────────────────────────

CREATE TYPE public.order_status AS ENUM (
  'pending',
  'accepted',
  'preparing',
  'ready',
  'collected',
  'cancelled'
);

-- ─── Profiles ─────────────────────────────────────────────────────────────────

CREATE TABLE public.profiles (
  id          uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name   text NOT NULL DEFAULT '',
  phone       text NOT NULL DEFAULT '',
  avatar_url  text,
  role        text NOT NULL DEFAULT 'customer'
                   CHECK (role IN ('customer', 'staff', 'admin')),
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- ─── Categories ───────────────────────────────────────────────────────────────

CREATE TABLE public.categories (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name        text NOT NULL,
  emoji       text NOT NULL DEFAULT '',
  sort_order  integer NOT NULL DEFAULT 0
);

-- ─── Menu Items ───────────────────────────────────────────────────────────────

CREATE TABLE public.menu_items (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name               text NOT NULL,
  description        text NOT NULL DEFAULT '',
  price              numeric(10, 2) NOT NULL CHECK (price >= 0),
  image_url          text,
  category_id        uuid NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE,
  is_available       boolean NOT NULL DEFAULT true,
  prep_time_minutes  integer NOT NULL DEFAULT 15 CHECK (prep_time_minutes > 0),
  calories           integer,
  is_featured        boolean NOT NULL DEFAULT false,
  created_at         timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX menu_items_category_id_idx ON public.menu_items(category_id);
CREATE INDEX menu_items_is_available_idx ON public.menu_items(is_available);
CREATE INDEX menu_items_is_featured_idx ON public.menu_items(is_featured);

-- ─── Orders ───────────────────────────────────────────────────────────────────

CREATE TABLE public.orders (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id  uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status       public.order_status NOT NULL DEFAULT 'pending',
  total        numeric(10, 2) NOT NULL CHECK (total >= 0),
  notes        text,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX orders_customer_id_idx ON public.orders(customer_id);
CREATE INDEX orders_status_idx ON public.orders(status);
CREATE INDEX orders_created_at_idx ON public.orders(created_at DESC);

-- ─── Order Items ──────────────────────────────────────────────────────────────

CREATE TABLE public.order_items (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id      uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  menu_item_id  uuid NOT NULL REFERENCES public.menu_items(id) ON DELETE RESTRICT,
  quantity      integer NOT NULL CHECK (quantity > 0),
  unit_price    numeric(10, 2) NOT NULL CHECK (unit_price >= 0),
  subtotal      numeric(10, 2) NOT NULL CHECK (subtotal >= 0),
  notes         text
);

CREATE INDEX order_items_order_id_idx ON public.order_items(order_id);
CREATE INDEX order_items_menu_item_id_idx ON public.order_items(menu_item_id);

-- ─── updated_at trigger ───────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER orders_updated_at
  BEFORE UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ─── Auto-create profile on signup ───────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'role', 'customer')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ─── Row Level Security ───────────────────────────────────────────────────────

ALTER TABLE public.profiles    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.menu_items  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

-- Helper: get current user's role
CREATE OR REPLACE FUNCTION public.current_user_role()
RETURNS text LANGUAGE sql SECURITY DEFINER STABLE AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$;

-- profiles: users read/write own row; staff+admin read all
CREATE POLICY "profiles: own row read"
  ON public.profiles FOR SELECT
  USING (id = auth.uid() OR public.current_user_role() IN ('staff', 'admin'));

CREATE POLICY "profiles: own row insert"
  ON public.profiles FOR INSERT
  WITH CHECK (id = auth.uid());

CREATE POLICY "profiles: own row update"
  ON public.profiles FOR UPDATE
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- categories: public read, admin write (split per operation)
CREATE POLICY "categories: public read"
  ON public.categories FOR SELECT
  USING (true);

CREATE POLICY "categories: admin insert"
  ON public.categories FOR INSERT
  WITH CHECK (public.current_user_role() = 'admin');

CREATE POLICY "categories: admin update"
  ON public.categories FOR UPDATE
  USING (public.current_user_role() = 'admin');

CREATE POLICY "categories: admin delete"
  ON public.categories FOR DELETE
  USING (public.current_user_role() = 'admin');

-- menu_items: public read, admin write, staff can toggle is_available
CREATE POLICY "menu_items: public read"
  ON public.menu_items FOR SELECT
  USING (true);

CREATE POLICY "menu_items: admin insert"
  ON public.menu_items FOR INSERT
  WITH CHECK (public.current_user_role() = 'admin');

CREATE POLICY "menu_items: staff+admin update"
  ON public.menu_items FOR UPDATE
  USING (public.current_user_role() IN ('staff', 'admin'));

CREATE POLICY "menu_items: admin delete"
  ON public.menu_items FOR DELETE
  USING (public.current_user_role() = 'admin');

-- orders: customers read/insert own; staff+admin read all and update status
CREATE POLICY "orders: customer read own"
  ON public.orders FOR SELECT
  USING (customer_id = auth.uid() OR public.current_user_role() IN ('staff', 'admin'));

CREATE POLICY "orders: customer insert own"
  ON public.orders FOR INSERT
  WITH CHECK (customer_id = auth.uid());

CREATE POLICY "orders: staff+admin update status"
  ON public.orders FOR UPDATE
  USING (public.current_user_role() IN ('staff', 'admin') OR customer_id = auth.uid());

-- order_items: read if related order is accessible
CREATE POLICY "order_items: read via order"
  ON public.order_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.orders
      WHERE orders.id = order_items.order_id
        AND (orders.customer_id = auth.uid() OR public.current_user_role() IN ('staff', 'admin'))
    )
  );

CREATE POLICY "order_items: customer insert"
  ON public.order_items FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.orders
      WHERE orders.id = order_items.order_id
        AND orders.customer_id = auth.uid()
    )
  );
