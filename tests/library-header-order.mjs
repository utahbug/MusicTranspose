import {createRequire} from 'node:module';
import {execFileSync} from 'node:child_process';
import assert from 'node:assert/strict';
const {chromium}=createRequire('C:/Users/kenro/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/package.json')('playwright');
const browser=await chromium.launch({channel:'msedge',headless:true});
const base=Object.fromEntries(['index.html','styles.css'].map(f=>[f,execFileSync('git',['show',`3890712:${f}`],{encoding:'utf8'})]));
async function check(width,baseline){
 const context=await browser.newContext({viewport:{width,height:1000},serviceWorkers:'block'}),page=await context.newPage();
 if(baseline){await page.route('http://127.0.0.1:8780/',r=>r.fulfill({contentType:'text/html',body:base['index.html']}));await page.route('**/styles.css',r=>r.fulfill({contentType:'text/css',body:base['styles.css']}));}
 await page.goto('http://127.0.0.1:8780/');await page.locator('[data-home-source=all]').click();
 const search=await page.locator('.library-search-row').evaluate(e=>({html:e.outerHTML,box:e.getBoundingClientRect().toJSON()}));
 if(!baseline){
  const ids=['library-source','order-toggle','library-lists','library-more','view-favorites'];
  const boxes=await Promise.all(ids.map(id=>page.locator('#'+id).boundingBox()));
  for(let i=1;i<boxes.length;i++)assert(boxes[i].x>=boxes[i-1].x+boxes[i-1].width-1,`order ${ids[i]}`);
  const row=await page.locator('.library-filter-row').boundingBox(),star=boxes.at(-1);
  assert.equal(star.x+star.width,row.x+row.width);assert.equal(star.width,44);assert.equal(star.height,44);
  assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
  const fav=page.locator('#view-favorites');await fav.press('Enter');assert.equal(await fav.getAttribute('aria-pressed'),'true');assert.equal(await fav.locator('svg').evaluate(e=>getComputedStyle(e).fill),'rgb(70, 104, 121)');await fav.press('Space');assert.equal(await fav.getAttribute('aria-pressed'),'false');assert.equal(await fav.locator('svg').evaluate(e=>getComputedStyle(e).fill),'none');
  await page.locator('#library-more').click();await page.locator('#library-more-dialog').waitFor({state:'visible'});await page.keyboard.press('Escape');assert(await page.locator('#library-more-dialog').isHidden());
  await page.locator('#library-lists').click();await page.locator('#lists-view').waitFor({state:'visible'});await page.locator('#lists-library').click();await page.locator('#library').waitFor({state:'visible'});
  await page.locator('#library-lists').hover();assert.equal(await page.locator('#library-lists').evaluate(e=>getComputedStyle(e).textDecorationLine),'underline');await page.mouse.move(1,1);
  if(width===390){await page.locator('#library-search-options').click();assert(await page.locator('#library-search-fields').isVisible());await page.keyboard.press('Escape');assert(await page.locator('#library-search-fields').isHidden());}
  await page.locator('.library-header-panel').screenshot({path:`test-results/library-header-order-${width}.png`});
 }
 await context.close();return search;
}
try{for(const width of [390,820,1440]){const before=await check(width,true),after=await check(width,false);assert.deepEqual(after,before,'Search row markup and geometry unchanged');console.log('PASS control order, far-right Favorites, toggle, Lists/More, Search unchanged:',width);}}finally{await browser.close();}
