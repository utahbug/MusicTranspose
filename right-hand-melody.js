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

export function rightHandMelody(source){
 const doc=new DOMParser().parseFromString(source,'application/xml');
 if(doc.querySelector('parsererror'))return fail('structure','Invalid MusicXML');
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
 const voices=[...new Set(rh.map(g=>g.voice))].map(voice=>({voice,lyrics:rh.filter(g=>g.voice===voice).reduce((s,g)=>s+g.nodes.filter(n=>child(n,'lyric')).length,0)})).sort((a,b)=>b.lyrics-a.lyrics);
 if(!voices[0]?.lyrics)return fail('lyrics','No principal lyric evidence on piano right hand');
 const primary=voices[0].voice;
 for(const other of voices.slice(1).filter(v=>v.lyrics>=voices[0].lyrics*.3)){
  const competition=rh.some(g=>g.voice===primary&&g.nodes.some(n=>child(n,'lyric'))&&rh.some(o=>o.voice===other.voice&&o.mi===g.mi&&Math.abs(o.at-g.at)<eps&&o.nodes.some(n=>lyric(n)&&!g.nodes.some(a=>lyric(a)===lyric(n)))));
  if(competition)return fail('competing',`Concurrent independent right-hand lyric voices ${primary} and ${other.voice}`);
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
   if(g.nodes.some(n=>child(n,'lyric')&&!child(n,'pitch')))return fail('lyrics',`Lyrics on a rest at measure ${mi+1}`);
   if(at===0&&Math.abs(g.duration-length)<eps&&g.nodes.every(n=>child(n,'rest'))&&rh.some(o=>o!==g&&o.mi===mi&&o.at<at+g.duration-eps&&o.at+o.duration>at+eps&&o.nodes.some(n=>child(n,'pitch')&&!cue(n))))return fail('continuity',`Primary RH rest overlaps another instrumental line at measure ${mi+1}; handoff needs review`);
   line.push(g);at+=g.duration;
  }
  if(Math.abs(at-length)>eps)return fail('continuity',`Right-hand measure ${mi+1} exceeds source duration`);
 }
 // Dynamic programming considers both previous and future chord choices. The
 // upper-tone prior is balanced by step/repeated-pitch continuity and exact tie
 // constraints; lyric absence never removes an event from the rhythmic line.
 const layers=[];
 for(const [i,g] of line.entries()){
  if(new Set(g.nodes.map(lyric).filter(Boolean)).size>1)return fail('competing',`Different lyric texts within a right-hand chord at measure ${g.mi+1}`);
  const nodes=g.nodes.filter(n=>pitch(n)!==null||child(n,'rest'));
  if(nodes.length!==g.nodes.length||nodes.some(n=>pitch(n)!==null&&!Number.isFinite(pitch(n))))return fail('structure',`Invalid pitch at measure ${g.mi+1}`);
  if(nodes.some(n=>child(n,'rest'))&&nodes.length>1)return fail('structure','Mixed rest and chord');
  const highest=Math.max(...nodes.map(n=>pitch(n)??-Infinity));
  const layer=nodes.map(n=>{
   const value=pitch(n),local=value===null?0:(highest-value)*.45;
   const stop=children(n,'tie').some(t=>t.getAttribute('type')==='stop');
   let best={cost:i?Infinity:stop?Infinity:local,previous:-1};
   for(const [j,prev] of (layers[i-1]||[]).entries()){
    const start=children(prev.node,'tie').some(t=>t.getAttribute('type')==='start'),a=pitch(prev.node);
    if((start||stop)&&!(start&&stop&&a===value))continue;
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
  const before=line[i-1],after=line[i+1],a=before&&pitch(before.chosen),b=pitch(g.chosen),c=after&&pitch(after.chosen);
  if(a==null||b==null||c==null||before.voice!==g.voice||after.voice!==g.voice||g.duration>1||Math.abs(b-a)>2||Math.abs(c-b)>2)return fail('cue',`Unproven right-hand cue at measure ${g.mi+1}`);
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
 return {ok:true,xml:new XMLSerializer().serializeToString(doc),proof,selection:{...upper,voice:'rh-melody',sourceVoices:[...new Set(line.map(g=>g.voice))],evidence:'Piano right-hand domain; complete rhythmic line; chord continuity with upper-tone prior and exact ties'}};
}
