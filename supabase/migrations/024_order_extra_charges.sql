-- Extra invoice lines for WhatsApp/manual orders.
-- Array of { "label": "Gift Card Printing", "amount": 200, "kind": "charge"|"discount" }

alter table public.orders
  add column if not exists extra_charges jsonb not null default '[]'::jsonb;

comment on column public.orders.extra_charges is
  'Invoice adjustment lines: [{label, amount, kind: charge|discount}].';

alter table public.orders
  drop constraint if exists orders_extra_charges_is_array;

alter table public.orders
  add constraint orders_extra_charges_is_array
  check (jsonb_typeof(extra_charges) = 'array');
