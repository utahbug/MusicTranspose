// Complete-system pagination, using measured ink bounds in display pixels.
// Callers may permit bounded blank-gap reduction; notation is never rescaled here.
export function planSystemPages(items,available,{gapCap=24,minimumGap=gapCap,preferSections=false}={}){
 if(!items.length)return [];
 const limit=Math.max(1,available),floor=Math.max(0,Math.min(gapCap,minimumGap)),n=items.length;
 const gap=s=>Math.min(gapCap,Math.max(0,s.gap??gapCap));
 const best=Array(n+1);best[n]={pages:0,reduction:0,cost:0,next:n};
 for(let i=n-1;i>=0;i--){let ink=0,naturalGaps=0,minimumGaps=0;
  for(let j=i;j<n;j++){
   ink+=items[j].height;if(j>i){naturalGaps+=gap(items[j]);minimumGaps+=Math.min(floor,gap(items[j]));}
   if(ink+minimumGaps>limit+1e-6&&j>i)break;
   const natural=ink+naturalGaps,reduction=j>i?Math.max(0,natural-limit):0,used=natural-reduction,tail=best[j+1];
   const candidate={pages:1+tail.pages,reduction:reduction+tail.reduction,cost:Math.max(0,limit-used)**2+tail.cost-(preferSections&&j<n-1&&items[j].sectionEnd&&used>=limit*.35?limit*limit*.25:0),next:j+1,localReduction:reduction};
   // Page count and breathing room remain hard priorities. Opt-in section evidence
   // offsets only the balance cost, and only on a reasonably occupied page.
   const previous=best[i];
   if(!previous||candidate.pages<previous.pages||candidate.pages===previous.pages&&(candidate.reduction<previous.reduction-1e-6||Math.abs(candidate.reduction-previous.reduction)<=1e-6&&candidate.cost<=previous.cost+1e-6))best[i]=candidate;
   if(ink+minimumGaps>limit)break; // An indivisible oversized system stays alone.
  }
 }
 const pages=[];
 for(let i=0;i<n;){const end=best[i].next,reduction=best[i].localReduction;let capacity=0,used=0;const systems=[];
  for(let k=i+1;k<end;k++)capacity+=gap(items[k])-Math.min(floor,gap(items[k]));
  for(let k=i;k<end;k++){
   const original=k===i?0:gap(items[k]),adjustment=capacity>0?reduction*(original-Math.min(floor,original))/capacity:0,appliedGap=original-adjustment;
   used+=appliedGap;systems.push({...items[k],y:used,appliedGap});used+=items[k].height;
  }
  pages.push({systems,used,available:limit,gapReduction:reduction,start:items[i].start,end:items[end-1].end,count:systems.reduce((sum,s)=>sum+(s.systems||1),0)});i=end;
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
