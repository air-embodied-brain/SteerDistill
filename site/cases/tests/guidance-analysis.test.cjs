const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');

// Use the real collection and EvidenceUI. Only DOM primitives and the method
// selector are replaced, so swaps exercise the actual continuation renderer.
function harness(){
 const element=tag=>({tagName:tag,children:[],className:'',dataset:{},handlers:{},
  setAttribute(key,value){this[key]=value},append(...nodes){this.children.push(...nodes)},addEventListener(event,fn){this.handlers[event]=fn},
  get textContent(){return this.children.map(n=>typeof n==='string'?n:n.textContent).join('')},
  set textContent(value){this.children=[value]}
 });
 const context={URL,URLSearchParams,Map,console,
  document:{createElement:element,createElementNS:(_,tag)=>element(tag),createTextNode:text=>({textContent:text}),querySelector(){return null}},
  SitePaths:{url:url=>url},CaseSidebar:{},InferenceCase:{mount:(_,config)=>config}
 };
 context.window=context;
 for(const file of ['evidence-ui.js','collection.js'])vm.runInNewContext(fs.readFileSync(path.join(__dirname,'..',file),'utf8'),context);
 return context.CaseCollection;
}
const walk=node=>[node,...(node.children||[]).filter(n=>typeof n!=='string').flatMap(walk)];

test('advisor analysis stays attributed and preserves its disclosure across method swaps',()=>{
 const C=harness(),teacher={id:'teacher',name:'Teacher',guidance:{decision_rule:'Read the price.'},
  guidanceAnalysis:{text:'Already complete.',highlights:[{start:0,end:16,text:'Already complete',tone:'before'}]}},
  other={id:'other',name:'Other',guidance:{guidance:'Use the recorded date.'}};
 const config=C.mount({}, {id:'example',kind:'ablation',template:'comparison',title:'Example',summary:'Task',originalTask:{},
  records:{defaultSource:'trace',sources:[]},presentation:{methods:[teacher,other],turns:[],details:{guidanceTitle:'Guidance'}}});
 const first=config.afterTurns([teacher,other]),disclosures=walk(first).filter(n=>n.tagName==='details');
 assert.equal(disclosures.length,2);
 assert.equal(disclosures[0].open,false);
 assert.match(disclosures[0].textContent,/指导生成推理节选 TeacherAlready complete/);
 assert.match(disclosures[0].textContent,/指导原文 Teacher/);
 assert.equal(walk(disclosures[0]).find(n=>n.tagName==='mark').className,'ev-mark-before');
 assert.doesNotMatch(disclosures[1].textContent,/Already complete|指导生成推理节选/);
 disclosures[0].open=true;disclosures[0].handlers.toggle();
 const swapped=walk(config.afterTurns([other,teacher])).filter(n=>n.tagName==='details');
 assert.equal(swapped[0].open,false);
 assert.equal(swapped[1].open,true);
 assert.doesNotMatch(swapped[0].textContent,/Already complete/);
 assert.match(swapped[1].textContent,/指导生成推理节选 Teacher/);
});


test('unguided comparison has an explicit empty intervention and retains its result',()=>{
 const C=harness(),guided={id:'teacher',name:'Teacher',guidance:{decision_rule:'Act.'},guidanceExcerpt:'Act.',resultLines:[{text:'Done'}]},
  unguided={id:'unguided',name:'无指导',resultLines:[{text:'Unchanged'}]};
 const config=C.mount({}, {id:'example',kind:'ablation',template:'comparison',title:'Example',summary:'Task',originalTask:{},
  records:{defaultSource:'trace',sources:[]},presentation:{methods:[guided,unguided],turns:[],details:{}}});
 for(const pair of [[guided,unguided],[unguided,guided]]){
  const section=config.afterTurns(pair);
  assert.match(section.textContent,/未提供指导/);
  assert.match(section.textContent,/Unchanged/);
  assert.equal(walk(section).filter(n=>n.tagName==='details').length,1);
  assert.doesNotMatch(section.textContent,/无指导 · 完整指导/);
 }
});
