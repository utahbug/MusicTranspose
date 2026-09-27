// Hidden, content-only four-tap entry. Pointer events avoid compatibility-click duplicates.
export function attachLyricsTaps(target,activate,enabled=()=>true){
 const abort=new AbortController(),signal=abort.signal;let pending=null,taps=[];
 const cancel=()=>{pending=null;taps=[];};
 const safe=e=>enabled()&&target.isConnected&&!document.hidden&&!document.querySelector('dialog[open]')&&e.target instanceof Element&&target.contains(e.target)&&!e.target.closest('button,a,input,select,textarea,label,summary,[role=button],[tabindex]:not([tabindex="-1"]),audio,video,[contenteditable]');
 document.addEventListener('pointerdown',e=>{if(!e.isPrimary||e.button!==0||!safe(e)){cancel();return;}pending={id:e.pointerId,x:e.clientX,y:e.clientY,time:performance.now()};},{signal,passive:true});
 document.addEventListener('pointermove',e=>{if(pending&&(e.pointerId!==pending.id||Math.hypot(e.clientX-pending.x,e.clientY-pending.y)>10))cancel();},{signal,passive:true});
 document.addEventListener('pointerup',e=>{const g=pending;pending=null;const now=performance.now();if(!g||g.id!==e.pointerId||!safe(e)||now-g.time>450||Math.hypot(e.clientX-g.x,e.clientY-g.y)>10){cancel();return;}taps=taps.filter(t=>now-t<=1500);taps.push(now);if(taps.length===4){cancel();activate();}},{signal,passive:true});
 for(const type of ['pointercancel','visibilitychange'])document.addEventListener(type,cancel,{signal,passive:true});
 document.addEventListener('lostpointercapture',()=>{if(pending)cancel();},{signal,passive:true});
 for(const type of ['scroll','resize'])window.addEventListener(type,cancel,{signal,passive:true,capture:true});
 window.addEventListener('blur',cancel,{signal});
 target.addEventListener('contextmenu',e=>{if(safe(e))e.preventDefault();},{signal});
 return ()=>{cancel();abort.abort();};
}
