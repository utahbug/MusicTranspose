// Shared viewport timing; playing and workspace geometry remain independent.
export const phoneFooter = () => matchMedia('(max-width:600px), (max-height:600px) and (pointer:coarse)').matches;
export function footerObstruction(layoutBottom, visibleBottom, unshiftedBottom=layoutBottom){
 return Math.max(0, unshiftedBottom-visibleBottom);
}
export function scoreFooterTop(){
 const bar=document.querySelector('.masthead').getBoundingClientRect();
 return bar.top;
}
// iPadOS can advertise a desktop Mac user agent, including on iPad mini.
export const iosTouchViewport=()=>/iPhone|iPad|iPod/i.test(navigator.userAgent)||(/Mac/i.test(navigator.platform)&&navigator.maxTouchPoints>1);
let viewportSchedule;
export function onSettledFooterViewport(callback){
 if(!viewportSchedule){
  const callbacks=new Set(),ios=iosTouchViewport();
  let touching=false,timer=0,frame=0;
  const cancel=()=>{clearTimeout(timer);timer=0;if(frame){cancelAnimationFrame(frame);frame=0;}};
  const publish=()=>{frame=0;if(touching||document.hidden)return;for(const run of callbacks)run();};
  const schedule=()=>{
   cancel();if(touching||document.hidden)return;
   if(ios)timer=setTimeout(()=>{timer=0;frame=requestAnimationFrame(publish);},200);
   else frame=requestAnimationFrame(publish);
  };
  if(ios){
   document.addEventListener('touchstart',()=>{touching=true;cancel();},{passive:true,capture:true});
   const end=e=>{if(e.touches.length)return;touching=false;schedule();};
   for(const type of ['touchend','touchcancel'])document.addEventListener(type,end,{passive:true,capture:true});
  }
  // Capture nested scrolling too: momentum can outlive the final touch event.
  window.addEventListener('scroll',schedule,{passive:true,capture:true});
  for(const type of ['resize','scroll'])window.visualViewport?.addEventListener(type,schedule,{passive:true});
  for(const type of ['resize','orientationchange'])window.addEventListener(type,schedule,{passive:true});
  window.addEventListener('pageshow',()=>{touching=false;schedule();});
  document.addEventListener('visibilitychange',()=>{touching=false;schedule();});
  for(const type of ['focusin','focusout'])document.addEventListener(type,schedule);
  viewportSchedule={callbacks,schedule};
 }
 viewportSchedule.callbacks.add(callback);viewportSchedule.schedule();
 return viewportSchedule.schedule;
}
let inset=0,installed=false,lastGeometry='';
export function installFooterViewport(){
 if(installed)return;installed=true;
 // Reserve the native desktop scrollbar width only in the two footers.
 // The score/document itself keeps its existing width and scrolling policy.
 function reserveScrollbar(){
  let width=0;
  if(!phoneFooter()&&matchMedia('(hover:hover) and (pointer:fine)').matches){
   const probe=document.createElement('div');
   probe.style.cssText='position:fixed;left:-10000px;top:0;width:100px;height:100px;overflow:scroll;visibility:hidden;contain:strict';
   document.body.append(probe);width=probe.offsetWidth-probe.clientWidth;probe.remove();
  }
  document.documentElement.style.setProperty('--score-lyrics-scrollbar',width+'px');
 }
 function update(){
  const v=window.visualViewport;
  // Pinch zoom is a magnified/pannable view, not a new engraving size.
  if(v&&Math.abs(v.scale-1)>.01)return;
  const footer=[...document.querySelectorAll('.masthead,.lyrics-footer')].find(e=>e.getClientRects().length);
  if(!footer)return;
  // Some browser states already move fixed elements. Undo only our own inset
  // to measure that native anchor and avoid lifting the footer twice.
  const anchor=footer.getBoundingClientRect().bottom+inset;
  const next=(phoneFooter()||iosTouchViewport())&&v?Math.round(footerObstruction(innerHeight,v.offsetTop+v.height,anchor)*100)/100:0;
  const geometry=[next,anchor,v?.height,v?.offsetTop,innerHeight].join(':');
  if(geometry===lastGeometry)return;lastGeometry=geometry;
  if(inset!==next){inset=next;document.documentElement.style.setProperty('--footer-viewport-inset',inset+'px');}
  document.dispatchEvent(new Event('footer-viewport-change'));
 }
 const schedule=onSettledFooterViewport(update);
 for(const type of ['resize','orientationchange'])window.addEventListener(type,()=>{reserveScrollbar();schedule();});
 for(const type of ['score-view-shown','library-open'])document.addEventListener(type,schedule);
 reserveScrollbar();schedule();
}
