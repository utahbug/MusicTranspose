import {createRequire} from 'node:module';
import {execFileSync} from 'node:child_process';
import fs from 'node:fs';
import assert from 'node:assert/strict';
const {chromium}=createRequire(process.env.PLAYWRIGHT_PACKAGE)('playwright');
const baselineRef='1e0210e',full=!!process.env.PHASE4C_FULL,only=process.env.PHASE4C_SONG||null;
const baseline=execFileSync('git',['show',baselineRef+':lead-view.js'],{encoding:'utf8'}).replace('./right-hand-melody.js','./phase4c-rh-baseline.js');
const rh=execFileSync('git',['show',baselineRef+':right-hand-melody.js'],{encoding:'utf8'});
const targets=JSON.parse(fs.readFileSync('reports/melody-phase4b.json','utf8')).rows.filter(r=>r.reason==='rh-domain').map(r=>r.id);
assert.equal(targets.length,21);
const b=await chromium.launch({channel:'msedge',headless:true}),p=await b.newPage({serviceWorkers:'block'});
await p.route('**/phase4c-baseline.js',r=>r.fulfill({contentType:'text/javascript',body:baseline}));
await p.route('**/phase4c-rh-baseline.js',r=>r.fulfill({contentType:'text/javascript',body:rh}));
try{
 await p.goto(process.env.TEST_URL||'http://127.0.0.1:8780/');
 const rows=await p.evaluate(async({targets,full,only})=>{
  const {songs}=await import('./songs.js'),{unpackMXL,transposeXML}=await import('./music.js'),{createLeadXML,leadEngravingXML}=await import('./lead-view.js'),{createLeadXML:old,leadEngravingXML:oldEngraving}=await import('./phase4c-baseline.js'),{scoreTimeline}=await import('./playback.js');
  const must=(v,m)=>{if(!v)throw Error(m);},parse=s=>new DOMParser().parseFromString(s,'application/xml'),child=(n,k)=>[...n.children].find(c=>c.localName===k),txt=(n,k,d='')=>child(n,k)?.textContent.trim()??d;
  const pitch=n=>{const a=child(n,'pitch');return a?12*(Number(txt(a,'octave'))+1)+{C:0,D:2,E:4,F:5,G:7,A:9,B:11}[txt(a,'step')]+Number(txt(a,'alter','0')):null;};
  const events=d=>{const out=[];for(const part of d.querySelectorAll('score-partwise > part')){let div=1;for(const [mi,m] of [...part.children].entries()){let at=0,last=0,ci=0;for(const n of m.children){if(n.localName==='attributes')div=Number(txt(n,'divisions',String(div)));const dur=Number(txt(n,'duration','0'))/div;if(n.localName==='backup')at-=dur;if(n.localName==='forward')at+=dur;if(n.localName==='note'){const chord=!!child(n,'chord'),t=chord?last:at;ci=chord?ci+1:0;out.push({part:part.id,staff:txt(n,'staff','1'),voice:txt(n,'voice','1'),mi,at:t,duration:dur,pitch:pitch(n),chord,ci,node:n});if(!chord){last=at;at+=dur;}}}}}return out;};
  const out=[];
  for(const song of songs.filter(s=>s.scoreType!=='pdf'&&(full||(only?s.id===only:targets.includes(s.id)||s.id==='cs-12')))){
   const source=unpackMXL(await(await fetch(song.asset)).arrayBuffer()),before=old(source,song),after=createLeadXML(source,song);
   if(before.ok){must(after.ok&&after.xml===before.xml,song.id+' previous supported output changed');must(leadEngravingXML(after.xml)===oldEngraving(before.xml),song.id+' previous engraving XML changed');}
   if(!after.ok)must(after.xml===source,song.id+' failed extraction changed source');
   if(!targets.includes(song.id)&&!before.ok)must(after.ok===before.ok&&after.reason===before.reason,song.id+' unrelated failure changed');
   const row={id:song.id,title:song.title,collection:song.collection,page:song.page,oldOk:before.ok,oldReason:before.reason,ok:after.ok,reason:after.reason,detail:after.detail};
   if(targets.includes(song.id)){
    must(before.reason==='rh-domain',song.id+' baseline failure');must(after.ok,song.id+': '+after.reason+' '+after.detail);
    const src=parse(source),dst=parse(after.xml),selection=after.selection;
    const clefs=(doc,partId,staff)=>[...doc.querySelectorAll('score-partwise > part')].filter(p=>p.id===partId).flatMap(p=>[...p.children].flatMap((m,i)=>[...m.querySelectorAll('attributes > clef')].filter(c=>(c.getAttribute('number')||'1')===staff).map(c=>i+':'+[...c.children].map(n=>n.outerHTML).join(''))));
    must(JSON.stringify(clefs(src,selection.part,selection.staff))===JSON.stringify(clefs(dst,selection.part,'1')),song.id+' original upper clef changed');
    const expected=events(src).filter(e=>e.part===selection.part&&e.staff===selection.staff).sort((a,b)=>a.mi-b.mi||a.at-b.at),actual=events(dst).sort((a,b)=>a.mi-b.mi||a.at-b.at),proof=after.melodyProof;
    must(expected.length===actual.length&&actual.length===proof.length,song.id+' dropped/added RH events');must(dst.querySelectorAll('part').length===1,song.id+' extra part');
    for(const [i,e] of actual.entries()){
     const a=expected[i],pr=proof[i];must(e.part===a.part&&e.staff==='1'&&e.voice===a.voice&&e.mi===a.mi&&Math.abs(e.at-a.at)<1e-7&&Math.abs(e.duration-a.duration)<1e-7&&e.pitch===a.pitch&&e.chord===a.chord,song.id+' RH event mismatch '+i);
     must(pr.part===a.part&&pr.staff===a.staff&&pr.voice===a.voice&&pr.measure===a.mi&&pr.at===a.at&&pr.duration===a.duration&&pr.pitch===a.pitch&&pr.sourceChordIndex===a.ci,song.id+' source proof mismatch '+i);
     const changes=(after.annotationAdjustments||[]).filter(c=>c.measure===a.mi&&c.at===a.at&&c.voice===a.voice&&c.sourceChordIndex===a.ci);
     const semantic=(n,drop=false)=>{const c=n.cloneNode(true);if(drop)for(const change of changes){const mark=[...c.querySelectorAll('notations > slur')].find(e=>e.getAttribute('type')===change.type&&(e.getAttribute('number')||'1')===change.number);must(mark,song.id+' unknown dropped annotation');mark.remove();}for(const el of [c,...c.querySelectorAll('*')])if(!el.closest('lyric'))for(const k of ['default-x','default-y','relative-x','relative-y'])el.removeAttribute(k);child(c,'staff')?.remove();child(c,'duration')?.remove();if(child(c,'cue')){child(c,'type').setAttribute('size','cue');child(c,'cue').remove();}return c.outerHTML;};
     must(semantic(e.node)===semantic(a.node,true),song.id+' changed cue/lyrics/notation '+i);
    }
    // Expressions may live near the bass staff but govern the passage.
    // Verify semantic content and exact source timestamps across the projection.
    const expressions=doc=>{const out=[];for(const part of doc.querySelectorAll('score-partwise > part')){const definition=[...doc.querySelectorAll('score-part')].find(n=>n.id===part.id),optional=/descant|ossia/i.test(definition?.textContent||'')||[...part.querySelectorAll('words')].some(n=>/optional descant/i.test(n.textContent));let div=1;for(const [mi,m] of [...part.children].entries()){let at=0;for(const n of m.children){if(n.localName==='attributes')div=Number(txt(n,'divisions',String(div)));const duration=Number(txt(n,'duration','0'))/div;if(n.localName==='backup')at-=duration;if(n.localName==='forward')at+=duration;if(n.localName==='note'&&!child(n,'chord'))at+=duration;if(['direction','harmony','sound'].includes(n.localName)&&(!optional||n.matches('sound[tempo]')||n.querySelector('sound[tempo],metronome'))){const copy=n.cloneNode(true),onset=at+Number(txt(n,'offset','0'))/div;for(const e of [copy,...copy.querySelectorAll('*')])for(const k of ['default-x','default-y','relative-x','relative-y'])e.removeAttribute(k);for(const e of copy.querySelectorAll(':scope > staff'))e.textContent='1';child(copy,'offset')?.remove();out.push(mi+':'+onset+':'+copy.outerHTML);}}}}return [...new Set(out)].sort();};
    must(JSON.stringify(expressions(src))===JSON.stringify(expressions(dst)),song.id+' global expression/harmony timestamp or content changed');
    const bars=doc=>[...new Set([...doc.querySelectorAll('score-partwise > part')].flatMap(part=>[...part.children].flatMap((m,i)=>[...m.querySelectorAll('barline > ending,barline > repeat')].map(e=>i+':'+e.localName+':'+['direction','times','number','type'].map(a=>e.getAttribute(a)||'').join(':')+':'+e.textContent.trim()))))].sort();
    must(JSON.stringify(bars(src))===JSON.stringify(bars(dst)),song.id+' repeats/endings changed '+JSON.stringify({source:bars(src),derived:bars(dst)}));
    const sourceForPlayback=parse(source);for(const cue of sourceForPlayback.querySelectorAll('note > cue'))cue.remove();
    const originalTimeline=scoreTimeline(new XMLSerializer().serializeToString(sourceForPlayback)),timeline=scoreTimeline(after.xml);
    const notes=originalTimeline.notes.filter(n=>n.part===selection.part&&n.staff===selection.staff),shape=ns=>ns.map(({midi,start,duration,voice})=>({midi,start,duration,voice}));
    must(JSON.stringify(shape(notes))===JSON.stringify(shape(timeline.notes)),song.id+' playback altered RH timing/pitch or retained LH');
    must(JSON.stringify(originalTimeline.tempos)===JSON.stringify(timeline.tempos),song.id+' tempo map');
    must(JSON.stringify(originalTimeline.measures.map(m=>m.length))===JSON.stringify(timeline.measures.map(m=>m.length)),song.id+' measure lengths');
    const engraved=leadEngravingXML(after.xml),engTimeline=scoreTimeline(engraved);
    must(JSON.stringify(shape(engTimeline.notes))===JSON.stringify(shape(timeline.notes)),song.id+' engraving anchors changed sounding notes');
    must(!after.xml.includes('music-transpose-rh-gap'),song.id+' disposable rests leaked into musical XML');
    const shifted=scoreTimeline(transposeXML(after.xml,2));must(shifted.notes.length===timeline.notes.length&&shifted.notes.every((n,i)=>n.midi===timeline.notes[i].midi+2&&n.start===timeline.notes[i].start&&n.duration===timeline.notes[i].duration),song.id+' transposed XML/playback');
    Object.assign(row,{selection,events:actual.length,cues:actual.filter(e=>child(e.node,'type')?.getAttribute('size')==='cue').length,sourceCueElements:expected.filter(e=>child(e.node,'cue')).length,chordNotes:actual.filter(e=>e.chord).length,lyricless:actual.filter(e=>!child(e.node,'lyric')).length,playbackNotes:timeline.notes.length,harmonies:dst.querySelectorAll('harmony').length,slurs:dst.querySelectorAll('notations > slur').length,sourceRhSlurs:expected.reduce((a,e)=>a+e.node.querySelectorAll('notations > slur').length,0),annotationAdjustments:after.annotationAdjustments||[]});
   }
   out.push(row);
  }
  return out;
 },{targets,full,only});
 if(full){assert.equal(rows.length,666);assert.equal(rows.filter(r=>r.oldOk).length,619);assert.equal(rows.filter(r=>r.ok).length,640);}
 if(!only)assert(rows.find(r=>r.id==='cs-12'&&!r.ok&&r.reason==='rh-competing'));
 else assert.equal(rows.length,1);
 fs.writeFileSync(`test-results/phase4c-${full?'full':only||'targeted'}.json`,JSON.stringify({baseline:baselineRef,rows},null,2));
 for(const r of rows.filter(r=>targets.includes(r.id)))console.log(r.ok?'PASS':'UNRESOLVED',r.id,r.events,r.reason,r.detail,r.selection?.sourceVoices);
 console.log('PASS',full?'all 666 audited; 619 prior outputs byte-identical':only||'21 domain cases and protected A Child’s Prayer','; RH notes/voices/chords/lyrics/notation, playback and transposed XML verified');
}finally{await b.close();}
