const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.resolve(__dirname,'..'),read=p=>JSON.parse(fs.readFileSync(path.join(root,p),'utf8'));
const document={createElement(tag){return {tagName:tag,children:[],textContent:'',append(...nodes){this.children.push(...nodes)}}}};
const context={window:{},document};vm.runInNewContext(fs.readFileSync(path.join(root,'site/cases/task-source.js'),'utf8'),context);
const text=node=>node.textContent+(node.children||[]).map(n=>typeof n==='string'?n:text(n)).join('');
test('every case selects complete original user turns without rewriting or renumbering them',()=>{
 const cat=read('content/cases/catalog.json');let count=0;
 for(const g of cat.groups)for(const entry of g.cases){count++;const c=read(entry.url),snapshot=JSON.stringify(c.originalTask),d=context.window.CaseTaskSource.create(c.originalTask,{turns:c.taskTurns}),shown=d.children[1].children;
  assert.equal(JSON.stringify(c.originalTask),snapshot);assert.equal(shown.length,c.taskTurns.length,entry.id);
  for(const [i,turn]of c.taskTurns.entries()){
   const expected=c.originalTask.question[turn].filter(m=>m.role==='user').map(m=>m.content);
   assert.deepEqual(shown[i].children.filter(n=>n.tagName==='p').map(n=>n.textContent),expected);
   if(shown.length>1)assert.equal(shown[i].children[0].textContent,`用户 · 第 ${turn+1} 轮`);
  }
 }
 assert.equal(count,19);
});
test('focused cases omit unrelated later requests while dependent multi-turn tasks retain context',()=>{
 const selected=(kind,id)=>read(`content/cases/${kind}/${id}.json`).taskTurns;
 assert.deepEqual(selected('training','directory-navigation'),[0]);assert.deepEqual(selected('training','ticket-login-before-create'),[5]);assert.deepEqual(selected('inference','watchlist-disambiguation'),[0,1,2]);assert.deepEqual(selected('training','create-and-write-matching-sentence'),[0,1,2]);assert.deepEqual(selected('recovery','create-before-write'),[0,1,3]);
 const c=read('content/cases/training/directory-navigation.json');assert.equal(c.originalTask.question.length,4);
 const shown=text(context.window.CaseTaskSource.create(c.originalTask,{turns:c.taskTurns}));assert.doesNotMatch(shown,/tweet|project_archive/);
 assert.throws(()=>context.window.CaseTaskSource.create(c.originalTask,{turns:[1,0]}),/ordered/);assert.throws(()=>context.window.CaseTaskSource.create(c.originalTask,{turns:[4]}),/range/);
});
