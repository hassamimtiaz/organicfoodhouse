-- Product URL slugs (e.g. /product/premium-chaunsa-mango)

alter table public.products
  add column if not exists slug text;

update public.products
set slug = trim(both '-' from regexp_replace(lower(name), '[^a-z0-9]+', '-', 'g'))
where slug is null or slug = '';

create unique index if not exists products_slug_unique_idx
  on public.products (slug)
  where slug is not null and slug <> '';

comment on column public.products.slug is 'URL slug for /product/{slug} — unique, derived from name';
