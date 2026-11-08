// Optional: PLAYWRIGHT_MODULE, BROWSER_EXECUTABLE and BASE_URL as in browser-loading-check.cjs.
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright'),assert=require('node:assert/strict');
const BASE=process.env.BASE_URL||'http://127.0.0.1:18775/';
(async()=>{const b=await chromium.launch({headless:true,...(process.env.BROWSER_EXECUTABLE?{executablePath:process.env.BROWSER_EXECUTABLE}:{})});
for(const mode of ['cold','delay','failure','timeout','dark']){
 const p=await b.newPage({viewport:{width:1440,height:1050},reducedMotion:'reduce'});const errors=[];p.on('pageerror',e=>errors.push(String(e)));
 await p.addInitScript(mode=>{localStorage.setItem('steerdistill-language','zh');if(mode==='dark')localStorage.setItem('steerdistill-theme','dark')},mode);
 if(['delay','failure','timeout'].includes(mode))await p.route('**/*.woff2',async r=>{if(mode==='failure')return r.abort();await new Promise(s=>setTimeout(s,mode==='timeout'?5200:1400));await r.continue().catch(()=>{});});
 await p.goto(BASE+'?lang=zh',{waitUntil:'domcontentloaded'});
 if(mode==='delay'){assert.equal(await p.locator('html').getAttribute('data-fonts'),'skeleton');}
 await p.waitForFunction(()=>['ready','fallback'].includes(document.documentElement.dataset.fonts));
 const state=await p.locator('html').getAttribute('data-fonts');assert.equal(state,['failure','timeout'].includes(mode)?'fallback':'ready');
 assert.equal(await p.locator('.font-placeholder').count(),0);assert.deepEqual(errors,[]);

 if(mode==='timeout'){await p.waitForTimeout(1600);assert.equal(await p.locator('html').getAttribute('data-fonts'),'fallback');assert.ok((await p.locator('h1').first().evaluate(e=>getComputedStyle(e).fontFamily)).includes('Georgia'));}
 if(mode==='cold'){await p.reload();await p.waitForFunction(()=>document.documentElement.dataset.fonts==='ready');assert.equal(await p.locator('.font-placeholder').count(),0);}
 console.log(mode,state,await p.evaluate(()=>performance.getEntriesByName('site-text-ready')[0]?.startTime));await p.close();
}
const p=await b.newPage({viewport:{width:1440,height:1050},reducedMotion:'reduce'});const errs=[];p.on('pageerror',e=>errs.push(String(e)));
for(const route of ['cases/?lang=en','records/?lang=zh','article/']){await p.goto(BASE+route);await p.waitForFunction(()=>document.documentElement.dataset.fonts==='ready');assert.equal(await p.locator('.font-placeholder').count(),0);console.log(route,'ready');}
for(const id of ['wps','whatsapp','news']){
 await p.goto(`${BASE}?lang=zh&demo=${id}#demo`);await p.waitForSelector(`[data-demo-task=${id}][data-ready=true]`);
 const card=p.locator(`[data-demo-task=${id}] [data-method=qad]`);assert.equal(await card.locator('.replay-step').count(),30);
 await card.locator('.replay-step').last().evaluate(e=>e.click());await p.waitForTimeout(500);
 assert.equal(await card.locator('.ev-prose').getAttribute('lang'),'zh-CN');
 await card.scrollIntoViewIfNeeded();console.log(id,await card.locator('.ev-prose').textContent());
}
assert.deepEqual(errs,[]);await b.close();})().catch(e=>{console.error(e);process.exit(1)});
