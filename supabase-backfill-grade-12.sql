-- ─── Backfill grade = 12 for existing college-app users ─────────────────────
-- Run in Supabase SQL Editor — SEPARATE from supabase-security-hardening.sql
--
-- ⚠️  Do NOT paste this file together with hardening.sql in one run.
--     If you see "still_missing_grade" or a row with grade 9, you likely ran
--     STEP 4 (verify) at the bottom before STEP 2 + 3, or you have a test
--     Foundations account at grade 9 (that is normal — not an error).
--
-- Order:
--   A. Run STEP 2 (update)
--   B. Run STEP 3 (insert)
--   C. Run STEP 4 (verify) — still_missing_grade should be 0

alter table public.user_stats
  add column if not exists grade int check (grade between 9 and 12);

-- =============================================================================
-- STEP 1 — PREVIEW ONLY (optional — run alone to see who will change)
-- =============================================================================

/*
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
select count(*) as users_to_backfill
from college_app_users c
left join public.user_stats us on us.user_id = c.user_id
where us.grade is null;
*/

-- =============================================================================
-- STEP 2 — BACKFILL existing user_stats rows (RUN THIS)
-- =============================================================================

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

-- =============================================================================
-- STEP 3 — INSERT rows for college users with no user_stats yet (RUN THIS)
-- =============================================================================

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

-- =============================================================================
-- STEP 4 — VERIFY (run only after STEP 2 + 3)
-- =============================================================================
-- grade 9 / 10 / 11 = Foundations test accounts (expected, left unchanged)
-- still_missing_grade should be 0

select grade, count(*) as users
from public.user_stats
group by grade
order by grade nulls first;

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

-- If still_missing_grade > 0, see who they are:
select au.email, college_users.user_id
from (
  select distinct user_id from (
    select user_id from public.essays
    union select user_id from public.user_colleges
    union select user_id from public.discovery_answers
  ) s
) college_users
left join public.user_stats us on us.user_id = college_users.user_id
left join auth.users au on au.id = college_users.user_id
where us.grade is null;
