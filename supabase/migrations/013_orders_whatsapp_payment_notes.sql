-- WhatsApp/manual orders, amount received, and admin accounting notes

alter table public.orders
  add column if not exists order_source text not null default 'website'
    check (order_source in ('website', 'whatsapp'));

alter table public.orders
  add column if not exists amount_received numeric(12, 2)
    check (amount_received is null or amount_received >= 0);

alter table public.orders
  add column if not exists admin_notes text;

comment on column public.orders.order_source is 'website = storefront checkout; whatsapp = recorded manually from WhatsApp';
comment on column public.orders.amount_received is 'Total payment received from customer (PKR), full or partial';
comment on column public.orders.admin_notes is 'Internal accounting notes (e.g. personal discount given)';

update public.orders
set amount_received = advance_payment
where amount_received is null
  and advance_payment is not null
  and advance_payment > 0;

drop policy if exists "Admin insert orders" on public.orders;
create policy "Admin insert orders"
  on public.orders for insert
  with check (public.is_admin());

drop policy if exists "Admin insert order_items" on public.order_items;
create policy "Admin insert order_items"
  on public.order_items for insert
  with check (public.is_admin());
