-- Optional percentage discount per product

alter table products
  add column if not exists discount_percent numeric(5, 2)
    check (discount_percent is null or (discount_percent > 0 and discount_percent <= 100));

comment on column products.discount_percent is 'Optional sale discount (1–100). Null = no discount.';
