-- Delivery charge recorded per order for accounting (separate from product total).

alter table public.orders
  add column if not exists delivery_charge numeric(12, 2)
    check (delivery_charge is null or delivery_charge >= 0);

comment on column public.orders.delivery_charge is
  'Delivery fee charged for this order (PKR), recorded by admin for accounting.';
