// Adapted from PrimarySongs v528 PDF annotations (610a1eb). Original PDF pixels stay untouched.
const storageKey='music-transpose-pdf-annotations-v1';
const colors=['#245A9A','#C62828','#7A3045','#B67817'];
const tools=['pencil','highlighter','eraser'];
const clone=strokes=>strokes.map(s=>({...s,points:s.points.map(p=>({...p}))}));
const clamp=n=>Math.max(0,Math.min(1,n));
function readStore(){try{const data=JSON.parse(localStorage.getItem(storageKey)||'null');if(data?.version===1&&data.documents&&typeof data.documents==='object')return data;}catch{}return {version:1,documents:{},preferences:{}};}
export function createPdfAnnotations({getState}){
 const $=id=>document.getElementById(id),host=$('score'),button=$('score-annotate'),panel=$('pdf-annotation-panel'),toolbar=$('pdf-annotation-toolbar'),notice=$('pdf-annotation-notice');
 let data=readStore(),active=false,selected=null,gesture=null,scheduled=0,storageFailed=false;
 let tool=tools.includes(data.preferences?.tool)?data.preferences.tool:'pencil',color=colors.includes(data.preferences?.color)?data.preferences.color:colors[0];
 const layers=new Map(),undoByPage=new Map();
 const frames=()=>[...host.querySelectorAll(':scope > .pdf-page-frame')];
 const available=()=>{const s=getState();return s.available&&s.pdf&&frames().length>0;};
 function readingFrame(){const list=frames();if(document.body.classList.contains('page-navigation'))return list.find(f=>f.classList.contains('current-page'))||list[0];const bottom=document.querySelector('.masthead').getBoundingClientRect().top;return list.reduce((best,f)=>{const r=f.getBoundingClientRect(),visible=Math.max(0,Math.min(r.bottom,bottom)-Math.max(r.top,0));return visible>best.visible?{frame:f,visible}:best;},{frame:list[0],visible:0}).frame;}
 function identity(frame){const {song}=getState();const source=song.local?song.hash:(song.pdfAsset||song.asset)+'#'+frame.dataset.pdfDocument;return {key:JSON.stringify([song.id,source]),songId:song.id,source};}
 function pageKey(frame){return identity(frame).key+':'+frame.dataset.pdfPage;}
 function strokes(frame){const value=data.documents[identity(frame).key]?.pages?.[frame.dataset.pdfPage];return Array.isArray(value)?value:[];}
 function persist(){try{localStorage.setItem(storageKey,JSON.stringify(data));storageFailed=false;}catch{storageFailed=true;}notice.textContent=storageFailed?'Marks are only saved for this session: browser storage is unavailable.':'Page turning paused while marking. Marks stay in this browser; prints remain clean.';}
 function save(frame,value){const id=identity(frame);const doc=data.documents[id.key]||{songId:id.songId,source:id.source,pages:{}};if(value.length)doc.pages[frame.dataset.pdfPage]=value;else delete doc.pages[frame.dataset.pdfPage];if(Object.keys(doc.pages).length)data.documents[id.key]=doc;else delete data.documents[id.key];persist();}
 function pushUndo(frame,value){const key=pageKey(frame),history=undoByPage.get(key)||[];history.push(clone(value));if(history.length>20)history.shift();undoByPage.set(key,history);}
 function controls(){
  const list=frames(),index=list.indexOf(selected);button.disabled=!available();button.title=button.disabled?'Annotations are available in Original PDF view only':active?'Finish annotating':'Annotate this PDF';button.setAttribute('aria-label',button.title);button.setAttribute('aria-pressed',String(active));
  toolbar.querySelectorAll('[data-annotation-tool]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.annotationTool===tool)));
  toolbar.querySelectorAll('[data-annotation-color]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.annotationColor===color)));
  $('pdf-annotation-undo').disabled=!selected||!undoByPage.get(pageKey(selected))?.length;
  $('pdf-annotation-clear').disabled=!selected||!strokes(selected).length;
  $('pdf-annotation-previous').disabled=index<=0;$('pdf-annotation-next').disabled=index<0||index>=list.length-1;
  $('pdf-annotation-page').textContent=index>=0?`Page ${index+1} of ${list.length}`:'';
 }
 function draw(ctx,stroke,canvas,rect){
  if(!stroke?.points?.length||!['pencil','highlighter'].includes(stroke.tool))return;
  ctx.save();ctx.strokeStyle=colors.includes(stroke.color)?stroke.color:colors[0];ctx.globalAlpha=stroke.tool==='highlighter'?.3:.94;
  ctx.lineWidth=Math.max(stroke.tool==='highlighter'?14:2.2,Math.min(rect.width,rect.height)*(stroke.tool==='highlighter'?.022:.0035))*canvas.width/rect.width;
  ctx.lineCap='round';ctx.lineJoin='round';ctx.beginPath();stroke.points.forEach((p,i)=>{const x=clamp(p.x)*canvas.width,y=clamp(p.y)*canvas.height;if(i)ctx.lineTo(x,y);else ctx.moveTo(x,y);});if(stroke.points.length===1)ctx.lineTo(stroke.points[0].x*canvas.width+.1,stroke.points[0].y*canvas.height+.1);ctx.stroke();ctx.restore();
 }
 function render(frame){const canvas=layers.get(frame),source=frame.querySelector('.pdf-page');if(!canvas||!source)return;
  // Overlay and source share the full untrimmed raster, including identical negative trim offsets.
  for(const prop of ['width','left','top'])canvas.style[prop]=source.style[prop];
  const rect=canvas.getBoundingClientRect();if(!rect.width||!rect.height)return;
  const ctx=canvas.getContext('2d');ctx.clearRect(0,0,canvas.width,canvas.height);
  const value=gesture?.frame===frame?gesture.working:strokes(frame);for(const stroke of value)draw(ctx,stroke,canvas,rect);
  if(gesture?.frame===frame&&gesture.stroke)draw(ctx,gesture.stroke,canvas,rect);
 }
 function cancelGesture(){const g=gesture;gesture=null;if(g){if(g.canvas.hasPointerCapture(g.id))g.canvas.releasePointerCapture(g.id);render(g.frame);}}
 function schedule(){if(scheduled)return;scheduled=requestAnimationFrame(()=>{scheduled=0;if(gesture){const r=gesture.canvas.getBoundingClientRect();if(Math.abs(r.width-gesture.rect.width)>.5||Math.abs(r.height-gesture.rect.height)>.5)cancelGesture();}selected=readingFrame();for(const frame of frames())render(frame);controls();});}
 const resize=new ResizeObserver(schedule);
 function sync(){
  if(!available()){setMode(false);button.disabled=true;button.title='Annotations are available in Original PDF view only';button.setAttribute('aria-label',button.title);return;}
  for(const [frame] of layers)if(!frame.isConnected){resize.unobserve(frame);layers.delete(frame);}
  for(const frame of frames())if(!layers.has(frame)){
   const source=frame.querySelector('.pdf-page'),canvas=document.createElement('canvas');canvas.className='pdf-annotation-canvas';canvas.width=source.width;canvas.height=source.height;canvas.setAttribute('aria-label',`PDF annotation drawing layer, page ${frame.dataset.pdfPage}`);frame.append(canvas);layers.set(frame,canvas);resize.observe(frame);
   canvas.addEventListener('pointerdown',e=>down(e,frame,canvas));canvas.addEventListener('pointermove',move);canvas.addEventListener('pointerup',up);canvas.addEventListener('pointercancel',cancelGesture);canvas.addEventListener('lostpointercapture',cancelGesture);
  }
  selected=readingFrame();schedule();controls();
 }
 function setMode(value,focus=false){const next=!!value&&available();if(next===active)return;cancelGesture();active=next;document.body.classList.toggle('pdf-annotation-active',active);panel.hidden=!active;
  document.dispatchEvent(new CustomEvent('pdf-annotation-mode',{detail:{active}}));
  if(active){selected=readingFrame();sync();requestAnimationFrame(()=>{if(active)toolbar.querySelector(`[data-annotation-tool="${tool}"]`).focus({preventScroll:true});});}else if(focus) $('score-tools').focus({preventScroll:true});controls();
 }
 function point(e,canvas){const r=canvas.getBoundingClientRect();return {x:clamp((e.clientX-r.left)/r.width),y:clamp((e.clientY-r.top)/r.height)};}
 function erase(point){const g=gesture,r=g.canvas.getBoundingClientRect(),p={x:point.x*r.width,y:point.y*r.height};
  const near=(a,b)=>{const ax=a.x*r.width,ay=a.y*r.height,dx=(b.x-a.x)*r.width,dy=(b.y-a.y)*r.height,t=Math.max(0,Math.min(1,((p.x-ax)*dx+(p.y-ay)*dy)/(dx*dx+dy*dy||1)));return Math.hypot(p.x-ax-t*dx,p.y-ay-t*dy)<=22;};
  g.working=g.working.filter(s=>!s.points.some((a,i)=>near(a,s.points[i+1]||a)));
 }
 function down(e,frame,canvas){
  if(!active||!available()||e.button!==0)return;if(gesture||!e.isPrimary){cancelGesture();return;}e.preventDefault();selected=frame;
  const before=clone(strokes(frame));gesture={id:e.pointerId,frame,canvas,rect:canvas.getBoundingClientRect(),before,working:clone(before),stroke:tool==='eraser'?null:{tool,color,points:[point(e,canvas)]}};
  if(e.isTrusted)canvas.setPointerCapture(e.pointerId);if(tool==='eraser')erase(point(e,canvas));render(frame);controls();
 }
 function move(e){if(!gesture||e.pointerId!==gesture.id)return;e.preventDefault();const samples=e.getCoalescedEvents?.();for(const sample of samples?.length?samples:[e]){const p=point(sample,gesture.canvas);if(gesture.stroke)gesture.stroke.points.push(p);else erase(p);}render(gesture.frame);}
 function up(e){if(!gesture||e.pointerId!==gesture.id)return;e.preventDefault();const g=gesture;if(g.stroke){const last=g.stroke.points.at(-1),end=point(e,g.canvas);if(last.x!==end.x||last.y!==end.y)g.stroke.points.push(end);g.working.push(g.stroke);}gesture=null;
  if(g.stroke||g.working.length!==g.before.length){pushUndo(g.frame,g.before);save(g.frame,g.working);}if(g.canvas.hasPointerCapture(g.id))g.canvas.releasePointerCapture(g.id);render(g.frame);controls();
 }
 button.addEventListener('click',()=>setMode(!active));$('pdf-annotation-done').onclick=()=>setMode(false,true);
 for(const b of toolbar.querySelectorAll('[data-annotation-tool],[data-annotation-color]'))b.onclick=()=>{cancelGesture();if(b.dataset.annotationTool)tool=b.dataset.annotationTool;else{color=b.dataset.annotationColor;if(tool==='eraser')tool='pencil';}data.preferences={tool,color};persist();controls();};
 $('pdf-annotation-undo').onclick=()=>{cancelGesture();const history=selected&&undoByPage.get(pageKey(selected));if(history?.length){save(selected,history.pop());render(selected);controls();}};
 $('pdf-annotation-clear').onclick=()=>{cancelGesture();if(selected&&strokes(selected).length&&confirm('Clear all annotations from this page?')){pushUndo(selected,strokes(selected));save(selected,[]);render(selected);controls();}};
 for(const [id,delta] of [['pdf-annotation-previous',-1],['pdf-annotation-next',1]])$(id).onclick=()=>{cancelGesture();document.dispatchEvent(new CustomEvent('pdf-annotation-turn',{detail:{frame:selected,delta}}));};
 document.addEventListener('pdf-annotation-page-shown',e=>{cancelGesture();selected=e.detail;schedule();});
 new MutationObserver(records=>{if(records.some(r=>r.target.matches('.pdf-page-frame,.pdf-page')))schedule();}).observe(host,{subtree:true,attributes:true,attributeFilter:['style','class']});
 for(const event of ['score-session-reset','library-open','beforeprint']) (event==='beforeprint'?window:document).addEventListener(event,()=>setMode(false));
 window.addEventListener('scroll',()=>{if(active&&!gesture)schedule();},{passive:true});window.addEventListener('blur',cancelGesture);window.addEventListener('resize',()=>{cancelGesture();schedule();});
 document.addEventListener('visibilitychange',()=>{if(document.hidden)cancelGesture();});document.addEventListener('score-view-shown',sync);
 document.addEventListener('local-music-deleted',e=>{for(const [key,doc] of Object.entries(data.documents))if(doc.songId===e.detail){delete data.documents[key];for(const page of undoByPage.keys())if(page.startsWith(key+':'))undoByPage.delete(page);}persist();});
 sync();return {sync};
}
