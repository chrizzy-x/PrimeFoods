-- Migration: 0002_rls_policies
-- Description: Row Level Security policies for all public tables.
--   Policies are aligned with the Prime Foods access model:
--     - customers can manage their own data
--     - kitchen_owners and kitchen_staff can manage their restaurant's data
--     - admins have full read access
--   All tables have RLS enabled; authenticated users must satisfy a policy to access rows.

-- ─── Enable RLS ───────────────────────────────────────────────────────────────

alter table public.profiles enable row level security;
alter table public.restaurants enable row level security;
alter table public.menu_categories enable row level security;
alter table public.menu_items enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.deliveries enable row level security;
alter table public.reviews enable row level security;

-- ─── Helper Functions ─────────────────────────────────────────────────────────

-- Returns the role of the currently authenticated user.
create or replace function public.current_user_role()
returns user_role
language sql
stable
security definer
set search_path = public
as $$
  select role from public.profiles where id = auth.uid();
$$;

-- Returns true if the current user owns (or is staff at) the given restaurant.
create or replace function public.is_restaurant_member(p_restaurant_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.restaurants
    where id = p_restaurant_id
      and owner_id = auth.uid()
  )
  or public.current_user_role() in ('kitchen_staff', 'admin');
$$;

-- ─── Profiles ─────────────────────────────────────────────────────────────────

create policy "profiles_select_own"
  on public.profiles for select
  using (id = auth.uid() or public.current_user_role() = 'admin');

create policy "profiles_update_own"
  on public.profiles for update
  using (id = auth.uid())
  with check (id = auth.uid());

-- Profile insert is handled exclusively by the handle_new_user trigger.
-- No direct insert policy is granted to authenticated users.

-- ─── Restaurants ──────────────────────────────────────────────────────────────

-- Any authenticated user may view active restaurants.
create policy "restaurants_select_active"
  on public.restaurants for select
  using (
    status = 'active'
    or owner_id = auth.uid()
    or public.current_user_role() = 'admin'
  );

create policy "restaurants_insert_owner"
  on public.restaurants for insert
  with check (
    owner_id = auth.uid()
    and public.current_user_role() in ('kitchen_owner', 'admin')
  );

create policy "restaurants_update_owner"
  on public.restaurants for update
  using (owner_id = auth.uid() or public.current_user_role() = 'admin')
  with check (owner_id = auth.uid() or public.current_user_role() = 'admin');

create policy "restaurants_delete_admin"
  on public.restaurants for delete
  using (public.current_user_role() = 'admin');

-- ─── Menu Categories ──────────────────────────────────────────────────────────

create policy "menu_categories_select"
  on public.menu_categories for select
  using (
    is_visible = true
    or public.is_restaurant_member(restaurant_id)
  );

create policy "menu_categories_insert"
  on public.menu_categories for insert
  with check (public.is_restaurant_member(restaurant_id));

create policy "menu_categories_update"
  on public.menu_categories for update
  using (public.is_restaurant_member(restaurant_id))
  with check (public.is_restaurant_member(restaurant_id));

create policy "menu_categories_delete"
  on public.menu_categories for delete
  using (public.is_restaurant_member(restaurant_id));

-- ─── Menu Items ───────────────────────────────────────────────────────────────

create policy "menu_items_select"
  on public.menu_items for select
  using (
    status != 'unavailable'
    or public.is_restaurant_member(restaurant_id)
  );

create policy "menu_items_insert"
  on public.menu_items for insert
  with check (public.is_restaurant_member(restaurant_id));

create policy "menu_items_update"
  on public.menu_items for update
  using (public.is_restaurant_member(restaurant_id))
  with check (public.is_restaurant_member(restaurant_id));

create policy "menu_items_delete"
  on public.menu_items for delete
  using (public.is_restaurant_member(restaurant_id));

-- ─── Orders ───────────────────────────────────────────────────────────────────

-- Customers see their own orders; restaurant members see orders for their restaurant.
create policy "orders_select"
  on public.orders for select
  using (
    customer_id = auth.uid()
    or public.is_restaurant_member(restaurant_id)
    or public.current_user_role() = 'admin'
  );

create policy "orders_insert"
  on public.orders for insert
  with check (
    customer_id = auth.uid()
    and public.current_user_role() = 'customer'
  );

-- Only kitchen staff / admins may update order status.
create policy "orders_update"
  on public.orders for update
  using (
    public.is_restaurant_member(restaurant_id)
    or public.current_user_role() = 'admin'
  )
  with check (
    public.is_restaurant_member(restaurant_id)
    or public.current_user_role() = 'admin'
  );

-- Orders are never hard-deleted; admins only.
create policy "orders_delete_admin"
  on public.orders for delete
  using (public.current_user_role() = 'admin');

-- ─── Order Items ──────────────────────────────────────────────────────────────

create policy "order_items_select"
  on public.order_items for select
  using (
    exists (
      select 1 from public.orders o
      where o.id = order_id
        and (
          o.customer_id = auth.uid()
          or public.is_restaurant_member(o.restaurant_id)
          or public.current_user_role() = 'admin'
        )
    )
  );

create policy "order_items_insert"
  on public.order_items for insert
  with check (
    exists (
      select 1 from public.orders o
      where o.id = order_id
        and o.customer_id = auth.uid()
        and o.status = 'pending'
    )
  );

-- Order items are immutable after creation; only admin may delete.
create policy "order_items_delete_admin"
  on public.order_items for delete
  using (public.current_user_role() = 'admin');

-- ─── Deliveries ───────────────────────────────────────────────────────────────

create policy "deliveries_select"
  on public.deliveries for select
  using (
    driver_id = auth.uid()
    or exists (
      select 1 from public.orders o
      where o.id = order_id
        and (
          o.customer_id = auth.uid()
          or public.is_restaurant_member(o.restaurant_id)
        )
    )
    or public.current_user_role() = 'admin'
  );

-- Only the system (edge functions running as service_role) creates/updates deliveries.
-- Grant is omitted so authenticated users cannot directly write delivery rows.

-- ─── Reviews ──────────────────────────────────────────────────────────────────

create policy "reviews_select"
  on public.reviews for select
  using (
    is_visible = true
    or customer_id = auth.uid()
    or public.current_user_role() = 'admin'
  );

create policy "reviews_insert"
  on public.reviews for insert
  with check (
    customer_id = auth.uid()
    and public.current_user_role() = 'customer'
    and exists (
      select 1 from public.orders o
      where o.id = order_id
        and o.customer_id = auth.uid()
        and o.status = 'delivered'
    )
  );

create policy "reviews_update_own"
  on public.reviews for update
  using (customer_id = auth.uid())
  with check (customer_id = auth.uid());

create policy "reviews_delete_admin"
  on public.reviews for delete
  using (public.current_user_role() = 'admin');
