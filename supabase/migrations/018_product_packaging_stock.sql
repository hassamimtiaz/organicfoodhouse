-- Remaining box count per packaging option (null = unlimited / not tracked).

alter table public.product_packagings
  add column if not exists stock_quantity integer
    check (stock_quantity is null or stock_quantity >= 0);

comment on column public.product_packagings.stock_quantity is
  'Boxes remaining for this option. NULL = unlimited. At 0, option is out of stock.';

-- Atomically decrement stock when an order is placed (avoids overselling).
create or replace function public.decrement_packaging_stock(
  p_packaging_id uuid,
  p_quantity integer
)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  current_qty integer;
  new_qty integer;
begin
  if p_quantity is null or p_quantity <= 0 then
    return null;
  end if;

  select stock_quantity into current_qty
  from public.product_packagings
  where id = p_packaging_id
  for update;

  if not found then
    raise exception 'Packaging option not found';
  end if;

  if current_qty is null then
    return null;
  end if;

  if current_qty < p_quantity then
    raise exception 'Not enough boxes in stock for this option';
  end if;

  new_qty := current_qty - p_quantity;

  update public.product_packagings
  set
    stock_quantity = new_qty,
    in_stock = (new_qty > 0)
  where id = p_packaging_id;

  return new_qty;
end;
$$;

grant execute on function public.decrement_packaging_stock(uuid, integer) to anon, authenticated;
