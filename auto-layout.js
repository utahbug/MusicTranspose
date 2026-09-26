import {planSystemPages,measuredSystems} from './system-pagination.js';
// Screen-only selection over the existing OSMD renderer; print never imports this policy.
export const sizePreferenceKey='music-transpose-score-size-v1';
export function readScoreSize(){try{const value=localStorage.getItem(sizePreferenceKey);return value==='normal'||value==='large'?value:'auto';}catch{return 'auto';}}
export function saveScoreSize(value){try{localStorage.setItem(sizePreferenceKey,value);}catch{}}
export function candidateZooms(base,phone){return [...new Set([1,.9,.82].map(n=>Number(Math.max(phone?.64:.68,base*n).toFixed(3))))];}
export function assessLayout(host,systems,width,available,zoom){
 const svgs=[...host.querySelectorAll('svg')];let clipping=0,collisions=0,minLyric=Infinity,oversize=0;
 for(const svg of svgs){
  const rect=svg.getBoundingClientRect(),box=svg.getBBox(),v=svg.viewBox.baseVal,scale=rect.width/v.width;
  if(box.x<v.x-2||box.x+box.width>v.x+v.width+2)clipping++;
  const rows=new Map();
  for(const text of svg.querySelectorAll('.lyrics text')){if(!text.textContent.trim()||/^[–—_-]+$/.test(text.textContent.trim()))continue;const r=text.getBoundingClientRect();minLyric=Math.min(minLyric,parseFloat(getComputedStyle(text).fontSize)*scale);const key=Math.round((r.top-rect.top)/3);if(!rows.has(key))rows.set(key,[]);rows.get(key).push(r);}
  for(const row of rows.values()){row.sort((a,b)=>a.left-b.left);for(let i=1;i<row.length;i++)if(row[i-1].right>row[i].left+1)collisions++;}
 }
 const measured=measuredSystems(systems,svgs,width);oversize=measured.filter(s=>s.height>available).length;
 const groups=planSystemPages(measured,available,{gapCap:24});
 // Oversized complete systems already fit to height in the pager. Judge the resulting text size.
 const fitScale=Math.min(1,...measured.map(s=>available/s.height)),displayMinLyric=minLyric*fitScale;
 const first=groups[0];return {zoom,pages:groups.length,visibleSystems:first?.count||0,visibleMeasures:first?first.end-first.start+1:0,totalSystems:systems.reduce((n,s)=>n+s.systems,0),clipping,collisions,minLyric:Number.isFinite(minLyric)?minLyric:null,oversize,fitScale,displayMinLyric:Number.isFinite(displayMinLyric)?displayMinLyric:null,readable:!clipping&&displayMinLyric>=12.5};
}
export function chooseLayout(entries){
 const baseline=entries.find(e=>e.autoReport.baseline)||entries[0],safe=entries.filter(e=>e.autoReport.readable&&e.autoReport.collisions===0);
 if(!safe.length)return baseline;
 return safe.sort((a,b)=>a.autoReport.pages-b.autoReport.pages||b.autoReport.visibleMeasures-a.autoReport.visibleMeasures||b.autoReport.visibleSystems-a.autoReport.visibleSystems||b.zoom-a.zoom)[0];
}
