-- Coming soon + scheduled delivery start (pre-order before dispatch)

alter table products
  add column if not exists coming_soon boolean not null default false;

alter table products
  add column if not exists delivery_starts_at date;

comment on column products.coming_soon is 'Show coming soon; customers can still pre-order if in_stock';
comment on column products.delivery_starts_at is 'First delivery date shown on countdown (e.g. 2026-07-05)';
