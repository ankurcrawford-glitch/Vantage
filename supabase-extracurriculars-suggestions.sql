-- Migration: enable suggested extracurriculars surfaced from Story Builder.
--
-- Adds a status column (accepted / suggested / rejected), plus tracking
-- of where each suggestion originated. Existing rows default to
-- 'accepted' so the Profile page renders unchanged for current users.
--
-- Run in Supabase SQL Editor. Idempotent.

-- 1) Status column (with a CHECK constraint, default 'accepted' for backward compat)
alter table if exists public.user_extracurriculars
  add column if not exists status text not null default 'accepted';

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'user_extracurriculars_status_check'
  ) then
    alter table public.user_extracurriculars
      add constraint user_extracurriculars_status_check
      check (status in ('accepted', 'suggested', 'rejected'));
  end if;
end $$;

-- 2) Where this row was suggested from (Story Builder question id), and when.
--    Both nullable — accepted rows users add directly will have neither set.
alter table if exists public.user_extracurriculars
  add column if not exists source_question_id text;

alter table if exists public.user_extracurriculars
  add column if not exists suggested_at timestamptz;

-- 3) Index for the suggestions query path (per-user, status filter).
create index if not exists user_extracurriculars_user_status_idx
  on public.user_extracurriculars (user_id, status);

-- 4) Optional: track when extraction last ran per user so the job can
--    debounce and avoid extracting on every Story Builder keystroke.
create table if not exists public.activity_extraction_runs (
  user_id uuid primary key references auth.users(id) on delete cascade,
  last_run_at timestamptz not null default now(),
  last_answer_hash text
);

alter table public.activity_extraction_runs enable row level security;

drop policy if exists "activity_extraction_runs_select" on public.activity_extraction_runs;
drop policy if exists "activity_extraction_runs_upsert" on public.activity_extraction_runs;

create policy "activity_extraction_runs_select"
  on public.activity_extraction_runs
  for select to authenticated
  using (auth.uid() = user_id);

-- Server-side route writes via the service role, so an INSERT/UPDATE
-- policy for authenticated isn't required. Add one only if you ever
-- want clients to write directly.
