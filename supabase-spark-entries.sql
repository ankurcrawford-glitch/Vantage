-- Spark: monthly reflection entries (Foundations).
-- Run in Supabase SQL Editor. Safe to run multiple times.
create table if not exists public.foundations_spark_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  month_key text not null,           -- e.g. '2026-07'
  prompt text not null,
  content text not null,
  created_at timestamptz not null default now()
);

create index if not exists spark_entries_user_idx
  on public.foundations_spark_entries (user_id, created_at desc);

alter table public.foundations_spark_entries enable row level security;

-- Students read their own entries; writes go through the API (service role).
drop policy if exists "spark_entries_select" on public.foundations_spark_entries;
create policy "spark_entries_select" on public.foundations_spark_entries
  for select to authenticated using (auth.uid() = user_id);
