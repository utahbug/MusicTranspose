import {createRequire} from 'node:module';import assert from 'node:assert/strict';import fs from 'node:fs';
const {chromium}=createRequire(process.env.PLAYWRIGHT_PACKAGE)('playwright'),browser=await chromium.launch({channel:'msedge',headless:true}),p=await browser.newPage(),errors=[];p.on('pageerror',e=>errors.push(e.message));
const baseline=process.env.LEAD_BASELINE==='1',tag=baseline?'before':'after',rows=[],base=process.env.TEST_URL||'http://127.0.0.1:8771/';
const ready=async()=>{await p.waitForFunction(()=>prototype.ready&&!prototype.busy&&document.querySelector('#score').getAttribute('aria-busy')==='false');await p.waitForTimeout(100);};
const view=async size=>{await p.locator('#score-size').click();await p.locator(`#score-size-options [data-size=${size}]`).click();await ready();};
try{await p.goto(base);await p.locator('.library-row').first().waitFor();await p.evaluate(()=>document.addEventListener('score-engraved',e=>window.layout=e.detail.systems));
 const ids=['hhc-1054','cs-168','song-971fd988-d7e9-4e39-8c02-47840e323bf6','song-837fac47-1f80-4e50-beef-a38f8622d634'];
 for(const [width,height] of [[320,568],[390,844],[844,390],[820,1180],[1440,1000]]){await p.setViewportSize({width,height});
 for(const id of (width===390?ids:[ids[0]])){
  await p.evaluate(id=>prototype.loadSong(id,'normal'),id);await ready();await view('normal');
  const states={};for(const mode of ['normal','large']){if(mode==='large')await view(mode);
   const row=await p.evaluate(async()=>{const {virtualFrames}=await import('./virtual-pages.js'),s=document.querySelector('#score'),svg=s.querySelector('svg'),scale=Number(s.dataset.zoom),units=scale*10;const systems=window.layout;const r=svg.getBoundingClientRect(),actualScale=r.width/svg.viewBox.baseVal.width,bottom=document.querySelector('.masthead').getBoundingClientRect().top;const visible=systems.filter(s=>r.top+s.top*actualScale>=-1&&r.top+s.bottom*actualScale<=bottom).length;return {visible,systems:systems.length,measures:systems.map(s=>s.end-s.start+1),inkHeights:systems.map(s=>(s.bottom-s.top)*scale),gaps:systems.slice(1).map((s,i)=>(s.top-systems[i].bottom)*scale),height:(systems.at(-1).bottom-systems[0].top)*scale,frames:virtualFrames().map(f=>Number(f.dataset.systems)),width:s.clientWidth,zoom:scale,xml:prototype.viewXML,svg:svg.outerHTML,overflow:document.documentElement.scrollWidth>innerWidth};});
   states[mode]=row;assert(!row.overflow);assert(await p.locator('#score svg').count());await p.screenshot({path:`test-results/lead-layout-${tag}-${id}-${width}-${mode}.png`});
  }
  if(!baseline){await view('normal');assert.equal(await p.evaluate(()=>prototype.viewXML),states.normal.xml);assert.equal(await p.locator('#score svg').first().evaluate(e=>e.outerHTML),states.normal.svg,'Score engraving restored exactly');}
  rows.push({id,width,height,...Object.fromEntries(Object.entries(states).map(([k,{xml,svg,...v}])=>[k,v]))});
 }
 }
 fs.writeFileSync(`test-results/lead-layout-${tag}.json`,JSON.stringify(rows,null,2));assert.deepEqual(errors,[]);console.log(JSON.stringify(rows));
}finally{await browser.close();}
