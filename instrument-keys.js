import {buildKeys,signature} from './music.js';
const groups=[
 {label:'Concert pitch',examples:'Violin · Viola · Cello · Flute · Oboe · Bassoon · Trombone',semitones:0},
 {label:'B♭ instruments',examples:'Clarinet · Trumpet · Tenor Sax',semitones:2},
 {label:'E♭ instruments',examples:'Alto Sax · Baritone Sax',semitones:9},
 {label:'F instruments',examples:'French Horn',semitones:7}
];
export function instrumentKeys(concert){
 const pc=((7*concert.fifths+(concert.mode==='minor'?9:0))%12+12)%12;
 const keys=buildKeys({...concert,pc});
 return groups.map(group=>({...group,key:keys.find(k=>k.shift===(group.semitones>6?group.semitones-12:group.semitones))}));
}
export function showInstrumentKeys(concert){
 document.getElementById('instrument-concert').textContent=`Concert key: ${concert.name} ${concert.mode}`;
 const rows=instrumentKeys(concert).map(({label,examples,key})=>{
  const row=document.createElement('div');row.className='instrument-row';
  const description=document.createElement('div'),heading=document.createElement('strong'),names=document.createElement('small');heading.textContent=label;names.textContent=examples;description.append(heading,names);
  const written=document.createElement('div');written.className='instrument-written';
  const name=document.createElement('strong'),sig=document.createElement('span');name.textContent=key.name+' '+key.mode;sig.className='signature';sig.textContent=signature(key);sig.setAttribute('aria-label',key.fifths?`${Math.abs(key.fifths)} ${key.fifths<0?'flats':'sharps'}`:'No sharps or flats');written.append(name,sig);row.append(description,written);return row;
 });
 document.getElementById('instrument-rows').replaceChildren(...rows);
}
