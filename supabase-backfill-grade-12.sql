-- ─── Backfill grade = 12 for existing college-app users ─────────────────────
-- Run in Supabase SQL Editor BEFORE merging Foundations → main.
--
-- Goal: users already on the college side skip /gateway and land on dashboard.
--
-- Rules:
--   • Never overwrites grade 9, 10, or 11
--   • Only users with college-app activity AND grade IS NULL
--   • Preview first, then uncomment STEP 2 + 3
--
-- Recommended order (same session as security hardening):
--   1. supabase-security-hardening.sql  (if not run yet)
--   2. This file — STEP 1 preview → STEP 2 → STEP 3 → STEP 4 verify

alter table public.user_stats
  add column if not exists grade int check (grade between 9 and 12);

-- =============================================================================
-- STEP 1 — PREVIEW (run this block only)
-- =============================================================================

with college_app_users as (
  select distinct user_id from (
    select user_id from public.essays
    union select user_id from public.user_colleges
    union select user_id from public.discovery_answers
    union select user_id from public.strategic_guidance_history
    union select user_id from public.user_subscriptions where status = 'active'
    union select user_id from public.user_ap_classes
    union select user_id from public.user_extracurriculars
    union select user_id from public.user_awards
  ) signals
),
to_backfill as (
  select c.user_id
  from college_app_users c
  left join public.user_stats us on us.user_id = c.user_id
  where us.grade is null  -- includes users with no user_stats row (left join → null grade)
)
select count(*) as users_to_backfill from to_backfill;

-- Spot-check: emails + what data they have (first 50)
with college_app_users as (
  select distinct user_id from (
    select user_id from public.essays
    union select user_id from public.user_colleges
    union select user_id from public.discovery_answers
    union select user_id from public.strategic_guidance_history
    union select user_id from public.user_subscriptions where status = 'active'
    union select user_id from public.user_ap_classes
    union select user_id from public.user_extracurriculars
    union select user_id from public.user_awards
  ) signals
)
select
  au.email,
  us.grade as current_grade,
  exists (select 1 from public.essays e where e.user_id = c.user_id) as essays,
  exists (select 1 from public.user_colleges uc where uc.user_id = c.user_id) as colleges,
  exists (select 1 from public.discovery_answers d where d.user_id = c.user_id) as story_builder
from college_app_users c
left join public.user_stats us on us.user_id = c.user_id
left join auth.users au on au.id = c.user_id
where us.grade is null
order by au.email
limit 50;

-- =============================================================================
-- STEP 2 — BACKFILL existing user_stats rows
-- Uncomment the block below after STEP 1 looks correct.
-- =============================================================================

/*
update public.user_stats us
set grade = 12
where us.grade is null
  and us.user_id in (
    select distinct user_id from (
      select user_id from public.essays
      union select user_id from public.user_colleges
      union select user_id from public.discovery_answers
      union select user_id from public.strategic_guidance_history
      union select user_id from public.user_subscriptions where status = 'active'
      union select user_id from public.user_ap_classes
      union select user_id from public.user_extracurriculars
      union select user_id from public.user_awards
    ) s
  );
*/

-- =============================================================================
-- STEP 3 — INSERT user_stats for college users with no row yet
-- Uncomment after STEP 2.
-- =============================================================================

/*
insert into public.user_stats (user_id, grade)
select distinct s.user_id, 12
from (
  select user_id from public.essays
  union select user_id from public.user_colleges
  union select user_id from public.discovery_answers
  union select user_id from public.strategic_guidance_history
  union select user_id from public.user_subscriptions where status = 'active'
  union select user_id from public.user_ap_classes
  union select user_id from public.user_extracurriculars
  union select user_id from public.user_awards
) s
where not exists (
  select 1 from public.user_stats us where us.user_id = s.user_id
);
*/

-- =============================================================================
-- STEP 4 — VERIFY (run after STEP 2 + 3)
-- =============================================================================

select grade, count(*) as users
from public.user_stats
group by grade
order by grade nulls first;

-- Should return 0 after a successful backfill:
select count(*) as still_missing_grade
from (
  select distinct user_id from (
    select user_id from public.essays
    union select user_id from public.user_colleges
    union select user_id from public.discovery_answers
  ) s
) college_users
left join public.user_stats us on us.user_id = college_users.user_id
where us.grade is null;
