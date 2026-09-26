// Hymns (1985) only: project the structurally identified upper lyric voice.
// Collection authorization is supplied separately by the bundled catalog.
const children=(e,name)=>[...e.children].filter(n=>n.localName===name);
const child=(e,name)=>children(e,name)[0];
const text=(e,name,fallback='')=>child(e,name)?.textContent.trim()??fallback;
const pitch=n=>{const p=child(n,'pitch');return p?12*(Number(text(p,'octave'))+1)+{C:0,D:2,E:4,F:5,G:7,A:9,B:11}[text(p,'step')]+Number(text(p,'alter','0')):null;};
const fail=(reason,detail)=>({ok:false,reason:'hymn-'+reason,detail});
const eps=1e-7;
export function hymnMelody(source){
 const doc=new DOMParser().parseFromString(source,'application/xml'),parts=[...doc.querySelectorAll('score-partwise > part')];
 if(doc.querySelector('parsererror')||!parts.length)return fail('structure','Invalid partwise MusicXML');
 if(doc.querySelector('grace,unpitched,transpose,staff-tuning,ossia,part-link,measure-style,octave-shift,tremolo'))return fail('notation','Grace, octave-shift or other unusual notation requires review');
 if([...doc.querySelectorAll('clef-octave-change')].some(n=>Number(n.textContent)!==0))return fail('notation','Octave-transposing clef requires review');
 if([...doc.querySelectorAll('words')].some(n=>/divisi|div[.]|ossia|solo|unison.*optional/i.test(n.textContent)))return fail('notation','Divisi/solo/ossia indication');
 // Full-size cue markers may belong to lower accompaniment.
 // A small upper note must separately prove a sung-to-sung connector below.
 const cueNotes=[...doc.querySelectorAll('note')].filter(n=>child(n,'cue')||child(n,'type')?.getAttribute('size')==='cue'||n.getAttribute('type')==='cue');
 const smallConnectors=cueNotes.filter(n=>n.closest('part')===parts[0]&&text(n,'staff','1')==='1'&&!child(n,'cue')&&child(n,'pitch')&&!child(n,'lyric')&&child(n,'type')?.getAttribute('size')==='cue');
 if(cueNotes.some(n=>!smallConnectors.includes(n)&&(!child(n,'cue')||!child(n,'pitch')||child(n,'type')?.getAttribute('size')!=='full')))return fail('notation','Small, rest or unclassified cue notation requires review');
 const staves=parts.map(p=>Math.max(1,...[...p.querySelectorAll('staves')].map(n=>Number(n.textContent))));
 const clef=(p,staff)=>[...p.querySelectorAll('attributes > clef')].find(c=>(c.getAttribute('number')||'1')===staff)?.querySelector('sign')?.textContent;
 let upper,lower;
 if(parts.length===1&&staves[0]===2&&clef(parts[0],'1')==='G'&&clef(parts[0],'2')==='F'){upper={part:parts[0].id,staff:'1'};lower={part:parts[0].id,staff:'2'};}
 else if(parts.length===2&&staves.every(s=>s===1)&&clef(parts[0],'1')==='G'&&clef(parts[1],'1')==='F'){upper={part:parts[0].id,staff:'1'};lower={part:parts[1].id,staff:'1'};}
 else return fail('structure','Requires two staves in upper G / lower F order');
 // Actual cue markers are allowed only in identified lower accompaniment.
 // They never enter the selected soprano; all timing, lyrics, divisi and
 // crossing checks below still apply. Only verified small connectors may be upper.
 if(cueNotes.some(n=>!smallConnectors.includes(n)&&(n.closest('part').id!==lower.part||text(n,'staff','1')!==lower.staff)))return fail('notation','Upper-staff cue or cue-size notation requires review');

 const groups=[],lengths=[];
 for(const part of parts){let divisions=1;const measures=children(part,'measure');
  for(const [mi,measure] of measures.entries()){let cursor=0,last=null,end=0;
   for(const n of measure.children){
    if(n.localName==='attributes'){divisions=Number(text(n,'divisions',String(divisions)));if(!(divisions>0))return fail('structure','Invalid divisions');}
    if(n.localName==='backup')cursor-=Number(text(n,'duration'))/divisions;
    if(n.localName==='forward')cursor+=Number(text(n,'duration'))/divisions;
    if(n.localName!=='note'){end=Math.max(end,cursor);continue;}
    const duration=Number(text(n,'duration'))/divisions,staff=text(n,'staff','1'),voice=text(n,'voice','1');
    if(!(duration>0)||cursor< -eps)return fail('structure','Invalid note timing');
    if(child(n,'chord')){if(!last||last.voice!==voice||last.staff!==staff||Math.abs(last.duration-duration)>eps)return fail('divisi','Chord changes voice, staff or duration');last.nodes.push(n);}
    else{last={part:part.id,staff,voice,mi,at:cursor,duration,nodes:[n]};groups.push(last);cursor+=duration;}
    end=Math.max(end,cursor);
   }
   lengths[mi]=Math.max(lengths[mi]||0,end);
  }
 }
 const starts=[];let total=0;for(const n of lengths){starts.push(total);total+=n;}
 for(const g of groups){g.start=starts[g.mi]+g.at;g.end=g.start+g.duration;g.pitches=g.nodes.map(pitch).filter(p=>p!==null);if(g.nodes.length>2||g.nodes.length>1&&(g.pitches.length!==g.nodes.length||new Set(g.pitches).size!==g.pitches.length))return fail('divisi','More than two pitches or mixed rest/chord');}
 if(groups.some(g=>!((g.part===upper.part&&g.staff===upper.staff)||(g.part===lower.part&&g.staff===lower.staff))))return fail('structure','Unexpected staff number');
 if(groups.some(g=>g.pitches.some(p=>!Number.isFinite(p))||new Set(g.nodes.map(n=>text(n,'stem')).filter(Boolean)).size>1))return fail('divisi','Invalid pitch or conflicting chord stems');
 const lane=g=>g.part+':'+g.staff+':'+g.voice,isUpper=g=>g.part===upper.part&&g.staff===upper.staff;
 const lyricGroups=groups.filter(g=>g.nodes.some(n=>child(n,'lyric')));
 if(!lyricGroups.length||lyricGroups.some(g=>!isUpper(g)))return fail('lyrics','Lyrics outside the upper staff or no soprano lyrics');
 const owners=[...new Set(lyricGroups.map(lane))],candidates=groups.filter(g=>owners.includes(lane(g))).sort((a,b)=>a.start-b.start);
 // Permit an actual, non-overlapping voice-number handoff. Concurrent lyrical
 // lanes remain ambiguous even when they happen to carry the same words.
 let end=0;
 for(const g of candidates){if(Math.abs(g.start-end)>eps)return fail('voices','Lyric voice has a gap, overlap or competing voice');end=g.end;}
 if(Math.abs(end-total)>eps)return fail('voices','Soprano does not cover the full score');
 for(const staff of [upper,lower]){
  const pitched=groups.filter(g=>g.part===staff.part&&g.staff===staff.staff&&g.pitches.length);
  for(const g of pitched){const count=pitched.filter(a=>a.start<=g.start+eps&&a.end>g.start+eps).reduce((n,a)=>n+a.pitches.length,0);if(count>2)return fail('divisi','More than two concurrent pitches on a staff');}
 }
 for(const g of candidates){g.chosen=g.nodes.reduce((a,n)=>(pitch(n)??-Infinity)>(pitch(a)??-Infinity)?n:a,g.nodes[0]);const top=pitch(g.chosen);
  if(g.nodes.filter(n=>child(n,'lyric')).length>1)return fail('lyrics','Competing lyrics within a chord');
  if(top===null){if(g.nodes.some(n=>child(n,'lyric')))return fail('lyrics','Lyrics on a rest');continue;}
  for(const other of groups.filter(n=>isUpper(n)&&!owners.includes(lane(n))&&n.start<g.end-eps&&n.end>g.start+eps))if(other.pitches.some(p=>p>top))return fail('crossing','Another upper-staff voice crosses above the identified soprano');
 }
 // Preserve a short, explicitly notated passing note in the SAME soprano
 // voice. Both neighboring groups must carry lyrics, with stepwise motion
 // through this note. Never fill a soprano rest from another voice/staff.
 for(const note of smallConnectors){
  const i=candidates.findIndex(g=>g.chosen===note),g=candidates[i],before=candidates[i-1],after=candidates[i+1];
  if(!g||g.nodes.length!==1||!before||!after||before.voice!==g.voice||after.voice!==g.voice||!before.nodes.some(n=>child(n,'lyric'))||!after.nodes.some(n=>child(n,'lyric'))||g.duration>1+eps)return fail('notation','Small note is not a bounded same-voice sung connector');
  const a=pitch(before.chosen),b=pitch(note),c=pitch(after.chosen),left=b-a,right=c-b;
  if(a===null||c===null||left*right<=0||Math.abs(left)>2||Math.abs(right)>2)return fail('notation','Small note has ambiguous melodic continuity');
 }
 // Slurs attached to a chord anchor may describe either voice of that chord.
 // Transfer only explicitly upper slurs; never transfer an alto tie/fingering.
 const upperSlurs=new Set(),activeSlurs=new Map();
 for(const g of candidates){
  const slurs=g.nodes.flatMap(n=>[...n.querySelectorAll('notations > slur')].map(mark=>({n,mark}))).sort((a,b)=>(a.mark.getAttribute('type')==='start')-(b.mark.getAttribute('type')==='start'));
  for(const {n,mark} of slurs){const key=mark.getAttribute('number')||'1',type=mark.getAttribute('type');
   if(type==='start'){
    if(activeSlurs.has(key))return fail('annotations','Conflicting slur numbers');
    const upper=n===g.chosen||mark.getAttribute('placement')==='above'||mark.getAttribute('orientation')==='over';
    if(!upper&&mark.getAttribute('placement')!=='below'&&mark.getAttribute('orientation')!=='under')return fail('annotations','Slur on discarded chord tone has no clear ownership');
    activeSlurs.set(key,upper);if(upper)upperSlurs.add(mark);
   }else{
    if(!activeSlurs.has(key))return fail('annotations','Slur endpoint has no matching start in the selected voice');
    if(activeSlurs.get(key))upperSlurs.add(mark);if(type==='stop')activeSlurs.delete(key);
   }
  }
 }
 if(activeSlurs.size)return fail('annotations','Unclosed slur in the selected voice');
 const ties=new Map();const proof=[];
 for(const g of candidates){const n=g.chosen,base=g.nodes[0],copy=n.cloneNode(true),value=pitch(n);child(copy,'chord')?.remove();
  let voice=child(copy,'voice');if(!voice){voice=doc.createElement('voice');copy.insertBefore(voice,child(copy,'type')||child(copy,'staff')||null);}voice.textContent='hymn-lead';
  const order=['pitch','rest','duration','tie','voice','type','dot','accidental','time-modification','stem','notehead','staff','beam','notations','lyric'];
  for(const tag of ['time-modification','stem','beam'])if(!child(copy,tag))for(const mark of children(base,tag))copy.insertBefore(mark.cloneNode(true),[...copy.children].find(e=>order.indexOf(e.localName)>order.indexOf(tag))||null);
  const owner=g.nodes.find(n=>child(n,'lyric'));if(owner&&owner!==n)for(const lyric of children(owner,'lyric'))copy.append(lyric.cloneNode(true));
  const notation=()=>{let node=child(copy,'notations');if(!node){node=doc.createElement('notations');copy.insertBefore(node,child(copy,'lyric')||null);}return node;};
  for(const mark of copy.querySelectorAll('notations > slur'))mark.remove();
  for(const from of g.nodes){
   for(const slur of from.querySelectorAll('notations > slur'))if(upperSlurs.has(slur)&&!copy.querySelector('notations > slur[number="'+(slur.getAttribute('number')||'1')+'"][type="'+slur.getAttribute('type')+'"]'))notation().append(slur.cloneNode(true));
   for(const mark of from.querySelectorAll('notations > fermata,notations > articulations,notations > tuplet'))if(!copy.querySelector('notations > '+mark.localName))notation().append(mark.cloneNode(true));
   if(from!==n&&from.querySelector('notations > ornaments'))return fail('annotations','Ornament attached to discarded chord tone');
  }
  const kinds=children(n,'tie').map(t=>t.getAttribute('type'));
  if(kinds.includes('stop')){if(!ties.has(value)||Math.abs(ties.get(value)-g.start)>eps)return fail('ties','Soprano tie stop has no matching pitched start');ties.delete(value);}
  if(kinds.includes('start'))ties.set(value,g.end);
  proof.push({part:g.part,staff:g.staff,voice:g.voice,measure:g.mi,at:g.at,duration:g.duration,pitch:value,rest:value===null,sourceChordIndex:g.nodes.indexOf(n)});
  base.replaceWith(copy);for(const extra of g.nodes.slice(1))extra.remove();
 }
 if(ties.size)return fail('ties','Soprano tie start has no matching stop');
 return {ok:true,accompanimentCueStaff:cueNotes.some(n=>!smallConnectors.includes(n))?lower:null,xml:new XMLSerializer().serializeToString(doc),selection:{...upper,voice:'hymn-lead',sourceVoices:owners,...(smallConnectors.length?{continuation:{kind:'same-voice sung connector',count:smallConnectors.length}}:{}),evidence:'Hymns (1985): continuous upper lyric voice; at most two tones; no upper crossing'},proof};
}
