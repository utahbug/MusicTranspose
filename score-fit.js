// Phone-only visual zoom. Engraving width, source XML and print stay unchanged.
const button=document.getElementById('score-fit'),score=document.getElementById('score'),viewport=document.getElementById('score-fit-viewport');
const phone=matchMedia('(max-width:600px)');let scale=1,pinch=null;
const enabled=()=>phone.matches&&!document.body.classList.contains('pdf-score-open');
const clamp=n=>Math.max(.75,Math.min(3,n));
function sync(){
 const active=enabled();viewport.classList.toggle('pinch-enabled',active);
 viewport.style.setProperty('--score-fit-scale',String(active?scale:1));
 if(active){viewport.style.height=score.offsetHeight*scale+'px';}else viewport.style.removeProperty('height');
 button.dataset.scale=String(scale);button.setAttribute('aria-label','Reset score zoom');button.title='Fit score to width';
}
function apply(next,center,anchor){
 scale=clamp(next);sync();
 // Keep the musical point under the gesture midpoint while its scale changes.
 viewport.scrollLeft=anchor.x*scale-center.x;
 const top=viewport.getBoundingClientRect().top+scrollY;
 window.scrollTo({top:Math.max(0,top+anchor.y*scale-center.y),behavior:'instant'});
}
function centerOf(touches){const r=viewport.getBoundingClientRect();return {x:(touches[0].clientX+touches[1].clientX)/2-r.left,y:(touches[0].clientY+touches[1].clientY)/2};}
const distance=t=>Math.hypot(t[0].clientX-t[1].clientX,t[0].clientY-t[1].clientY);
viewport.addEventListener('touchstart',e=>{
 if(!enabled()||e.touches.length!==2)return;
 e.preventDefault();const center=centerOf(e.touches),r=viewport.getBoundingClientRect();
 pinch={distance:Math.max(1,distance(e.touches)),scale,anchor:{x:(viewport.scrollLeft+center.x)/scale,y:(center.y-r.top)/scale}};
},{passive:false});
viewport.addEventListener('touchmove',e=>{
 if(!enabled()||!pinch||e.touches.length!==2)return;e.preventDefault();
 apply(pinch.scale*distance(e.touches)/pinch.distance,centerOf(e.touches),pinch.anchor);
},{passive:false});
for(const event of ['touchend','touchcancel'])viewport.addEventListener(event,()=>{pinch=null;},{passive:true});
// Safari's separate gesture events must not also zoom the browser page here.
for(const event of ['gesturestart','gesturechange'])viewport.addEventListener(event,e=>{if(enabled())e.preventDefault();},{passive:false});
export function resetScoreFit(){scale=1;pinch=null;viewport.scrollLeft=0;sync();}
button.onclick=()=>{
 const r=viewport.getBoundingClientRect(),y=Math.max(r.top,0),anchor={x:0,y:(y-r.top)/scale};
 apply(1,{x:0,y},anchor);viewport.scrollLeft=0;
};
new ResizeObserver(sync).observe(score);
phone.addEventListener('change',resetScoreFit);
