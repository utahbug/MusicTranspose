import {createRequire} from 'node:module';
import fs from 'node:fs';import assert from 'node:assert/strict';
const {chromium}=createRequire(process.env.PLAYWRIGHT_PACKAGE||'C:/Users/kenro/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/package.json')('playwright');
const b=await chromium.launch({channel:'msedge',headless:true}),c=await b.newContext({viewport:{width:820,height:1180},serviceWorkers:'block'}),p=await c.newPage(),errors=[],rows=[];
p.setDefaultTimeout(90000);p.on('pageerror',e=>errors.push(e.message));
try{
 if(process.env.HARMONY_NO_OVERLAY)await p.route('**/generated-harmony.js',async route=>{const body=(await(await route.fetch()).text()).replace('const overlay=generatedHarmony[songId];','if(window.harmonyDiagnosticWithoutOverlay)return xml; const overlay=generatedHarmony[songId];');await route.fulfill({body,contentType:'application/javascript'});});
 await p.goto(process.env.TEST_URL||'http://127.0.0.1:8780/');await p.locator('[data-home-source=all]').click();
 const unit=await p.evaluate(async(unitIds)=>{
  const {generatedHarmony}=await import('./generated-harmony-data.js'),{withGeneratedHarmony}=await import('./generated-harmony.js');
  const {songs}=await import('./songs.js'),{unpackMXL,transposeXML,parseXML}=await import('./music.js'),{createLeadXML}=await import('./lead-view.js');
  const check=(ok,msg)=>{if(!ok)throw Error(msg);},out=[];
  const pitch=n=>({C:0,D:2,E:4,F:5,G:7,A:9,B:11}[n.firstElementChild.textContent]+Number(n.querySelector('root-alter,bass-alter')?.textContent||0)+120)%12;
  const bare=xml=>{const d=parseXML(xml);d.querySelectorAll('harmony').forEach(n=>n.remove());return new XMLSerializer().serializeToString(d);};
  check(Object.keys(generatedHarmony).length===149,'exactly 139 prior overlays plus ten Batch 5 overlays');
  for(const [id,data] of Object.entries(generatedHarmony)){
   if(unitIds&&!unitIds.includes(songs.find(s=>s.id===id)?.page))continue;
   const song=songs.find(s=>s.id===id),raw=unpackMXL(await(await fetch(song.asset)).arrayBuffer()),xml=await withGeneratedHarmony(raw,id),d=parseXML(xml),hs=[...d.querySelectorAll('harmony')];
   const {parseChordSymbol}=await import('./chord-symbol.js');check(!parseXML(raw).querySelector('harmony')&&![...parseXML(raw).querySelectorAll('direction-type')].some(n=>parseChordSymbol([...n.querySelectorAll('words')].map(w=>w.textContent).join(''))),'raw source harmony audit');
   check(hs.length===data.events.length,id+' injected count');check(!d.querySelector('harmony bass'),'generated display has no slash bass');check(bare(xml)===bare(raw),id+' source notation unchanged');
   check(await withGeneratedHarmony(xml,id)===xml,'idempotent');check(await withGeneratedHarmony(raw+' ',id)===raw+' ','fingerprint guard');
   const authoritative=raw.replace('<note','<harmony><root><root-step>C</root-step></root><kind>major</kind><bass><bass-step>E</bass-step></bass></harmony><note');
   const fingerprint=data.xmlSha256;data.xmlSha256=[...new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(authoritative)))].map(x=>x.toString(16).padStart(2,'0')).join('');
   check(await withGeneratedHarmony(authoritative,id)===authoritative,'source slash precedence even with matching fingerprint');data.xmlSha256=fingerprint;
   const text=raw.replace('<note','<direction><direction-type><words>C7</words></direction-type></direction><note');check(await withGeneratedHarmony(text,id)===text,'text chord precedence');
   const lead=createLeadXML(xml,song);check(lead.ok,id+' Melody success');
   const lh=[...parseXML(lead.xml).querySelectorAll('harmony')];check(lh.every(n=>n.id.startsWith('mt-generated-')),'Melody retains provenance');check(lh.length===hs.length,id+' Melody harmony count');
   // Multiple voices can serialize harmony nodes in a different order; compare musical positions.
   const harmonyEvents=doc=>[...doc.querySelectorAll('part')].flatMap(part=>{let divisions=1;return [...part.querySelectorAll(':scope > measure')].flatMap((m,measure)=>{let cursor=0;const events=[];for(const n of m.children){if(n.localName==='attributes')divisions=Number(n.querySelector('divisions')?.textContent||divisions);const duration=Number(n.querySelector(':scope > duration')?.textContent||0)/divisions;if(n.localName==='backup')cursor-=duration;else if(n.localName==='forward')cursor+=duration;else if(n.localName==='note'&&!n.querySelector('chord,grace'))cursor+=duration;else if(n.localName==='harmony')events.push({id:n.id,measure,offset:Math.round((cursor+Number(n.querySelector('offset')?.textContent||0)/divisions)*1e7)/1e7,root:n.querySelector('root').textContent,kind:n.querySelector('kind').textContent});}return events;});}).sort((a,b)=>a.id.localeCompare(b.id));
   check(JSON.stringify(harmonyEvents(d))===JSON.stringify(harmonyEvents(parseXML(lead.xml))),id+' Melody musical harmony positions/specifications');
   for(const source of [xml,lead.xml]){
    const before=[...parseXML(source).querySelectorAll('harmony root,harmony bass')],after=[...parseXML(transposeXML(source,2,song.modeOverride)).querySelectorAll('harmony root,harmony bass')];
    check(before.length===after.length,'transposed count');check(before.every((n,i)=>(pitch(n)+2)%12===pitch(after[i])),'root and slash bass +2');
    const shifted=parseXML(transposeXML(source,2,song.modeOverride));check([...shifted.querySelectorAll('harmony kind')].map(n=>n.textContent).join('|')===[...parseXML(source).querySelectorAll('harmony kind')].map(n=>n.textContent).join('|'),'transposition preserves quality');check(!shifted.querySelector('harmony bass'),'transposed generated symbols remain root-only');
   }
   out.push({id,number:song.page,chords:hs.length});
  }check(out.length===(unitIds?unitIds.length:149),'expected structural coverage');check(await withGeneratedHarmony('<score-partwise/>','not-a-pilot')==='<score-partwise/>','nonpilot unchanged');return out;
 },process.env.HARMONY_UNIT_IDS?.split(','));console.log('PASS overlay, source guard, notation invariance, Melody preservation and +2 root/bass',unit);
 if(process.env.HARMONY_UNIT_ONLY){await b.close();process.exit(0);}
 if(process.env.HARMONY_NO_OVERLAY)await p.evaluate(()=>window.harmonyDiagnosticWithoutOverlay=true);
 const ready=()=>p.waitForFunction(()=>prototype.ready&&!prototype.busy&&!document.body.classList.contains('song-loading')&&document.querySelector('#score').getAttribute('aria-busy')==='false');
 for(const song of unit){
  if(process.env.HARMONY_RENDER_IDS&&!process.env.HARMONY_RENDER_IDS.split(',').includes(song.number))continue;
  await p.evaluate(id=>prototype.loadSong(id),song.id);await ready();const pdfPageCount=await p.locator('.pdf-page-frame').count()||null;
  for(const mode of ['auto','large']){
   await p.locator('#score-size').click();await p.locator(`#score-size-options [data-size=${mode}]`).click();await ready();
   for(const shift of (process.env.HARMONY_ALT_ONLY?[2]:!process.env.HARMONY_ALT_IDS||process.env.HARMONY_ALT_IDS.split(',').includes(song.number)?[0,2]:[0])){
    await p.evaluate(shift=>prototype.changeKey(shift),shift);await ready();
    const state=await p.evaluate(()=>({harmony:new DOMParser().parseFromString(prototype.viewXML,'application/xml').querySelectorAll('harmony').length,overflow:document.documentElement.scrollWidth>innerWidth,svg:document.querySelectorAll('#score svg').length,text:document.querySelector('#score').textContent,report:document.querySelector('#score').autoReport,zoom:document.querySelector('#score').dataset.zoom,systems:Number(document.querySelector('#score').dataset.systems)}));
    assert.equal(state.harmony,process.env.HARMONY_NO_OVERLAY?0:song.chords);assert(!state.overflow);assert(state.svg>0);
    const screenshots=[];const pageCount=await p.locator('.mxl-page-frame').count();
    await p.keyboard.press('Home');
    for(let i=0;i<pageCount;i++){const file=`test-results/${process.env.HARMONY_NO_OVERLAY?"bare-":""}harmony-${song.number}-${mode}-${shift}-page${i+1}.png`;await p.screenshot({path:file});screenshots.push(file);if(i+1<pageCount)await p.keyboard.press('PageDown');}
    await p.keyboard.press('Home');rows.push({...song,pdfPageCount,mode,shift,...state,pageCount,screenshots});console.log('PASS render',song.number,mode,shift,state.zoom);
   }
   await p.evaluate(()=>prototype.changeKey(0));await ready();
  }
 }
 assert.deepEqual(errors,[]);fs.writeFileSync(process.env.HARMONY_OUTPUT||'test-results/generated-harmony-results.json',JSON.stringify(rows,null,2));
}finally{await b.close();}
