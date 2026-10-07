import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {createSongSearch,defaultSearchFields} from '../library-search.js';
import {songs} from '../songs.js';
const search=createSongSearch(async()=>({songs:[]}));
const numbered=songs.flatMap(song=>[song.songNumber,song.page,...(song.collectionMemberships||[]).flatMap(m=>[m.songNumber,m.page])].filter(value=>/^\d+[a-z]$/i.test(String(value))).map(value=>({song,value:String(value).toLowerCase()})));
for(const {song,value} of numbered){assert(search.match(song,value.replace(/[a-z]$/,''),['page']).pageMatch);assert(search.match(song,value,['page']).pageMatch);}
const fixture={id:'suffix',title:'Canonical title',page:'145a',composer:'Not searchable'};assert(!search.match(fixture,'14',['page']).matched);assert(!search.match(fixture,'145b',['page']).matched);assert(!search.match(fixture,'145',['title']).matched);assert(search.match(fixture,'canonical',['title']).matched);assert(!search.match(fixture,'Not searchable',defaultSearchFields).matched);assert(search.match(fixture,'145-a',['page']).matched);
const variants=[...new Set(numbered.map(({song,value})=>song.id+':'+value))];console.log('PASS page matching across',variants.length,'catalog suffix variants; exact suffix, field preferences, title matching and no numeric-prefix leakage');
const {chromium}=createRequire('C:/Users/kenro/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/package.json')('playwright'),browser=await chromium.launch({channel:'msedge'});
try{
 const context=await browser.newContext({viewport:{width:1024,height:1000},serviceWorkers:'block'}),p=await context.newPage(),errors=[];p.on('pageerror',e=>errors.push(e.message));
 const hymn=n=>songs.find(s=>s.collection==='Hymns (1985)'&&String(s.songNumber??s.page)===String(n)).id;
 const list=[hymn(244),hymn(140),hymn(243)],favorites=[hymn(140),hymn(243)];
 await context.addInitScript(({list,favorites})=>{if(localStorage.getItem('locator-seed'))return;localStorage.setItem('locator-seed','1');localStorage.setItem('music-transpose-library-v1',JSON.stringify({orderingVersion:1,favorites,groups:[{id:'bounded',name:'Bounded',songs:list}]}));},{list,favorites});
 const start=async(source='all',sort='number')=>{await p.goto('http://127.0.0.1:8780/');await p.waitForFunction(()=>window.prototype?.navigation);await p.locator('[data-home-source='+source+']').click();await p.locator('#order-toggle').selectOption(sort);};
 const ready=id=>p.waitForFunction(id=>prototype.song===id&&prototype.ready&&!prototype.busy&&!prototype.loading&&!document.body.classList.contains('song-loading'),id,{timeout:60000});
 const open=async id=>{await p.locator('[data-song="'+id+'"] .song-entry').click();await ready(id);};
 const nav=()=>p.evaluate(()=>prototype.navigation);
 const shown=()=>p.evaluate(async()=>{const {songs}=await import('./catalog.js'),{canOpenScore}=await import('./score-availability.js');return [...document.querySelectorAll('#library-results [data-song]')].map(e=>e.dataset.song).filter(id=>canOpenScore(songs.find(s=>s.id===id)));});
 for(const number of [140,243]){
  const id=hymn(number),title=songs.find(s=>s.id===id).title;
  for(const mode of ['source','all','numeric','title','source-search','home']){
   await start(mode.startsWith('source')?'hymnal':'all',mode==='numeric'||mode==='title'?'title':'number');
   if(mode==='home'){await p.locator('#library .header-home').click();await p.locator('#home-search').fill(String(number));await p.locator('#home-search').press('Enter');}
   else if(['numeric','title','source-search'].includes(mode))await p.locator('#library-search').fill(mode==='title'?title.replace(/\?$/,''):String(number));
   const displayed=await shown();assert(displayed.includes(id));await open(id);const n=await nav();assert(!n.previous.disabled);assert(!n.next.disabled);
   if(mode==='all'){assert.deepEqual(n.ids,displayed);assert.equal(n.next.id,displayed[displayed.indexOf(id)+1]);}
   else {assert.equal(n.previous.id,hymn(number-1));assert.equal(n.next.id,hymn(number+1));}
   if(mode==='numeric'){assert.equal(n.entry.sort,'title');assert.equal(n.entry.locatorSource,'hymnal');}
   if(mode==='source'||mode==='numeric'){await p.locator('#next-song').click();await ready(hymn(number+1));assert.equal((await nav()).currentSongId,hymn(number+1));await p.locator('#previous-song').click();await ready(id);}
   console.log('PASS',number,mode,'navigation boundaries and sequence');
  }
 }
 await start('children');for(const base of ['145','20']){await p.locator('#library-search').fill(base);const ids=await shown(),expected=songs.filter(s=>s.collection==='Children’s Songbook'&&new RegExp('^'+base+'[a-z]$').test(String(s.songNumber??s.page))).map(s=>s.id);assert(expected.length>=2);for(const id of expected)assert(ids.includes(id));for(const suffix of ['a','b']){await p.locator('#library-search').fill(base+suffix);assert.deepEqual(await shown(),expected.filter(id=>String(songs.find(s=>s.id===id).songNumber??songs.find(s=>s.id===id).page)===base+suffix));}}
 // Exact source sorting is retained when searching within an individual source.
 await start('hymnal','title');const alphabetical=await shown();await p.locator('#library-search').fill('140');await open(hymn(140));assert.deepEqual((await nav()).ids,alphabetical);
 // Broad keyword results remain bounded, even with multiple playable hits.
 await start();await p.locator('#library-search').fill('God');const bounded=await shown();assert(bounded.length>2);await open(bounded[0]);assert.deepEqual((await nav()).ids,bounded);
 // Explicit List searches keep the manual List order and its legitimate end boundary.
 await start();await p.locator('#library-source').click();await p.locator('[data-source="list:bounded"]').click();await p.locator('#library-search').fill('243');await open(hymn(243));let n=await nav();assert.deepEqual(n.ids,list);assert.equal(n.previous.id,hymn(140));assert(n.next.disabled);await p.locator('#previous-song').click();await ready(hymn(140));assert.equal((await nav()).previous.id,hymn(244));
 await start();await p.locator('#view-favorites').evaluate(e=>e.click());await p.locator('#library-search').fill('243');await open(hymn(243));n=await nav();assert.deepEqual(n.ids,favorites);assert(n.next.disabled);assert.equal(n.entry.locatorSource,null);
 // Search-in remains authoritative and persists; normal title search still finds the identity.
 await start('children');await p.locator('#library-search-options').click();await p.locator('[data-search-field=page]').uncheck();await p.keyboard.press('Escape');await p.locator('#library-search').fill('145');assert.equal((await shown()).length,0);await p.locator('#library-search').fill('A Special Gift Is Kindness');assert.equal((await shown()).length,1);await p.reload();await p.waitForFunction(()=>window.prototype?.navigation);assert.deepEqual(await p.evaluate(()=>JSON.parse(localStorage.getItem('music-transpose-search-fields-v2'))),['title']);
 assert.deepEqual(errors,[]);console.log('PASS suffix searches, source sorting, bounded keyword/Favorites/List contexts, Home Search and Search-in persistence');
}finally{await browser.close();}
