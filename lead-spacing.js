// OSMD does not assign an x position to a harmony-only timestamp inside a held
// note. Silent, invisible timing anchors exist only in the engraving copy.
export function addLeadHarmonyAnchors(doc){
 let changed=false;
 const text=(n,k,d='0')=>n.querySelector(':scope > '+k)?.textContent??d;
 const make=(name,value)=>{const n=doc.createElement(name);if(value!==undefined)n.textContent=String(value);return n;};
 for(const part of doc.querySelectorAll('score-partwise > part')){
  for(const measure of part.querySelectorAll(':scope > measure')){let cursor=0,end=0;const notes=new Set(),harmonies=[];
   for(const n of measure.children){const duration=Number(text(n,'duration'));
    if(n.localName==='backup')cursor-=duration;if(n.localName==='forward')cursor+=duration;
    if(n.localName==='harmony')harmonies.push(cursor+Number(text(n,'offset')));
    if(n.localName==='note'&&!n.querySelector('chord')){notes.add(cursor);if(!n.querySelector('grace'))cursor+=duration;}
    end=Math.max(end,cursor);
   }
   const missing=harmonies.filter(t=>t>=0&&t<end&&!notes.has(t));if(!missing.length)continue;
   const boundary=[...new Set([0,...missing,end])].sort((a,b)=>a-b),tail=measure.querySelector(':scope > barline[location="right"]');
   const append=n=>measure.insertBefore(n,tail);
   if(cursor){const backup=make('backup');backup.append(make('duration',cursor));append(backup);}
   for(let i=0;i<boundary.length-1;i++){const note=make('note');note.setAttribute('print-object','no');note.setAttribute('print-spacing','yes');note.append(make('rest'),make('duration',boundary[i+1]-boundary[i]),make('voice','lead-harmony-spacing'));append(note);}
   changed=true;
  }
 }
 return changed;
}

// OSMD groups words at the same timestamp without considering above/below
// placement. Keep source corner marks separate from simultaneous prose (Unison).
export function installLeadTextAnchors(OSMD){
 const reader=OSMD.ExpressionReader.prototype;if(reader.musicTransposeCornerAnchors)return;reader.musicTransposeCornerAnchors=true;
 const read=reader.interpretWords;
 reader.interpretWords=function(node,...args){
  const corner=this.musicSheet.Rules.musicTransposeLead&&['\u231c','\u231d'].includes(node.value.trim())&&/DingPI/i.test(node.attribute('font-family')?.value||'');
  if(!corner)return read.call(this,node,...args);
  const previous=this.getMultiExpression;this.getMultiExpression=undefined;
  try{return read.call(this,node,...args);}finally{this.getMultiExpression=previous;}
 };
}
