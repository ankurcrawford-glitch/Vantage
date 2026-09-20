-- Standalone containment for the live comment policies exported September 20.
-- Compatible with the currently deployed app. Does not change essay saving,
-- invitation acceptance, existing permission records, or any comment contents.
begin;
create or replace function public.comment_access_scope(p_version_id uuid)
returns text language sql stable security definer set search_path=public as $$
  select case
    when e.user_id=auth.uid() then 'owner'
    when exists(select 1 from public.essay_permissions ep
      where ep.essay_id=e.id and ep.user_id=auth.uid()) then 'reviewer'
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
commit;

select policyname,permissive,cmd
from pg_policies where schemaname='public' and tablename='counselor_comments'
  and policyname in ('comment_read_guard','comment_insert_guard','comment_update_guard','comment_delete_guard')
order by policyname;
