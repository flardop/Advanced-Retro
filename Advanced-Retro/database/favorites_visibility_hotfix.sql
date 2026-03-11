-- =============================================================================
-- FAVORITES VISIBILITY HOTFIX (NO DESTRUCTIVO)
-- Corrige: Could not find the 'favorites_visibility' column of 'users' in the schema cache
-- =============================================================================

alter table if exists public.users
  add column if not exists favorites_visibility text not null default 'public';

-- Normaliza valores antiguos
update public.users
set favorites_visibility = case
  when lower(coalesce(favorites_visibility, 'public')) in ('public', 'members', 'private')
    then lower(coalesce(favorites_visibility, 'public'))
  else 'public'
end
where true;

-- Constraint de seguridad (idempotente)
do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'users_favorites_visibility_check'
  ) then
    alter table public.users
      add constraint users_favorites_visibility_check
      check (favorites_visibility in ('public', 'members', 'private'));
  end if;
end $$;

notify pgrst, 'reload schema';

-- Verificación rápida
select
  'favorites_visibility_hotfix' as check_name,
  exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'users'
      and column_name = 'favorites_visibility'
  ) as ok;
