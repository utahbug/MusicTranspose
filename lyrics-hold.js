// A deliberate, view-scoped hold. Scrolling, movement, cancellation and extra
// pointers cancel it; a short press keeps the target's ordinary behavior.
export function attachLyricsHold(target,activate){
 const abort=new AbortController(),signal=abort.signal;let pending=null,timer=0;
 const cancel=()=>{clearTimeout(timer);timer=0;pending=null;};
 const start=gesture=>{cancel();pending=gesture;timer=setTimeout(()=>{if(!pending||!target.isConnected||document.hidden)return cancel();pending=null;timer=0;activate();},2000);};
 const eligible=e=>target.contains(e.target)&&!e.target.closest('button,a,input,select,textarea');
 target.addEventListener('pointerdown',e=>{if(e.isPrimary&&e.button===0&&eligible(e))start({id:e.pointerId,x:e.clientX,y:e.clientY});else cancel();},{signal,passive:true});
 document.addEventListener('pointerdown',e=>{if(pending&&pending.id!==e.pointerId)cancel();},{signal,passive:true});
 document.addEventListener('pointermove',e=>{if(pending&&pending.id===e.pointerId&&Math.hypot(e.clientX-pending.x,e.clientY-pending.y)>8)cancel();},{signal,passive:true});
 for(const type of ['pointerup','pointercancel','lostpointercapture'])document.addEventListener(type,cancel,{signal,passive:true});
 target.addEventListener('contextmenu',e=>{if(eligible(e)){e.preventDefault();}},{signal});
 target.addEventListener('keydown',e=>{if(e.target!==target||![' ','Enter'].includes(e.key))return;e.preventDefault();if(!e.repeat)start({key:e.key});},{signal});
 target.addEventListener('keyup',cancel,{signal});target.addEventListener('blur',cancel,{signal});
 window.addEventListener('scroll',cancel,{signal,passive:true,capture:true});window.addEventListener('blur',cancel,{signal});window.addEventListener('resize',cancel,{signal,passive:true});document.addEventListener('visibilitychange',cancel,{signal});
 return ()=>{cancel();abort.abort();};
}
