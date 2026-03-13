-- =========================================================
-- 24_concierge_helper_flow.sql
-- Flujo de ayuda entre usuarios para encargos (tickets)
-- =========================================================

begin;

-- ---------------------------------------------------------------------------
-- USERS: métricas de ayudante y preferencias básicas
-- ---------------------------------------------------------------------------
alter table if exists public.users
  add column if not exists helper_completed_count integer not null default 0,
  add column if not exists helper_active_count integer not null default 0,
  add column if not exists helper_reputation integer not null default 0,
  add column if not exists preferred_language text not null default 'es';

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'users_helper_completed_count_nonnegative'
  ) then
    alter table public.users
      add constraint users_helper_completed_count_nonnegative
      check (helper_completed_count >= 0);
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'users_helper_active_count_nonnegative'
  ) then
    alter table public.users
      add constraint users_helper_active_count_nonnegative
      check (helper_active_count >= 0);
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'users_helper_reputation_nonnegative'
  ) then
    alter table public.users
      add constraint users_helper_reputation_nonnegative
      check (helper_reputation >= 0);
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'users_preferred_language_check'
  ) then
    alter table public.users
      add constraint users_preferred_language_check
      check (preferred_language in ('auto', 'es', 'en', 'fr', 'de', 'it', 'pt'));
  end if;
end $$;

update public.users
set preferred_language = case
  when lower(coalesce(preferred_language, 'es')) in ('auto', 'es', 'en', 'fr', 'de', 'it', 'pt')
    then lower(coalesce(preferred_language, 'es'))
  else 'es'
end
where true;

create index if not exists idx_users_helper_reputation on public.users(helper_reputation desc);
create index if not exists idx_users_helper_completed on public.users(helper_completed_count desc);

-- ---------------------------------------------------------------------------
-- SUPPORT_TICKETS: columnas de encargo con ayudantes
-- ---------------------------------------------------------------------------
alter table if exists public.support_tickets
  add column if not exists ticket_type text default 'support',
  add column if not exists concierge_state text,
  add column if not exists helper_user_id uuid references public.users(id) on delete set null,
  add column if not exists helper_claimed_at timestamptz,
  add column if not exists helper_terms_accepted_at timestamptz,
  add column if not exists helper_inactive_deadline timestamptz,
  add column if not exists blocked_helper_ids uuid[] not null default '{}',
  add column if not exists preferred_helper_id uuid references public.users(id) on delete set null,
  add column if not exists completed_at timestamptz,
  add column if not exists resolution_payload jsonb not null default '{}'::jsonb;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'support_tickets_ticket_type_check'
  ) then
    alter table public.support_tickets
      add constraint support_tickets_ticket_type_check
      check (ticket_type in ('support', 'concierge'));
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'support_tickets_concierge_state_check'
  ) then
    alter table public.support_tickets
      add constraint support_tickets_concierge_state_check
      check (
        concierge_state is null
        or concierge_state in ('open', 'claimed', 'needs_reassign', 'completed', 'cancelled')
      );
  end if;
end $$;

update public.support_tickets
set ticket_type = case
  when lower(coalesce(subject, '')) like '%encargo%' then 'concierge'
  else 'support'
end
where ticket_type is null;

update public.support_tickets
set concierge_state = case
  when ticket_type <> 'concierge' then null
  when helper_user_id is not null and status in ('resolved', 'closed') then 'completed'
  when helper_user_id is not null then 'claimed'
  else 'open'
end
where concierge_state is null;

create index if not exists idx_support_tickets_type on public.support_tickets(ticket_type);
create index if not exists idx_support_tickets_concierge_state on public.support_tickets(concierge_state);
create index if not exists idx_support_tickets_helper_user on public.support_tickets(helper_user_id);
create index if not exists idx_support_tickets_helper_deadline on public.support_tickets(helper_inactive_deadline);

-- ---------------------------------------------------------------------------
-- SUPPORT_MESSAGES: adjuntos temporales para chat de encargo
-- ---------------------------------------------------------------------------
alter table if exists public.support_messages
  add column if not exists attachments jsonb not null default '[]'::jsonb,
  add column if not exists expires_at timestamptz;

create index if not exists idx_support_messages_expires_at on public.support_messages(expires_at);

commit;

-- Fuerza recarga de schema cache PostgREST
notify pgrst, 'reload schema';
