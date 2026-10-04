import fs from 'node:fs';import assert from 'node:assert/strict';import {createRequire} from 'node:module';import {songs} from '../songs.js';
const {webkit,chromium}=createRequire(process.env.PLAYWRIGHT_PACKAGE||'C:/Users/kenro/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/package.json')('playwright');
const browsers=[await webkit.launch(),await chromium.launch({channel:'msedge',headless:true})],out=[];
const hymn=n=>songs.find(s=>s.collection==='Hymns (1985)'&&s.page===String(n));
fs.mkdirSync('test-results/library-row-polish',{recursive:true});
try{for(const width of [390,430,820,1440]){
 const c=await browsers[width<600?0:1].newContext({viewport:{width,height:1000},serviceWorkers:'block'}),p=await c.newPage(),errors=[];p.on('pageerror',e=>errors.push(e.message));
 await p.addInitScript(id=>localStorage.setItem('music-transpose-library-v1',JSON.stringify({orderingVersion:1,favorites:[],groups:[{id:'practice',name:'Practice',songs:[id],displayNames:{[id]:'Sunday opening'}}]})),hymn(2).id);
 await p.goto('http://127.0.0.1:8780/');await p.waitForFunction(()=>prototype.navigation);await p.locator('[data-home-source=hymnal]').click();
 const source=async value=>{await p.locator('#library-source').click();await p.locator('#library-source-menu [data-source="'+value+'"]').click();};
 const row=id=>p.locator('.library-row[data-song="'+id+'"]');
 const check=async(id,text,title)=>{const r=row(id);assert.deepEqual(await r.locator('.song-meta').allTextContents(),[text]);if(title)assert.equal(await r.locator('.song-title').textContent(),title);assert.equal(await r.locator('.current-label').count(),0);assert(!await r.evaluate(e=>e.classList.contains('current-song')));assert((await r.locator('.song-entry').boundingBox()).height>=44);};
 await p.locator('#order-toggle').selectOption('number');await check(hymn(2).id,'Hymns (1985)','The Spirit of God');assert.equal(await row(hymn(2).id).locator('.song-number').textContent(),'2 ·');
 await p.locator('#order-toggle').selectOption('title');await check(hymn(2).id,'Hymns (1985)');assert.equal(await row(hymn(2).id).locator('.song-number').count(),0);
 await p.locator('#library-search').fill('2');await check(hymn(2).id,'Hymns (1985)');assert(!await p.locator('#library-results').innerText().then(t=>t.includes('Matched page')));
 await p.locator('#library-search').fill('The Spirit of God');await check(hymn(2).id,'Hymns (1985)');
 await row(hymn(2).id).locator('.favorite').click();assert.equal(await row(hymn(2).id).locator('.favorite').getAttribute('aria-pressed'),'true');
 await p.locator('#library-search').fill('86');await check(hymn(86).id,'Hymns (1985) · Score unavailable');assert.match(await row(hymn(86).id).locator('.song-entry').getAttribute('aria-label'),/score unavailable/);
 await p.locator('#library-search').fill('');await source('children');await check('cs-138','Children’s Songbook');
 await source('home-church');await check('hhc-1035','Hymns for Home and Church');
 await source('my-music');await check('scripture-power','Files');
 await row('scripture-power').locator('.song-entry').click();await p.waitForFunction(()=>prototype.ready&&!prototype.busy&&!prototype.loading);await p.locator('#songs').click();await p.locator('[data-home-source=all]').click();await source('my-music');await check('scripture-power','Files');
 await source('list:practice');await check(hymn(2).id,'Hymns (1985)','Sunday opening');assert.equal(await row(hymn(2).id).locator('.edit-list-entry').count(),1);assert.equal(await row(hymn(2).id).locator('.order-song').count(),1);
 await source('hymnal');await p.locator('#library-search-options').click();await p.locator('[data-search-field=lyrics]').check();await p.keyboard.press('Escape');await p.locator('#library-search').fill('glory begins to come forth');await p.waitForFunction(()=>document.querySelector('#library-results').getAttribute('aria-busy')==='false');
 assert((await p.locator('#library-results').innerText()).includes('Matched lyrics'));
 await p.locator('#library-search').fill('');await p.locator('#order-toggle').selectOption('number');
 for(const theme of ['light','dark']){
  if(theme==='dark')await p.locator('#library .library-theme-toggle').click();
  assert.equal(await p.evaluate(()=>document.documentElement.dataset.libraryTheme),theme);
  await check(hymn(2).id,'Hymns (1985)');
  const geometry=await row(hymn(2).id).evaluate(e=>{const a=e.querySelector('.song-entry').getBoundingClientRect(),b=e.querySelector('.favorite').getBoundingClientRect();return {rowHeight:e.getBoundingClientRect().height,entryHeight:a.height,favoriteWidth:b.width,favoriteHeight:b.height,overlap:a.right>b.left,overflow:document.documentElement.scrollWidth>innerWidth};});
  assert(!geometry.overlap&&!geometry.overflow);assert(geometry.favoriteWidth>=44&&geometry.favoriteHeight>=44);
  await p.screenshot({path:'test-results/library-row-polish/'+width+'-'+theme+'.png'});out.push({width,theme,...geometry});
 }
 assert.deepEqual(errors,[]);console.log('PASS sources, sorts, aliases, availability, search, themes and actions',width);await c.close();
}fs.writeFileSync('test-results/library-row-polish/results.json',JSON.stringify(out,null,2)+'\n');}finally{await Promise.all(browsers.map(b=>b.close()));}
