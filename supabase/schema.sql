-- =============================================================================
-- Organic Foods — baseline schema (run once on a new Supabase project)
-- =============================================================================
--
-- Where: Supabase Dashboard → SQL → New query → paste & run this entire file
--
-- Creates:
--   • categories  — major categories (parent_id IS NULL) and subcategories
--   • products    — items linked to a subcategory via category_id
--   • admin_users + RLS (public read, admin-only writes)
--   • Seed data: Fruits → Mangoes → 4 varieties
--
-- After this file, apply changes only via numbered files in supabase/migrations/
-- (e.g. 002_add_cart.sql). Do not edit schema.sql for incremental changes.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Tables
-- -----------------------------------------------------------------------------

create table if not exists categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null,
  description text,
  parent_id uuid references categories(id) on delete cascade,
  image_url text,
  is_visible boolean not null default true,
  created_at timestamptz not null default now()
);

comment on table categories is 'Major categories have parent_id NULL; subcategories reference their parent.';
comment on column categories.parent_id is 'NULL = major category (e.g. Fruits). Set = subcategory (e.g. Mangoes under Fruits).';
comment on column categories.image_url is 'Optional hero/card image for category or subcategory';
comment on column categories.is_visible is 'When false, hidden from the public store';

create table if not exists products (
  id uuid primary key default gen_random_uuid(),
  category_id uuid not null references categories(id) on delete cascade,
  slug text,
  name text not null,
  description text,
  price numeric(10, 2) not null check (price >= 0),
  price_type text not null default 'single'
    check (price_type in ('single', 'range')),
  price_max numeric(10, 2)
    check (price_max is null or price_max >= 0),
  unit text not null default 'kg',
  unit_min numeric(10, 2)
    check (unit_min is null or unit_min >= 0),
  unit_max numeric(10, 2)
    check (unit_max is null or unit_max >= 0),
  discount_percent numeric(5, 2)
    check (discount_percent is null or (discount_percent > 0 and discount_percent <= 100)),
  image_url text,
  in_stock boolean not null default true,
  created_at timestamptz not null default now()
);

comment on table products is 'Products belong to a subcategory (leaf category), not a major category.';
comment on column products.category_id is 'FK to categories.id — must be a subcategory row, not a top-level category.';
comment on column products.price is 'Single price, or minimum when price_type is range';
comment on column products.price_max is 'Maximum price when price_type is range; null for single price';

alter table products add constraint products_unit_range_check check (
  (unit_min is null and unit_max is null)
  or (
    unit_min is not null
    and unit_max is not null
    and unit_max >= unit_min
  )
);

comment on column products.unit is 'Measure name (kg, dozen, box, etc.)';
comment on column products.unit_min is 'Minimum size/weight when sold in a range; null for fixed unit';
comment on column products.unit_max is 'Maximum size/weight when sold in a range; null for fixed unit';
comment on column products.discount_percent is 'Optional sale discount (1–100). Null = no discount.';
comment on column products.slug is 'URL slug for /product/{slug}';

create unique index if not exists products_slug_unique_idx
  on products (slug)
  where slug is not null and slug <> '';

alter table products drop constraint if exists products_price_range_check;
alter table products add constraint products_price_range_check check (
  (price_type = 'single' and price_max is null)
  or (
    price_type = 'range'
    and price_max is not null
    and price_max >= price
  )
);

-- -----------------------------------------------------------------------------
-- Indexes
-- -----------------------------------------------------------------------------

create unique index if not exists categories_top_slug_idx
  on categories (slug)
  where parent_id is null;

create unique index if not exists categories_sub_slug_idx
  on categories (slug, parent_id)
  where parent_id is not null;

create index if not exists categories_parent_id_idx
  on categories (parent_id);

create index if not exists products_category_id_idx
  on products (category_id);

-- -----------------------------------------------------------------------------
-- Admin allowlist
-- -----------------------------------------------------------------------------

create table if not exists public.admin_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

comment on table public.admin_users is
  'Users allowed to manage catalog. Add rows after creating users in Supabase Auth.';

alter table public.admin_users enable row level security;

drop policy if exists "Users can read own admin row" on public.admin_users;
create policy "Users can read own admin row"
  on public.admin_users
  for select
  using (auth.uid() = user_id);

create or replace function public.is_admin()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1
    from public.admin_users
    where user_id = auth.uid()
  );
$$;

-- -----------------------------------------------------------------------------
-- Row level security — shoppers read, admins write
-- -----------------------------------------------------------------------------

alter table categories enable row level security;
alter table products enable row level security;

drop policy if exists "Public read categories" on categories;
create policy "Public read categories"
  on categories for select
  using (true);

drop policy if exists "Public insert categories" on categories;
drop policy if exists "Public update categories" on categories;
drop policy if exists "Public delete categories" on categories;
drop policy if exists "Admin insert categories" on categories;
create policy "Admin insert categories"
  on categories for insert
  with check (public.is_admin());

drop policy if exists "Admin update categories" on categories;
create policy "Admin update categories"
  on categories for update
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "Admin delete categories" on categories;
create policy "Admin delete categories"
  on categories for delete
  using (public.is_admin());

drop policy if exists "Public read products" on products;
create policy "Public read products"
  on products for select
  using (true);

drop policy if exists "Public insert products" on products;
drop policy if exists "Public update products" on products;
drop policy if exists "Public delete products" on products;
drop policy if exists "Admin insert products" on products;
create policy "Admin insert products"
  on products for insert
  with check (public.is_admin());

drop policy if exists "Admin update products" on products;
create policy "Admin update products"
  on products for update
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "Admin delete products" on products;
create policy "Admin delete products"
  on products for delete
  using (public.is_admin());

-- -----------------------------------------------------------------------------
-- Orders (website checkout)
-- -----------------------------------------------------------------------------

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  customer_name text not null,
  phone text not null,
  email text,
  address_line text not null,
  city text not null,
  notes text,
  status text not null default 'pending'
    check (status in ('pending', 'confirmed', 'completed', 'cancelled')),
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

-- -----------------------------------------------------------------------------
-- Seed data
-- -----------------------------------------------------------------------------

-- Major category: Fruits
insert into categories (name, slug, description, parent_id)
select
  'Fruits',
  'fruits',
  'Fresh, seasonal organic fruits picked at peak ripeness.',
  null
where not exists (
  select 1 from categories where slug = 'fruits' and parent_id is null
);

-- Subcategory: Mangoes (under Fruits)
insert into categories (name, slug, description, parent_id)
select
  'Mangoes',
  'mangoes',
  'Premium Pakistani mango varieties — sweet, aromatic, and tree-ripened.',
  c.id
from categories c
where c.slug = 'fruits'
  and c.parent_id is null
  and not exists (
    select 1 from categories sub
    where sub.slug = 'mangoes' and sub.parent_id = c.id
  );

-- Products: mango varieties (under Mangoes subcategory)
insert into products (
  category_id, name, description, price, price_type, price_max, unit, image_url, in_stock
)
select
  sub.id,
  v.name,
  v.description,
  v.price,
  v.price_type,
  v.price_max,
  'kg',
  v.image_url,
  true
from categories sub
join categories parent on sub.parent_id = parent.id
cross join (values
  (
    'Dasheri',
    'Sweet, aromatic Dasheri mango with golden-yellow flesh. Perfect for smoothies and desserts.',
    8.99::numeric,
    'single',
    null::numeric,
    'https://images.unsplash.com/photo-1605027990121-cbae9e63ab02?w=800&q=80&auto=format&fit=crop'
  ),
  (
    'Sindhri',
    'Large, honey-sweet Sindhri variety with minimal fiber. A summer favorite across Pakistan.',
    9.49::numeric,
    'range',
    10.99::numeric,
    'https://images.unsplash.com/photo-1553279768-8650adbb2896?w=800&q=80&auto=format&fit=crop'
  ),
  (
    'Chaunsa',
    'Rich, intensely flavorful Chaunsa mango — the king of mangoes. Buttery texture when ripe.',
    10.99::numeric,
    'single',
    null::numeric,
    'https://images.unsplash.com/photo-1619568428299-a69f8c8e64e0?w=800&q=80&auto=format&fit=crop'
  ),
  (
    'Anwar Ratol',
    'Premium small-sized Anwar Ratol with exceptional sweetness and distinctive aroma.',
    11.99::numeric,
    'range',
    13.49::numeric,
    'https://images.unsplash.com/photo-1591284009650-0a12a8e2ed24?w=800&q=80&auto=format&fit=crop'
  )
) as v(name, description, price, price_type, price_max, image_url)
where parent.slug = 'fruits'
  and sub.slug = 'mangoes'
  and not exists (
    select 1 from products p
    where p.category_id = sub.id and p.name = v.name
  );
