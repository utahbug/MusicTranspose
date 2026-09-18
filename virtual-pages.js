// OSMD model establishes systems; rendered ink expands bounds after layout corrections.
export function captureSystems(osmd,host){
 const svgs=[...host.querySelectorAll('svg')],out=[];
 osmd.GraphicSheet.MusicPages.forEach((page,svgIndex)=>{
  const svg=svgs[svgIndex];if(!svg)return;
  const systems=page.MusicSystems.map((s,i)=>{const box=s.PositionAndShape,measures=s.GraphicalMeasures.flat().map(m=>osmd.Sheet.SourceMeasures.indexOf(m.parentSourceMeasure)).filter(n=>n>=0);return {svgIndex,index:i,center:(box.AbsolutePosition.y+(box.BorderTop+box.BorderBottom)/2)*10,top:Infinity,bottom:-Infinity,start:Math.min(...measures),end:Math.max(...measures)};});
  for(const el of svg.querySelectorAll('path,text,line,rect,ellipse,circle,polygon,polyline,use,image')){if(el.closest('defs,clipPath,mask'))continue;const b=el.getBBox();if(!b.width&&!b.height)continue;const m=svg.getCTM().inverse().multiply(el.getCTM()),points=[[b.x,b.y],[b.x+b.width,b.y],[b.x,b.y+b.height],[b.x+b.width,b.y+b.height]].map(([x,y])=>new DOMPoint(x,y).matrixTransform(m)),top=Math.min(...points.map(p=>p.y)),bottom=Math.max(...points.map(p=>p.y)),center=(top+bottom)/2;const system=systems.reduce((a,s)=>Math.abs(s.center-center)<Math.abs(a.center-center)?s:a,systems[0]);if(system){system.top=Math.min(system.top,top-3);system.bottom=Math.max(system.bottom,bottom+3);}}
  // Overlapping ink cannot safely be separated; keep those adjacent systems together.
  for(const s of systems){if(!Number.isFinite(s.top))throw Error('Missing rendered system bounds');const previous=out.at(-1);if(previous?.svgIndex===svgIndex&&s.top<=previous.bottom){previous.bottom=Math.max(previous.bottom,s.bottom);previous.end=s.end;previous.systems++;}else out.push({...s,systems:1});}
 });return out;
}
let source=null,frames=[],anchor=0,song=null,geometry='',active=0;
export function setVirtualSource(detail){if(song!==detail.song){anchor=0;active=0;}song=detail.song;source=detail;frames=[];geometry='';}
export function resetVirtualSource(){source=null;frames=[];geometry='';anchor=0;active=0;}
export function virtualAvailable(){return !!source?.systems?.length;}
export function virtualFrames(){return frames;}
export function virtualAnchor(){return anchor;}
export function prepareVirtualPages(force=false){
 if(!source)return 0;const score=document.getElementById('score');
 if(!score.clientWidth)return active;
 const top=score.getBoundingClientRect().top+scrollY,bar=document.querySelector('.masthead').getBoundingClientRect().height;
 const available=Math.max(80,innerHeight-top-bar-18),width=score.clientWidth,key=`${width}:${available}`;
 if(!force&&geometry===key&&frames.length)return active;geometry=key;
 for(const f of score.querySelectorAll(':scope > .mxl-page-frame'))f.remove();
 const originals=[...score.querySelectorAll('svg')],groups=[];
 for(const system of source.systems){const svg=originals[system.svgIndex],scale=width/svg.viewBox.baseVal.width,last=groups.at(-1);if(last&&last.svgIndex===system.svgIndex&&(system.bottom-last.top)*scale<=available){last.bottom=system.bottom;last.end=system.end;last.systems+=system.systems;}else groups.push({...system});}
 // One prepared SVG per source page shared across virtual frames: no per-turn engraving.
 const copies=originals.map(svg=>{const copy=svg.cloneNode(true);copy.classList.remove('screen-first-page');copy.removeAttribute('id');copy.style.margin='0';return copy;});
 frames=groups.map((g,i)=>{const frame=document.createElement('div');frame.className='mxl-page-frame';frame.dataset.start=g.start;frame.dataset.end=g.end;frame.dataset.systems=g.systems;frame._view={...g,svg:copies[g.svgIndex],width:originals[g.svgIndex].viewBox.baseVal.width};frame.style.height=available+'px';score.append(frame);return frame;});
 // Preserve supplementary verses/credits as separate final text pages, not lost below the toolbar.
 let textFrame;
 for(const paragraph of document.querySelectorAll('#source-credits p')){if(!paragraph.textContent.trim())continue;
  const create=()=>{const f=document.createElement('div');f.className='mxl-page-frame mxl-credit-page';f.dataset.start=Number.MAX_SAFE_INTEGER;f.dataset.end=Number.MAX_SAFE_INTEGER;f.style.height=available+'px';f.style.display='block';score.append(f);frames.push(f);return f;};
  if(!textFrame)textFrame=create();const copy=paragraph.cloneNode(true);textFrame.append(copy);
  if(textFrame.scrollHeight>Math.ceil(available)+1&&textFrame.children.length>1){copy.remove();textFrame.style.removeProperty('display');textFrame=create();textFrame.append(copy);}
  if(copy.getBoundingClientRect().height>available-12)copy.style.fontSize=Math.max(8,parseFloat(getComputedStyle(copy).fontSize)*(available-12)/copy.getBoundingClientRect().height)+'px';
 }
 textFrame?.style.removeProperty('display');
 active=Math.max(0,frames.findIndex(f=>Number(f.dataset.end)>=anchor));return active;
}
export function displayVirtual(index){active=index;const frame=frames[index];if(!frame)return;anchor=Number(frame.dataset.start);if(!frame._view)return;const {svg,top,bottom,width}=frame._view,height=bottom-top,available=parseFloat(frame.style.height),scale=Math.min(document.getElementById('score').clientWidth/width,available/height);svg.setAttribute('viewBox',`0 ${top} ${width} ${height}`);svg.setAttribute('width',width*scale);svg.setAttribute('height',height*scale);svg.style.width=width*scale+'px';svg.style.height=height*scale+'px';frame.append(svg);}

// Keep the first visible complete-system location during Continuous/Auto density changes.
function screenSystemRect(system){const svg=document.querySelectorAll('#score > div:not(.mxl-page-frame) svg, #score > svg')[system.svgIndex];if(!svg)return null;const r=svg.getBoundingClientRect(),v=svg.viewBox.baseVal,scale=r.width/v.width;return {top:r.top+(system.top-v.y)*scale,bottom:r.top+(system.bottom-v.y)*scale};}
export function rememberReadingPosition(){
 if(!source||scrollY<100||document.body.classList.contains('page-navigation'))return null;
 for(const system of source.systems){const rect=screenSystemRect(system);if(rect?.bottom>0)return {measure:system.start,offset:rect.top};}return null;
}
export function restoreReadingPosition(position){
 if(!position||!source||document.body.classList.contains('page-navigation'))return;
 const system=source.systems.find(s=>s.start<=position.measure&&s.end>=position.measure),rect=system&&screenSystemRect(system);
 if(rect)window.scrollBy({top:rect.top-position.offset,behavior:'instant'});
}
