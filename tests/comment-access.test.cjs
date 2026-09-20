const {test,before,after}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {PGlite}=require('@electric-sql/pglite');
let db;
const owner='10000000-0000-4000-8000-000000000001',reviewer='10000000-0000-4000-8000-000000000002',stranger='10000000-0000-4000-8000-000000000003';
const essay='20000000-0000-4000-8000-000000000001',version='30000000-0000-4000-8000-000000000001';
const uid=async id=>db.exec(`reset role; select set_config('request.jwt.claim.sub','${id}',false); set role authenticated;`);
const migration=fs.readFileSync(path.join(__dirname,'..','supabase-comment-access-hotfix.sql'),'utf8');
before(async()=>{
 db=new PGlite();await db.exec(`
 create role anon;create role authenticated;create schema auth;
 create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
 create table essays(id uuid primary key,user_id uuid);
 create table essay_versions(id uuid primary key,essay_id uuid references essays);
 create table essay_permissions(essay_id uuid references essays,user_id uuid);
 create function user_has_essay_permission(p_essay_id uuid,p_user_id uuid) returns boolean language sql stable security definer set search_path=public as $$select exists(select 1 from essay_permissions where essay_id=p_essay_id and user_id=p_user_id)$$;
 create table counselor_comments(id uuid primary key default gen_random_uuid(),essay_version_id uuid references essay_versions,counselor_id uuid,comment_text text);
 grant usage on schema public,auth to authenticated,anon;
 grant all on all tables in schema public to authenticated;
 grant select on counselor_comments to anon;
 alter table counselor_comments enable row level security;
 create policy comments_select on counselor_comments for select to authenticated using(true);
 create policy comments_insert on counselor_comments for insert to authenticated with check(counselor_id=auth.uid());
 create policy comments_update_own on counselor_comments for update to authenticated using(counselor_id=auth.uid());
 create policy comments_delete_own on counselor_comments for delete to authenticated using(counselor_id=auth.uid());
 create policy owner_all on counselor_comments for all to authenticated using(exists(select 1 from essay_versions v join essays e on e.id=v.essay_id where v.id=essay_version_id and e.user_id=auth.uid())) with check(exists(select 1 from essay_versions v join essays e on e.id=v.essay_id where v.id=essay_version_id and e.user_id=auth.uid()));
 insert into essays values('${essay}','${owner}');insert into essay_versions values('${version}','${essay}');
 insert into essay_permissions values('${essay}','${reviewer}');
 insert into counselor_comments(essay_version_id,counselor_id,comment_text) values('${version}','${reviewer}','Private feedback');
 `);
 // Reproduce the exported broad SELECT policy before applying containment.
 await uid(stranger);assert.equal((await db.query('select * from counselor_comments')).rows.length,1);
 await db.exec('reset role');await db.exec(migration);
});
after(async()=>db?.close());
test('unrelated signed-in user cannot read comments despite legacy USING(true)',async()=>{
 await uid(stranger);assert.equal((await db.query('select * from counselor_comments')).rows.length,0);
 await assert.rejects(db.query('insert into counselor_comments(essay_version_id,counselor_id,comment_text) values($1,$2,$3)',[version,stranger,'Uninvited']),/row-level security/);
});
test('owner and existing permitted reviewer retain access and can comment',async()=>{
 for(const id of [owner,reviewer]){
  await uid(id);assert.ok((await db.query('select * from counselor_comments')).rows.length>0);
  await db.query('insert into counselor_comments(essay_version_id,counselor_id,comment_text) values($1,$2,$3)',[version,id,'Allowed']);
 }
});
test('reviewer cannot impersonate another comment author or alter owner comments',async()=>{
 await uid(reviewer);
 await assert.rejects(db.query('insert into counselor_comments(essay_version_id,counselor_id,comment_text) values($1,$2,$3)',[version,owner,'Forged']),/row-level security/);
 assert.equal((await db.query('update counselor_comments set comment_text=$1 where counselor_id=$2 returning id',['Modified',owner])).rows.length,0);
});
test('revoking permission removes read/update/delete access even for the comment author',async()=>{
 await db.exec(`reset role;delete from essay_permissions where user_id='${reviewer}'`);await uid(reviewer);
 assert.equal((await db.query('select * from counselor_comments')).rows.length,0);
 assert.equal((await db.query("update counselor_comments set comment_text='Changed' returning id")).rows.length,0);
 assert.equal((await db.query('delete from counselor_comments returning id')).rows.length,0);
 await uid(owner);assert.ok((await db.query('select * from counselor_comments')).rows.length>0);
});
test('anonymous access is denied and repeat application preserves comments',async()=>{
 await db.exec('reset role;set role anon');assert.equal((await db.query('select * from counselor_comments')).rows.length,0);
 await db.exec('reset role');const before=(await db.query('select count(*)::int n from counselor_comments')).rows[0].n;
 await db.exec(migration);assert.equal((await db.query('select count(*)::int n from counselor_comments')).rows[0].n,before);
});
