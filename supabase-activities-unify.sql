-- Unify activities — single canonical table, both products read it.
--
-- Foundations' Conversation auto-suggests activities into the
-- foundations_activities table (source='conversation', confirmed=false).
-- That table stays as Foundations' working memory for unconfirmed
-- suggestions.
--
-- Once a student CONFIRMS an activity in Foundations (or adds one
-- directly as source='student'), it gets mirrored as a snapshot into
-- public.user_extracurriculars with status='accepted'. From then on,
-- the senior product (Essays, Profile, Round Table, Strategic
-- Intelligence) reads the activity from user_extracurriculars like any
-- other accepted row.
--
-- Snapshot model: edits in Foundations after confirm do not propagate
-- to the mirrored row. Both rows are independent thereafter. If you
-- want bi-directional sync later, the source_foundation_id linking
-- column added here makes it easy to enable.
--
-- Idempotent. Run in Supabase SQL Editor.

-- 1) Add Foundations-rich metadata columns to user_extracurriculars.
--    All nullable — existing accepted rows users typed in directly via
--    the Profile page will have these as null and that's fine.
alter table if exists public.user_extracurriculars
  add column if not exists depth int;

alter table if exists public.user_extracurriculars
  add column if not exists thread text;

alter table if exists public.user_extracurriculars
  add column if not exists trajectory text;

alter table if exists public.user_extracurriculars
  add column if not exists hours text;

alter table if exists public.user_extracurriculars
  add column if not exists since text;

-- 2) Linking column. When a row was mirrored from Foundations on
--    confirm, this is set to the source foundations_activities.id so
--    we can find and delete the mirror when the Foundations row is
--    deleted. Direct Profile-add rows leave this null.
alter table if exists public.user_extracurriculars
  add column if not exists source_foundation_id uuid;

-- Index for the delete-by-foundation-id lookup.
create index if not exists user_extracurriculars_source_foundation_id_idx
  on public.user_extracurriculars (source_foundation_id);

-- 3) Backfill: copy every existing confirmed Foundations activity into
--    user_extracurriculars, with status='accepted'. Skip rows that
--    would duplicate an existing entry for the same user + activity
--    name (case-insensitive). Also skip rows we've already mirrored
--    (source_foundation_id match).
insert into public.user_extracurriculars (
  user_id,
  activity_name,
  role,
  description,
  status,
  source_foundation_id,
  depth,
  thread,
  trajectory,
  hours,
  since,
  source_question_id,
  suggested_at
)
select
  fa.user_id,
  fa.name as activity_name,
  nullif(fa.role, '') as role,
  null::text as description,
  'accepted' as status,
  fa.id as source_foundation_id,
  fa.depth,
  nullif(fa.thread, '') as thread,
  nullif(fa.trajectory, '') as trajectory,
  nullif(fa.hours, '') as hours,
  nullif(fa.since, '') as since,
  null::text as source_question_id,
  null::timestamptz as suggested_at
from public.foundations_activities fa
where fa.confirmed = true
  and not exists (
    -- Already mirrored.
    select 1 from public.user_extracurriculars ue
    where ue.source_foundation_id = fa.id
  )
  and not exists (
    -- Same user already has this activity by name (case-insensitive),
    -- regardless of status. We don't want to create duplicates that
    -- would confuse the student.
    select 1 from public.user_extracurriculars ue
    where ue.user_id = fa.user_id
      and lower(ue.activity_name) = lower(fa.name)
  );
