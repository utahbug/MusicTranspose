import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {createRequire} from 'node:module';
import {songs} from '../songs.js';
const id='hhc-1004',baseline='833e96a',file='assets/lyrics.json';
const data=JSON.parse(fs.readFileSync(file,'utf8')),before=JSON.parse(execFileSync('git',['show',baseline+':'+file],{encoding:'utf8',maxBuffer:8e6}));
const record=data.songs.find(s=>s.id===id),old=before.songs.find(s=>s.id===id);
assert.deepEqual(data.songs.filter(s=>s.id!==id),before.songs.filter(s=>s.id!==id),'all other lyric records unchanged');
assert.deepEqual(record.verses,old.verses,'all verse words and order preserved');
assert.deepEqual(record.verses.map(v=>v.number),['1','2','3']);
assert.equal(record.refrains.length,1);assert.equal(record.refrains[0].label,'Chorus');
assert.equal(record.refrains[0].text+' me.',old.refrains[0].text,'only duplicate ending word removed');
for(const file of ['assets/scores/hhc-1004.mxl','assets/pdfs/fallback/hhc-1004.pdf'])assert.deepEqual(fs.readFileSync(file),execFileSync('git',['show',baseline+':'+file],{maxBuffer:8e6}),'notation and renderer unchanged: '+file);
// Re-extract only this record in an isolated directory; no bulk refresh.
const temp=fs.mkdtempSync(path.join(os.tmpdir(),'hhc-1004-'));
try{
 fs.mkdirSync(path.join(temp,'assets/scores'),{recursive:true});
 fs.copyFileSync('assets/scores/hhc-1004.mxl',path.join(temp,'assets/scores/hhc-1004.mxl'));
 fs.copyFileSync(file,path.join(temp,file));
 fs.writeFileSync(path.join(temp,'catalog.json'),JSON.stringify(songs.filter(s=>s.id===id)));
 execFileSync(process.env.PYTHON||'C:/Users/kenro/.cache/codex-runtimes/codex-primary-runtime/dependencies/python/python.exe',[path.resolve('tools/extract-lyrics.py'),'catalog.json',id],{cwd:temp});
 assert.deepEqual(JSON.parse(fs.readFileSync(path.join(temp,file),'utf8')),data,'targeted extraction is reproducible');
}finally{fs.rmSync(temp,{recursive:true,force:true});}
console.log('PASS source-guarded targeted extraction, exact word preservation, other records and notation unchanged');
const {chromium}=createRequire('C:/Users/kenro/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/package.json')('playwright');
const browser=await chromium.launch({channel:'msedge'});
try{for(const width of [390,820,1440]){
 const context=await browser.newContext({viewport:{width,height:1000},serviceWorkers:'block',hasTouch:width<1000,...(width<1000?{isMobile:true,userAgent:width===390?'iPhone':'iPad'}:{})});
 const p=await context.newPage();p.setDefaultTimeout(45000);await p.goto(process.env.APP_URL||'http://127.0.0.1:8780/');await p.waitForFunction(()=>window.prototype?.openLyrics);
 await p.evaluate(id=>prototype.loadSong(id),id);const ready=()=>p.waitForFunction(()=>prototype.ready&&!prototype.busy&&!prototype.loading);await ready();
 const geometry=()=>p.locator('.masthead').boundingBox();const footer=await geometry();
 const verify=async()=>{
  await p.locator('#lyrics-view').waitFor({state:'visible'});
  assert.deepEqual(await p.locator('.lyrics-body>section>h2').allTextContents(),['Verse 1','Verse 2','Verse 3']);
  assert.equal(await p.locator('.lyrics-chorus').count(),3);assert.equal(await p.locator('.lyrics-notice,.lyrics-refrain').count(),0);
  assert(!await p.locator('.lyrics-body').textContent().then(t=>t.includes('Shared ending')||t.includes('me. me.')));
  for(let i=0;i<3;i++){
   const section=p.locator('.lyrics-body>section').nth(i);assert.equal(await section.locator(':scope > p').textContent(),record.verses[i].text);
   assert.equal(await section.locator('details p').textContent(),record.refrains[0].text);
   assert.equal(await section.locator('summary').getAttribute('aria-label'),'Chorus after verse '+(i+1));
  }
  assert(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
  for(const r of await p.locator('.lyrics-footer button:visible').evaluateAll(es=>es.map(e=>{const r=e.getBoundingClientRect();return{x:r.x,right:r.right,bottom:r.bottom,h:r.height};})))assert(r.x>=0&&r.right<=width&&r.bottom<=1001&&r.h>=40);
 };
 await p.locator('#show-lyrics').click();await verify();
 const details=p.locator('.lyrics-chorus');assert.equal(await p.locator('.lyrics-chorus[open]').count(),0);
 for(let i=0;i<3;i++){await details.nth(i).locator('summary').click();assert.equal(await p.locator('.lyrics-chorus[open]').count(),i+1);}
 await details.nth(1).locator('summary').click();assert.deepEqual(await details.evaluateAll(es=>es.map(e=>e.open)),[true,false,true]);
 await p.locator('#lyrics-settings').click();await p.locator('#lyrics-font-size').click();await p.getByRole('menuitemradio',{name:'Large',exact:true}).click();await p.keyboard.press('Escape');await verify();
 await p.locator('.lyrics-score-toggle').click();await ready();assert(await p.locator('#lyrics-view').isHidden());assert.equal(await p.evaluate(()=>prototype.song),id);
 const after=await geometry();for(const k of ['x','y','width','height'])assert(Math.abs(footer[k]-after[k])<1,'Score footer unchanged: '+k);
 await p.locator('#show-lyrics').click();await verify();
 await p.evaluate(()=>prototype.openLyrics('nativity'));await p.waitForFunction(()=>document.querySelector('.lyrics-identity-header h1')?.textContent!=='I Will Walk with Jesus');
 await p.evaluate(id=>prototype.openLyrics(id),id);await verify();
 await p.locator('#songs').click();await p.locator('#library-home').waitFor({state:'visible'});
 console.log('PASS #1004 independent Chorus links, rerender, song switch, Score/Lyrics/footer/Library and responsive layout',width);await context.close();
}}finally{await browser.close();}
