import {chooseRelativeKey} from './key-selection-helper.mjs';
import {createRequire} from 'node:module';import assert from 'node:assert/strict';
const require=createRequire(process.env.PLAYWRIGHT_PACKAGE),{chromium}=require('playwright');
const browser=await chromium.launch({channel:'msedge',headless:true});
const context=await browser.newContext({serviceWorkers:'block'}),p=await context.newPage();
const key='music-transpose-library-v1',ids=['cs-236','nativity'];
const saved={orderingVersion:1,favorites:ids,groups:[{id:'practice',name:'Practice',songs:ids},{id:'sunday',name:'Sunday',songs:[...ids].reverse()}],recent:ids};
const ready=()=>p.waitForFunction(()=>prototype.ready&&!prototype.busy&&document.querySelector('#score').getAttribute('aria-busy')==='false');
async function snapshot(id){await p.evaluate(id=>prototype.loadSong(id),id);await ready();await p.locator('.score-heading .song-playback').click();await p.waitForFunction(()=>prototype.playback.state==='playing');const result=await p.evaluate(()=>({id:prototype.song,xml:prototype.xml,pitches:prototype.playback.timeline.notes.map(n=>n.midi)}));await p.evaluate(()=>prototype.playback.stop());return result;}
try{
 await p.goto('http://127.0.0.1:8767/');await p.locator('.library-row').first().waitFor();
 const before={};for(const id of ids)before[id]=await snapshot(id);
 await p.evaluate(({key,saved})=>localStorage.setItem(key,JSON.stringify(saved)),{key,saved});
 // Change metadata before app modules initialize, then reload persisted user data.
 await p.route('**/songs.js',async route=>{const response=await route.fetch();const body=await response.text();await route.fulfill({response,body:body+`\nfor(const s of songs)if(['cs-236','nativity'].includes(s.id)){s.page='987';s.title='Updated '+s.title;s.collection='Revised Book';s.edition='Future';s.collectionMemberships.push({collection:'Original Book',page:'236',edition:'Earlier'});}songs.reverse();`});});
 await p.reload();await p.locator('.library-row').first().waitFor();
 await p.locator('#library-filter').selectOption('favorites');
 assert.equal(await p.locator('.library-row').count(),2);
 for(const id of ids)assert.equal(await p.locator(`[data-song="${id}"] .favorite`).getAttribute('aria-pressed'),'true');
 for(const [group,order] of [['practice',ids],['sunday',[...ids].reverse()]]){await p.locator('#library-list').selectOption(group);assert.deepEqual(await p.locator('.library-row').evaluateAll(rows=>rows.map(r=>r.dataset.song)),order);}
 assert.deepEqual(await p.evaluate(key=>JSON.parse(localStorage.getItem(key)),key),saved);
 await p.locator('#library-list').selectOption('');await p.locator('#library-filter').selectOption('all');
 await p.locator('#library-search').fill('987');assert.equal(await p.locator('.library-row').count(),2);
 for(const id of ids){
  await p.locator(`[data-song="${id}"] .song-entry`).click();await ready();assert.equal(await p.evaluate(()=>prototype.song),id);
  const after=await snapshot(id);assert.deepEqual(after,before[id]);
  await chooseRelativeKey(p,1);await ready();await p.locator('.score-heading .song-playback').click();await p.waitForFunction(()=>prototype.playback.state==='playing');assert.deepEqual(await p.evaluate(()=>prototype.playback.timeline.notes.map(n=>n.midi)),before[id].pitches.map(n=>n+1));
  await p.locator('#reset').click();await ready();assert.equal(await p.evaluate(()=>prototype.xml),before[id].xml);
  await p.locator('#songs').click();
 }
 console.log('PASS metadata/position edits preserve IDs, Favorites, multiple lists, saved order, Recent, opening, XML, playback and transposition/reset');
}finally{await browser.close();}
