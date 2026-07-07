-- Fix ambiguous "code" reference in validate_promo_code (RETURNS TABLE shadows column name).

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
