// Piano-domain fallback for bundled piano/vocal collections. Source XML is never
// edited. Every retained event carries a source staff/voice/onset/pitch proof.
const children=(e,n)=>[...e.children].filter(c=>c.localName===n);
const child=(e,n)=>children(e,n)[0];
const text=(e,n,d='')=>child(e,n)?.textContent.trim()??d;
const pitch=n=>{const p=child(n,'pitch');return p?12*(Number(text(p,'octave'))+1)+{C:0,D:2,E:4,F:5,G:7,A:9,B:11}[text(p,'step')]+Number(text(p,'alter','0')):null;};
const eps=1e-7;
const fail=(reason,detail)=>({ok:false,reason:'rh-'+reason,detail});
const lyric=n=>children(n,'lyric').map(l=>[...l.querySelectorAll('text')].map(t=>t.textContent).join(' ')).join('|');
const cue=n=>!!child(n,'cue')||child(n,'type')?.getAttribute('size')==='cue';

export function rightHandMelody(source,{refine=false,normalizeTies=false,retainTreble=false,annotations=false}={}){
 const doc=new DOMParser().parseFromString(source,'application/xml');
 if(doc.querySelector('parsererror'))return fail('structure','Invalid MusicXML');
 // Invisible zero-time grace rests are engraving spacers, not musical events.
 // Real grace notes and annotated rests retain the conservative rejection.
 if(refine)for(const n of doc.querySelectorAll('note[print-object="no"]'))if(child(n,'grace')&&child(n,'rest')&&!Number(text(n,'duration','0'))&&!n.querySelector('pitch,lyric,notations,tie'))n.remove();
 const parts=[...doc.querySelectorAll('score-partwise > part')];
 const info=parts.map(part=>{
  const definition=[...doc.querySelectorAll('score-part')].find(p=>p.id===part.id);
  const label=definition?.textContent||'';
  const clefs=[...part.querySelectorAll('attributes > clef')];
  const clef=s=>clefs.find(c=>(c.getAttribute('number')||'1')===s)?.querySelector('sign')?.textContent;
  const optional=/descant|ossia/i.test(label)||[...part.querySelectorAll('words')].some(n=>/optional descant/i.test(n.textContent));
  return {part,clef,optional,piano:/piano|pianoforte/i.test(label),grand:clef('1')==='G'&&clef('2')==='F',label};
 });
 const grand=info.filter(p=>p.grand&&!p.optional);
 let upper,lower;
 if(grand.length===1){upper={part:grand[0].part.id,staff:'1'};lower={part:upper.part,staff:'2'};}
 else if(!grand.length){
  const treble=info.filter(p=>!p.optional&&p.clef('1')==='G'),bass=info.filter(p=>!p.optional&&p.clef('1')==='F');
  const preferred=treble.filter(p=>p.piano),u=preferred.length===1?preferred:treble;
  if(u.length!==1||bass.length!==1)return fail('domain','No unique piano treble/bass pair');
  upper={part:u[0].part.id,staff:'1'};lower={part:bass[0].part.id,staff:'1'};
 }else return fail('domain','More than one piano grand staff');
 const main=parts.find(p=>p.id===upper.part);
 // Other simultaneous vocal lines cannot be inferred from accompaniment alone.
 const vocal=info.filter(p=>p.part.id!==upper.part&&p.part.id!==lower.part&&!p.optional&&p.part.querySelector('lyric'));
 if(vocal.length>1)return fail('competing','Multiple non-optional vocal parts; piano accompaniment does not establish a unique sung tune');
 if(doc.querySelector('transpose,staff-tuning,ossia,part-link,measure-style,unpitched,octave-shift,tremolo'))return fail('notation','Pitch-changing, condensed or tremolo notation requires review');
 if([...main.querySelectorAll('clef')].some(c=>(c.getAttribute('number')||'1')===upper.staff&&text(c,'sign')!=='G')||[...main.querySelectorAll('clef-octave-change')].some(n=>Number(n.textContent)))return fail('notation','Right-hand clef changes pitch interpretation');
 const groups=[],lengths=[];
 for(const part of parts){let divisions=1;
  for(const [mi,m] of children(part,'measure').entries()){let cursor=0,last=null,end=0;
   for(const n of m.children){
    if(n.localName==='attributes')divisions=Number(text(n,'divisions',String(divisions)));
    if(!(divisions>0))return fail('structure','Invalid divisions');
    const duration=Number(text(n,'duration','0'))/divisions;
    if(n.localName==='backup')cursor-=duration;
    if(n.localName==='forward')cursor+=duration;
    if(n.localName==='note'){
     if(child(n,'grace'))return fail('notation','Grace-note rhythmic ownership requires review');
     if(!(duration>0)||cursor< -eps)return fail('structure',`Invalid note timing at measure ${mi+1}`);
     const voice=text(n,'voice','1'),staff=text(n,'staff','1');
     if(child(n,'chord')){if(!last||last.voice!==voice||last.staff!==staff||Math.abs(last.duration-duration)>eps)return fail('structure',`Chord changes duration/voice/staff at measure ${mi+1}`);last.nodes.push(n);}
     else{last={part:part.id,staff,voice,mi,at:cursor,duration,nodes:[n]};groups.push(last);cursor+=duration;}
    }
    end=Math.max(end,cursor);
   }
   lengths[mi]=Math.max(lengths[mi]||0,end);
  }
 }
 const rh=groups.filter(g=>g.part===upper.part&&g.staff===upper.staff);
 // A single separate vocal lane may identify lyrics on the piano RH, but
 // never contributes notes. Require every lyric onset, bounded duration and chord-pitch
 // intersection to agree with exactly one RH voice across the entire score.
 if(refine&&!rh.some(g=>g.nodes.some(n=>child(n,'lyric')))&&vocal.length===1){
  const sung=groups.filter(g=>g.part===vocal[0].part.id&&g.nodes.some(n=>child(n,'lyric')));
  const lanes=new Set(sung.map(g=>g.staff+':'+g.voice));
  const matches=[...new Set(rh.map(g=>g.voice))].map(voice=>sung.map(g=>rh.filter(r=>r.voice===voice&&r.mi===g.mi&&Math.abs(r.at-g.at)<eps&&r.duration<=g.duration+eps&&r.nodes.some(n=>pitch(n)!==null&&g.nodes.some(v=>pitch(v)===pitch(n)))))).filter(rows=>rows.every(r=>r.length===1));
  if(lanes.size!==1||!sung.length||matches.length!==1)return fail('lyrics','Separate vocal lyrics do not align uniquely with a complete piano RH voice');
  matches[0].forEach(([g],i)=>{g.alignedPitches=sung[i].nodes.map(pitch);for(const l of children(sung[i].nodes.find(n=>child(n,'lyric')),'lyric'))g.nodes[0].append(l.cloneNode(true));});
 }
 const voices=[...new Set(rh.map(g=>g.voice))].map(voice=>({voice,lyrics:rh.filter(g=>g.voice===voice).reduce((s,g)=>s+g.nodes.filter(n=>child(n,'lyric')).length,0)})).sort((a,b)=>b.lyrics-a.lyrics);
 if(!voices[0]?.lyrics)return fail('lyrics','No principal lyric evidence on piano right hand');
 const primary=voices[0].voice;
 for(const other of voices.slice(1).filter(v=>v.lyrics>=voices[0].lyrics*.3)){
  const competition=rh.some(g=>g.voice===primary&&g.nodes.some(n=>child(n,'lyric'))&&rh.some(o=>o.voice===other.voice&&o.mi===g.mi&&Math.abs(o.at-g.at)<eps&&o.nodes.some(n=>lyric(n)&&!g.nodes.some(a=>lyric(a)===lyric(n)))));
  if(competition)return fail('competing',`Concurrent independent right-hand lyric voices ${primary} and ${other.voice}`);
 }
 // Cue/annotation-rejected scores may use the complete verified piano treble texture.
 // Keep original RH voices/chords and cue size instead of forcing one pitch.
 // Domain, notation and independent-lyric guards above still apply.
 if(retainTreble){
  const proof=rh.flatMap(g=>g.nodes.map((n,i)=>({part:g.part,staff:g.staff,voice:g.voice,measure:g.mi,at:g.at,duration:g.duration,pitch:pitch(n),rest:pitch(n)===null,sourceChordIndex:i}))).sort((a,b)=>a.measure-b.measure||a.at-b.at);
  for(const g of rh)for(const n of g.nodes){
   if(pitch(n)!==null&&!Number.isFinite(pitch(n)))return fail('structure',`Invalid RH pitch at measure ${g.mi+1}`);
   // MusicXML <cue> suppresses playback. These are intentional playable RH
   // alternatives: preserve their small notation while retaining their sound.
   if(child(n,'cue')){if(!child(n,'type'))return fail('structure','Cue note has no notated type');child(n,'type').setAttribute('size','cue');child(n,'cue').remove();}
  }
  // Optional parts contribute no notes to the projection. Retain only their
  // global tempo directions: some sources put the score's sole tempo above
  // the descant. Keep cursor carriers here so those timestamps stay exact.
  for(const p of info.filter(p=>p.optional))for(const n of p.part.querySelectorAll('measure > direction,measure > harmony,measure > sound')){
   if(!(n.matches('sound[tempo]')||n.querySelector('sound[tempo],metronome')))n.remove();
  }
  const annotationAdjustments=annotations?retainPairedRhSlurs(rh):[];
  return {ok:true,xml:new XMLSerializer().serializeToString(doc),proof,treble:true,...(annotationAdjustments.length?{annotationAdjustments}:{}),selection:{...upper,voice:primary,sourceVoices:voices.map(v=>v.voice),...(annotations?{rightHandTexture:true}:{}),evidence:'Verified piano RH treble texture; original voices, chords and cue-sized notes retained'}};
 }
 const line=[];
 for(const [mi,length] of lengths.entries()){
  let at=0;
  while(at<length-eps){
   const candidates=rh.filter(g=>g.mi===mi&&Math.abs(g.at-at)<eps);
   if(candidates.filter(g=>g.voice===primary).length>1)return fail('continuity',`Overlapping primary voice at measure ${mi+1}`);
   let g=candidates.find(g=>g.voice===primary);
   if(!g){const lyrical=candidates.filter(g=>g.nodes.some(n=>child(n,'lyric')));if(lyrical.length===1)g=lyrical[0];else if(candidates.length===1)g=candidates[0];}
   if(!g)return fail('continuity',`No unique right-hand continuation at measure ${mi+1}, beat ${at+1}`);
   if(refine&&g.nodes.every(n=>child(n,'rest'))){
    // Replace a principal-voice rest only with a unique complete RH phrase
    // that tiles that exact rest window. Never shorten a source note or rest.
    let end=at+g.duration;const paths=[];
    for(;;){const next=rh.find(o=>o.mi===mi&&o.voice===primary&&Math.abs(o.at-end)<eps&&o.nodes.every(n=>child(n,'rest')));if(!next)break;end+=next.duration;}
    for(const voice of new Set(rh.filter(o=>o.mi===mi&&o.voice!==primary).map(o=>o.voice))){
     const path=[];let cursor=at;
     while(cursor<end-eps){let found=rh.filter(o=>o.mi===mi&&o.voice===voice&&Math.abs(o.at-cursor)<eps&&o.at+o.duration<=end+eps&&o.nodes.every(n=>pitch(n)!==null&&!cue(n)));
      if(!found.length&&!rh.some(o=>o.mi===mi&&o.voice===voice&&o.at<=cursor+eps&&o.at+o.duration>cursor+eps&&o.nodes.some(n=>pitch(n)!==null)))found=rh.filter(o=>o.mi===mi&&o.voice===primary&&Math.abs(o.at-cursor)<eps&&o.at+o.duration<=end+eps&&o.nodes.every(n=>child(n,'rest')));
      if(found.length!==1)break;path.push(found[0]);cursor+=found[0].duration;}

     if(path.some(o=>o.voice!==primary)&&Math.abs(cursor-end)<eps)paths.push(path);
    }
    if(paths.length>1)return fail('continuity',`Competing RH instrumental handoffs at measure ${mi+1}`);
    if(paths.length===1){line.push(...paths[0]);at=end;continue;}
   }
   if(g.nodes.some(n=>child(n,'lyric')&&!child(n,'pitch')))return fail('lyrics',`Lyrics on a rest at measure ${mi+1}`);
   if(at===0&&Math.abs(g.duration-length)<eps&&g.nodes.every(n=>child(n,'rest'))&&rh.some(o=>o!==g&&o.mi===mi&&o.at<at+g.duration-eps&&o.at+o.duration>at+eps&&o.nodes.some(n=>child(n,'pitch')&&!cue(n))))return fail('continuity',`Primary RH rest overlaps another instrumental line at measure ${mi+1}; handoff needs review`);
   line.push(g);at+=g.duration;
  }
  if(Math.abs(at-length)>eps)return fail('continuity',`Right-hand measure ${mi+1} exceeds source duration`);
 }
 // Dynamic programming considers both previous and future chord choices. The
 // upper-tone prior is balanced by step/repeated-pitch continuity and exact tie
 // constraints; lyric absence never removes an event from the rhythmic line.
 // Later alternate endings can continue a tie from the common measure,
 // rather than from the preceding ending in document order. Only consecutive,
 // explicitly numbered ending branches are recognized; pitch must be forced
 // by the already viable common-predecessor states (never guessed).
 const endingPredecessors=new Map();
 if(refine){let common=null,lastEnd=-2,lastNumber=0;
  for(const [mi,m] of children(main,'measure').entries()){
   const start=m.querySelector('barline[location="left"] > ending[type="start"]');
   if(start){const numbers=(start.getAttribute('number')||'').split(',').map(n=>Number(n.trim()));
    if(numbers.includes(1)){common=line.findLastIndex(g=>g.mi===mi-1);lastNumber=Math.max(...numbers);}
    else if(common!==null&&common>=0&&lastEnd===mi-1&&numbers.every(n=>Number.isInteger(n)&&n>lastNumber)){endingPredecessors.set(mi,common);lastNumber=Math.max(...numbers);}
    else common=null;
   }
   if(m.querySelector('barline > ending[type="stop"],barline > ending[type="discontinue"]'))lastEnd=mi;
  }
 }
 const tieAdjustments=normalizeTies?normalizeRhTieBoundaries(line,primary,endingPredecessors):[];
 const layers=[];
 for(const [i,g] of line.entries()){
  if(new Set(g.nodes.map(lyric).filter(Boolean)).size>1)return fail('competing',`Different lyric texts within a right-hand chord at measure ${g.mi+1}`);
  const nodes=g.nodes.filter(n=>(pitch(n)!==null||child(n,'rest'))&&(!g.alignedPitches||g.alignedPitches.includes(pitch(n))));
  if((!g.alignedPitches&&nodes.length!==g.nodes.length)||nodes.some(n=>pitch(n)!==null&&!Number.isFinite(pitch(n))))return fail('structure',`Invalid pitch at measure ${g.mi+1}`);
  if(nodes.some(n=>child(n,'rest'))&&nodes.length>1)return fail('structure','Mixed rest and chord');
  const highest=Math.max(...nodes.map(n=>pitch(n)??-Infinity));
  const layer=nodes.map(n=>{
   const value=pitch(n),local=value===null?0:(highest-value)*.45;
   const stop=children(n,'tie').some(t=>t.getAttribute('type')==='stop');
   let best={cost:i?Infinity:stop?Infinity:local,previous:-1};
   for(const [j,prev] of (layers[i-1]||[]).entries()){
    const start=children(prev.node,'tie').some(t=>t.getAttribute('type')==='start'),a=pitch(prev.node);
    const predecessor=endingPredecessors.get(g.mi),branch=refine&&g.at===0&&stop&&!start&&predecessor!==undefined&&layers[predecessor]?.filter(e=>Number.isFinite(e.cost)).every(e=>pitch(e.node)===value&&children(e.node,'tie').some(t=>t.getAttribute('type')==='start'));
    if((start||stop)&&!(start&&stop&&a===value)&&!branch)continue;
    const distance=a===null||value===null?0:Math.abs(value-a);
    const motion=distance*.12+Math.max(0,distance-7)*.35-(distance===0&&value!==null?.65:0);
    const cost=prev.cost+local+motion+(line[i-1].voice===g.voice?0:1);
    if(cost<best.cost-eps)best={cost,previous:j};
   }
   return {node:n,...best};
  });
  if(layer.every(n=>!Number.isFinite(n.cost)))return fail('ties',`No continuous pitched tie path at measure ${g.mi+1}`);
  layers.push(layer);
 }
 let index=layers.at(-1).reduce((best,n,i,a)=>n.cost<a[best].cost?i:best,0);
 for(let i=line.length-1;i>=0;i--){line[i].chosen=layers[i][index].node;index=layers[i][index].previous;}
 if(children(line.at(-1).chosen,'tie').some(t=>t.getAttribute('type')==='start'))return fail('ties','Unclosed final melody tie');
 // Small RH notes are retained only as bounded same-voice pitch connectors.
 for(const [i,g] of line.entries())if(cue(g.chosen)){
  if(normalizeTies){
   const before=line[i-1],after=line[i+1];
   // Cue size cannot remove a verified sustained RH continuation. The actual
   // source event remains, even when its verse has no syllable or it is long.
   if(before&&before.voice===g.voice&&g.voice===primary&&pitch(before.chosen)===pitch(g.chosen)&&children(before.chosen,'tie').some(t=>t.getAttribute('type')==='start')&&children(g.chosen,'tie').some(t=>t.getAttribute('type')==='stop'))continue;
   // A single short pickup written in the established principal RH voice may
   // leap, rather than move by step. Both surrounding principal events must
   // be full-sized pitched notes within an octave; lyrics are not a filter.
   if(g.nodes.length===1&&g.duration<=1&&before&&after&&g.voice===primary&&before.voice===primary&&after.voice===primary&&!cue(before.chosen)&&!cue(after.chosen)&&[before,g,after].every(e=>pitch(e.chosen)!==null)&&Math.abs(pitch(before.chosen)-pitch(g.chosen))<=12&&Math.abs(pitch(after.chosen)-pitch(g.chosen))<=12)continue;
  }
  if(refine){
   let first=i,last=i;while(first&&cue(line[first-1].chosen)&&line[first-1].voice===primary)first--;while(last+1<line.length&&cue(line[last+1].chosen)&&line[last+1].voice===primary)last++;
   const run=line.slice(first,last+1),before=line[first-1],after=line[last+1];
   const anchored=run[0].nodes.some(n=>child(n,'lyric'))&&before?.voice===primary&&pitch(before.chosen)!==null&&Math.abs(pitch(run[0].chosen)-pitch(before.chosen))<=2;
   const closes=!after||(after.voice===primary&&(pitch(after.chosen)===null||Math.abs(pitch(after.chosen)-pitch(run.at(-1).chosen))<=2));
   if(run.length>1&&anchored&&closes&&run.every((e,j)=>e.voice===primary&&pitch(e.chosen)!==null&&(!j||Math.abs(pitch(e.chosen)-pitch(run[j-1].chosen))<=2)))continue;
   const measure=children(main,'measure')[g.mi],phrase=line.filter(e=>e.mi===g.mi);
   // A complete principal-voice cue phrase with lyrics in an explicit ending
   // is the written repeat melody, not a disconnected optional cue suggestion.
   const ending=measure.querySelector('barline[location="left"] > ending[type="start"]');
   if(ending&&phrase.every(e=>e.voice===primary&&cue(e.chosen)&&pitch(e.chosen)!==null)&&phrase.some(e=>e.nodes.some(n=>child(n,'lyric')))&&phrase.every((e,j)=>!j||Math.abs(pitch(e.chosen)-pitch(phrase[j-1].chosen))<=2))continue;
  }
  const before=line[i-1],after=line[i+1],a=before&&pitch(before.chosen),b=pitch(g.chosen),c=after&&pitch(after.chosen);
  if(a==null||b==null||c==null||before.voice!==g.voice||after.voice!==g.voice||g.duration>1||Math.abs(b-a)>2||Math.abs(c-b)>2)return fail('cue',`Unproven right-hand cue at measure ${g.mi+1}`);
 }
 if(refine){
  // Pair source RH slurs by musical time, not XML voice/document order. A
  // complete below-staff accompaniment pair may end on a melody chord anchor.
  // Keep melody pairs intact; never manufacture a replacement endpoint.
  const selected=new Map(line.map(g=>[g,g.chosen])),pending=new Map(),pairs=[];
  const marks=rh.flatMap(g=>g.nodes.flatMap(n=>[...n.querySelectorAll('notations > slur')].map(mark=>({g,n,mark})))).sort((a,b)=>a.g.mi-b.g.mi||a.g.at-b.g.at||(a.n===b.n?0:({stop:0,start:1,continue:2}[a.mark.getAttribute('type')])-({stop:0,start:1,continue:2}[b.mark.getAttribute('type')])));
  for(const e of marks){const number=e.mark.getAttribute('number')||'1',k=number+':'+e.g.voice,type=e.mark.getAttribute('type');
   if(type==='start'){if(pending.has(k))return fail('annotations',`Overlapping source RH slur ${number} in voice ${e.g.voice} at measure ${e.g.mi+1}`);pending.set(k,[e]);}
   else{const candidates=pending.has(k)?[k]:[...pending.keys()].filter(key=>key.startsWith(number+':'));
    if(candidates.length!==1)return fail('annotations',`Ambiguous source RH slur ${number} endpoint at measure ${e.g.mi+1}`);
    const owner=candidates[0];pending.get(owner).push(e);if(type==='stop'){pairs.push(pending.get(owner));pending.delete(owner);}
   }
  }
  if(pending.size)return fail('annotations','Unclosed source RH slur');
  for(const pair of pairs){const start=pair[0],end=pair.at(-1),above=start.mark.getAttribute('placement')==='above'||start.mark.getAttribute('orientation')==='over',below=start.mark.getAttribute('placement')==='below'||start.mark.getAttribute('orientation')==='under';
   const belongs=selected.has(start.g)&&(selected.get(start.g)===start.n||above);
   if(belongs){if(!pair.every(e=>selected.has(e.g)))return fail('annotations',`Melody slur leaves selected RH path at measure ${end.g.mi+1}`);}
   else{if(!below)return fail('annotations',`Uncertain source RH slur ownership at measure ${start.g.mi+1}`);for(const e of pair)e.mark.remove();}
  }
 }
 const slurs=new Map(),copies=[],proof=[];
 for(const g of line){
  const n=g.chosen,base=g.nodes[0],copy=n.cloneNode(true);child(copy,'chord')?.remove();child(copy,'cue')?.remove();
  let voice=child(copy,'voice');if(!voice){voice=doc.createElement('voice');copy.insertBefore(voice,child(copy,'type')||child(copy,'staff')||null);}voice.textContent='rh-melody';
  const order=['pitch','rest','duration','tie','voice','type','dot','accidental','time-modification','stem','notehead','staff','beam','notations','lyric'];
  for(const tag of ['time-modification','stem','beam'])if(!child(copy,tag))for(const mark of children(base,tag))copy.insertBefore(mark.cloneNode(true),[...copy.children].find(e=>order.indexOf(e.localName)>order.indexOf(tag))||null);
  const owner=g.nodes.find(a=>child(a,'lyric'));if(owner&&owner!==n){for(const l of children(copy,'lyric'))l.remove();for(const l of children(owner,'lyric'))copy.append(l.cloneNode(true));}
  const notation=()=>{let a=child(copy,'notations');if(!a){a=doc.createElement('notations');copy.insertBefore(a,child(copy,'lyric')||null);}return a;};
  for(const mark of copy.querySelectorAll('notations > slur'))mark.remove();
  for(const from of g.nodes){
   if(from!==n)for(const mark of from.querySelectorAll('notations > fermata,notations > tuplet'))if(!copy.querySelector('notations > '+mark.localName))notation().append(mark.cloneNode(true));
   for(const mark of from.querySelectorAll('notations > slur')){
    const k=mark.getAttribute('number')||'1',type=mark.getAttribute('type');
    if(type==='start'){
     if(slurs.has(k))return fail('annotations',`Overlapping slur ${k} at measure ${g.mi+1}`);
     const belongs=from===n||mark.getAttribute('placement')==='above'||mark.getAttribute('orientation')==='over';
     if(!belongs&&mark.getAttribute('placement')!=='below'&&mark.getAttribute('orientation')!=='under')return fail('annotations',`Uncertain chord slur ownership at measure ${g.mi+1}`);
     slurs.set(k,belongs);
    }else if(!slurs.has(k))return fail('annotations',`Unmatched slur ${k} at measure ${g.mi+1}`);
    if(slurs.get(k))notation().append(mark.cloneNode(true));
    if(type==='stop')slurs.delete(k);
   }
  }
  proof.push({part:g.part,staff:g.staff,voice:g.voice,measure:g.mi,at:g.at,duration:g.duration,pitch:pitch(n),rest:pitch(n)===null,sourceChordIndex:g.nodes.indexOf(n)});
  copies.push(copy);
 }
 if(slurs.size)return fail('annotations','Unclosed selected melody slur');
 // Remove optional parts and their directions. Other discarded notes stay in
 // this private intermediate XML to preserve cursor timing until projection.
 for(const p of info.filter(p=>p.optional)){p.part.remove();[...doc.querySelectorAll('score-part')].find(n=>n.id===p.part.id)?.remove();}
 for(const n of doc.querySelectorAll('note')){for(const l of children(n,'lyric'))l.remove();child(n,'cue')?.remove();if(child(n,'type')?.getAttribute('size')==='cue')child(n,'type').removeAttribute('size');}
 for(const [i,g] of line.entries()){g.nodes[0].replaceWith(copies[i]);for(const extra of g.nodes.slice(1))extra.remove();}
 return {ok:true,xml:new XMLSerializer().serializeToString(doc),proof,...(tieAdjustments.length?{tieAdjustments}:{}),selection:{...upper,voice:'rh-melody',sourceVoices:[...new Set(line.map(g=>g.voice))],evidence:'Piano right-hand domain; complete rhythmic line; chord continuity with upper-tone prior and exact ties'}};
}

// Fallback only: source RH events and a unique continuous principal voice take
// precedence over incomplete playback tie metadata. Slurs are never consulted.
// Ambiguous chord choices/voice changes retain the original strict tie guards.
function normalizeRhTieBoundaries(line,primary,endingPredecessors){
 const changes=[];
 const marks=(n,visual,type)=>visual?[...n.querySelectorAll('notations > tied')].filter(e=>e.getAttribute('type')===type):children(n,'tie').filter(e=>e.getAttribute('type')===type);
 const record=(g,n,action)=>changes.push({measure:g.mi+1,at:g.at,voice:g.voice,pitch:pitch(n),action});
 const remove=(g,n,visual,type)=>{for(const e of marks(n,visual,type)){e.remove();record(g,n,'omit-'+(visual?'visual':'playback')+'-'+type);}};
 const add=(g,n,type)=>{if(marks(n,false,type).length)return;const e=n.ownerDocument.createElement('tie');e.setAttribute('type',type);const duration=child(n,'duration');duration.after(e);record(g,n,'add-playback-'+type);};
 for(let i=1;i<line.length;i++){
  const right=line[i],branch=right.at===0?endingPredecessors.get(right.mi):undefined,left=line[branch??(i-1)];
  // The lane already tiles every measure. Require a unique, non-rest source
  // pitch at both ends of this boundary; no pitch selection or rhythm edits.
  if(left.voice!==primary||right.voice!==primary||left.part!==right.part||left.staff!==right.staff||left.nodes.length!==1||right.nodes.length!==1)continue;
  const a=left.nodes[0],b=right.nodes[0];if(pitch(a)===null||pitch(b)===null)continue;
  // Do not reinterpret conditional/let-ring/continuation tie notation.
  if([a,b].some(n=>[...n.querySelectorAll('tie,notations > tied')].some(t=>t.hasAttribute('time-only')||!['start','stop'].includes(t.getAttribute('type')))))continue;
  const soundStart=marks(a,false,'start').length,soundStop=marks(b,false,'stop').length,visualStart=marks(a,true,'start').length,visualStop=marks(b,true,'stop').length;
  if(!soundStart&&!soundStop&&!visualStart&&!visualStop)continue;
  if([soundStart,soundStop,visualStart,visualStop].some(count=>count>1))continue;
  const same=pitch(a)===pitch(b),visualPair=same&&visualStart&&visualStop,soundPair=same&&soundStart&&soundStop;
  if(visualPair){add(left,a,'start');add(right,b,'stop');}
  else if(soundPair){
   // Valid sounding sustain survives; an unmatched visual endpoint does not.
   remove(left,a,true,'start');remove(right,b,true,'stop');
  }else{
   // Keep both original notes, pitches and durations. An orphan endpoint (or
   // a pitch-changing alleged tie) cannot sustain this monophonic RH path.
   remove(left,a,false,'start');remove(right,b,false,'stop');
   remove(left,a,true,'start');remove(right,b,true,'stop');
  }
 }
 return changes;
}

// Preserve complete RH slurs in musical order, even across original voices.
// Source numbers may be reused in separate voices. Prefer a unique same-voice
// chain; a cross-voice endpoint is safe only with one possible open chain.
// An unmatched/ambiguous annotation is dispensable; its note never is.
function retainPairedRhSlurs(rh){
 const marks=rh.flatMap(g=>g.nodes.flatMap((n,index)=>[...n.querySelectorAll('notations > slur')].map(mark=>({g,n,index,mark})))).sort((a,b)=>a.g.mi-b.g.mi||a.g.at-b.g.at||({stop:0,continue:1,start:2}[a.mark.getAttribute('type')]??3)-({stop:0,continue:1,start:2}[b.mark.getAttribute('type')]??3));
 const pending=new Map(),keep=new Set();
 for(const e of marks){
  const number=e.mark.getAttribute('number')||'1',type=e.mark.getAttribute('type');
  if(!pending.has(number))pending.set(number,[]);
  const open=pending.get(number);
  if(type==='start'){open.push([e]);continue;}
  // Source system-break continuation anchors carry old engraving positions.
  // Retain the start/stop pair and let the renderer span its new systems.
  if(type!=='stop')continue;
  const same=open.filter(chain=>chain.at(-1).g.voice===e.g.voice),candidates=same.length?same:open;
  if(candidates.length!==1){
   // Do not guess which overlapping same-number start owns this endpoint.
   for(const chain of [...candidates])open.splice(open.indexOf(chain),1);
   continue;
  }
  const chain=candidates[0];chain.push(e);
  if(type==='stop'){for(const entry of chain)keep.add(entry.mark);open.splice(open.indexOf(chain),1);}
 }
 const changes=[];
 for(const e of marks)if(!keep.has(e.mark)){
  changes.push({part:e.g.part,staff:e.g.staff,voice:e.g.voice,measure:e.g.mi,at:e.g.at,pitch:pitch(e.n),sourceChordIndex:e.index,annotation:'slur',type:e.mark.getAttribute('type'),number:e.mark.getAttribute('number')||'1',action:e.mark.getAttribute('type')==='continue'?'omit-layout-continuation':'omit-unmatched-or-ambiguous'});
  e.mark.remove();
 }
 return changes;
}
