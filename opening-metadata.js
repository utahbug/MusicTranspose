import {parseChordSymbol} from './chord-symbol.js';
// Opening directions only. Source XML for playback/print is never modified.
const beats={whole:'𝅝',half:'𝅗𝅥',quarter:'♩',eighth:'♪','16th':'𝅘𝅥𝅯','32nd':'𝅘𝅥𝅰'};
const clean=s=>s.replace(/\s+/g,' ').trim();
function opening(part){
 const measure=part.querySelector(':scope > measure');if(!measure)return [];
 const result=[];
 for(const child of measure.children){
  // Do not promote instructions after music, rests, or cursor movement.
  if(['note','backup','forward'].includes(child.tagName))break;
  if(child.tagName==='direction'&&Number(child.querySelector(':scope > offset')?.textContent||0)===0&&child.getAttribute('placement')!=='below')result.push(child);
 }
 return result;
}
function candidate(node){
 if(node.getAttribute('print-object')==='no')return null;
 if(node.tagName==='metronome'){
  const children=[...node.children];if(children.some(c=>!['beat-unit','beat-unit-dot','per-minute'].includes(c.tagName)))return null;
  const units=node.querySelectorAll('beat-unit'),rates=node.querySelectorAll('per-minute'),dots=node.querySelectorAll('beat-unit-dot').length;
  if(units.length!==1||rates.length!==1||dots>2||!beats[units[0].textContent])return null;
  const rate=clean(rates[0].textContent);if(!/^\d+(?:\s*[–−-]\s*\d+)?$/.test(rate))return null;
  const text=beats[units[0].textContent]+'·'.repeat(dots)+' = '+rate;
  return {kind:'tempo',text:node.getAttribute('parentheses')==='yes'?'('+text+')':text};
 }
 if(node.tagName==='words'){
  const text=clean(node.textContent),font=node.getAttribute('font-family')||'';
  if(parseChordSymbol(text))return null; // Chord directions belong to their musical position, not the header.
  if(!text||text.length>64||text.split(' ').length>9||!/^[\p{L}][\p{L}\p{M}\s,.'’()–-]*$/u.test(text)||/ding|symbol/i.test(font)||node.children.length)return null;
  return {kind:'expression',text};
 }
 return null;
}
export function openingMetadata(xml){
 const doc=new DOMParser().parseFromString(xml,'application/xml');
 const parts=[...doc.querySelectorAll('score-partwise > part')];
 const items=parts.map(part=>opening(part).flatMap(d=>d.getAttribute('print-object')==='no'?[]:[...d.querySelectorAll(':scope > direction-type > metronome, :scope > direction-type > words')].map(node=>({node,...candidate(node)})).filter(x=>x.kind)));
 // Conflicting simultaneous parts or several expressions are left in the score.
 const selected=[];
 for(const kind of ['tempo','expression']){
  const texts=[...new Set(items.flat().filter(x=>x.kind===kind).map(x=>x.text))];
  if(texts.length===1)selected.push({kind,text:texts[0]});
 }
 const changedDirections=new Set();
 for(const item of items.flat())if(selected.some(x=>x.kind===item.kind&&x.text===item.text)){
  const type=item.node.parentElement;changedDirections.add(type.parentElement);item.node.remove();if(!type.children.length)type.remove();
 }
 // A direction must contain a direction-type. OSMD aborts reading subsequent
 // opening events when it encounters an emptied direction. Keep sound as a
 // legal measure-level element and remove only wrappers emptied by promotion.
 for(const direction of changedDirections)if(!direction.querySelector(':scope > direction-type')){
  for(const sound of [...direction.querySelectorAll(':scope > sound')])direction.before(sound);
  direction.remove();
 }
 // Preserve sound, staff, dynamics and all non-promoted directions in this display copy.
 return {text:selected.map(x=>x.text).join(' · '),items:selected,displayXML:selected.length?new XMLSerializer().serializeToString(doc):xml};
}
export function showOpeningMetadata(subtitle,collection,xml,source){
 if(source)source.textContent=collection;
 subtitle.replaceChildren(...(source?[]:[document.createTextNode(collection)]));
 const {text}=openingMetadata(xml);if(text){const span=document.createElement('span');span.className='opening-metadata';span.textContent=text;subtitle.append(document.createTextNode(' '),span);}
}
