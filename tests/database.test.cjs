const {test,before,after}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const {PGlite}=require('@electric-sql/pglite');
let db;
const owner='10000000-0000-4000-8000-000000000001';
const reviewer='10000000-0000-4000-8000-000000000002';
const stranger='10000000-0000-4000-8000-000000000003';
let prompts=Array.from({length:7},(_,i)=>`20000000-0000-4000-8000-${String(i+1).padStart(12,'0')}`);
const uid=async user=>{await db.exec(`reset role; select set_config('request.jwt.claim.sub','${user}',false); select set_config('request.jwt.claim.email',(select email from auth.users where id='${user}'),false); set role authenticated;`)};
const admin=async sql=>{await db.exec('reset role');return db.exec(sql)};
const save=async(prompt,text,revision,checkpoint=false,id=crypto.randomUUID())=>(await db.query('select save_essay_draft($1,$2,$3,$4,$5) as result',[prompt,text,revision,id,checkpoint])).rows[0].result;
before(async()=>{
 db=new PGlite();
 await db.exec(`
 create role anon; create role authenticated;
 create schema auth;
 create table auth.users(id uuid primary key,email text,email_confirmed_at timestamptz);
 create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
 create function auth.jwt() returns jsonb language sql stable as $$select jsonb_build_object('email',current_setting('request.jwt.claim.email',true))$$;
 `);
 await db.exec(fs.readFileSync('tests/fixtures/live-schema-2026-09-20.sql','utf8'));
 await db.exec(`
 grant usage on schema public,auth to authenticated,anon;
 grant select,insert,update,delete on all tables in schema public to authenticated;
 insert into auth.users values('${owner}','student@test.invalid',now()),('${reviewer}','parent@test.invalid',now()),('${stranger}','stranger@test.invalid',now());
 `);
 await db.exec(fs.readFileSync('supabase-common-app-prompts.sql','utf8'));
 await db.exec(fs.readFileSync('supabase-common-app-prompts.sql','utf8'));
 prompts=(await db.query('select id from college_prompts order by sort_order')).rows.map(r=>r.id);
 assert.equal(prompts.length,7, 'real seed is repeatable and supplies all seven catalog rows');

 await db.exec(fs.readFileSync('supabase-comment-access-hotfix.sql','utf8'));
 await db.exec(fs.readFileSync('supabase-persistence-rehearsal.sql','utf8'));
 assert.equal((await db.query("select to_regprocedure('save_essay_draft(uuid,text,bigint,uuid,boolean)') as f")).rows[0].f,null,'rehearsal must roll back its functions');
 assert.equal((await db.query("select count(*)::int n from information_schema.columns where table_name='essays' and column_name='revision'")).rows[0].n,0,'rehearsal must roll back its columns');
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
 await admin("insert into colleges values('school-1','First'),('school-2','Second'),('stanford','Stanford')");await uid(owner);
 await db.query('insert into user_colleges(user_id,college_id,application_plan) values($1,$2,$3),($1,$4,null)',[owner,'school-1','ED','school-2']);
 await assert.rejects(db.query('select * from set_application_plan($1,$2)',['missing-school','ED']),/not found/);
 assert.equal((await db.query('select application_plan from user_colleges where college_id=$1',['school-1'])).rows[0].application_plan,'ED');
 const rows=(await db.query('select * from set_application_plan($1,$2)',['school-2','ED'])).rows;
 assert.equal(rows.filter(r=>r.application_plan==='ED').length,1);
});
test('application plans accept the live text college IDs, including non-UUID values',async()=>{
 await uid(owner);
 await db.query("insert into user_colleges(user_id,college_id,application_plan) values($1,'stanford',null)",[owner]);
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
 await admin(`insert into essay_invitations(essay_id,student_id,invitee_email,invitee_name,token,role) values('${essay}','${owner}','Parent@Test.Invalid','Parent','test-token','parent')`);
 await uid(stranger);await assert.rejects(db.query("select accept_essay_invitation('test-token')"),/not available/);
 await assert.rejects(db.query("insert into essay_permissions(essay_id,user_id,role) values($1,$2,'other')",[essay,stranger]),/row-level security/);
 await uid(reviewer);assert.equal((await db.query('select * from essay_versions')).rows.length,0);
 await db.query("select accept_essay_invitation('test-token')");await db.query("select accept_essay_invitation('test-token')");
 assert.ok((await db.query('select * from essay_versions where essay_id=$1',[essay])).rows.length>0);
 assert.equal((await db.query('select * from essay_permissions')).rows.length,1);
 await uid(owner);
});
test('legacy self-granted permission alone cannot expose student work',async()=>{
 const essay=(await db.query('select id from essays where college_prompt_id=$1',[prompts[0]])).rows[0].id;
 await admin(`insert into essay_permissions(essay_id,user_id,role) values('${essay}','${stranger}','other')`);
 await uid(stranger);assert.equal((await db.query('select * from essay_versions')).rows.length,0);await uid(owner);
});
test('legacy invitation and permission policies cannot rewrite access',async()=>{
 await uid(reviewer);
 assert.equal((await db.query("update essay_invitations set invitee_email='stranger@test.invalid' where token='test-token' returning id")).rows.length,0);
 assert.equal((await db.query("update essay_permissions set role='student' returning id")).rows.length,0);
 await assert.rejects(db.query("insert into essay_permissions(essay_id,user_id,role) select essay_id,user_id,'other' from essay_permissions limit 1"),/row-level security/);
 await uid(owner);const inv=(await db.query("select * from essay_invitations where token='test-token'")).rows[0];
 assert.equal(inv.accepted_by_user_id,reviewer);assert.ok(inv.accepted_at);assert.equal(inv.invitee_email,'Parent@Test.Invalid');
});
test('expired or declined invitations deny essays, comments and legacy helper access',async()=>{
 await uid(owner);const essay=(await db.query('select id from essays where college_prompt_id=$1',[prompts[0]])).rows[0].id;
 const version=(await db.query('select id from essay_versions where essay_id=$1 and is_current',[essay])).rows[0].id;
 await db.query("insert into counselor_comments(essay_version_id,counselor_id,comment_text) values($1,$2,'Private comment')",[version,owner]);
 for(const update of ["expires_at=now()-interval '1 day'","expires_at=now()+interval '1 day',status='declined'"]){
  await admin("update essay_invitations set "+update+" where token='test-token'");await uid(reviewer);
  assert.equal((await db.query('select * from essay_versions')).rows.length,0);
  assert.equal((await db.query('select * from counselor_comments')).rows.length,0);
  assert.equal((await db.query('select user_has_essay_permission($1,$2) as allowed',[essay,reviewer])).rows[0].allowed,false);
  await assert.rejects(db.query("select accept_essay_invitation('test-token')"),/not available/);
 }
 await admin("update essay_invitations set status='accepted',expires_at=now()+interval '1 day' where token='test-token'");await uid(reviewer);
 assert.equal((await db.query('select * from counselor_comments')).rows.length,1);
 await db.query("insert into counselor_comments(essay_version_id,counselor_id,comment_text) values($1,$2,'Reviewer reply')",[version,reviewer]);
 await uid(stranger);assert.equal((await db.query('select * from counselor_comments')).rows.length,0);
 await assert.rejects(db.query("insert into counselor_comments(essay_version_id,counselor_id,comment_text) values($1,$2,'Uninvited')",[version,stranger]),/row-level security/);
 // Standalone containment can be rerun without weakening the later verified helper.
 await admin(fs.readFileSync('supabase-comment-access-hotfix.sql','utf8'));await uid(stranger);
 assert.equal((await db.query('select * from counselor_comments')).rows.length,0);
 await uid(owner);
});
test('true current version is preferred over a legacy null current flag',async()=>{
 await uid(owner);const essay=(await db.query('select id from essays where college_prompt_id=$1',[prompts[6]])).rows[0].id;
 await admin(`insert into essay_versions(essay_id,version_number,content,is_current) values('${essay}',50,'Legacy null flag',null)`);
 await uid(owner);const result=await save(prompts[6],'New current',3);
 assert.equal(result.version.content,'New current');
 const current=(await db.query('select content from essay_versions where essay_id=$1 and is_current',[essay])).rows;
 assert.deepEqual(current,[{content:'New current'}]);
});
test('activity updates synchronize shared fields in both directions and preserve descriptions',async()=>{
 await db.exec('reset role');
 const id=(await db.query("insert into foundations_activities(user_id,name,role,confirmed,hours) values($1,'Robotics','Member',true,'2') returning id",[owner])).rows[0].id;
 await uid(owner);
 await db.query("update user_extracurriculars set description='My application description' where source_foundation_id=$1",[id]);
 await db.exec('reset role');
 await db.query("update foundations_activities set role='Captain',hours='6' where id=$1",[id]);
 let row=(await db.query('select * from user_extracurriculars where source_foundation_id=$1',[id])).rows[0];assert.equal(row.role,'Captain');assert.equal(row.hours,'6');assert.equal(row.description,'My application description');
 await uid(owner);
 await db.query("update user_extracurriculars set role='Co-captain' where source_foundation_id=$1",[id]);assert.equal((await db.query('select role from foundations_activities where id=$1',[id])).rows[0].role,'Co-captain');
 await db.exec('reset role');
 await db.query('delete from foundations_activities where id=$1',[id]);assert.equal((await db.query('select * from user_extracurriculars where source_foundation_id=$1',[id])).rows.length,0);
});
test('migration is idempotent',async()=>{await db.exec('reset role');await db.exec(fs.readFileSync('supabase-persistence-reliability.sql','utf8'));});
