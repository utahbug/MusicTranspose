import {createRequire} from 'node:module';import fs from 'node:fs';import assert from 'node:assert/strict';
const {chromium}=createRequire(process.env.PLAYWRIGHT_PACKAGE)('playwright'),b=await chromium.launch({channel:'msedge',headless:true}),p=await b.newPage({viewport:{width:390,height:844}}),errors=[];p.on('pageerror',e=>errors.push(e.message));
const base=process.env.TEST_URL||'http://127.0.0.1:8768/',ready=async()=>{await p.waitForFunction(()=>prototype.ready&&!prototype.busy&&document.querySelector('#score').getAttribute('aria-busy')==='false');await p.waitForTimeout(80);};
const view=async value=>{await p.locator('#score-size').click();await p.locator(`#score-size-options [data-size=${value}]`).click();await ready();};
try{
 await p.goto(base);await p.locator('.library-row').first().waitFor();
 const audit=await p.evaluate(async()=>{
  const {bundledLeadIds}=await import('./lead-availability.js');
  const {songs}=await import('./songs.js'),{unpackMXL,transposeXML}=await import('./music.js'),{createLeadXML}=await import('./lead-view.js'),{scoreTimeline}=await import('./playback.js');
  const parse=x=>new DOMParser().parseFromString(x,'application/xml'),serialize=e=>new XMLSerializer().serializeToString(e),rows=[];
  const must=(ok,why)=>{if(!ok)throw Error(why);};
  // Independent event reader used for source/output timing and ownership comparisons.
  function events(xml){const doc=parse(xml),out=[];for(const part of doc.querySelectorAll('score-partwise>part')){let div=1;for(const [mi,m] of [...part.children].entries()){let cursor=0,last=0;for(const e of m.children){const t=n=>e.querySelector(':scope>'+n)?.textContent,d=Number(t('duration')||0)/div;
   if(e.localName==='attributes')div=Number(t('divisions')||div);else if(e.localName==='backup')cursor-=d;else if(e.localName==='forward')cursor+=d;else if(e.localName==='note'){const grace=!!e.querySelector('grace'),chord=!!e.querySelector('chord'),at=chord?last:cursor;if(!chord){last=cursor;if(!grace)cursor+=d;}out.push({kind:'note',part:part.id,staff:t('staff')||'1',voice:t('voice')||'1',mi,at,d:grace?0:d,pitch:e.querySelector('pitch')?.textContent.replace(/\s/g,'')||'rest',lyrics:[...e.querySelectorAll('lyric')].map(serialize),ties:[...e.querySelectorAll(':scope>tie')].map(serialize),cue:!!e.querySelector('cue')});}
   else if(['direction','harmony','sound','barline'].includes(e.localName)){const copy=e.cloneNode(true);for(const n of [copy,...copy.querySelectorAll('*')])for(const a of ['default-x','default-y','relative-x','relative-y'])n.removeAttribute(a);for(const n of copy.querySelectorAll(':scope>staff,:scope>voice,:scope>offset'))n.remove();out.push({kind:e.localName,mi,at:cursor+Number(t('offset')||0)/div,content:serialize(copy).replace(/>\s+</g,'><')});}
  }}}return out;}
  for(const s of songs.filter(s=>s.scoreType!=='pdf')){
   const source=unpackMXL(await(await fetch(s.asset)).arrayBuffer()),lead=createLeadXML(source,s),row={id:s.id,title:s.title,collection:s.collection,page:s.page,ok:lead.ok,reason:lead.reason,message:lead.message,detail:lead.detail,selection:lead.selection};rows.push(row);
   if(!lead.ok){must(lead.xml===source,s.id+' fallback must be exact source');continue;}
   // Hymn chord-tone ownership has dedicated independent coverage in lead-hymns.mjs.
   if(lead.melodyProof)continue;
   const selected=lead.selection;
   for(const shift of [0,-2,3]){
    const original=shift?transposeXML(source,shift,s.modeOverride):source,output=shift?transposeXML(lead.xml,shift,s.modeOverride):lead.xml;
    const src=events(original),dst=events(output),notes=src.filter(e=>e.kind==='note'&&e.part===selected.part&&e.staff===selected.staff&&e.voice===selected.voice),actual=dst.filter(e=>e.kind==='note');
    must(parse(output).querySelectorAll('score-partwise>part').length===1,s.id+' one part');must(actual.every(n=>n.staff==='1'&&n.voice==='1'),s.id+' one staff/voice');
    const musical=ns=>ns.map(({mi,at,d,pitch,lyrics,ties,cue})=>({mi,at,d,pitch,lyrics,ties,cue}));
    must(JSON.stringify(musical(notes))===JSON.stringify(musical(actual)),s.id+' exact melody/rhythm/lyrics/cues '+shift);
    for(const e of src.filter(e=>['harmony','direction'].includes(e.kind)))must(dst.some(a=>a.kind===e.kind&&a.mi===e.mi&&Math.abs(a.at-e.at)<1e-6&&a.content===e.content),s.id+' annotation missing/time changed '+e.content);
    const semantic=doc=>[...doc.querySelectorAll('repeat,ending')].map(e=>[e.localName,e.getAttribute('number'),e.getAttribute('direction'),e.getAttribute('type'),e.getAttribute('times')].join(':'));
    for(const mark of semantic(parse(original)))must(semantic(parse(output)).includes(mark),s.id+' navigation marking');
    const oldTimeline=scoreTimeline(original),newTimeline=scoreTimeline(output);must(Math.abs(oldTimeline.duration-newTimeline.duration)<1e-5,s.id+' playback duration');
   }
  }
  must(JSON.stringify([...bundledLeadIds].sort())===JSON.stringify(rows.filter(r=>r.ok).map(r=>r.id).sort()),'Library Lead index matches actual extraction');
  return rows;
 });
 fs.writeFileSync('test-results/lead-audit.json',JSON.stringify(audit,null,2));console.log('PASS source/extracted note timing, lyrics, all directions/harmony, repeats and playback lengths',audit.filter(r=>r.ok).length,'leads;',audit.length,'scores audited');
 // Render every supported score, proving no runtime fallback is concealed by the audit.
 for(const row of audit.filter(r=>r.ok)){
  await p.evaluate(id=>prototype.loadSong(id),row.id);await ready();if(await p.locator('#score-size').getAttribute('data-size')!=='large')await view('large');
  const state=await p.evaluate(()=>({lead:prototype.lead,parts:new DOMParser().parseFromString(prototype.viewXML,'application/xml').querySelectorAll('part').length,overflow:document.documentElement.scrollWidth>innerWidth}));
  assert(state.lead.ok,JSON.stringify({id:row.id,state}));assert.equal(state.parts,1);assert(!state.overflow);assert(await p.locator('#lead-notice').count()===0);
 }
 console.log('PASS all supported scores engraved on phone');
 // Real responsive scores include optional/slash chords, repeats, multi-verse lyrics, pickups and fallback.
 const ids=['shepherd','hhc-1054','cs-168','cs-169','song-46fe34be-943a-4343-befe-707c1306e017','song-971fd988-d7e9-4e39-8c02-47840e323bf6','faithful','song-3f9eca82-5b22-4785-8ac8-9e7c8c34070b'];
 for(const [width,height] of [[320,568],[390,844],[430,932],[844,390],[820,1180],[1440,1000]]){
  await p.setViewportSize({width,height});
  for(const id of ids){
   await p.evaluate(id=>prototype.loadSong(id,'large'),id);await ready();await p.evaluate(()=>prototype.changeKey(2));await ready();
   const original=await p.evaluate(()=>({song:prototype.song,current:prototype.current,xml:prototype.xml,lead:!!prototype.lead?.ok,view:prototype.viewXML,store:{...localStorage}}));
   assert.equal(original.current,2);if(!original.lead){assert.equal(await p.locator('#lead-notice').count(),0);assert.equal(await p.locator('#score-size').getAttribute('data-size'),'normal');assert(await p.locator('[data-size=large]').isHidden());assert.equal(original.view,original.xml);}else assert.notEqual(original.view,original.xml);
   await view('normal');assert.equal(await p.evaluate(()=>prototype.xml),original.xml);if(original.lead)await view('large');assert.equal(await p.evaluate(()=>prototype.viewXML),original.view);assert.equal(await p.evaluate(()=>prototype.song),original.song);assert.equal(await p.evaluate(()=>prototype.current),2);
   assert(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
   if(original.lead){await p.evaluate(()=>prototype.preparePrint());assert(await p.locator('#print-pages svg').count()>0);}
   if(id==='hhc-1054'||id==='shepherd'||id==='faithful')await p.screenshot({path:`test-results/lead-${id}-${width}.png`,fullPage:true});
  }
  console.log('PASS Lead/Normal/key/print/fallback responsive',width);
 }
 assert.deepEqual(errors,[]);
}finally{await b.close();}
