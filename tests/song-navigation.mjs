import {createRequire} from 'node:module';
import assert from 'node:assert/strict';
const {chromium}=createRequire(process.env.PLAYWRIGHT_PACKAGE)('playwright');
const browser=await chromium.launch({channel:'msedge',headless:true});
const base=process.env.TEST_URL||'http://127.0.0.1:8780/';
const sequence=['hhc-1035','cs-12','choose-to-serve-the-lord'];
const ready=(p,id)=>p.waitForFunction(id=>prototype.song===id&&prototype.ready&&!prototype.busy&&!document.body.classList.contains('song-loading')&&document.querySelector('#score').getAttribute('aria-busy')==='false',id,{timeout:120000});
const ids=p=>p.locator('#library-results .library-row').evaluateAll(rows=>rows.map(r=>r.dataset.song));
const source=async(p,id)=>{await p.locator('#library-source').click();await p.locator(`[data-source="${id}"]`).click();};
const open=async(p,id)=>{await p.locator(`[data-song="${id}"] .song-entry`).click();await ready(p,id);};
const step=async(p,direction,id)=>{await p.getByRole('button',{name:direction+' song',exact:true}).click();await ready(p,id);};
const back=async p=>{await p.locator('#songs').click();await p.locator('#library').waitFor({state:'visible'});};
const route=p=>p.evaluate(()=>history.state.musicTransposeNavigation.route);
const filter=async(p,id)=>{await p.locator('#library-filter').click();await p.locator('#'+id).click();await p.keyboard.press('Escape');};
try{
 const c=await browser.newContext({viewport:{width:1440,height:1000},serviceWorkers:'block'}),p=await c.newPage(),errors=[];
 p.on('pageerror',e=>errors.push(e.message));
 await p.addInitScript(sequence=>{if(!localStorage.getItem('navigation-test-seed')){localStorage.setItem('navigation-test-seed','1');localStorage.setItem('music-transpose-library-v1',JSON.stringify({orderingVersion:1,favorites:sequence,groups:[{id:'nav-test',name:'Navigation test',songs:sequence}]}));}},sequence);
 await p.goto(base);await p.locator('.library-row').first().waitFor();
 // Collection order is exactly the displayed order, including number sort and return scroll.
 await source(p,'home-church');await p.locator('#order-toggle').selectOption('number');const collection=await ids(p),mid=collection.indexOf('hhc-1035');assert(mid>0);
 await p.locator('[data-song="hhc-1035"] .song-entry').scrollIntoViewIfNeeded();const scroll=await p.evaluate(()=>scrollY);
 await open(p,collection[mid]);assert.deepEqual((await route(p)).songSet.ids,collection);
 await step(p,'Next',collection[mid+1]);await step(p,'Previous',collection[mid]);await step(p,'Previous',collection[mid-1]);
 await back(p);assert.equal(await p.locator('#order-toggle').inputValue(),'number');assert.deepEqual(await ids(p),collection);assert(Math.abs(await p.evaluate(()=>scrollY)-scroll)<5);
 console.log('PASS collection order, Previous/Next, Library return and scroll');
 // Search set and scope survive song travel and history.
 await source(p,'all');await p.locator('#library-search-scope').selectOption('all');await p.waitForFunction(()=>document.querySelector('#library-results').getAttribute('aria-busy')==='false');await p.locator('#library-search').fill('Christmas');
 const results=await ids(p);assert(results.length>2);await open(p,results[1]);await step(p,'Next',results[2]);assert.deepEqual((await route(p)).songSet.ids,results);
 await p.goBack();await ready(p,results[1]);await p.goForward();await ready(p,results[2]);await back(p);
 assert.equal(await p.locator('#library-search').inputValue(),'Christmas');assert.equal(await p.locator('#library-search-scope').inputValue(),'all');assert.deepEqual(await ids(p),results);
 console.log('PASS search results/scope, song Back/Forward, return context');
 await p.locator('#library-clear').click();await p.locator('#library-search-scope').selectOption('titles');
 // List boundaries, disabled activation, keyboard, and PDF-first fallback from Melody.
 await source(p,'list:nav-test');assert.deepEqual(await ids(p),sequence);await open(p,sequence[0]);assert(await p.locator('#previous-song').isDisabled());
 const length=await p.evaluate(()=>history.length);await p.evaluate(()=>document.querySelector('#previous-song').click());assert.equal(await p.evaluate(()=>history.length),length);
 await p.locator('#score-size').click();await p.locator('#score-size-options [data-size="large"]').click();await p.waitForFunction(()=>prototype.lead?.ok&&!prototype.busy&&!document.body.classList.contains('song-loading'));
 await p.evaluate(()=>prototype.changeKey(2));await p.waitForFunction(()=>prototype.current===2&&!prototype.busy);
 await p.locator('#next-song').focus();await p.keyboard.press('Enter');await ready(p,sequence[1]);assert.equal(await p.locator('#score-view-label').textContent(),'Original');assert.equal(await p.evaluate(()=>prototype.current),0);assert.equal(await p.evaluate(()=>prototype.lead),null);assert.equal(await p.evaluate(()=>prototype.playback.state),'stopped');
 await step(p,'Next',sequence[2]);assert(await p.locator('#next-song').isDisabled());assert.equal(await p.evaluate(()=>document.activeElement.tagName),'H1');assert.equal(await p.locator('#score-view-label').textContent(),'Original');
 await p.goBack();await ready(p,sequence[1]);await p.goForward();await ready(p,sequence[2]);await p.reload();await ready(p,sequence[2]);assert.deepEqual((await route(p)).songSet.ids,sequence);assert(await p.locator('#next-song').isDisabled());await back(p);assert.deepEqual(await ids(p),sequence);
 await p.locator('#order-toggle').selectOption('title');const sorted=await ids(p);assert.notDeepEqual(sorted,sequence);await open(p,sorted[0]);await step(p,'Next',sorted[1]);await back(p);assert.deepEqual(await ids(p),sorted);assert.deepEqual(await p.evaluate(()=>JSON.parse(localStorage.getItem('music-transpose-library-v1')).groups[0].songs),sequence);
 console.log('PASS List manual/temporary order, boundaries, keyboard, Melody/key reset, PDF-only opening, reload/history');
 // Favorites and Lead filters preserve their ordered subsets and return states.
 await source(p,'all');await filter(p,'view-favorites');const favorites=await ids(p);assert.equal(favorites.length,3);await open(p,favorites[0]);await step(p,'Next',favorites[1]);await back(p);assert.deepEqual(await ids(p),favorites);assert.equal(await p.locator('#view-favorites').getAttribute('aria-checked'),'true');
 await filter(p,'view-lead-sheets');const lead=await ids(p);assert.deepEqual(lead,['hhc-1035']);await open(p,lead[0]);assert(await p.locator('#previous-song').isDisabled());assert(await p.locator('#next-song').isDisabled());await back(p);assert.deepEqual(await ids(p),lead);assert.equal(await p.locator('#view-lead-sheets').getAttribute('aria-checked'),'true');
 console.log('PASS Favorites/Lead-filter ordered sets and preserved return');
 await filter(p,'view-lead-sheets');await filter(p,'view-favorites');
 // A programmatic/direct opening has no Library-row snapshot: collection default A-Z.
 await p.evaluate(()=>prototype.loadSong('hhc-1035'));await ready(p,'hhc-1035');const fallback=(await route(p)).songSet;assert.equal(fallback.origin,'collection');
 const expected=await p.evaluate(async()=>{const {songs}=await import('./catalog.js'),{matchesSource,compareAlphabeticalTitles,songForSource}=await import('./library-query.js');return songs.filter(s=>matchesSource(s,'home-church')).map(s=>songForSource(s,'home-church')).sort(compareAlphabeticalTitles).map(s=>s.id);});assert.deepEqual(fallback.ids,expected);await step(p,'Next',expected[expected.indexOf('hhc-1035')+1]);
 console.log('PASS direct opening collection fallback');
 // Geometry only at the three requested sizes; no unrelated suites.
 for(const [width,height] of [[1440,1000],[820,1180],[390,844]]){
  await p.setViewportSize({width,height});await p.waitForTimeout(350);
  const geometry=await p.locator('.score-song-navigation').evaluate(nav=>{const r=nav.getBoundingClientRect(),score=document.querySelector('#score').getBoundingClientRect();return {overflow:document.documentElement.scrollWidth>innerWidth,left:r.left,right:r.right,bottom:r.bottom,scoreTop:score.top,buttons:[...nav.querySelectorAll('button')].map(b=>{const r=b.getBoundingClientRect();return [r.width,r.height];})};});
  assert(!geometry.overflow);assert(geometry.left>=0&&geometry.right<=width);assert(geometry.bottom<=geometry.scoreTop);assert.deepEqual(geometry.buttons,[[44,44],[44,44]]);
  await p.screenshot({path:`test-results/song-navigation-${width}.png`});console.log('PASS header controls/touch targets/no overflow',width);
 }
 assert.deepEqual(errors,[]);await c.close();
}finally{await browser.close();}
