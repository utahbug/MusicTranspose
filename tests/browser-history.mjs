import {createRequire} from 'node:module';
import assert from 'node:assert/strict';
const {chromium}=createRequire(process.env.PLAYWRIGHT_PACKAGE)('playwright');
const base=process.env.TEST_URL||'http://127.0.0.1:8768/';
const browser=await chromium.launch({channel:'msedge',headless:true});
const ready=p=>p.waitForFunction(()=>prototype.ready&&!prototype.busy&&document.querySelector('#score').getAttribute('aria-busy')==='false');
const view=async(p,name)=>{await p.waitForFunction(name=>name==='score'?!document.body.classList.contains('library-open')&&!document.body.classList.contains('lyrics-open')&&prototype.ready:name==='lyrics'?document.body.classList.contains('lyrics-open'):!document.querySelector('#'+({library:'library',lists:'lists-view',files:'files-view'}[name])).hidden,name);await p.waitForTimeout(120);assert.equal(await p.evaluate(()=>history.state.musicTransposeNavigation.route.view),name);assert.equal(new URL(p.url()).pathname,new URL(base).pathname);};
const open=async(p,id='nativity')=>{await p.locator(`[data-song="${id}"] .song-entry`).click();await ready(p);await view(p,'score');};
try{
 for(const [width,height] of [[1180,820],[820,1180],[390,844],[1440,1000]]){
  const context=await browser.newContext({viewport:{width,height},hasTouch:width!==1440}),p=await context.newPage(),errors=[];
  p.on('pageerror',e=>errors.push(e.message));
  await p.goto('data:text/html,<title>Previous site</title>Previous site');await p.goto(base);await p.locator('.library-row').first().waitFor();
  await p.locator('#library-source').selectOption('children');await p.locator('#library-search').fill('Nativity');await p.locator('#order-toggle').click();
  const length=await p.evaluate(()=>history.length);await open(p);assert.equal(await p.evaluate(()=>history.length),length+1);
  await p.locator('.score-heading .song-playback').click();await p.waitForFunction(()=>prototype.playback.state==='playing');
  await p.goBack();await view(p,'library');assert.equal(await p.evaluate(()=>prototype.playback.state),'stopped');assert.equal(await p.locator('#library-search').inputValue(),'Nativity');assert.equal(await p.locator('#library-source').inputValue(),'children');assert.equal(await p.locator('#order-toggle').textContent(),'123');
  await p.goForward();await ready(p);await view(p,'score');
  const songLength=await p.evaluate(()=>history.length);await p.locator('#key').click();await p.locator('[data-shift="1"]').click();await ready(p);await p.locator('#reset').click();await ready(p);assert.equal(await p.evaluate(()=>history.length),songLength);
  await p.reload();await ready(p);await view(p,'score');assert.equal(await p.evaluate(()=>prototype.song),'nativity');
  await p.locator('#show-lyrics').click();await view(p,'lyrics');await p.goBack();await view(p,'score');await p.goForward();await view(p,'lyrics');await p.getByRole('button',{name:'Open score',exact:true}).click();await view(p,'score');await p.goBack();await view(p,'lyrics');
  await p.getByRole('button',{name:'Return to Library',exact:true}).click();await view(p,'library');
  await p.locator('[data-song="nativity"] .favorite').click();await p.locator('#view-favorites').click();await open(p);await p.goBack();await view(p,'library');assert.equal(await p.locator('#view-favorites').getAttribute('aria-pressed'),'true');assert.equal(await p.locator('.library-row').count(),1);
  await p.locator('#manage-lists').click();await view(p,'lists');await p.getByRole('button',{name:'New list',exact:true}).click();await p.locator('#list-name-input').fill('Prelude');await p.locator('#list-name-form button[type=submit]').click();const list=await p.evaluate(()=>history.state.musicTransposeNavigation.route.list);assert(list);
  await p.getByRole('button',{name:'Add songs',exact:true}).click();await p.locator('#list-picker-search').fill('Nativity');await p.locator('#list-picker-results input[data-song="nativity"]').check();await p.locator('#list-picker-done').click();await p.locator('#list-songs [data-song="nativity"] .list-song-title').click();await ready(p);await p.goBack();await view(p,'lists');assert.equal(await p.locator('#lists-heading').textContent(),'Prelude');assert.equal(await p.evaluate(()=>history.state.musicTransposeNavigation.route.list),list);
  await p.goForward();await ready(p);await view(p,'score');await p.locator('#songs').click();await view(p,'lists');assert.equal(await p.locator('#lists-heading').textContent(),'Prelude');
  // Deleting the originating list must not leave an unusable historical route.
  await p.getByRole('button',{name:'List settings',exact:true}).click();p.once('dialog',d=>d.accept());await p.getByRole('button',{name:'Delete list',exact:true}).click();await p.goBack();await view(p,'lists');assert.equal(await p.locator('#lists-heading').textContent(),'Lists');
  await p.locator('#lists-library').click();await view(p,'library');await p.locator('#view-favorites').click();await p.locator('#library-source').selectOption('all');await p.locator('#library-search').fill('Choose to Serve');await open(p,'choose-to-serve-the-lord');assert(await p.locator('#show-lyrics').isHidden());await p.goBack();await view(p,'library');
  // Unknown stable IDs and fast sequential history travel settle on a valid view.
  await p.evaluate(()=>{const state=structuredClone(history.state);state.musicTransposeNavigation.route={view:'score',song:'deleted-id'};history.pushState(state,'');history.pushState({...state,musicTransposeNavigation:{version:1,route:{view:'library'}}},'');});await p.goBack();await view(p,'library');
  await p.locator('#library-search').fill('Nativity');await open(p);await p.evaluate(()=>{window.addEventListener('popstate',()=>history.forward(),{once:true});history.back();});await p.waitForTimeout(300);await ready(p);await view(p,'score');
  assert.deepEqual(errors,[]);console.log('PASS history Library/Favorites/List/Score/Lyrics/PDF, refresh, missing/deleted IDs, rapid travel, no key spam',width);
  await context.close();
 }
 // External entry must not gain an artificial extra Library entry.
 const c=await browser.newContext(),p=await c.newPage();await p.goto('data:text/html,<title>Previous site</title>Previous site');await p.goto(base);await p.locator('.library-row').first().waitFor();await p.goBack();assert.equal(await p.title(),'Previous site');await p.goForward();await view(p,'library');
 // Preserve a real Library scroll position without pushing scroll entries.
 await p.locator('#library-source').selectOption('children');await p.locator('[data-song="nativity"] .song-entry').scrollIntoViewIfNeeded();
 const scroll=await p.evaluate(()=>scrollY);const scrollLength=await p.evaluate(()=>history.length);await p.waitForTimeout(250);assert.equal(await p.evaluate(()=>history.length),scrollLength);
 await open(p);await p.goBack();await view(p,'library');assert(Math.abs(await p.evaluate(()=>scrollY)-scroll)<5);await p.locator('#library-source').selectOption('all');
 // Persisted private score, My Music context and deletion fallback.
 const xml='<?xml version="1.0"?><score-partwise version="4.0"><work><work-title>History fixture</work-title></work><part-list><score-part id="P1"><part-name>Piano</part-name></score-part></part-list><part id="P1"><measure number="1"><attributes><divisions>1</divisions><key><fifths>0</fifths><mode>major</mode></key><time><beats>4</beats><beat-type>4</beat-type></time><clef><sign>G</sign><line>2</line></clef></attributes><note><pitch><step>C</step><octave>4</octave></pitch><duration>4</duration><type>whole</type></note></measure></part></score-partwise>';
 await p.locator('#view-files').click();await view(p,'files');await p.locator('#add-music').click();await p.locator('#music-file').setInputFiles({name:'history.musicxml',mimeType:'application/xml',buffer:Buffer.from(xml)});await p.waitForFunction(()=>!document.querySelector('#music-file').disabled);assert(!(await p.locator('#import-save').isDisabled()),await p.locator('#import-message').textContent());await p.locator('#import-save').click();await p.waitForFunction(()=>!document.querySelector('#music-import').open);const id=await p.evaluate(async()=> (await (await import('./local-music-store.js')).localMetadata())[0].id);
 await p.locator('#files-library').click();await p.locator('#library-source').selectOption('my-music');await open(p,id);await p.goBack();await view(p,'library');assert.equal(await p.locator('#library-source').inputValue(),'my-music');await p.goForward();await ready(p);await p.reload();await ready(p);assert.equal(await p.evaluate(()=>prototype.song),id);await p.goBack();await view(p,'library');
 await p.evaluate(async id=>{await (await import('./local-music-store.js')).removeRecord(id);await (await import('./catalog.js')).refreshLocalMusic();document.dispatchEvent(new CustomEvent('local-music-deleted',{detail:id}));},id);await p.goForward();await view(p,'library');
 await p.locator('#library-source').selectOption('children');await p.locator('#library-search').fill('Nativity');await open(p);await p.locator('#show-lyrics').click();await view(p,'lyrics');await p.goBack();await view(p,'score');await p.locator('#songs').click();await view(p,'library');
 await p.evaluate(()=>navigator.serviceWorker.ready);await p.waitForFunction(()=>navigator.serviceWorker.controller);await c.setOffline(true);await p.reload();await view(p,'library');await open(p);await p.reload();await ready(p);await view(p,'score');await p.goBack();await view(p,'library');await p.goForward();await ready(p);await view(p,'score');await p.locator('#show-lyrics').click();await view(p,'lyrics');await p.goBack();await view(p,'score');
 console.log('PASS external Back escape/Forward, private import/reload/deletion, offline refresh/Back/Forward/Lyrics');await c.close();
 // Back while an asset is still loading must settle on the latest route.
 const delayed=await browser.newContext({serviceWorkers:'block'}),q=await delayed.newPage();await q.goto(base);await q.locator('.library-row').first().waitFor();
 const asset=await q.evaluate(async()=>new URL((await import('./catalog.js')).songs.find(s=>s.id==='nativity').asset,location.href).href);
 await q.route(asset,async route=>{await new Promise(r=>setTimeout(r,350));await route.continue();});
 await q.locator('[data-song="nativity"] .song-entry').click();await q.goBack();await view(q,'library');await q.goForward();await ready(q);await view(q,'score');await q.goBack();await view(q,'library');
 const broken=await q.evaluate(async()=>new URL((await import('./catalog.js')).songs.find(s=>s.id==='silent-night').asset,location.href).href);await q.route(broken,route=>route.fulfill({status:503,body:'Unavailable'}));
 await q.locator('[data-song="silent-night"] .song-entry').click();await view(q,'library');assert.equal(await q.evaluate(()=>prototype.playback.state),'stopped');
 console.log('PASS Back during asset load and unavailable-asset fallback');await delayed.close();
}finally{await browser.close();}
