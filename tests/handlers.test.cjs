const {test}=require('node:test');const assert=require('node:assert/strict');
const {extract,evaluate,dbAdapter,route,request,ok,error}=require('./source-helper.cjs');

test('review invitation accepts Next.js promised parameters',async()=>{
 const db=dbAdapter(()=>({data:{id:'invitation',status:'pending'},error:null}));
 const res=await route('app/api/invitations/[token]/route.js',db).GET(new Request('https://qa.invalid'),{params:Promise.resolve({token:'valid'})});
 assert.equal(res.status,200);assert.equal(db.calls.length,1);
});
for(const file of ['app/api/foundations/conversation/route.js','app/api/counselor/route.js']){
 test(`${file}: failed message write is an error, not success`,async()=>{
  const db=dbAdapter(c=>['insert','upsert'].includes(c.op)?{data:null,error}:c.table==='user_stats'?{data:{grade:10},error:null}:ok);
  const res=await route(file,db).POST(request({requestId:crypto.randomUUID(),messages:[{role:'user',content:'Help me plan a robotics project'}]}));
  assert.equal(res.status,500);
 });
 test(`${file}: retry returns stored reply without another AI call or write`,async()=>{
  const db=dbAdapter(()=>({data:[{role:'assistant',content:'Previously saved response'}],error:null}));
  const res=await route(file,db,{fetch:()=>{throw new Error('Must not call AI twice')}}).POST(request({requestId:crypto.randomUUID(),messages:[{role:'user',content:'Retry'}]}));
  assert.equal(res.status,200);assert.equal((await res.json()).replayed,true);assert.equal(db.calls.length,1);
 });
}
test('FAQ is saved with free-usage flag',async()=>{
 const db=dbAdapter(()=>ok);const res=await route('app/api/counselor/route.js',db).POST(request({requestId:crypto.randomUUID(),messages:[{role:'user',content:'What is early decision?'}]}));
 assert.equal(res.status,200);const write=db.calls.find(c=>c.op==='upsert');assert.equal(write.payload.length,2);assert.ok(write.payload.every(r=>r.is_free&&r.turn_id));
});
test('history fetches newest rows then returns chronological display order',async()=>{
 const db=dbAdapter(c=>c.selectOptions?.head?{...ok,count:1}:{data:[{content:'Newest'},{content:'Previous'}],error:null});
 const res=await route('app/api/counselor/route.js',db).GET(new Request('https://qa.invalid'));const payload=await res.json();
 assert.equal(db.calls[0].filters.find(f=>f[0]==='order')[2].ascending,false);
 assert.deepEqual(payload.messages.map(m=>m.content),['Previous','Newest']);
});
test('support cannot acknowledge failed durable receipt',async()=>{
 const res=await route('app/api/support/route.js',dbAdapter(()=>({data:null,error}))).POST(request({email:'qa@example.invalid',message:'Save failure'}));assert.equal(res.status,500);
});
test('support can acknowledge durable inbox receipt when notification email fails',async()=>{
 const db=dbAdapter(()=>ok);const res=await route('app/api/support/route.js',db).POST(request({email:'qa@example.invalid',message:'Save failure'}));assert.equal(res.status,200);assert.ok(db.calls.some(c=>c.op==='insert'));
});
test('Spark rejects over-limit content instead of silently truncating',async()=>{
 const db=dbAdapter(()=>ok);const res=await route('app/api/foundations/spark/route.js',db).POST(request({content:'x'.repeat(8001)}));assert.equal(res.status,400);assert.equal(db.calls.length,0);
});
test('Spark preserves 8000 characters exactly',async()=>{
 const db=dbAdapter(()=>ok);const text='x'.repeat(8000);const res=await route('app/api/foundations/spark/route.js',db).POST(request({content:text}));assert.equal(res.status,200);assert.equal(db.calls[0].payload.content,text);
});
test('roadmap leaves old state visible and reports HTTP 500',async()=>{
 let done=new Set(),message='';const fn=evaluate(extract('app/foundations/roadmap/page.jsx','toggle'),{pendingKeys:{current:new Set()},doneKeys:done,setDoneKeys:f=>done=f(done),setSaveError:e=>message=e,authHeaders:async()=>({}),fetch:async()=>Response.json({error:'Failed'},{status:500})});
 await fn('9-summer');assert.equal(done.size,0);assert.match(message,/Couldn't save/);
});
test('activity mutation does not remove or confirm anything after rejection',async()=>{
 let changed=false,message='';const fn=evaluate(extract('app/foundations/activities/page.jsx','mutateRow'),{pendingRows:{current:new Set()},setError:e=>message=e,authHeaders:async()=>({}),fetch:async()=>Response.json({error:'Failed'},{status:500})});
 await fn('a1','https://qa.invalid','DELETE',{id:'a1'},()=>changed=true);assert.equal(changed,false);assert.match(message,/Couldn't save/);
});
test('refreshing AP/activity/award collections preserves unsaved GPA and strategy',async()=>{
 const db=dbAdapter(c=>c.table==='user_stats'?{data:{gpa_unweighted:3.5,intended_major:'Biology'},error:null}:{data:[],error:null});let stats=3.9,major='Engineering';
 const scope={supabase:db,router:{push(){}},setStats:v=>stats=v.gpa_unweighted,setStrategy:v=>major=v.intended_major,setLegacyColleges(){},setApClasses(){},setExtracurriculars(){},setSuggestedActivities(){},setAwards(){},setLoading(){},alert(){}};
 await evaluate(extract('components/ProfileEditor.tsx','loadProfile'),scope)(true);assert.equal(stats,3.9);assert.equal(major,'Engineering');
});
test('onboarding cannot claim completion when its student summary failed to save',async()=>{
 const db=dbAdapter(c=>c.op==='select'?{data:null,error:null}:{data:null,error});
 const api=route('app/api/foundations/onboarding/route.js',db);
 const response=await api.POST(request({messages:Array.from({length:6},()=>({role:'user',content:'My interests'}))}));
 assert.equal(response.status,500);assert.equal((await response.json()).done,undefined);
});
