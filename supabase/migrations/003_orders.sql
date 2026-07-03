-- =============================================================================
-- Migration 003 — website orders
-- =============================================================================

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  customer_name text not null,
  phone text not null,
  email text,
  address_line text not null,
  city text not null,
  notes text,
  status text not null default 'pending'
    check (status in ('pending', 'confirmed', 'ready_for_dispatch', 'completed', 'cancelled')),
  total numeric(12, 2) not null check (total >= 0),
  created_at timestamptz not null default now()
);

create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id uuid references public.products(id) on delete set null,
  product_name text not null,
  quantity numeric(10, 2) not null check (quantity > 0),
  unit_price numeric(10, 2) not null check (unit_price >= 0),
  unit text not null,
  line_total numeric(12, 2) not null check (line_total >= 0)
);

create index if not exists orders_created_at_idx on public.orders (created_at desc);
create index if not exists orders_status_idx on public.orders (status);
create index if not exists order_items_order_id_idx on public.order_items (order_id);

alter table public.orders enable row level security;
alter table public.order_items enable row level security;

drop policy if exists "Public insert orders" on public.orders;
create policy "Public insert orders"
  on public.orders for insert
  with check (true);

drop policy if exists "Admin read orders" on public.orders;
create policy "Admin read orders"
  on public.orders for select
  using (public.is_admin());

drop policy if exists "Admin update orders" on public.orders;
create policy "Admin update orders"
  on public.orders for update
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "Public insert order_items" on public.order_items;
create policy "Public insert order_items"
  on public.order_items for insert
  with check (true);

drop policy if exists "Admin read order_items" on public.order_items;
create policy "Admin read order_items"
  on public.order_items for select
  using (public.is_admin());
