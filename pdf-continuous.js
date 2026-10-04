// Screen-only PDF edge bounds. No OCR, musical band reflow, or source mutation.
const legal = /(?:©\s*(?:\d{4})|copyright|all rights reserved|used by permission|may be copied|permission|reproduction|copy made|non[ -]?commercial|this notice must|this (?:song|music|work) may)/i;
const startsLegal = /^(?:©|copyright\b|all rights reserved|used by permission|this (?:song|music|work|notice)|permission\b|reproduction\b|copy made\b)/i;
const forbidden = /(?:\b(?:words|music|text|arranged)\s*:|see also|\bverse\s*\d|\b(?:psalm|mosiah|scripture|coda|ritardando|repeat)\b|doctrine and covenants)/i;
export function continuousAnalysis(canvas, text, viewport) {
 const w=canvas.width,h=canvas.height,data=canvas.getContext('2d').getImageData(0,0,w,h).data;
 const rows=Array.from({length:h},()=>({left:w,right:-1}));let top=h,bottom=-1;
 for(let y=0;y<h;y++)for(let x=0;x<w;x++){const i=(y*w+x)*4;if(data[i+3]&&(data[i]<255||data[i+1]<255||data[i+2]<255)){rows[y].left=Math.min(rows[y].left,x);rows[y].right=x;top=Math.min(top,y);bottom=y;}}
 if(bottom<0)return {top:0,bottom:h,footer:null};
 const pad=Math.ceil(w*.008),result={top:Math.max(0,top-pad),bottom:Math.min(h,bottom+1+pad),footer:null};
 // Rotated/vertical or incomplete text extraction cannot establish a legal footer.
 if(!text?.items||!viewport?.transform)return result;
 const [a,b,c,d,e,f]=viewport.transform,items=[];
 for(const item of text.items){if(!item.str?.trim())continue;const t=item.transform;
  const x=a*t[4]+c*t[5]+e,y=b*t[4]+d*t[5]+f;
  const size=Math.hypot(a*t[2]+c*t[3],b*t[2]+d*t[3]),width=item.width*viewport.scale;
  if(Math.abs(b*t[0]+d*t[1])>.01||Math.abs(c*t[3]+a*t[2])>.01)return result;
  items.push({text:item.str.trim(),x,y,width,size,top:y-size*1.15,bottom:y+size*.35});
 }
 items.sort((a,b)=>a.y-b.y||a.x-b.x);const lines=[];
 for(const item of items){let line=lines.at(-1);if(!line||Math.abs(line.y-item.y)>Math.max(2,item.size*.2)){line={y:item.y,items:[]};lines.push(line);}line.items.push(item);}
 for(const line of lines){line.items.sort((a,b)=>a.x-b.x);line.text=line.items.map(i=>i.text).join(' ');}
 for(let n=0;n<lines.length;n++){
  if(!startsLegal.test(lines[n].text))continue;
  const tail=lines.slice(n),combined=tail.map(l=>l.text).join(' ');
  if(!startsLegal.test(tail[0].text)||!legal.test(combined)||forbidden.test(combined)||tail.some(l=>!legal.test(l.text)))continue;
  // Require an actual rights statement or dated copyright, not the word permission alone.
  if(!/(?:©\s*\d{4}|copyright\s*(?:©\s*)?\d{4}|all rights reserved|used by permission|may be copied)/i.test(combined))continue;
  const boxes=tail.flatMap(l=>l.items),first=Math.floor(Math.min(...boxes.map(i=>i.top)));
  if(!Number.isFinite(first)||first<h*.5||first>bottom||bottom-first>h*.18)continue;
  let inkTop=first;while(inkTop<=bottom&&rows[inkTop]?.right<0)inkTop++;
  let previous=first-1;while(previous>=0&&rows[previous].right<0)previous--;
  if(previous<top||inkTop-previous<w*.015)continue;
  // Every trailing ink pixel must belong to an extracted text box. This rejects
  // staff lines, raster graphics, later music, and unextracted notice lines.
  let covered=true;
  for(let y=first;y<=bottom&&covered;y++)for(let x=rows[y].left;x<=rows[y].right;x++){
   const i=(y*w+x)*4;if(!data[i+3]||(data[i]===255&&data[i+1]===255&&data[i+2]===255))continue;
   if(!boxes.some(q=>y>=q.top&&y<=q.bottom&&x>=q.x-3&&x<=q.x+q.width+3)){covered=false;break;}
  }
  if(!covered)continue;
  result.bottom=Math.min(first,previous+1+pad);
  result.footer={top:Math.max(previous+1,inkTop-pad),bottom:Math.min(h,bottom+1+pad),text:combined};break;
 }
 return result;
}
