import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createRequire} from 'node:module';
const {chromium}=createRequire('C:/Users/kenro/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/package.json')('playwright');
const browser=await chromium.launch({channel:'msedge'});
try{
 const c=await browser.newContext({viewport:{width:820,height:1180},acceptDownloads:true}),p=await c.newPage();
 await c.addInitScript(()=>{Object.defineProperty(navigator,'canShare',{value:()=>true,configurable:true});Object.defineProperty(navigator,'share',{value:async data=>{window.sharedBytes=Array.from(new Uint8Array(await data.files[0].arrayBuffer()));},configurable:true});});
 await p.goto('http://127.0.0.1:8780/');await p.waitForFunction(()=>window.prototype?.navigation&&navigator.serviceWorker.controller);
 const saved=await p.evaluate(async()=>{const m=await import('./offline-manager.js');await m.saveOfflineSong({id:'nativity'});return m.offlineSongState({id:'nativity'});});assert(saved.saved&&saved.individual);
 // Seed the exact pre-simplification document keys, including an official-page-2 mark.
 const legacy=await p.evaluate(async()=>{
  pdfjsLib.GlobalWorkerOptions.workerSrc=new URL('./vendor/pdf.worker.min.js',location.href).href;
  const documents={};for(const [asset,songId,page] of [['./assets/pdfs/fallback/nativity.pdf','nativity',2],['./assets/pdfs/performance/nativity.pdf','nativity',1],['./assets/pdfs/fallback/faithful.pdf','faithful',1]]){
   const doc=await pdfjsLib.getDocument(asset).promise,base=songId==='nativity'?'./assets/pdfs/fallback/nativity.pdf':asset,source=base+'#'+doc.fingerprints[0];
   documents[JSON.stringify([songId,source])]={songId,source,pages:{[page]:[{tool:'pencil',color:'#245A9A',points:[{x:.3,y:.3},{x:.45,y:.3}]}]}};
  }localStorage.setItem('music-transpose-pdf-annotations-v1',JSON.stringify({version:1,documents,preferences:{}}));return documents;
 });
 await c.setOffline(true);await p.reload();await p.waitForFunction(()=>window.prototype?.navigation&&navigator.serviceWorker.controller);
 await p.evaluate(()=>prototype.loadSong('nativity'));const ready=async()=>{await p.waitForFunction(()=>prototype.ready&&!prototype.busy&&!prototype.loading);await p.waitForTimeout(200);};await ready();assert.equal(await p.locator('.pdf-page-frame').count(),1);
 const select=async selector=>{await p.locator('#score-size').click();await p.locator(selector).click();await ready();};await select('#score-pdf-option');assert.equal(await p.locator('.pdf-page-frame').count(),1);
 const expected=fs.readFileSync('assets/pdfs/performance/nativity.pdf');
 await p.locator('#score-tools').click();await p.locator('#score-share').click();await p.waitForFunction(()=>window.sharedBytes);assert(Buffer.from(await p.evaluate(()=>sharedBytes)).equals(expected));
 await p.locator('#score-tools').click();const trim=p.locator('#pdf-trim');await trim.uncheck();assert.equal(await p.locator('.pdf-page-frame').evaluate(e=>JSON.parse(e.dataset.trim).left),0);await p.locator('#score-tools').click();await trim.check();
 // Save one real pencil stroke; original and performance documents must stay isolated.
 await p.locator('#score-tools').click();await p.locator('#score-annotate').click();const layer=p.locator('.pdf-page-frame.current-page .pdf-annotation-canvas');await layer.waitFor({state:'visible'});assert(await layer.evaluate(e=>e.getContext('2d').getImageData(0,0,e.width,e.height).data.some((v,i)=>i%4===3&&v>0)),'legacy performance marks still render');const r=await layer.boundingBox();await p.mouse.move(r.x+r.width*.3,r.y+r.height*.3);await p.mouse.down();await p.mouse.move(r.x+r.width*.5,r.y+r.height*.3,{steps:8});await p.mouse.up();
 const marks=()=>p.evaluate(()=>JSON.parse(localStorage.getItem('music-transpose-pdf-annotations-v1')).documents);const before=await marks();assert.equal(Object.values(before).length,3);const performanceKey=Object.keys(legacy).find(k=>legacy[k].songId==='nativity'&&legacy[k].pages[1]);assert.equal(before[performanceKey].pages[1].length,2);for(const k of Object.keys(legacy).filter(k=>k!==performanceKey))assert.deepEqual(before[k],legacy[k]);await p.locator('#pdf-annotation-done').click();
 await p.reload();await p.waitForFunction(()=>window.prototype?.navigation);await ready();assert.equal(await p.locator('.pdf-page-frame').count(),1);assert.deepEqual(await marks(),before);
 await select('#score-pdf-option');assert.deepEqual(await marks(),before);await p.locator('#score-tools').click();await p.locator('#score-annotate').click();assert(await layer.evaluate(e=>e.getContext('2d').getImageData(0,0,e.width,e.height).data.some((v,i)=>i%4===3&&v>0)));await p.locator('#pdf-annotation-done').click();
 const bytes=await p.evaluate(async()=>Array.from(await (await import('./pdf-score.js')).originalPdfData(document.querySelector('#pdf-original').href)));assert(Buffer.from(bytes).equals(expected),'annotations never alter PDF export');
 const assets=await p.evaluate(async()=>{const entries=(await(await fetch('offline-catalog.json')).json()).nativity;return Promise.all(entries.map(async a=>{const r=await fetch(a.url);return r.ok&&(await r.arrayBuffer()).byteLength>0;}));});assert.equal(assets.length,3);assert(assets.every(Boolean));
 console.log('PASS real offline save/reload, MXL + both PDFs, native-share payload, drawn annotation persistence/isolation, clean export');await c.close();
}finally{await browser.close();}
