import {createRequire} from 'node:module';
import {execFileSync} from 'node:child_process';
import fs from 'node:fs';
import assert from 'node:assert/strict';
const {chromium}=createRequire(process.env.PLAYWRIGHT_PACKAGE)('playwright');
const baselineRef='a35535b',full=!!process.env.PHASE4A_FULL,only=process.env.PHASE4A_SONG||null;
const baseline=execFileSync('git',['show',baselineRef+':lead-view.js'],{encoding:'utf8'}).replace('./right-hand-melody.js','./phase4a-rh-baseline.js');
const rh=execFileSync('git',['show',baselineRef+':right-hand-melody.js'],{encoding:'utf8'});
const targets=JSON.parse(fs.readFileSync('reports/melody-phase3c-final-index.json','utf8')).rows.filter(r=>r.reason==='rh-cue').map(r=>r.id);
assert.equal(targets.length,13);
const b=await chromium.launch({channel:'msedge',headless:true}),p=await b.newPage({serviceWorkers:'block'});
await p.route('**/phase4a-baseline.js',r=>r.fulfill({contentType:'text/javascript',body:baseline}));
await p.route('**/phase4a-rh-baseline.js',r=>r.fulfill({contentType:'text/javascript',body:rh}));
try{
 await p.goto(process.env.TEST_URL||'http://127.0.0.1:8780/');
 const rows=await p.evaluate(async({targets,full,only})=>{
  const {songs}=await import('./songs.js'),{unpackMXL,transposeXML}=await import('./music.js'),{createLeadXML}=await import('./lead-view.js'),{createLeadXML:old}=await import('./phase4a-baseline.js'),{scoreTimeline}=await import('./playback.js');
  const must=(v,m)=>{if(!v)throw Error(m);},parse=s=>new DOMParser().parseFromString(s,'application/xml'),child=(n,k)=>[...n.children].find(c=>c.localName===k),txt=(n,k,d='')=>child(n,k)?.textContent.trim()??d;
  const pitch=n=>{const a=child(n,'pitch');return a?12*(Number(txt(a,'octave'))+1)+{C:0,D:2,E:4,F:5,G:7,A:9,B:11}[txt(a,'step')]+Number(txt(a,'alter','0')):null;};
  const events=d=>{const out=[];for(const part of d.querySelectorAll('score-partwise > part')){let div=1;for(const [mi,m] of [...part.children].entries()){let at=0,last=0,ci=0;for(const n of m.children){if(n.localName==='attributes')div=Number(txt(n,'divisions',String(div)));const dur=Number(txt(n,'duration','0'))/div;if(n.localName==='backup')at-=dur;if(n.localName==='forward')at+=dur;if(n.localName==='note'){const chord=!!child(n,'chord'),t=chord?last:at;ci=chord?ci+1:0;out.push({part:part.id,staff:txt(n,'staff','1'),voice:txt(n,'voice','1'),mi,at:t,duration:dur,pitch:pitch(n),chord,ci,node:n});if(!chord){last=at;at+=dur;}}}}}return out;};
  const out=[];
  for(const song of songs.filter(s=>s.scoreType!=='pdf'&&(full||(only?s.id===only:targets.includes(s.id)||s.id==='cs-12')))){
   const source=unpackMXL(await(await fetch(song.asset)).arrayBuffer()),before=old(source,song),after=createLeadXML(source,song);
   if(before.ok)must(after.ok&&after.xml===before.xml,song.id+' previous supported output changed');
   if(!after.ok)must(after.xml===source,song.id+' failed extraction changed source');
   if(!targets.includes(song.id)&&!before.ok)must(after.ok===before.ok&&after.reason===before.reason,song.id+' unrelated failure changed');
   const row={id:song.id,title:song.title,collection:song.collection,page:song.page,oldOk:before.ok,oldReason:before.reason,ok:after.ok,reason:after.reason,detail:after.detail};
   if(targets.includes(song.id)){
    must(before.reason==='rh-cue',song.id+' baseline failure');must(after.ok,song.id+': '+after.reason+' '+after.detail);
    const src=parse(source),dst=parse(after.xml),selection=after.selection;
    const expected=events(src).filter(e=>e.part===selection.part&&e.staff===selection.staff).sort((a,b)=>a.mi-b.mi||a.at-b.at),actual=events(dst),proof=after.melodyProof;
    must(expected.length===actual.length&&actual.length===proof.length,song.id+' dropped/added RH events');must(dst.querySelectorAll('part').length===1,song.id+' extra part');
    for(const [i,e] of actual.entries()){
     const a=expected[i],pr=proof[i];must(e.part===a.part&&e.staff==='1'&&e.voice===a.voice&&e.mi===a.mi&&Math.abs(e.at-a.at)<1e-7&&Math.abs(e.duration-a.duration)<1e-7&&e.pitch===a.pitch&&e.chord===a.chord,song.id+' RH event mismatch '+i);
     must(pr.part===a.part&&pr.staff===a.staff&&pr.voice===a.voice&&pr.measure===a.mi&&pr.at===a.at&&pr.duration===a.duration&&pr.pitch===a.pitch&&pr.sourceChordIndex===a.ci,song.id+' source proof mismatch '+i);
     const semantic=n=>{const c=n.cloneNode(true);for(const el of [c,...c.querySelectorAll('*')])if(!el.closest('lyric'))for(const k of ['default-x','default-y','relative-x','relative-y'])el.removeAttribute(k);child(c,'staff')?.remove();child(c,'duration')?.remove();if(child(c,'cue')){child(c,'type').setAttribute('size','cue');child(c,'cue').remove();}return c.outerHTML;};
     must(semantic(e.node)===semantic(a.node),song.id+' changed cue/lyrics/notation '+i);
    }
    // Product regression: simultaneous normal melody and upper cue notes
    // remain together. The lyric-bearing base is never replaced by its cue.
    if(song.id==='cs-34'){
     const phrase=[['Live',39,.5,67,70],['like',39,1,65,70],['his',39,2,64,70],['Son.',40,0,65,69]];
     for(const [word,mi,at,normalPitch,cuePitch] of phrase){
      const group=actual.filter(e=>e.mi===mi&&e.at===at&&e.voice==='1');
      const main=group.find(e=>e.pitch===normalPitch&&[...e.node.querySelectorAll('lyric > text')].some(n=>n.textContent.trim()===word));
      const small=group.find(e=>e.pitch===cuePitch&&child(e.node,'type')?.getAttribute('size')==='cue');
      must(main&&!main.chord&&child(main.node,'type')?.getAttribute('size')!=='cue',song.id+' normal melody displaced at '+word);
      must(small&&small.chord&&small.duration===main.duration,song.id+' upper cue missing at '+word);
     }
     must(actual.every(e=>e.part==='P1'&&e.staff==='1'),song.id+' LH introduced into final phrase reduction');
     row.finalPhrase='Live like his Son: normal G4 F4 E4 F4 plus small Bb4 Bb4 Bb4 A4 retained together';
    }
    const sourceForPlayback=parse(source);for(const cue of sourceForPlayback.querySelectorAll('note > cue'))cue.remove();
    const originalTimeline=scoreTimeline(new XMLSerializer().serializeToString(sourceForPlayback)),timeline=scoreTimeline(after.xml);
    const notes=originalTimeline.notes.filter(n=>n.part===selection.part&&n.staff===selection.staff),shape=ns=>ns.map(({midi,start,duration,voice})=>({midi,start,duration,voice}));
    must(JSON.stringify(shape(notes))===JSON.stringify(shape(timeline.notes)),song.id+' playback altered RH timing/pitch or retained LH');
    must(JSON.stringify(originalTimeline.tempos)===JSON.stringify(timeline.tempos),song.id+' tempo map');
    must(JSON.stringify(originalTimeline.measures.map(m=>m.length))===JSON.stringify(timeline.measures.map(m=>m.length)),song.id+' measure lengths');
    const shifted=scoreTimeline(transposeXML(after.xml,2));must(shifted.notes.length===timeline.notes.length&&shifted.notes.every((n,i)=>n.midi===timeline.notes[i].midi+2&&n.start===timeline.notes[i].start&&n.duration===timeline.notes[i].duration),song.id+' transposed XML/playback');
    Object.assign(row,{selection,events:actual.length,cues:actual.filter(e=>child(e.node,'type')?.getAttribute('size')==='cue').length,sourceCueElements:expected.filter(e=>child(e.node,'cue')).length,chordNotes:actual.filter(e=>e.chord).length,lyricless:actual.filter(e=>!child(e.node,'lyric')).length,playbackNotes:timeline.notes.length,harmonies:dst.querySelectorAll('harmony').length});
   }
   out.push(row);
  }
  return out;
 },{targets,full,only});
 if(full){assert.equal(rows.length,666);assert.equal(rows.filter(r=>r.oldOk).length,580);assert.equal(rows.filter(r=>r.ok).length,593);}
 if(!only)assert(rows.find(r=>r.id==='cs-12'&&!r.ok&&r.reason==='rh-competing'));
 else assert.equal(rows.length,1);
 fs.writeFileSync(`test-results/phase4a-${full?'full':only||'targeted'}.json`,JSON.stringify({baseline:baselineRef,rows},null,2));
 for(const r of rows.filter(r=>targets.includes(r.id)))console.log('PASS',r.id,r.events,'RH events',r.cues,'cues',r.chordNotes,'chord tones',r.selection.sourceVoices);
 console.log('PASS',full?'all 666 audited; 580 prior outputs byte-identical':only||'13 cue cases and protected A Child’s Prayer','; RH notes/voices/chords/lyrics/notation, playback and transposed XML verified');
}finally{await b.close();}
