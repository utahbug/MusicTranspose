import {createRequire} from 'node:module';import assert from 'node:assert/strict';import fs from 'node:fs';
const {chromium}=createRequire(process.env.PLAYWRIGHT_PACKAGE)('playwright'),b=await chromium.launch({channel:'msedge',headless:true}),c=await b.newContext(),p=await c.newPage(),errors=[],results=[];p.on('pageerror',e=>errors.push(e.message));
const ready=async()=>{await p.waitForFunction(()=>prototype.ready&&!prototype.busy&&document.querySelector('#score').getAttribute('aria-busy')==='false');};
const choose=async size=>{await p.locator('#score-size').click();await p.locator(`#score-size-options [data-size=${size}]`).click();await ready();};
try{await p.addInitScript(()=>document.addEventListener('score-engraved',e=>window.testSystems=e.detail.systems));await p.goto(process.env.TEST_URL||'http://127.0.0.1:8768/');await p.locator('.library-row').first().waitFor();
for(const [width,height] of [[1180,820],[820,1180],[390,844],[1440,1000]]){
 await p.setViewportSize({width,height});await p.waitForTimeout(250);
 for(const id of ['hhc-1010','cs-236','nativity','shepherd','faithful','silent-night','cs-2','cs-110']){
  await p.evaluate(id=>prototype.loadSong(id),id);await ready();
  for(const mode of ['auto','normal','large']){await choose(mode);const result=await p.evaluate(async()=>{const {assessLayout}=await import('./auto-layout.js'),{captureSystems}=await import('./virtual-pages.js');const score=document.querySelector('#score'),svg=score.querySelector('svg');return {mode:document.querySelector('#score-size').dataset.size,zoom:Number(score.dataset.zoom),systems:Number(score.dataset.systems),report:score.autoReport,layout:assessLayout(score,window.testSystems,score.clientWidth,Math.max(80,innerHeight-(score.getBoundingClientRect().top+scrollY)-document.querySelector('.masthead').getBoundingClientRect().height-18),Number(score.dataset.zoom)),ms:prototype.metrics.at(-1).ms,overflow:document.documentElement.scrollWidth>innerWidth};});assert(!result.overflow);if(mode==='auto'){assert(result.report);assert(result.report.candidates.length<=3);assert(result.zoom>=(width<=600?.64:.68));}results.push({id,width,height,...result});if(id==='nativity')await p.screenshot({path:`test-results/most-music-${width}-${mode}.png`});}
 }
 console.log('PASS comparisons',width);
}
fs.writeFileSync('test-results/most-music-comparison.json',JSON.stringify(results,null,2));assert.deepEqual(errors,[]);console.log('AUTO CHOICES',results.filter(r=>r.mode==='auto').map(r=>({id:r.id,width:r.width,zoom:r.zoom,pages:r.report.pages,visible:r.report.visibleMeasures,collisions:r.report.collisions,min:r.report.minLyric,ms:Math.round(r.ms)})));
}finally{await b.close();}
