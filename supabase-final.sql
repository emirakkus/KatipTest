-- =============================================
-- KATIPTEST - SUPABASE FINAL SQL
-- =============================================
-- Bu scripti Supabase SQL Editor'a TEK PARÇA olarak yapıştırıp çalıştır.

-- Gerekli extension
create extension if not exists pgcrypto;

-- =============================================
-- 1) PROFILES
-- =============================================
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  name text default '',
  avatar text default '👤',
  xp integer default 0,
  career_stage integer default 1,
  career_tests integer default 0,
  career_best_words integer default 0,
  career_best_accuracy real default 0,
  total_tests integer default 0,
  total_practice_minutes integer default 0,
  streak integer default 0,
  best_words integer default 0,
  best_chars integer default 0,
  best_wpm integer default 0,
  weak_words jsonb default '[]'::jsonb,
  daily_logs jsonb default '[]'::jsonb,
  completed_missions jsonb default '[]'::jsonb,
  settings jsonb default '{}'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- =============================================
-- 2) TEST RESULTS
-- =============================================
create table if not exists public.test_results (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  net_words integer default 0,
  gross_words integer default 0,
  correct_chars integer default 0,
  total_chars integer default 0,
  accuracy real default 0,
  wpm integer default 0,
  time_limit integer default 180,
  hard_mode boolean default false,
  sudden_death boolean default false,
  created_at timestamptz default now()
);

-- =============================================
-- 3) CONTACT MESSAGES
-- =============================================
create table if not exists public.contact_messages (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  subject text default '',
  message text not null,
  created_at timestamptz default now()
);

-- =============================================
-- 4) updated_at trigger
-- =============================================
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_profiles_updated_at on public.profiles;
create trigger trg_profiles_updated_at
before update on public.profiles
for each row
execute function public.set_updated_at();

-- =============================================
-- 5) Auth sonrası otomatik profil oluşturma
-- =============================================
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, name, avatar)
  values (
    new.id,
    new.email,
    coalesce(split_part(new.email, '@', 1), ''),
    '👤'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row
execute function public.handle_new_user();

-- =============================================
-- 6) RLS aç
-- =============================================
alter table public.profiles enable row level security;
alter table public.test_results enable row level security;
alter table public.contact_messages enable row level security;

-- =============================================
-- 7) PROFILES POLICIES (sadece kendi profili)
-- =============================================
drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own"
on public.profiles
for select
using (auth.uid() = id);

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own"
on public.profiles
for insert
with check (auth.uid() = id);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own"
on public.profiles
for update
using (auth.uid() = id)
with check (auth.uid() = id);

-- =============================================
-- 8) TEST RESULTS POLICIES (sadece kendi sonuçları)
-- =============================================
drop policy if exists "test_results_select_own" on public.test_results;
create policy "test_results_select_own"
on public.test_results
for select
using (auth.uid() = user_id);

drop policy if exists "test_results_insert_own" on public.test_results;
create policy "test_results_insert_own"
on public.test_results
for insert
with check (auth.uid() = user_id);

-- İstersen update/delete de eklenebilir ama şimdilik gerekmiyor.

-- =============================================
-- 9) CONTACT POLICIES
-- =============================================
-- Herkes mesaj bırakabilsin (anon + authenticated)
drop policy if exists "contact_insert_anyone" on public.contact_messages;
create policy "contact_insert_anyone"
on public.contact_messages
for insert
with check (true);

-- Hiç kimse doğrudan contact mesajları okuyamasın
-- (ileride admin panel yaparsan service role ile okursun)
drop policy if exists "contact_select_nobody" on public.contact_messages;
create policy "contact_select_nobody"
on public.contact_messages
for select
using (false);

-- =============================================
-- 10) LEADERBOARD VIEWS (güvenli public görünüm)
-- =============================================
create or replace view public.public_leaderboard as
select
  id,
  coalesce(nullif(name, ''), split_part(email, '@', 1)) as name,
  avatar,
  best_words,
  best_chars,
  best_wpm,
  xp,
  career_stage,
  total_tests,
  created_at
from public.profiles;

create or replace view public.public_leaderboard_daily as
select
  p.id,
  coalesce(nullif(p.name, ''), split_part(p.email, '@', 1)) as name,
  p.avatar,
  max(tr.net_words) as best_words,
  max(tr.correct_chars) as best_chars,
  max(tr.wpm) as best_wpm,
  p.xp,
  p.career_stage,
  count(tr.id) as total_tests,
  max(tr.created_at) as created_at
from public.test_results tr
join public.profiles p on p.id = tr.user_id
where tr.created_at::date = current_date
group by p.id, p.name, p.email, p.avatar, p.xp, p.career_stage;

create or replace view public.public_leaderboard_weekly as
select
  p.id,
  coalesce(nullif(p.name, ''), split_part(p.email, '@', 1)) as name,
  p.avatar,
  max(tr.net_words) as best_words,
  max(tr.correct_chars) as best_chars,
  max(tr.wpm) as best_wpm,
  p.xp,
  p.career_stage,
  count(tr.id) as total_tests,
  max(tr.created_at) as created_at
from public.test_results tr
join public.profiles p on p.id = tr.user_id
where tr.created_at >= now() - interval '7 days'
group by p.id, p.name, p.email, p.avatar, p.xp, p.career_stage;

create or replace view public.public_leaderboard_monthly as
select
  p.id,
  coalesce(nullif(p.name, ''), split_part(p.email, '@', 1)) as name,
  p.avatar,
  max(tr.net_words) as best_words,
  max(tr.correct_chars) as best_chars,
  max(tr.wpm) as best_wpm,
  p.xp,
  p.career_stage,
  count(tr.id) as total_tests,
  max(tr.created_at) as created_at
from public.test_results tr
join public.profiles p on p.id = tr.user_id
where tr.created_at >= now() - interval '30 days'
group by p.id, p.name, p.email, p.avatar, p.xp, p.career_stage;

-- View okuma yetkisi
revoke all on public.public_leaderboard from public;
revoke all on public.public_leaderboard_daily from public;
revoke all on public.public_leaderboard_weekly from public;
revoke all on public.public_leaderboard_monthly from public;
grant select on public.public_leaderboard to anon, authenticated;
grant select on public.public_leaderboard_daily to anon, authenticated;
grant select on public.public_leaderboard_weekly to anon, authenticated;
grant select on public.public_leaderboard_monthly to anon, authenticated;

-- =============================================
-- 11) Indexler
-- =============================================
create index if not exists idx_test_results_user_id on public.test_results(user_id);
create index if not exists idx_test_results_created_at on public.test_results(created_at desc);
create index if not exists idx_profiles_best_words on public.profiles(best_words desc);
create index if not exists idx_profiles_best_wpm on public.profiles(best_wpm desc);
create index if not exists idx_profiles_xp on public.profiles(xp desc);

-- =============================================
-- 12) Kontrol sorguları (opsiyonel)
-- =============================================
-- select * from public.profiles limit 5;
-- select * from public.test_results limit 5;
-- select * from public.contact_messages limit 5;
-- select * from public.public_leaderboard limit 20;
