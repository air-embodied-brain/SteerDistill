// Optional browser integration check; same environment variables as browser-loading-check.cjs.
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright'),assert=require('node:assert/strict');
const BASE=process.env.BASE_URL||'http://127.0.0.1:18775/';
(async()=>{const b=await chromium.launch({headless:true,...(process.env.BROWSER_EXECUTABLE?{executablePath:process.env.BROWSER_EXECUTABLE}:{})});const p=await b.newPage({viewport:{width:1440,height:1150},reducedMotion:'reduce'});let errors=[];p.on('pageerror',e=>errors.push(String(e)));
for(const id of ['wps','whatsapp','news']){
 await p.goto(`${BASE}?lang=zh&demo=${id}#demo`);const panel=p.locator(`[data-demo-task=${id}]`);await p.waitForSelector(`[data-demo-task=${id}][data-ready=true]`);const card=panel.locator('[data-method=qad]'),slider=panel.locator('.replay-seek');
 const run=await p.evaluate(async id=>(await (await fetch(`demos/${id}/replay.json`)).json()).runs.find(r=>r.id==='qad'),id);const start=run.steps[run.repetition.from].start;
 assert.equal(await card.locator('.replay-step:visible').count(),run.repetition.from);
 await slider.evaluate((e,t)=>{e.value=t;e.dispatchEvent(new Event('input',{bubbles:true}))},start+1);
 await card.scrollIntoViewIfNeeded();await p.waitForTimeout(200);
 assert.match(await card.locator('.replay-repeat-summary').textContent(),/已折叠/);
 const other=await panel.locator('[data-method=ours] .replay-local-time').textContent();
 await card.locator('.replay-fold-toggle').click();assert.equal(await card.locator('.replay-step:visible').count(),30);
 assert.equal(await panel.locator('[data-method=ours] .replay-local-time').textContent(),other);
 await card.locator('.replay-step').nth(20).click();assert.match(await card.locator('.replay-state').textContent(),/21/);
 await card.locator('.replay-fold-toggle').click();assert.equal(await card.locator('.replay-step:visible').count(),run.repetition.from);
 await slider.evaluate(e=>{e.value=e.max;e.dispatchEvent(new Event('input',{bubbles:true}))});assert.match(await card.locator('.replay-outcome').textContent(),/未完成/);
 console.log(id,'fold, expand, local seek, collapse and final PASS');
}
await p.setViewportSize({width:390,height:844});await p.goto(BASE+'?lang=en&demo=wps#demo');await p.waitForSelector('[data-demo-task=wps][data-ready=true]');await p.locator('[data-demo-task=wps] [data-method=qad]').scrollIntoViewIfNeeded();assert.ok(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));assert.deepEqual(errors,[]);await b.close();})().catch(e=>{console.error(e);process.exit(1)});
