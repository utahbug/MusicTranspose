// PrimarySongs v528: equal left/right halves, upper quarter First/Last.
// PDF keeps MusicTranspose's existing half-height boundary and page-mode behavior.
const $=id=>document.getElementById(id);
const interactive='button,a,input,select,textarea,label,summary,dialog,[role=button],[role=slider],[role=menu],[role=menuitem],[role=link],[role=checkbox],[role=radio],[role=switch],[role=tab],[role=combobox],[role=spinbutton],[role=textbox],[contenteditable],[tabindex],audio,video';
export function scoreVisibleBottom(){
 const clearance=document.body.classList.contains('continuous-return-visible')?parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--return-clearance'))||0:0;
 return Math.min(innerHeight,document.querySelector('.masthead').getBoundingClientRect().top)-clearance;
}
export function scoreTapGeometry(){
 const r=$('score').getBoundingClientRect(),pdf=document.body.classList.contains('pdf-score-open');
 const bottom=scoreVisibleBottom();
 const top=pdf?r.top:Math.max(0,r.top),height=pdf?r.height:Math.max(0,bottom-top-8);
 return {left:r.left,top,width:r.width,height,upper:pdf?.5:.25};
}
export function scoreTapAction(x,y,r=scoreTapGeometry()){
 if(r.width<=0||r.height<=0||x<r.left||x>r.left+r.width||y<r.top||y>r.top+r.height)return null;
 const left=x<r.left+r.width/2,upper=y<=r.top+r.height*r.upper;
 return upper?(left?-Infinity:Infinity):(left?-1:1);
}
export function installScoreTaps({enabled,navigate}){
 const host=$('playing-view');
 let gesture=null;
 const cancel=()=>{gesture=null;};
 const safe=e=>enabled()&&!document.querySelector('dialog[open],#score-size-options:not([hidden])')&&e.target instanceof Element&&!e.target.closest(interactive);
 // One pointer stream for both mouse and touch. No touchend/click navigation,
 // so the browser's compatibility click cannot cause a second action.
 document.addEventListener('pointerdown',e=>{
  cancel();if(!host.contains(e.target)||!e.isPrimary||e.button!==0||!safe(e))return;
  const action=scoreTapAction(e.clientX,e.clientY);if(action===null)return;
  gesture={id:e.pointerId,x:e.clientX,y:e.clientY,time:performance.now(),action};
 },true);
 document.addEventListener('pointermove',e=>{if(gesture&&(e.pointerId!==gesture.id||Math.hypot(e.clientX-gesture.x,e.clientY-gesture.y)>10))cancel();},{passive:true});
 document.addEventListener('pointerup',e=>{
  const g=gesture;cancel();if(!g||g.id!==e.pointerId||!host.contains(e.target)||!safe(e)||performance.now()-g.time>600||Math.hypot(e.clientX-g.x,e.clientY-g.y)>10||scoreTapAction(e.clientX,e.clientY)!==g.action||!getSelection().isCollapsed)return;
  navigate(g.action);
 },{passive:true});
 for(const event of ['pointercancel','lostpointercapture','score-session-reset','score-engraved','library-open','visibilitychange'])document.addEventListener(event,cancel,true);
 for(const event of ['scroll','resize','blur','beforeprint'])window.addEventListener(event,cancel,{passive:true});
 // Opening/closing controls or replacing a score invalidates any in-flight tap.
 new MutationObserver(cancel).observe($('score'),{childList:true,attributes:true,attributeFilter:['aria-busy']});
 new MutationObserver(cancel).observe(document.body,{subtree:true,attributes:true,attributeFilter:['open','hidden']});
 return cancel;
}
