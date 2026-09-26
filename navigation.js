import {installScoreTaps,scoreVisibleBottom} from './score-taps.js';
import {setVirtualSource,resetVirtualSource,virtualAvailable,virtualFrames,prepareVirtualPages,displayVirtual,rememberReadingPosition,seekVirtualMeasure} from './virtual-pages.js';
// View navigation only. Score content and transposition remain owned by app.js.
const $=id=>document.getElementById(id),panel=$('settings-dialog');
const storageKey='music-transpose-navigation-v1';
const validMode=value=>['continuous','auto','pages'].includes(value);
const readPreference=storage=>{try{const value=JSON.parse(storage.getItem(storageKey)||'{}');return value&&typeof value==='object'?value:{};}catch{return {};}};
let saved={},local={};try{saved=readPreference(sessionStorage);}catch{}try{local=readPreference(localStorage);}catch{}
const preferred=validMode(local.mode)?local.mode:validMode(saved.mode)?saved.mode:null;
let hasChoice=preferred!==null;
// Desktop-style iPad Safari still reports touch; short-edge threshold excludes landscape phones.
const tabletTouch=(navigator.maxTouchPoints>0||matchMedia('(pointer:coarse)').matches)&&Math.min(innerWidth,innerHeight)>=600;
let mode=preferred||(tabletTouch?'pages':'continuous');
let speed=Number.isFinite(saved.speed)?Math.max(1,Math.min(60,saved.speed)):12;
let pageIndex=0;
let running=false,frame=0,lastTime=0,position=0,expected=0;
function persist(){try{sessionStorage.setItem(storageKey,JSON.stringify({...(hasChoice?{mode}:{}),speed}));}catch{}if(hasChoice)try{localStorage.setItem(storageKey,JSON.stringify({mode}));}catch{}}
function sync(){
 document.querySelectorAll('input[name="navigation"]').forEach(e=>e.checked=e.value===mode);
 $('auto-options').hidden=mode!=='auto';$('hybrid-help').hidden=mode!=='hybrid';
 $('navigation-strip').hidden=mode!=='auto'&&mode!=='hybrid';$('auto-toggle').hidden=mode!=='auto';$('speed-summary').hidden=mode!=='auto';$('screenful-next').hidden=mode!=='hybrid';
 // Measure pagination after any Auto-scroll strip has its final height.
 syncPages();
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
for(const input of panel.querySelectorAll('input[name="navigation"]'))input.onchange=()=>{
 const wasPage=mode==='pages',entering=!wasPage&&input.value==='pages',pdf=document.body.classList.contains('pdf-score-open');
 const location=entering&&!pdf?rememberReadingPosition():null;
 const pdfIndex=entering&&pdf?Math.max(0,pages().findIndex(f=>f.getBoundingClientRect().bottom>0)):0;
 pause();mode=input.value;hasChoice=true;pageIndex=pdfIndex;
 if(entering&&!pdf)seekVirtualMeasure(location?.measure||0);
 if(wasPage||mode==='pages')window.scrollTo({top:0,behavior:'instant'});
 $('navigation-status').textContent='';persist();sync();
};
$('scroll-speed').oninput=e=>{speed=Number(e.target.value);persist();sync();};
$('auto-toggle').onclick=toggle;$('settings-auto-start').onclick=()=>{panel.close();toggle();};$('screenful-next').onclick=advance;
// Only deliberate user inputs pause scrolling; our own scroll events do not.
document.addEventListener('wheel',()=>pause(),{passive:true});
document.addEventListener('pointerdown',e=>{if(!e.target.closest('#auto-toggle,#settings-auto-start'))pause();},{passive:true});
document.addEventListener('touchstart',e=>{if(e.target.closest('main'))pause();},{passive:true});
window.addEventListener('scroll',()=>{if(running&&Math.abs(scrollY-expected)>2)pause();},{passive:true});
document.addEventListener('keydown',e=>{
 if(document.body.classList.contains('library-open')||document.body.classList.contains('lyrics-open')||document.querySelector('dialog[open]')||e.target.closest('input,select,textarea,[contenteditable]'))return;
 if(mode==='pages'&&['PageDown','ArrowRight','PageUp','ArrowLeft','Home','End'].includes(e.key)){e.preventDefault();if(e.repeat)return;turn(e.key==='Home'?-Infinity:e.key==='End'?Infinity:['PageDown','ArrowRight'].includes(e.key)?1:-1);return;}
 if(mode==='hybrid'&&['PageDown','ArrowRight'].includes(e.key)){e.preventDefault();advance();return;}
 if(['ArrowDown','ArrowUp','PageDown','PageUp','Home','End',' '].includes(e.key))pause();
});
for(const name of ['blur','resize','beforeprint'])window.addEventListener(name,()=>pause());
document.addEventListener('visibilitychange',()=>{if(document.hidden)pause();});
new MutationObserver(()=>{pause();sync();}).observe($('score'),{childList:true,attributes:true,attributeFilter:['aria-busy']});
// Clearance tracks one/two-row phone toolbars and the optional navigation strip.
new ResizeObserver(()=>{const height=document.querySelector('.masthead').getBoundingClientRect().height;const safe=parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--playing-safe-bottom'))||0;document.documentElement.style.setProperty('--playing-bar-height',Math.max(54,height-safe)+'px');syncStart();if(mode==='pages'){if(virtualAvailable()&&!document.body.classList.contains('pdf-score-open')){pageIndex=prepareVirtualPages();syncPages();}else fitPage();}}).observe(document.querySelector('.masthead'));


// Real PDF pages and complete-system virtual MXL pages share the same navigation.
function pages(){return document.body.classList.contains('pdf-score-open')?[...$('score').querySelectorAll(':scope > .pdf-page-frame')]:virtualFrames();}
function playing(){return !document.body.classList.contains('library-open')&&!document.body.classList.contains('lyrics-open');}
function fitPage(){if(!document.body.classList.contains('pdf-score-open'))return;const frames=pages(),bar=document.querySelector('.masthead').getBoundingClientRect().height;for(const frame of frames){const b=JSON.parse(frame.dataset.trim||'null');if(b){const ratio=(b.right-b.left)/(b.bottom-b.top);frame.style.setProperty('--pdf-page-fit',Math.max(120,innerHeight-bar-80)*ratio+'px');}}}
function hideStart(){
 for(const button of document.querySelectorAll('.return-start'))button.hidden=true;
 document.body.classList.remove('continuous-return-visible');for(const e of document.querySelectorAll('#score,#source-credits,#original-key-reference'))e.style.removeProperty('--return-clip');
}
function syncStart(){
 const visible=mode==='continuous'&&playing()&&scrollY>=100,pdf=document.body.classList.contains('pdf-score-open');
 $('return-start').hidden=!visible;$('return-start-left').hidden=!visible||pdf;
 // Preserve the existing PDF right-side shortcut; paired controls apply to MXL.
 const entering=visible&&!pdf&&!document.body.classList.contains('continuous-return-visible'),atEnd=scrollY+innerHeight>=document.documentElement.scrollHeight-1;
 document.body.classList.toggle('continuous-return-visible',visible&&!pdf);
 if(entering&&atEnd)window.scrollTo({top:document.documentElement.scrollHeight,behavior:'instant'});
 if(visible&&!pdf){const bottom=scoreVisibleBottom();for(const e of document.querySelectorAll('#score,#source-credits,#original-key-reference'))e.style.setProperty('--return-clip',Math.max(0,e.getBoundingClientRect().bottom-bottom)+'px');}
 else for(const e of document.querySelectorAll('#score,#source-credits,#original-key-reference'))e.style.removeProperty('--return-clip');
}
function syncPages(){
 const pdf=document.body.classList.contains('pdf-score-open');if(mode==='pages'&&!pdf&&virtualAvailable())pageIndex=prepareVirtualPages();const frames=pages(),available=pdf?frames.length>0:virtualAvailable();
 const input=panel.querySelector('input[value=pages]');input.disabled=!available;$('page-mode-choice').classList.toggle('unavailable',!available);
 $('show-tap-zones').disabled=!available;
 document.body.classList.toggle('page-navigation',mode==='pages'&&available);document.body.classList.toggle('mxl-page-navigation',mode==='pages'&&available&&!pdf);if(mode==='pages'&&!pdf)displayVirtual(pageIndex);pageIndex=Math.max(0,Math.min(pageIndex,frames.length-1));
 frames.forEach((f,i)=>{f.classList.toggle('current-page',i===pageIndex);if(mode==='pages')f.setAttribute('aria-hidden',String(i!==pageIndex));else f.removeAttribute('aria-hidden');});
 $('page-position').textContent=frames.length?`${pageIndex+1} / ${frames.length}`:'';$('page-position').setAttribute('aria-label',`${pdf?'Page':'Virtual page'} ${pageIndex+1} of ${frames.length}`);$('page-position').hidden=mode!=='pages'||!available||frames.length<=1||!playing();
 fitPage();syncStart();
}
function turn(delta){if(mode!=='pages'||!playing())return;const count=pages().length;if(!count)return;const next=Math.max(0,Math.min(count-1,pageIndex+delta));if(next===pageIndex)return;pageIndex=next;if(!document.body.classList.contains('pdf-score-open'))displayVirtual(pageIndex);sync();window.scrollTo({top:0,behavior:'instant'});}
// Tap zones and keyboard/pedal commands call turn directly; no visible arrow row.
const returnToStart=()=>{pause();window.scrollTo({top:0,behavior:'instant'});syncStart();};
for(const button of document.querySelectorAll('.return-start'))button.onclick=returnToStart;
const cancelScoreTap=installScoreTaps({
 enabled:()=>playing()&&window.prototype?.ready&&!prototype.busy&&$('score').getAttribute('aria-busy')==='false'&&(!document.body.classList.contains('pdf-score-open')||mode==='pages'),
 navigate:delta=>{pause();if(mode==='pages'){turn(delta);return;}
  // In scrolling views keep the selected mode; tap one screen with reading overlap.
  const r=$('score').getBoundingClientRect(),bottom=scoreVisibleBottom();
  window.scrollTo({top:delta===-Infinity?0:delta===Infinity?document.documentElement.scrollHeight:scrollY+delta*Math.max(1,bottom-Math.max(0,r.top))*.85,behavior:'instant'});
 }
});
let startFrame=0;window.addEventListener('scroll',()=>{if(!startFrame)startFrame=requestAnimationFrame(()=>{startFrame=0;syncStart();});},{passive:true});
let virtualResize;window.addEventListener('resize',()=>{clearTimeout(virtualResize);virtualResize=setTimeout(()=>{if(mode==='pages'&&virtualAvailable()&&!document.body.classList.contains('pdf-score-open')){pageIndex=prepareVirtualPages();sync();}fitPage();syncStart();},180);});
document.addEventListener('score-session-reset',()=>{resetVirtualSource();pageIndex=0;});
document.addEventListener('score-engraved',e=>{setVirtualSource(e.detail);requestAnimationFrame(()=>{if(mode==='pages'){pageIndex=prepareVirtualPages(true);sync();}});});
$('pdf-trim').addEventListener('change',fitPage);
document.addEventListener('library-open',()=>{pause();cancelScoreTap();pageIndex=0;hideStart();});
if(hasChoice)persist(); // Migrate an existing valid session choice without replacing it.
sync();

document.addEventListener('metronome-layout',()=>{syncPages();syncStart();});
