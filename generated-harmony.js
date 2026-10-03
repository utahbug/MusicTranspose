import {generatedHarmony} from './generated-harmony-data.js';
import {parseChordSymbol} from './chord-symbol.js';

// A source fingerprint prevents an old inference overlay following a revised edition.
// Source harmony (including textual chords) always wins, even when only partial.
export async function withGeneratedHarmony(xml, songId) {
 const overlay=generatedHarmony[songId];
 if(!overlay)return xml;
 const doc=new DOMParser().parseFromString(xml,'application/xml');
 if(doc.querySelector('parsererror, harmony')||[...doc.querySelectorAll('direction-type')].some(n=>parseChordSymbol([...n.querySelectorAll('words')].map(w=>w.textContent).join(''))))return xml;
 const hash=[...new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(xml)))].map(n=>n.toString(16).padStart(2,'0')).join('');
 if(hash!==overlay.xmlSha256)return xml;
 const part=doc.querySelector('part'),measures=[...part.children].filter(n=>n.localName==='measure');
 const element=(tag,value)=>{const n=doc.createElement(tag);if(value!==undefined)n.textContent=String(value);return n;};
 let divisions=1;
 for(const [index,measure] of measures.entries()){
  const entries=overlay.events.filter(e=>e.measure===index);
  // Locate the first voice's actual XML cursor. No notes, durations or backups change.
  let cursor=0;const anchors=[];
  for(const node of [...measure.children]){
   if(node.localName==='attributes')divisions=Number(node.querySelector('divisions')?.textContent||divisions);
   if(node.localName==='note'&&!node.querySelector('chord')){
    anchors.push({node,at:cursor,divisions});
    if(!node.querySelector('grace'))cursor+=Number(node.querySelector('duration')?.textContent||0)/divisions;
   }else if(node.localName==='backup')cursor-=Number(node.querySelector('duration').textContent)/divisions;
   else if(node.localName==='forward')cursor+=Number(node.querySelector('duration').textContent)/divisions;
  }
  for(const [eventIndex,event] of entries.entries()){
   const anchor=anchors.find(a=>Math.abs(a.at-event.offset)<1e-7)||anchors[0];
   if(!anchor)continue;
   const harmony=element('harmony');harmony.setAttribute('placement','above');
   harmony.setAttribute('id',`mt-generated-${index}-${eventIndex}`);
   for(const tag of ['root','kind','bass']){
    if(tag==='kind'){harmony.append(element('kind',event.kind));continue;}
    const pitch=event[tag];if(!pitch)continue;
    const node=element(tag);node.append(element(tag+'-step',pitch.step));
    if(pitch.alter)node.append(element(tag+'-alter',pitch.alter));harmony.append(node);
   }
   const offset=(event.offset-anchor.at)*anchor.divisions;
   if(offset)harmony.append(element('offset',offset));
   if(Number(measure.querySelector('staves')?.textContent)>1||anchor.node.querySelector('staff'))harmony.append(element('staff',1));
   measure.insertBefore(harmony,anchor.node);
  }
 }
 return new XMLSerializer().serializeToString(doc);
}
