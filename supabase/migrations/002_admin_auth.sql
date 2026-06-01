-- =============================================================================
-- Migration 002 — admin auth & locked-down writes
-- =============================================================================
--
-- Run after schema.sql if your project still has open public write policies.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Admin allowlist (create users in Supabase Auth, then add their UUID here)
-- -----------------------------------------------------------------------------

create table if not exists public.admin_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

comment on table public.admin_users is
  'Users allowed to manage catalog. Add rows via SQL after creating Auth users.';

alter table public.admin_users enable row level security;

drop policy if exists "Users can read own admin row" on public.admin_users;
create policy "Users can read own admin row"
  on public.admin_users
  for select
  using (auth.uid() = user_id);

-- -----------------------------------------------------------------------------
-- Helper: true when the signed-in user is in admin_users
-- -----------------------------------------------------------------------------

create or replace function public.is_admin()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1
    from public.admin_users
    where user_id = auth.uid()
  );
$$;

-- -----------------------------------------------------------------------------
-- Categories & products: public read, admin-only writes
-- -----------------------------------------------------------------------------

drop policy if exists "Public insert categories" on public.categories;
drop policy if exists "Public update categories" on public.categories;
drop policy if exists "Public delete categories" on public.categories;
drop policy if exists "Public insert products" on public.products;
drop policy if exists "Public update products" on public.products;
drop policy if exists "Public delete products" on public.products;

drop policy if exists "Admin insert categories" on public.categories;
create policy "Admin insert categories"
  on public.categories
  for insert
  with check (public.is_admin());

drop policy if exists "Admin update categories" on public.categories;
create policy "Admin update categories"
  on public.categories
  for update
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "Admin delete categories" on public.categories;
create policy "Admin delete categories"
  on public.categories
  for delete
  using (public.is_admin());

drop policy if exists "Admin insert products" on public.products;
create policy "Admin insert products"
  on public.products
  for insert
  with check (public.is_admin());

drop policy if exists "Admin update products" on public.products;
create policy "Admin update products"
  on public.products
  for update
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "Admin delete products" on public.products;
create policy "Admin delete products"
  on public.products
  for delete
  using (public.is_admin());

-- -----------------------------------------------------------------------------
-- First admin (replace with your user UUID from Authentication → Users)
-- -----------------------------------------------------------------------------
-- insert into public.admin_users (user_id)
-- values ('00000000-0000-0000-0000-000000000000');
