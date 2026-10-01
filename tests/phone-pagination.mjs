import {createRequire} from 'node:module';import fs from 'node:fs';import assert from 'node:assert/strict';
const {chromium}=createRequire(process.env.PLAYWRIGHT_PACKAGE||'C:/Users/kenro/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/package.json')('playwright');
const browser=await chromium.launch({channel:'msedge',headless:true}),rows=[],errors=[];
const baseline=process.env.PAGINATION_BASELINE?JSON.parse(fs.readFileSync(process.env.PAGINATION_BASELINE)):null;
const ids=['song-ffd5b22c-dacd-462e-9e86-5a887fc3970d','song-fa7942d7-bf4c-4b89-ad43-f3fcdec88975'];
try{for(const [width,height,touch] of [[390,844,true],[820,1180,true],[1440,1000,false]]){
 const c=await browser.newContext({viewport:{width,height},hasTouch:touch,serviceWorkers:'block'}),p=await c.newPage();p.setDefaultTimeout(60000);p.on('pageerror',e=>errors.push(e.message));
 await p.goto(process.env.TEST_URL||'http://127.0.0.1:8780/');await p.locator('[data-home-source=all]').click();await p.waitForFunction(()=>window.prototype);await p.evaluate(()=>document.addEventListener('score-engraved',e=>window.captured=e.detail));
 const ready=()=>p.waitForFunction(()=>prototype.ready&&!prototype.busy&&!document.body.classList.contains('song-loading')&&document.querySelector('#score').getAttribute('aria-busy')==='false');
 const nav=async mode=>{await p.locator('#settings').click();await p.locator(`input[name=navigation][value=${mode}]`).check();await p.locator('#apply-settings').click();};
 for(const id of ids){
  await p.evaluate(id=>prototype.loadSong(id),id);await ready();assert.equal(await p.locator('#score .pdf-page-frame').count(),1);assert.equal(await p.evaluate(async()=>{const {originalPageCount}=await import('./pdf-score.js');const {songs}=await import('./catalog.js');return originalPageCount(songs.find(s=>s.id===prototype.song).pdfAsset);}),1);
  if(id===ids[0])assert.equal(await p.locator('input[name=navigation]:checked').inputValue(),touch&&width>=600?'pages':'continuous','Existing navigation default retained (desktop currently Continuous)');
  const counts=[];
  for(const mode of ['auto','large']){
   await p.locator('#score-size').click();await p.locator(`#score-size-options [data-size=${mode}]`).click();await ready();
   const r=await p.evaluate(async()=>{const v=await import('./virtual-pages.js'),s=document.querySelector('#score');return {scoreWidth:s.clientWidth,zoom:Number(s.dataset.zoom),systems:captured.systems,report:s.autoReport,svg:s.querySelector('svg').outerHTML.replace(/vf-auto\d+/g,'vf-auto'),xml:prototype.viewXML,overflow:document.documentElement.scrollWidth>innerWidth};});
   assert(!r.overflow);if(width===390){assert(r.report.readable&&!r.report.clipping&&!r.report.collisions);assert(r.report.displayMinLyric>=11-1e-4);assert.equal(r.report.targetPages,1);}
   await nav('pages');await p.waitForFunction(()=>document.querySelector('.mxl-page-frame.current-page svg'));
   const frames=await p.locator('.mxl-page-frame').evaluateAll(items=>items.map(f=>({start:Number(f.dataset.start),end:Number(f.dataset.end),used:f._view.page.used,available:f._view.page.available,systems:Number(f.dataset.systems)})));
   counts.push(frames.length);assert.equal(frames.length,width===390&&id===ids[0]&&mode==='auto'?2:1);assert.equal(frames[0].start,0);assert.equal(frames.at(-1).end,id===ids[0]?19:7);
   frames.forEach((f,i)=>{assert(f.used<=f.available+.01,'No fit-to-height shrink below readability floor');if(i)assert.equal(f.start,frames[i-1].end+1);});
   if(width!==390){const expected=width===820?(id===ids[0]?[.702,.9,4,5]:[.78,.9,2,2]):(id===ids[0]?[.81,.9,3,4]:[.9,.9,2,1]);assert.equal(r.zoom,expected[mode==='auto'?0:1]);assert.equal(r.systems.length,expected[mode==='auto'?2:3]);}
   if(baseline){const before=baseline.find(b=>b.id===id&&b.height===height&&b.mode===mode);assert.equal(r.xml,before.xml,'Musical XML unchanged');if(width!==390){assert.deepEqual(r.systems,before.systems,'Non-phone geometry unchanged');assert.equal(r.svg,before.svg[0],'Non-phone engraving unchanged');}}
   await p.screenshot({path:`test-results/phone-pagination-${width}-${id===ids[0]?'child':'thanks'}-${mode}.png`});rows.push({width,id,mode,pages:frames.length,zoom:r.zoom,systems:r.systems.length});
   if(frames.length>1){await p.keyboard.press('PageDown');assert.equal(await p.locator('.mxl-page-frame.current-page').getAttribute('data-start'),String(frames[1].start));await p.keyboard.press('Home');}
   await nav('continuous');
  }assert(counts[1]<=counts[0],'Melody does not add pages after removing accompaniment');
 }
 await c.close();
}assert.deepEqual(errors,[]);fs.writeFileSync('test-results/phone-pagination-results.json',JSON.stringify(rows,null,2));console.log('PASS',JSON.stringify(rows));}finally{await browser.close();}
