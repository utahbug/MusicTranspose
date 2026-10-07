import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {execFileSync} from 'node:child_process';
import fs from 'node:fs';
const baseline=execFileSync('git',['show','6513c6d:index.html'],{encoding:'utf8'}),current=fs.readFileSync('index.html','utf8');
const about=s=>s.match(/<dialog id="about-dialog"[\s\S]*?<\/dialog>/)[0];assert.equal(about(current).replace(/\r/g,''),about(baseline).replace(/\r/g,''),'About legal wording/markup unchanged');
const {chromium}=createRequire('C:/Users/kenro/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/package.json')('playwright');const b=await chromium.launch({channel:'msedge'});
try{
 for(const width of [390,820,1440]){
  const c=await b.newContext({viewport:{width,height:1000},serviceWorkers:'block'}),p=await c.newPage();await p.goto('http://127.0.0.1:8780/');await p.waitForFunction(()=>window.prototype?.navigation);
  const cards=p.locator('#library-home nav>button'),count=await cards.count();assert.equal(count,6);
  const shape=await cards.evaluateAll(es=>es.map(e=>{const s=getComputedStyle(e),r=e.getBoundingClientRect();return {top:r.top,bottom:r.bottom,height:r.height,radius:parseFloat(s.borderRadius),border:s.borderTopWidth,shadow:s.boxShadow};}));
  for(let i=0;i<count;i++){assert(shape[i].height>=68);assert(shape[i].radius>=10);assert.equal(shape[i].border,'1px');assert.notEqual(shape[i].shadow,'none');if(i)assert(shape[i].top-shape[i-1].bottom>=6);}
  const first=cards.first();await first.focus();assert.equal(await first.evaluate(e=>getComputedStyle(e).outlineStyle),'solid');await first.hover();await p.mouse.down();assert(await first.evaluate(e=>e.matches(':active')));await p.mouse.move(1,1);await p.mouse.up();
  for(let i=0;i<count;i++){
   await p.goto('http://127.0.0.1:8780/');await p.waitForFunction(()=>window.prototype?.navigation);const card=p.locator('#library-home nav>button').nth(i),source=await card.getAttribute('data-home-source'),id=await card.getAttribute('id');await card.click();
   await p.locator(source?'#library':id==='home-lists'?'#lists-view':id==='home-files'?'#files-view':'#texts-view').waitFor({state:'visible'});
  }
  console.log('PASS Home cards, all destinations, focus/pressed states',width);await c.close();
 }
 const c=await b.newContext({viewport:{width:820,height:1180},serviceWorkers:'block'}),p=await c.newPage(),errors=[];p.on('pageerror',e=>errors.push(e.message));await p.goto('http://127.0.0.1:8780/');await p.waitForFunction(()=>window.prototype?.navigation);
 const ready=()=>p.waitForFunction(()=>prototype.ready&&!prototype.busy&&!prototype.loading&&document.querySelector('#score').getAttribute('aria-busy')==='false');
 const open=async id=>{await p.evaluate(id=>prototype.loadSong(id),id);await ready();assert(await p.locator('#score .pdf-page-frame').count());};
 const chords=p.locator('#score-size-options [data-size=auto]');
 for(const id of ['nativity','hhc-1035']){
  await open(id);await p.locator('#score-size').click();assert(await chords.isHidden());await p.keyboard.press('Escape');
  // Verify chord symbols in each actual PDF, not only the collection name.
  const tokens=await p.evaluate(async id=>{const song=(await import('./catalog.js')).songs.find(s=>s.id===id),doc=await pdfjsLib.getDocument(song.pdfAsset).promise;try{return (await (await doc.getPage(1)).getTextContent()).items.map(x=>x.str).filter(s=>/^[A-G](?:[#♯b♭])?(?:m|maj|min|dim|sus|aug|add)?[0-9]*(?:\/[A-G][#♯b♭]?)?$/.test(s.trim()));}finally{await doc.destroy();}},id);assert(tokens.length>=3,'actual PDF includes source chord symbols');console.log('PASS source PDF chords',id,tokens.slice(0,8));
  await p.locator('#key').click();await p.locator('#key-dialog [data-shift="0"]').click();await ready();assert.equal(await p.locator('#score .pdf-page-frame').count(),0);assert.equal(await p.evaluate(()=>prototype.current),0);assert(await chords.isEnabled(),'structured score chord action preserved');
  await p.locator('#score-size').click();await p.locator('#score-size-options [data-size=pdf]').click();await ready();await p.locator('#key').click();await p.locator('#key-dialog [data-shift="1"]').click();await ready();assert.equal(await p.evaluate(()=>prototype.current),1);assert.equal(await p.locator('#score .pdf-page-frame').count(),0);
 }
 await open('song-a13c43da-0243-4019-ad08-d7be530074f5');await p.locator('#score-size').click();assert(await chords.isVisible());assert(await chords.isEnabled());await chords.click();await ready();assert.equal(await p.locator('#score .pdf-page-frame').count(),0);assert(await p.evaluate(()=>prototype.original.includes('mt-generated-')));
 await open('choose-to-serve-the-lord');assert(await p.locator('#key').isDisabled());assert(await chords.isDisabled());assert(await p.locator('#score-size-options [data-size=large]').isDisabled());assert.deepEqual(errors,[]);console.log('PASS source/other Key transitions, generated-chord action and PDF-only capability boundaries');await c.close();
}finally{await b.close();}
