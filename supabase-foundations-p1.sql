-- Foundations P1: course + rigor tracking, personalized roadmap moves.
-- Run in Supabase SQL Editor. Safe to run multiple times.

-- ── Course tracking ──────────────────────────────────────────────
-- The student's course load (rigor is the missing counselor primitive).
-- Rows come from the Activities page or from Conversation extraction.
create table if not exists public.foundations_courses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  level text not null default 'regular'
    check (level in ('regular','honors','ap','ib','college')),
  grade_year int,
  created_at timestamptz not null default now()
);

create index if not exists foundations_courses_user_idx
  on public.foundations_courses (user_id, created_at desc);

alter table public.foundations_courses enable row level security;

-- Students read their own courses; writes go through the API (service role).
drop policy if exists "foundations_courses_select" on public.foundations_courses;
create policy "foundations_courses_select" on public.foundations_courses
  for select to authenticated using (auth.uid() = user_id);

-- ── Personalized roadmap layer ───────────────────────────────────
-- Cached "next three moves" per student, regenerated monthly by
-- /api/foundations/roadmap-moves.
alter table public.user_stats add column if not exists roadmap_moves jsonb;
alter table public.user_stats add column if not exists roadmap_moves_at timestamptz;
