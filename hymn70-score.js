import {addLeadVoiceGapAnchors} from './lead-spacing.js';
const id='song-95273aa4-6219-4608-a682-8db1ff47c3eb';
const parse=xml=>new DOMParser().parseFromString(xml,'application/xml');
const serialize=doc=>new XMLSerializer().serializeToString(doc);
// This archive contains both its Print arrangement and separate SATB Voices.
// Keep the Print arrangement only when the redundant parts still match it.
function events(parts){
 const result=new Set();
 for(const part of parts){let divisions=1;
  for(const measure of part.querySelectorAll(':scope > measure')){let cursor=0,last=0;
   for(const n of measure.children){
    if(n.localName==='attributes'&&n.querySelector('divisions'))divisions=Number(n.querySelector('divisions').textContent);
    const duration=Number(n.querySelector(':scope > duration')?.textContent||0)/divisions;
    if(n.localName==='backup')cursor-=duration;
    else if(n.localName==='forward')cursor+=duration;
    else if(n.localName==='note'){
     const chord=!!n.querySelector(':scope > chord'),pitch=n.querySelector(':scope > pitch'),at=chord?last:cursor;
     if(pitch)result.add(JSON.stringify([measure.getAttribute('number'),at,duration,pitch.querySelector('step')?.textContent,Number(pitch.querySelector('alter')?.textContent||0),pitch.querySelector('octave')?.textContent,[...n.querySelectorAll(':scope > tie')].map(t=>t.getAttribute('type'))]));
     if(!chord){last=cursor;cursor+=duration;}
    }
   }
  }
 }
 return result;
}
export function hymn70FullScore(xml,song){
 if(song?.id!==id||song.local)return xml;
 const doc=parse(xml),parts=[...doc.querySelectorAll('score-partwise > part')],list=doc.querySelector('part-list');
 if(!list||parts.map(p=>p.id).join(',')!=='P1,P2,P3,P4,P5,P6')return xml;
 const defs=[...list.querySelectorAll('score-part')];
 if(defs.map(p=>p.querySelector('part-link')?.getAttributeNS('http://www.w3.org/1999/xlink','title')).join(',')!=='Print,Print,Voices,Voices,Voices,Voices')return xml;
 const main=events(parts.slice(0,2)),voices=events(parts.slice(2));
 if(main.size!==voices.size||[...voices].some(n=>!main.has(n)))return xml;
 const groups=[...list.querySelectorAll('part-group')];
 if(groups.length!==4||groups[0].getAttribute('type')!=='start'||groups[1].getAttribute('type')!=='stop')return xml;
 list.replaceChildren(groups[0],defs[0],defs[1],groups[1]);
 for(const part of parts.slice(2))part.remove();
 // The export is standalone; external archive part links are not needed.
 for(const link of list.querySelectorAll('part-link'))link.remove();
 return serialize(doc);
}
export function hymn70Engraving(xml,song){
 if(song?.id!==id||song.local)return xml;
 const doc=parse(xml);
 // Existing OSMD workaround: forward-only voice gaps otherwise misplace the
 // late-entering voice and its shared lyric/harmony x positions. Engraving only.
 return addLeadVoiceGapAnchors(doc)?serialize(doc):xml;
}
