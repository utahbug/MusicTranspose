// Geometry-only post-engraving correction. Never edits the source MusicXML.
// OSMD/VexFlow emits metronome symbols+BPM as .vf-stavetempo, separately from words.
function boxInSvg(element,svg){
 const b=element.getBBox(),matrix=svg.getCTM().inverse().multiply(element.getCTM());
 const corners=[[b.x,b.y],[b.x+b.width,b.y],[b.x,b.y+b.height],[b.x+b.width,b.y+b.height]].map(([x,y])=>new DOMPoint(x,y).matrixTransform(matrix));
 return {left:Math.min(...corners.map(p=>p.x)),right:Math.max(...corners.map(p=>p.x)),top:Math.min(...corners.map(p=>p.y)),bottom:Math.max(...corners.map(p=>p.y))};
}
export function avoidTempoCollisions(host){
 const gap=6; // SVG units, scaled with the rest of the engraved score.
 for(const svg of host.querySelectorAll('svg')){
  for(const tempo of svg.querySelectorAll('.vf-stavetempo')){
   if(tempo.dataset.collisionAdjusted)continue;
   const original=boxInSvg(tempo,svg);
   const obstacles=[...svg.querySelectorAll('text')].filter(e=>!tempo.contains(e)&&e.textContent.trim()).map(e=>boxInSvg(e,svg));
   let shift=0;
   // Move upward only when ink boxes intersect; after moving, reserve a small gap.
   for(let n=0;n<=obstacles.length;n++){
    const hits=obstacles.filter(b=>original.left<b.right&&original.right>b.left&&original.top+shift<b.bottom&&original.bottom+shift>b.top);
    if(!hits.length)break;
    shift=Math.min(...hits.map(b=>b.top-gap-original.bottom));
   }
   if(!shift)continue;
   // A wrapper applies SVG-coordinate translation without disturbing existing transforms.
   const parent=tempo.parentNode,wrapper=document.createElementNS('http://www.w3.org/2000/svg','g');
   const local=parent.getCTM().inverse().multiply(svg.getCTM());
   const a=new DOMPoint(0,0).matrixTransform(local),b=new DOMPoint(0,shift).matrixTransform(local);
   wrapper.setAttribute('transform',`translate(${b.x-a.x} ${b.y-a.y})`);wrapper.dataset.tempoLane=String(shift);
   parent.insertBefore(wrapper,tempo);wrapper.append(tempo);tempo.dataset.collisionAdjusted='true';
  }
  // Retain moved ink if it exceeds the original canvas. Usually existing margin suffices.
  const view=svg.viewBox.baseVal,ink=svg.getBBox();
  if(ink.y<view.y+4){const extension=view.y+4-ink.y,scale=svg.height.baseVal.value/view.height;svg.setAttribute('viewBox',`${view.x} ${view.y-extension} ${view.width} ${view.height+extension}`);svg.setAttribute('height',String(svg.height.baseVal.value+extension*scale));}
 }
}
