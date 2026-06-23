-- =============================================================================
-- Migration 015 — multiple images per product
-- =============================================================================

create table if not exists public.product_images (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  image_url text not null,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists product_images_product_id_idx
  on public.product_images (product_id, sort_order);

comment on table public.product_images is
  'Gallery images for a product. First image is the catalog cover (synced to products.image_url).';

alter table public.product_images enable row level security;

drop policy if exists "Public read product_images" on public.product_images;
create policy "Public read product_images"
  on public.product_images for select
  using (true);

drop policy if exists "Admin insert product_images" on public.product_images;
create policy "Admin insert product_images"
  on public.product_images for insert
  with check (public.is_admin());

drop policy if exists "Admin update product_images" on public.product_images;
create policy "Admin update product_images"
  on public.product_images for update
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "Admin delete product_images" on public.product_images;
create policy "Admin delete product_images"
  on public.product_images for delete
  using (public.is_admin());
