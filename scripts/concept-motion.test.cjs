const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
const script=fs.readFileSync(path.join(__dirname,'../site/concept.js'),'utf8');
function fixture(reducedMotion=false){
 const animations=[],handlers={},media={},events={},control={setAttribute(){},addEventListener(n,f){handlers[n]=f}},root={dataset:{},querySelector(selector){
  if(selector==='[data-concept-play]')return control;
  return {style:{},animate(frames,options){const a={frames,options,currentTime:0,pause(){this.state='paused'},play(){this.state='running'}};animations.push(a);return a;}};}};
 const document={hidden:false,timeline:{currentTime:50000},querySelector:()=>root,addEventListener(n,f){events[n]=f}};
 let visibility;
 vm.runInNewContext(script,{document,Element:{prototype:{animate(){}}},matchMedia:()=>({matches:reducedMotion,addEventListener(n,f){media[n]=f}}),SiteVisibility:{observe(root,f){visibility=entries=>f(entries[0].isIntersecting);f(false);f(true);}},window:{addEventListener(n,f){events[n]=f}}});
 return {animations,root,document,handlers,media,events,visibility};
}
test('the flow reaches local verification before retaining and distilling; marks share one clock',()=>{
 const {animations}=fixture();
 for(const a of animations){assert.equal(a.options.duration,17000);assert.equal(a.startTime,50000);assert.equal(a.state,'running');const offsets=Array.from(a.frames,f=>f.offset);assert.deepEqual(offsets,[...offsets].sort((a,b)=>a-b));}
 const byId=id=>animations.find(a=>a.id===id);
 const firstVisible=id=>byId(id).frames.find(f=>f.opacity===1).offset;
 assert.ok(firstVisible('failure')<firstVisible('guidance'));
 assert.ok(firstVisible('verify-failed')<firstVisible('feedback'));
 assert.ok(firstVisible('feedback')<firstVisible('guidance-refined'));
 assert.ok(firstVisible('guidance-refined')<firstVisible('verified'));
 assert.ok(firstVisible('verified')<firstVisible('retain'));
 assert.ok(firstVisible('retain')<firstVisible('learn-1'));
 for(let i=1;i<6;i++)assert.ok(firstVisible(`learn-${i}`)<firstVisible(`learn-${i+1}`));
});
test('manual pause preserves time; viewport re-entry restarts the shared clock',()=>{
 const f=fixture();f.animations.forEach(a=>a.currentTime=5831);f.handlers.click();
 assert.ok(f.animations.every(a=>a.state==='paused'&&a.currentTime===5831));
 f.document.timeline.currentTime=65000;f.handlers.click();
 assert.ok(f.animations.every(a=>a.state==='running'&&a.startTime===59169));
 f.visibility([{isIntersecting:false}]);assert.equal(f.root.dataset.motionRunning,'false');
 f.document.timeline.currentTime=70000;f.visibility([{isIntersecting:true}]);
 assert.ok(f.animations.every(a=>a.startTime===70000&&a.currentTime===0));
});
test('reduced motion shows the completed accepted route without a running animation',()=>{
 const f=fixture(true);assert.equal(f.root.dataset.motionRunning,'false');
 assert.ok(f.animations.every(a=>a.state==='paused'&&a.currentTime===14000));
});

test('labels follow their visual units and only one local retry is visible at a time',()=>{
 const {animations}=fixture();const byId=id=>animations.find(a=>a.id===id);
 const opacityAt=(id,time)=>{
  const frames=byId(id).frames,t=time/17000;
  for(let i=1;i<frames.length;i++)if(t<=frames[i].offset){
   const a=frames[i-1],b=frames[i];return a.opacity+(b.opacity-a.opacity)*(t-a.offset)/(b.offset-a.offset);
  }
  return 0;
 };
 for(let t=0;t<=17000;t+=20){
  const active=id=>opacityAt(id,t)>0.001;
  assert.equal(active('locate-context'),active('decision-1'));
  assert.equal(active('guidance-label'),active('guidance'));
  assert.equal(active('retry-label'),active('retry-failed')||active('retry-corrected'));
  assert.equal(active('verify-label'),active('verify-failed')||active('verified'));
  assert.equal(active('learn-context'),active('learn-1'));
  assert.equal(active('feedback-label'),active('feedback'));
  assert.equal(active('distill-label'),active('retain'));
  assert.ok(!(active('retry-failed')&&active('retry-corrected')));
 }
});
