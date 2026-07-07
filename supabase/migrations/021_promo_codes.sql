-- Promo codes for checkout discounts (percentage or fixed PKR amount).

create table if not exists public.promo_codes (
  id uuid primary key default gen_random_uuid(),
  code text not null,
  discount_type text not null
    check (discount_type in ('percent', 'amount')),
  discount_value numeric(12, 2) not null check (discount_value > 0),
  is_active boolean not null default true,
  min_order_amount numeric(12, 2)
    check (min_order_amount is null or min_order_amount >= 0),
  max_uses int check (max_uses is null or max_uses > 0),
  used_count int not null default 0 check (used_count >= 0),
  expires_at timestamptz,
  description text,
  created_at timestamptz not null default now(),
  constraint promo_codes_percent_max check (
    discount_type != 'percent'
    or (discount_value > 0 and discount_value <= 100)
  )
);

create unique index if not exists promo_codes_code_upper_idx
  on public.promo_codes (upper(trim(code)));

comment on table public.promo_codes is
  'Checkout promo codes — percent or fixed PKR discount.';
comment on column public.promo_codes.discount_type is
  'percent = % off subtotal; amount = fixed PKR off (capped at subtotal).';

alter table public.orders
  add column if not exists promo_code text;

comment on column public.orders.promo_code is
  'Promo code applied at checkout (discount stored in orders.discount).';

alter table public.promo_codes enable row level security;

drop policy if exists "Admin read promo_codes" on public.promo_codes;
create policy "Admin read promo_codes"
  on public.promo_codes for select
  using (public.is_admin());

drop policy if exists "Admin insert promo_codes" on public.promo_codes;
create policy "Admin insert promo_codes"
  on public.promo_codes for insert
  with check (public.is_admin());

drop policy if exists "Admin update promo_codes" on public.promo_codes;
create policy "Admin update promo_codes"
  on public.promo_codes for update
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "Admin delete promo_codes" on public.promo_codes;
create policy "Admin delete promo_codes"
  on public.promo_codes for delete
  using (public.is_admin());

-- Validate a promo for checkout without exposing the full promo_codes table.
create or replace function public.validate_promo_code(
  p_code text,
  p_subtotal numeric
)
returns table (
  promo_id uuid,
  code text,
  discount_amount numeric
)
language plpgsql
security definer
stable
set search_path = public
as $$
declare
  v_promo public.promo_codes%rowtype;
  v_subtotal numeric;
  v_discount numeric;
begin
  v_subtotal := coalesce(p_subtotal, 0);
  if v_subtotal <= 0 or p_code is null or trim(p_code) = '' then
    return;
  end if;

  select pc.*
  into v_promo
  from public.promo_codes as pc
  where upper(trim(pc.code)) = upper(trim(p_code))
  limit 1;

  if not found then
    return;
  end if;

  if not v_promo.is_active then
    return;
  end if;

  if v_promo.expires_at is not null and v_promo.expires_at < now() then
    return;
  end if;

  if v_promo.max_uses is not null and v_promo.used_count >= v_promo.max_uses then
    return;
  end if;

  if v_promo.min_order_amount is not null and v_subtotal < v_promo.min_order_amount then
    return;
  end if;

  if v_promo.discount_type = 'percent' then
    v_discount := round(v_subtotal * v_promo.discount_value / 100);
  else
    v_discount := least(v_promo.discount_value, v_subtotal);
  end if;

  v_discount := greatest(0, least(v_discount, v_subtotal));

  return query
    select v_promo.id, v_promo.code, v_discount;
end;
$$;

grant execute on function public.validate_promo_code(text, numeric)
  to anon, authenticated;

create or replace function public.increment_promo_usage(p_promo_id uuid)
returns void
language sql
security definer
set search_path = public
as $$
  update public.promo_codes
  set used_count = used_count + 1
  where id = p_promo_id;
$$;

grant execute on function public.increment_promo_usage(uuid)
  to anon, authenticated;
