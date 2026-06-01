-- Product image uploads (Supabase Storage) + fix mango variety spellings

-- -----------------------------------------------------------------------------
-- Storage bucket: product-images (public read, admin write)
-- -----------------------------------------------------------------------------

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'product-images',
  'product-images',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Public read product images" on storage.objects;
create policy "Public read product images"
  on storage.objects for select
  using (bucket_id = 'product-images');

drop policy if exists "Admin upload product images" on storage.objects;
create policy "Admin upload product images"
  on storage.objects for insert
  with check (bucket_id = 'product-images' and public.is_admin());

drop policy if exists "Admin update product images" on storage.objects;
create policy "Admin update product images"
  on storage.objects for update
  using (bucket_id = 'product-images' and public.is_admin())
  with check (bucket_id = 'product-images' and public.is_admin());

drop policy if exists "Admin delete product images" on storage.objects;
create policy "Admin delete product images"
  on storage.objects for delete
  using (bucket_id = 'product-images' and public.is_admin());

-- -----------------------------------------------------------------------------
-- Correct variety names (legacy spellings from early seed)
-- -----------------------------------------------------------------------------

update products set name = 'Dasheri'
where name in ('Dosehri', 'Doshehri', 'Dussehri');

update products set name = 'Anwar Ratol'
where name in ('Anwar Ratool', 'Anwar Rattol');

-- Optional: set default images where missing (Unsplash placeholders)
update products p
set image_url = v.image_url
from categories sub
join categories parent on sub.parent_id = parent.id
join (values
  ('Dasheri', 'https://images.unsplash.com/photo-1605027990121-cbae9e63ab02?w=800&q=80&auto=format&fit=crop'),
  ('Sindhri', 'https://images.unsplash.com/photo-1553279768-8650adbb2896?w=800&q=80&auto=format&fit=crop'),
  ('Chaunsa', 'https://images.unsplash.com/photo-1619568428299-a69f8c8e64e0?w=800&q=80&auto=format&fit=crop'),
  ('Anwar Ratol', 'https://images.unsplash.com/photo-1591284009650-0a12a8e2ed24?w=800&q=80&auto=format&fit=crop')
) as v(name, image_url)
where p.category_id = sub.id
  and parent.slug = 'fruits'
  and sub.slug = 'mangoes'
  and p.name = v.name
  and (p.image_url is null or p.image_url = '');
