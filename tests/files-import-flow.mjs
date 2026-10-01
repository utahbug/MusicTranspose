import {createRequire} from 'node:module';
import assert from 'node:assert/strict';
const {chromium}=createRequire(process.env.PLAYWRIGHT_PACKAGE)('playwright');
const browser=await chromium.launch({channel:'msedge',headless:true});
const base=process.env.TEST_URL||'http://127.0.0.1:8780/';
const ready=(p,id)=>p.waitForFunction(id=>prototype.song===id&&prototype.ready&&!prototype.busy&&!document.body.classList.contains('song-loading'),id);
const openFiles=async p=>{await p.locator('#library-more').click();assert.deepEqual(await p.locator('#library-more-dialog button:visible').allTextContents(),['Files','Add to Home Screen…']);await p.locator('#view-files').click();};
const filesIds=p=>p.locator('#files-results .file-row').evaluateAll(es=>es.map(e=>e.dataset.file));
try{
 const c=await browser.newContext({viewport:{width:820,height:1180},serviceWorkers:'block'}),p=await c.newPage(),errors=[];p.on('pageerror',e=>errors.push(e.message));
 await p.goto(base);await p.locator('.library-row').first().waitFor();await p.locator('#library-search').fill('Sabbath');await openFiles(p);
 assert.deepEqual(await filesIds(p),['choose-to-serve-the-lord','scripture-power']);
 for(const [width,height] of [[820,1180],[1440,1000],[390,844]]){
  await p.setViewportSize({width,height});await p.locator('#add-music').focus();await p.keyboard.press('Enter');await p.locator('#music-import').waitFor({state:'visible'});
  await p.locator('#music-file').setInputFiles('assets/pdfs/scripture-power.pdf');await p.waitForFunction(()=>!document.querySelector('#import-save').disabled);
  assert(await p.locator('#import-preview canvas').count());
  const box=await p.locator('#import-save').boundingBox();assert(box.y>=0&&box.y+box.height<=height&&box.height>=44);
  assert.equal(await p.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
  assert(await p.locator('#music-import').evaluate(e=>e.scrollWidth<=e.clientWidth));
  await p.locator('.import-body').evaluate(e=>e.scrollTop=e.scrollHeight);
  assert.deepEqual(await p.locator('#import-save').boundingBox(),box);
  await p.screenshot({path:`test-results/files-import-${width}.png`});
  await p.keyboard.press('Escape');await p.locator('#music-import').waitFor({state:'hidden'});assert(await p.locator('#files-view').isVisible());
  await p.screenshot({path:`test-results/files-page-${width}.png`});
  console.log('PASS import preview, fixed action footer, Escape and overflow',width);
 }
 // Browser Back dismisses import to Files; Forward reopens a fresh import.
 await p.locator('#add-music').click();await p.goBack();await p.locator('#music-import').waitFor({state:'hidden'});assert(await p.locator('#files-view').isVisible());
 await p.goForward();await p.locator('#music-import').waitFor({state:'visible'});assert(await p.locator('#import-save').isDisabled());
 await p.locator('#music-file').setInputFiles('assets/pdfs/scripture-power.pdf');await p.waitForFunction(()=>!document.querySelector('#import-save').disabled);
 await p.locator('#import-title').fill('A Files navigation fixture');await p.locator('#import-save').click();await p.locator('#music-import').waitFor({state:'hidden'});await p.locator('.just-added').waitFor();
 const ids=await filesIds(p),imported=ids[0];assert(imported.startsWith('local-'));assert.equal(ids.length,3);assert.equal(await p.locator('.just-added strong').textContent(),'A Files navigation fixture');assert(await p.locator('.just-added .file-entry').evaluate(e=>document.activeElement===e));
 await p.reload();await p.locator('#files-view').waitFor({state:'visible'});assert.deepEqual(await filesIds(p),ids);
 await p.locator(`[data-file="${ids[0]}"] .file-entry`).click();await ready(p,ids[0]);assert(await p.locator('#previous-song').isDisabled());
 assert.deepEqual(await p.evaluate(()=>history.state.musicTransposeNavigation.route.songSet),{ids,origin:'files'});
 await p.locator('#next-song').click();await ready(p,ids[1]);await p.locator('#next-song').click();await ready(p,ids[2]);assert(await p.locator('#next-song').isDisabled());
 await p.locator('.score-identity-header .header-home').click();await p.locator('#library').waitFor({state:'visible'});assert.equal(await p.locator('#library-search').inputValue(),'Sabbath');
 await p.locator('.library-heading .header-home').focus();await p.keyboard.press('Tab');await p.keyboard.press('Shift+Tab');assert.equal(await p.locator('.library-heading .header-home').evaluate(e=>getComputedStyle(e).outlineStyle),'none');assert.equal(await p.locator('.library-heading h1').evaluate(e=>getComputedStyle(e).textDecorationLine),'underline');
 // Hidden compatibility entry still routes into Files before opening Import.
 await p.evaluate(()=>document.querySelector('#library-import').click());await p.locator('#music-import').waitFor({state:'visible'});assert(await p.locator('#files-view').isVisible());await p.locator('#close-import').click();await p.locator('#music-import').waitFor({state:'hidden'});
 // A structured preview still renders inside the scrolling content region.
 await p.locator('#add-music').click();
 const xml='<?xml version="1.0" encoding="utf-8"?><score-partwise version="3.1"><work><work-title>Import preview fixture</work-title></work><part-list><score-part id="P1"><part-name>Music</part-name></score-part></part-list><part id="P1"><measure number="1"><attributes><divisions>1</divisions><key><fifths>0</fifths><mode>major</mode></key><time><beats>4</beats><beat-type>4</beat-type></time><clef><sign>G</sign><line>2</line></clef></attributes><note><pitch><step>C</step><octave>4</octave></pitch><duration>4</duration><type>whole</type></note></measure></part></score-partwise>';
 await p.locator('#music-file').setInputFiles({name:'preview.musicxml',mimeType:'application/xml',buffer:Buffer.from(xml)});await p.waitForFunction(()=>!document.querySelector('#music-file').disabled);assert.equal(await p.locator('#import-save').isDisabled(),false,await p.locator('#import-message').textContent());assert(await p.locator('#import-preview svg').count());await p.keyboard.press('Escape');await p.locator('#music-import').waitFor({state:'hidden'});
 // Empty-state branch remains useful even if no bundled/user file songs are present.
 await p.evaluate(async()=>{const {songs}=await import('./catalog.js'),{isFileSong}=await import('./library-query.js');for(let i=songs.length-1;i>=0;i--)if(isFileSong(songs[i]))songs.splice(i,1);document.dispatchEvent(new Event('local-music-changed'));});
 assert.equal(await p.locator('.files-empty').textContent(),'No music files yet.');assert(await p.locator('#add-music').isVisible());assert.deepEqual(errors,[]);
 console.log('PASS persisted real PDF import, reveal/focus, Back/Forward, Files Previous/Next boundaries/order, header/context, hidden compatibility route, empty state');
 await c.close();
}finally{await browser.close();}

