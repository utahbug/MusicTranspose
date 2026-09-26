import {planSystemPages,measuredSystems,createSystemCanvas,showSystemPage} from './system-pagination.js';
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
export function seekVirtualMeasure(measure){anchor=measure;active=Math.max(0,frames.findIndex(f=>Number(f.dataset.end)>=anchor));}
export function availableScoreHeight(score){
 const top=score.getBoundingClientRect().top+scrollY,bar=document.querySelector('.masthead').getBoundingClientRect().height;
 // Keep toolbar/safe-area clearance and the passive Original-key inset.
 return Math.max(80,innerHeight-top-bar-32-(parseFloat(getComputedStyle(score).paddingTop)||0));
}
export function prepareVirtualPages(force=false){
 if(!source)return 0;const score=document.getElementById('score');
 if(!score.clientWidth)return active;
 const available=availableScoreHeight(score),width=score.clientWidth,key=`${width}:${available}`;
 if(!force&&geometry===key&&frames.length)return active;geometry=key;
 for(const f of score.querySelectorAll(':scope > .mxl-page-frame'))f.remove();
 const originals=[...score.querySelectorAll('svg')],canvas=createSystemCanvas(originals);
 const groups=planSystemPages(measuredSystems(source.systems,originals,width),available,{gapCap:source.lead?14:24});
 frames=groups.map(page=>{const first=page.systems[0],last=page.systems.at(-1),frame=document.createElement('div');frame.className='mxl-page-frame';frame.dataset.start=page.start;frame.dataset.end=page.end;frame.dataset.systems=page.count;
  frame._view={...first,top:first.top,bottom:last.bottom,svgIndex:first.svgIndex===last.svgIndex?first.svgIndex:-1,page,used:page.used,canvas,width};frame.style.height=available+'px';score.append(frame);return frame;});
 active=Math.max(0,frames.findIndex(f=>Number(f.dataset.end)>=anchor));return active;
}
// Resize can regroup the old engraving before the new one arrives; retain its measure anchor.
export function displayVirtual(index,preserveAnchor=true){active=index;const frame=frames[index];if(!frame)return;if(!preserveAnchor)anchor=Number(frame.dataset.start);if(!frame._view)return;const {canvas,page,width}=frame._view,available=parseFloat(frame.style.height),scale=Math.min(1,available/page.used),svg=showSystemPage(canvas,page,width);svg.style.width=width*scale+'px';svg.style.height=page.used*scale+'px';frame.append(svg);}


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
