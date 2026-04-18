-- Security hardening migration. Run in Supabase SQL Editor.
-- Safe to run multiple times (uses drop-if-exists + create).
--
-- Addresses SECURITY-AUDIT.md findings:
--   Critical #4 — enable RLS on user-private tables that were missing it
--   Critical #5 — tighten essay_invitations select policy (was using(true))
--   Critical #6 — tighten essay_permissions select policy (was using(true))

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
