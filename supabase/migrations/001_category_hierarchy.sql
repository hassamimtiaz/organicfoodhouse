-- =============================================================================
-- Migration 001 — category hierarchy (subcategories)
-- =============================================================================
--
-- Run ONLY if you applied an older flat schema.sql (products directly under Fruits)
-- before the hierarchy was introduced.
--
-- Skip this file if you ran the current supabase/schema.sql on a new project.
-- =============================================================================

alter table categories
  add column if not exists parent_id uuid references categories(id) on delete cascade;

-- Remove legacy global slug constraint from early schema versions
alter table categories drop constraint if exists categories_slug_key;

drop index if exists categories_slug_parent_unique;

create unique index if not exists categories_top_slug_idx
  on categories (slug)
  where parent_id is null;

create unique index if not exists categories_sub_slug_idx
  on categories (slug, parent_id)
  where parent_id is not null;

create index if not exists categories_parent_id_idx
  on categories (parent_id);

-- Create Mangoes subcategory under Fruits
insert into categories (name, slug, description, parent_id)
select
  'Mangoes',
  'mangoes',
  'Premium Pakistani mango varieties — sweet, aromatic, and tree-ripened.',
  c.id
from categories c
where c.slug = 'fruits'
  and c.parent_id is null
  and not exists (
    select 1 from categories sub
    where sub.slug = 'mangoes' and sub.parent_id = c.id
  );

-- Re-link products that were attached to Fruits → attach to Mangoes instead
update products p
set category_id = sub.id
from categories sub
join categories parent on sub.parent_id = parent.id
where parent.slug = 'fruits'
  and sub.slug = 'mangoes'
  and p.category_id = parent.id;
