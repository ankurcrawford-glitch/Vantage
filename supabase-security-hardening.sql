-- Security hardening migration. Run in Supabase SQL Editor.
-- Safe to run multiple times (uses drop-if-exists + create).
--
-- Fixes Supabase Security Advisor warnings:
--   • RLS disabled on user-private tables
--   • essay_invitations / essay_permissions select policies too permissive (using true)
--
-- After running: Supabase → Advisors → Security — re-run scan; warnings should clear.

-- =============================================================================
-- 1. Tighten essay_invitations select policy
-- =============================================================================
-- Previous policy was `using (true)` — any authenticated user could read every
-- invitation row, including all invitation tokens, then accept them and gain
-- view/comment access to arbitrary students' essays.

drop policy if exists "essay_invitations_select" on public.essay_invitations;

create policy "essay_invitations_select"
  on public.essay_invitations
  for select
  to authenticated
  using (
    -- Either the student who owns the invitation
    student_id = auth.uid()
    -- Or the invitee who is accepting (matched by email on their JWT)
    or invitee_email = lower(coalesce(auth.jwt() ->> 'email', ''))
  );

-- =============================================================================
-- 2. Tighten essay_permissions select policy
-- =============================================================================
-- Previous policy was `using (true)` — any authenticated user could enumerate
-- which users have access to which essays.

drop policy if exists "essay_permissions_select" on public.essay_permissions;

create policy "essay_permissions_select"
  on public.essay_permissions
  for select
  to authenticated
  using (
    -- The user who is granted permission
    user_id = auth.uid()
    -- Or the essay owner (so students can see who has access to their essays)
    or essay_id in (
      select id from public.essays where user_id = auth.uid()
    )
  );

-- =============================================================================
-- 3. Add RLS to user-private tables that were missing it
-- =============================================================================
-- Helper pattern for each per-user table: enable RLS + four policies for the
-- four CRUD operations. All scoped to `auth.uid() = user_id`.

-- discovery_answers: the student's Insight Question answers (private).
alter table if exists public.discovery_answers enable row level security;
drop policy if exists "discovery_answers_select" on public.discovery_answers;
drop policy if exists "discovery_answers_insert" on public.discovery_answers;
drop policy if exists "discovery_answers_update" on public.discovery_answers;
drop policy if exists "discovery_answers_delete" on public.discovery_answers;
create policy "discovery_answers_select" on public.discovery_answers
  for select to authenticated using (auth.uid() = user_id);
create policy "discovery_answers_insert" on public.discovery_answers
  for insert to authenticated with check (auth.uid() = user_id);
create policy "discovery_answers_update" on public.discovery_answers
  for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "discovery_answers_delete" on public.discovery_answers
  for delete to authenticated using (auth.uid() = user_id);

-- strategic_guidance_history: AI feedback history (contains essay content).
alter table if exists public.strategic_guidance_history enable row level security;
drop policy if exists "strategic_guidance_history_select" on public.strategic_guidance_history;
drop policy if exists "strategic_guidance_history_insert" on public.strategic_guidance_history;
drop policy if exists "strategic_guidance_history_update" on public.strategic_guidance_history;
drop policy if exists "strategic_guidance_history_delete" on public.strategic_guidance_history;
create policy "strategic_guidance_history_select" on public.strategic_guidance_history
  for select to authenticated using (auth.uid() = user_id);
create policy "strategic_guidance_history_insert" on public.strategic_guidance_history
  for insert to authenticated with check (auth.uid() = user_id);
create policy "strategic_guidance_history_update" on public.strategic_guidance_history
  for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "strategic_guidance_history_delete" on public.strategic_guidance_history
  for delete to authenticated using (auth.uid() = user_id);

-- user_stats: GPA, SAT, etc.
alter table if exists public.user_stats enable row level security;
drop policy if exists "user_stats_select" on public.user_stats;
drop policy if exists "user_stats_insert" on public.user_stats;
drop policy if exists "user_stats_update" on public.user_stats;
drop policy if exists "user_stats_delete" on public.user_stats;
create policy "user_stats_select" on public.user_stats
  for select to authenticated using (auth.uid() = user_id);
create policy "user_stats_insert" on public.user_stats
  for insert to authenticated with check (auth.uid() = user_id);
create policy "user_stats_update" on public.user_stats
  for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "user_stats_delete" on public.user_stats
  for delete to authenticated using (auth.uid() = user_id);

-- user_ap_classes
alter table if exists public.user_ap_classes enable row level security;
drop policy if exists "user_ap_classes_select" on public.user_ap_classes;
drop policy if exists "user_ap_classes_insert" on public.user_ap_classes;
drop policy if exists "user_ap_classes_update" on public.user_ap_classes;
drop policy if exists "user_ap_classes_delete" on public.user_ap_classes;
create policy "user_ap_classes_select" on public.user_ap_classes
  for select to authenticated using (auth.uid() = user_id);
create policy "user_ap_classes_insert" on public.user_ap_classes
  for insert to authenticated with check (auth.uid() = user_id);
create policy "user_ap_classes_update" on public.user_ap_classes
  for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "user_ap_classes_delete" on public.user_ap_classes
  for delete to authenticated using (auth.uid() = user_id);

-- user_extracurriculars
alter table if exists public.user_extracurriculars enable row level security;
drop policy if exists "user_extracurriculars_select" on public.user_extracurriculars;
drop policy if exists "user_extracurriculars_insert" on public.user_extracurriculars;
drop policy if exists "user_extracurriculars_update" on public.user_extracurriculars;
drop policy if exists "user_extracurriculars_delete" on public.user_extracurriculars;
create policy "user_extracurriculars_select" on public.user_extracurriculars
  for select to authenticated using (auth.uid() = user_id);
create policy "user_extracurriculars_insert" on public.user_extracurriculars
  for insert to authenticated with check (auth.uid() = user_id);
create policy "user_extracurriculars_update" on public.user_extracurriculars
  for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "user_extracurriculars_delete" on public.user_extracurriculars
  for delete to authenticated using (auth.uid() = user_id);

-- user_awards
alter table if exists public.user_awards enable row level security;
drop policy if exists "user_awards_select" on public.user_awards;
drop policy if exists "user_awards_insert" on public.user_awards;
drop policy if exists "user_awards_update" on public.user_awards;
drop policy if exists "user_awards_delete" on public.user_awards;
create policy "user_awards_select" on public.user_awards
  for select to authenticated using (auth.uid() = user_id);
create policy "user_awards_insert" on public.user_awards
  for insert to authenticated with check (auth.uid() = user_id);
create policy "user_awards_update" on public.user_awards
  for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "user_awards_delete" on public.user_awards
  for delete to authenticated using (auth.uid() = user_id);

-- =============================================================================
-- 4. Add missing DELETE policy to essays (audit note: no delete policy was
--    defined in supabase-essays-rls.sql; students currently can't delete
--    their own essays because RLS blocks deletes by default)
-- =============================================================================

drop policy if exists "Users can delete own essays" on public.essays;
create policy "Users can delete own essays"
  on public.essays for delete
  to authenticated
  using (auth.uid() = user_id);

-- =============================================================================
-- 5. user_colleges — student's college list (was missing RLS; Security Advisor)
-- =============================================================================

alter table if exists public.user_colleges enable row level security;
drop policy if exists "user_colleges_select" on public.user_colleges;
drop policy if exists "user_colleges_insert" on public.user_colleges;
drop policy if exists "user_colleges_update" on public.user_colleges;
drop policy if exists "user_colleges_delete" on public.user_colleges;
create policy "user_colleges_select" on public.user_colleges
  for select to authenticated using (auth.uid() = user_id);
create policy "user_colleges_insert" on public.user_colleges
  for insert to authenticated with check (auth.uid() = user_id);
create policy "user_colleges_update" on public.user_colleges
  for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "user_colleges_delete" on public.user_colleges
  for delete to authenticated using (auth.uid() = user_id);

-- =============================================================================
-- 6. counselor_comments — essay feedback (was missing RLS; Security Advisor)
-- =============================================================================
-- Essay owners, invited reviewers (essay_permissions), and comment authors
-- can read. Only owners and permitted reviewers can insert (as themselves).

alter table if exists public.counselor_comments enable row level security;

drop policy if exists "counselor_comments_select" on public.counselor_comments;
create policy "counselor_comments_select"
  on public.counselor_comments
  for select to authenticated
  using (
    counselor_id = auth.uid()
    or exists (
      select 1
      from public.essay_versions ev
      join public.essays e on e.id = ev.essay_id
      where ev.id = counselor_comments.essay_version_id
        and e.user_id = auth.uid()
    )
    or exists (
      select 1
      from public.essay_versions ev
      join public.essay_permissions ep on ep.essay_id = ev.essay_id
      where ev.id = counselor_comments.essay_version_id
        and ep.user_id = auth.uid()
    )
  );

drop policy if exists "counselor_comments_insert" on public.counselor_comments;
create policy "counselor_comments_insert"
  on public.counselor_comments
  for insert to authenticated
  with check (
    counselor_id = auth.uid()
    and (
      exists (
        select 1
        from public.essay_versions ev
        join public.essays e on e.id = ev.essay_id
        where ev.id = essay_version_id
          and e.user_id = auth.uid()
      )
      or exists (
        select 1
        from public.essay_versions ev
        join public.essay_permissions ep on ep.essay_id = ev.essay_id
        where ev.id = essay_version_id
          and ep.user_id = auth.uid()
      )
    )
  );

drop policy if exists "counselor_comments_delete" on public.counselor_comments;
create policy "counselor_comments_delete"
  on public.counselor_comments
  for delete to authenticated
  using (
    counselor_id = auth.uid()
    or exists (
      select 1
      from public.essay_versions ev
      join public.essays e on e.id = ev.essay_id
      where ev.id = counselor_comments.essay_version_id
        and e.user_id = auth.uid()
    )
  );

-- =============================================================================
-- 7. Public reference catalogs — enable RLS with read-only policies
--    (Supabase flags any public table without RLS, even reference data)
-- =============================================================================

alter table if exists public.colleges enable row level security;
drop policy if exists "colleges_public_read" on public.colleges;
create policy "colleges_public_read"
  on public.colleges for select
  using (true);

alter table if exists public.college_prompts enable row level security;
drop policy if exists "college_prompts_public_read" on public.college_prompts;
create policy "college_prompts_public_read"
  on public.college_prompts for select
  using (true);

-- =============================================================================
-- 8. Foundations tables (Security Advisor often flags these — ~9 issues total)
-- =============================================================================
-- Writes go through API routes (service role). Users get SELECT on own rows only.

alter table if exists public.foundations_activities enable row level security;
drop policy if exists "Users can read own activities" on public.foundations_activities;
drop policy if exists "foundations_activities_select" on public.foundations_activities;
create policy "foundations_activities_select" on public.foundations_activities
  for select to authenticated using (auth.uid() = user_id);

alter table if exists public.conversation_messages enable row level security;
drop policy if exists "Users can read own conversation messages" on public.conversation_messages;
drop policy if exists "conversation_messages_select" on public.conversation_messages;
create policy "conversation_messages_select" on public.conversation_messages
  for select to authenticated using (auth.uid() = user_id);

alter table if exists public.roadmap_progress enable row level security;
drop policy if exists "Users can read own roadmap progress" on public.roadmap_progress;
drop policy if exists "roadmap_progress_select" on public.roadmap_progress;
create policy "roadmap_progress_select" on public.roadmap_progress
  for select to authenticated using (auth.uid() = user_id);

alter table if exists public.counselor_messages enable row level security;
drop policy if exists "Users can read own counselor messages" on public.counselor_messages;
drop policy if exists "counselor_messages_select" on public.counselor_messages;
create policy "counselor_messages_select" on public.counselor_messages
  for select to authenticated using (auth.uid() = user_id);

-- =============================================================================
-- 9. Subscriptions, commenters, activity extraction tracking
-- =============================================================================

alter table if exists public.user_subscriptions enable row level security;
drop policy if exists "Users can read own subscription" on public.user_subscriptions;
create policy "Users can read own subscription" on public.user_subscriptions
  for select to authenticated using (auth.uid() = user_id);

alter table if exists public.student_commenters enable row level security;
drop policy if exists "student_commenters_select_own" on public.student_commenters;
drop policy if exists "student_commenters_select_as_commenter" on public.student_commenters;
drop policy if exists "student_commenters_insert" on public.student_commenters;
drop policy if exists "student_commenters_delete" on public.student_commenters;
create policy "student_commenters_select_own" on public.student_commenters
  for select to authenticated using (student_id = auth.uid());
create policy "student_commenters_select_as_commenter" on public.student_commenters
  for select to authenticated using (
    commenter_email = lower(coalesce(auth.jwt() ->> 'email', ''))
  );
create policy "student_commenters_insert" on public.student_commenters
  for insert to authenticated with check (student_id = auth.uid());
create policy "student_commenters_delete" on public.student_commenters
  for delete to authenticated using (student_id = auth.uid());

alter table if exists public.activity_extraction_runs enable row level security;
drop policy if exists "activity_extraction_runs_select" on public.activity_extraction_runs;
create policy "activity_extraction_runs_select" on public.activity_extraction_runs
  for select to authenticated using (auth.uid() = user_id);
