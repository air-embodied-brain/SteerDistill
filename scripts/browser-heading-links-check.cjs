/* Heading permalinks across lazy article rendering, locales and continuous routes. */
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const assert=require('node:assert/strict');
const BASE=process.env.BASE_URL||'http://127.0.0.1:18775/';
(async()=>{
 const browser=await chromium.launch({headless:true,...(process.env.BROWSER_EXECUTABLE?{executablePath:process.env.BROWSER_EXECUTABLE}:{})});
 try{
  const page=await browser.newPage({viewport:{width:1440,height:1000},reducedMotion:'reduce'}),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  const ready=()=>page.waitForSelector('html[data-reading-ready=true]');
  const aligned=async id=>{
   await page.waitForFunction(id=>{
    const top=document.getElementById(id)?.getBoundingClientRect().top;
    return Math.abs(top-document.querySelector('.site-header').offsetHeight-20)<5;
   },id);
  };
  for(const prefix of ['', 'SteerDistill/']){
   if(prefix)await page.route('**/SteerDistill/**',async route=>{
    const url=new URL(route.request().url());url.pathname=url.pathname.replace('/SteerDistill/','/');
    const response=await route.fetch({url:url.href});await route.fulfill({response});
   });
   for(const lang of ['en','zh']){
    const base=BASE+prefix,homePath=new URL(base).pathname;
    await page.goto(base+'?lang='+lang+'#steerdistill-in-action');await ready();await aligned('steerdistill-in-action');
    assert.equal(new URL(page.url()).pathname,homePath);
    assert.equal(await page.locator('#steerdistill-in-action .section-link').textContent(),lang==='en'?'SteerDistill in action':'SteerDistill 的实际表现');
    await page.locator('#steerdistill-in-action .section-link').focus();
    assert.equal(await page.locator('#steerdistill-in-action .section-link').evaluate(a=>getComputedStyle(a,'::after').opacity),'1');
    await page.locator('#steerdistill-in-action .section-link').press('Enter');await aligned('steerdistill-in-action');
    await page.reload();await ready();await aligned('steerdistill-in-action');
    // An article-route URL pointing above the article must retain its fragment when normalized.
    await page.goto(base+'article/?lang='+lang+'#benchmark-results');await ready();await aligned('benchmark-results');
    assert.equal(new URL(page.url()).pathname,homePath);assert.equal(new URL(page.url()).hash,'#benchmark-results');
    await page.goto(base+'?lang='+lang+'#method');await ready();await aligned('method');
    assert.equal(new URL(page.url()).pathname,homePath+'article/');
    const ids=['problem','method','learning','guidance','recovery','results','notes','resources'];
    for(const id of ids){
     const a=page.locator(`#${id} h2 .section-link`);
     assert.equal(await a.getAttribute('href'),'#'+id);
     if(id==='notes')continue; // Desktop uses margin notes; endnotes are visible on narrow screens.
     await a.click();await page.waitForURL(url=>url.hash==='#'+id);
     // End sections may be too close to the bottom to align to the header.
     if(!['notes','resources'].includes(id))await aligned(id);
    }
    await page.locator('#method h2 .section-link').click();await aligned('method');
    await page.reload();await ready();await aligned('method');
    // Dispatch without Playwright scrolling to the distant link before recording history.
    await page.evaluate(()=>document.querySelector('#steerdistill-in-action .section-link').click());await aligned('steerdistill-in-action');
    assert.equal(new URL(page.url()).pathname,homePath);assert.equal(new URL(page.url()).hash,'#steerdistill-in-action');
    await page.goBack();await aligned('method');await page.goForward();await aligned('steerdistill-in-action');
    await page.locator('.site-language').click();await ready();await aligned('steerdistill-in-action');
    assert.equal(new URL(page.url()).hash,'#steerdistill-in-action');
    await page.setViewportSize({width:390,height:667});
    await page.goto(base+'article/?lang='+lang+'#method');await ready();await aligned('method');
    assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'no mobile overflow');
    await page.locator('#method h2 .section-link').focus();
    assert.equal(await page.locator('#method h2 .section-link').evaluate(a=>getComputedStyle(a,'::after').opacity),'1');
    await page.locator('#notes h2 .section-link').click();assert.equal(new URL(page.url()).hash,'#notes');
    await page.setViewportSize({width:1440,height:1000});
    console.log(`PASS: ${prefix||'/'} ${lang}: heading links, refresh, language, history and mobile`);
   }
   if(prefix)await page.unroute('**/SteerDistill/**');
  }
  assert.deepEqual(errors,[]);
 }finally{await browser.close()}
})().catch(error=>{console.error(error);process.exit(1)});
