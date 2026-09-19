import {createRequire} from 'node:module';
import assert from 'node:assert/strict';
import {compareNumbers,matchesSource} from '../library-query.js';
const require=createRequire(process.env.PLAYWRIGHT_PACKAGE),{chromium}=require('playwright');
const b=await chromium.launch({channel:'msedge',headless:true}),p=await b.newPage(),errors=[];
p.on('pageerror',e=>errors.push(e.message));
const saved={orderingVersion:1,favorites:['nativity','faithful','scripture-power'],groups:[{id:'practice',name:'Practice',songs:['faithful','nativity','unknown-future-id']}],recent:['faithful','nativity']};
const ids=()=>p.locator('.library-row').evaluateAll(es=>es.map(e=>e.dataset.song));
const ready=()=>p.waitForFunction(()=>prototype.ready&&!prototype.busy&&document.getElementById('score').getAttribute('aria-busy')==='false');
try{
 await p.goto(process.env.TEST_URL||'http://127.0.0.1:8768/');await p.locator('.library-row').first().waitFor();
 await p.evaluate(saved=>{localStorage.setItem('music-transpose-library-v1',JSON.stringify(saved));localStorage.removeItem('music-transpose-library-preferences-v1');},saved);await p.reload();await p.locator('.library-row').first().waitFor();
 const catalog=await p.evaluate(async()=>(await import('./songs.js')).songs),counts={};
 assert.equal(await p.locator('#library-list,#view-recent,#order-title,#order-number,#library-filter,#library-sort,.library-row .song-actions').count(),0);
 assert.equal(await p.locator('#order-toggle').textContent(),'A–Z');
 for(const source of ['all','hymnal','children','home-church','legacy','other']){
  await p.locator('#library-source').selectOption(source);let expected=catalog.filter(s=>matchesSource(s,source));counts[source]=expected.length;
  for(const order of ['title','number']){
   if(await p.locator('#order-toggle').textContent()!==(order==='title'?'A–Z':'123'))await p.locator('#order-toggle').click();
   const actual=await ids();assert.deepEqual(new Set(actual),new Set(expected.map(s=>s.id)));
   const collator=new Intl.Collator(undefined,{numeric:true,sensitivity:'base'});expected.sort(order==='number'?compareNumbers:(a,b)=>collator.compare(a.title,b.title));assert.deepEqual(actual,expected.map(s=>s.id));
   assert.equal(await p.locator('#library-count').textContent(),`${expected.length} ${expected.length===1?'song':'songs'}`);
  }
  if(source==='legacy')assert.equal(await p.locator('.empty-library').textContent(),'No Legacy songs.');
 }
 assert.equal(counts.legacy,0);assert.equal(counts.other,2);
 await p.locator('#library-source').selectOption('children');await p.locator('#view-favorites').click();assert.deepEqual(await ids(),['nativity']);
 await p.locator('#library-search').fill('Nativity');assert.deepEqual(await ids(),['nativity']);await p.locator('#library-search').fill('zzz');assert.equal((await ids()).length,0);await p.locator('#library-search').fill('');assert.deepEqual(await ids(),['nativity']);
 await p.locator('#view-favorites').click();await p.reload();await p.locator('.library-row').first().waitFor();assert.equal(await p.locator('#order-toggle').textContent(),'123');assert.equal(await p.locator('#library-source').inputValue(),'children');
 assert.deepEqual(await p.evaluate(()=>JSON.parse(localStorage.getItem('music-transpose-library-v1'))),saved);
 await p.locator('#manage-lists').click();assert(await p.locator('#lists-view').isVisible());assert.match(await p.locator('[data-list="practice"]').textContent(),/Practice/);await p.locator('#lists-library').click();
 await p.locator('#library-source').selectOption('all');
 for(const [width,height] of [[320,812],[390,844],[820,1180],[1180,820],[1440,1000]]){
  await p.setViewportSize({width,height});const layout=await p.evaluate(()=>{const r=s=>{const x=document.querySelector(s).getBoundingClientRect();return {x:x.x,y:x.y,w:x.width,h:x.height}};return {search:r('#library-search'),source:r('#library-source'),tools:r('.library-results-tools'),overflow:document.documentElement.scrollWidth>innerWidth,columns:getComputedStyle(document.querySelector('.library-row')).gridTemplateColumns.split(' ').length}});
  assert(!layout.overflow);assert.equal(layout.columns,3);for(const source of ['children','home-church','all']){await p.locator('#library-source').selectOption(source);assert(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));}if(width>=820)assert(Math.abs(layout.search.y-layout.source.y)<15);
  assert.equal(await p.locator('.library-results-tools button:visible').count(),4);await p.keyboard.press('Tab');await p.locator('#order-toggle').focus();assert.equal(await p.locator('#order-toggle').evaluate(e=>getComputedStyle(e).outlineStyle),'solid');await p.keyboard.press('Enter');
  await p.screenshot({path:`test-results/library-simplified-${width}.png`});console.log('layout',width,layout);
 }
 await p.locator('[data-song="nativity"] .favorite').click();await p.locator('[data-song="nativity"] .favorite').click();
 assert.deepEqual(await p.evaluate(()=>JSON.parse(localStorage.getItem('music-transpose-library-v1')).groups),saved.groups);
 await p.locator('[data-song="nativity"] .song-view-actions button').first().click();await ready();await p.locator('#songs').click();
 await p.locator('[data-song="nativity"] .song-view-actions button').last().click();await p.locator('#lyrics-view').waitFor({state:'visible'});
 await p.evaluate(()=>navigator.serviceWorker.ready);await p.waitForFunction(()=>navigator.serviceWorker.controller);await p.context().setOffline(true);await p.reload();await p.locator('.library-row').first().waitFor();assert.equal(await p.locator('#order-toggle').count(),1);await p.locator('[data-song="nativity"] .song-entry').click();await ready();await p.context().setOffline(false);
 assert.deepEqual(errors,[]);console.log('PASS compact controls, source counts',counts,'combined search/Favorites, ordering, preferences, saved lists, MXL/Lyrics opening, keyboard and responsive layout');
}finally{await b.close();}
