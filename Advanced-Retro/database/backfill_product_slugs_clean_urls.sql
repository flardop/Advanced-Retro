-- =============================================================================
-- BACKFILL DE SLUGS LIMPIOS PARA URLS DE PRODUCTO
-- Objetivo:
-- 1) Crear/normalizar slug en products.
-- 2) Evitar duplicados de slug.
-- 3) Dejar URLs más fáciles tipo /producto/pokemon-rojo
-- =============================================================================

alter table if exists products
  add column if not exists slug text;

-- Limpia espacios y nulos vacíos
update products
set slug = nullif(trim(slug), '')
where slug is not null;

-- Genera slug base por nombre cuando falta
with base as (
  select
    id,
    lower(
      regexp_replace(
        regexp_replace(
          translate(
            coalesce(name, ''),
            'ÁÀÄÂÃáàäâãÉÈËÊéèëêÍÌÏÎíìïîÓÒÖÔÕóòöôõÚÙÜÛúùüûÑñÇç',
            'AAAAAaaaaaEEEEeeeeIIIIiiiiOOOOOoooooUUUUuuuuNnCc'
          ),
          '[^a-z0-9]+',
          '-',
          'g'
        ),
        '(^-+|-+$)',
        '',
        'g'
      )
    ) as base_slug
  from products
),
prepared as (
  select
    id,
    case
      when base_slug is null or base_slug = '' then 'producto'
      else left(base_slug, 100)
    end as generated_slug
  from base
),
normalized as (
  select
    p.id,
    case
      when p.slug is null or p.slug = '' then pr.generated_slug
      else lower(
        regexp_replace(
          regexp_replace(
            translate(
              p.slug,
              'ÁÀÄÂÃáàäâãÉÈËÊéèëêÍÌÏÎíìïîÓÒÖÔÕóòöôõÚÙÜÛúùüûÑñÇç',
              'AAAAAaaaaaEEEEeeeeIIIIiiiiOOOOOoooooUUUUuuuuNnCc'
            ),
            '[^a-z0-9]+',
            '-',
            'g'
          ),
          '(^-+|-+$)',
          '',
          'g'
        )
      )
    end as normalized_slug
  from products p
  join prepared pr on pr.id = p.id
),
dedup as (
  select
    id,
    case
      when normalized_slug is null or normalized_slug = '' then 'producto-' || left(replace(id::text, '-', ''), 6)
      when row_number() over (partition by normalized_slug order by id) = 1 then normalized_slug
      else left(normalized_slug, 90) || '-' || left(replace(id::text, '-', ''), 6)
    end as final_slug
  from normalized
)
update products p
set slug = d.final_slug
from dedup d
where p.id = d.id;

create unique index if not exists idx_products_slug_unique
  on products(slug)
  where slug is not null;

notify pgrst, 'reload schema';
