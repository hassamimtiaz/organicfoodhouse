-- =============================================================================
-- Migration 014 — product packaging options (e.g. 5 kg gift box @ 2500 PKR)
-- =============================================================================

create table if not exists public.product_packagings (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  label text not null default '',
  weight numeric(10, 2) not null check (weight > 0),
  unit text not null default 'kg',
  price numeric(10, 2) not null check (price >= 0),
  sort_order int not null default 0,
  in_stock boolean not null default true,
  created_at timestamptz not null default now()
);

create index if not exists product_packagings_product_id_idx
  on public.product_packagings (product_id, sort_order);

comment on table public.product_packagings is
  'Sellable packaging options per product (weight + label + fixed price per pack).';
comment on column public.product_packagings.label is
  'Packaging name, e.g. Premium gift box, Gift box.';
comment on column public.product_packagings.weight is
  'Pack weight/size, e.g. 5, 8, 10.';
comment on column public.product_packagings.unit is
  'Measure for weight, usually kg.';

alter table public.product_packagings enable row level security;

drop policy if exists "Public read product_packagings" on public.product_packagings;
create policy "Public read product_packagings"
  on public.product_packagings for select
  using (true);

drop policy if exists "Admin insert product_packagings" on public.product_packagings;
create policy "Admin insert product_packagings"
  on public.product_packagings for insert
  with check (public.is_admin());

drop policy if exists "Admin update product_packagings" on public.product_packagings;
create policy "Admin update product_packagings"
  on public.product_packagings for update
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "Admin delete product_packagings" on public.product_packagings;
create policy "Admin delete product_packagings"
  on public.product_packagings for delete
  using (public.is_admin());
