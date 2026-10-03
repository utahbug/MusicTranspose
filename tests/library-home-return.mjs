import {createRequire} from 'node:module';
import assert from 'node:assert/strict';
const {chromium}=createRequire(process.env.PLAYWRIGHT_PACKAGE||'C:/Users/kenro/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/package.json')('playwright');
const browser=await chromium.launch({channel:'msedge',headless:true});
const c=await browser.newContext({viewport:{width:820,height:1180},serviceWorkers:'block'}),p=await c.newPage(),errors=[];
p.setDefaultTimeout(60000);p.on('pageerror',e=>errors.push(e.message));
const route=()=>p.evaluate(()=>history.state.musicTransposeNavigation.route);
const ready=id=>p.waitForFunction(id=>prototype.song===id&&prototype.ready&&!prototype.busy&&!document.body.classList.contains('song-loading')&&document.querySelector('#score').getAttribute('aria-busy')==='false',id);
const home=()=>p.locator('#library-home').waitFor({state:'visible'});
const empty=async()=>{assert.equal(await p.locator('#library-search').inputValue(),'');assert.equal((await route()).library.query,'');assert((await p.evaluate(()=>JSON.parse(sessionStorage.getItem('music-transpose-list-workspace-v1')).contexts)).every(([,v])=>!v.query));};
const prefs=()=>p.evaluate(()=>({sort:document.querySelector('#order-toggle').value,source:document.querySelector('#library-source-label').textContent,favorites:document.querySelector('#view-favorites').getAttribute('aria-pressed'),fields:[...document.querySelectorAll('[data-search-field]:checked')].map(e=>e.dataset.searchField)}));
try{
 await c.addInitScript(()=>{if(!localStorage.getItem('home-return-seed')){localStorage.setItem('home-return-seed','1');localStorage.setItem('music-transpose-library-v1',JSON.stringify({orderingVersion:1,favorites:['silent-night','faithful'],groups:[{id:'practice',name:'Practice',songs:['silent-night','faithful']}]}));localStorage.setItem('music-transpose-search-fields-v1',JSON.stringify(['title','page']));}});
 await p.goto(process.env.TEST_URL||'http://127.0.0.1:8780/');await home();await p.locator('[data-home-source=all]').click();await p.waitForFunction(()=>document.querySelector('#library-results').getAttribute('aria-busy')==='false');
 await p.locator('#order-toggle').selectOption('number');await p.locator('#library-search').fill('God');
 const ids=await p.locator('#library-results .library-row').evaluateAll(es=>es.map(e=>e.dataset.song));assert(ids.length>2);const before=await prefs();
 // Retain an older route snapshot to exercise invalidation, not just replacement of the departing entry.
 await p.evaluate(()=>history.pushState(history.state,''));
 await p.locator(`#library-results [data-song="${ids[0]}"] .song-entry`).click();await ready(ids[0]);assert.deepEqual((await route()).songSet.ids,ids);await empty();
 await p.locator('#next-song').click();await ready(ids[1]);assert.deepEqual((await route()).songSet.ids,ids);
 await p.goBack();await ready(ids[0]);await p.goBack();await p.locator('#library').waitFor({state:'visible'});await empty();assert.deepEqual(await prefs(),before);
 await p.goBack();await p.waitForFunction(()=>history.state.musicTransposeNavigation.route.library.query==='');await empty();
 await p.goForward();await p.locator('#library').waitFor({state:'visible'});
 await p.goForward();await ready(ids[0]);assert.deepEqual((await route()).songSet.ids,ids);await p.locator('#songs').press('Enter');await home();
 await p.locator('[data-home-source=all]').click();await empty();assert(await p.locator('#library-results .library-row').count()>ids.length);assert.equal(await p.locator('#order-toggle').inputValue(),'number');
 console.log('PASS search snapshot, actual Next, Back/Forward without stale query, Home routing and preferences');
 for(const view of ['files','lists']){
  await p.locator('#view-favorites').click();await p.locator('#library-search').fill('Silent');const saved=await prefs();
  if(view==='files'){await p.locator('#library-more').click();await p.locator('#view-files').click();}else await p.locator('#library-lists').click();
  await p.locator('#'+view+'-view').waitFor({state:'visible'});await empty();assert.deepEqual(await prefs(),saved);
  const button=p.locator('#'+view+'-library');assert.equal(await button.getAttribute('aria-label'),'Library Home');assert.equal(await button.getAttribute('title'),'Library Home');await button.press('Enter');await home();
  await p.goBack();await p.locator('#'+view+'-view').waitFor({state:'visible'});await p.goBack();await p.locator('#library').waitFor({state:'visible'});await empty();
 }
 console.log('PASS Files/Lists Home controls and search clearing/history');
 await p.locator('#library-search').fill('old search');await p.locator('#library .header-home').click();await home();await empty();await p.locator('#home-lists').click();await p.locator('[data-list=practice] .list-overview-entry').click();
 await p.locator('[data-song="silent-night"] .workspace-song-entry').click();await ready('silent-night');assert.deepEqual((await route()).songSet.ids,['silent-night','faithful']);
 await p.locator('#next-song').click();await ready('faithful');assert.deepEqual((await route()).songSet.ids,['silent-night','faithful']);await p.locator('#songs').click();await home();
 await p.goBack();await ready('faithful');await p.locator('#show-lyrics').click();
 await p.waitForFunction(()=>history.state.musicTransposeNavigation.route.view==='lyrics');await p.locator('#songs').click();await home();await empty();
 assert.deepEqual(await p.evaluate(()=>JSON.parse(localStorage.getItem('music-transpose-library-v1')).groups[0].songs),['silent-night','faithful']);
 assert.deepEqual(await p.evaluate(()=>JSON.parse(localStorage.getItem('music-transpose-search-fields-v1'))),['title','page']);assert.deepEqual(errors,[]);
 console.log('PASS List order, Lyrics Home return, saved Lists and search-field preferences unchanged');
}finally{await browser.close();}
