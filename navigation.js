import {syncPdfPresentation} from './pdf-score.js';
import {installFooterViewport,phoneFooter,scoreFooterTop} from './footer-viewport.js';
import {installScoreTaps,scoreVisibleBottom} from './score-taps.js';
import {phoneNavigationClearance,setVirtualSource,resetVirtualSource,virtualAvailable,virtualFrames,prepareVirtualPages,displayVirtual,rememberReadingPosition,seekVirtualMeasure} from './virtual-pages.js';
// View navigation only. Score content and transposition remain owned by app.js.
const $=id=>document.getElementById(id),pagePosition=$('score-navigation-button'),modeMenu=$('score-navigation-menu'),navCorner=$('score-navigation'),hint=$('page-navigation-hint');
// Visibility only: retain the measured footer and all score geometry.
const footer=document.querySelector('.masthead'),footerToolbar=footer.querySelector('.toolbar');
const focusHide=document.createElement('button'),focusShow=document.createElement('button');
for(const [button,id,label,path] of [[focusHide,'score-hide-controls','Hide controls','m6 9 6 6 6-6'],[focusShow,'score-show-controls','Show controls','m6 15 6-6 6 6']]){
 button.id=id;button.type='button';button.className='score-focus-control';button.title=label;button.setAttribute('aria-label',label);button.setAttribute('aria-controls','score-footer-controls');
 button.innerHTML=`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${path}"/></svg>`;
}
footerToolbar.id='score-footer-controls';footerToolbar.querySelector('.utility-controls').append(focusHide);footer.append(focusShow);focusShow.hidden=true;
function setFooterFocus(hidden,moveFocus=true){
 footer.classList.toggle('controls-hidden',hidden);footerToolbar.inert=hidden;focusShow.hidden=!hidden;
 if(moveFocus)(hidden?focusShow:focusHide).focus({preventScroll:true});
}
focusHide.onclick=()=>setFooterFocus(true);focusShow.onclick=()=>setFooterFocus(false);
document.addEventListener('score-session-reset',()=>setFooterFocus(false,false));
// v1 could contain automatically saved defaults; only v2 explicitly chosen
// values override the device rule. Leave legacy data intact for compatibility.
const storageKey='music-transpose-navigation-v2';
const validMode=value=>['continuous','auto','pages'].includes(value);
const readPreference=storage=>{try{const value=JSON.parse(storage.getItem(storageKey)||'{}');return value&&typeof value==='object'?value:{};}catch{return {};}};
let saved={},local={};try{saved=readPreference(sessionStorage);}catch{}try{local=readPreference(localStorage);}catch{}
// Auto-scroll speed is unambiguous and can retain its previous session value.
if(!Number.isFinite(saved.speed))try{saved.speed=JSON.parse(sessionStorage.getItem('music-transpose-navigation-v1')||'{}')?.speed;}catch{}
const preferred=local.explicit&&validMode(local.mode)?local.mode:saved.explicit&&validMode(saved.mode)?saved.mode:null;
let hasChoice=preferred!==null;
const phoneScreen=matchMedia('(max-width:600px)'),defaultMode=()=>phoneScreen.matches?'continuous':'pages';
let mode=preferred||defaultMode();
let speed=Number.isFinite(saved.speed)?Math.max(1,Math.min(60,saved.speed)):12;
let pageIndex=0;
let running=false,frame=0,lastTime=0,position=0,expected=0;
function persist(){try{sessionStorage.setItem(storageKey,JSON.stringify({...(hasChoice?{mode,explicit:true}:{}),speed}));}catch{}if(hasChoice)try{localStorage.setItem(storageKey,JSON.stringify({mode,explicit:true}));}catch{}}
const hintKey='music-transpose-page-hint-v1';let hintSeen=false,hintTimer;
try{hintSeen=localStorage.getItem(hintKey)==='seen';}catch{}
function hideHint(){clearTimeout(hintTimer);hint.hidden=true;}
function showHint(){if(hintSeen)return;hintSeen=true;try{localStorage.setItem(hintKey,'seen');}catch{}hint.hidden=false;hintTimer=setTimeout(hideHint,6000);}
function positionIndicator(){
 const paperElement=document.querySelector('.score-paper');
 phoneStatus.hidden=!phoneScreen.matches||navCorner.hidden;
 if(navCorner.hidden){paperElement.style.removeProperty('--phone-paper-clip');return;}
 const paper=paperElement.getBoundingClientRect(),bar=document.querySelector('.masthead').getBoundingClientRect();
 if(phoneScreen.matches){
  // Keep the same control outside the visible sheet. Long Continuous scores
  // retain document scrolling; only ink under the reserved status strip is clipped.
  const top=Math.min(paper.bottom+5,bar.top-5-pagePosition.offsetHeight);
  paperElement.style.setProperty('--phone-paper-clip',Math.max(0,paper.bottom-(top-5))+'px');
  phoneStatus.style.bottom=(innerHeight-top-pagePosition.offsetHeight)+'px';
  navCorner.style.right=Math.max(0,innerWidth-paper.right)+'px';
  navCorner.style.bottom=(innerHeight-top-pagePosition.offsetHeight)+'px';
  pageFeedback.style.right='auto';pageFeedback.style.left=Math.max(6,paper.left)+'px';
  pageFeedback.style.bottom=(innerHeight-top-pagePosition.offsetHeight)+'px';
 }else{
  paperElement.style.removeProperty('--phone-paper-clip');pageFeedback.style.removeProperty('left');pageFeedback.style.removeProperty('right');pageFeedback.style.removeProperty('bottom');
  const bottom=Math.min(paper.bottom-6,bar.top-8,innerHeight-8);
  navCorner.style.right=Math.max(8,innerWidth-paper.right+8)+'px';
  navCorner.style.bottom=Math.max(8,innerHeight-bottom)+'px';
 }
 // Keep both shortcuts above the status lane, never in place of its label.
 if(!$('return-start').hidden){
  const bottom=Math.min(bar.top-8,pagePosition.getBoundingClientRect().top-8);
  for(const button of document.querySelectorAll('.return-start'))button.style.bottom=Math.max(8,innerHeight-bottom)+'px';
  document.documentElement.style.setProperty('--return-clearance',Math.max(60,bar.top-bottom+52)+'px');
 }
}
// Outside the clipped phone sheet, but still within the existing playing view.
// Desktop keeps precisely the same fixed positioning and interaction.
document.querySelector('.score-paper').after(navCorner);
const songNavigator=document.querySelector('.score-song-navigation'),songHeader=songNavigator.parentElement;
const phoneStatus=document.createElement('div');phoneStatus.id='phone-score-status';$('playing-view').append(phoneStatus);
function placeSongNavigation(){if(phoneScreen.matches)phoneStatus.append(songNavigator);else songHeader.insertBefore(songNavigator,songHeader.querySelector('.score-actions'));}
phoneScreen.addEventListener('change',placeSongNavigation);placeSongNavigation();

new ResizeObserver(positionIndicator).observe(document.querySelector('.score-paper'));
function closeModeMenu(focus=false){modeMenu.hidden=true;pagePosition.setAttribute('aria-expanded','false');if(focus&&!navCorner.hidden)pagePosition.focus({preventScroll:true});}
pagePosition.onclick=()=>{if(!modeMenu.hidden){closeModeMenu(true);return;}pause();hideHint();modeMenu.hidden=false;pagePosition.setAttribute('aria-expanded','true');positionIndicator();(modeMenu.querySelector('[aria-checked=true]')||modeMenu.querySelector('button')).focus();};
for(const option of modeMenu.querySelectorAll('[data-navigation]'))option.onclick=()=>{chooseMode(option.dataset.navigation);if(option.dataset.navigation!=='auto')closeModeMenu(true);};
modeMenu.onkeydown=e=>{
 if(e.key==='Escape'){e.preventDefault();e.stopPropagation();closeModeMenu(true);return;}
 if(e.target.matches('input')){e.stopPropagation();return;}
 if(['ArrowDown','ArrowUp','Home','End'].includes(e.key)){e.preventDefault();const options=[...modeMenu.querySelectorAll('button:not(:disabled)')].filter(b=>b.getClientRects().length),i=options.indexOf(document.activeElement);options[e.key==='Home'?0:e.key==='End'?options.length-1:(i+(e.key==='ArrowDown'?1:-1)+options.length)%options.length].focus();}
};
document.addEventListener('pointerdown',e=>{if(!navCorner.contains(e.target))closeModeMenu();},{passive:true});
document.addEventListener('focusin',e=>{if(!navCorner.contains(e.target))closeModeMenu();});
window.addEventListener('beforeprint',()=>{closeModeMenu();hideHint();});
function sync(){
 $('auto-options').hidden=mode!=='auto';
 $('navigation-strip').hidden=mode!=='auto'&&mode!=='hybrid';$('auto-toggle').hidden=mode!=='auto';$('speed-summary').hidden=mode!=='auto';$('screenful-next').hidden=mode!=='hybrid';
 // Measure pagination after any Auto-scroll strip has its final height.
 syncPages();
 $('scroll-speed').value=speed;$('speed-value').textContent=speed+' px/s';$('speed-summary').textContent=speed+' px/s';
 $('auto-toggle').textContent=running?'Pause scrolling':'Start scrolling';$('auto-toggle').setAttribute('aria-pressed',String(running));
}
function pause(message='Paused'){if(!running)return;running=false;cancelAnimationFrame(frame);$('navigation-status').textContent=message;sync();}
function tick(time){if(!running)return;const dt=Math.min((time-lastTime)/1000,.1);lastTime=time;position+=speed*dt;window.scrollTo({top:position,behavior:'instant'});expected=scrollY;
 if(scrollY>=document.documentElement.scrollHeight-innerHeight-1){pause('End of score');return;}frame=requestAnimationFrame(tick);}
function start(){if(document.body.classList.contains('pdf-annotation-active')||!window.prototype?.ready||prototype.busy)return;position=scrollY;expected=scrollY;lastTime=performance.now();running=true;$('navigation-status').textContent='';sync();frame=requestAnimationFrame(tick);}
function toggle(){running?pause():start();}
function advance(){pause();const bar=document.querySelector('.masthead').getBoundingClientRect().height;window.scrollBy({top:Math.max(1,(innerHeight-bar)*.85),behavior:'instant'});}
function chooseMode(value,explicit=true){
 if(!validMode(value)||(explicit&&value==='pages'&&!pages().length&&!virtualAvailable()))return;
 if(value===mode){if(explicit)hasChoice=true;persist();sync();return;}
 const wasPage=mode==='pages',entering=!wasPage&&value==='pages',pdf=document.body.classList.contains('pdf-score-open');
 const location=entering&&!pdf?rememberReadingPosition():null;
 const pdfIndex=entering&&pdf?Math.max(0,pages().findIndex(f=>f.getBoundingClientRect().bottom>0)):0;
 pause();mode=value;if(explicit)hasChoice=true;pageIndex=pdfIndex;
 if(entering&&!pdf)seekVirtualMeasure(location?.measure||0);
 if(wasPage||mode==='pages')window.scrollTo({top:0,behavior:'instant'});
 $('navigation-status').textContent='';persist();sync();
}
phoneScreen.addEventListener('change',()=>{if(!hasChoice)chooseMode(defaultMode(),false);});
$('scroll-speed').oninput=e=>{speed=Number(e.target.value);persist();sync();};
$('auto-toggle').onclick=()=>{toggle();if(running)closeModeMenu(true);};$('screenful-next').onclick=advance;
// Only deliberate user inputs pause scrolling; our own scroll events do not.
document.addEventListener('wheel',()=>pause(),{passive:true});
document.addEventListener('pointerdown',e=>{if(!e.target.closest('#auto-toggle,.score-focus-control'))pause();},{passive:true});
document.addEventListener('touchstart',e=>{if(e.target.closest('main'))pause();},{passive:true});
window.addEventListener('scroll',()=>{if(running&&Math.abs(scrollY-expected)>2)pause();},{passive:true});
document.addEventListener('keydown',e=>{
 if((e.target.closest('.score-focus-control')&&[' ','Enter'].includes(e.key))||document.body.classList.contains('pdf-annotation-active')||document.body.classList.contains('library-open')||document.body.classList.contains('lyrics-open')||document.querySelector('dialog[open]')||!modeMenu.hidden||e.target.closest('input,select,textarea,[contenteditable]'))return;
 if(mode==='pages'&&['PageDown','ArrowRight','PageUp','ArrowLeft','Home','End'].includes(e.key)){e.preventDefault();if(e.repeat)return;turn(e.key==='Home'?-Infinity:e.key==='End'?Infinity:['PageDown','ArrowRight'].includes(e.key)?1:-1);return;}
 if(mode==='hybrid'&&['PageDown','ArrowRight'].includes(e.key)){e.preventDefault();advance();return;}
 if(['ArrowDown','ArrowUp','PageDown','PageUp','Home','End',' '].includes(e.key))pause();
});
for(const name of ['blur','resize','beforeprint'])window.addEventListener(name,()=>pause());
document.addEventListener('visibilitychange',()=>{if(document.hidden)pause();});
new MutationObserver(()=>{pause();sync();}).observe($('score'),{childList:true,attributes:true,attributeFilter:['aria-busy']});
// Clearance tracks the actual toolbar and optional navigation strip.
function measureFooter(){
 const bounds=document.querySelector('.masthead').getBoundingClientRect(),height=bounds.height;
 if(!height)return; // Lyrics/Library hide the Score footer; retain its last reservation.
 const root=document.documentElement,safe=parseFloat(getComputedStyle(root).getPropertyValue('--playing-safe-bottom'))||0;
 // Reserved layout footprint: physical toolbar plus browser obstruction, excluding
 // safe padding (existing consumers add that exactly once).
 const reserve=Math.max(54,height-safe)+(phoneFooter()?Math.max(0,innerHeight-bounds.bottom):0),value=reserve+'px';
 if(root.style.getPropertyValue('--playing-bar-height')!==value){root.style.setProperty('--playing-bar-height',value);document.dispatchEvent(new Event('score-footer-geometry'));}
 syncStart();if(mode==='pages'){if(virtualAvailable()&&!document.body.classList.contains('pdf-score-open')){pageIndex=prepareVirtualPages();syncPages();}else fitPage();}
}
new ResizeObserver(measureFooter).observe(document.querySelector('.masthead'));
document.addEventListener('footer-viewport-change',()=>{measureFooter();scheduleVirtualResize();});
installFooterViewport();


// Real PDF pages and complete-system virtual MXL pages share the same navigation.
function pages(){return document.body.classList.contains('pdf-score-open')?[...$('score').querySelectorAll(':scope > .pdf-page-frame')]:virtualFrames();}
function playing(){return !document.body.classList.contains('library-open')&&!document.body.classList.contains('lyrics-open');}
function fitPage(){if(!document.body.classList.contains('pdf-score-open'))return;const frames=pages(),bottom=scoreFooterTop();for(const frame of frames){const b=JSON.parse(frame.dataset.trim||'null');if(b){const ratio=(b.right-b.left)/(b.bottom-b.top);frame.style.setProperty('--pdf-page-fit',Math.max(120,phoneScreen.matches?bottom-$('score').getBoundingClientRect().top-scrollY-phoneNavigationClearance()-24:bottom-80)*ratio+'px');}}}
function hideStart(){
 for(const button of document.querySelectorAll('.return-start'))button.hidden=true;
 document.body.classList.remove('continuous-return-visible');for(const e of document.querySelectorAll('#score,#source-credits,#original-key-reference'))e.style.removeProperty('--return-clip');
}
function syncStart(){
 const visible=['continuous','auto'].includes(mode)&&playing()&&scrollY>=($('return-start').hidden?100:80);
 $('return-start').hidden=!visible;$('return-start-left').hidden=!visible;
 // Shared visibility and clearance for both score formats; a small deadband avoids flicker.
 const entering=visible&&!document.body.classList.contains('continuous-return-visible'),atEnd=scrollY+innerHeight>=document.documentElement.scrollHeight-1;
 document.body.classList.toggle('continuous-return-visible',visible);
 positionIndicator();
 if(entering&&atEnd)window.scrollTo({top:document.documentElement.scrollHeight,behavior:'instant'});
 if(visible){const bottom=scoreVisibleBottom();for(const e of document.querySelectorAll('#score,#source-credits,#original-key-reference'))e.style.setProperty('--return-clip',Math.max(0,e.getBoundingClientRect().bottom-bottom)+'px');}
 else for(const e of document.querySelectorAll('#score,#source-credits,#original-key-reference'))e.style.removeProperty('--return-clip');
}
// Primary-style confirmation follows successful turns, never layout synchronization.
const pageFeedback=$('page-turn-feedback');
function placeFeedback(){(phoneScreen.matches?$('playing-view'):document.querySelector('.masthead .toolbar')).append(pageFeedback);}
phoneScreen.addEventListener('change',placeFeedback);placeFeedback();
let feedbackTimer,feedbackHideTimer;
function hidePageFeedback(){clearTimeout(feedbackTimer);clearTimeout(feedbackHideTimer);pageFeedback.classList.remove('visible');pageFeedback.hidden=true;}
function showPageFeedback(){
 hidePageFeedback();if(navCorner.hidden)return;
 pageFeedback.textContent=`${pageIndex+1} / ${pages().length}`;
 pageFeedback.hidden=false;pageFeedback.classList.add('visible');positionIndicator();
 feedbackTimer=setTimeout(()=>{pageFeedback.classList.remove('visible');feedbackHideTimer=setTimeout(()=>{pageFeedback.hidden=true;},180);},1200);
}
window.addEventListener('beforeprint',hidePageFeedback);
function syncPages(){
 const pdf=document.body.classList.contains('pdf-score-open');if(mode==='pages'&&!pdf&&virtualAvailable())pageIndex=prepareVirtualPages();const frames=pages(),available=pdf?frames.length>0:virtualAvailable();
 $('show-tap-zones').disabled=!available||document.body.classList.contains('pdf-annotation-active');
 document.body.classList.toggle('page-navigation',mode==='pages'&&available);document.body.classList.toggle('mxl-page-navigation',mode==='pages'&&available&&!pdf);if(mode==='pages'&&!pdf)displayVirtual(pageIndex);pageIndex=Math.max(0,Math.min(pageIndex,frames.length-1));
 frames.forEach((f,i)=>{f.classList.toggle('current-page',i===pageIndex);if(mode==='pages')f.setAttribute('aria-hidden',String(i!==pageIndex));else f.removeAttribute('aria-hidden');});
 const paged=mode==='pages',label=paged?`Page ${pageIndex+1} / ${frames.length}`:mode==='auto'?'Auto-scroll':'Scroll';
 $('score-navigation-label').textContent=label;
 pagePosition.dataset.mode=paged?'pages':'continuous';
 pagePosition.setAttribute('aria-label',paged?`Page navigation: Tap to turn pages. Page ${pageIndex+1} of ${frames.length}.`:`Page navigation: ${mode==='auto'?'Auto-scroll':'Continuous scroll'}.`);
 navCorner.hidden=!available||!playing()||document.body.classList.contains('song-loading');
 pagePosition.disabled=document.body.classList.contains('pdf-annotation-active');
 for(const option of modeMenu.querySelectorAll('[data-navigation]')){option.setAttribute('aria-checked',String(option.dataset.navigation===mode));option.disabled=option.dataset.navigation==='pages'&&!available;}
 if(navCorner.hidden){closeModeMenu();hidePageFeedback();}
 if(!paged||navCorner.hidden)hideHint();else if(frames.length>1&&window.prototype?.ready&&!prototype.busy)showHint();
 if(pdf)syncPdfPresentation();
 fitPage();syncStart();positionIndicator();
}
function turn(delta){if(mode!=='pages'||!playing())return;const count=pages().length;if(!count)return;const next=Math.max(0,Math.min(count-1,pageIndex+delta));if(next===pageIndex)return;pageIndex=next;if(!document.body.classList.contains('pdf-score-open'))displayVirtual(pageIndex,false);sync();window.scrollTo({top:0,behavior:'instant'});hideHint();showPageFeedback();}
// Tap zones and keyboard/pedal commands call turn directly; no visible arrow row.
const returnToStart=()=>{pause();window.scrollTo({top:0,behavior:'instant'});syncStart();};
for(const button of document.querySelectorAll('.return-start'))button.onclick=returnToStart;
const cancelScoreTap=installScoreTaps({
 enabled:()=>mode==='pages'&&!document.body.classList.contains('pdf-annotation-active')&&playing()&&window.prototype?.ready&&!prototype.busy&&$('score').getAttribute('aria-busy')==='false',
 navigate:delta=>{pause();turn(delta);}
});
let startFrame=0;window.addEventListener('scroll',()=>{if(!startFrame)startFrame=requestAnimationFrame(()=>{startFrame=0;syncStart();positionIndicator();});},{passive:true});
let virtualResize;function scheduleVirtualResize(){clearTimeout(virtualResize);virtualResize=setTimeout(()=>{if(mode==='pages'&&virtualAvailable()&&!document.body.classList.contains('pdf-score-open')){pageIndex=prepareVirtualPages();sync();}fitPage();syncStart();positionIndicator();},180);}
window.addEventListener('resize',scheduleVirtualResize);
// Keep phone page frames in step with browser-chrome changes as well as engraving.
window.visualViewport?.addEventListener('resize',()=>{if(phoneScreen.matches&&Math.abs(visualViewport.scale-1)<.01&&!document.body.classList.contains('pdf-score-open'))scheduleVirtualResize();});
document.addEventListener('score-session-reset',()=>{navCorner.hidden=true;closeModeMenu();hideHint();hidePageFeedback();resetVirtualSource();pageIndex=0;});
document.addEventListener('score-engraved',e=>{setVirtualSource(e.detail);requestAnimationFrame(()=>{if(mode==='pages')pageIndex=prepareVirtualPages(true);sync();});});
$('pdf-trim').addEventListener('change',fitPage);
document.addEventListener('library-open',e=>{navCorner.hidden=true;closeModeMenu();hideHint();hidePageFeedback();pause();cancelScoreTap();if(!e.detail?.retainScore)pageIndex=0;hideStart();});
if(hasChoice)persist(); // Retain only explicitly selected v2 modes.
sync();

document.addEventListener('score-view-shown',syncPages);
document.addEventListener('metronome-layout',()=>{syncPages();syncStart();});

// Annotation uses the existing PDF frames and turn path, without changing the saved navigation mode.
document.addEventListener('pdf-annotation-mode',()=>{pause();cancelScoreTap();syncPages();});
document.addEventListener('pdf-annotation-turn',e=>{
 if(!document.body.classList.contains('pdf-annotation-active')||!document.body.classList.contains('pdf-score-open'))return;
 const list=pages(),index=list.indexOf(e.detail.frame),delta=e.detail.delta;if(index<0||![-1,1].includes(delta))return;
 pause();const target=list[Math.max(0,Math.min(list.length-1,index+delta))];
 if(mode==='pages')turn(delta);else target.scrollIntoView({block:'start',behavior:'instant'});
 document.dispatchEvent(new CustomEvent('pdf-annotation-page-shown',{detail:target}));
});
