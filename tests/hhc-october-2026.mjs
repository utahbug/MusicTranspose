import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import {createRequire} from 'node:module';
import {execFileSync} from 'node:child_process';
import {songs} from '../songs.js';
import {linkedSongs,unavailableSongs} from '../unavailable-songs.js';
import {canOpenScore,canListSong} from '../score-availability.js';
import {matchesSource} from '../library-query.js';
import {createSongSearch} from '../library-search.js';
const expected=[1073,1074,1075,1076,1077,1078,1211,1212],search=createSongSearch();
assert.deepEqual(linkedSongs.map(s=>Number(s.songNumber)),expected);
assert.equal(new Set(songs.map(s=>s.id)).size,songs.length);
assert.equal(songs.filter(s=>matchesSource(s,'home-church')).length,89);
for(const s of linkedSongs){
 assert.equal(songs.filter(x=>x.id===s.id).length,1);
 assert(!canOpenScore(s)&&canListSong(s));assert(!s.asset&&!s.pdfAsset);
 assert(matchesSource(s,'home-church')&&matchesSource(s,'all')&&!matchesSource(s,'my-music'));
 assert(search.match(s,s.title,['title']).matched);assert(search.match(s,s.page,['page']).pageMatch);
 assert.equal(new URL(s.officialUrl).hostname,'www.churchofjesuschrist.org');
 assert(!fs.readFileSync('offline-catalog.json','utf8').includes(s.id));
}
assert.equal(unavailableSongs.length,6);
for(const file of ['imported-songs.js','offline-catalog.json','offline-pdfs.json','offline-scores.json','assets/lyrics.json','manifest.webmanifest'])assert.equal(fs.readFileSync(file,'utf8').replaceAll('\r\n','\n'),execFileSync('git',['show','9dec6ac:'+file],{encoding:'utf8',maxBuffer:20e6}).replaceAll('\r\n','\n'),file+' unchanged');
const root=process.cwd(),server=http.createServer((req,res)=>{
 const name=path.resolve(root,'.'+decodeURIComponent(new URL(req.url,'http://localhost').pathname));
 if(!name.startsWith(root+path.sep)&&name!==root){res.writeHead(403).end();return;}
 const file=name===root?path.join(root,'index.html'):name;
 try{res.setHeader('Content-Type',({'.js':'text/javascript','.css':'text/css','.html':'text/html','.json':'application/json','.svg':'image/svg+xml'})[path.extname(file)]||'application/octet-stream');res.end(fs.readFileSync(file));}catch{res.writeHead(404).end();}
});
await new Promise(r=>server.listen(0,'127.0.0.1',r));
const {chromium,webkit}=createRequire('C:/Users/kenro/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/package.json')('playwright');
try{for(const [name,engine] of [['chromium',chromium],['webkit',webkit]]){
 const browser=await engine.launch(name==='chromium'?{channel:'msedge'}:{});
 try{for(const width of [390,1440]){
 const context=await browser.newContext({viewport:{width,height:900},serviceWorkers:'block'}),page=await context.newPage(),errors=[];
 page.setDefaultTimeout(15000);page.on('pageerror',e=>errors.push(e.message));await page.goto(`http://127.0.0.1:${server.address().port}/`);
 await page.locator('[data-home-source="home-church"]').click();
 await page.locator('#official-links-heading').waitFor();
 const sections=await page.locator('#library-results').evaluate(e=>{const children=[...e.children],h=children.findIndex(x=>x.id==='official-links-heading');return {before:children.slice(0,h).filter(x=>x.dataset.song).length,after:children.slice(h+1).filter(x=>x.dataset.song).map(x=>x.dataset.song)};});
 assert.equal(sections.before,81);assert.equal(sections.after.length,8);assert(sections.after.every(id=>linkedSongs.some(s=>s.id===id)));
 for(const s of linkedSongs){
 await page.locator('#library-search').fill(s.page);await page.locator('#library-search').dispatchEvent('input');
 const row=page.locator(`#library-results [data-song="${s.id}"]`);await row.waitFor();
 assert((await row.textContent()).includes('Official source only'));
 await row.locator('.song-entry').focus();await page.keyboard.press('Enter');
 const dialog=page.locator('#score-unavailable-dialog');assert(await dialog.isVisible());
 const link=dialog.locator('a');assert.equal(await link.getAttribute('href'),s.officialUrl);assert(await link.isVisible());
 await page.keyboard.press('Tab');await page.keyboard.press('Tab');assert(await link.evaluate(e=>e===document.activeElement));
 assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
 await page.keyboard.press('Escape');await page.waitForFunction(id=>document.activeElement===document.querySelector(`#library-results [data-song="${id}"] .song-entry`),s.id);await page.waitForTimeout(100);
 }
 // Existing restricted hymn dialog must not retain the previous official link.
 await page.evaluate(async()=>{const {showUnavailableScore}=await import('./score-availability.js');const {unavailableSongs}=await import('./unavailable-songs.js');showUnavailableScore(unavailableSongs[0]);});
 assert(await page.locator('#score-official-source').isHidden());assert.equal(await page.locator('#score-unavailable-title').textContent(),'Score unavailable');
 if(process.env.HHC_PRIVATE_MXL&&width===390){
 const bytes=[...fs.readFileSync(process.env.HHC_PRIVATE_MXL)];
 const privateResult=await page.evaluate(async bytes=>{
  const {inspectFile}=await import('./local-music-validation.js'),{addRecord,localRecord}=await import('./local-music-store.js');
  const host=document.createElement('div');host.style.width='800px';document.body.append(host);
  try{
   const record=await inspectFile(new File([new Uint8Array(bytes)],'private-review.mxl'),host);
   let storageError;try{await addRecord(record);}catch(error){if(error.name!=='UnknownError'||!error.message.includes('Blob/File'))throw error;storageError=error.message;}const stored=storageError?record:await localRecord(record.metadata.id);
   const same=JSON.stringify([...new Uint8Array(await stored.file.arrayBuffer())])===JSON.stringify(bytes);
   const {parseXML,transposeXML}=await import('./music.js');const doc=parseXML(record.xml);
   if(record.metadata.transpositionAvailable)for(const step of [-1,1]){
    const shifted=parseXML(transposeXML(record.xml,step));
    const pitches=d=>[...d.querySelectorAll('note > pitch')].map(p=>12*(Number(p.querySelector('octave').textContent)+1)+({C:0,D:2,E:4,F:5,G:7,A:9,B:11})[p.querySelector('step').textContent]+Number(p.querySelector('alter')?.textContent||0));
    const a=pitches(doc),b=pitches(shifted);if(a.length!==b.length||!a.every((v,i)=>b[i]===v+step))throw Error('Pitch integrity failed');
   }
   return {id:record.metadata.id,storageError,capability:record.metadata.capability,playback:record.metadata.playbackAvailable,parts:doc.querySelectorAll('score-partwise > part').length,measureElements:doc.querySelectorAll('measure').length,same,warnings:record.metadata.warnings};
  }finally{host.remove();}
 },bytes);
 assert(privateResult.same);if(name==='chromium')assert(!privateResult.storageError);await page.reload();
 if(!privateResult.storageError)assert(await page.evaluate(async id=>!!await(await import('./local-music-store.js')).localRecord(id),privateResult.id));
 console.log(name+' private import: '+JSON.stringify({...privateResult,id:undefined}));
 }
 assert.deepEqual(errors,[]);await context.close();console.log(`PASS ${name} ${width}: eight linked entries, dialog, keyboard/focus, no overflow, existing notices`);
 }}finally{await browser.close();}
}}finally{await new Promise(r=>server.close(r));}
console.log('PASS 89 HH&C catalog identities; eight metadata-only additions; original assets/manifests unchanged');


