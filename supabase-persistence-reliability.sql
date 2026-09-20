-- Apply to an isolated Supabase test project first; see PERSISTENCE-RELEASE.md.
-- Additive migration. No essay, draft, comment, or permission records are deleted.
begin;
alter table public.essays add column if not exists revision bigint not null default 0;
alter table public.essays add column if not exists last_save_request uuid;
alter table public.essay_versions add column if not exists is_checkpoint boolean not null default true;

-- The user session executes this function: ownership and existing RLS both apply.
create or replace function public.save_essay_draft(
  p_prompt_id uuid, p_content text, p_expected_revision bigint,
  p_request_id uuid, p_checkpoint boolean default false
) returns jsonb language plpgsql security invoker set search_path = public as $$
declare
  e public.essays%rowtype;
  v public.essay_versions%rowtype;
  n integer;
  duplicate_count integer;
begin
  if auth.uid() is null then raise exception 'Not authenticated'; end if;
  if p_request_id is null or p_expected_revision is null or p_content is null then
    raise exception 'Missing save information';
  end if;
  if length(p_content) > 100000 then raise exception 'Draft exceeds 100,000 characters'; end if;
  perform pg_advisory_xact_lock(hashtextextended(auth.uid()::text || ':' || p_prompt_id::text, 0));
  select count(*) into duplicate_count from public.essays where user_id = auth.uid() and college_prompt_id = p_prompt_id;
  if duplicate_count > 1 then raise exception 'Duplicate essay records need reconciliation. Your draft has been retained.'; end if;
  select * into e from public.essays where user_id = auth.uid() and college_prompt_id = p_prompt_id for update;
  if e.id is null then
    if p_expected_revision <> 0 then raise exception 'SAVE_CONFLICT: essay changed or was removed'; end if;
    insert into public.essays(user_id, college_prompt_id) values(auth.uid(), p_prompt_id) returning * into e;
  end if;
  select * into v from public.essay_versions where essay_id=e.id order by is_current desc nulls last, version_number desc limit 1;
  -- Idempotent retry after a response was lost.
  if e.last_save_request = p_request_id then
    return jsonb_build_object('essay_id', e.id, 'revision', e.revision, 'version', case when v.id is null then null else to_jsonb(v) end);
  end if;
  if e.revision <> p_expected_revision then raise exception 'SAVE_CONFLICT: a newer draft exists. Copy your text before reloading.'; end if;
  if v.id is null or v.is_checkpoint or p_checkpoint then
    select coalesce(max(version_number),0)+1 into n from public.essay_versions where essay_id=e.id;
    update public.essay_versions set is_current=false where essay_id=e.id;
    insert into public.essay_versions(essay_id,version_number,content,word_count,is_current,is_checkpoint)
      values(e.id,n,p_content,case when btrim(p_content)='' then 0 else cardinality(regexp_split_to_array(btrim(p_content),'\s+')) end,true,p_checkpoint)
      returning * into v;
  else
    update public.essay_versions set is_current=false where essay_id=e.id and id<>v.id;
    update public.essay_versions set content=p_content,is_current=true,
      word_count=case when btrim(p_content)='' then 0 else cardinality(regexp_split_to_array(btrim(p_content),'\s+')) end
      where id=v.id and essay_id=e.id returning * into v;
    if v.id is null then raise exception 'Draft was not updated'; end if;
  end if;
  update public.essays set revision=revision+1,last_save_request=p_request_id where id=e.id and user_id=auth.uid() returning * into e;
  return jsonb_build_object('essay_id',e.id,'revision',e.revision,'version',to_jsonb(v));
end $$;
revoke all on function public.save_essay_draft(uuid,text,bigint,uuid,boolean) from public, anon;
grant execute on function public.save_essay_draft(uuid,text,bigint,uuid,boolean) to authenticated;

create or replace function public.delete_essay_version(p_version_id uuid,p_expected_revision bigint)
returns jsonb language plpgsql security invoker set search_path=public as $$
declare e public.essays%rowtype; target public.essay_versions%rowtype; v public.essay_versions%rowtype;
begin
  if auth.uid() is null then raise exception 'Not authenticated'; end if;
  select * into target from public.essay_versions where id=p_version_id;
  if target.id is null then raise exception 'Version not found'; end if;
  select * into e from public.essays where id=target.essay_id and user_id=auth.uid() for update;
  if e.id is null then raise exception 'Version not found'; end if;
  if e.revision <> p_expected_revision then raise exception 'SAVE_CONFLICT: essay changed. Reload before deleting.'; end if;
  delete from public.essay_versions where id=target.id;
  if not found then raise exception 'Version was not deleted'; end if;
  select * into v from public.essay_versions where essay_id=e.id order by is_current desc nulls last,version_number desc limit 1;
  update public.essay_versions set is_current=(id=v.id) where essay_id=e.id;
  update public.essays set revision=revision+1,last_save_request=null where id=e.id returning * into e;
  return jsonb_build_object('essay_id',e.id,'revision',e.revision,'version',case when v.id is null then null else to_jsonb(v) || '{"is_current":true}'::jsonb end);
end $$;
revoke all on function public.delete_essay_version(uuid,bigint) from public,anon;
grant execute on function public.delete_essay_version(uuid,bigint) to authenticated;
-- A repeated answer must update exactly the same student/question pair.
-- Abort rather than discard any legacy duplicate answers.
do $$ begin
  if exists(select 1 from public.discovery_answers group by user_id,question_id having count(*)>1) then
    raise exception 'Reconcile duplicate discovery_answers before applying this migration; no answers were deleted';
  end if;
end $$;
create unique index if not exists discovery_answers_user_question_key on public.discovery_answers(user_id,question_id);

alter table public.conversation_messages add column if not exists turn_id uuid;
alter table public.counselor_messages add column if not exists turn_id uuid;
alter table public.counselor_messages add column if not exists is_free boolean not null default false;
create unique index if not exists conversation_turn_role_key on public.conversation_messages(user_id,turn_id,role);
create unique index if not exists counselor_turn_role_key on public.counselor_messages(user_id,turn_id,role);

create or replace function public.set_application_plan(p_college_id text,p_plan text)
returns setof public.user_colleges language plpgsql security invoker set search_path=public as $$
begin
  if auth.uid() is null then raise exception 'Not authenticated'; end if;
  if p_plan is not null and p_plan not in ('ED','REA','ED2','EA','RD') then raise exception 'Invalid application plan'; end if;
  perform pg_advisory_xact_lock(hashtextextended(auth.uid()::text || ':application-plans',0));
  if not exists(select 1 from public.user_colleges where user_id=auth.uid() and college_id=p_college_id) then raise exception 'College not found in your list'; end if;
  if p_plan in ('ED','REA') then
    update public.user_colleges set application_plan=null where user_id=auth.uid() and college_id<>p_college_id and application_plan in ('ED','REA');
  elsif p_plan='ED2' then
    update public.user_colleges set application_plan=null where user_id=auth.uid() and college_id<>p_college_id and application_plan='ED2';
  end if;
  update public.user_colleges set application_plan=p_plan where user_id=auth.uid() and college_id=p_college_id;
  if not found then raise exception 'Application plan was not updated'; end if;
  return query select * from public.user_colleges where user_id=auth.uid();
end $$;
revoke all on function public.set_application_plan(text,text) from public,anon;
grant execute on function public.set_application_plan(text,text) to authenticated;

-- Acceptance is atomic and recipient-verified; clients cannot self-grant access.
alter table public.essay_invitations add column if not exists status text not null default 'pending';
alter table public.essay_invitations add column if not exists student_name text;
alter table public.essay_invitations add column if not exists expires_at timestamptz;
alter table public.essay_invitations alter column expires_at set default (now()+interval '30 days');
alter table public.essay_permissions add column if not exists role text not null default 'other';
alter table public.essay_permissions add column if not exists commenter_name text;
alter table public.essay_permissions add column if not exists granted_by uuid references auth.users(id);
alter table public.essay_invitations add column if not exists accepted_at timestamptz;
alter table public.essay_invitations add column if not exists accepted_by_user_id uuid references auth.users(id);

-- All permission grants now pass through the recipient-verified acceptance RPC.
-- Restrictive guards also block old permissive self-upsert/owner-grant policies.
drop policy if exists essay_permissions_insert on public.essay_permissions;
drop policy if exists essay_permissions_upsert on public.essay_permissions;
drop policy if exists permission_insert_guard on public.essay_permissions;
create policy permission_insert_guard on public.essay_permissions as restrictive
for insert to authenticated with check(false);
drop policy if exists permission_update_guard on public.essay_permissions;
create policy permission_update_guard on public.essay_permissions as restrictive
for update to authenticated using(false) with check(false);

-- An invitee can read their invitation, but cannot rewrite its essay/recipient/status.
drop policy if exists invitation_update_guard on public.essay_invitations;
create policy invitation_update_guard on public.essay_invitations as restrictive
for update to authenticated
using(student_id=auth.uid() and exists(select 1 from public.essays e where e.id=essay_id and e.user_id=auth.uid()))
with check(student_id=auth.uid() and exists(select 1 from public.essays e where e.id=essay_id and e.user_id=auth.uid()));

create or replace function public.accept_essay_invitation(p_token text)
returns uuid language plpgsql security definer set search_path=public as $$
declare inv public.essay_invitations%rowtype; recipient text;
begin
  if auth.uid() is null then raise exception 'Sign in before accepting'; end if;
  select lower(email) into recipient from auth.users where id=auth.uid() and email_confirmed_at is not null;
  if recipient is null then raise exception 'Confirm your email before accepting this invitation'; end if;
  select * into inv from public.essay_invitations where token=p_token for update;
  if inv.id is null or lower(btrim(inv.invitee_email))<>recipient or inv.status not in ('pending','accepted')
     or (inv.accepted_by_user_id is not null and inv.accepted_by_user_id<>auth.uid())
     or (inv.expires_at is not null and inv.expires_at < now()) then raise exception 'Invitation not available for this account'; end if;
  if not exists(select 1 from public.essays where id=inv.essay_id and user_id=inv.student_id) then raise exception 'Invitation not available'; end if;
  insert into public.essay_permissions(essay_id,user_id,role,commenter_name,granted_by)
    values(inv.essay_id,auth.uid(),inv.role,coalesce(inv.invitee_name,recipient),inv.student_id)
    on conflict(essay_id,user_id) do update set role=excluded.role,commenter_name=excluded.commenter_name,granted_by=excluded.granted_by;
  update public.essay_invitations set status='accepted',accepted_by_user_id=auth.uid(),accepted_at=coalesce(accepted_at,now()) where id=inv.id;
  return inv.essay_id;
end $$;
revoke all on function public.accept_essay_invitation(text) from public,anon;
grant execute on function public.accept_essay_invitation(text) to authenticated;

-- Small membership helper prevents recursive essay/permission RLS policies.
create or replace function public.can_review_essay(p_essay_id uuid)
returns boolean language sql stable security definer set search_path=public as $$
  select auth.uid() is not null and exists(
    select 1 from public.essay_permissions ep
    join auth.users u on u.id=ep.user_id
    join public.essay_invitations i on i.essay_id=ep.essay_id and lower(btrim(i.invitee_email))=lower(u.email)
    join public.essays e on e.id=i.essay_id and e.user_id=i.student_id
    where ep.essay_id=p_essay_id and ep.user_id=auth.uid() and u.email_confirmed_at is not null
      and (i.accepted_by_user_id is null or i.accepted_by_user_id=auth.uid())
      and i.role=ep.role and i.status='accepted' and (i.expires_at is null or i.expires_at>=now())
  );
$$;
revoke all on function public.can_review_essay(uuid) from public,anon;
grant execute on function public.can_review_essay(uuid) to authenticated;
-- Replace the live legacy helper too, so old policies cannot bypass verification.
create or replace function public.user_has_essay_permission(p_essay_id uuid,p_user_id uuid)
returns boolean language sql stable security definer set search_path=public as $$
  select p_user_id=auth.uid() and public.can_review_essay(p_essay_id);
$$;
revoke all on function public.user_has_essay_permission(uuid,uuid) from public,anon;
grant execute on function public.user_has_essay_permission(uuid,uuid) to authenticated;
drop policy if exists "Reviewers can read permitted essays" on public.essays;
drop policy if exists "Reviewers can read permitted essay versions" on public.essay_versions;
drop policy if exists essays_reviewer_read on public.essays;
create policy essays_reviewer_read on public.essays for select to authenticated using(public.can_review_essay(id));
drop policy if exists essay_versions_reviewer_read on public.essay_versions;
create policy essay_versions_reviewer_read on public.essay_versions for select to authenticated using(public.can_review_essay(essay_id));

create or replace function public.comment_access_scope(p_version_id uuid)
returns text language sql stable security definer set search_path=public as $$
  select case
    when e.user_id=auth.uid() then 'owner'
    when public.user_has_essay_permission(e.id,auth.uid()) then 'reviewer'
    else null
  end
  from public.essay_versions v join public.essays e on e.id=v.essay_id
  where v.id=p_version_id and auth.uid() is not null;
$$;
revoke all on function public.comment_access_scope(uuid) from public,anon;
grant execute on function public.comment_access_scope(uuid) to authenticated;

-- RESTRICTIVE guards are ANDed with every existing permissive policy,
-- including comments_select USING(true). Legacy policy names cannot bypass them.
drop policy if exists comment_read_guard on public.counselor_comments;
create policy comment_read_guard on public.counselor_comments
as restrictive for select to authenticated
using(public.comment_access_scope(essay_version_id) is not null);

drop policy if exists comment_insert_guard on public.counselor_comments;
create policy comment_insert_guard on public.counselor_comments
as restrictive for insert to authenticated
with check(counselor_id=auth.uid() and public.comment_access_scope(essay_version_id) is not null);

drop policy if exists comment_update_guard on public.counselor_comments;
create policy comment_update_guard on public.counselor_comments
as restrictive for update to authenticated
using(public.comment_access_scope(essay_version_id)='owner' or
  (counselor_id=auth.uid() and public.comment_access_scope(essay_version_id)='reviewer'))
with check(public.comment_access_scope(essay_version_id)='owner' or
  (counselor_id=auth.uid() and public.comment_access_scope(essay_version_id)='reviewer'));

drop policy if exists comment_delete_guard on public.counselor_comments;
create policy comment_delete_guard on public.counselor_comments
as restrictive for delete to authenticated
using(public.comment_access_scope(essay_version_id)='owner' or
  (counselor_id=auth.uid() and public.comment_access_scope(essay_version_id)='reviewer'));

-- Shared activity fields stay synchronized; Applications descriptions/dates are untouched.
-- Existing conflicting pairs are not bulk-overwritten. The next explicit edit wins.
do $$ begin
  if exists(select 1 from public.user_extracurriculars where source_foundation_id is not null group by user_id,source_foundation_id having count(*)>1) then
    raise exception 'Reconcile duplicate activity mirrors before applying this migration; no activity was deleted';
  end if;
end $$;
create unique index if not exists extracurricular_foundation_key on public.user_extracurriculars(user_id,source_foundation_id);
create or replace function public.sync_foundation_activity()
returns trigger language plpgsql security definer set search_path=public as $$
begin
  if pg_trigger_depth()>1 then return coalesce(new,old); end if;
  if tg_op='DELETE' then
    delete from public.user_extracurriculars where source_foundation_id=old.id and user_id=old.user_id;
    return old;
  end if;
  if new.confirmed then
    insert into public.user_extracurriculars(user_id,source_foundation_id,activity_name,role,status,depth,thread,trajectory,hours,since)
      values(new.user_id,new.id,new.name,nullif(new.role,''),'accepted',new.depth,new.thread,new.trajectory,new.hours,new.since)
      on conflict(user_id,source_foundation_id) do update set activity_name=excluded.activity_name,role=excluded.role,
        depth=excluded.depth,thread=excluded.thread,trajectory=excluded.trajectory,hours=excluded.hours,since=excluded.since;
  end if;
  return new;
end $$;
revoke all on function public.sync_foundation_activity() from public,anon,authenticated;
drop trigger if exists sync_foundation_activity on public.foundations_activities;
create trigger sync_foundation_activity after insert or update or delete on public.foundations_activities for each row execute function public.sync_foundation_activity();

create or replace function public.sync_application_activity()
returns trigger language plpgsql security definer set search_path=public as $$
begin
  if pg_trigger_depth()>1 then return coalesce(new,old); end if;
  if tg_op='DELETE' then
    delete from public.foundations_activities where id=old.source_foundation_id and user_id=old.user_id;
    return old;
  end if;
  if new.source_foundation_id is not null and (new.activity_name is distinct from old.activity_name or new.role is distinct from old.role) then
    update public.foundations_activities set name=new.activity_name,role=coalesce(new.role,''),updated_at=now()
      where id=new.source_foundation_id and user_id=new.user_id;
  end if;
  return new;
end $$;
revoke all on function public.sync_application_activity() from public,anon,authenticated;
drop trigger if exists sync_application_activity on public.user_extracurriculars;
create trigger sync_application_activity after update or delete on public.user_extracurriculars for each row execute function public.sync_application_activity();

commit;
