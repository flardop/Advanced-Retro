-- Genera categorías a partir de products.category y las enlaza en products.category_id.
-- Ejecutar en Supabase SQL Editor.

create extension if not exists "pgcrypto";

create table if not exists categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique not null,
  description text,
  created_at timestamptz default now()
);

alter table products
  add column if not exists category_id uuid references categories(id);

insert into categories (name, slug, description)
select
  initcap(replace(trim(p.category), '-', ' ')) as name,
  lower(trim(p.category)) as slug,
  'Categoría autogenerada desde products.category' as description
from products p
where p.category is not null
  and trim(p.category) <> ''
group by lower(trim(p.category))
on conflict (slug) do update
set name = excluded.name;

update products p
set category_id = c.id
from categories c
where p.category_id is null
  and lower(trim(p.category)) = c.slug;

create index if not exists idx_products_category_id on products(category_id);

-- Verificación rápida
select c.slug, c.name, count(p.id) as products_count
from categories c
left join products p on p.category_id = c.id
group by c.slug, c.name
order by c.slug;

