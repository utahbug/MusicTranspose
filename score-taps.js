// PrimarySongs v528: equal left/right halves, upper quarter First/Last.
// PDF and MXL share zone proportions; navigation.js retains PDF's Page Turns rule.
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
 return {left:r.left,top,width:r.width,height,upper:.25};
}
export function scoreTapAction(x,y,r=scoreTapGeometry()){
 if(r.width<=0||r.height<=0||x<r.left||x>r.left+r.width||y<r.top||y>r.top+r.height)return null;
 const left=x<r.left+r.width/2,upper=y<=r.top+r.height*r.upper;
 return upper?(left?-Infinity:Infinity):(left?-1:1);
}
export function installScoreTaps({enabled,navigate}){
 const host=$('playing-view');
 let gesture=null;
 const cancel=()=>{const g=gesture;gesture=null;if(g&&host.hasPointerCapture(g.id))host.releasePointerCapture(g.id);};
 const available=()=>enabled()&&!document.querySelector('dialog[open],#score-size-options:not([hidden]),#score-tools-menu:not([hidden]),#score-navigation-menu:not([hidden])');
 const safe=target=>available()&&target instanceof Element&&!target.closest(interactive);
 // One pointer stream owns navigation; touchend and compatibility clicks never navigate.
 document.addEventListener('pointerdown',e=>{
  // Mutations which predate this pointer cannot invalidate its new gesture.
  scoreChanges.takeRecords();controlChanges.takeRecords();
  cancel();if(!host.contains(e.target)||!e.isPrimary||e.button!==0||!safe(e.target))return;
  const action=scoreTapAction(e.clientX,e.clientY);if(action===null)return;
  // Input type, never score format, determines slop and down-zone retention.
  const touch=e.pointerType==='touch';
  gesture={id:e.pointerId,x:e.clientX,y:e.clientY,time:performance.now(),action,touch,tolerance:touch?16:10};
  // Capture on the stable view, not an SVG slice which virtual pages may replace.
  if(touch&&e.isTrusted)host.setPointerCapture(e.pointerId);
 },true);
 document.addEventListener('pointermove',e=>{if(gesture&&(e.pointerId!==gesture.id||Math.hypot(e.clientX-gesture.x,e.clientY-gesture.y)>gesture.tolerance))cancel();},{passive:true});
 document.addEventListener('pointerup',e=>{
  const g=gesture;cancel();if(!g||g.id!==e.pointerId)return;
  // Captured touch events target the host; still reject releases over real controls.
  const target=g.touch?document.elementFromPoint(e.clientX,e.clientY):e.target;
  if(!host.contains(target)||!safe(target)||performance.now()-g.time>600||Math.hypot(e.clientX-g.x,e.clientY-g.y)>g.tolerance||scoreTapAction(e.clientX,e.clientY)===null||(!g.touch&&scoreTapAction(e.clientX,e.clientY)!==g.action)||!getSelection().isCollapsed)return;
  navigate(g.action);
 },{passive:true});
 for(const event of ['pointercancel','lostpointercapture','score-session-reset','score-engraved','library-open','visibilitychange'])document.addEventListener(event,cancel,true);
 for(const event of ['scroll','resize','blur','beforeprint'])window.addEventListener(event,cancel,{passive:true});
 // Semantic score changes cancel; harmless DOM maintenance does not own gestures.
 const scoreChanges=new MutationObserver(records=>{if(records.some(r=>r.oldValue==='true')||$('score').getAttribute('aria-busy')==='true')cancel();});
 scoreChanges.observe($('score'),{attributes:true,attributeFilter:['aria-busy'],attributeOldValue:true});
 const controlChanges=new MutationObserver(records=>{
  // Also catch a blocking control opened and closed within the same task.
  const wasBlocking=records.some(r=>r.attributeName==='open'?r.target.matches('dialog')&&r.oldValue!==null:r.target.matches('#score-size-options,#score-tools-menu,#score-navigation-menu')&&r.oldValue===null);
  if(!available()||wasBlocking)cancel();
 });
 controlChanges.observe(document.body,{subtree:true,attributes:true,attributeFilter:['open','hidden'],attributeOldValue:true});
 return cancel;
}
