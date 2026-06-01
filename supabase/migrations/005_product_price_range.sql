-- Single price vs price range on products

alter table products
  add column if not exists price_type text not null default 'single'
    check (price_type in ('single', 'range'));

alter table products
  add column if not exists price_max numeric(10, 2)
    check (price_max is null or price_max >= 0);

alter table products drop constraint if exists products_price_range_check;

alter table products add constraint products_price_range_check check (
  (price_type = 'single' and price_max is null)
  or (
    price_type = 'range'
    and price_max is not null
    and price_max >= price
  )
);

comment on column products.price is 'Single price, or minimum when price_type is range';
comment on column products.price_max is 'Maximum price when price_type is range; null for single price';
