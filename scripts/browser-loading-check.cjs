// Optional browser check: use an installed Playwright module and Chromium.
// BASE_URL points to a preview or a baseline checkout served separately.
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const assert=require('node:assert/strict');
(async()=>{
 const browser=await chromium.launch({headless:true,...(process.env.BROWSER_EXECUTABLE?{executablePath:process.env.BROWSER_EXECUTABLE}:{})});
 const page=await browser.newPage({viewport:{width:1440,height:1050}});let images=0;const errors=[];
 page.on('pageerror',e=>errors.push(String(e)));
 await page.route('**/*',async route=>{
  const image=/\/demos\/.*\.(png|webp|jpg)/.test(route.request().url());if(image)images++;
  await new Promise(resolve=>setTimeout(resolve,image?800:150));await route.continue();
 });
 const started=Date.now();await page.goto((process.env.BASE_URL||'http://localhost:18775/')+'?lang=en#demo');
 await page.waitForSelector('[data-demo-task=wps][data-ready=true]',{timeout:60000});
 console.log(JSON.stringify({interactiveMs:Date.now()-started,imagesRequestedAtReady:images,fontResources:await page.evaluate(()=>performance.getEntriesByType('resource').filter(x=>x.name.includes('.woff2')).map(x=>({url:new URL(x.name).pathname,bytes:x.decodedBodySize})))}));
 assert.deepEqual(errors,[]);await browser.close();
})().catch(error=>{console.error(error);process.exit(1)});
