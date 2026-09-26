import {hymnMelody} from './hymn-melody.js';
import {songs as bundledSongs} from './songs.js';
// Conservative lead-sheet projection. The source XML is immutable; ambiguity
// returns it verbatim. Lyric ownership identifies a lane, never staff order.
const children=(e,name)=>[...e.children].filter(n=>n.localName===name);
const child=(e,name)=>children(e,name)[0];
const text=(e,name,fallback='')=>child(e,name)?.textContent.trim()??fallback;
const number=(e,name,fallback=0)=>Number(text(e,name,String(fallback)));
const lane=(part,n)=>[part,text(n,'staff','1'),text(n,'voice','1')].join(':');
const xml=e=>new XMLSerializer().serializeToString(e);
const epsilon=1e-7;
export const leadReasons={
 'no-melody':'No clearly identified melody line.',
 'multiple-lyrics':'More than one voice carries lyrics; the main melody needs review.',
 'chordal-melody':'The sung line is written as chords, so a single melody cannot be identified safely.',
 'cross-staff':'The candidate voice changes staff; its full melodic path is ambiguous.',
 'outside-cues':'Cue notes outside the melody need review before accompaniment can be removed.',
 'incomplete-line':'The candidate melody does not cover the complete measure rhythm.',
 'unsupported':'This score needs a structural review before creating a Lead view.',
 'rendering':'The generated Lead score could not be engraved safely.'
};
const hymnIds=new Set(bundledSongs.filter(s=>s.collection==='Hymns (1985)').map(s=>s.id));
// Eligibility comes from the bundled catalog, never a user-supplied title or
// imported collection label. Other collections keep the original extractor.
export function createLeadXML(source,context){
 const hymn=!context?.local&&hymnIds.has(context?.id);
 if(!hymn)return projectLeadXML(source);
 const melody=hymnMelody(source);
 if(!melody.ok)return {ok:false,xml:source,reason:melody.reason,detail:melody.detail,message:'This hymn needs a soprano review before creating Lead.'};
 const result=projectLeadXML(melody.xml,melody.accompanimentCueStaff);
 return result.ok?{...result,selection:melody.selection,melodyProof:melody.proof}:{...result,xml:source};
}
function projectLeadXML(source,accompanimentCueStaff=null){
 let selected=null;
 const fallback=(reason,detail='')=>({ok:false,xml:source,reason,message:leadReasons[reason],detail,selection:selected});
 try{
  const doc=new DOMParser().parseFromString(source,'application/xml');
  if(doc.querySelector('parsererror')||doc.documentElement.localName!=='score-partwise')return fallback('unsupported','Expected score-partwise MusicXML');
  const parts=children(doc.documentElement,'part'),lanes=new Map();
  for(const part of parts)for(const measure of children(part,'measure'))for(const note of children(measure,'note')){
   const key=lane(part.id,note);if(!lanes.has(key))lanes.set(key,[]);lanes.get(key).push(note);
  }
  const lyrical=[...lanes].filter(([,notes])=>notes.some(n=>child(n,'lyric')));
  if(lyrical.length>1)return fallback('multiple-lyrics',lyrical.map(([key])=>key).join(', '));
  if(!lyrical.length)return fallback('no-melody');
  const [key,notes]=lyrical[0],[partId,staff,voice]=key.split(':');selected={part:partId,staff,voice,evidence:'unique monophonic lyric-bearing lane'};
  if(!notes.some(n=>child(n,'pitch'))||notes.some(n=>child(n,'lyric')&&!child(n,'pitch')))return fallback('no-melody');
  if(notes.some(n=>child(n,'chord')))return fallback('chordal-melody');
  for(const [other,ns] of lanes)if(other!==key){
   const [p,s,v]=other.split(':');
   if(p===partId&&v===voice&&s!==staff&&ns.some(n=>child(n,'pitch')))return fallback('cross-staff');
   if(ns.some(n=>child(n,'cue')||child(n,'type')?.getAttribute('size')==='cue')&&!(accompanimentCueStaff?.part===p&&accompanimentCueStaff?.staff===s))return fallback('outside-cues',other);
  }
  // Transposing instruments, staff tuning and editorial ossias need explicit handling.
  if(doc.querySelector('transpose,staff-tuning,ossia,part-link,measure-style,unpitched'))return fallback('unsupported','Transposing/tuned/ossia/condensed or unpitched notation');
  const gcd=(a,b)=>b?gcd(b,a%b):a;let ticks=1;
  for(const d of doc.querySelectorAll('divisions')){const n=Number(d.textContent);if(!Number.isInteger(n)||n<=0)throw Error('Invalid divisions');ticks=ticks/gcd(ticks,n)*n;if(ticks>1000000)throw Error('Incompatible divisions');}
  const data=parts.map(part=>{
   let divisions=1;return {part,measures:children(part,'measure').map(measure=>{
    let cursor=0,last=0,end=0;const events=[];
    for(const node of measure.children){
     const tag=node.localName;
     if(tag==='attributes'){
      if(Math.abs(cursor)>epsilon)throw Error('Mid-measure attributes require review');
      divisions=number(node,'divisions',divisions);
     }
     if(tag==='backup'){cursor-=number(node,'duration')/divisions;if(cursor< -epsilon)throw Error('Negative cursor');continue;}
     if(tag==='forward'){cursor+=number(node,'duration')/divisions;end=Math.max(end,cursor);continue;}
     let at=cursor,duration=0;
     if(tag==='note'){
      duration=child(node,'grace')?0:number(node,'duration')/divisions;
      if(child(node,'chord'))at=last;else{last=cursor;cursor+=duration;}
      end=Math.max(end,at+duration,cursor);
     }else at+=number(node,'offset')/divisions;
     if(at< -epsilon)throw Error('Annotation before measure boundary');
     events.push({node,tag,at,duration,part:part.id,keep:tag==='note'&&lane(part.id,node)===key});
    }
    return {measure,events,end};
   })};
  });
  const chosen=data.find(p=>p.part.id===partId),count=chosen.measures.length;
  if(data.some(p=>p.measures.length!==count))throw Error('Parts have different measure counts');
  for(let mi=0;mi<count;mi++){const signatures=data.map(p=>p.measures[mi].events.filter(e=>e.tag==='attributes').flatMap(e=>children(e.node,'time')).map(e=>text(e,'beats')+'/'+text(e,'beat-type'))).flat();if(new Set(signatures).size>1)throw Error('Different meters between parts');}
  const result=doc.cloneNode(true),root=result.documentElement;
  for(const p of children(root,'part'))p.remove();
  const list=child(root,'part-list');for(const e of [...list.children])if(e.localName!=='score-part'||e.id!==partId)e.remove();
  for(const layout of result.querySelectorAll('defaults > system-layout, defaults > staff-layout'))layout.remove();
  const lead=result.createElement('part');lead.id=partId;root.append(lead);
  const make=(tag,value)=>{const e=result.createElement(tag);if(value!==undefined)e.textContent=String(value);return e;};
  const cleaned=node=>{
   const copy=result.importNode(node,true);
   // Fixed piano-page coordinates must not override new lead layout/timestamps.
   for(const e of [copy,...copy.querySelectorAll('*')]){
    if(e.closest('lyric'))continue;
    for(const a of ['default-x','default-y','relative-x','relative-y'])e.removeAttribute(a);
   }
   for(const e of children(copy,'staff'))e.textContent='1';
   for(const e of children(copy,'voice'))e.textContent='1';
   child(copy,'offset')?.remove();return copy;
  };
  const fingerprint=node=>{const copy=cleaned(node);for(const e of children(copy,'staff'))e.remove();for(const e of children(copy,'voice'))e.remove();return xml(copy).replace(/>\s+</g,'><');};
  for(let mi=0;mi<count;mi++){
   const original=chosen.measures[mi],all=data.map(p=>p.measures[mi]);
   if(all.some(m=>m.measure.getAttribute('number')!==original.measure.getAttribute('number')))throw Error('Measure numbering differs between parts');
   const duration=Math.max(...all.map(m=>m.end)),line=original.events.filter(e=>e.keep);
   let covered=0;
   for(const e of line){if(Math.abs(e.at-covered)>epsilon)return fallback('incomplete-line',`Measure ${original.measure.getAttribute('number')}`);covered=e.at+e.duration;}
   if(Math.abs(covered-duration)>epsilon)return fallback('incomplete-line',`Measure ${original.measure.getAttribute('number')}`);
   const measure=original.measure.cloneNode(false);measure.removeAttribute('width');lead.append(measure);
   // Keep selected-staff clef/key/time and all selected-part global attributes.
   const attrs=make('attributes');attrs.append(make('divisions',ticks));
   for(const event of original.events.filter(e=>e.tag==='attributes'))for(const a of event.node.children){
    if(['divisions','staves','part-symbol'].includes(a.localName))continue;
    if(a.hasAttribute('number')&&a.getAttribute('number')!==staff)continue;
    const copy=cleaned(a);if(copy.hasAttribute('number'))copy.setAttribute('number','1');attrs.append(copy);
   }
   // One staff is the projection, irrespective of its original staff number.
   measure.append(attrs);
   const events=[],seen=new Set(),barlines=new Map();let order=0;
   for(const m of [original,...all.filter(m=>m!==original)])for(const e of m.events){
    if(e.tag==='note'){if(e.keep)events.push({...e,copy:cleaned(e.node),order:order++});continue;}
    if(['attributes','print'].includes(e.tag))continue;
    if(e.tag==='barline'){
     const loc=e.node.getAttribute('location')||'right';
     const semantics=n=>[...n.children].map(c=>[c.localName,...['direction','times','number','type'].map(a=>c.getAttribute(a)||''),c.textContent.trim()].join(':')).join('|');
     const f=semantics(e.node);
     if(barlines.has(loc)&&barlines.get(loc).fingerprint!==f)throw Error('Conflicting barlines/endings between parts');
     if(!barlines.has(loc))barlines.set(loc,{copy:cleaned(e.node),fingerprint:f});continue;
    }
    if(!['direction','harmony','sound'].includes(e.tag))throw Error('Unsupported measure element: '+e.tag);
    if(e.node.querySelector('octave-shift,scordatura'))throw Error('Staff-specific pitch direction needs review');
    const stamp=e.at.toFixed(7)+':'+fingerprint(e.node);if(seen.has(stamp))continue;seen.add(stamp);
    const copy=cleaned(e.node);events.push({...e,copy,order:order++});
   }
   if(barlines.has('left'))measure.append(barlines.get('left').copy);
   let cursor=0;
   const move=at=>{const delta=at-cursor;if(Math.abs(delta)>epsilon){const e=make(delta>0?'forward':'backup');e.append(make('duration',Math.abs(delta)*ticks));measure.append(e);cursor=at;}};
   // At shared onsets directions/chords precede notes; grace-note source order stays intact.
   events.sort((a,b)=>a.at-b.at||(a.tag==='note')-(b.tag==='note')||a.order-b.order);
   for(const e of events){
    if(e.tag==='note'){move(e.at);if(child(e.copy,'duration'))child(e.copy,'duration').textContent=String(e.duration*ticks);cursor+=e.duration;}
    else if(e.tag==='harmony'){move(e.at);}
    else if(Math.abs(e.at-cursor)>epsilon){const offset=make('offset',(e.at-cursor)*ticks);const before=[...e.copy.children].find(n=>['footnote','level','voice','staff','sound','listening'].includes(n.localName));e.copy.insertBefore(offset,before||null);}
    measure.append(e.copy);
   }
   move(duration);
   if(barlines.has('middle'))throw Error('Mid-measure barline needs review');
   if(barlines.has('right'))measure.append(barlines.get('right').copy);
  }
  const serialized=xml(result);
  return {ok:true,xml:serialized.startsWith('<?xml')?serialized:'<?xml version="1.0" encoding="utf-8"?>\n'+serialized,reason:null,message:'Lead',selection:selected,measures:count,notes:notes.length};
 }catch(error){return fallback('unsupported',error.message);}
}

// OSMD reads only the first root/kind group of a stacked MusicXML harmony.
// Split only the engraving copy into simultaneous chords; the derived score
// and transposition pipeline retain the original structured harmony groups.
export function leadEngravingXML(source){
 const doc=new DOMParser().parseFromString(source,'application/xml');let changed=false;
 for(const harmony of [...doc.querySelectorAll('harmony')]){
  if(children(harmony,'root').length<2)continue;
  const groups=[];let group=null;
  for(const node of harmony.children){if(node.localName==='root'){group=[];groups.push(group);}if(group&&['root','kind','inversion','bass','degree'].includes(node.localName))group.push(node);}
  [...groups].reverse().forEach((nodes,i)=>{const copy=harmony.cloneNode(true);for(const node of [...copy.children])if(['root','kind','inversion','bass','degree'].includes(node.localName))node.remove();const first=copy.firstChild;for(const node of nodes)copy.insertBefore(node.cloneNode(true),first);copy.setAttribute('music-transpose-stack','true');harmony.before(copy);});
  harmony.remove();changed=true;
 }
 return changed?xml(doc):source;
}

export function installLeadHarmony(OSMD){
 const reader=OSMD.ChordSymbolReader,factory=OSMD.VexFlowGraphicalSymbolFactory.prototype;
 if(reader.musicTransposeLead)return;reader.musicTransposeLead=true;
 const read=reader.readChordSymbol,create=factory.createChordSymbols;
 reader.readChordSymbol=function(node,...args){const result=read.call(this,node,...args);if(result&&node.attribute('music-transpose-stack')?.value==='true')result.musicTransposeStack=true;return result;};
 factory.createChordSymbols=function(source,entry,...args){
  create.call(this,source,entry,...args);
  const stack=entry.graphicalChordContainers.filter(c=>c.GetChordSymbolContainer.musicTransposeStack);
  if(stack.length<2)return;
  // One native multiline label reserves the maximum line width and full stack
  // height. Separate chord containers would be spread horizontally by OSMD.
  const first=stack[0],label=first.GraphicalLabel;
  label.rules.SpacingBetweenTextLines=Math.max(label.rules.SpacingBetweenTextLines,3);
  label.Label.text=[...stack].reverse().map(c=>c.GraphicalLabel.Label.text).join('\n');
  label.setLabelPositionAndShapeBorders();first.PositionAndShape.calculateBoundingBox();
  for(const extra of stack.slice(1)){
   entry.graphicalChordContainers.splice(entry.graphicalChordContainers.indexOf(extra),1);
   const siblings=extra.PositionAndShape.Parent.ChildElements,index=siblings.indexOf(extra.PositionAndShape);if(index>=0)siblings.splice(index,1);
  }
 };
}
