import {createRequire} from 'node:module';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createSongSearch,lyricText} from '../library-search.js';
import {songs,normalizeSearch,songSearchText} from '../songs.js';
const data=JSON.parse(fs.readFileSync('assets/lyrics.json','utf8'));let loads=0;
const engine=createSongSearch(async()=>{loads++;return data;});
const hands=songs.find(s=>s.title==='My Hands'),redeemer=songs.find(s=>s.title==='Redeemer of Israel'),alias=songs.find(s=>s.aliases?.includes('I Belong to the Church of Jesus Christ'));
assert(hands&&redeemer&&alias);for(const song of songs)for(const name of song.aliases||[])assert(engine.match(song,name).matched);assert(engine.match(alias,'I belong to the church of Jesus Christ').matched);
assert(!engine.match(hands,'by my side').matched);assert.equal(loads,0);await Promise.all([engine.prepare(),engine.prepare()]);assert.equal(loads,1);
assert(engine.match(hands,'BY — my,   SIDE','lyrics').matched);assert(engine.match(redeemer,'our shadow by day','lyrics').matched);
assert.equal(normalizeSearch('I’m “Trying”'),normalizeSearch("I'm Trying"));
for(const record of data.songs.filter(r=>r.alternateLyrics?.length)){const song=songs.find(s=>s.id===record.id);assert(engine.match(song,record.alternateLyrics[0].text,'lyrics').matched);}
for(const query of ['52','Hymns','Christmas','Jesus','Children’s Songbook','I’m Trying'])for(const song of songs){const old=normalizeSearch(songSearchText(song)+' '+(song.originalFilename||''));if(normalizeSearch(query).split(/\s+/).every(w=>old.includes(w)))assert(engine.match(song,query).matched);}
assert(engine.match({id:'test',title:'Example',keywords:['peace'],topics:['hope']},'hope peace','all').matched);
assert(!engine.match({id:'test',title:'Example',keywords:['peace']},'peace','titles').matched);
let attempts=0;const retry=createSongSearch(async()=>{if(++attempts===1)throw Error('offline');return data;});await assert.rejects(retry.prepare());await retry.prepare();assert(retry.match(hands,'by my side','lyrics').matched);
console.log('PASS catalog aliases, legacy search, lazy indexing, all lyric sections, normalization, metadata, retry');
const {chromium}=createRequire(process.env.PLAYWRIGHT_PACKAGE)('playwright'),browser=await chromium.launch({channel:'msedge',headless:true});
try{for(const [width,height] of [[320,568],[390,844],[844,390],[820,1180],[1440,1000]]){
 const c=await browser.newContext({viewport:{width,height},hasTouch:width<1000}),p=await c.newPage(),errors=[];p.on('pageerror',e=>errors.push(e.message));
 await p.addInitScript(ids=>{if(!localStorage.getItem('search-seed')){localStorage.setItem('search-seed','1');localStorage.setItem('music-transpose-library-v1',JSON.stringify({orderingVersion:1,favorites:[ids[0]],groups:[{id:'search-list',name:'Search list',songs:ids}]}));}},[hands.id,redeemer.id]);
 await p.goto(process.env.TEST_URL||'http://127.0.0.1:8771/');await p.locator('.library-row').first().waitFor();
 const input=p.locator('#library-search'),scope=p.locator('#library-search-scope'),ids=()=>p.locator('.library-row').evaluateAll(es=>es.map(e=>e.dataset.song));
 assert.equal(await scope.inputValue(),'titles');const initial=await ids();assert.equal(initial.length,new Set(initial).size);await input.fill('Redeemer of Israel');assert((await ids()).includes(redeemer.id));await input.fill('52');assert((await ids()).includes('nativity'));await input.fill('Children’s Songbook');assert((await ids()).includes(hands.id));await input.fill('I Belong to the Church of Jesus Christ');assert.deepEqual(await ids(),[alias.id]);
 await input.fill('by my side');assert(!(await ids()).includes(hands.id));await scope.selectOption('lyrics');await p.waitForFunction(()=>document.querySelector('#library-results').getAttribute('aria-busy')==='false');assert.deepEqual(await ids(),[hands.id]);assert.equal(await p.locator('.favorite').getAttribute('aria-pressed'),'true');assert(await p.getByText('Matched lyrics',{exact:true}).isVisible());
 await input.fill('BY — my,   SIDE');assert.deepEqual(await ids(),[hands.id]);await scope.selectOption('all');assert.deepEqual(await ids(),[hands.id]);
 assert(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));const controls=await p.locator('.library-search-row').evaluate(e=>[...e.children].map(x=>({top:x.getBoundingClientRect().top,height:x.getBoundingClientRect().height})));assert(controls.every(r=>Math.abs(r.top-controls[0].top)<2&&r.height>=44));
 await scope.focus();assert.equal(await p.evaluate(()=>document.activeElement.id),'library-search-scope');await p.keyboard.press('Tab');assert.equal(await p.evaluate(()=>document.activeElement.id),'library-clear');await p.screenshot({path:`test-results/advanced-search-${width}.png`});
 await p.locator('.library-row [title=Lyrics]').click();await p.locator('#lyrics-view').waitFor({state:'visible'});await p.locator('#songs').click();assert.equal(await scope.inputValue(),'all');assert.deepEqual(await ids(),[hands.id]);assert.notEqual(await p.evaluate(()=>document.activeElement.id),'library-search');
 await p.locator('#library-clear').click();await p.locator('#library-source').click();await p.locator('[data-source="list:search-list"]').click();assert.deepEqual(await ids(),[hands.id,redeemer.id]);await input.fill('shadow by day');assert.deepEqual(await ids(),[redeemer.id]);await p.locator('.library-row [title=Lyrics]').click();await p.locator('#lyrics-view').waitFor({state:'visible'});await p.locator('#songs').click();assert.equal(await p.locator('#library-source-label').textContent(),'Search list');assert.deepEqual(await ids(),[redeemer.id]);await p.locator('#library-clear').click();assert.deepEqual(await ids(),[hands.id,redeemer.id]);
 if(width===390){await p.evaluate(()=>navigator.serviceWorker.ready);await p.waitForFunction(()=>navigator.serviceWorker.controller);await c.setOffline(true);await p.reload();await p.locator('.library-row').first().waitFor();assert.equal(await scope.inputValue(),'titles');await scope.selectOption('lyrics');await p.waitForFunction(()=>document.querySelector('#library-results').getAttribute('aria-busy')==='false');await input.fill('by my side');assert.deepEqual(await ids(),[hands.id]);await c.setOffline(false);}
 assert.deepEqual(await p.evaluate(()=>JSON.parse(localStorage.getItem('music-transpose-library-v1')).groups[0].songs),[hands.id,redeemer.id]);assert.deepEqual(errors,[]);console.log('PASS Library/List identity, return, search scopes, keyboard, responsive',width,height);await c.close();
}
 // A late lyric fetch must not restore an advanced scope after the user leaves it.
 const c=await browser.newContext({serviceWorkers:'block'}),p=await c.newPage();let release;
 await p.route('**/assets/lyrics.json',async route=>{await new Promise(resolve=>{release=resolve;});await route.fulfill({status:200,contentType:'application/json',body:JSON.stringify(data)});});
 await p.goto(process.env.TEST_URL||'http://127.0.0.1:8771/');await p.locator('.library-row').first().waitFor();await p.locator('#library-search-scope').selectOption('lyrics');await p.waitForFunction(()=>document.querySelector('#library-results').getAttribute('aria-busy')==='true');await p.locator('#library-search-scope').selectOption('titles');while(!release)await p.waitForTimeout(20);release();await p.waitForTimeout(200);assert.equal(await p.locator('#library-search-scope').inputValue(),'titles');assert.equal(await p.locator('#library-results').getAttribute('aria-busy'),'false');await c.close();console.log('PASS late fetch does not change scope');
}finally{await browser.close();}
