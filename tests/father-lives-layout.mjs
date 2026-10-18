import fs from 'node:fs/promises';import assert from 'node:assert/strict';import {createRequire} from 'node:module';
import {execFileSync} from 'node:child_process';
const pw=createRequire(process.env.PLAYWRIGHT_PACKAGE||'C:/Users/kenro/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/package.json')('playwright');
const phase=process.env.PHASE||'before',engine=process.env.ENGINE||'chromium',out=`test-results/father-lives/${phase}-${engine}`;await fs.mkdir(out,{recursive:true});
const ids=(process.env.IDS||'song-2a184969-eb57-4901-9829-48c3952bfda3,song-094d3a6c-43e1-497f-80c3-24cb36f444de').split(','),rows=[];
const b=await pw[engine].launch(engine==='chromium'?{channel:'msedge'}:{});
try{for(const [width,height] of JSON.parse(process.env.SIZES||'[[390,844],[744,1133],[820,1180],[1194,834],[1440,900]]')){
const c=await b.newContext({viewport:{width,height},hasTouch:width<1440,serviceWorkers:'block'}),p=await c.newPage();p.setDefaultTimeout(90000);
if(process.env.BASELINE)for(const file of ['app.js','lead-view.js','score-page-hints.js'])await p.route('**/'+file,r=>r.fulfill({contentType:'application/javascript',body:execFileSync('git',['show','a3d674c:'+file],{encoding:'utf8'})}));
await p.addInitScript(()=>{localStorage.setItem('music-transpose-navigation-v2',JSON.stringify({mode:'pages',explicit:true}));document.addEventListener('score-engraved',e=>window.layoutSystems=e.detail.systems);});
await p.goto(process.env.TEST_URL||'http://127.0.0.1:8781/');await p.waitForFunction(()=>window.prototype?.navigation);
const ready=()=>p.waitForFunction(()=>prototype.ready&&!prototype.busy&&!prototype.loading&&document.querySelector('#score').getAttribute('aria-busy')==='false');
for(const id of ids){await p.evaluate(id=>prototype.loadSong(id),id);await ready();for(const mode of ['pdf','auto','large']){if(mode==='auto'){await p.evaluate(()=>prototype.changeKey(0));await ready();}else{await p.locator('#score-size').click();await p.locator(`#score-size-options [data-size=${mode}]`).click();await ready();}
const data=await p.evaluate(()=>{const s=document.querySelector('#score');return {zoom:s.dataset.zoom,report:s.autoReport,systems:window.layoutSystems,pages:[...s.querySelectorAll('.mxl-page-frame')].map(f=>f._view.page),pdfPages:s.querySelectorAll('.pdf-page-frame').length,lead:prototype.lead,xml:prototype.xml,viewXML:prototype.viewXML,overflow:document.documentElement.scrollWidth>innerWidth};});
assert(!data.overflow);rows.push({id,width,height,mode,...data});console.log(engine,phase,width,id.slice(0,13),mode,mode==='pdf'?data.pdfPages:data.pages.length,'systems',data.systems?.length,'zoom',data.zoom);
await p.screenshot({path:`${out}/${id}-${width}-${mode}.png`});}
}await c.close();await fs.writeFile(`${out}/results.json`,JSON.stringify(rows,null,2));}}finally{await b.close();}
