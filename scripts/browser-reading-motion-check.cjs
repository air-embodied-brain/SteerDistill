/* Regressions for continuous navigation and repeatable viewport animations. */
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const assert=require('node:assert/strict');
const BASE=process.env.BASE_URL||'http://127.0.0.1:18775/';
(async()=>{
 const browser=await chromium.launch({headless:true,...(process.env.BROWSER_EXECUTABLE?{executablePath:process.env.BROWSER_EXECUTABLE}:{})});
 try{
  const p=await browser.newPage({viewport:{width:1440,height:1000}}),errors=[];
  p.on('pageerror',e=>errors.push(e.message));
  const clickNav=async selector=>{const box=await p.locator(selector).boundingBox();await p.mouse.click(box.x+box.width/2,box.y+box.height/2);};
  const ready=()=>p.waitForSelector('html[data-reading-ready=true]');
  const atArticle=()=>p.waitForFunction(()=>document.querySelector('[data-article-surface]').getBoundingClientRect().top<110&&document.querySelector('[data-article-surface]').getBoundingClientRect().top>0);
  await p.goto(BASE+'?lang=zh');await ready();await p.evaluate(()=>window.navigationSentinel=1);
  await clickNav('.site-nav [data-nav=article]');await atArticle();
  assert.match(p.url(),/\/article\//);assert.equal(await p.evaluate(()=>window.navigationSentinel),1,'click retains the home document');
  await p.waitForTimeout(250);const articleY=await p.evaluate(()=>scrollY);
  await p.evaluate(()=>scrollTo({top:0,behavior:'instant'}));await p.waitForTimeout(250);
  assert.equal(new URL(p.url()).pathname,'/');assert.ok(await p.locator('.paper-name').isVisible());
  await clickNav('.site-nav [data-nav=article]');await atArticle();await p.waitForTimeout(250);
  await clickNav('.site-brand');await p.waitForFunction(()=>scrollY<2);await p.waitForTimeout(250);
  await p.goBack();await atArticle();await p.waitForTimeout(250);assert.ok(Math.abs((await p.evaluate(()=>scrollY))-articleY)<5);
  await p.goForward();await p.waitForFunction(()=>scrollY<2);
  console.log('PASS: same-document navigation and browser history');
  // Fresh direct entry and refresh both retain the entire surface above the post.
  await p.goto(BASE+'article/?lang=zh');await ready();await atArticle();
  assert.ok(await p.locator('.home-main').count());await p.reload();await ready();await atArticle();
  await p.evaluate(()=>scrollTo(0,0));await p.waitForTimeout(250);assert.equal(new URL(p.url()).pathname,'/');
  // Re-enter the hero from below; every WAAPI mark restarts on one clock.
  const concept=p.locator('[data-concept-motion]');await concept.scrollIntoViewIfNeeded();await p.waitForTimeout(500);
  await p.evaluate(()=>scrollTo(0,document.body.scrollHeight));await p.waitForTimeout(100);
  await concept.scrollIntoViewIfNeeded();await p.waitForTimeout(150);
  const times=await concept.evaluate(e=>e.getAnimations({subtree:true}).map(a=>a.currentTime));
  assert.ok(times.length>20&&times.every(t=>t<500));assert.ok(Math.max(...times)-Math.min(...times)<2);
  // Let each finite plot finish, leave, then check that its timeline starts anew.
  for(const selector of ['[data-press-chart]','[data-chart=average]','[data-chart=efficiency] .ac-panel:first-child','[data-chart=efficiency] .ac-panel:last-child']){
   const chart=p.locator(selector);await chart.scrollIntoViewIfNeeded();await p.waitForTimeout(2100);
   assert.equal(await chart.getAttribute('data-chart-running'),'true',selector);
   await p.evaluate(home=>scrollTo(0,home?document.body.scrollHeight:0),selector==='[data-press-chart]');await p.waitForTimeout(100);
   assert.equal(await chart.getAttribute('data-chart-running'),'false',selector+' offscreen');
   await chart.scrollIntoViewIfNeeded();await p.waitForTimeout(140);
   const times=await chart.evaluate(e=>e.getAnimations({subtree:true}).filter(a=>a instanceof CSSAnimation).map(a=>a.currentTime));
   assert.ok(times.length&&times.every(t=>t<500),selector+' replay');
  }
  for(const story of ['repair','distill']){
   const figure=p.locator(`[data-story=${story}]`);await figure.scrollIntoViewIfNeeded();await p.waitForTimeout(1800);
   assert.equal(await figure.getAttribute('data-stage'),'1');
   const last=story==='repair'?4:3;await figure.locator('.am-steps button').nth(last).click();await figure.locator('.am-play').click();
   await p.waitForTimeout(2100);assert.equal(await figure.getAttribute('data-stage'),String(last),'completed diagram holds longer than intermediate steps');
   await p.waitForTimeout(2900);assert.equal(await figure.getAttribute('data-stage'),'0','loop resumes after the final hold');
   await p.evaluate(()=>scrollTo(0,0));await p.waitForTimeout(100);await figure.scrollIntoViewIfNeeded();await p.waitForTimeout(150);
   assert.equal(await figure.getAttribute('data-stage'),'0');
   await figure.locator('.am-steps button').nth(2).click();await p.evaluate(()=>scrollTo(0,0));await p.waitForTimeout(100);await figure.scrollIntoViewIfNeeded();await p.waitForTimeout(100);
   assert.equal(await figure.getAttribute('data-stage'),'2');assert.equal(await figure.getAttribute('data-running'),'false','manual pause persists');
  }
  console.log('PASS: figure replay and manual pause');
  // Root and project-prefix deep links, short mobile viewport, and reduced motion.
  await p.route('**/SteerDistill/**',async route=>{const url=new URL(route.request().url());url.pathname=url.pathname.replace(/^\/SteerDistill\//,'/');await route.fulfill({response:await route.fetch({url:url.href})});});
  for(const prefix of ['', 'SteerDistill/']){
   await p.goto('about:blank');await p.setViewportSize({width:390,height:667});await p.goto(BASE+prefix+'article/?lang=zh#method');await ready();
   const top=await p.locator('#method').evaluate(e=>e.getBoundingClientRect().top);assert.ok(top>0&&top<110,'deep link position');
   assert.equal(await p.locator('[data-home-tldr] a').evaluate(a=>a.href),BASE.replace(/\/$/,'')+'/'+prefix+'article/?lang=zh#method');
   assert.ok(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
   const figure=p.locator('[data-story=repair]');await figure.scrollIntoViewIfNeeded();await p.waitForTimeout(100);assert.equal(await figure.getAttribute('data-running'),'true','tall mobile figure runs');
   await clickNav('.site-brand');await p.waitForFunction(()=>scrollY<2);assert.equal(new URL(p.url()).pathname,'/'+prefix);
  }
  await p.emulateMedia({reducedMotion:'reduce'});await p.goto(BASE+'article/?lang=zh');await ready();
  await p.locator('[data-story=repair]').scrollIntoViewIfNeeded();assert.equal(await p.locator('[data-story=repair]').getAttribute('data-stage'),'4');assert.equal(await p.locator('[data-story=repair]').getAttribute('data-running'),'false');
  await p.locator('[data-chart=average]').scrollIntoViewIfNeeded();assert.equal(await p.locator('[data-chart=average]').evaluate(e=>e.getAnimations({subtree:true}).length),0);
  assert.deepEqual(errors,[]);
  console.log('PASS: continuous click/scroll/direct-entry navigation, refresh, history, deep links, project prefix, every figure replays, manual pause, short mobile viewport, reduced motion.');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exit(1)});
