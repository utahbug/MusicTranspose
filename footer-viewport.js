// Phone footer geometry only; navigation defaults and engraving policy are unchanged.
export const phoneFooter = () => matchMedia('(max-width:600px), (max-height:600px) and (pointer:coarse)').matches;
export function footerObstruction(layoutBottom, visibleBottom, unshiftedBottom=layoutBottom){
 return Math.max(0, unshiftedBottom-visibleBottom);
}
export function scoreFooterTop(){
 const bar=document.querySelector('.masthead').getBoundingClientRect();
 return phoneFooter()?bar.top:innerHeight-bar.height;
}
let inset=0,frame=0,installed=false,lastGeometry='';
export function installFooterViewport(){
 if(installed)return;installed=true;
 const isIPhone=/iPhone/i.test(navigator.userAgent);
 const playingIPhone=()=>isIPhone&&(document.body.classList.contains('lyrics-open')||!document.body.classList.contains('library-open'));
 let touching=false,settleTimer=0;
 const settleDelay=200;
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
  frame=0;if(playingIPhone()&&touching)return;const v=window.visualViewport;
  // Pinch zoom is a magnified/pannable view, not a new engraving size.
  if(phoneFooter()&&v&&Math.abs(v.scale-1)>.01)return;
  const footer=[...document.querySelectorAll('.masthead,.lyrics-footer')].find(e=>e.getClientRects().length);
  // Some browser states already move fixed elements. Undo only our own inset
  // to measure that native anchor and avoid lifting the footer twice.
  const anchor=footer?footer.getBoundingClientRect().bottom+inset:innerHeight;
  const next=phoneFooter()&&v?Math.round(footerObstruction(innerHeight,v.offsetTop+v.height,anchor)*100)/100:0;
  const geometry=[next,anchor,v?.height,v?.offsetTop,innerHeight].join(':');
  if(geometry===lastGeometry)return;lastGeometry=geometry;
  inset=next;document.documentElement.style.setProperty('--footer-viewport-inset',inset+'px');
  document.dispatchEvent(new Event('footer-viewport-change'));
 }
 const queueUpdate=()=>{if(!frame)frame=requestAnimationFrame(update);};
 const cancelPending=()=>{clearTimeout(settleTimer);settleTimer=0;if(frame){cancelAnimationFrame(frame);frame=0;}};
 const schedule=()=>{
  if(!playingIPhone()){clearTimeout(settleTimer);settleTimer=0;queueUpdate();return;}
  // Safari's chrome animation and inertial scroll are not stable footer anchors.
  // Preserve the committed inset while touching; publish once after quiet settles.
  cancelPending();
  if(!touching)settleTimer=setTimeout(()=>{settleTimer=0;queueUpdate();},settleDelay);
 };
 if(isIPhone){
  document.addEventListener('touchstart',()=>{if(playingIPhone()){touching=true;cancelPending();}},{passive:true});
  const endTouch=e=>{if(e.touches.length)return;touching=false;schedule();};
  for(const type of ['touchend','touchcancel'])document.addEventListener(type,endTouch,{passive:true});
  window.addEventListener('scroll',()=>{if(playingIPhone())schedule();},{passive:true});
  document.addEventListener('visibilitychange',()=>{if(document.hidden)touching=false;schedule();});
 }

 for(const type of ['resize','orientationchange'])window.addEventListener(type,()=>{reserveScrollbar();schedule();});
 for(const type of ['resize','scroll'])window.visualViewport?.addEventListener(type,schedule);
 for(const type of ['score-view-shown','library-open'])document.addEventListener(type,schedule);
 reserveScrollbar();schedule();
}
