const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const BASE=process.env.BASE_URL||'http://127.0.0.1:18775/',root=path.resolve(__dirname,'..');
const benchmarkOrder=['BF16','GPTQ','EfficientQAT','BitDistiller','On-Policy QAD','QeRL','SteerDistill'];
const expected=['BF16','SteerDistill','QeRL','On-Policy QAD','BitDistiller','EfficientQAT','GPTQ'];
(async()=>{
 const browser=await chromium.launch({headless:true,...(process.env.BROWSER_EXECUTABLE?{executablePath:process.env.BROWSER_EXECUTABLE}:{})});
 try{
  const p=await browser.newPage({viewport:{width:1440,height:1100},reducedMotion:'reduce'}),errors=[];p.on('pageerror',e=>errors.push(e.message));
  await p.goto(BASE+'article/');await p.waitForSelector('[data-chart=efficiency][data-ready=true]');
  const avg=p.locator('[data-chart=average]'),eff=p.locator('[data-chart=efficiency]');
  assert.equal(await avg.locator('.ac-bar').count(),7);assert.equal(await eff.locator('.ac-band').count(),3);assert.equal(await eff.locator('.ac-curve').count(),3);assert.equal(await eff.locator('.ac-point').count(),40);
  const heights=[];
  for(let i=0;i<5;i++){
   await avg.locator('.ac-settings button').nth(i).click();assert.equal(await avg.locator('.ac-settings button[aria-pressed=true]').count(),1);
   const values=await avg.locator('.ac-bar').evaluateAll(xs=>xs.map(x=>x.getAttribute('aria-label')));
   assert.deepEqual(values.map(v=>v.split('：')[0]),benchmarkOrder);assert.equal(values.length,7);heights.push((await avg.boundingBox()).height);
  }
  assert.ok(Math.max(...heights)-Math.min(...heights)<2,'model selection should preserve figure height');
  await avg.locator('.ac-settings button').nth(2).click();assert.equal(await avg.locator('.ac-bar').nth(0).getAttribute('aria-label'),'BF16：53.54');assert.equal(await avg.locator('.ac-bar').nth(6).getAttribute('aria-label'),'SteerDistill：42.97');
  await eff.locator('.ac-point[aria-label="SteerDistill · 32 GPU 小时：31.68% ± 0.38"]').focus();assert.match(await eff.locator('.ac-inspect').first().textContent(),/31.68% ± 0.38/);
  await eff.locator('.ac-point[aria-label="SteerDistill：4.0K token，Pass@1 31.79%"]').focus();assert.match(await eff.locator('.ac-inspect').last().textContent(),/4.0K token/);
  for(const width of [320,390,768,1440]){
   await p.setViewportSize({width,height:1100});await avg.scrollIntoViewIfNeeded();await p.waitForTimeout(100);
   assert.ok(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'page overflow at '+width);
   for(const chart of [avg,eff]){
    const overflow=await chart.locator('svg').evaluateAll(svgs=>svgs.flatMap(s=>[...s.querySelectorAll('text')].filter(t=>{const b=t.getBBox();return b.x<-.5||b.x+b.width>s.viewBox.baseVal.width+.5}).map(t=>t.textContent)));
    assert.deepEqual(overflow,[],`chart text bounds at ${width}`);
   }
   const plots=await eff.locator('.ac-panel').evaluateAll(xs=>xs.map(x=>({x:x.getBoundingClientRect().x,y:x.getBoundingClientRect().y})));
   assert.equal(Math.abs(plots[0].y-plots[1].y)<1,width>=768);
  }
  // All case methods retain their content IDs through reordered translated selectors.
  const names=fs.readdirSync(path.join(root,'content/cases/inference')).map(n=>n.replace('.json',''));
  for(const lang of ['zh','en'])for(const slug of names){
   await p.goto(`${BASE}cases/?group=inference&case=${slug}&lang=${lang}`);await p.waitForSelector('#method-left');
   assert.deepEqual(await p.locator('#method-left option').allTextContents(),expected);
   assert.equal(await p.locator('#method-left').inputValue(),'bf16');assert.equal(await p.locator('#method-right').inputValue(),'ours');
   await p.locator('#method-right').selectOption('qerl');assert.equal(await p.evaluate(()=>caseController.selected()[1]),'qerl');assert.ok(await p.locator('.comparison-body').textContent());
  }
  await p.goto(BASE+'article/');await p.waitForSelector('[data-chart=efficiency][data-ready=true]');
  assert.deepEqual(await p.locator('[data-case=export-sort-direction] .rail-method').allTextContents(),expected);
  await p.evaluate(()=>document.documentElement.dataset.theme='dark');
  if(process.env.ARTICLE_QA_DIR){fs.mkdirSync(process.env.ARTICLE_QA_DIR,{recursive:true});await eff.screenshot({path:process.env.ARTICLE_QA_DIR+'/efficiency-dark.png'});await avg.screenshot({path:process.env.ARTICLE_QA_DIR+'/average-dark.png'});}
  // A normal-motion page waits until the figure enters, then reveals the real geometry.
  await p.emulateMedia({reducedMotion:'no-preference'});await p.goto(BASE+'article/');await p.waitForSelector('[data-chart=efficiency][data-ready=true]');
  assert.equal(await eff.locator('.ac-panel').first().getAttribute('data-chart-running'),'false');await eff.scrollIntoViewIfNeeded();await p.waitForTimeout(100);assert.equal(await eff.locator('.ac-panel').first().getAttribute('data-chart-running'),'true');
  const transform=await eff.locator('.ac-line-window').evaluate(e=>getComputedStyle(e).transform);await p.waitForTimeout(1800);assert.notEqual(await eff.locator('.ac-line-window').evaluate(e=>getComputedStyle(e).transform),transform);
  await p.evaluate(()=>scrollTo(0,0));await p.waitForTimeout(100);assert.equal(await eff.locator('.ac-panel').first().getAttribute('data-chart-running'),'false');
  await p.goto(BASE+'?lang=zh');await p.waitForSelector('[data-press-chart][data-ready=true]');assert.equal(await p.locator('[data-press-chart] .benchmark-bar').count(),35);await p.locator('#article-start').scrollIntoViewIfNeeded();await p.waitForSelector('[data-chart=efficiency][data-ready=true]');
  assert.deepEqual(errors,[]);console.log('PASS: five settings, BF16 reference, 33 curve points and three bands, seven scatter points, keyboard readouts, responsive bounds, dark theme, 18 localized cases, article order, viewport motion, homepage integration.');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exit(1)});
