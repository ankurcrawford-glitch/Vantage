// Runs actual Vantage functions, extracted with TypeScript's AST, in isolation.
// All network, authentication, persistence, and email adapters are synthetic.
// No production data is read or written. This is NOT a browser or RLS test.
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const repo = path.resolve(__dirname, '..');
const ts = require(path.join(repo, 'node_modules/typescript'));
const quiet = {log(){}, warn(){}, error(){}};
const error = {message: 'Injected persistence failure', code: '42501'};
const ok = {data: null, error: null, count: 0};

function source(file) { return fs.readFileSync(path.join(repo, file), 'utf8'); }
function ast(file) { return ts.createSourceFile(file, source(file), ts.ScriptTarget.Latest, true, file.endsWith('tsx') ? ts.ScriptKind.TSX : ts.ScriptKind.JSX); }
function extract(file, name) {
  const tree = ast(file); let result;
  function walk(node) {
    if (ts.isVariableDeclaration(node) && node.name.getText(tree) === name && node.initializer) result = node.initializer.getText(tree);
    if (ts.isFunctionDeclaration(node) && node.name?.text === name) result = node.getText(tree).replace(/^export\s+/, '');
    ts.forEachChild(node, walk);
  }
  walk(tree); if (!result) throw new Error(`Missing ${name} in ${file}`); return result;
}
function evaluate(text, scope={}) {
  const js=ts.transpileModule(`module.exports = (${text});`,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.CommonJS}}).outputText;
  const ctx={console:quiet,Response,Request,URL,Date,Set,Map,encodeURIComponent,module:{exports:{}},...scope};
  vm.runInNewContext(js,ctx); return ctx.module.exports;
}
function dbAdapter(handler) {
  const calls=[];
  return {calls, auth:{getUser:async()=>({data:{user:{id:'qa-student'}}})}, from(table) {
    const call={table, op:'select', filters:[],payload:null}; let p;
    const q={};
    for(const method of ['select','insert','upsert','update','delete','eq','gte','order','limit','maybeSingle','single','in','ilike']) q[method]=(...args)=>{
      if(['insert','upsert','update','delete'].includes(method)){call.op=method;call.payload=args[0];call.options=args[1];}
      if(method==='select'){call.selection=args[0];call.selectOptions=args[1];}
      if(['eq','gte','order','limit','in','ilike'].includes(method))call.filters.push([method,...args]);
      return q;
    };
    q.then=(resolve,reject)=>{
      if(!p){calls.push(call);p=Promise.resolve().then(()=>handler(call));}
      return p.then(resolve,reject);
    };
    return q;
  }};
}
function route(file, db, extras={}) {
  const exports={};
  const js=ts.transpileModule(source(file),{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.CommonJS}}).outputText;
  const ctx={exports,console:quiet,Response,Request,URL,Date,process:{env:{}},
    fetch:async()=>({ok:true,json:async()=>({content:[{type:'text',text:'Synthetic counselor reply.'}]})}),
    require(id) {
      if(id==='@/lib/auth')return {getAuthedUser:async()=>({ok:true,userId:'qa-student'}),getAdminClient:()=>db};
      if(id==='@/lib/grade')return {effectiveGrade:()=>10};
      if(id==='@/lib/foundations-context')return {buildStudentContext:async()=>''};
      if(id==='resend')return {Resend:class{emails={send:async()=>({data:null,error})}}};
      throw new Error(`Unmocked import ${id}`);
    },...extras};
  vm.runInNewContext(js,ctx);return exports;
}
const request=body=>new Request('https://qa.invalid/api',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(body)});
module.exports={extract,evaluate,dbAdapter,route,request,ok,error};
