-- =============================================================================
-- PRODUCT VIDEO SUPPORT
-- Añade soporte de vídeo ligero por producto (YouTube/Vimeo URL).
-- Idempotente.
-- =============================================================================

alter table if exists public.products
  add column if not exists trailer_url text;

create index if not exists idx_products_trailer_url
  on public.products (trailer_url)
  where trailer_url is not null;

notify pgrst, 'reload schema';

