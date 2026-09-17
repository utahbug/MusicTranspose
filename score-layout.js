// Geometry-only post-engraving correction. Never edits the source MusicXML.
// OSMD/VexFlow emits metronome symbols+BPM as .vf-stavetempo, separately from words.
function boxInSvg(element,svg){
 const b=element.getBBox(),matrix=svg.getCTM().inverse().multiply(element.getCTM());
 const corners=[[b.x,b.y],[b.x+b.width,b.y],[b.x,b.y+b.height],[b.x+b.width,b.y+b.height]].map(([x,y])=>new DOMPoint(x,y).matrixTransform(matrix));
 return {left:Math.min(...corners.map(p=>p.x)),right:Math.max(...corners.map(p=>p.x)),top:Math.min(...corners.map(p=>p.y)),bottom:Math.max(...corners.map(p=>p.y))};
}
function move(element,svg,x,y){
 const b=boxInSvg(element,svg),parent=element.parentNode;
 const local=parent.getCTM().inverse().multiply(svg.getCTM());
 const a=new DOMPoint(0,0).matrixTransform(local),z=new DOMPoint(x-b.left,y-b.top).matrixTransform(local);
 const wrap=document.createElementNS(svg.namespaceURI,'g');wrap.setAttribute('transform',`translate(${z.x-a.x} ${z.y-a.y})`);
 parent.insertBefore(wrap,element);wrap.append(element);return wrap;
}
function compactOpening(host,xml){
 if(!xml)return;
 const doc=new DOMParser().parseFromString(xml,'application/xml');
 const measure=doc.querySelector('part > measure');if(!measure)return;
 // Only the opening location, before any timed note; source data is read, never rewritten.
 const opening=[];for(const child of measure.children){if(child.tagName==='note'&&!child.querySelector('grace'))break;if(child.tagName==='direction'&&Number(child.querySelector('offset')?.textContent||0)===0)opening.push(child);}
 const direction=opening.find(d=>d.querySelector('metronome')&&d.querySelector('words'));if(!direction)return;
 const words=[...direction.querySelectorAll('words')].map(w=>w.textContent.trim()).filter(Boolean);
 const svg=host.querySelector('svg'),tempo=svg?.querySelector('.vf-stavetempo'),bpm=tempo?.querySelector('text');if(!bpm||tempo.closest('[data-compact-tempo]'))return;
 const texts=words.map(word=>[...svg.querySelectorAll('.vf-text text')].find(t=>t.textContent.trim()===word));
 if(texts.some(t=>!t))return;
 const boxes=texts.map(t=>boxInSvg(t,svg)),tb=boxInSvg(tempo,svg),bb=boxInSvg(bpm,svg);
 // Align text ink bottoms to BPM ink bottom, retaining the original musical glyph group.
 const left=Math.min(tb.left,...boxes.map(b=>b.left)),right=svg.viewBox.baseVal.x+svg.viewBox.baseVal.width-12;
 const group=document.createElementNS(svg.namespaceURI,'g');group.dataset.compactTempo='true';svg.append(group);
 const lineHeight=Math.max(tb.bottom-tb.top,...boxes.map(b=>b.bottom-b.top))+3;
 let x=left+(tb.right-tb.left),row=0;
 const placements=[];
 texts.forEach((t,i)=>{
  const comma=t.cloneNode(false);comma.textContent=i===0?',':' ';svg.append(comma);
  const cb=boxInSvg(comma,svg),b=boxes[i],space=4;
  if(x+(cb.right-cb.left)+space+b.right-b.left>right){row++;x=left;}
  placements.push({t:comma,x,y:row*lineHeight-(cb.bottom-cb.top)});x+=cb.right-cb.left+space;
  placements.push({t,x,y:row*lineHeight-(b.bottom-b.top)});x+=b.right-b.left+space;
 });
 const bottom=Math.max(...boxes.map(b=>b.bottom)),baseline=Math.max(bottom-row*lineHeight, row===0?bb.bottom:-Infinity);
 group.append(move(tempo,svg,left,baseline-(bb.bottom-tb.top)));
 for(const item of placements)group.append(move(item.t,svg,item.x,baseline+item.y));
 group.dataset.wrapped=String(row>0);
}
export function avoidTempoCollisions(host,xml){
 compactOpening(host,xml);
 const gap=6; // SVG units, scaled with the rest of the engraved score.
 for(const svg of host.querySelectorAll('svg')){
  for(const marking of svg.querySelectorAll('.vf-stavetempo')){
   const tempo=marking.closest('[data-compact-tempo]')||marking;
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
