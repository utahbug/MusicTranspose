import {parseXML,shiftOctaveXML} from './music.js';

export const normalOctaves=()=>({all:0,rh:0,lh:0,lead:0});
// Identify staff ownership from structure, never from a note's register or voice.
export function pianoHands(xml){
 const doc=parseXML(xml),parts=[...doc.querySelectorAll('score-partwise > part')];
 const no={ok:false,reason:'Separate hands require a clear two-staff piano layout.'};
 const info=parts.map(part=>{
  const definition=[...doc.querySelectorAll('score-part')].find(p=>p.id===part.id);
  const names=[...(definition?.querySelectorAll('part-name,instrument-name')||[])].map(n=>n.textContent.trim()).filter(n=>n&&!/^MusicXML Part$/i.test(n));
  const programs=[...(definition?.querySelectorAll('midi-program')||[])].map(n=>Number(n.textContent));
  const piano=names.some(n=>/piano|pianoforte/i.test(n))||programs.length>0&&programs.every(n=>n===1);
  const other=names.some(n=>!/^(?:.*piano.*|pianoforte|RH|LH|right hand|left hand|staff \d+|part \d+)$/i.test(n))||programs.some(n=>n!==1);
  const staves=[...part.querySelectorAll('attributes > staves')].map(n=>Number(n.textContent));
  const clefs=[...part.querySelectorAll('attributes > clef')];
  const first=staff=>clefs.find(c=>Number(c.getAttribute('number')||1)===staff)?.querySelector('sign')?.textContent;
  return {part,piano,other,staves,first,channel:definition?.querySelector('midi-channel')?.textContent};
 });
 if(info.length===1){
  const p=info[0];
  if(!p.other&&p.staves.length&&p.staves.every(n=>n===2)&&p.first(1)==='G'&&p.first(2)==='F'&&[...p.part.querySelectorAll('note > staff')].every(n=>['1','2'].includes(n.textContent.trim())))return {ok:true,rh:{part:p.part.id,staff:'1'},lh:{part:p.part.id,staff:'2'}};
 }
 // Some exports split one piano into two parts. Require explicit piano identity
 // and a shared MIDI channel as well as the upper/lower clef structure.
 if(info.length===2&&info.every(p=>p.piano&&!p.other&&p.staves.every(n=>n===1)&&[...p.part.querySelectorAll('note > staff')].every(n=>n.textContent.trim()==='1'))&&info[0].channel&&info[0].channel===info[1].channel&&info[0].first(1)==='G'&&info[1].first(1)==='F')return {ok:true,rh:{part:parts[0].id,staff:'1'},lh:{part:parts[1].id,staff:'1'}};
 return no;
}
export function octaveSummary(state,hands,lead=false){
 const label=n=>n>0?'+'+n:String(n);
 return lead?'Melody '+label(state.lead):hands.ok?'RH '+label(state.rh)+' \u00b7 LH '+label(state.lh):'Both '+label(state.all);
}
export function shiftStaffOctaves(xml,state,hands){
 if(!hands.ok)return shiftOctaveXML(xml,state.all);
 if(state.rh===0&&state.lh===0)return xml;
 const doc=parseXML(xml);
 for(const hand of ['rh','lh']){
  const offset=state[hand];if(!Number.isInteger(offset)||Math.abs(offset)>1)throw Error('Invalid octave offset');
  const part=[...doc.querySelectorAll('score-partwise > part')].find(p=>p.id===hands[hand].part);
  if(!part)throw Error('Piano staff unavailable');
  for(const note of part.querySelectorAll('note')){
   if((note.querySelector(':scope > staff')?.textContent.trim()||'1')!==hands[hand].staff)continue;
   const octave=note.querySelector(':scope > pitch > octave');if(!octave)continue;
   const value=Number(octave.textContent)+offset;if(!Number.isInteger(value)||value<0||value>9)throw Error('This score exceeds the supported pitch register.');
   octave.textContent=String(value);
  }
 }
 return new XMLSerializer().serializeToString(doc);
}
