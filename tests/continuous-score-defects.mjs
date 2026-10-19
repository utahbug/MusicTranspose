import assert from 'node:assert/strict';import fs from 'node:fs/promises';import {createRequire} from 'node:module';
const pw=createRequire('C:/Users/kenro/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/package.json')('playwright');
const engine=process.env.ENGINE||'chromium',out=process.env.OUT||'test-results/continuous-score-defects';await fs.mkdir(out,{recursive:true});
const ids=['hhc-1009','song-d6b88fae-5fc8-4287-b81b-fda387feae71'],rows=[];
const b=await pw[engine].launch(engine==='chromium'?{channel:'msedge'}:{});
try{for(const [width,height] of JSON.parse(process.env.SIZES||'[[375,812],[320,568],[390,844],[744,1133],[820,1180],[1194,834],[1440,900]]')){
 const c=await b.newContext({viewport:{width,height},hasTouch:width<1440,serviceWorkers:'block'}),p=await c.newPage();p.setDefaultTimeout(180000);
 const errors=[];p.on('pageerror',e=>errors.push(e.message));p.on('console',m=>{if(m.type()==='error'&&!m.text().includes('Service Worker'))errors.push(m.text());});
 await p.addInitScript(()=>{localStorage.setItem('music-transpose-navigation-v2',JSON.stringify({mode:'continuous',explicit:true}));document.addEventListener('score-engraved',e=>window.testSystems=e.detail.systems);});
 await p.goto(process.env.TEST_URL||'http://127.0.0.1:8781/');await p.waitForFunction(()=>window.prototype?.navigation);
 const ready=()=>p.waitForFunction(()=>prototype.ready&&!prototype.busy&&!prototype.loading&&document.querySelector('#score').getAttribute('aria-busy')==='false');
 const nav=async mode=>{await p.locator('#score-navigation-button').click();await p.locator(`[data-navigation="${mode}"]`).click();};
 const view=async mode=>{await p.locator('#score-size').click();await p.locator(`#score-size-options [data-size="${mode}"]`).click();await ready();};
 const signature=()=>p.evaluate(async()=>{const {parseChordSymbol}=await import('./chord-symbol.js');const d=new DOMParser().parseFromString(prototype.xml,'application/xml');const pitches=[...d.querySelectorAll('note > pitch')].map(n=>12*(+n.querySelector('octave').textContent+1)+({C:0,D:2,E:4,F:5,G:7,A:9,B:11}[n.querySelector('step').textContent])+(+n.querySelector('alter')?.textContent||0));for(const e of d.querySelectorAll('pitch,key,harmony > root,harmony > bass,accidental'))e.remove();for(const e of d.querySelectorAll('direction-type > words'))if(parseChordSymbol(e.textContent))e.textContent='CHORD';return {pitches,invariant:new XMLSerializer().serializeToString(d)};});
 const measure=()=>p.evaluate(()=>{
  const host=document.querySelector('#score'),svgs=[...host.querySelectorAll('svg')].filter(e=>!e.closest('.mxl-page-frame')),bands=[];
  const intervals=svgs.flatMap(svg=>[...svg.querySelectorAll('path,text,line,rect,ellipse,circle,polygon,polyline,use,image')].filter(e=>!e.closest('defs,clipPath,mask')).map(e=>e.getBoundingClientRect()).filter(r=>r.width||r.height).map(r=>[r.top+scrollY,r.bottom+scrollY])).sort((a,b)=>a[0]-b[0]);
  for(const [top,bottom] of intervals){const last=bands.at(-1);if(last&&top<=last[1]+1)last[1]=Math.max(last[1],bottom);else bands.push([top,bottom]);}
  const gaps=bands.slice(1).map((v,i)=>({top:bands[i][1],bottom:v[0],gap:v[0]-bands[i][1]}));
  const systems=(window.testSystems||[]).map(s=>{const svg=svgs[s.svgIndex],r=svg.getBoundingClientRect(),scale=r.width/svg.viewBox.baseVal.width;return {...s,pixelTop:r.top+scrollY+(s.top-svg.viewBox.baseVal.y)*scale,pixelBottom:r.top+scrollY+(s.bottom-svg.viewBox.baseVal.y)*scale};});
  return {systems,gaps:gaps.sort((a,b)=>b.gap-a.gap).slice(0,5),report:host.autoReport,zoom:host.dataset.zoom,overflow:document.documentElement.scrollWidth>innerWidth,xml:prototype.xml,viewXML:prototype.viewXML};
 });
 for(const id of ids){
  await p.evaluate(id=>prototype.loadSong(id),id);await ready();await p.locator('#key').click();await p.locator('#key-dialog [data-shift="0"]').click();await ready();assert.equal(await p.locator('#score-size').getAttribute('data-view'),'auto');const original=await signature();
  for(const shift of [0,2,-2,0]){
   await p.evaluate(s=>prototype.changeKey(s),shift);await ready();const sig=await signature();assert.deepEqual(sig.pitches,original.pitches.map(n=>n+shift),'every pitch transposes');assert(sig.invariant===original.invariant,'rhythm, lyrics, markings and chord kinds/timing preserved');
   const data=await measure();assert.equal(data.viewXML,data.xml,'Full Score must not inherit Melody from the previous song');assert(!data.overflow);const count=await p.evaluate(()=>new DOMParser().parseFromString(prototype.xml,'application/xml').querySelector('part').querySelectorAll(':scope > measure').length);
   const covered=new Set(data.systems.flatMap(s=>Array.from({length:s.end-s.start+1},(_,i)=>s.start+i)));assert.equal(covered.size,count,'all measures captured');assert.equal(Math.min(...covered),0);assert.equal(Math.max(...covered),count-1);
   if(id!==ids[0]&&width<=390)assert(data.gaps[0].gap<120,'CS87 no abnormal blank band');
   console.log("RENDER",engine,width,id,shift,"gap",data.gaps[0].gap.toFixed(1));rows.push({id,width,shift,...data});await fs.writeFile(`${out}/${engine}-results.json`,JSON.stringify(rows,null,2));
   if(shift===0&&width===375){const gap=data.gaps[0];await p.evaluate(y=>scrollTo(0,y),Math.max(0,(gap.top+gap.bottom)/2-height/2));await p.screenshot({path:`${out}/${engine}-${id}-375-after.png`});}
   await nav('pages');const frames=p.locator('.mxl-page-frame');assert(await frames.count()>0);await p.keyboard.press('End');assert.equal(await p.locator('.mxl-page-frame.current-page').getAttribute('data-end'),String(count-1));await p.keyboard.press('Home');assert.equal(await p.locator('.mxl-page-frame.current-page').getAttribute('data-start'),'0');if(await frames.count()>1){await p.keyboard.press('ArrowRight');assert(Number(await p.locator('.mxl-page-frame.current-page').getAttribute('data-start'))>0);await p.keyboard.press('ArrowLeft');}
   await nav('continuous');
   if(shift===2&&width===375){const download=p.waitForEvent('download');await p.locator('#score-export-xml').evaluate(e=>e.click());const file=await download;await file.saveAs(`${out}/${engine}-${id}-transposed.musicxml`);const text=await fs.readFile(`${out}/${engine}-${id}-transposed.musicxml`,'utf8');assert.equal(text,data.viewXML);const pages=await p.evaluate(()=>prototype.preparePrint());assert(pages>0);await p.evaluate(()=>{document.body.classList.remove('prepared-print');document.querySelector('#print-pages').replaceChildren();});}
  }
  await view('large');const melody=await measure();assert(melody.systems.length>0);await p.evaluate(()=>prototype.changeKey(2));await ready();await p.evaluate(()=>prototype.changeKey(0));await ready();await nav('pages');assert(await p.locator('.mxl-page-frame').count()>0);await p.keyboard.press('End');await p.keyboard.press('Home');await nav('continuous');
  await view('pdf');assert(await p.locator('.pdf-page-frame').count()>0);await nav('pages');await p.keyboard.press('End');await p.keyboard.press('Home');await nav('continuous');
  console.log('PASS',engine,width,id,'Full +/-2/reset, measure coverage, Continuous/Pages, Melody, Original');
 }
 assert.deepEqual(errors,[]);await c.close();
}}finally{await b.close();}
