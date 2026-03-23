-- =========================================================
-- PROFILE USAGE METRICS (tiempo de uso por usuario)
-- Ejecutar en Supabase SQL Editor
-- =========================================================

create extension if not exists pgcrypto;

create table if not exists user_usage_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  session_id text not null,
  started_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  ended_at timestamptz,
  active_seconds integer not null default 0 check (active_seconds >= 0),
  heartbeat_count integer not null default 0 check (heartbeat_count >= 0),
  page_views integer not null default 0 check (page_views >= 0),
  last_path text,
  user_agent text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id, session_id)
);

create index if not exists idx_user_usage_sessions_user_last_seen
  on user_usage_sessions(user_id, last_seen_at desc);

create index if not exists idx_user_usage_sessions_user_started
  on user_usage_sessions(user_id, started_at desc);

create table if not exists user_usage_daily_stats (
  user_id uuid not null references users(id) on delete cascade,
  usage_date date not null,
  active_seconds integer not null default 0 check (active_seconds >= 0),
  sessions_count integer not null default 0 check (sessions_count >= 0),
  heartbeats_count integer not null default 0 check (heartbeats_count >= 0),
  page_views integer not null default 0 check (page_views >= 0),
  updated_at timestamptz not null default now(),
  primary key (user_id, usage_date)
);

create index if not exists idx_user_usage_daily_stats_user_date
  on user_usage_daily_stats(user_id, usage_date desc);

alter table user_usage_sessions enable row level security;
alter table user_usage_daily_stats enable row level security;

drop policy if exists user_usage_sessions_select_own on user_usage_sessions;
create policy user_usage_sessions_select_own
  on user_usage_sessions
  for select
  using (auth.uid() = user_id);

drop policy if exists user_usage_daily_stats_select_own on user_usage_daily_stats;
create policy user_usage_daily_stats_select_own
  on user_usage_daily_stats
  for select
  using (auth.uid() = user_id);

create or replace function public.track_user_usage_heartbeat(
  p_user_id uuid,
  p_session_id text,
  p_path text default null,
  p_active_seconds integer default 0,
  p_mark_ended boolean default false,
  p_user_agent text default null
) returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_now timestamptz := now();
  v_delta integer := greatest(0, least(coalesce(p_active_seconds, 0), 900));
  v_session user_usage_sessions%rowtype;
  v_is_new boolean := false;
  v_path text := nullif(trim(coalesce(p_path, '')), '');
  v_page_view_inc integer := 0;
  v_usage_date date := (v_now at time zone 'UTC')::date;
begin
  if p_user_id is null then
    raise exception 'p_user_id is required';
  end if;
  if nullif(trim(coalesce(p_session_id, '')), '') is null then
    raise exception 'p_session_id is required';
  end if;

  insert into user_usage_sessions (
    user_id,
    session_id,
    started_at,
    last_seen_at,
    active_seconds,
    heartbeat_count,
    page_views,
    last_path,
    user_agent,
    created_at,
    updated_at
  ) values (
    p_user_id,
    trim(p_session_id),
    v_now,
    v_now,
    0,
    0,
    case when v_path is not null then 1 else 0 end,
    v_path,
    nullif(left(coalesce(p_user_agent, ''), 350), ''),
    v_now,
    v_now
  )
  on conflict (user_id, session_id) do nothing;

  select *
  into v_session
  from user_usage_sessions
  where user_id = p_user_id and session_id = trim(p_session_id)
  for update;

  if not found then
    raise exception 'unable to load usage session';
  end if;

  v_is_new := v_session.heartbeat_count = 0;

  if v_path is not null and coalesce(v_session.last_path, '') <> v_path then
    v_page_view_inc := 1;
  end if;

  update user_usage_sessions
  set
    last_seen_at = v_now,
    ended_at = case when p_mark_ended then v_now else ended_at end,
    active_seconds = active_seconds + v_delta,
    heartbeat_count = heartbeat_count + 1,
    page_views = page_views + v_page_view_inc,
    last_path = coalesce(v_path, last_path),
    user_agent = coalesce(nullif(left(coalesce(p_user_agent, ''), 350), ''), user_agent),
    updated_at = v_now
  where user_id = p_user_id and session_id = trim(p_session_id);

  insert into user_usage_daily_stats (
    user_id,
    usage_date,
    active_seconds,
    sessions_count,
    heartbeats_count,
    page_views,
    updated_at
  ) values (
    p_user_id,
    v_usage_date,
    v_delta,
    case when v_is_new then 1 else 0 end,
    1,
    v_page_view_inc,
    v_now
  )
  on conflict (user_id, usage_date)
  do update set
    active_seconds = user_usage_daily_stats.active_seconds + excluded.active_seconds,
    sessions_count = user_usage_daily_stats.sessions_count + excluded.sessions_count,
    heartbeats_count = user_usage_daily_stats.heartbeats_count + excluded.heartbeats_count,
    page_views = user_usage_daily_stats.page_views + excluded.page_views,
    updated_at = v_now;

  return jsonb_build_object(
    'ok', true,
    'active_seconds_added', v_delta,
    'page_view_incremented', v_page_view_inc,
    'session_started', v_is_new
  );
end;
$$;

create or replace function public.get_user_usage_summary(
  p_user_id uuid
) returns jsonb
language sql
security definer
set search_path = public
as $$
with sessions as (
  select
    coalesce(sum(active_seconds), 0)::bigint as total_active_seconds,
    count(*)::bigint as total_sessions,
    coalesce(sum(page_views), 0)::bigint as total_page_views,
    max(last_seen_at) as last_seen_at
  from user_usage_sessions
  where user_id = p_user_id
),
today as (
  select
    coalesce(sum(active_seconds), 0)::bigint as active_seconds,
    coalesce(sum(sessions_count), 0)::bigint as sessions_count,
    coalesce(sum(page_views), 0)::bigint as page_views
  from user_usage_daily_stats
  where user_id = p_user_id
    and usage_date = (now() at time zone 'UTC')::date
),
last7 as (
  select
    coalesce(sum(active_seconds), 0)::bigint as active_seconds,
    coalesce(sum(sessions_count), 0)::bigint as sessions_count,
    coalesce(sum(page_views), 0)::bigint as page_views
  from user_usage_daily_stats
  where user_id = p_user_id
    and usage_date >= ((now() at time zone 'UTC')::date - interval '6 days')
),
last30 as (
  select
    coalesce(sum(active_seconds), 0)::bigint as active_seconds,
    coalesce(sum(sessions_count), 0)::bigint as sessions_count,
    coalesce(sum(page_views), 0)::bigint as page_views
  from user_usage_daily_stats
  where user_id = p_user_id
    and usage_date >= ((now() at time zone 'UTC')::date - interval '29 days')
),
daily as (
  select
    usage_date,
    active_seconds,
    sessions_count,
    heartbeats_count,
    page_views
  from user_usage_daily_stats
  where user_id = p_user_id
  order by usage_date desc
  limit 30
),
latest_session as (
  select
    session_id,
    started_at,
    last_seen_at,
    ended_at,
    active_seconds,
    heartbeat_count,
    page_views,
    last_path
  from user_usage_sessions
  where user_id = p_user_id
  order by coalesce(last_seen_at, started_at) desc
  limit 1
)
select jsonb_build_object(
  'totals', jsonb_build_object(
    'active_seconds', sessions.total_active_seconds,
    'sessions_count', sessions.total_sessions,
    'page_views', sessions.total_page_views,
    'last_seen_at', sessions.last_seen_at,
    'avg_session_seconds',
      case
        when sessions.total_sessions > 0 then floor(sessions.total_active_seconds::numeric / sessions.total_sessions)::bigint
        else 0
      end
  ),
  'today', jsonb_build_object(
    'active_seconds', today.active_seconds,
    'sessions_count', today.sessions_count,
    'page_views', today.page_views
  ),
  'last_7d', jsonb_build_object(
    'active_seconds', last7.active_seconds,
    'sessions_count', last7.sessions_count,
    'page_views', last7.page_views
  ),
  'last_30d', jsonb_build_object(
    'active_seconds', last30.active_seconds,
    'sessions_count', last30.sessions_count,
    'page_views', last30.page_views
  ),
  'daily', coalesce(
    (
      select jsonb_agg(
        jsonb_build_object(
          'usage_date', daily.usage_date,
          'active_seconds', daily.active_seconds,
          'sessions_count', daily.sessions_count,
          'heartbeats_count', daily.heartbeats_count,
          'page_views', daily.page_views
        )
        order by daily.usage_date desc
      )
      from daily
    ),
    '[]'::jsonb
  ),
  'latest_session', (
    select row_to_json(latest_session) from latest_session
  )
)
from sessions, today, last7, last30;
$$;

grant execute on function public.track_user_usage_heartbeat(uuid, text, text, integer, boolean, text)
  to authenticated, service_role;
grant execute on function public.get_user_usage_summary(uuid)
  to authenticated, service_role;
