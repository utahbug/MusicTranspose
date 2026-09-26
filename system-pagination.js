// Pure, complete-system pagination. Coordinates are display pixels; note scale is unchanged.
export function planSystemPages(items,available,{gapCap=24}={}){
 if(!items.length)return [];
 const limit=Math.max(1,available),n=items.length,best=Array(n+1);best[n]={pages:0,cost:0,next:n};
 for(let i=n-1;i>=0;i--){let used=0;
  for(let j=i;j<n;j++){
   used+=items[j].height+(j===i?0:Math.min(gapCap,Math.max(0,items[j].gap??gapCap)));
   if(used>limit+1e-6&&j>i)break;
   const tail=best[j+1],candidate={pages:1+tail.pages,cost:Math.max(0,limit-used)**2+tail.cost,next:j+1};
   if(!best[i]||candidate.pages<best[i].pages||candidate.pages===best[i].pages&&candidate.cost<=best[i].cost+1e-6)best[i]=candidate;
   if(used>limit)break; // An indivisible oversized system stays alone.
  }
 }
 const pages=[];
 for(let i=0;i<n;){const end=best[i].next;let used=0;const systems=[];
  for(let k=i;k<end;k++){const gap=k===i?0:Math.min(gapCap,Math.max(0,items[k].gap??gapCap));used+=gap;systems.push({...items[k],y:used});used+=items[k].height;}
  pages.push({systems,used,available:limit,start:items[i].start,end:items[end-1].end,count:systems.reduce((sum,s)=>sum+(s.systems||1),0)});i=end;
 }
 return pages;
}
export function measuredSystems(systems,svgs,width){
 return systems.map((s,i)=>{const scale=width/svgs[s.svgIndex].viewBox.baseVal.width,previous=systems[i-1];return {...s,scale,height:(s.bottom-s.top)*scale,gap:previous?.svgIndex===s.svgIndex?(s.top-previous.bottom)*scale:undefined};});
}
let serial=0;
const ns='http://www.w3.org/2000/svg';
// One source copy per engraved SVG, shared by all visible complete-system slices.
export function createSystemCanvas(originals){
 const svg=document.createElementNS(ns,'svg'),defs=document.createElementNS(ns,'defs'),ids=[];svg.append(defs);
 for(const original of originals){const group=document.createElementNS(ns,'g'),id='system-source-'+(++serial);ids.push(id);
  for(const a of original.attributes)if(!['id','viewBox','width','height','xmlns'].includes(a.name))group.setAttribute(a.name,a.value);
  group.id=id;for(const node of original.childNodes)group.append(node.cloneNode(true));defs.append(group);
 }
 return {svg,ids};
}
export function showSystemPage(canvas,page,width){
 const {svg,ids}=canvas;for(const n of [...svg.children])if(n.localName!=='defs')n.remove();
 svg.setAttribute('viewBox',`0 0 ${width} ${page.used}`);svg.setAttribute('width',width);svg.setAttribute('height',page.used);
 for(const s of page.systems){const slice=document.createElementNS(ns,'svg'),use=document.createElementNS(ns,'use');
  slice.setAttribute('x','0');slice.setAttribute('y',s.y);slice.setAttribute('width',width);slice.setAttribute('height',s.height);slice.setAttribute('viewBox',`0 ${s.top} ${width/s.scale} ${s.bottom-s.top}`);slice.setAttribute('overflow','hidden');slice.dataset.systemStart=s.start;slice.dataset.systemEnd=s.end;
  use.setAttribute('href','#'+ids[s.svgIndex]);slice.append(use);svg.append(slice);
 }
 return svg;
}
