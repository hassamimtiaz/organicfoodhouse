-- Optional unit size range (e.g. 9 – 10 kg per item)

alter table products
  add column if not exists unit_min numeric(10, 2)
    check (unit_min is null or unit_min >= 0);

alter table products
  add column if not exists unit_max numeric(10, 2)
    check (unit_max is null or unit_max >= 0);

alter table products drop constraint if exists products_unit_range_check;

alter table products add constraint products_unit_range_check check (
  (unit_min is null and unit_max is null)
  or (
    unit_min is not null
    and unit_max is not null
    and unit_max >= unit_min
  )
);

comment on column products.unit is 'Measure name (kg, dozen, box, etc.)';
comment on column products.unit_min is 'Minimum size/weight when sold in a range; null for fixed unit';
comment on column products.unit_max is 'Maximum size/weight when sold in a range; null for fixed unit';
