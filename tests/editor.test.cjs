const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const ts=require('typescript');
const renderer=require('react-test-renderer');
const React=require(require.resolve('react',{paths:[path.dirname(require.resolve('react-test-renderer'))]}));
globalThis.IS_REACT_ACT_ENVIRONMENT=true;
const {act}=React;
class Storage {
 constructor(){this.items=new Map()}
 get length(){return this.items.size}
 key(i){return [...this.items.keys()][i]??null}
 getItem(k){return this.items.get(k)??null}
 setItem(k,v){this.items.set(k,String(v))}
 removeItem(k){this.items.delete(k)}
}
function compile(file,requires,globals={}){
 const code=ts.transpileModule(fs.readFileSync(path.join(__dirname,'..',file),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText;
 const exports={};vm.runInNewContext(code,{exports,require:n=>requires[n],...globals});return exports;
}
async function editor({storage=new Storage(),readError=false,server={revision:0,version:null},rpc}={}){
 const timers=new Map();let seq=0;const calls=[];
 const supabase={from(table){const q={select(){return q},eq(){return q},maybeSingle:async()=>({data:server.version?{id:'essay',revision:server.revision}:null,error:readError?{message:'offline'}:null}),order:async()=>({data:server.version?[server.version]:[],error:null})};return q},rpc:async(name,p)=>{calls.push(p);if(rpc)return rpc(name,p,server);return commit(p)}};
 function commit(p){server.revision++;server.version={id:'v'+server.revision,version_number:server.revision,content:p.p_content,word_count:1,is_current:true,is_checkpoint:p.p_checkpoint};return {data:{essay_id:'essay',revision:server.revision,version:server.version},error:null}}
 const queue=compile('lib/essay-save-queue.ts',{});
 const {useEssayDraft}=compile('hooks/useEssayDraft.ts',{'react':React,'@/lib/supabase':{supabase},'@/lib/essay-save-queue':queue},{localStorage:storage,sessionStorage:new Storage(),crypto,Date,window:{addEventListener(){},removeEventListener(){},confirm:()=>true},document:{addEventListener(){},removeEventListener(){}},setTimeout:fn=>{timers.set(++seq,fn);return seq},clearTimeout:id=>timers.delete(id)});
 let current,root;
 function Harness(){current=useEssayDraft('prompt','user',true);return null}
 await act(async()=>{root=renderer.create(React.createElement(Harness))});
 return {get current(){return current},calls,server,storage,commit,edit:async text=>act(async()=>current.edit(text)),tick:async()=>act(async()=>{const work=[...timers.values()];timers.clear();work.forEach(fn=>fn());await Promise.resolve()}),close:async()=>act(async()=>root.unmount())};
}
test('first draft autosaves without a manual checkpoint and updates the version cache',async()=>{
 const e=await editor();await e.edit('  first draft\n');await e.tick();
 assert.equal(e.calls.length,1);assert.equal(e.calls[0].p_content,'  first draft\n');assert.equal(e.current.status,'saved');assert.equal(e.current.versions[0].content,'  first draft\n');assert.equal(e.storage.length,0);await e.close();
});
test('typing during a slow checkpoint is retained and the next write is serialized',async()=>{
 let resolve;const e=await editor({rpc:()=>new Promise(r=>{resolve=r})});await e.edit('A');let first;
 await act(async()=>{first=e.current.save();await Promise.resolve()});await e.edit('B');await e.tick();assert.equal(e.calls.length,1);
 await act(async()=>{resolve(e.commit(e.calls[0]));await first});
 assert.equal(e.current.content,'B');assert.equal(e.calls.length,2);assert.equal(e.calls[1].p_expected_revision,1);
 await act(async()=>resolve(e.commit(e.calls[1])));assert.equal(e.current.status,'saved');assert.equal(e.current.currentVersion.content,'B');await e.close();
});
test('failed acknowledgement retries with the same request ID',async()=>{
 let tries=0;const e=await editor({rpc:(_n,p)=>++tries===1?{error:{message:'offline'}}:e.commit(p)});
 await e.edit('recover me');await e.tick();assert.equal(e.current.status,'error');assert.equal(e.storage.length,1);
 await act(async()=>e.current.retry());assert.equal(e.calls[0].p_request_id,e.calls[1].p_request_id);assert.equal(e.current.status,'saved');await e.close();
});
test('unmount before autosave recovers writing on next mount',async()=>{
 const storage=new Storage();const a=await editor({storage});await a.edit('unsent');await a.close();const b=await editor({storage});assert.equal(b.current.content,'unsent');await b.tick();assert.equal(b.server.version.content,'unsent');await b.close();
});
test('a stale recovery copy pauses saving rather than overwriting the newer server draft',async()=>{
 const storage=new Storage();storage.setItem('vantage-draft:user:prompt:old',JSON.stringify({text:'old unsent',revision:0,time:1}));
 const e=await editor({storage,server:{revision:2,version:{id:'v',version_number:2,content:'newer',is_current:true}}});assert.equal(e.current.content,'old unsent');await e.tick();assert.equal(e.calls.length,0);assert.match(e.current.error,/different draft/);await e.close();
});
test('read failure blocks editing and cannot create a blank replacement',async()=>{
 const e=await editor({readError:true});assert.equal(e.current.canEdit,false);await assert.rejects(e.current.save(),/load/);assert.equal(e.calls.length,0);await e.close();
});
test('restoring a version cannot replace typing entered during the preliminary save',async()=>{
 let resolve;const e=await editor({rpc:()=>new Promise(r=>{resolve=r})});await e.edit('current');let restore;
 await act(async()=>{restore=e.current.restore({id:'old',version_number:1,content:'historical'});await Promise.resolve()});
 await e.edit('new typing');await act(async()=>{resolve(e.commit(e.calls[0]));await restore});
 assert.equal(e.current.content,'new typing');assert.equal(e.calls.length,1);await e.tick();await act(async()=>resolve(e.commit(e.calls[1])));await e.close();
});
test('retrying a failed manual checkpoint does not create a second checkpoint',async()=>{
 let tries=0;const e=await editor({rpc:(_n,p)=>++tries===1?{error:{message:'lost response'}}:e.commit(p)});await e.edit('checkpoint');
 await act(async()=>{await assert.rejects(e.current.save())});await act(async()=>e.current.save());
 assert.equal(e.calls.length,2);assert.equal(e.calls[0].p_request_id,e.calls[1].p_request_id);await e.close();
});
test('manual form recovery is scoped to the question and does not overwrite another answer',async()=>{
 const storage=new Storage();let current,root;
 const {useRecoverableText}=compile('hooks/useRecoverableText.ts',{'react':React,'@/lib/supabase':{supabase:{auth:{getUser:async()=>({data:{user:{id:'student'}}})}}}},{localStorage:storage,window:{addEventListener(){},removeEventListener(){}},document:{addEventListener(){},removeEventListener(){}}});
 function Harness({scope}){current=useRecoverableText(scope);return null}
 await act(async()=>{root=renderer.create(React.createElement(Harness,{scope:'q1'}))});await act(async()=>current.setText('unsaved first'));
 await act(async()=>{current.openText('saved second');root.update(React.createElement(Harness,{scope:'q2'}))});
 assert.equal(storage.getItem('vantage-form:student:q1'),'unsaved first');assert.equal(current.text,'saved second');
 await act(async()=>current.setText('unsaved second'));
 await act(async()=>{current.openText('saved first');root.update(React.createElement(Harness,{scope:'q1'}))});
 assert.equal(current.text,'unsaved first');assert.equal(storage.getItem('vantage-form:student:q2'),'unsaved second');await act(async()=>root.unmount());
});
