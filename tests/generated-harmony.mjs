import {createRequire} from 'node:module';
import fs from 'node:fs';import assert from 'node:assert/strict';
const {chromium}=createRequire(process.env.PLAYWRIGHT_PACKAGE||'C:/Users/kenro/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/package.json')('playwright');
const b=await chromium.launch({channel:'msedge',headless:true}),c=await b.newContext({viewport:{width:820,height:1180},serviceWorkers:'block'}),p=await c.newPage(),errors=[],rows=[];
p.setDefaultTimeout(90000);p.on('pageerror',e=>errors.push(e.message));
try{
 await p.goto(process.env.TEST_URL||'http://127.0.0.1:8780/');await p.locator('[data-home-source=all]').click();
 const unit=await p.evaluate(async()=>{
  const {generatedHarmony}=await import('./generated-harmony-data.js'),{withGeneratedHarmony}=await import('./generated-harmony.js');
  const {songs}=await import('./songs.js'),{unpackMXL,transposeXML,parseXML}=await import('./music.js'),{createLeadXML}=await import('./lead-view.js');
  const check=(ok,msg)=>{if(!ok)throw Error(msg);},out=[];
  const pitch=n=>({C:0,D:2,E:4,F:5,G:7,A:9,B:11}[n.firstElementChild.textContent]+Number(n.querySelector('root-alter,bass-alter')?.textContent||0)+120)%12;
  const bare=xml=>{const d=parseXML(xml);d.querySelectorAll('harmony').forEach(n=>n.remove());return new XMLSerializer().serializeToString(d);};
  for(const [id,data] of Object.entries(generatedHarmony)){
   const song=songs.find(s=>s.id===id),raw=unpackMXL(await(await fetch(song.asset)).arrayBuffer()),xml=await withGeneratedHarmony(raw,id),d=parseXML(xml),hs=[...d.querySelectorAll('harmony')];
   check(hs.length===data.events.length,id+' injected count');check(bare(xml)===bare(raw),id+' source notation unchanged');
   check(await withGeneratedHarmony(xml,id)===xml,'idempotent');check(await withGeneratedHarmony(raw+' ',id)===raw+' ','fingerprint guard');
   const authoritative=raw.replace('<note','<harmony><root><root-step>C</root-step></root><kind>major</kind></harmony><note');
   check(await withGeneratedHarmony(authoritative,id)===authoritative,'source precedence');
   const text=raw.replace('<note','<direction><direction-type><words>C7</words></direction-type></direction><note');check(await withGeneratedHarmony(text,id)===text,'text chord precedence');
   const lead=createLeadXML(xml,song);check(lead.ok,id+' Melody success');
   const lh=[...parseXML(lead.xml).querySelectorAll('harmony')];check(lh.every(n=>n.id.startsWith('mt-generated-')),'Melody retains provenance');check(lh.length===hs.length,id+' Melody harmony count');
   check(lh.map(n=>n.querySelector('root').textContent+n.querySelector('kind').textContent+(n.querySelector('bass')?.textContent||'')).join('|')===hs.map(n=>n.querySelector('root').textContent+n.querySelector('kind').textContent+(n.querySelector('bass')?.textContent||'')).join('|'),'Melody harmony specification');
   for(const source of [xml,lead.xml]){
    const before=[...parseXML(source).querySelectorAll('harmony root,harmony bass')],after=[...parseXML(transposeXML(source,2,song.modeOverride)).querySelectorAll('harmony root,harmony bass')];
    check(before.length===after.length,'transposed count');check(before.every((n,i)=>(pitch(n)+2)%12===pitch(after[i])),'root and slash bass +2');
   }
   out.push({id,number:song.page,chords:hs.length});
  }check(out.length===5,'exactly five');check(await withGeneratedHarmony('<score-partwise/>','not-a-pilot')==='<score-partwise/>','nonpilot unchanged');return out;
 });console.log('PASS overlay, source guard, notation invariance, Melody preservation and +2 root/bass',unit);
 if(process.env.HARMONY_UNIT_ONLY){await b.close();process.exit(0);}
 const ready=()=>p.waitForFunction(()=>prototype.ready&&!prototype.busy&&!document.body.classList.contains('song-loading')&&document.querySelector('#score').getAttribute('aria-busy')==='false');
 for(const song of unit){
  await p.evaluate(id=>prototype.loadSong(id),song.id);await ready();
  for(const mode of ['auto','large']){
   await p.locator('#score-size').click();await p.locator(`#score-size-options [data-size=${mode}]`).click();await ready();
   for(const shift of [0,2]){
    await p.evaluate(shift=>prototype.changeKey(shift),shift);await ready();
    const state=await p.evaluate(()=>({harmony:new DOMParser().parseFromString(prototype.viewXML,'application/xml').querySelectorAll('harmony').length,overflow:document.documentElement.scrollWidth>innerWidth,svg:document.querySelectorAll('#score svg').length,text:document.querySelector('#score').textContent,report:document.querySelector('#score').autoReport,zoom:document.querySelector('#score').dataset.zoom}));
    assert.equal(state.harmony,song.chords);assert(!state.overflow);assert(state.svg>0);
    const screenshots=[];const pageCount=await p.locator('.mxl-page-frame').count();
    await p.keyboard.press('Home');
    for(let i=0;i<pageCount;i++){const file=`test-results/harmony-${song.number}-${mode}-${shift}-page${i+1}.png`;await p.screenshot({path:file});screenshots.push(file);if(i+1<pageCount)await p.keyboard.press('PageDown');}
    await p.keyboard.press('Home');rows.push({...song,mode,shift,...state,pageCount,screenshots});console.log('PASS render',song.number,mode,shift,state.zoom);
   }
   await p.evaluate(()=>prototype.changeKey(0));await ready();
  }
 }
 assert.deepEqual(errors,[]);fs.writeFileSync('test-results/generated-harmony-results.json',JSON.stringify(rows,null,2));
}finally{await b.close();}
