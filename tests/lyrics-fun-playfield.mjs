import {createRequire} from 'node:module';import assert from 'node:assert/strict';import {planFlight} from '../lyrics-fun.js';
const counts={header:0,upper:0,lower:0};for(let n=0;n<3000;n++){const batch=[];for(let i=0;i<4;i++){const f=planFlight(batch);batch.push(f);counts[f.region]++;}}
for(const k of ['header','upper'])assert(counts[k]/12000>.35&&counts[k]/12000<.45);assert(counts.lower/12000>.15&&counts.lower/12000<.25);console.log('REGIONS',counts);
const {chromium}=createRequire(process.env.PLAYWRIGHT_PACKAGE)('playwright'),browser=await chromium.launch({channel:'msedge',headless:true});
try{const c=await browser.newContext({hasTouch:true}),p=await c.newPage(),errors=[];p.on('pageerror',e=>errors.push(e.message));await p.clock.install();await p.goto(process.env.TEST_URL||'http://127.0.0.1:8768/');await p.locator('.library-row').first().waitFor();
const ids=await p.evaluate(async()=>{const {songs}=await import('./catalog.js'),{lyricIds}=await import('./lyrics-index.js');return [songs.find(s=>s.title==='The Spirit of God').id,songs.filter(s=>lyricIds.has(s.id)).sort((a,b)=>b.title.length-a.title.length)[0].id];});
for(const [width,height] of [[820,1180],[1180,820],[390,844],[1440,1000]]){
 await p.setViewportSize({width,height});const seen={title:0,metadata:0,notice:0,upper:0,lower:0},regions={header:0,upper:0,lower:0};let captured=false;
 for(let run=0;run<16;run++){
  await p.locator(`[data-song="${ids[0]}"] .song-view-actions button`).last().click();await p.locator('#lyrics-view').waitFor({state:'visible'});await p.clock.runFor(6000);
  const result=await p.evaluate(()=>{const paper=document.querySelector('.lyrics-paper'),body=paper.querySelector('.lyrics-body').getBoundingClientRect(),header=paper.querySelector('header'),title=header.querySelector('h1').getBoundingClientRect(),meta=header.querySelector('p').getBoundingClientRect(),notice=paper.querySelector('.lyrics-notice')?.getBoundingClientRect(),layer=document.querySelector('.lyrics-fun-layer').getBoundingClientRect();return {top:layer.top,paperTop:paper.getBoundingClientRect().top,body:body.top,notes:[...document.querySelectorAll('.lyrics-fun-note')].map(n=>{const r=n.getBoundingClientRect(),y=r.top+r.height/2;return {region:n.dataset.region,title:y>=title.top&&y<=title.bottom,metadata:y>=meta.top&&y<=meta.bottom,notice:!!notice&&y>=notice.top&&y<=notice.bottom,upper:y>=body.top&&y<innerHeight/2,lower:y>=innerHeight/2,y};})};});
  assert(result.top<result.body);assert(Math.abs(result.top-Math.max(8,result.paperTop+8))<1);assert.equal(result.notes.length,4);for(const note of result.notes){regions[note.region]++;for(const key of Object.keys(seen))seen[key]+=Number(note[key]);assert(note.y>=result.top&&note.y<=height-8);}
  if(!captured&&result.notes.some(n=>n.title)){await p.screenshot({path:`test-results/fun-header-${width}.png`});captured=true;}
  await p.getByRole('button',{name:'Return to Library',exact:true}).click();assert.equal(await p.locator('.lyrics-fun-layer').count(),0);
 }
 assert(seen.title>0&&seen.metadata>0&&seenenough(regions));assert(captured);console.log('VISIBLE RUNS',width,seen,regions);
 await p.locator(`[data-song="${ids[1]}"] .song-view-actions button`).last().click();await p.clock.runFor(6000);assert(await p.evaluate(()=>document.querySelector('.lyrics-fun-layer').getBoundingClientRect().top<document.querySelector('.lyrics-paper h1').getBoundingClientRect().bottom));await p.screenshot({path:`test-results/fun-long-header-${width}.png`});
 // Overlay never receives input; the playback control remains the actual hit target.
 assert.equal(await p.locator('.lyrics-fun-layer').evaluate(e=>getComputedStyle(e).pointerEvents),'none');
 const play=p.locator('#lyrics-view .song-playback');await play.click();assert.equal(await p.locator('.lyrics-fun-effect').count(),0);await p.waitForFunction(()=>prototype.playback.state==='playing');await play.click();assert.equal(await p.locator('.lyrics-fun-effect').count(),0);
 await p.evaluate(()=>{const paper=document.querySelector('.lyrics-paper'),original=paper.getBoundingClientRect.bind(paper);window.measureReads=0;paper.getBoundingClientRect=()=>{window.measureReads++;return original();};});await p.clock.runFor(1000);assert(await p.evaluate(()=>measureReads)<5);
 await p.getByRole('button',{name:'Return to Library',exact:true}).click();assert.equal(await p.locator('.lyrics-fun-layer').count(),0);
}
assert.deepEqual(errors,[]);await c.close();}finally{await browser.close();}
function seenenough(r){return r.header>10&&r.upper>10&&r.lower>0;}
