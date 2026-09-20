-- Read-only checks. Run against the real schema before the reliability migration.
-- Every duplicate result requires reconciliation that preserves user writing.
select user_id,college_prompt_id,count(*) from public.essays group by 1,2 having count(*)>1;
select essay_id,count(*) from public.essay_versions where is_current group by 1 having count(*)>1;
select user_id,question_id,count(*) from public.discovery_answers group by 1,2 having count(*)>1;
select user_id,source_foundation_id,count(*) from public.user_extracurriculars
 where source_foundation_id is not null group by 1,2 having count(*)>1;
select essay_id,user_id,count(*) from public.essay_permissions group by 1,2 having count(*)>1;
select sort_order,cycle,count(*) from public.college_prompts
 where college_id='a0000000-0000-0000-0000-000000000000' group by 1,2 order by 1,2;
-- Inspect all policies, not just the known legacy policy replaced by the migration.
select tablename,policyname,cmd,roles,qual,with_check from pg_policies
 where schemaname='public' and tablename in ('essays','essay_versions','essay_permissions','essay_invitations','essay_comments','user_colleges','user_extracurriculars','foundations_activities')
 order by tablename,policyname;
select tablename,indexname,indexdef from pg_indexes where schemaname='public'
 and tablename in ('essays','essay_versions','essay_permissions','discovery_answers','user_extracurriculars');
-- Verify types, defaults, extra NOT NULL columns, and the foundation mirror prerequisites.
select table_name,column_name,data_type,is_nullable,column_default from information_schema.columns
 where table_schema='public' and table_name in ('essays','essay_versions','essay_permissions','essay_invitations','discovery_answers','user_extracurriculars','foundations_activities','conversation_messages','counselor_messages','user_colleges')
 order by table_name,ordinal_position;
