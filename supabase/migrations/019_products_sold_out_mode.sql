-- When in_stock is false: block orders, allow pre-order, or allow restock (advance) orders
alter table products
  add column if not exists sold_out_mode text not null default 'block';

alter table products drop constraint if exists products_sold_out_mode_check;
alter table products add constraint products_sold_out_mode_check check (
  sold_out_mode in ('block', 'preorder', 'restock')
);

comment on column products.sold_out_mode is
  'When in_stock is false: block = no orders; preorder = advance pre-order; restock = restock / notify when back';
