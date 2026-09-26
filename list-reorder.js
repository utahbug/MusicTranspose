// Pointer capture supports mouse, pen and touch without making song titles draggable.
export function attachReorderHandle(handle,row,container,commit){
 let drag=null,frame=0;
 const clearMarks=()=>container.querySelectorAll('.drop-before,.drop-after').forEach(e=>e.classList.remove('drop-before','drop-after'));
 function locate(){
  clearMarks();if(!drag)return;
  const rows=[...container.querySelectorAll('[data-song]')].filter(e=>e!==row);
  const target=rows.find(e=>drag.y<e.getBoundingClientRect().bottom)||rows.at(-1);
  if(!target)return;
  const box=target.getBoundingClientRect(),before=drag.y<box.top+box.height/2;
  drag.target=target.dataset.song;drag.before=before;target.classList.add(before?'drop-before':'drop-after');
 }
 function tick(time){
  if(!drag)return;
  const dt=Math.min((time-drag.time)/1000,.05);drag.time=time;
  if(drag.moved){const edge=64,speed=drag.y<edge?-Math.min(1,(edge-drag.y)/edge)*420:drag.y>innerHeight-edge?Math.min(1,(drag.y-innerHeight+edge)/edge)*420:0;
   if(speed)window.scrollBy(0,speed*dt);locate();}
  frame=requestAnimationFrame(tick);
 }
 function finish(save){
  if(!drag)return;const result=drag;drag=null;cancelAnimationFrame(frame);clearMarks();row.classList.remove('dragging');
  document.removeEventListener('keydown',escape);window.removeEventListener('blur',cancel);
  if(handle.hasPointerCapture(result.pointer))handle.releasePointerCapture(result.pointer);
  // Let touchend finish on the original target before a render replaces its row.
  if(save&&result.moved&&result.target)setTimeout(()=>{if(row.isConnected)commit(result.target,result.before);},0);
 }
 const cancel=()=>finish(false),escape=e=>{if(e.key==='Escape'){e.preventDefault();cancel();}};
 // A handle owns its touch gesture; ordinary rows keep native scrolling.
 handle.addEventListener('touchstart',e=>e.preventDefault(),{passive:false});
 handle.addEventListener('pointerdown',e=>{
  if(!e.isPrimary||e.button!==0)return;if(e.pointerType==='mouse')e.preventDefault();handle.focus({preventScroll:true});
  drag={pointer:e.pointerId,start:e.clientY,y:e.clientY,time:performance.now(),moved:false};handle.setPointerCapture(e.pointerId);
  document.addEventListener('keydown',escape);window.addEventListener('blur',cancel);frame=requestAnimationFrame(tick);
 });
 handle.addEventListener('pointermove',e=>{if(!drag||e.pointerId!==drag.pointer)return;drag.y=e.clientY;if(Math.abs(drag.y-drag.start)>5){drag.moved=true;row.classList.add('dragging');locate();}});
 handle.addEventListener('pointerup',()=>finish(true));handle.addEventListener('pointercancel',cancel);handle.addEventListener('lostpointercapture',cancel);
 handle.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();});
}
