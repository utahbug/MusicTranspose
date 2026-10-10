import {createRequire} from 'node:module';import assert from 'node:assert/strict';import {unavailableSongs} from '../unavailable-songs.js';
const {chromium}=createRequire('C:/Users/kenro/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/package.json')('playwright');
const b=await chromium.launch({channel:'msedge'}),c=await b.newContext({serviceWorkers:'block'}),p=await c.newPage();p.setDefaultTimeout(30000);const errors=[];p.on('pageerror',e=>errors.push(e.message));
try{
 await p.addInitScript(()=>localStorage.setItem('music-transpose-library-v1',JSON.stringify({orderingVersion:1,favorites:[],groups:[{id:'restriction-test',name:'Restrictions',songs:[]}]})));
 await p.goto('http://127.0.0.1:8780/');await p.locator('[data-home-source=all]').click();
 for(const s of unavailableSongs){await p.locator('#library-search').fill(s.title);const row=p.locator('#library-results [data-song="'+s.id+'"]');assert(await row.isVisible());await row.locator('.favorite').click();assert.equal(await row.locator('.favorite').getAttribute('aria-pressed'),'true');}
 for(const [width,height] of [[320,568],[390,844],[820,1180],[1440,1000]]){
  await p.setViewportSize({width,height});
  for(const s of unavailableSongs){
   await p.locator('#library-search').fill(s.page);const entry=p.locator('#library-results [data-song="'+s.id+'"] .song-entry');await entry.click();const d=p.locator('#score-unavailable-dialog');assert(await d.isVisible());
   assert.equal(await d.locator('#score-unavailable-body').textContent(),s.unavailabilityNotice.explanation);assert.equal(await d.locator('#score-unavailable-song').textContent(),s.page+' · '+s.title);
   assert.deepEqual(await d.locator('dt').allTextContents(),s.unavailabilityNotice.credits.map(c=>c.label));assert.deepEqual(await d.locator('dd').allTextContents(),s.unavailabilityNotice.credits.map(c=>c.text));assert.equal(await d.locator('a').count(),0);assert(!/scripture|Psalm|Mosiah|Doctrine and Covenants|the Church cannot publish/i.test(await d.innerText()));
   const geometry=await d.evaluate(d=>{const r=d.getBoundingClientRect();return {fit:r.left>=0&&r.right<=innerWidth+1&&r.top>=0&&r.bottom<=innerHeight+1,overflow:d.scrollWidth>d.clientWidth};});assert(geometry.fit&&!geometry.overflow);await p.keyboard.press('Tab');assert(await d.evaluate(d=>d.contains(document.activeElement)));await p.keyboard.press('Shift+Tab');assert(await d.evaluate(d=>d.contains(document.activeElement)));
   if(s.page==='86'){await p.screenshot({path:'test-results/licensing-dialog-'+width+'.png'});if(width===320){const content=d.locator('.score-unavailable-content');await content.focus();await p.keyboard.press('End');await p.waitForFunction(()=>document.querySelector('.score-unavailable-content').scrollTop>0);}}
   await p.keyboard.press('Escape');assert(await entry.evaluate(e=>e===document.activeElement));
  }console.log('PASS six notices, exact credits, no scriptures, keyboard/focus and layout',width);
 }
 await p.setViewportSize({width:820,height:1180});await p.locator('#library-search').fill('');await p.locator('#library-source').click();await p.locator('[data-source="list:restriction-test"]').click();await p.locator('#add-list-songs').click();
 for(const s of unavailableSongs){await p.locator('#list-picker-search').fill(s.title);const check=p.locator('#list-picker-results input[data-song="'+s.id+'"]');assert(await check.isVisible());await check.check();}
 await p.locator('#list-picker-done').click();
 const state=await p.evaluate(()=>JSON.parse(localStorage.getItem('music-transpose-library-v1')));assert.deepEqual(state.groups.find(g=>g.id==='restriction-test').songs,unavailableSongs.map(s=>s.id));assert(unavailableSongs.every(s=>state.favorites.includes(s.id)));
 await p.locator('#library-lists').click();await p.locator('[data-list=restriction-test] .list-overview-entry').click();
 for(const s of unavailableSongs){const entry=p.locator('.workspace-song-entry').filter({hasText:s.title});await entry.click();assert(await p.locator('#score-unavailable-dialog').isVisible());await p.keyboard.press('Escape');}
 assert.deepEqual(errors,[]);console.log('PASS all six discoverable/addable/openable from Lists; Favorites and stable references retained');
}finally{await b.close();}
