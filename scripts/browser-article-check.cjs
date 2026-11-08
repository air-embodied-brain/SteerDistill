// Optional browser QA; use the separate tooling installation, as in browser-loading-check.cjs.
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const BASE=process.env.BASE_URL||'http://127.0.0.1:18775/';
(async()=>{
 const browser=await chromium.launch({headless:true,...(process.env.BROWSER_EXECUTABLE?{executablePath:process.env.BROWSER_EXECUTABLE}:{})});
 try {
  const page=await browser.newPage({viewport:{width:1440,height:1000}}),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.goto(BASE+'article/');await page.waitForSelector('.article-motion');
  await page.waitForFunction(()=>document.documentElement.dataset.fonts!=='loading'&&document.documentElement.dataset.fonts!=='skeleton');
  const repair=page.locator('[data-story=repair]'),distill=page.locator('[data-story=distill]');
  assert.equal(await page.locator('.article-motion').count(),2);
  assert.equal(await repair.getAttribute('data-running'),'false','offscreen figures must not run');
  await repair.scrollIntoViewIfNeeded();await page.waitForTimeout(100);
  assert.equal(await repair.getAttribute('data-running'),'true');
  const progress=()=>repair.evaluate(e=>e.style.getPropertyValue('--am-progress'));
  const a=await progress();await page.waitForTimeout(180);assert.notEqual(await progress(),a);
  await repair.locator('.am-play').click();const paused=await progress();await page.waitForTimeout(160);assert.equal(await progress(),paused);
  for(const [figure,count] of [[repair,5],[distill,4]]){
   const heights=[];
   for(let i=0;i<count;i++){
    await figure.locator('.am-steps button').nth(i).click();await page.waitForTimeout(650);
    assert.equal(await figure.getAttribute('data-stage'),String(i));
    assert.equal(await figure.getAttribute('data-running'),'false');
    assert.equal(await figure.locator('.am-steps button[aria-pressed=true]').count(),1);
    heights.push((await figure.boundingBox()).height);
   }
   assert.ok(Math.max(...heights)-Math.min(...heights)<2,'captions must not shift the article');
  }
  await distill.locator('.am-play').click();await page.waitForTimeout(120);
  await page.evaluate(()=>scrollTo(0,0));await page.waitForTimeout(150);assert.equal(await distill.getAttribute('data-running'),'false');
  // Emulate GitHub Pages' project mount on the local root-only static server.
  await page.route('**/SteerDistill/**',async route=>{
   const url=new URL(route.request().url());url.pathname=url.pathname.replace(/^\/SteerDistill\//,'/');
   const response=await route.fetch({url:url.href});await route.fulfill({response});
  });
  // Every new case link resolves at root and under that project mount.
  for(const prefix of ['', 'SteerDistill/']){
   await page.goto(BASE+prefix+'article/');await page.waitForSelector('[data-ready=true] .main-prose');
   const hrefs=await page.locator('.main-prose a[href]:not(.note-ref),.article-case figcaption a').evaluateAll(xs=>xs.map(x=>x.href));
   for(const href of new Set(hrefs)){
    assert.ok(new URL(href).pathname.startsWith('/'+prefix+'cases/'),href);
    assert.equal(await page.evaluate(async href=>(await fetch(href)).status,href),200,href);
   }
  }
  await page.emulateMedia({reducedMotion:'reduce'});
  for(const width of [320,390,768,1440]){
   await page.setViewportSize({width,height:1000});await page.goto(BASE+'article/');await page.waitForSelector('.article-motion');
   assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'page overflow at '+width);
   for(const story of ['repair','distill']){
    const figure=page.locator(`[data-story=${story}]`);await figure.scrollIntoViewIfNeeded();
    assert.equal(await figure.getAttribute('data-running'),'false');
    assert.equal(await figure.getAttribute('data-stage'),story==='repair'?'4':'3');
    const overflow=await figure.locator('svg:visible').evaluate(svg=>{
     const width=svg.viewBox.baseVal.width;
     return [...svg.querySelectorAll('text')].filter(t=>getComputedStyle(t).opacity!=='0').filter(t=>{const b=t.getBBox();return b.x<-.5||b.x+b.width>width+.5}).map(t=>t.textContent);
    });assert.deepEqual(overflow,[],`${story} SVG text overflow at ${width}`);
    if(width<=390){const heights=[];const count=story==='repair'?5:4;for(let i=0;i<count;i++){await figure.locator('.am-steps button').nth(i).click();heights.push((await figure.boundingBox()).height);}assert.ok(Math.max(...heights)-Math.min(...heights)<2,`${story} mobile caption height at ${width}`);}

   }
   if(process.env.ARTICLE_QA_DIR){fs.mkdirSync(process.env.ARTICLE_QA_DIR,{recursive:true});await page.screenshot({path:process.env.ARTICLE_QA_DIR+`/article-${width}.png`,fullPage:true});}
  }
  // Both supervision paths stay visible in the reduced-motion overview.
  for(const cls of ['.am-fkl','.am-rkl'])assert.equal(await distill.locator('.am-desktop '+cls).evaluate(e=>getComputedStyle(e).opacity),'1');
  await page.evaluate(()=>document.documentElement.dataset.theme='dark');
  if(process.env.ARTICLE_QA_DIR)await distill.screenshot({path:process.env.ARTICLE_QA_DIR+'/distill-dark.png'});
  await page.goto(BASE+'?lang=zh');await page.locator('#article-start').scrollIntoViewIfNeeded();await page.waitForSelector('.article-motion');assert.equal(await page.locator('.article-motion').count(),2);
  assert.deepEqual(errors,[]);console.log('PASS: animation lifecycle, manual steps, static overview, stable captions, responsive SVG text, themes, article links at both hosting prefixes, homepage continuation; no page errors.');
 } finally {await browser.close();}
})().catch(e=>{console.error(e);process.exit(1)});
