import {createRequire} from 'node:module';import assert from 'node:assert/strict';import fs from 'node:fs/promises';
const {chromium}=createRequire(process.env.PLAYWRIGHT_PACKAGE)('playwright'),b=await chromium.launch({channel:'msedge',headless:true}),c=await b.newContext({viewport:{width:820,height:1180},acceptDownloads:true}),p=await c.newPage();
try{
 await p.goto(process.env.TEST_URL||'http://127.0.0.1:8780/');await p.locator('.library-row').first().waitFor();await p.evaluate(()=>navigator.serviceWorker.ready);await p.waitForFunction(()=>navigator.serviceWorker.controller);
 const ready=()=>p.waitForFunction(()=>prototype.ready&&!prototype.busy&&document.querySelector('#score').getAttribute('aria-busy')==='false');
 await p.evaluate(()=>prototype.loadSong('hhc-1035'));await ready();
 const bytes=await p.evaluate(async()=>Array.from(new Uint8Array(await(await fetch(document.querySelector('#pdf-original').href)).arrayBuffer())));
 const file=async type=>{await p.locator('#score-tools').click();await p.locator('#score-export').click();const promise=p.waitForEvent('download');await p.locator('#score-export-'+type).click();const d=await promise;assert.equal(await d.failure(),null);return fs.readFile(await d.path());};
 await c.setOffline(true);await p.reload();await p.waitForFunction(()=>typeof prototype?.loadSong==='function');await p.evaluate(()=>prototype.loadSong('hhc-1035'));await ready();assert.deepEqual(await file('pdf'),Buffer.from(bytes));assert.equal((await file('xml')).toString('utf8'),await p.evaluate(()=>prototype.original));
 await p.locator('#score-size').click();await p.locator('#score-size-options [data-size=auto]').click();await ready();await p.evaluate(()=>prototype.changeKey(-2));await ready();assert.equal((await file('xml')).toString('utf8'),await p.evaluate(()=>prototype.xml));
 await p.evaluate(()=>{window.offlinePrintCalls=0;window.print=()=>offlinePrintCalls++;});await p.locator('#score-tools').click();await p.locator('#score-export').click();await p.locator('#score-export-pdf').click();await p.waitForFunction(()=>offlinePrintCalls===1);assert(await p.locator('#print-pages .print-page svg').count()>0);
 await p.evaluate(()=>dispatchEvent(new Event('afterprint')));
 const localPdf=await p.evaluate(async bytes=>{const {addRecord}=await import('./local-music-store.js'),{songs,refreshLocalMusic}=await import('./catalog.js');const metadata={...songs.find(s=>s.id==='choose-to-serve-the-lord'),id:'local-export-pdf',title:'Local original PDF',hash:'local-export-pdf-fixture',local:true};await addRecord({metadata,file:new Blob([new Uint8Array(bytes)],{type:'application/pdf'})});await refreshLocalMusic();return metadata.id;},bytes);
 await p.evaluate(id=>prototype.loadSong(id),localPdf);await ready();assert.match(await p.locator('#pdf-original').getAttribute('href'),/^blob:/);assert.deepEqual(await file('pdf'),Buffer.from(bytes));
 console.log('PASS offline reload with service worker: original PDF bytes, original/transposed MusicXML, structured Save/Print PDF, local imported PDF Blob');
}finally{await b.close();}
