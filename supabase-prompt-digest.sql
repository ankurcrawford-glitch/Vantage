-- Prompt-release tracking + weekly senior digest support.
-- Run in Supabase SQL Editor. Safe to run multiple times.

alter table public.college_prompts add column if not exists cycle text;
alter table public.college_prompts add column if not exists released_at timestamptz;

-- Seniors can opt out of the weekly digest (unsubscribe link in email).
alter table public.user_stats add column if not exists digest_opt_out boolean not null default false;

-- When the weekly prompt check confirms a college's new-cycle prompts:
--   update college_prompts set cycle = '2026-27', released_at = now() where college_id = '...';
