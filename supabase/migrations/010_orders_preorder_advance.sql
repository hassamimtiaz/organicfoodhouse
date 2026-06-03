-- Pre-order vs regular order, optional advance payment, admin delete

alter table public.orders
  add column if not exists order_type text not null default 'order'
    check (order_type in ('preorder', 'order'));

alter table public.orders
  add column if not exists advance_payment numeric(12, 2)
    check (advance_payment is null or advance_payment >= 0);

comment on column public.orders.order_type is 'preorder = coming-soon reservation; order = standard purchase';
comment on column public.orders.advance_payment is 'Advance amount recorded by admin after customer pays (PKR)';

drop policy if exists "Admin delete orders" on public.orders;
create policy "Admin delete orders"
  on public.orders for delete
  using (public.is_admin());
