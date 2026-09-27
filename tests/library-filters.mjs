import {createRequire} from 'node:module';import assert from 'node:assert/strict';
const {chromium}=createRequire(process.env.PLAYWRIGHT_PACKAGE)('playwright'),b=await chromium.launch({channel:'msedge',headless:true});
const sequence=['cs-168','nativity','hhc-1054'],favorites=[...sequence];
try{for(const [width,height] of [[320,568],[390,844],[844,390],[820,1180],[1440,1000]]){
 const c=await b.newContext({viewport:{width,height},hasTouch:width<1000}),p=await c.newPage(),errors=[];p.on('pageerror',e=>errors.push(e.message));
 await p.addInitScript(({sequence,favorites})=>{if(!localStorage.getItem('filter-seed')){localStorage.setItem('filter-seed','1');localStorage.setItem('music-transpose-library-v1',JSON.stringify({orderingVersion:1,favorites,groups:[{id:'test',name:'Prelude',songs:sequence}]}));}},{sequence,favorites});
 await p.goto(process.env.TEST_URL||'http://127.0.0.1:8771/');await p.locator('.library-row').first().waitFor();
 const ids=()=>p.locator('.library-row').evaluateAll(es=>es.map(e=>e.dataset.song)),toggle=async id=>{await p.locator('#library-filter').click();await p.locator(id).click();await p.keyboard.press('Escape');},source=async id=>{await p.locator('#library-source').click();await p.locator(`[data-source="${id}"]`).click();},ready=()=>p.waitForFunction(()=>prototype.ready&&!prototype.busy&&document.querySelector('#score').getAttribute('aria-busy')==='false');
 const leadIds=await p.evaluate(async()=>{const {songs,supportsLead}=await import('./catalog.js');return songs.filter(supportsLead).map(s=>s.id);});
 const cleared=async()=>assert.equal(await p.locator('#view-lead-sheets').getAttribute('aria-checked'),'false');
 await toggle('#view-favorites');const favoriteOrder=await ids();await toggle('#view-lead-sheets');assert.deepEqual(await ids(),favoriteOrder.filter(id=>leadIds.includes(id)));assert.equal(await p.locator('#view-lead-sheets').textContent(),`Lead sheets (${leadIds.length})`);
 await source('children');await cleared();assert.equal(await p.locator('#view-favorites').getAttribute('aria-checked'),'true');
 await toggle('#view-lead-sheets');await source('list:test');await cleared();assert.deepEqual(await ids(),sequence);assert.equal(await p.locator('#order-toggle').inputValue(),'manual');
 // Each entry path clears immediately, while the normal List and Favorites survive.
 for(const selector of ['.song-entry','[title="Lyrics"]','[aria-label="Open Lead sheet"]']){
  await toggle('#view-lead-sheets');assert.equal(await p.locator('#view-lead-sheets').getAttribute('aria-checked'),'true');assert.deepEqual(await ids(),sequence.filter(id=>leadIds.includes(id)));
  await p.locator('[data-song="cs-168"] '+selector).click();await cleared();if(selector==='[title="Lyrics"]')await p.locator('#lyrics-view').waitFor({state:'visible'});else await ready();await p.locator('#songs').click();await cleared();assert.deepEqual(await ids(),sequence);assert.equal(await p.locator('#library-source-label').textContent(),'Prelude');assert.equal(await p.locator('#view-favorites').getAttribute('aria-checked'),'true');assert.notEqual(await p.evaluate(()=>document.activeElement.id),'library-search');
 }
 await toggle('#view-lead-sheets');await p.locator('#library-more').click();assert.deepEqual(await p.locator('#library-more-dialog button').allTextContents(),['Files / My Music','Import music','Add to Home Screen…']);await p.locator('#view-files').click();await cleared();await p.locator('#files-library').click();assert.deepEqual(await ids(),sequence);
 await toggle('#view-lead-sheets');await source('edit-lists');await cleared();await p.goBack();await p.locator('#library').waitFor({state:'visible'});await cleared();assert.deepEqual(await ids(),sequence);
 await toggle('#view-lead-sheets');await p.reload();await p.locator('.library-row').first().waitFor();await cleared();assert.deepEqual(await ids(),sequence);assert.equal(await p.locator('#view-favorites').getAttribute('aria-checked'),'false','Favorites retains existing session-only restart behavior');
 await p.locator('#order-toggle').selectOption('title');await p.locator('#order-toggle').selectOption('manual');assert.deepEqual(await ids(),sequence);
 await p.locator('#library-search').fill('Missionary');assert.deepEqual(await ids(),['cs-168']);await p.locator('#library-clear').click();
 await p.locator('[data-song="cs-168"] .favorite').click();assert.equal(await p.locator('[data-song="cs-168"] .favorite').getAttribute('aria-pressed'),'false');await p.locator('[data-song="cs-168"] .favorite').click();
 await p.locator('#library-filter').focus();await p.keyboard.press('Enter');await p.keyboard.press('ArrowDown');assert.equal(await p.evaluate(()=>document.activeElement.id),'view-lead-sheets');const menu=await p.locator('#library-filter-menu').boundingBox();assert(menu.x>=0&&menu.x+menu.width<=width&&menu.y+menu.height<=height);await p.keyboard.press('Escape');assert(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
 await p.screenshot({path:`test-results/library-filter-cleanup-${width}.png`});
 if(width===390){await toggle('#view-lead-sheets');await p.evaluate(()=>navigator.serviceWorker.ready);await p.waitForFunction(()=>navigator.serviceWorker.controller);await c.setOffline(true);await p.reload();await p.locator('.library-row').first().waitFor();await cleared();assert.deepEqual(await ids(),sequence);await c.setOffline(false);}
 assert.deepEqual(await p.evaluate(()=>JSON.parse(localStorage.getItem('music-transpose-library-v1')).groups[0].songs),sequence);assert.deepEqual(errors,[]);console.log('PASS temporary Lead: song/Source/List/Files/overview/reload/offline; Favorites/context/order/menus unchanged',width,height);await c.close();
}}finally{await b.close();}
