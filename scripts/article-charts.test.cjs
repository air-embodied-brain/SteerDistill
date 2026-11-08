const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.resolve(__dirname,'..'),read=p=>fs.readFileSync(path.join(root,p),'utf8');
function data(fetch=()=>{}){const c={window:{},fetch,SitePaths:{url:p=>'/SteerDistill/'+p}};vm.runInNewContext(read('site/chart-data.js'),c);return c.window.ResearchChartData;}
test('all five average settings retain the same-model BF16 reference and all seven methods',()=>{
 const d=data(),rows=d.parseScores(read('experiments/data/benchmark_results.csv'));
 for(const[model,precision]of d.settings){const selected=d.selected(rows,model,precision);assert.equal(selected.length,7);assert.equal(selected[0].precision,'BF16');assert.equal(selected[0].model,model);
  for(const row of selected){assert.equal(row.model,model);if(row.method!=='BF16')assert.equal(row.precision,precision);const mean=['bfcl_v4','tau2_bench','webshop','alfworld','search_qa'].reduce((s,k)=>s+row[k],0)/5;assert.ok(Math.abs(mean-row.average)<.011);}
 }
 assert.throws(()=>d.selected(rows,'Qwen3.5-4B','W2A16'),/Missing score/);
});
test('homepage and article share score requests; failed loads remain retryable',async()=>{
 let requests=0;const d=data(async url=>{requests++;assert.equal(url,'/SteerDistill/experiments/data/benchmark_results.csv');return{ok:requests>1,text:async()=>read('experiments/data/benchmark_results.csv')}});
 await assert.rejects(d.scores(),/unavailable/);const[a,b]=await Promise.all([d.scores(),d.scores()]);assert.strictEqual(a,b);assert.equal(requests,2);
});
test('efficiency means and deviations align; final inference differs from the 32-hour checkpoint',()=>{
 const d=JSON.parse(read('experiments/data/efficiency.json')),scores=data().parseScores(read('experiments/data/benchmark_results.csv'));
 assert.equal(d.source.script_sha256,'87cc5cbb3e216f95c69f417c4920c1f40e483a1cb6265525eda3ed2fd2d59577');
 for(const [name,values]of Object.entries(d.series)){assert.equal(values.length,d.hours.length);assert.equal(d.std[name].length,d.hours.length);assert.ok(d.std[name].every(v=>Number.isFinite(v)&&v>=0));}
 assert.ok(d.hours.every((h,i)=>i===0||h>d.hours[i-1]));assert.equal(d.series.SteerDistill[d.hours.indexOf(32)],31.68);assert.equal(d.std.SteerDistill[d.hours.indexOf(32)],.38);
 for(const name of Object.keys(d.tokens)){const row=scores.find(r=>r.model==='Qwen3-8B'&&r.precision==='W4A16'&&r.method===name);assert.equal(d.tau2[name].W4A16,row.tau2_bench);}
 assert.equal(d.tau2.Ours.W4A16,31.79);assert.notEqual(d.series.SteerDistill[4],d.tau2.Ours.W4A16);
});
test('all inference selectors and article rails share the requested reading order',()=>{
 const expected=['BF16','SteerDistill','QeRL','On-Policy QAD','BitDistiller','EfficientQAT','GPTQ'];
 for(const name of fs.readdirSync(path.join(root,'content/cases/inference'))){const c=JSON.parse(read('content/cases/inference/'+name));assert.deepEqual(c.presentation.methods.map(m=>m.name),expected,name);assert.deepEqual(c.presentation.defaultPair,['bf16','ours']);}
 const article=JSON.parse(read('content/article/cases.zh.json'));for(const s of article.sections)if(s.case.kind==='inference'){assert.deepEqual(s.case.carouselBranches.map(m=>m.title),expected);assert.equal(s.case.carouselInitial,'bf16');}
});
