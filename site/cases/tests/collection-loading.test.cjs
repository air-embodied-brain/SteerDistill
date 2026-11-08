const {test}=require('node:test');
const assert=require('node:assert/strict');
const vm=require('node:vm');
const fs=require('node:fs');
const path=require('node:path');

// Only the browser shell is stubbed. The real collection loader/router handles
// requests, caching, ordering, history and the commit into the main region.
function harness(){
 const requests=[],historyWrites=[];let current=new URL('http://localhost/cases/'),enabled=false;
 const root={children:[],replaceChildren(...nodes){this.children=nodes},querySelector(){return null}},aside={scrollTop:0};
 const location={get href(){return current.href},get search(){return current.search},get pathname(){return current.pathname},get hash(){return current.hash},get origin(){return current.origin},assign(url){throw Error('Unexpected full navigation: '+url)}};
 const context={URL,URLSearchParams,Map,console,location,scrollX:0,scrollY:0,
  history:{state:null,replaceState(state,_,url){this.state=state;current=new URL(url,current)},pushState(state,_,url){this.state=state;current=new URL(url,current);historyWrites.push(current.href)}},
  document:{currentScript:{src:'http://localhost/site/cases/site-paths.js'},querySelector(selector){return enabled?(selector==='#case'?root:aside):null},getElementById(){return null},addEventListener(){},title:''},
  EvidenceUI:{prose:text=>({text})},CaseTemplates:{training:config=>({title:config.title})},CaseSidebar:{mount(){},caseGroup:group=>group,caseItem(_,entry){return entry},close(){}},
  fetch(url){return new Promise((resolve,reject)=>requests.push({url,resolve(value,ok=true){resolve({ok,status:ok?200:503,json:()=>Promise.resolve(value)})},reject}))},scrollTo(){},addEventListener(){}};
 context.window=context;vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../site-paths.js'),'utf8'),context);vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../collection.js'),'utf8'),context);enabled=true;
 return {C:context.CaseCollection,requests,root,historyWrites,location};
}
const turn=()=>new Promise(resolve=>setImmediate(resolve));
const config=id=>({schemaVersion:1,id,kind:'training',template:'training',title:id,summary:'task',originalTask:{},records:{sources:[{}]},presentation:{}});

test('presentation JSON shares in-flight and resolved requests; failed fetch can retry',async()=>{
 const h=harness(),first=h.C.json('/config.json'),second=h.C.json('/config.json');
 assert.equal(first,second);assert.equal(h.requests.length,1);
 h.requests[0].resolve({title:'ready'});assert.equal((await first).title,'ready');
 assert.equal(await h.C.json('/config.json'),await first);assert.equal(h.requests.length,1);
 const failed=h.C.json('/retry.json');h.requests[1].resolve(null,false);await assert.rejects(failed,/503/);
 const retry=h.C.json('/retry.json');assert.equal(h.requests.length,3);h.requests[2].resolve({ok:true});await retry;
});

test('newest case navigation wins without clearing the previous case while loading',async()=>{
 const h=harness();h.root.children=[{title:'previous'}];
 const a=h.C.navigate('/cases/?group=training&case=a',{push:true});
 const b=h.C.navigate('/cases/?group=training&case=b',{push:true});
 assert.equal(h.requests.length,1);h.requests[0].resolve({groups:[{id:'training',cases:[{id:'a',url:'/a.json'},{id:'b',url:'/b.json'}]}]});await turn();
 assert.equal(h.root.children[0].title,'previous');assert.equal(h.historyWrites.length,0);
 h.requests.find(r=>r.url==='/b.json').resolve(config('b'));await b;
 assert.equal(h.root.children[0].title,'b');assert.match(h.location.search,/case=b/);
 h.requests.find(r=>r.url==='/a.json').resolve(config('a'));await a;
 assert.equal(h.root.children[0].title,'b');assert.match(h.location.search,/case=b/);assert.equal(h.historyWrites.length,1);
 assert.equal(h.requests.filter(r=>r.url.endsWith('catalog.json')).length,1);
});

test('legacy group links retain case, selected methods and record position',async()=>{
 const h=harness();
 const pending=h.C.load('/records/?group=ablation&case=ticket&left=unguided&right=teacher&source=before&message=26&mode=raw');
 h.requests[0].resolve({groups:[{id:'training',aliases:['ablation'],cases:[{id:'ticket',code:'T5',url:'/ticket.json'}]}]});await turn();
 h.requests[1].resolve(config('ticket'));const result=await pending;
 assert.equal(result.entry.code,'T5');assert.equal(result.config.kind,'training');
 assert.equal(result.url.searchParams.get('group'),'training');
 for(const [key,value]of Object.entries({case:'ticket',left:'unguided',right:'teacher',source:'before',message:'26',mode:'raw'}))assert.equal(result.url.searchParams.get(key),value);
 assert.equal(result.url.pathname,'/records/');
});

test('retired ablation links fall back safely after the group merge',async()=>{
 const h=harness();const pending=h.C.load('/cases/?group=ablation&case=withdrawn&left=old&source=old&message=7');
 h.requests[0].resolve({groups:[{id:'training',aliases:['ablation'],retiredCases:['withdrawn'],cases:[{id:'directory',url:'/directory.json'}]}]});await turn();
 h.requests[1].resolve(config('directory'));const result=await pending;
 assert.equal(result.config.id,'directory');assert.equal(result.url.searchParams.get('group'),'training');
 assert.equal(result.url.searchParams.get('case'),'directory');
 for(const key of ['left','source','message'])assert.equal(result.url.searchParams.has(key),false);
});
