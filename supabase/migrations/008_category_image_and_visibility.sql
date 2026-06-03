-- Category images and hide/show on the storefront

alter table categories
  add column if not exists image_url text;

alter table categories
  add column if not exists is_visible boolean not null default true;

create index if not exists categories_is_visible_idx
  on categories (is_visible)
  where is_visible = true;

comment on column categories.image_url is 'Optional hero/card image for category or subcategory';
comment on column categories.is_visible is 'When false, hidden from the public store (subcategories and products under it too)';
