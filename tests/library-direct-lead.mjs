import {createRequire} from 'node:module';
import assert from 'node:assert/strict';
const {chromium}=createRequire(process.env.PLAYWRIGHT_PACKAGE)('playwright');
const browser=await chromium.launch({channel:'msedge',headless:true});
try{for(const [width,height] of [[320,568],[390,844],[844,390],[820,1180],[1440,1000]]){
 const context=await browser.newContext({viewport:{width,height},hasTouch:width<1000}),page=await context.newPage(),errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 await context.addInitScript(()=>{if(!localStorage.getItem('lead-action-seeded')){localStorage.setItem('lead-action-seeded','1');localStorage.setItem('music-transpose-library-v1',JSON.stringify({orderingVersion:1,favorites:['cs-168'],groups:[{id:'direct',name:'Practice',songs:['nativity','cs-168','hhc-1054']}]}));}});
 await page.goto(process.env.TEST_URL||'http://127.0.0.1:8771/');await page.locator('.library-row').first().waitFor();
 const ready=()=>page.waitForFunction(()=>prototype.ready&&!prototype.busy&&document.querySelector('#score').getAttribute('aria-busy')==='false');
 const select=async value=>{await page.locator('#library-source').click();await page.locator(`[data-source="${value}"]`).click();};
 const lead=()=>page.locator('[data-song="cs-168"] [aria-label="Open Lead sheet"]');
 const available=await page.evaluate(async()=>{const {songs,supportsLead}=await import('./catalog.js');return songs.filter(supportsLead).map(s=>s.id);});
 const rows=await page.locator('.library-row').evaluateAll(es=>es.map(e=>({id:e.dataset.song,lead:!!e.querySelector('[aria-label="Open Lead sheet"]'),actions:e.querySelector('.song-view-actions').getBoundingClientRect().width})));
 assert.equal(rows.filter(r=>r.lead).length,available.length);
 for(const row of rows){assert.equal(row.lead,available.includes(row.id));assert.equal(row.actions,row.lead?88:44);}
 await page.locator('#library-filter').click();await page.locator('#view-lead-sheets').click();await page.keyboard.press('Escape');
 assert.equal(await page.locator('.library-row').count(),available.length);assert.equal(await page.locator('[aria-label="Open Lead sheet"]').count(),available.length);
 await select('list:direct');await page.locator('#library-search').fill('Missionary');
 const row=page.locator('[data-song="cs-168"]');
 const bounds=await row.evaluate(e=>{const selectors=['.song-entry','[title="Lyrics"]','[aria-label="Open Lead sheet"]','.favorite'];return selectors.map(s=>{const r=e.querySelector(s).getBoundingClientRect();return {x:r.x,right:r.right,width:r.width,height:r.height};});});
 assert(bounds[0].width>=140);for(let i=1;i<bounds.length;i++){assert(bounds[i].x>=bounds[i-1].right-1);assert(bounds[i].width>=44&&bounds[i].height>=44);}
 assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
 await page.screenshot({path:`test-results/library-direct-lead-${width}.png`});
 await lead().focus();await page.keyboard.press('Enter');await ready();assert.equal(await page.evaluate(()=>prototype.song),'cs-168');assert.equal(await page.locator('#score-size').getAttribute('data-size'),'large');assert(await page.evaluate(()=>prototype.lead.ok));
 await page.locator('#songs').click();assert.equal(await page.locator('#library-source-label').textContent(),'Practice');assert.equal(await page.locator('#library-search').inputValue(),'Missionary');assert.equal(await page.locator('#order-toggle').inputValue(),'manual');assert.equal(await page.locator('#view-lead-sheets').getAttribute('aria-checked'),'true');assert.notEqual(await page.evaluate(()=>document.activeElement.id),'library-search');
 await row.locator('.song-entry').click();await ready();assert.notEqual(await page.locator('#score-size').getAttribute('data-size'),'large');await page.locator('#songs').click();
 await row.locator('[title="Lyrics"]').click();await page.locator('#lyrics-view').waitFor({state:'visible'});await page.locator('#songs').click();
 await row.locator('.favorite').click();assert.equal(await row.locator('.favorite').getAttribute('aria-pressed'),'false');await row.locator('.favorite').click();assert.equal(await row.locator('.favorite').getAttribute('aria-pressed'),'true');
 await page.locator('#library-clear').click();assert.deepEqual(await page.evaluate(()=>JSON.parse(localStorage.getItem('music-transpose-library-v1')).groups[0].songs),['nativity','cs-168','hhc-1054']);
 if(width===390){await page.evaluate(()=>navigator.serviceWorker.ready);await page.waitForFunction(()=>navigator.serviceWorker.controller);await context.setOffline(true);await page.reload();await page.locator('.library-row').first().waitFor();assert.equal(await page.locator('#view-lead-sheets').getAttribute('aria-checked'),'false');await lead().click();await ready();assert(await page.evaluate(()=>prototype.lead.ok));await page.locator('#songs').click();await context.setOffline(false);}
 if(width===1440){
  await select('all');const target=page.locator('[aria-label="Open Lead sheet"]').nth(20);await target.scrollIntoViewIfNeeded();const position=await page.evaluate(()=>scrollY);assert(position>0);await target.click();await ready();await page.locator('#songs').click();assert(Math.abs(await page.evaluate(()=>scrollY)-position)<2,'Library return restores scroll');
  const last=await page.evaluate(()=>{const buttons=[...document.querySelectorAll('[aria-label="Open Lead sheet"]')];buttons[0].click();buttons[1].click();return {id:buttons[1].closest('.library-row').dataset.song,oldScoreCleared:!document.querySelector('#score svg')};});assert(last.oldScoreCleared);await ready();assert.equal(await page.evaluate(()=>prototype.song),last.id);assert.equal(await page.locator('#score-size').getAttribute('data-size'),'large');
 }
 assert.deepEqual(errors,[]);console.log('PASS direct Lead, availability, title/Lyrics/favorite, session filter, List/search/order, responsive',width,height);await context.close();
}}finally{await browser.close();}

