import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {createRequire} from 'node:module';
const pw=createRequire(process.env.PLAYWRIGHT_PACKAGE||'C:/Users/kenro/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/package.json')('playwright');
const out=process.env.OUT||'test-results/sacred-grove';await fs.mkdir(out,{recursive:true});
for(const engine of ['chromium','webkit']){
 const b=await pw[engine].launch(engine==='chromium'?{channel:'msedge'}:{});
 try{for(const [width,height] of [[320,812],[375,812],[390,812],[744,1180],[820,1180],[1194,900],[1440,900]]){
  const c=await b.newContext({viewport:{width,height},hasTouch:width<1440,serviceWorkers:'block'}),p=await c.newPage();p.setDefaultTimeout(90000);
  await p.addInitScript(()=>{localStorage.setItem('music-transpose-navigation-v2',JSON.stringify({mode:'continuous',explicit:true}));document.addEventListener('score-engraved',e=>window.testSystems=e.detail.systems);});
  await p.goto(process.env.TEST_URL||'http://127.0.0.1:8782/');await p.waitForFunction(()=>window.prototype?.navigation);
  const ready=()=>p.waitForFunction(()=>prototype.ready&&!prototype.busy&&!prototype.loading&&document.querySelector('#score').getAttribute('aria-busy')==='false');
  await p.evaluate(()=>prototype.loadSong('song-d6b88fae-5fc8-4287-b81b-fda387feae71','large'));await ready();
  const data=await p.evaluate(async()=>{
   const {assessLayout}=await import('./auto-layout.js'),{availableScoreHeight}=await import('./virtual-pages.js'),host=document.querySelector('#score');
   return {systems:testSystems,xml:prototype.viewXML,height:host.getBoundingClientRect().height,quality:assessLayout(host,testSystems,host.clientWidth,availableScoreHeight(host),Number(host.dataset.zoom),{minimumLyric:11}),overflow:document.documentElement.scrollWidth>innerWidth};
  });
  assert(!data.overflow);assert.equal(data.quality.collisions,0);assert.equal(data.quality.clipping,0);assert(data.quality.minLyric>=11);
  assert.equal(data.systems[0].start,0);assert(data.systems[0].end>=1,'pickup stays with opening music');assert.equal(data.systems.at(-1).end,13);
  if(width===375||width===390){assert(data.systems.length<=7);assert(data.height<800);}
  if(width===320)assert(data.systems.length<=10);
  await p.locator('#score-navigation-button').click();await p.locator('[data-navigation=pages]').click();
  data.pages=await p.locator('.mxl-page-frame').count();assert(data.pages>0);await p.keyboard.press('End');assert.equal(await p.locator('.mxl-page-frame.current-page').getAttribute('data-end'),'13');await p.keyboard.press('Home');assert.equal(await p.locator('.mxl-page-frame.current-page').getAttribute('data-start'),'0');
  await p.locator('#score-navigation-button').click();await p.locator('[data-navigation=continuous]').click();
  if(width===375){
   for(const shift of [2,-2,0]){await p.evaluate(n=>prototype.changeKey(n),shift);await ready();assert.equal(await p.evaluate(()=>prototype.current),shift);}
   assert.equal(await p.evaluate(()=>prototype.viewXML),data.xml,'reset restores complete Melody XML');
   const download=p.waitForEvent('download');await p.locator('#score-export-xml').evaluate(e=>e.click());const file=await download;await file.saveAs(`${out}/${engine}-melody.musicxml`);assert.equal(await fs.readFile(`${out}/${engine}-melody.musicxml`,'utf8'),data.xml);
  }
  await p.screenshot({path:`${out}/${engine}-${width}.png`,fullPage:true});await fs.writeFile(`${out}/${engine}-${width}.json`,JSON.stringify(data,null,2));
  await p.locator('#score-size').click();await p.locator('#score-size-options [data-size=pdf]').click();await ready();assert.equal(await p.locator('.pdf-page-frame').count(),1,'Original remains one page');
  console.log('PASS',engine,width,'systems',data.systems.length,'height',data.height.toFixed(1),'pages',data.pages,'lyrics',data.quality.minLyric.toFixed(1));await c.close();
 }}finally{await b.close();}
}
