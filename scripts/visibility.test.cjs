const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
function fixture(height=400){
 let top=1000,frame;
 const events={},states=[],root={isConnected:true,getBoundingClientRect:()=>({top,bottom:top+height,height})};
 const document={hidden:false,addEventListener:(n,f)=>events[n]=f};
 const c={document,innerHeight:600,window:{},addEventListener:(n,f)=>events[n]=f,requestAnimationFrame:f=>(frame=f,1),ResizeObserver:class{observe(){}}};
 vm.runInNewContext(fs.readFileSync(require('node:path').join(__dirname,'../site/visibility.js'),'utf8'),c);
 c.window.SiteVisibility.observe(root,s=>states.push(s));
 const flush=()=>{const f=frame;frame=null;f?.();};flush();
 return {states,events,document,move:y=>{top=y;events.scroll();flush();}};
}
test('visibility uses a readable entry threshold and re-arms after complete exit',()=>{
 const f=fixture();assert.deepEqual(f.states,[false]);
 f.move(590);assert.deepEqual(f.states,[false]);
 f.move(380);assert.deepEqual(f.states,[false,true]);
 f.move(595);f.move(380);assert.deepEqual(f.states,[false,true],'edge jitter must not restart');
 f.move(600);f.move(380);assert.deepEqual(f.states,[false,true,false,true]);
});
test('tall mobile diagrams can enter; hidden tabs and bfcache re-arm playback',()=>{
 const f=fixture(1200);f.move(0);assert.deepEqual(f.states,[false,true]);
 f.document.hidden=true;f.events.visibilitychange();f.document.hidden=false;f.events.visibilitychange();
 assert.deepEqual(f.states,[false,true,false,true]);
 f.events.pagehide();f.events.pageshow();f.move(0);assert.deepEqual(f.states,[false,true,false,true,false,true]);
});
