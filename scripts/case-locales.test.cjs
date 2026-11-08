const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const {createHash}=require('node:crypto');
const root=path.resolve(__dirname,'..'),read=p=>JSON.parse(fs.readFileSync(path.join(root,p),'utf8'));
function locale(lang='en'){
 const context={URL,URLSearchParams,location:{origin:'https://example.org',href:'https://example.org/SteerDistill/cases/?group=inference&case=export-sort-direction&left=ours&right=qad&lang='+lang,search:'?lang='+lang},document:{body:{dataset:{page:'cases'}},addEventListener(){},documentElement:{},querySelectorAll:()=>[],querySelector:()=>null},localStorage:{getItem:()=>null,setItem(){}}};context.window=context;
 vm.runInNewContext(fs.readFileSync(path.join(root,'site/locale.js'),'utf8'),context);
 vm.runInNewContext(fs.readFileSync(path.join(root,'site/cases/case-locale.js'),'utf8'),context);vm.runInNewContext(fs.readFileSync(path.join(root,'site/cases/evidence-ui.js'),'utf8'),context);return context;
}
const plain=v=>JSON.parse(JSON.stringify(v));
const at=(data,pointer)=>pointer.slice(1).split('/').map(k=>k.replace(/~1/g,'/').replace(/~0/g,'~')).reduce((v,k)=>v[k],data);
function walk(v,visit,p=''){if(v&&typeof v==='object'){visit(v,p);for(const [k,x]of Object.entries(v))walk(x,visit,p+'/'+k.replace(/~/g,'~0').replace(/\//g,'~1'));}}
const normalize=text=>text.replaceAll('（节选）',' (excerpt)').replace('查询前 (excerpt)','Before the search (excerpt)').replace('查询后、订票前 (excerpt)','After the search, before booking (excerpt)');
test('all nineteen English cases preserve original evidence and validate editorial highlights',()=>{
 const c=locale(),L=c.CaseLocale,U=c.EvidenceUI,catalog=read('content/cases/catalog.json');let count=0;
 for(const group of catalog.groups)for(const entry of group.cases){count++;const original=read(entry.url),snapshot=JSON.stringify(original),overlay=read(`content/cases/en/${group.id}/${entry.id}.json`),en=plain(L.apply(original,overlay));
  assert.equal(overlay.sourceSha256,createHash('sha256').update(fs.readFileSync(path.join(root,entry.url))).digest('hex'),entry.id+' translation needs review');assert.equal(JSON.stringify(original),snapshot);assert.deepEqual(en.originalTask,original.originalTask);assert.equal(en.id,original.id);assert.equal(en.template,original.template);
  assert.equal(en.records.download.href,original.records.download.href);assert.deepEqual(en.records.sources.map(({label,...s})=>s),original.records.sources.map(({label,...s})=>s));
  walk(original,(value,p)=>{
   const localized=at(en,p||'/');if(!p)return;
   if(value.type==='action'){
    assert.equal(localized.name,value.name,p);assert.equal(localized.args,value.args,p);
    if(value.result!==undefined)assert.equal(normalize(localized.result),normalize(value.result),p);
    assert.deepEqual(localized.highlights,value.highlights,p);
   }
   if(value.type==='reply')assert.equal(localized.text,value.text,p);
   if(value.source)assert.deepEqual(localized.source,value.source,p);
   if(value.decision_rule)assert.deepEqual(localized,value,p);
   if(p.includes('/reasoning')&&typeof value.text==='string'){
    assert.equal(normalize(localized.text),normalize(value.text),p);
    assert.deepEqual(localized.highlights?.map(({start,end,...s})=>s),value.highlights?.map(({start,end,...s})=>s),p);
   }
  });
  walk(en,(value,p)=>{
   if(typeof value.text==='string'&&Array.isArray(value.highlights))U.validateSpans(value.text,value.highlights);
   if(value.type==='reply')U.validateSpans(value.text,value.highlights?.text||[]);
   if(value.type==='action')for(const [field,text]of Object.entries({call:`${value.name}(${value.args})`,name:value.name,args:value.args,result:value.result}))if(text!==undefined)U.validateSpans(text,value.highlights?.[field]||[]);
  });
  assert.ok(!/[\u4e00-\u9fff]/.test(en.title+en.summary),entry.id);
 }
 assert.equal(count,19);
});
test('Chinese content remains unchanged; locale paths retain case and record selection',()=>{
 const L=locale('zh').CaseLocale,c=read('content/cases/training/directory-navigation.json');assert.deepEqual(plain(L.apply(c,null)),c);assert.equal(L.t('用户 · 第 {n} 轮',{n:2}),'用户 · 第 2 轮');
 const en=locale().CaseLocale,url=new URL(en.url('/SteerDistill/records/?group=training&case=directory-navigation&source=after&message=4&mode=raw#record'),'https://example.org');
 assert.equal(url.searchParams.get('lang'),'en');assert.equal(url.searchParams.get('source'),'after');assert.equal(url.searchParams.get('message'),'4');assert.equal(url.searchParams.get('mode'),'raw');assert.equal(url.hash,'#record');assert.equal(en.t('用户 · 第 {n} 轮',{n:2}),'User · Turn 2');
});
test('English catalogue matches case overlays without changing routes or numbering',()=>{
 const L=locale().CaseLocale,original=read('content/cases/catalog.json'),catalog=plain(L.apply(original,read('content/cases/en/catalog.json')));
 for(const [gi,g]of catalog.groups.entries())for(const [ci,e]of g.cases.entries()){
  const base=original.groups[gi].cases[ci],overlay=read(`content/cases/en/${g.id}/${e.id}.json`);assert.equal(e.code,base.code);assert.equal(e.url,base.url);assert.equal(e.title,overlay.translations['/title']);assert.equal(e.indexTitle,overlay.indexTitle);
 }
 assert.throws(()=>L.apply({title:'x'},{schemaVersion:1,translations:{'/missing':'y'}}),/Missing/);
});
