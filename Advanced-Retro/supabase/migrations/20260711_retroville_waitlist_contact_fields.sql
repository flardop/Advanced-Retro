alter table if exists public.retroville_waitlist
  add column if not exists first_name text;

alter table if exists public.retroville_waitlist
  add column if not exists last_name text;

alter table if exists public.retroville_waitlist
  add column if not exists phone text;

alter table if exists public.retroville_waitlist
  add column if not exists question text;

alter table if exists public.retroville_waitlist
  add column if not exists document_interest text;

update public.retroville_waitlist
set
  first_name = nullif(trim(coalesce(first_name, '')), ''),
  last_name = nullif(trim(coalesce(last_name, '')), ''),
  phone = nullif(trim(coalesce(phone, '')), ''),
  question = nullif(trim(coalesce(question, '')), ''),
  document_interest = nullif(trim(coalesce(document_interest, '')), '')
where true;

create index if not exists idx_retroville_waitlist_signup_intent
  on public.retroville_waitlist (signup_intent, created_at desc);
