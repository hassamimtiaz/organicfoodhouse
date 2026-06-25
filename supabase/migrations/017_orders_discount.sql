-- Admin-recorded discount per order (reduces amount due for accounting).

alter table public.orders
  add column if not exists discount numeric(12, 2)
    check (discount is null or discount >= 0);

comment on column public.orders.discount is
  'Discount given on this order (PKR), subtracted from product total + delivery when calculating balance due.';
