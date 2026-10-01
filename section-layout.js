import {planSystemPages,measuredSystems} from './system-pagination.js';
import {assessLayout} from './auto-layout.js';

// Strong, encoded section evidence only: a terminal fermata/double bar/repeat
// followed by a contraction from multiple lyric verses to one lyrical section.
// No title lookup or interpretation of the words themselves.
export function musicalSections(xml){
 const doc=new DOMParser().parseFromString(xml,'application/xml'),parts=[...doc.querySelectorAll('score-partwise > part')];
 if(parts.length!==1)return [];
 let divisions=1;const measures=[...parts[0].children].filter(n=>n.localName==='measure');
 const data=measures.map(m=>{let cursor=0,last=0,end=0;const notes=[];
  for(const n of m.children){if(n.localName==='attributes')divisions=Number(n.querySelector('divisions')?.textContent||divisions);
   const duration=Number(n.querySelector(':scope > duration')?.textContent||0)/divisions;
   if(n.localName==='backup')cursor-=duration;
   if(n.localName==='forward'){cursor+=duration;end=Math.max(end,cursor);}
   if(n.localName==='note'){const chord=!!n.querySelector(':scope > chord'),at=chord?last:cursor;notes.push({node:n,at,end:at+duration});if(!chord){last=cursor;cursor+=duration;}end=Math.max(end,cursor,at+duration);}
  }
  const verses=new Set([...m.querySelectorAll('lyric')].map(l=>l.getAttribute('number')||'1'));
  const terminal=notes.some(n=>Math.abs(n.end-end)<1e-7&&n.node.querySelector('fermata'))||!!m.querySelector('barline[location="right"] > repeat[direction="backward"],barline:not([location]) > repeat[direction="backward"]')||[...m.querySelectorAll('barline[location="right"] > bar-style,barline:not([location]) > bar-style')].some(n=>['light-light','light-heavy'].includes(n.textContent.trim()));
  return {verses,terminal,tied:notes.some(n=>Math.abs(n.end-end)<1e-7&&n.node.querySelector('tie[type="start"]')),first:notes.find(n=>n.node.querySelector('lyric'))};
 });
 return data.flatMap((m,i)=>i&&data[i-1].terminal&&!data[i-1].tied&&data[i-1].verses.size>1&&m.verses.size===1&&m.first?.at===0?[i]:[]);
}

// Trial only a nearby strong boundary in a multi-page Melody engraving. Keep
// the same scale/page count, bounded blank space, and existing quality guards.
export function preferMusicalSections(engraver,host,xml,systems,{width,available,zoom,render}){
 const boundaries=musicalSections(xml);if(!boundaries.length)return systems;
 const pages=layout=>planSystemPages(measuredSystems(layout,[...host.querySelectorAll('svg')],width),available,{gapCap:14,minimumGap:8,preferSections:true});
 const baseline=pages(systems);if(baseline.length<2)return systems;
 const candidate=boundaries.find(b=>baseline.slice(0,-1).some(p=>{const index=systems.findIndex(s=>s.end===p.end),at=systems.findIndex(s=>s.start<=b&&s.end>=b);return at>=0&&Math.abs(at-index)<=1;}));
 if(candidate===undefined)return systems;
 const mark=layout=>layout.map(s=>({...s,sectionEnd:s.end===candidate-1}));
 const source=engraver.Sheet.SourceMeasures,flags=source.map(m=>m.printNewSystemXml),rule=engraver.EngravingRules.NewSystemAtXMLNewSystemAttribute;
 let layout=mark(systems),trial=false;
 try{
  if(!systems.some(s=>s.start===candidate)){
   // Preserve earlier system starts; let the new section wrap naturally.
   const starts=new Set(systems.filter(s=>s.start<candidate).map(s=>s.start));starts.add(candidate);
   source.forEach((m,i)=>m.printNewSystemXml=starts.has(i));engraver.EngravingRules.NewSystemAtXMLNewSystemAttribute=true;
   trial=true;layout=mark(render(true));
  }
  const proposed=pages(layout),quality=assessLayout(host,layout,width,available,zoom);
  if(proposed.length===baseline.length&&proposed.slice(0,-1).some(p=>p.end===candidate-1)
   &&proposed.every(p=>p.used<=available+.01&&p.used>=available*.35)&&!quality.clipping&&!quality.collisions)return layout;
 }finally{source.forEach((m,i)=>m.printNewSystemXml=flags[i]);engraver.EngravingRules.NewSystemAtXMLNewSystemAttribute=rule;}
 return trial?render():systems;
}
