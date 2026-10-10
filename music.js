import {transposeChordDirections} from './chord-symbol.js';
// Conventional spelling for each destination pitch class; keep the source spelling at 0.
const MAJOR_KEYS = [
 {name:'C',fifths:0},{name:'D♭',fifths:-5},{name:'D',fifths:2},
 {name:'E♭',fifths:-3},{name:'E',fifths:4},{name:'F',fifths:-1},
 {name:'G♭',fifths:-6},{name:'G',fifths:1},{name:'A♭',fifths:-4},
 {name:'A',fifths:3},{name:'B♭',fifths:-2},{name:'B',fifths:5}
];
const SOURCE_NAMES=['C♭','G♭','D♭','A♭','E♭','B♭','F','C','G','D','A','E','B','F♯','C♯'];
const mod=(n,d)=>((n%d)+d)%d;
const MINOR_KEYS=[{name:'C',fifths:-3},{name:'C♯',fifths:4},{name:'D',fifths:-1},{name:'E♭',fifths:-6},{name:'E',fifths:1},{name:'F',fifths:-4},{name:'F♯',fifths:3},{name:'G',fifths:-2},{name:'G♯',fifths:5},{name:'A',fifths:0},{name:'B♭',fifths:-5},{name:'B',fifths:2}];
const MINOR_NAMES=['A♭','E♭','B♭','F','C','G','D','A','E','B','F♯','C♯','G♯','D♯','A♯'];
export function originalKey(xml,modeOverride){
 const doc=typeof xml==='string'?parseXML(xml):xml;
 const declarations=[...doc.querySelectorAll('attributes > key')];
 if(!declarations.length)throw new Error('The score needs an explicit key signature.');
 const fifths=Number(declarations[0].querySelector('fifths')?.textContent);
 if(!Number.isInteger(fifths)||fifths< -7||fifths>7||!declarations[0].querySelector('fifths'))throw new Error('Unsupported key signature.');
 const declared=declarations[0].querySelector('mode')?.textContent.trim()||'major',mode=modeOverride||declared;
 if(!['major','minor'].includes(mode)||declarations.some(k=>!k.querySelector('fifths')||!Number.isInteger(Number(k.querySelector('fifths').textContent))||Math.abs(Number(k.querySelector('fifths').textContent))>7||(k.querySelector('mode')?.textContent.trim()||'major')!==declared))throw new Error('Unsupported or inconsistent key signatures; modulations require review.');
 if(declarations.some(k=>Number(k.querySelector('fifths').textContent)!==fifths))validateModulation(doc,declared,modeOverride);
 return {name:(mode==='minor'?MINOR_NAMES:SOURCE_NAMES)[fifths+7],mode,fifths,pc:mod(7*fifths+(mode==='minor'?9:0),12)};
}
// Bounded support: conventional, same-mode keys at aligned bar starts in every
// part. Reject mid-bar, polymetric, staff-specific and transposing-instrument
// cases instead of silently treating them as a shared concert-key timeline.
function validateModulation(doc,mode,modeOverride){
 const fail=()=>{throw new Error('Unsupported key-change alignment; modulations require review.');};
 if(modeOverride&&modeOverride!==mode||doc.querySelector('transpose, key-step, key-alter, key-octave, key[number]'))fail();
 const parts=[...doc.querySelectorAll('score-partwise > part')];if(!parts.length)fail();
 let reference;
 for(const part of parts){
  let divisions=1,current=null;const timeline=[];
  for(const measure of [...part.children].filter(n=>n.localName==='measure')){
   let cursor=0,end=0,started=false;
   for(const node of measure.children){
    if(node.localName==='attributes'){
     divisions=Number(node.querySelector('divisions')?.textContent||divisions);if(!(divisions>0))fail();
     const keys=[...node.querySelectorAll(':scope > key')];if(keys.length>1)fail();
     for(const k of keys){
      if(started||cursor!==0)fail();
      const cancel=k.querySelector('cancel');if(cancel&&(current===null||Number(cancel.textContent)!==current))fail();
      current=Number(k.querySelector('fifths').textContent);
     }
    }
    if(['note','forward','backup'].includes(node.localName)){
     started=true;const duration=Number(node.querySelector('duration')?.textContent||0)/divisions;
     if(!Number.isFinite(duration)||duration<0)fail();
     if(node.localName==='backup')cursor-=duration;
     else if(node.localName==='forward'||!node.querySelector('chord,grace'))cursor+=duration;
     if(cursor< -1e-7)fail();end=Math.max(end,cursor);
    }
   }
   if(current===null||end<=0)fail();timeline.push([current,end]);
  }
  if(reference&&(reference.length!==timeline.length||reference.some((r,i)=>r[0]!==timeline[i][0]||Math.abs(r[1]-timeline[i][1])>1e-7)))fail();reference=timeline;
 }
}
export const originalMajor=originalKey; // Compatibility for earlier acceptance fixtures.
export function buildKeys(source){
 const origin=typeof source==='number'?{name:SOURCE_NAMES[source+7],fifths:source,pc:mod(7*source,12)}:source;
 if(!origin.name)throw new Error('Unsupported original key.');
 const tone=name=>NATURAL[LETTERS.indexOf(name[0])]+(name.includes('♭')?-1:name.includes('♯')?1:0);
 return Array.from({length:13},(_,i)=>{
  const shift=i-6;if(!shift)return {...origin,shift:0,diatonic:0};
  const target=(origin.mode==='minor'?MINOR_KEYS:MAJOR_KEYS)[mod(origin.pc+shift,12)];
  const octave=(shift-(tone(target.name)-tone(origin.name)))/12;
  const diatonic=LETTERS.indexOf(target.name[0])-LETTERS.indexOf(origin.name[0])+octave*7;
  return {...target,mode:origin.mode||'major',shift,diatonic};
 });
}
export const signature = k => k.fifths > 0 ? '♯'.repeat(k.fifths) : k.fifths < 0 ? '♭'.repeat(-k.fifths) : '—';
export function parseXML(xml){const d=new DOMParser().parseFromString(xml,'application/xml');if(d.querySelector('parsererror'))throw new Error('The MusicXML could not be read.');return d;}
const LETTERS='CDEFGAB', NATURAL=[0,2,4,5,7,9,11];
function alterChild(parent,tag,value,after){let a=parent.querySelector(':scope > '+tag);if(!value){a?.remove();return;}if(!a){a=parent.ownerDocument.createElement(tag);after.after(a);}a.textContent=String(value);}
export function transposeXML(original,shift,modeOverride){
 const doc=parseXML(original),source=originalKey(doc,modeOverride);
 const key=buildKeys(source).find(k=>k.shift===shift);if(!key)throw new Error('Outside this score’s practical key range.');
 if(shift===0)return original;
 const signatures=[...doc.querySelectorAll('attributes > key')],delta=key.fifths-source.fifths;
 const modulating=signatures.some(k=>Number(k.querySelector('fifths').textContent)!==source.fifths);
 // One diatonic interval for notes and harmonies; the same circle-of-fifths
 // displacement for every local key preserves modulation and spelling.
 for(const k of signatures){
  const fifths=Number(k.querySelector('fifths').textContent)+delta;
  if(Math.abs(fifths)>7)throw new Error('A local key exceeds the supported signature range.');
  k.querySelector('fifths').textContent=String(fifths);
  if(modulating){const cancel=k.querySelector('cancel');if(cancel){const value=Number(cancel.textContent)+delta;if(value)cancel.textContent=String(value);else cancel.remove();}}
  let mode=k.querySelector('mode');if(!mode){mode=doc.createElement('mode');k.append(mode);}mode.textContent=source.mode;
 }
 for(const pitch of doc.querySelectorAll('note > pitch')){
  const step=pitch.querySelector('step'),oct=pitch.querySelector('octave');const index=LETTERS.indexOf(step.textContent),o=Number(oct.textContent),a=Number(pitch.querySelector('alter')?.textContent||0);
  const abs=o*7+index+key.diatonic,no=Math.floor(abs/7),ni=((abs%7)+7)%7;
  const midi=(o+1)*12+NATURAL[index]+a+shift,na=midi-((no+1)*12+NATURAL[ni]);
  step.textContent=LETTERS[ni];oct.textContent=String(no);alterChild(pitch,'alter',na,step);
 }
 // Use the same diatonic destination interval as pitched notes, retaining
 // chromatic alterations instead of forcing every chord to sharps or flats.
 const transposePitch=(step,alter)=>{
  const i=LETTERS.indexOf(step),ni=mod(i+key.diatonic,7);
  let next=mod(NATURAL[i]+alter+shift-NATURAL[ni],12);if(next>6)next-=12;
  return {step:LETTERS[ni],alter:next};
 };
 for(const node of doc.querySelectorAll('harmony > root, harmony > bass')){
  const type=node.localName,step=node.querySelector(type+'-step');if(!step)continue;
  const next=transposePitch(step.textContent,Number(node.querySelector(type+'-alter')?.textContent||0));
  step.textContent=next.step;alterChild(node,type+'-alter',next.alter,step);
 }
 transposeChordDirections(doc,transposePitch);
 // Let the engraver recalculate visible accidentals against the new signature.
 for(const a of doc.querySelectorAll('note > accidental'))a.remove();
 return new XMLSerializer().serializeToString(doc);
}
export function unpackMXL(bytes){const zip=fflate.unzipSync(new Uint8Array(bytes));const container=zip['META-INF/container.xml'];if(!container)throw new Error('Missing MXL container.');const d=parseXML(fflate.strFromU8(container));const entry=[...d.getElementsByTagName('rootfile')].find(x=>x.getAttribute('media-type')==='application/vnd.recordare.musicxml+xml');if(!entry||!zip[entry.getAttribute('full-path')])throw new Error('Missing MusicXML score.');return fflate.strFromU8(zip[entry.getAttribute('full-path')]);}

// Register is independent of key transposition. Limit changes to pitched notes;
// harmony, rests, percussion, clefs and all attached notation remain untouched.
export function shiftOctaveXML(xml,octaves){
 if(!Number.isInteger(octaves)||Math.abs(octaves)>1)throw new Error('Octave offset must be -1, 0 or +1.');
 if(octaves===0)return xml;
 const doc=parseXML(xml);
 for(const octave of doc.querySelectorAll('note > pitch > octave')){
  const value=Number(octave.textContent)+octaves;
  if(!Number.isInteger(value)||value<0||value>9)throw new Error('This score exceeds the supported pitch register.');
  octave.textContent=String(value);
 }
 return new XMLSerializer().serializeToString(doc);
}
