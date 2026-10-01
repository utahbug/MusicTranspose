import {createRequire} from 'node:module';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
const {chromium}=createRequire(process.env.PLAYWRIGHT_PACKAGE)('playwright');
const b=await chromium.launch({channel:'msedge',headless:true}),p=await b.newPage({viewport:{width:820,height:1180},serviceWorkers:'block',acceptDownloads:true});
const errors=[];p.on('pageerror',e=>errors.push(e.message));
try{
 await p.goto(process.env.TEST_URL||'http://127.0.0.1:8780/');await p.locator('.library-row').first().waitFor();
 const rows=JSON.parse(await fs.readFile('test-results/phase3c-audit.json','utf8')).filter(r=>r.ok&&!r.oldOk);
 assert.equal(rows.length,2);
 const checks=[];
 const ready=()=>p.waitForFunction(()=>prototype.ready&&!prototype.busy&&document.querySelector('#score').getAttribute('aria-busy')==='false',{},{timeout:120000});
 const view=async value=>{await p.locator('#score-size').click();await p.locator(`#score-size-options [data-size=${value}]`).click();await ready();};
 for(const {id} of rows){
  await p.evaluate(id=>prototype.loadSong(id),id);await ready();assert.equal(await p.locator('#score-view-label').textContent(),'Original');assert(await p.locator('#score-size-options [data-size=large]').isEnabled());
  await view('large');assert.equal(await p.locator('#score-view-label').textContent(),'Melody only');assert(await p.evaluate(()=>prototype.lead.ok));
  await p.evaluate(()=>prototype.playback.prepare());
  assert(await p.evaluate(async()=>JSON.stringify(prototype.playback.timeline)===JSON.stringify((await import('./playback.js')).scoreTimeline(prototype.viewXML))));
  const play=p.locator('.score-heading .song-playback');await play.click();await p.waitForFunction(()=>prototype.playback.state==='playing'&&prototype.playback.nodes>0);
  await play.click();assert.equal(await p.evaluate(()=>prototype.playback.state),'paused');assert.equal(await p.evaluate(()=>prototype.playback.nodes),0);
  await play.click();await p.waitForFunction(()=>prototype.playback.state==='playing'&&prototype.playback.nodes>0);
  const clock=await p.evaluate(()=>{const t=prototype.playback.tempo;prototype.playback.setTempo(t.original*1.1);const result=prototype.playback.tempo;prototype.playback.stop();return result;});assert(Math.abs(clock.rate-1.1)<1e-7);assert.equal(await p.evaluate(()=>prototype.playback.nodes),0);
  const offline=await p.evaluate(async()=>{const {createScoreVoice,configurePlaybackOutput}=await import('./playback-voices.js'),{scoreTimeline}=await import('./playback.js'),t=scoreTimeline(prototype.viewXML),ctx=new OfflineAudioContext(1,Math.ceil((t.duration+1)*24000),24000),master=ctx.createGain(),limiter=ctx.createDynamicsCompressor();configurePlaybackOutput(master,limiter,'grand-piano');master.connect(limiter);limiter.connect(ctx.destination);let ended=0;for(const n of t.notes)createScoreVoice(ctx,master,n.midi,n.start,n.duration,'grand-piano',()=>ended++);const buffer=await ctx.startRendering(),data=buffer.getChannelData(0);let peak=0;for(const sample of data){if(!Number.isFinite(sample))throw Error('Invalid rendered audio');peak=Math.max(peak,Math.abs(sample));}return {notes:t.notes.length,ended,peak,tail:Math.max(...data.slice(-2000).map(Math.abs)),duration:t.duration};});
  assert.equal(offline.notes,offline.ended);assert(offline.tail<.00001&&offline.peak>0&&offline.peak<.95);
  const notes=await p.evaluate(async()=>(await import('./playback.js')).scoreTimeline(prototype.viewXML).notes.map(n=>[n.midi,n.start,n.duration]));
  await p.evaluate(()=>prototype.changeKey(2));await ready();
  const shifted=await p.evaluate(async()=>(await import('./playback.js')).scoreTimeline(prototype.viewXML).notes.map(n=>[n.midi,n.start,n.duration]));assert.deepEqual(shifted,notes.map(([m,s,d])=>[m+2,s,d]));await p.evaluate(()=>prototype.playback.prepare());assert.deepEqual(await p.evaluate(()=>prototype.playback.timeline.notes.map(n=>[n.midi,n.start,n.duration])),shifted);
  await p.locator('#score-tools').click();await p.locator('#score-export').click();const download=p.waitForEvent('download');await p.locator('#score-export-xml').click();const result=await download;assert.equal(await result.failure(),null);const xml=await fs.readFile(await result.path(),'utf8');assert.equal(xml,await p.evaluate(()=>prototype.viewXML));await fs.writeFile(`test-results/phase3c-${id}-melody-transposed.musicxml`,xml);assert.match(result.suggestedFilename(),/Melody only.musicxml$/);
  assert(await p.evaluate(xml=>{const d=new DOMParser().parseFromString(xml,'application/xml');return !d.querySelector('parsererror')&&d.querySelectorAll('score-partwise > part').length===1&&!d.querySelector('note > chord')&&!xml.includes('lead-harmony-spacing');},xml));
  await view('pdf');assert.equal(await p.locator('#score-view-label').textContent(),'Original');await view('large');assert.deepEqual(await p.evaluate(async()=>(await import('./playback.js')).scoreTimeline(prototype.viewXML).notes.map(n=>[n.midi,n.start,n.duration])),shifted);
  checks.push({id,...offline,pauseResumeStop:true,tempoRate:clock.rate,exportFilename:result.suggestedFilename()});console.log('PASS direct Melody, RH playback/timing, full offline voice cleanup, pause/resume/stop, tempo, transposed XML export',id,offline);
 }
 // Song switch must dispose the prior song's live voices.
 await p.locator('.score-heading .song-playback').click();await p.waitForFunction(()=>prototype.playback.nodes>0);
 const regressions=await p.evaluate(async()=>{const {songs}=await import('./songs.js');const names=['The Nativity Song','The Shepherd’s Carol','I Am a Child of God','Away in a Manger','I Love to See the Temple'];return ['hhc-1035','hhc-1054',...names.map(title=>songs.find(s=>s.collection==='Children’s Songbook'&&s.title===title)?.id),songs.find(s=>s.collection==='Hymns (1985)'&&s.title==='We Thank Thee, O God, for a Prophet')?.id];});
 assert(regressions.every(Boolean));assert.equal(regressions.length,8);
 for(const id of regressions){await p.evaluate(id=>prototype.loadSong(id,'large'),id);await ready();assert.equal(await p.evaluate(()=>prototype.playback.nodes),0);assert(await p.evaluate(()=>prototype.lead.ok));assert.equal(await p.locator('#score-view-label').textContent(),'Melody only');assert(await p.locator('#score svg').count());await p.evaluate(()=>prototype.playback.prepare());assert(await p.evaluate(async()=>JSON.stringify(prototype.playback.timeline)===JSON.stringify((await import('./playback.js')).scoreTimeline(prototype.viewXML))));console.log('PASS named prior Melody regression',id);}
 await fs.writeFile('test-results/phase3c-ui.json',JSON.stringify({checks,regressions},null,2));
 for(const id of ['cs-12']){await p.evaluate(id=>prototype.loadSong(id),id);await ready();assert(await p.locator('#score-size-options [data-size=large]').isDisabled());}
 assert.deepEqual(errors,[]);console.log('PASS deferred duet remains disabled; no runtime errors');
}finally{await b.close();}
