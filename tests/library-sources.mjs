import {createRequire} from 'node:module';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {compareNumbers,matchesSource} from '../library-query.js';
import {setOrder} from './library-controls-helper.mjs';
const numeric=['10','1001','2','','236','52','9','20b','20a'].map((page,i)=>({id:String(i),page,title:page?'Song '+page:'Unnumbered'}));
assert.deepEqual(numeric.sort(compareNumbers).map(s=>s.page),['2','9','10','20a','20b','52','236','1001','']);
const historic={id:'unchanging',title:'Renamed',page:'999',collection:'Hymns (1985)',status:'legacy'};
assert(matchesSource(historic,'legacy'));assert(!matchesSource(historic,'hymnal'));
assert(matchesSource({...historic,status:'active',collection:'Future authoritative edition',collectionMemberships:[{collection:'Future authoritative edition',role:'hymnal',status:'active'}]},'hymnal'));
const require=createRequire(process.env.PLAYWRIGHT_PACKAGE),{chromium}=require('playwright');
const b=await chromium.launch({channel:'msedge',headless:true}),p=await b.newPage(),errors=[];
p.on('pageerror',e=>errors.push(e.message));const ids=()=>p.locator('.library-row').evaluateAll(es=>es.map(e=>e.dataset.song));
const saved={orderingVersion:1,favorites:['nativity','faithful','scripture-power'],groups:[{id:'practice',name:'Practice',songs:['faithful','nativity','scripture-power']}],recent:['faithful','nativity']};
try{
 await p.goto(process.env.TEST_URL||'http://127.0.0.1:8768/');await p.locator('.library-row').first().waitFor();
 await p.evaluate(saved=>{localStorage.setItem('music-transpose-library-v1',JSON.stringify(saved));localStorage.removeItem('music-transpose-library-preferences-v1');},saved);await p.reload();await p.locator('.library-row').first().waitFor();
 const catalog=await p.evaluate(async()=> (await import('./songs.js')).songs),counts={};
 assert.equal(await p.locator('#library-filter,#library-sort,#filter-menu,#sort-menu').count(),0);
 for(const source of ['all','hymnal','children','home-church','legacy','other']){
  await p.locator('#library-source').selectOption(source);const expected=catalog.filter(s=>matchesSource(s,source));counts[source]=expected.length;
  for(const order of ['title','number']){await setOrder(p,order);const actual=await ids();assert.deepEqual(new Set(actual),new Set(expected.map(s=>s.id)));if(order==='number')assert.deepEqual(actual,expected.sort(compareNumbers).map(s=>s.id));}
 }
 assert.equal(counts.legacy,0);assert.deepEqual(await ids(),['choose-to-serve-the-lord','scripture-power']);
 await p.locator('#library-source').selectOption('children');await p.locator('#view-favorites').click();assert.deepEqual(await ids(),['nativity']);
 await p.locator('#library-search').fill('Nativity');assert.deepEqual(await ids(),['nativity']);await p.locator('#library-search').fill('');assert.deepEqual(await ids(),['nativity']);
 await p.locator('#view-recent').click();assert.equal(await p.locator('#view-favorites').getAttribute('aria-pressed'),'false');assert.deepEqual(await ids(),['nativity']);
 await p.locator('#library-source').selectOption('hymnal');assert.deepEqual(await ids(),['faithful']);await p.locator('#view-recent').click();await p.locator('#library-search').fill('Silent');assert.deepEqual(await ids(),['silent-night']);await p.locator('#library-search').fill('');assert.equal((await ids()).length,counts.hymnal);
 await setOrder(p,'number');await p.reload();await p.locator('.library-row').first().waitFor();assert.equal(await p.locator('#library-source').inputValue(),'hymnal');assert.equal(await p.locator('#order-number').getAttribute('aria-pressed'),'true');
 await p.locator('#library-source').selectOption('all');await p.locator('#library-list').selectOption('practice');assert.deepEqual(await ids(),saved.groups[0].songs);await setOrder(p,'title');assert.notDeepEqual(await ids(),saved.groups[0].songs);assert.deepEqual(await p.evaluate(()=>JSON.parse(localStorage.getItem('music-transpose-library-v1'))),saved);await setOrder(p,'list');assert.deepEqual(await ids(),saved.groups[0].songs);await p.locator('#library-list').selectOption('');
 for(const [width,height] of [[320,740],[390,844],[820,1180],[1180,820],[1440,1000]]){await p.setViewportSize({width,height});for(const source of ['all','home-church']){await p.locator('#library-source').selectOption(source);assert(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));const controls=p.locator('#order-title,#order-number,#library-source,#view-favorites,#view-recent');for(const control of await controls.all()){assert((await control.boundingBox()).height>=44);await control.focus();assert(await control.evaluate(e=>parseFloat(getComputedStyle(e).outlineWidth)>=2));}if(width>=820){const ys=await controls.evaluateAll(es=>es.map(e=>e.getBoundingClientRect().y));assert(Math.max(...ys)-Math.min(...ys)<2);}await p.screenshot({path:`test-results/library-sources-${width}-${source}.png`});}}
 assert.deepEqual(errors,[]);await fs.writeFile('test-results/library-sources.json',JSON.stringify({counts,checks:'numeric, source/view/search combinations, legacy, stable identity, persistence, saved-list order, five viewport widths, keyboard focus'},null,2));console.log('PASS Library source/order controls',counts);
}finally{await b.close();}
