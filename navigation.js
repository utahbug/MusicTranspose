// View navigation only. Score content and transposition remain owned by app.js.
const $=id=>document.getElementById(id),panel=$('settings-dialog');
const storageKey='music-transpose-navigation-v1';
let saved={};try{saved=JSON.parse(sessionStorage.getItem(storageKey)||'{}');}catch{}
if(!saved||typeof saved!=='object')saved={};
let mode=['continuous','hybrid','auto','pages'].includes(saved.mode)?saved.mode:'continuous';
let speed=Number.isFinite(saved.speed)?Math.max(1,Math.min(60,saved.speed)):12;
let pageIndex=0;
let running=false,frame=0,lastTime=0,position=0,expected=0;
function persist(){try{sessionStorage.setItem(storageKey,JSON.stringify({mode,speed}));}catch{}}
function sync(){
 syncPages();
 document.querySelectorAll('input[name="navigation"]').forEach(e=>e.checked=e.value===mode);
 $('auto-options').hidden=mode!=='auto';$('hybrid-help').hidden=mode!=='hybrid';
 $('navigation-strip').hidden=mode==='continuous';$('page-controls').hidden=mode!=='pages';$('auto-toggle').hidden=mode!=='auto';$('speed-summary').hidden=mode!=='auto';$('screenful-next').hidden=mode!=='hybrid';
 $('scroll-speed').value=speed;$('speed-value').textContent=speed+' px/s';$('speed-summary').textContent=speed+' px/s';
 $('auto-toggle').textContent=running?'Pause scrolling':'Start scrolling';$('auto-toggle').setAttribute('aria-pressed',String(running));$('settings-auto-start').textContent=running?'Pause scrolling':'Start scrolling';
}
function pause(message='Paused'){if(!running)return;running=false;cancelAnimationFrame(frame);$('navigation-status').textContent=message;sync();}
function tick(time){if(!running)return;const dt=Math.min((time-lastTime)/1000,.1);lastTime=time;position+=speed*dt;window.scrollTo({top:position,behavior:'instant'});expected=scrollY;
 if(scrollY>=document.documentElement.scrollHeight-innerHeight-1){pause('End of score');return;}frame=requestAnimationFrame(tick);}
function start(){if(!window.prototype?.ready||prototype.busy)return;position=scrollY;expected=scrollY;lastTime=performance.now();running=true;$('navigation-status').textContent='';sync();frame=requestAnimationFrame(tick);}
function toggle(){running?pause():start();}
function advance(){pause();const bar=document.querySelector('.masthead').getBoundingClientRect().height;window.scrollBy({top:Math.max(1,(innerHeight-bar)*.85),behavior:'instant'});}
$('settings').onclick=()=>{pause();sync();panel.showModal();panel.querySelector('input:checked:not(:disabled)')?.focus();};$('close-settings').onclick=()=>panel.close();
for(const input of panel.querySelectorAll('input[name="navigation"]'))input.onchange=()=>{const wasPage=mode==='pages';pause();mode=input.value;pageIndex=0;if(wasPage||mode==='pages')window.scrollTo({top:0,behavior:'instant'});$('navigation-status').textContent='';persist();sync();};
$('scroll-speed').oninput=e=>{speed=Number(e.target.value);persist();sync();};
$('auto-toggle').onclick=toggle;$('settings-auto-start').onclick=()=>{panel.close();toggle();};$('screenful-next').onclick=advance;
// Only deliberate user inputs pause scrolling; our own scroll events do not.
document.addEventListener('wheel',()=>pause(),{passive:true});
document.addEventListener('pointerdown',e=>{if(!e.target.closest('#auto-toggle,#settings-auto-start'))pause();},{passive:true});
document.addEventListener('touchstart',e=>{if(e.target.closest('main'))pause();},{passive:true});
window.addEventListener('scroll',()=>{if(running&&Math.abs(scrollY-expected)>2)pause();},{passive:true});
document.addEventListener('keydown',e=>{
 if(document.body.classList.contains('library-open')||document.body.classList.contains('lyrics-open')||document.querySelector('dialog[open]')||e.target.closest('input,select,textarea,[contenteditable]'))return;
 if(mode==='pages'&&['PageDown','ArrowRight','PageUp','ArrowLeft','Home','End'].includes(e.key)){e.preventDefault();turn(e.key==='Home'?-Infinity:e.key==='End'?Infinity:['PageDown','ArrowRight'].includes(e.key)?1:-1);return;}
 if(mode==='hybrid'&&['PageDown','ArrowRight'].includes(e.key)){e.preventDefault();advance();return;}
 if(['ArrowDown','ArrowUp','PageDown','PageUp','Home','End',' '].includes(e.key))pause();
});
for(const name of ['blur','resize','beforeprint'])window.addEventListener(name,()=>pause());
document.addEventListener('visibilitychange',()=>{if(document.hidden)pause();});
new MutationObserver(()=>{pause();sync();}).observe($('score'),{childList:true,attributes:true,attributeFilter:['aria-busy']});
// Clearance tracks one/two-row phone toolbars and the optional navigation strip.
new ResizeObserver(()=>{const height=document.querySelector('.masthead').getBoundingClientRect().height;const safe=parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--playing-safe-bottom'))||0;document.documentElement.style.setProperty('--playing-bar-height',Math.max(54,height-safe)+'px');if(mode==='pages')fitPage();}).observe(document.querySelector('.masthead'));


// Real PDF page boundaries only; continuous OSMD SVGs are not fake pages.
function pages(){return [...$('score').querySelectorAll(':scope > .pdf-page-frame')];}
function playing(){return !document.body.classList.contains('library-open')&&!document.body.classList.contains('lyrics-open');}
function fitPage(){const frames=pages(),bar=document.querySelector('.masthead').getBoundingClientRect().height;for(const frame of frames){const b=JSON.parse(frame.dataset.trim||'null');if(b){const ratio=(b.right-b.left)/(b.bottom-b.top);frame.style.setProperty('--pdf-page-fit',Math.max(120,innerHeight-bar-80)*ratio+'px');}}}
function syncStart(){$('return-start').hidden=mode!=='continuous'||!playing()||scrollY<100;}
function syncPages(){
 const frames=pages(),available=frames.length>0&&document.body.classList.contains('pdf-score-open');
 const input=panel.querySelector('input[value=pages]');input.disabled=!available;$('page-mode-choice').classList.toggle('unavailable',!available);
 $('page-mode-note').textContent=available?'Tap the left or right half of a page, or use the page buttons / arrow keys.':'Page turns require a paginated PDF. MXL uses continuous engraving.';
 if(mode==='pages'&&!available&&window.prototype?.ready){mode='continuous';persist();}
 document.body.classList.toggle('page-navigation',mode==='pages'&&available);pageIndex=Math.max(0,Math.min(pageIndex,frames.length-1));
 frames.forEach((f,i)=>{f.classList.toggle('current-page',i===pageIndex);if(mode==='pages')f.setAttribute('aria-hidden',String(i!==pageIndex));else f.removeAttribute('aria-hidden');});
 $('page-position').textContent=frames.length?`${pageIndex+1} / ${frames.length}`:'';$('page-previous').disabled=pageIndex===0;$('page-next').disabled=pageIndex>=frames.length-1;
 fitPage();syncStart();
}
function turn(delta){if(mode!=='pages'||!playing())return;const count=pages().length;if(!count)return;const next=Math.max(0,Math.min(count-1,pageIndex+delta));if(next===pageIndex)return;pageIndex=next;sync();window.scrollTo({top:0,behavior:'instant'});}
$('page-previous').onclick=()=>turn(-1);$('page-next').onclick=()=>turn(1);
$('return-start').onclick=()=>{pause();window.scrollTo({top:0,behavior:'instant'});syncStart();};
let pageGesture=null;
const safePage=e=>e.target instanceof Element&&!e.target.closest('button,a,input,select,textarea,dialog,[role=button],[contenteditable],[tabindex]');
$('score').addEventListener('pointerdown',e=>{pageGesture=mode==='pages'&&playing()&&e.isPrimary&&e.button===0&&safePage(e)?{id:e.pointerId,x:e.clientX,y:e.clientY,scroll:scrollY,time:performance.now()}:null;},{passive:true});
$('score').addEventListener('pointermove',e=>{if(pageGesture&&Math.hypot(e.clientX-pageGesture.x,e.clientY-pageGesture.y)>8)pageGesture=null;},{passive:true});
$('score').addEventListener('pointercancel',()=>pageGesture=null,{passive:true});
$('score').addEventListener('pointerup',e=>{const g=pageGesture;pageGesture=null;if(!g||g.id!==e.pointerId||!safePage(e)||Math.hypot(e.clientX-g.x,e.clientY-g.y)>8||performance.now()-g.time>450||Math.abs(scrollY-g.scroll)>2||!getSelection().isCollapsed)return;const r=$('score').getBoundingClientRect();turn(e.clientX<r.left+r.width/2?-1:1);},{passive:true});
window.addEventListener('scroll',()=>{pageGesture=null;syncStart();},{passive:true});
window.addEventListener('resize',()=>{fitPage();syncStart();});
$('pdf-trim').addEventListener('change',fitPage);
document.addEventListener('library-open',()=>{pause();pageGesture=null;pageIndex=0;$('return-start').hidden=true;});
sync();
