// Synthetic inputs only. setInputFiles tests application acceptance, not the native iOS picker.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import {createRequire} from 'node:module';
import {testPdf} from './pdf-fixture.mjs';
const require=createRequire(process.env.PLAYWRIGHT_PACKAGE),pw=require('playwright');
const root=path.resolve(new URL('..',import.meta.url).pathname.replace(/^\/([A-Z]:)/,'$1').replace(/%20/g,' '));
const server=http.createServer((req,res)=>{
 let file=path.resolve(root,'.'+decodeURIComponent(new URL(req.url,'http://localhost').pathname));
 if(file===root)file=path.join(root,'index.html');
 if(!file.startsWith(root+path.sep))return res.writeHead(403).end();
 try{res.setHeader('Content-Type',({'.js':'text/javascript','.html':'text/html','.css':'text/css','.json':'application/json','.svg':'image/svg+xml'})[path.extname(file)]||'application/octet-stream');res.end(fs.readFileSync(file));}catch{res.writeHead(404).end();}
});
await new Promise(r=>server.listen(0,'127.0.0.1',r));
const xml='<?xml version="1.0"?><score-partwise version="4.0"><work><work-title>Picker synthetic test</work-title></work><part-list><score-part id="P1"><part-name>Piano</part-name></score-part></part-list><part id="P1"><measure number="1"><attributes><divisions>1</divisions><key><fifths>0</fifths><mode>major</mode></key><time><beats>4</beats><beat-type>4</beat-type></time><clef><sign>G</sign><line>2</line></clef></attributes><note><pitch><step>C</step><octave>4</octave></pitch><duration>4</duration><type>whole</type></note></measure></part></score-partwise>';
try{for(const engine of ['chromium','webkit']){
 const browser=await pw[engine].launch(engine==='chromium'?{channel:'msedge'}:{});
 try{
 const context=await browser.newContext({viewport:{width:390,height:844},serviceWorkers:'block'}),p=await context.newPage();
 await p.goto(`http://127.0.0.1:${server.address().port}/`);await p.waitForFunction(()=>window.prototype?.navigation);
 await p.locator('#home-files').click();await p.locator('#add-music').click();
 assert.equal(await p.locator('#music-file').getAttribute('accept'),null);
 const mxl=await p.evaluate(xml=>Array.from(fflate.zipSync({'META-INF/container.xml':fflate.strToU8('<container><rootfiles><rootfile full-path="score.xml" media-type="application/vnd.recordare.musicxml+xml"/></rootfiles></container>'),'score.xml':fflate.strToU8(xml)})),xml);
 async function choose(name,buffer){await p.locator('#music-file').setInputFiles({name,mimeType:'application/octet-stream',buffer:Buffer.from(buffer)});await p.waitForFunction(()=>!document.querySelector('#music-file').disabled);}
 for(const [name,data,pattern] of [['bad.txt','text',/Choose a PDF/],['bad.mxl','PKbroken',/damaged|incomplete/],['bad.xml','<data/>',/not a supported/],['bad.pdf','bad',/not a valid PDF/]]){
  await choose(name,data);assert(await p.locator('#import-save').isDisabled());assert.match(await p.locator('#import-message').textContent(),pattern);
 }
 await choose('fixture.pdf',testPdf(1));assert(await p.locator('#import-save').isEnabled());assert(await p.locator('#import-preview canvas').count());
 await choose('fixture.musicxml',xml);assert(await p.locator('#import-save').isEnabled());assert(await p.locator('#import-preview svg').count());
 await choose('fixture.mxl',mxl);assert(await p.locator('#import-save').isEnabled());assert.match(await p.locator('#import-summary').textContent(),/Transposable/);assert(await p.locator('#import-preview svg').count());
 const shifts=await p.evaluate(async xml=>{const {transposeXML,parseXML}=await import('./music.js');return [-1,1,5].map(n=>parseXML(transposeXML(xml,n)).querySelector('pitch step').textContent);},xml);assert.equal(shifts.length,3);
 if(engine==='chromium'){
  await p.locator('#import-save').click();await p.locator('#music-import').waitFor({state:'hidden'});await p.reload();await p.waitForFunction(()=>window.prototype?.navigation);
  const record=await p.evaluate(async()=>(await (await import('./local-music-store.js')).localRecords())[0]);assert.equal(record.metadata.originalFilename,'fixture.mxl');assert.equal(record.xml,xml);
 }
 console.log(`${engine}: unrestricted input, invalid-file rejection, PDF/XML/MXL preview and transposition PASS${engine==='chromium'?'; saved MXL reload PASS':'; storage not retested (known host Blob limitation)'}`);
 }finally{await browser.close();}
}}finally{server.close();}
