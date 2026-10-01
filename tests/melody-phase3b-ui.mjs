import {createRequire} from 'node:module';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
const {chromium}=createRequire(process.env.PLAYWRIGHT_PACKAGE)('playwright');
const b=await chromium.launch({channel:'msedge',headless:true}),p=await b.newPage({viewport:{width:820,height:1180},serviceWorkers:'block',acceptDownloads:true});
const errors=[];p.on('pageerror',e=>errors.push(e.message));
try{
 await p.goto(process.env.TEST_URL||'http://127.0.0.1:8780/');await p.locator('.library-row').first().waitFor();
 const rows=JSON.parse(await fs.readFile('test-results/phase3b-audit.json','utf8')).filter(r=>r.ok&&r.phase3b);
 assert.equal(rows.length,9);
 const ready=()=>p.waitForFunction(()=>prototype.ready&&!prototype.busy&&document.querySelector('#score').getAttribute('aria-busy')==='false',{},{timeout:120000});
 const view=async value=>{await p.locator('#score-size').click();await p.locator(`#score-size-options [data-size=${value}]`).click();await ready();};
 for(const {id} of rows){
  await p.evaluate(id=>prototype.loadSong(id),id);await ready();assert.equal(await p.locator('#score-view-label').textContent(),'Original');assert(await p.locator('#score-size-options [data-size=large]').isEnabled());
  await view('large');assert.equal(await p.locator('#score-view-label').textContent(),'Melody only');assert(await p.evaluate(()=>prototype.lead.ok));
  const notes=await p.evaluate(async()=>(await import('./playback.js')).scoreTimeline(prototype.viewXML).notes.map(n=>[n.midi,n.start,n.duration]));
  await p.evaluate(()=>prototype.changeKey(2));await ready();
  const shifted=await p.evaluate(async()=>(await import('./playback.js')).scoreTimeline(prototype.viewXML).notes.map(n=>[n.midi,n.start,n.duration]));assert.deepEqual(shifted,notes.map(([m,s,d])=>[m+2,s,d]));
  await p.locator('#score-tools').click();await p.locator('#score-export').click();const download=p.waitForEvent('download');await p.locator('#score-export-xml').click();const result=await download;assert.equal(await result.failure(),null);const xml=await fs.readFile(await result.path(),'utf8');assert.equal(xml,await p.evaluate(()=>prototype.viewXML));assert.match(result.suggestedFilename(),/Melody only.musicxml$/);
  assert(await p.evaluate(xml=>{const d=new DOMParser().parseFromString(xml,'application/xml');return !d.querySelector('parsererror')&&d.querySelectorAll('score-partwise > part').length===1&&!d.querySelector('note > chord')&&!xml.includes('lead-harmony-spacing');},xml));
  await view('pdf');assert.equal(await p.locator('#score-view-label').textContent(),'Original');await view('large');assert.deepEqual(await p.evaluate(async()=>(await import('./playback.js')).scoreTimeline(prototype.viewXML).notes.map(n=>[n.midi,n.start,n.duration])),shifted);
  console.log('PASS direct Original/Melody, committed transposition/playback, actual MusicXML download, key restoration',id);
 }
 for(const id of ['cs-12']){await p.evaluate(id=>prototype.loadSong(id),id);await ready();assert(await p.locator('#score-size-options [data-size=large]').isDisabled());}
 assert.deepEqual(errors,[]);console.log('PASS deferred duet remains disabled; no runtime errors');
}finally{await b.close();}
