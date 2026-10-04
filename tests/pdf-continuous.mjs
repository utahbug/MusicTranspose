import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {createRequire} from 'node:module';
const {chromium,webkit}=createRequire(process.env.PLAYWRIGHT_PACKAGE||'C:/Users/kenro/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/package.json')('playwright');
const engine=process.env.PDF_FLOW_ENGINE||'chromium',browser=await ({chromium,webkit}[engine]).launch(engine==='chromium'?{channel:'msedge'}:{}),base=process.env.TEST_URL||'http://127.0.0.1:8780/';
await fs.mkdir('test-results/pdf-continuous',{recursive:true});const results=[];
const ready=p=>p.waitForFunction(()=>window.prototype?.ready&&!prototype.busy&&!prototype.loading&&document.querySelector('#score').getAttribute('aria-busy')==='false');
const load=async(p,id)=>{await p.evaluate(id=>prototype.loadSong(id),id);await ready(p);};
const mode=async(p,name)=>{await p.locator('#score-navigation-button').click();await p.locator(`[data-navigation=${name}]`).click();if(name==='auto'){await p.locator('[data-navigation=auto]').focus();await p.keyboard.press('Escape');}};
const geometry=p=>p.locator('#score>.pdf-page-frame').evaluateAll(es=>es.map(e=>({bounds:JSON.parse(e.dataset.trim),flow:JSON.parse(e.dataset.continuousBounds||'null'),width:e.getBoundingClientRect().width,height:e.getBoundingClientRect().height,margin:parseFloat(getComputedStyle(e).marginBottom)})));
const hashes=p=>p.locator('#score canvas.pdf-page').evaluateAll(async es=>Promise.all(es.map(async e=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',e.getContext('2d').getImageData(0,0,e.width,e.height).data))).join(','))));
try{
 // Independent raster/text fixtures exercise conservative acceptance and rejection.
 const unit=await browser.newPage();await unit.goto(base);
 const checks=await unit.evaluate(async()=>{const {continuousAnalysis}=await import('./pdf-continuous.js');const make=(lines,extra=false)=>{const c=document.createElement('canvas');c.width=600;c.height=800;const g=c.getContext('2d');g.fillStyle='white';g.fillRect(0,0,600,800);g.fillStyle='black';g.fillRect(50,100,500,1);g.fillRect(50,300,500,1);g.font='12px Arial';const items=lines.map((str,i)=>{const y=650+i*18;g.fillText(str,60,y);return {str,transform:[12,0,0,12,60,800-y],width:g.measureText(str).width}});if(extra)g.fillRect(30,710,540,1);return continuousAnalysis(c,{items},{scale:1,transform:[1,0,0,-1,0,800]});};return {
 legal:make(['© 2025 Test Publisher','All rights reserved.','This song may be copied for noncommercial use.','This notice must be included.']),
 uncertain:make(['Permission to sing with joy']),credits:make(['Music: Example composer. © 2025 Test']),
 later:make(['© 2025 Test Publisher'],true),unrelated:make(['© 2025 Test Publisher','Repeat the chorus softly.']),
 sparse:make([]),missing:make(['© 2025 Test Publisher','Unrecognized continuation'])};});
 assert(checks.legal.footer);for(const key of ['uncertain','credits','later','unrelated','missing'])assert.equal(checks[key].footer,null,key);assert(checks.sparse.bottom<320&&checks.sparse.top>90);await unit.close();console.log('PASS conservative detection, later music, credits, uncertain/missing text, sparse page');
 for(const width of [390,430,820,1024,1440]){
  const height=width===390?844:width===430?932:1180,c=await browser.newContext({viewport:{width,height},serviceWorkers:'block'}),p=await c.newPage(),errors=[];p.on('pageerror',e=>errors.push(e.message));
  await c.addInitScript(()=>localStorage.setItem('music-transpose-navigation-v2',JSON.stringify({mode:'pages',explicit:true})));
  await p.goto(base);await p.waitForFunction(()=>window.prototype?.navigation);
  await load(p,'cs-2');const authored=await geometry(p),before=await hashes(p);
  await mode(p,'continuous');const compact=await geometry(p);assert.equal(compact.length,2);assert.equal(await p.locator('.pdf-footer-segment').count(),0,'source notes stay in place');assert(compact[0].height<authored[0].height||compact[0].bounds.bottom<authored[0].bounds.bottom);assert(compact.every(f=>f.margin===12));
  const scale=compact[0].width/(compact[0].bounds.right-compact[0].bounds.left),oldGap=((authored[0].bounds.bottom-compact[0].flow.bottom)+(compact[1].flow.top-authored[1].bounds.top)+30)*scale+10,newGap=30*scale+12;
  if(width<=430)assert(newGap>=12&&newGap<=24);
  await p.screenshot({path:`test-results/pdf-continuous/cs-2-${width}.png`,fullPage:true});
  await mode(p,'auto');assert.deepEqual(await geometry(p),compact);await p.locator('#score-navigation-button').click();await p.locator('#auto-toggle').click();await p.waitForTimeout(500);assert.equal(await p.locator('#auto-toggle').getAttribute('aria-pressed'),'true');assert(await p.evaluate(()=>scrollY>0));await p.locator('#score').dispatchEvent('wheel',{deltaY:10});assert.equal(await p.locator('#auto-toggle').getAttribute('aria-pressed'),'false');
  await mode(p,'pages');assert.deepEqual(await geometry(p),authored);assert.match(await p.locator('#score-navigation-label').textContent(),/1 \/ 2/);await mode(p,'continuous');assert.deepEqual(await geometry(p),compact);
  await p.locator('#score-tools').click();await p.locator('#score-annotate').click();await p.waitForTimeout(100);assert.deepEqual((await geometry(p)).map(g=>g.bounds),authored.map(g=>g.bounds));assert(await p.locator('.pdf-annotation-canvas').first().evaluate(e=>{const a=e.getBoundingClientRect(),b=e.parentElement.querySelector('.pdf-page').getBoundingClientRect();return ['x','y','width','height'].every(k=>Math.abs(a[k]-b[k])<.5)}));await p.locator('#pdf-annotation-done').click();assert.deepEqual(await geometry(p),compact);assert.deepEqual(await hashes(p),before);
  results.push({width,id:'cs-2',oldGap,newGap,authored,compact});
  await load(p,'choose-to-serve-the-lord');const footer=p.locator('.pdf-footer-segment');assert.equal(await footer.count(),1);assert.equal(await footer.getAttribute('data-source-page'),'1');assert(await footer.evaluate(e=>e===e.parentElement.lastElementChild));
  assert(await footer.evaluate(e=>{const src=document.querySelector('canvas.pdf-page'),f=JSON.parse(src.parentElement.dataset.continuousBounds).footer,a=src.getContext('2d').getImageData(0,f.top,src.width,e.height).data,b=e.getContext('2d').getImageData(0,0,e.width,e.height).data;return a.every((v,i)=>v===b[i])}),'exact source footer pixels');
  await p.evaluate(()=>document.querySelector('.score-paper').classList.add('score-page-dark'));assert.match(await footer.evaluate(e=>getComputedStyle(e).filter),/invert/);await p.screenshot({path:`test-results/pdf-continuous/footer-dark-${width}.png`,fullPage:true});await p.evaluate(()=>document.querySelector('.score-paper').classList.remove('score-page-dark'));
  await p.evaluate(()=>prototype.preparePrint());assert.equal(await p.locator('#print-pages img').count(),5);assert(await p.evaluate(()=>[...document.querySelectorAll('#print-pages img')].every((e,i)=>e.src===document.querySelectorAll('#score canvas.pdf-page')[i].toDataURL('image/png'))));
  assert(await p.evaluate(async()=>{const {originalPdfData}=await import('./pdf-score.js'),asset='./assets/pdfs/choose-to-serve-the-lord.pdf',a=await originalPdfData(new URL(asset,location.href).href),b=new Uint8Array(await(await fetch(asset)).arrayBuffer());return a.length===b.length&&a.every((v,i)=>v===b[i])}));
  const flow=await geometry(p);await p.locator('#score-tools').click();await p.locator('#score-annotate').click();assert(await footer.isHidden());await p.locator('#pdf-annotation-done').click();assert(await footer.isVisible());assert.deepEqual(await geometry(p),flow);await mode(p,'pages');assert(await footer.isHidden());await mode(p,'continuous');assert(await footer.isVisible());assert.deepEqual(await geometry(p),flow);
  for(const id of ['hhc-1002','silent-night']){await load(p,id);assert.equal(await p.locator('.pdf-footer-segment').count(),0);const g=await geometry(p);assert.equal(g.length,id==='silent-night'?1:2);assert(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));}
  assert.deepEqual(errors,[]);await c.close();console.log('PASS',engine,width,'mode restoration, auto-scroll, annotation, footer pixels, print/export, dark, one/multi-page');
 }
 // Compare Page Turns against pre-change production code, not just round trips.
 const baseline=await browser.newContext({viewport:{width:390,height:844},serviceWorkers:'block'}),bp=await baseline.newPage();await baseline.addInitScript(()=>localStorage.setItem('music-transpose-navigation-v2',JSON.stringify({mode:'pages',explicit:true})));
 for(const file of ['pdf-score.js','navigation.js','styles.css'])await bp.route('**/'+file,r=>r.fulfill({body:execFileSync('git',['show','bc92f96:'+file],{encoding:'utf8'}),contentType:file.endsWith('.css')?'text/css':'text/javascript'}));
 await bp.goto(base);await bp.waitForFunction(()=>window.prototype?.navigation);await load(bp,'cs-2');assert.deepEqual((await geometry(bp)).map(({flow,...g})=>g),results[0].authored.map(({flow,...g})=>g));await baseline.close();console.log('PASS authored Page Turns matches deployed baseline');
 if(engine==='chromium'){
  const c=await browser.newContext({viewport:{width:390,height:844}}),p=await c.newPage();await p.goto(base);await p.waitForFunction(()=>navigator.serviceWorker.controller&&window.prototype?.navigation);
  const saved=await p.evaluate(async()=>{const {songs}=await import('./catalog.js');return(await import('./offline-manager.js')).saveOfflineSong(songs.find(s=>s.id==='cs-2'))});assert(saved.songs['cs-2'].saved);
  await p.evaluate(async()=>{const file=await(await fetch('./assets/pdfs/fallback/cs-2.pdf')).blob();await(await import('./local-music-store.js')).addRecord({metadata:{id:'local-flow-test',hash:'local-flow-test',title:'Local PDF',originalFilename:'local.pdf',scoreType:'pdf'},file});for(const n of await caches.keys())if(n.startsWith('music-transpose-scores-'))await caches.delete(n)});
  await c.setOffline(true);await p.reload();await p.waitForFunction(()=>window.prototype?.navigation);await load(p,'cs-2');const offline=await geometry(p);assert.deepEqual(offline.map(g=>g.flow),results[0].compact.map(g=>g.flow));await load(p,'local-flow-test');assert.deepEqual((await geometry(p)).map(g=>g.flow),offline.map(g=>g.flow));await c.close();console.log('PASS cold network-disabled explicit-saved PDF and IndexedDB imported PDF');
 }
 await fs.writeFile(`test-results/pdf-continuous/results-${engine}.json`,JSON.stringify(results,null,2));
}finally{await browser.close()}
