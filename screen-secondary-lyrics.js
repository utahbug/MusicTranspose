import {pianoHands} from './octave.js';
// Presentation only: exact, complete extra lyric lanes in a verified piano LH.
const punctuation=/[.,;:!?“”"'‘’()…\-‐‑–—]/g;
function words(items){
 const out=[];let pending='';
 for(const {lyric} of items){
  const texts=[...lyric.querySelectorAll(':scope > text')],kind=lyric.querySelector(':scope > syllabic')?.textContent||'single';
  if(texts.length!==1||!['single','begin','middle','end'].includes(kind))return null;
  const text=texts[0].textContent.replace(punctuation,'').trim();if(!text)return null;
  if(kind==='begin'){if(pending)return null;pending=text;}
  else if(kind==='middle'){if(!pending)return null;pending+=text;}
  else if(kind==='end'){if(!pending)return null;out.push(...(pending+text).split(/\s+/));pending='';}
  else{if(pending)return null;out.push(...text.split(/\s+/));}
 }
 return pending?null:out;
}
export function screenSecondaryLyrics(xml){
 const hands=pianoHands(xml);if(!hands.ok)return {xml,suppressed:[]};
 const doc=new DOMParser().parseFromString(xml,'application/xml'),parts=[...doc.querySelectorAll('score-partwise > part')];
 const collect=hand=>{
  const part=parts.find(p=>p.id===hand.part),measures=[...part.querySelectorAll(':scope > measure')],lanes=new Map();
  for(const [index,measure] of measures.entries())for(const note of measure.querySelectorAll(':scope > note')){
   if((note.querySelector(':scope > staff')?.textContent.trim()||'1')!==hand.staff)continue;
   for(const lyric of note.querySelectorAll(':scope > lyric')){const number=lyric.getAttribute('number');if(!lanes.has(number))lanes.set(number,[]);lanes.get(number).push({lyric,note,index,measure:measure.getAttribute('number'),voice:note.querySelector(':scope > voice')?.textContent||'1'});}
  }
  return {part,measures,lanes};
 };
 const primary=collect(hands.rh),lower=collect(hands.lh),numbers=[...primary.lanes.keys()];
 // Multiple principal verses and an explicitly additional numbered lane avoid
 // treating ordinary bass/vocal lyrics or unnumbered material as editorial.
 if(numbers.length<2||numbers.some(n=>!/^\d+$/.test(n))||primary.measures.length!==lower.measures.length||primary.measures.some((m,i)=>m.getAttribute('number')!==lower.measures[i].getAttribute('number')))return {xml,suppressed:[]};
 const clefs=[...lower.part.querySelectorAll('attributes > clef')].filter(c=>(c.getAttribute('number')||'1')===hands.lh.staff);
 if(clefs.some(c=>c.querySelector('sign')?.textContent!=='F'))return {xml,suppressed:[]};
 const suppressed=[];
 for(const [number,items] of lower.lanes){
  if(!/^\d+$/.test(number)||Number(number)<=Math.max(...numbers.map(Number))||items.some(x=>!x.note.querySelector(':scope > pitch')||x.note.querySelector(':scope > rest')||[...x.lyric.children].some(c=>!['text','syllabic'].includes(c.tagName))))continue;
  const tokens=words(items);if(!tokens||tokens.length<8)continue;
  // A single matching bass phrase can be a legitimate vocal cue. Only an
  // entire extra lane made of repeated complete phrases qualifies here.
  const repeated=tokens.some((_,i)=>{const length=i+1;return length>=4&&length<=tokens.length/2&&tokens.length%length===0&&tokens.every((t,j)=>t===tokens[j%length]);});
  if(!repeated)continue;
  const first=items[0].index,last=items.at(-1).index;
  let evidence=null;
  for(const [verse,all] of primary.lanes){
   // Compare complete syllabic words in a tightly neighboring measure window.
   const nearby=all.filter(x=>x.index>=first-2&&x.index<=last+2);
   // Trim partial boundary words rather than joining them to a different word.
   while(nearby.length&&['middle','end'].includes(nearby[0].lyric.querySelector('syllabic')?.textContent))nearby.shift();
   while(nearby.length&&['begin','middle'].includes(nearby.at(-1).lyric.querySelector('syllabic')?.textContent))nearby.pop();
   const match=words(nearby);if(!match)continue;
   const at=match.findIndex((_,i)=>tokens.every((t,j)=>match[i+j]===t));
   if(at>=0){evidence={part:hands.rh.part,staff:hands.rh.staff,verse,text:tokens.join(' '),window:[Math.max(0,first-2),last+2]};break;}
  }
  if(!evidence)continue;
  suppressed.push({part:hands.lh.part,staff:hands.lh.staff,verse:number,voices:[...new Set(items.map(x=>x.voice))],measures:[items[0].measure,items.at(-1).measure],syllables:items.map(x=>x.lyric.querySelector('text').textContent),count:items.length,evidence});
  for(const {lyric} of items)lyric.remove();
 }
 return {xml:suppressed.length?new XMLSerializer().serializeToString(doc):xml,suppressed};
}
