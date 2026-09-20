-- Schema and policies supplied by the user on 2026-09-20; no student data.
create table colleges(id text primary key,name text);
create table college_prompts(id uuid primary key default gen_random_uuid(),college_id text references colleges,prompt_text text,word_limit integer,year integer,sort_order integer,cycle text,released_at timestamptz);
create table "essays"("college_prompt_id" uuid not null,
"created_at" timestamp with time zone default now(),
"id" uuid not null default gen_random_uuid(),
"updated_at" timestamp with time zone default now(),
"user_id" uuid not null);
create table "essay_versions"("content" text not null,
"created_at" timestamp with time zone default now(),
"essay_id" uuid not null,
"id" uuid not null default gen_random_uuid(),
"is_current" boolean default true,
"version_number" integer not null,
"word_count" integer default 0);
create table "essay_invitations"("accepted_at" timestamp with time zone,
"accepted_by_user_id" uuid,
"created_at" timestamp with time zone default now(),
"essay_id" uuid not null,
"expires_at" timestamp with time zone default (now() + '30 days'::interval),
"id" uuid not null default gen_random_uuid(),
"invitee_email" text not null,
"invitee_name" text,
"role" text not null,
"status" text not null default 'pending'::text,
"student_id" uuid not null,
"student_name" text,
"token" text not null default (gen_random_uuid())::text);
create table "essay_permissions"("commenter_name" text,
"created_at" timestamp with time zone default now(),
"essay_id" uuid not null,
"granted_by" uuid,
"id" uuid not null default gen_random_uuid(),
"role" text not null,
"user_id" uuid not null);
create table "discovery_answers"("answer" text not null,
"created_at" timestamp with time zone default now(),
"id" uuid not null default gen_random_uuid(),
"question_id" text not null,
"updated_at" timestamp with time zone default now(),
"user_id" uuid not null);
create table "conversation_messages"("content" text not null,
"created_at" timestamp with time zone not null default now(),
"id" uuid not null default gen_random_uuid(),
"role" text not null,
"user_id" uuid not null);
create table "counselor_messages"("content" text not null,
"created_at" timestamp with time zone not null default now(),
"id" uuid not null default gen_random_uuid(),
"role" text not null,
"user_id" uuid not null);
create table "user_colleges"("added_at" timestamp with time zone default now(),
"app_status" text,
"application_plan" text,
"college_id" text not null,
"id" uuid not null default gen_random_uuid(),
"user_id" uuid not null);
create table "foundations_activities"("confirmed" boolean not null default true,
"created_at" timestamp with time zone not null default now(),
"depth" integer not null default 1,
"end_date" date,
"hours" text not null default ''::text,
"id" uuid not null default gen_random_uuid(),
"name" text not null,
"role" text not null default ''::text,
"since" text not null default ''::text,
"source" text not null default 'student'::text,
"start_date" date,
"thread" text not null default ''::text,
"trajectory" text not null default ''::text,
"updated_at" timestamp with time zone not null default now(),
"user_id" uuid not null);
create table "user_extracurriculars"("activity_name" text not null,
"created_at" timestamp with time zone default now(),
"depth" integer,
"description" text,
"end_date" date,
"hours" text,
"id" uuid not null default gen_random_uuid(),
"role" text,
"since" text,
"source_foundation_id" uuid,
"source_question_id" text,
"start_date" date,
"status" text not null default 'accepted'::text,
"suggested_at" timestamp with time zone,
"thread" text,
"trajectory" text,
"updated_at" timestamp with time zone default now(),
"user_id" uuid not null);
create table counselor_comments(id uuid primary key default gen_random_uuid(),essay_version_id uuid not null,counselor_id uuid not null,comment_text text);
CREATE UNIQUE INDEX conversation_messages_pkey ON public.conversation_messages USING btree (id);
CREATE INDEX conversation_messages_user_idx ON public.conversation_messages USING btree (user_id, created_at);
CREATE UNIQUE INDEX counselor_messages_pkey ON public.counselor_messages USING btree (id);
CREATE INDEX counselor_messages_user_month_idx ON public.counselor_messages USING btree (user_id, created_at DESC);
CREATE UNIQUE INDEX discovery_answers_pkey ON public.discovery_answers USING btree (id);
CREATE UNIQUE INDEX discovery_answers_user_id_question_id_key ON public.discovery_answers USING btree (user_id, question_id);
CREATE INDEX idx_discovery_answers_user_id ON public.discovery_answers USING btree (user_id);
CREATE UNIQUE INDEX essay_invitations_pkey ON public.essay_invitations USING btree (id);
CREATE UNIQUE INDEX essay_invitations_token_key ON public.essay_invitations USING btree (token);
CREATE INDEX idx_essay_invitations_essay_id ON public.essay_invitations USING btree (essay_id);
CREATE INDEX idx_essay_invitations_invitee_email ON public.essay_invitations USING btree (invitee_email);
CREATE INDEX idx_essay_invitations_student_id ON public.essay_invitations USING btree (student_id);
CREATE INDEX idx_essay_invitations_token ON public.essay_invitations USING btree (token);
CREATE UNIQUE INDEX essay_permissions_essay_id_user_id_key ON public.essay_permissions USING btree (essay_id, user_id);
CREATE UNIQUE INDEX essay_permissions_pkey ON public.essay_permissions USING btree (id);
CREATE INDEX idx_essay_permissions_essay_id ON public.essay_permissions USING btree (essay_id);
CREATE INDEX idx_essay_permissions_user_id ON public.essay_permissions USING btree (user_id);
CREATE UNIQUE INDEX essay_versions_essay_id_version_number_key ON public.essay_versions USING btree (essay_id, version_number);
CREATE UNIQUE INDEX essay_versions_pkey ON public.essay_versions USING btree (id);
CREATE INDEX idx_essay_versions_current ON public.essay_versions USING btree (essay_id, is_current) WHERE (is_current = true);
CREATE INDEX idx_essay_versions_essay_id ON public.essay_versions USING btree (essay_id);
CREATE UNIQUE INDEX essays_pkey ON public.essays USING btree (id);
CREATE UNIQUE INDEX essays_user_id_college_prompt_id_key ON public.essays USING btree (user_id, college_prompt_id);
CREATE INDEX idx_essays_college_prompt_id ON public.essays USING btree (college_prompt_id);
CREATE INDEX idx_essays_user_id ON public.essays USING btree (user_id);
CREATE UNIQUE INDEX foundations_activities_pkey ON public.foundations_activities USING btree (id);
CREATE INDEX foundations_activities_user_idx ON public.foundations_activities USING btree (user_id, created_at);
CREATE INDEX idx_user_colleges_college_id ON public.user_colleges USING btree (college_id);
CREATE INDEX idx_user_colleges_user_id ON public.user_colleges USING btree (user_id);
CREATE UNIQUE INDEX user_colleges_pkey ON public.user_colleges USING btree (id);
CREATE UNIQUE INDEX user_colleges_user_id_college_id_key ON public.user_colleges USING btree (user_id, college_id);
CREATE INDEX idx_user_extracurriculars_user_id ON public.user_extracurriculars USING btree (user_id);
CREATE UNIQUE INDEX user_extracurriculars_pkey ON public.user_extracurriculars USING btree (id);
CREATE INDEX user_extracurriculars_source_foundation_id_idx ON public.user_extracurriculars USING btree (source_foundation_id);
CREATE INDEX user_extracurriculars_user_status_idx ON public.user_extracurriculars USING btree (user_id, status);
alter table "essays" add foreign key(user_id) references auth.users(id);
alter table "essays" add foreign key(college_prompt_id) references college_prompts(id) on delete cascade;
alter table "essay_versions" add foreign key(essay_id) references essays(id) on delete cascade;
alter table "essay_versions" add check(content<>'INJECT_FAILURE');
alter table "essay_invitations" add foreign key(essay_id) references essays(id) on delete cascade;
alter table "essay_invitations" add foreign key(student_id) references auth.users(id);
alter table "essay_invitations" add foreign key(accepted_by_user_id) references auth.users(id);
alter table "essay_invitations" add check(status in ('pending','accepted','declined','expired'));
alter table "essay_invitations" add check(role in ('parent','counselor','mentor','other'));
alter table "essay_permissions" add foreign key(essay_id) references essays(id) on delete cascade;
alter table "essay_permissions" add foreign key(user_id) references auth.users(id);
alter table "essay_permissions" add foreign key(granted_by) references auth.users(id);
alter table "essay_permissions" add check(role in ('student','parent','counselor','mentor','other'));
alter table "foundations_activities" add check(source in ('student','conversation'));
alter table "foundations_activities" add check(depth between 1 and 5);
alter table "user_extracurriculars" add check(status in ('accepted','suggested','rejected'));
alter table "user_colleges" add foreign key(college_id) references colleges(id) on delete cascade;
alter table "counselor_comments" add foreign key(essay_version_id) references essay_versions(id) on delete cascade;
alter table "counselor_comments" add foreign key(counselor_id) references auth.users(id);
create function user_has_essay_permission(p_essay_id uuid,p_user_id uuid) returns boolean language sql stable security definer set search_path=public as $$select exists(select 1 from essay_permissions where essay_id=p_essay_id and user_id=p_user_id)$$;
alter table "essays" enable row level security;
create policy "Reviewers can read permitted essays" on "essays" for SELECT to authenticated using(user_has_essay_permission(id, auth.uid()));
create policy "Users can delete own essays" on "essays" for DELETE to authenticated using((auth.uid() = user_id));
create policy "Users can delete their own essays" on "essays" for DELETE to public using((auth.uid() = user_id));
create policy "Users can insert own essays" on "essays" for INSERT to public with check((auth.uid() = user_id));
create policy "Users can insert their own essays" on "essays" for INSERT to public with check((auth.uid() = user_id));
create policy "Users can read own essays" on "essays" for SELECT to public using((auth.uid() = user_id));
create policy "Users can update own essays" on "essays" for UPDATE to public using((auth.uid() = user_id));
create policy "Users can update their own essays" on "essays" for UPDATE to public using((auth.uid() = user_id));
create policy "Users can view their own essays" on "essays" for SELECT to public using((auth.uid() = user_id));
alter table "essay_versions" enable row level security;
create policy "Reviewers can read permitted essay versions" on "essay_versions" for SELECT to authenticated using(user_has_essay_permission(essay_id, auth.uid()));
create policy "Users can delete versions of their essays" on "essay_versions" for DELETE to public using((EXISTS ( SELECT 1
   FROM essays
  WHERE ((essays.id = essay_versions.essay_id) AND (essays.user_id = auth.uid())))));
create policy "Users can insert versions for own essays" on "essay_versions" for INSERT to public with check((EXISTS ( SELECT 1
   FROM essays e
  WHERE ((e.id = essay_versions.essay_id) AND (e.user_id = auth.uid())))));
create policy "Users can insert versions of their essays" on "essay_versions" for INSERT to public with check((EXISTS ( SELECT 1
   FROM essays
  WHERE ((essays.id = essay_versions.essay_id) AND (essays.user_id = auth.uid())))));
create policy "Users can read versions of own essays" on "essay_versions" for SELECT to public using((EXISTS ( SELECT 1
   FROM essays e
  WHERE ((e.id = essay_versions.essay_id) AND (e.user_id = auth.uid())))));
create policy "Users can update versions of own essays" on "essay_versions" for UPDATE to public using((EXISTS ( SELECT 1
   FROM essays e
  WHERE ((e.id = essay_versions.essay_id) AND (e.user_id = auth.uid())))));
create policy "Users can update versions of their essays" on "essay_versions" for UPDATE to public using((EXISTS ( SELECT 1
   FROM essays
  WHERE ((essays.id = essay_versions.essay_id) AND (essays.user_id = auth.uid())))));
create policy "Users can view versions of their essays" on "essay_versions" for SELECT to public using((EXISTS ( SELECT 1
   FROM essays
  WHERE ((essays.id = essay_versions.essay_id) AND (essays.user_id = auth.uid())))));
alter table "essay_invitations" enable row level security;
create policy "Students can create invitations for their essays" on "essay_invitations" for INSERT to public with check(((EXISTS ( SELECT 1
   FROM essays
  WHERE ((essays.id = essay_invitations.essay_id) AND (essays.user_id = auth.uid())))) AND (auth.uid() = student_id)));
create policy "essay_invitations_insert_owner" on "essay_invitations" for INSERT to authenticated with check(((student_id = auth.uid()) AND (EXISTS ( SELECT 1
   FROM essays e
  WHERE ((e.id = essay_invitations.essay_id) AND (e.user_id = auth.uid()))))));
create policy "essay_invitations_select" on "essay_invitations" for SELECT to authenticated using(((student_id = auth.uid()) OR (invitee_email = lower(COALESCE((auth.jwt() ->> 'email'::text), ''::text)))));
create policy "essay_invitations_update" on "essay_invitations" for UPDATE to authenticated using(((student_id = auth.uid()) OR (invitee_email = lower(COALESCE((auth.jwt() ->> 'email'::text), ''::text))))) with check(((student_id = auth.uid()) OR (invitee_email = lower(COALESCE((auth.jwt() ->> 'email'::text), ''::text)))));
alter table "essay_permissions" enable row level security;
create policy "Students can grant permissions" on "essay_permissions" for INSERT to public with check(((auth.uid() = granted_by) AND (auth.uid() IN ( SELECT essays.user_id
   FROM essays
  WHERE (essays.id = essay_permissions.essay_id)))));
create policy "Students can revoke permissions" on "essay_permissions" for DELETE to public using((auth.uid() IN ( SELECT essays.user_id
   FROM essays
  WHERE (essays.id = essay_permissions.essay_id))));
create policy "essay_permissions_insert" on "essay_permissions" for INSERT to authenticated with check(((user_id = auth.uid()) AND (EXISTS ( SELECT 1
   FROM essay_invitations i
  WHERE ((i.essay_id = essay_permissions.essay_id) AND (i.invitee_email = lower(COALESCE((auth.jwt() ->> 'email'::text), ''::text))))))));
create policy "essay_permissions_select" on "essay_permissions" for SELECT to authenticated using(((user_id = auth.uid()) OR (essay_id IN ( SELECT essays.id
   FROM essays
  WHERE (essays.user_id = auth.uid())))));
create policy "essay_permissions_upsert" on "essay_permissions" for UPDATE to authenticated using((user_id = auth.uid())) with check(((user_id = auth.uid()) AND (EXISTS ( SELECT 1
   FROM essay_invitations i
  WHERE ((i.essay_id = essay_permissions.essay_id) AND (i.invitee_email = lower(COALESCE((auth.jwt() ->> 'email'::text), ''::text))))))));
alter table "discovery_answers" enable row level security;
create policy "Users can insert their own discovery answers" on "discovery_answers" for INSERT to public with check((auth.uid() = user_id));
create policy "Users can manage their own discovery answers" on "discovery_answers" for ALL to public using((auth.uid() = user_id));
create policy "Users can update their own discovery answers" on "discovery_answers" for UPDATE to public using((auth.uid() = user_id));
create policy "Users can view their own discovery answers" on "discovery_answers" for SELECT to public using((auth.uid() = user_id));
create policy "discovery_answers_delete" on "discovery_answers" for DELETE to authenticated using((auth.uid() = user_id));
create policy "discovery_answers_insert" on "discovery_answers" for INSERT to authenticated with check((auth.uid() = user_id));
create policy "discovery_answers_select" on "discovery_answers" for SELECT to authenticated using((auth.uid() = user_id));
create policy "discovery_answers_update" on "discovery_answers" for UPDATE to authenticated using((auth.uid() = user_id)) with check((auth.uid() = user_id));
alter table "conversation_messages" enable row level security;
create policy "Users can read own conversation messages" on "conversation_messages" for SELECT to public using((auth.uid() = user_id));
alter table "counselor_messages" enable row level security;
create policy "Users can read own counselor messages" on "counselor_messages" for SELECT to public using((auth.uid() = user_id));
alter table "user_colleges" enable row level security;
create policy "Users can delete their own user colleges" on "user_colleges" for DELETE to public using((auth.uid() = user_id));
create policy "Users can insert their own user colleges" on "user_colleges" for INSERT to public with check((auth.uid() = user_id));
create policy "Users can manage their own colleges" on "user_colleges" for ALL to public using((auth.uid() = user_id));
create policy "Users can view their own user colleges" on "user_colleges" for SELECT to public using((auth.uid() = user_id));
create policy "Users update own user_colleges" on "user_colleges" for UPDATE to public using((auth.uid() = user_id)) with check((auth.uid() = user_id));
alter table "foundations_activities" enable row level security;
create policy "Users can read own activities" on "foundations_activities" for SELECT to public using((auth.uid() = user_id));
alter table "user_extracurriculars" enable row level security;
create policy "Users can delete their own extracurriculars" on "user_extracurriculars" for DELETE to public using((auth.uid() = user_id));
create policy "Users can insert their own extracurriculars" on "user_extracurriculars" for INSERT to public with check((auth.uid() = user_id));
create policy "Users can update their own extracurriculars" on "user_extracurriculars" for UPDATE to public using((auth.uid() = user_id));
create policy "Users can view their own extracurriculars" on "user_extracurriculars" for SELECT to public using((auth.uid() = user_id));
create policy "user_extracurriculars_delete" on "user_extracurriculars" for DELETE to authenticated using((auth.uid() = user_id));
create policy "user_extracurriculars_insert" on "user_extracurriculars" for INSERT to authenticated with check((auth.uid() = user_id));
create policy "user_extracurriculars_select" on "user_extracurriculars" for SELECT to authenticated using((auth.uid() = user_id));
create policy "user_extracurriculars_update" on "user_extracurriculars" for UPDATE to authenticated using((auth.uid() = user_id)) with check((auth.uid() = user_id));
alter table "counselor_comments" enable row level security;
create policy "Counselors can delete their own comments" on "counselor_comments" for DELETE to public using((auth.uid() = counselor_id));
create policy "Counselors can insert comments" on "counselor_comments" for INSERT to public with check((auth.uid() = counselor_id));
create policy "Counselors can update their own comments" on "counselor_comments" for UPDATE to public using((auth.uid() = counselor_id));
create policy "Users can insert comments if they have permission" on "counselor_comments" for INSERT to public with check(((EXISTS ( SELECT 1
   FROM (essay_versions ev
     JOIN essays e ON ((e.id = ev.essay_id)))
  WHERE ((ev.id = counselor_comments.essay_version_id) AND (e.user_id = auth.uid())))) OR (EXISTS ( SELECT 1
   FROM (essay_versions ev
     JOIN essay_permissions ep ON ((ep.essay_id = ev.essay_id)))
  WHERE ((ev.id = counselor_comments.essay_version_id) AND (ep.user_id = auth.uid()))))));
create policy "Users can view comments on essays they have access to" on "counselor_comments" for SELECT to public using(((EXISTS ( SELECT 1
   FROM (essay_versions ev
     JOIN essays e ON ((e.id = ev.essay_id)))
  WHERE ((ev.id = counselor_comments.essay_version_id) AND (e.user_id = auth.uid())))) OR (EXISTS ( SELECT 1
   FROM (essay_versions ev
     JOIN essay_permissions ep ON ((ep.essay_id = ev.essay_id)))
  WHERE ((ev.id = counselor_comments.essay_version_id) AND (ep.user_id = auth.uid())))) OR (counselor_id = auth.uid())));
create policy "Users can view comments on their essays" on "counselor_comments" for SELECT to public using((EXISTS ( SELECT 1
   FROM (essay_versions ev
     JOIN essays e ON ((e.id = ev.essay_id)))
  WHERE ((ev.id = counselor_comments.essay_version_id) AND ((e.user_id = auth.uid()) OR (counselor_comments.counselor_id = auth.uid()))))));
create policy "comments_delete_own" on "counselor_comments" for DELETE to authenticated using((auth.uid() = counselor_id));
create policy "comments_insert" on "counselor_comments" for INSERT to authenticated with check((auth.uid() = counselor_id));
create policy "comments_select" on "counselor_comments" for SELECT to authenticated using(true);
create policy "counselor_comments_owner_all" on "counselor_comments" for ALL to authenticated using((EXISTS ( SELECT 1
   FROM (essay_versions
     JOIN essays ON ((essays.id = essay_versions.essay_id)))
  WHERE ((essay_versions.id = counselor_comments.essay_version_id) AND (essays.user_id = auth.uid()))))) with check((EXISTS ( SELECT 1
   FROM (essay_versions
     JOIN essays ON ((essays.id = essay_versions.essay_id)))
  WHERE ((essay_versions.id = counselor_comments.essay_version_id) AND (essays.user_id = auth.uid())))));
