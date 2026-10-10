import {createRequire} from 'node:module';import assert from 'node:assert/strict';import fs from 'node:fs';import {songs} from '../songs.js';
const {chromium}=createRequire('C:/Users/kenro/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/package.json')('playwright');
const b=await chromium.launch({channel:'msedge',headless:true}),c=await b.newContext({viewport:{width:820,height:1180},serviceWorkers:'block'}),p=await c.newPage(),errors=[],requests=[],evidence=[];
p.setDefaultTimeout(30000);p.on('pageerror',e=>errors.push(e.message));p.on('request',r=>requests.push(r.url()));
const hymn=n=>songs.find(s=>s.collection==='Hymns (1985)'&&s.page===String(n)),id86=hymn(86).id,row=n=>p.locator(`#library-results [data-song="${hymn(n).id}"]`),entry=n=>row(n).locator('.song-entry');
const ready=id=>p.waitForFunction(id=>prototype.song===id&&prototype.ready&&!prototype.busy&&!document.body.classList.contains('song-loading'),id,{timeout:120000});
const source=async id=>{await p.locator('#library-source').click();await p.locator(`button[data-source="${id}"]`).click();};
try{
 await p.addInitScript(()=>localStorage.setItem('music-transpose-library-v1',JSON.stringify({orderingVersion:1,favorites:[],groups:[{id:'catalog-test',name:'Catalog test',songs:[]}]})));
 await p.goto(process.env.TEST_URL||'http://127.0.0.1:8780/');await p.locator('[data-home-source=all]').click();await p.waitForFunction(()=>document.querySelector('#library-results').getAttribute('aria-busy')==='false');
 await p.locator('#library-search').fill('How Great Thou Art');assert.equal(await entry(86).count(),1);await p.locator('#library-search').fill('86');assert(await entry(86).isVisible());
 await source('hymnal');assert(await entry(86).isVisible());await p.locator('#library-clear').click();await p.locator('#order-toggle').selectOption('number');
 const ids=await p.locator('#library-results .library-row').evaluateAll(es=>es.map(e=>e.dataset.song));assert.equal(ids.length,341);assert.deepEqual(ids.slice(83,88),[84,85,86,87,88].map(n=>hymn(n).id));assert.equal(await row(86).locator('.favorite').count(),1);
 for(const width of [390,430,820,1440]){
  await p.setViewportSize({width,height:width===820?1180:932});await entry(86).scrollIntoViewIfNeeded();assert((await row(86).textContent()).includes('Score unavailable'));
  assert(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));await p.screenshot({path:`test-results/unavailable-row-${width}.png`});
  await entry(86).focus();await p.keyboard.press('Enter');const d=p.locator('#score-unavailable-dialog');assert(await d.isVisible());assert(await d.locator('button').evaluate(e=>e===document.activeElement));
  const geometry=await d.evaluate(e=>{const r=e.getBoundingClientRect();return {x:r.x,y:r.y,right:r.right,bottom:r.bottom,width:innerWidth,height:innerHeight,overflow:e.scrollWidth>e.clientWidth,buttonHeight:e.querySelector('button').getBoundingClientRect().height};});assert(geometry.x>=0&&geometry.right<=width&&geometry.y>=0&&geometry.bottom<=geometry.height&&!geometry.overflow&&geometry.buttonHeight>=44);
  await p.keyboard.press('Tab');assert(await d.evaluate(e=>e.contains(document.activeElement)),'dialog traps focus');await p.screenshot({path:`test-results/unavailable-dialog-${width}.png`});await p.keyboard.press('Escape');assert(await entry(86).evaluate(e=>document.activeElement===e));
  await entry(86).click();await d.locator('button').click();assert(await entry(86).evaluate(e=>document.activeElement===e));evidence.push({width,...geometry});
 }
 // Direct-load defense must not change score state, route or fetch any nonexistent asset.
 const before=await p.evaluate(()=>({song:prototype.song,route:history.state}));const requestCount=requests.length;await p.evaluate(id=>prototype.loadSong(id),id86);assert(await p.locator('#score-unavailable-dialog').isVisible());assert.deepEqual(await p.evaluate(()=>({song:prototype.song,route:history.state})),before);assert(!requests.slice(requestCount).some(u=>/undefined|unavailable|song-fc881/.test(u)));await p.keyboard.press('Escape');
 await p.setViewportSize({width:820,height:1180});await entry(85).click();await ready(hymn(85).id);
 const route=()=>p.evaluate(()=>history.state.musicTransposeNavigation.route);assert(!(await route()).songSet.ids.includes(id86));assert(!(await p.locator('#previous-song').isDisabled())&&!(await p.locator('#next-song').isDisabled()));
 await p.locator('#next-song').click();await ready(hymn(87).id);assert(!(await p.locator('#previous-song').isDisabled())&&!(await p.locator('#next-song').isDisabled()));await p.locator('#previous-song').click();await ready(hymn(85).id);await p.locator('#previous-song').click();await ready(hymn(84).id);await p.locator('#next-song').click();await ready(hymn(85).id);await p.locator('#next-song').click();await ready(hymn(87).id);await p.locator('#next-song').click();await ready(hymn(88).id);
 // Restricted catalog identities remain selectable in Lists.
 await p.locator('#songs').click();await p.locator('#library').waitFor({state:'visible'});await source('list:catalog-test');await p.locator('#add-list-songs').click();await p.locator('#list-picker-search').fill('How Great Thou Art');assert.equal(await p.locator(`#list-picker-results input[data-song="${id86}"]`).count(),1);
 assert.deepEqual(errors,[]);fs.writeFileSync('test-results/unavailable-catalog-ui.json',JSON.stringify({viewports:evidence,neighbors:'84 ↔ 85 ↔ 87 ↔ 88; 86 absent from songSet',errors},null,2));console.log('PASS catalog UI, search/source/order, dialog keyboard/focus, direct-load guard, playable neighbors, list inclusion and four widths');
}finally{await b.close();}
