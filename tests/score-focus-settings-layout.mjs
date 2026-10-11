import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
const {chromium,webkit}=createRequire(process.env.PLAYWRIGHT_PACKAGE||'C:/Users/kenro/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/package.json')('playwright');
for(const [name,engine] of Object.entries({chromium,webkit})){
 const browser=await engine.launch(name==='chromium'?{channel:'msedge'}:{});
 try{for(const phone of [false,true])for(const width of [320,390,744,820,1024,1440]){
  const context=await browser.newContext({viewport:{width,height:1000},serviceWorkers:'block',...(phone?{userAgent:width<600?'iPhone':'iPad',isMobile:true,hasTouch:true}:{})});
  const page=await context.newPage();
  if(process.env.BASELINE)await page.route('**/icon-system.css',async route=>{const response=await route.fetch();await route.fulfill({response,body:(await response.text()).split('/* Narrow desktop keeps')[0]});});
  await page.goto(process.env.APP_URL||'http://127.0.0.1:8780/');
  await page.waitForFunction(()=>window.prototype?.navigation);
  await page.evaluate(()=>prototype.loadSong('nativity','normal'));
  const ready=()=>page.waitForFunction(()=>prototype.ready&&!prototype.busy&&!prototype.loading&&document.querySelector('#score').getAttribute('aria-busy')==='false');await ready();
  for(const shift of [0,2]){
   if(shift){await page.evaluate(()=>prototype.changeKey(2));await ready();}
   for(const theme of ['light','dark']){
    await page.evaluate(t=>document.documentElement.dataset.libraryTheme=t,theme);
    const boxes=await page.locator('.masthead button:visible').evaluateAll(es=>es.filter(e=>getComputedStyle(e).visibility!=='hidden').map(e=>{const r=e.getBoundingClientRect();return {id:e.id,x:r.x,y:r.y,w:r.width,h:r.height,hit:document.elementFromPoint(r.x+r.width/2,r.y+r.height/2)?.closest('button')?.id};}));
    for(const id of ['songs','score-size','key','show-lyrics','score-tools',...(!phone||width>=600?['score-hide-controls']:[])]){
     const r=boxes.find(r=>r.id===id);assert(r,`${name} ${width}: missing ${id}`);assert(r.w>=44&&r.h>=44,JSON.stringify(r));assert(r.x>=0&&r.x+r.w<=width+.5,JSON.stringify(r));assert.equal(r.hit,id,`${name} ${width} ${theme} intercepted target`);
    }
    for(let i=0;i<boxes.length;i++)for(let j=i+1;j<boxes.length;j++){const a=boxes[i],b=boxes[j];assert(Math.min(a.x+a.w,b.x+b.w)-Math.max(a.x,b.x)<.5||Math.min(a.y+a.h,b.y+b.h)-Math.max(a.y,b.y)<.5,`${width}: ${a.id} overlaps ${b.id}`);}
    assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
    await page.locator('#score-tools').click();assert(await page.locator('#score-tools-menu').isVisible());await page.keyboard.press('Escape');
    if(await page.locator('#score-hide-controls').isVisible()){
     const before=await page.locator('.masthead').boundingBox();await page.locator('#score-hide-controls').click();assert(await page.locator('#score-show-controls').isVisible());await page.locator('#score-show-controls').click();assert.deepEqual(await page.locator('.masthead').boundingBox(),before);
     await page.locator('#score-tools').focus();await page.keyboard.press('Enter');assert(await page.locator('#score-tools-menu').isVisible());await page.keyboard.press('Escape');
    }
   }
  }
  for(const mode of ['pages','continuous']){await page.locator('#score-navigation-button').click();await page.locator(`[data-navigation=${mode}]`).click();await page.locator('#score-tools').click();assert(await page.locator('#score-tools-menu').isVisible());await page.keyboard.press('Escape');}
  await page.locator('#show-lyrics').click();await page.locator('#lyrics-view').waitFor({state:'visible'});await page.locator('.lyrics-score-toggle').click();await ready();assert(await page.locator('#score-tools').isVisible());
  console.log('PASS',name,phone?'mobile':'desktop',width,'both keys/themes, target geometry, Settings/Focus keyboard and clicks, navigation and Lyrics');await context.close();
 }}finally{await browser.close();}
}
