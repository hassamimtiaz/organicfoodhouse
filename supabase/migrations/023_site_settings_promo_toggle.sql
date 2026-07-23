-- Storefront feature flags / site settings (admin-managed).

create table if not exists public.site_settings (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now()
);

comment on table public.site_settings is
  'Key/value site settings (e.g. promo_codes_enabled).';

insert into public.site_settings (key, value)
values ('promo_codes_enabled', 'true'::jsonb)
on conflict (key) do nothing;

alter table public.site_settings enable row level security;

-- Checkout needs to know if promo input should show.
drop policy if exists "Public read site_settings" on public.site_settings;
create policy "Public read site_settings"
  on public.site_settings for select
  using (true);

drop policy if exists "Admin upsert site_settings" on public.site_settings;
create policy "Admin upsert site_settings"
  on public.site_settings for insert
  with check (public.is_admin());

drop policy if exists "Admin update site_settings" on public.site_settings;
create policy "Admin update site_settings"
  on public.site_settings for update
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "Admin delete site_settings" on public.site_settings;
create policy "Admin delete site_settings"
  on public.site_settings for delete
  using (public.is_admin());
