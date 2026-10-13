import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import fs from 'node:fs/promises';
const {chromium,webkit}=createRequire(process.env.PLAYWRIGHT_PACKAGE||'C:/Users/kenro/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/package.json')('playwright');
await fs.mkdir('test-results/focus-polish',{recursive:true});
for(const [name,engine] of Object.entries({chromium,webkit})){
 const browser=await engine.launch(name==='chromium'?{channel:'msedge'}:{});
 try{for(const width of [320,820,1440]){
  const context=await browser.newContext({viewport:{width,height:1000},serviceWorkers:'block'}),page=await context.newPage();
  await page.goto(process.env.APP_URL||'http://127.0.0.1:8786/');await page.waitForFunction(()=>window.prototype?.navigation);
  const ready=()=>page.waitForFunction(()=>prototype.ready&&!prototype.busy&&!prototype.loading);
  await page.evaluate(()=>prototype.loadSong('faithful','auto'));await ready();await page.evaluate(()=>prototype.changeKey(2));await ready();
  for(const theme of ['light','dark']){
   await page.evaluate(theme=>{if(document.documentElement.dataset.libraryTheme!==theme)document.querySelector('.library-theme-toggle').click();},theme);
   await page.locator('#score-hide-controls').click();assert.equal(await page.locator('#score-focus-info').textContent(),'View: Transpose · A major');
   const control=await page.locator('#score-show-controls').boundingBox();assert(control.width>=44&&control.height>=44);assert(await page.locator('.score-heading .subtitle').isVisible(),'musical instruction retained');
   assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
   if(width===820&&theme==='dark')await page.screenshot({path:`test-results/focus-polish/${name}-transposed-focus.png`});
   await page.emulateMedia({media:'print'});assert(await page.locator('#score-focus-info').isHidden(),'no added print title');await page.emulateMedia({media:'screen'});
   await page.locator('#score-show-controls').click();assert(await page.locator('#show-lyrics').isVisible());assert(await page.locator('#score-tools').isVisible());
  }
  await page.evaluate(()=>prototype.loadSong('song-d3736eb5-55f8-4103-94fb-e08850bc669b','pdf'));await ready();await page.locator('#score-hide-controls').click();
  const title=page.locator('.score-heading h1');assert.equal(await title.getAttribute('title'),await title.textContent());assert(await title.evaluate(e=>e.scrollWidth<=e.clientWidth&&e.scrollHeight<=e.clientHeight+1));assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
  await page.screenshot({path:`test-results/focus-polish/${name}-${width}-long-title.png`});
  await page.locator('#score-show-controls').click();await page.evaluate(()=>document.documentElement.style.setProperty('--playing-safe-bottom','34px'));await page.waitForTimeout(100);const boxes=await page.locator('#score-tools,#show-lyrics,#score-hide-controls').evaluateAll(es=>es.map(e=>{const r=e.getBoundingClientRect();return {x:r.x,y:r.y,right:r.right,bottom:r.bottom,width:r.width,height:r.height};}));for(const a of boxes){assert(a.width>=44&&a.height>=44&&a.bottom<=1000);for(const z of boxes)if(a!==z)assert(!(a.x<z.right&&a.right>z.x&&a.y<z.bottom&&a.bottom>z.y),'safe-area controls overlap');}await page.locator('#score-tools').click();await page.locator('#score-page-navigation').focus();await page.keyboard.press('Enter');assert(await page.locator('#score-navigation-menu').isVisible());await page.keyboard.press('Escape');assert.equal(await page.evaluate(()=>document.activeElement.id),'score-tools');
  if(width===820){await page.evaluate(()=>prototype.loadSong('shepherd','auto'));await ready();await page.evaluate(()=>prototype.changeKey(2));await ready();await page.locator('#score-hide-controls').click();assert.match(await page.locator('#score-focus-info').textContent(),/^View: Transpose · E minor$/);}console.log('PASS',name,width,'themes, updated key, print title, long title, keyboard menu return');await context.close();
 }}finally{await browser.close();}
}
