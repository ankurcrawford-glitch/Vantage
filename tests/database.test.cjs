const {test,before,after}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const {PGlite}=require('@electric-sql/pglite');
let db;
const owner='10000000-0000-4000-8000-000000000001';
const reviewer='10000000-0000-4000-8000-000000000002';
const stranger='10000000-0000-4000-8000-000000000003';
let prompts=Array.from({length:7},(_,i)=>`20000000-0000-4000-8000-${String(i+1).padStart(12,'0')}`);
const uid=async user=>{await db.exec(`reset role; select set_config('request.jwt.claim.sub','${user}',false); set role authenticated;`)};
const admin=async sql=>{await db.exec('reset role');return db.exec(sql)};
const save=async(prompt,text,revision,checkpoint=false,id=crypto.randomUUID())=>(await db.query('select save_essay_draft($1,$2,$3,$4,$5) as result',[prompt,text,revision,id,checkpoint])).rows[0].result;
before(async()=>{
 db=new PGlite();
 await db.exec(`
 create role anon; create role authenticated;
 create schema auth;
 create table auth.users(id uuid primary key,email text,email_confirmed_at timestamptz);
 create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
 create table colleges(id uuid primary key,name text);
 create table college_prompts(id uuid primary key default gen_random_uuid(),college_id uuid references colleges,prompt_text text,word_limit integer,year integer,sort_order integer,cycle text,released_at timestamptz);
 create table essays(id uuid primary key default gen_random_uuid(),user_id uuid not null references auth.users,college_prompt_id uuid not null references college_prompts);
 create table essay_versions(id uuid primary key default gen_random_uuid(),essay_id uuid not null references essays on delete cascade,version_number integer not null,content text not null check(content<>'INJECT_FAILURE'),word_count integer,is_current boolean not null,created_at timestamptz default now(),unique(essay_id,version_number));
 create table discovery_answers(id uuid primary key default gen_random_uuid(),user_id uuid,question_id text,answer text);
 create table conversation_messages(id uuid primary key default gen_random_uuid(),user_id uuid,role text,content text,created_at timestamptz default now());
 create table counselor_messages(like conversation_messages including all);
 create table user_colleges(user_id uuid,college_id text,application_plan text,primary key(user_id,college_id));
 create table essay_invitations(id uuid primary key default gen_random_uuid(),essay_id uuid,student_id uuid,invitee_email text,invitee_name text,role text default 'parent',token text unique);
 create table essay_permissions(id uuid primary key default gen_random_uuid(),essay_id uuid,user_id uuid,unique(essay_id,user_id));
 alter table essay_permissions enable row level security;
 create policy essay_permissions_insert on essay_permissions for insert to authenticated with check(user_id=auth.uid());
 create policy own_permission_read on essay_permissions for select to authenticated using(user_id=auth.uid());
 create table foundations_activities(id uuid primary key default gen_random_uuid(),user_id uuid,name text,role text,confirmed boolean default false,depth integer,thread text,trajectory text,hours text,since text,updated_at timestamptz default now());
 create table user_extracurriculars(id uuid primary key default gen_random_uuid(),user_id uuid,source_foundation_id uuid,activity_name text,role text,status text,depth integer,thread text,trajectory text,hours text,since text,description text,start_date date,end_date date);
 grant usage on schema public,auth to authenticated,anon;
 grant select,insert,update,delete on all tables in schema public to authenticated;
 insert into auth.users values('${owner}','student@test.invalid',now()),('${reviewer}','parent@test.invalid',now()),('${stranger}','stranger@test.invalid',now());
 `);
 await db.exec(fs.readFileSync('supabase-common-app-prompts.sql','utf8'));
 await db.exec(fs.readFileSync('supabase-common-app-prompts.sql','utf8'));
 prompts=(await db.query('select id from college_prompts order by sort_order')).rows.map(r=>r.id);
 assert.equal(prompts.length,7, 'real seed is repeatable and supplies all seven catalog rows');
 await db.exec(fs.readFileSync('supabase-essays-rls.sql','utf8'));
 await db.exec(fs.readFileSync('supabase-persistence-reliability.sql','utf8'));
 await uid(owner);
});
after(async()=>{await db?.close()});

test('all seven Common App prompt IDs: first save, edit, checkpoint, fresh read',async()=>{
 for(const p of prompts){
  const first=await save(p,'First draft: '+p,0); assert.equal(first.revision,1);assert.equal(first.version.is_checkpoint,false);
  const edited=await save(p,'Edited draft: '+p,1);assert.equal(edited.version.id,first.version.id);
  const checkpoint=await save(p,'Final checkpoint: '+p,2,true);assert.equal(checkpoint.version.is_checkpoint,true);
  const rows=await db.query('select content from essay_versions where essay_id=$1 and is_current',[checkpoint.essay_id]);
  assert.deepEqual(rows.rows,[{content:'Final checkpoint: '+p}]);
 }
});
test('checkpoint remains immutable while a new working draft autosaves',async()=>{
 const e=await save(prompts[0],'New working draft',3);assert.equal(e.revision,4);
 const rows=(await db.query('select content,is_checkpoint,is_current from essay_versions where essay_id=$1 order by version_number',[e.essay_id])).rows;
 assert.ok(rows.some(r=>r.content==='Final checkpoint: '+prompts[0]&&r.is_checkpoint&&!r.is_current));
 assert.equal(rows.filter(r=>r.is_current).length,1);
});
test('stale second-tab write rejected; newer server text survives',async()=>{
 await assert.rejects(save(prompts[0],'STALE',3),/SAVE_CONFLICT/);
 const r=(await db.query('select v.content from essay_versions v join essays e on e.id=v.essay_id where e.college_prompt_id=$1 and v.is_current',[prompts[0]])).rows;
 assert.equal(r[0].content,'New working draft');
});
test('lost-response retry is idempotent and does not create extra versions',async()=>{
 const id=crypto.randomUUID();const first=await save(prompts[0],'Retry-safe',4,true,id);const retry=await save(prompts[0],'Retry-safe',4,true,id);
 assert.deepEqual(retry,first);assert.equal(first.revision,5);
});
test('failed checkpoint insert rolls back current flags and revision',async()=>{
 await assert.rejects(save(prompts[0],'INJECT_FAILURE',5,true),/check constraint/);
 const r=(await db.query('select e.revision,v.content from essays e join essay_versions v on v.essay_id=e.id where e.college_prompt_id=$1 and v.is_current',[prompts[0]])).rows;
 assert.deepEqual(r,[{revision:5,content:'Retry-safe'}]);
});
test('another student cannot read or delete the owner draft',async()=>{
 const version=(await db.query('select v.id from essay_versions v join essays e on e.id=v.essay_id where e.college_prompt_id=$1 and v.is_current',[prompts[0]])).rows[0].id;
 await uid(stranger);assert.equal((await db.query('select * from essays')).rows.length,0);
 await assert.rejects(db.query('select delete_essay_version($1,5)',[version]),/not found/i);await uid(owner);
});
test('version deletion atomically restores a single current version',async()=>{
 const v=(await db.query('select v.id from essay_versions v join essays e on e.id=v.essay_id where e.college_prompt_id=$1 and v.is_current',[prompts[1]])).rows[0].id;
 const result=(await db.query('select delete_essay_version($1,3) as r',[v])).rows[0].r;
 assert.equal(result.revision,4);assert.equal(result.version.is_current,true);
 assert.equal((await db.query('select count(*)::int n from essay_versions where essay_id=$1 and is_current',[result.essay_id])).rows[0].n,1);
});
test('early plan changes are atomic; nonexistent target cannot clear the old plan',async()=>{
 await db.query('insert into user_colleges values($1,$2,$3),($1,$4,null)',[owner,prompts[0],'ED',prompts[1]]);
 await assert.rejects(db.query('select * from set_application_plan($1,$2)',[prompts[2],'ED']),/not found/);
 assert.equal((await db.query('select application_plan from user_colleges where college_id=$1',[prompts[0]])).rows[0].application_plan,'ED');
 const rows=(await db.query('select * from set_application_plan($1,$2)',[prompts[1],'ED'])).rows;
 assert.equal(rows.filter(r=>r.application_plan==='ED').length,1);
});
test('application plans accept the live text college IDs, including non-UUID values',async()=>{
 await uid(owner);
 await db.query("insert into user_colleges values($1,'stanford',null)",[owner]);
 const rows=(await db.query("select * from set_application_plan('stanford','REA')")).rows;
 assert.equal(rows.find(r=>r.college_id==='stanford').application_plan,'REA');
 assert.equal(rows.filter(r=>['ED','REA'].includes(r.application_plan)).length,1);
});
test('all twelve Story Builder answers support repeat saves without duplicate rows',async()=>{
 for(let i=1;i<=12;i++)for(const answer of ['First','Second'])await db.query('insert into discovery_answers(user_id,question_id,answer) values($1,$2,$3) on conflict(user_id,question_id) do update set answer=excluded.answer',[owner,'q'+i,answer]);
 const rows=(await db.query('select * from discovery_answers')).rows;assert.equal(rows.length,12);assert.ok(rows.every(r=>r.answer==='Second'));
});
test('reviewer acceptance: wrong account denied, intended recipient idempotent, RLS read allowed',async()=>{
 await uid(owner);const essay=(await db.query('select id from essays where college_prompt_id=$1',[prompts[0]])).rows[0].id;
 await admin(`insert into essay_invitations(essay_id,student_id,invitee_email,invitee_name,token) values('${essay}','${owner}','Parent@Test.Invalid','Parent','test-token')`);
 await uid(stranger);await assert.rejects(db.query("select accept_essay_invitation('test-token')"),/not available/);
 await assert.rejects(db.query('insert into essay_permissions(essay_id,user_id) values($1,$2)',[essay,stranger]),/row-level security/);
 await uid(reviewer);assert.equal((await db.query('select * from essay_versions')).rows.length,0);
 await db.query("select accept_essay_invitation('test-token')");await db.query("select accept_essay_invitation('test-token')");
 assert.ok((await db.query('select * from essay_versions where essay_id=$1',[essay])).rows.length>0);
 assert.equal((await db.query('select * from essay_permissions')).rows.length,1);
 await uid(owner);
});
test('legacy self-granted permission alone cannot expose student work',async()=>{
 const essay=(await db.query('select id from essays where college_prompt_id=$1',[prompts[0]])).rows[0].id;
 await admin(`insert into essay_permissions(essay_id,user_id) values('${essay}','${stranger}')`);
 await uid(stranger);assert.equal((await db.query('select * from essay_versions')).rows.length,0);await uid(owner);
});
test('activity updates synchronize shared fields in both directions and preserve descriptions',async()=>{
 const id=(await db.query("insert into foundations_activities(user_id,name,role,confirmed,hours) values($1,'Robotics','Member',true,'2') returning id",[owner])).rows[0].id;
 await db.query("update user_extracurriculars set description='My application description' where source_foundation_id=$1",[id]);
 await db.query("update foundations_activities set role='Captain',hours='6' where id=$1",[id]);
 let row=(await db.query('select * from user_extracurriculars where source_foundation_id=$1',[id])).rows[0];assert.equal(row.role,'Captain');assert.equal(row.hours,'6');assert.equal(row.description,'My application description');
 await db.query("update user_extracurriculars set role='Co-captain' where source_foundation_id=$1",[id]);assert.equal((await db.query('select role from foundations_activities where id=$1',[id])).rows[0].role,'Co-captain');
 await db.query('delete from foundations_activities where id=$1',[id]);assert.equal((await db.query('select * from user_extracurriculars where source_foundation_id=$1',[id])).rows.length,0);
});
test('migration is idempotent',async()=>{await db.exec('reset role');await db.exec(fs.readFileSync('supabase-persistence-reliability.sql','utf8'));});
