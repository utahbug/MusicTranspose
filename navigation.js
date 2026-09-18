// View navigation only. Score content and transposition remain owned by app.js.
const $=id=>document.getElementById(id),panel=$('settings-dialog');
const storageKey='music-transpose-navigation-v1';
let saved={};try{saved=JSON.parse(sessionStorage.getItem(storageKey)||'{}');}catch{}
if(!saved||typeof saved!=='object')saved={};
let mode=['continuous','hybrid','auto'].includes(saved.mode)?saved.mode:'continuous';
let speed=Number.isFinite(saved.speed)?Math.max(1,Math.min(60,saved.speed)):12;
let running=false,frame=0,lastTime=0,position=0,expected=0;
function persist(){try{sessionStorage.setItem(storageKey,JSON.stringify({mode,speed}));}catch{}}
function sync(){
 document.querySelectorAll('input[name="navigation"]').forEach(e=>e.checked=e.value===mode);
 $('auto-options').hidden=mode!=='auto';$('hybrid-help').hidden=mode!=='hybrid';
 $('navigation-strip').hidden=mode==='continuous';$('auto-toggle').hidden=mode!=='auto';$('speed-summary').hidden=mode!=='auto';$('screenful-next').hidden=mode!=='hybrid';
 $('scroll-speed').value=speed;$('speed-value').textContent=speed+' px/s';$('speed-summary').textContent=speed+' px/s';
 $('auto-toggle').textContent=running?'Pause scrolling':'Start scrolling';$('auto-toggle').setAttribute('aria-pressed',String(running));$('settings-auto-start').textContent=running?'Pause scrolling':'Start scrolling';
}
function pause(message='Paused'){if(!running)return;running=false;cancelAnimationFrame(frame);$('navigation-status').textContent=message;sync();}
function tick(time){if(!running)return;const dt=Math.min((time-lastTime)/1000,.1);lastTime=time;position+=speed*dt;window.scrollTo({top:position,behavior:'instant'});expected=scrollY;
 if(scrollY>=document.documentElement.scrollHeight-innerHeight-1){pause('End of score');return;}frame=requestAnimationFrame(tick);}
function start(){if(!window.prototype?.ready||prototype.busy)return;position=scrollY;expected=scrollY;lastTime=performance.now();running=true;$('navigation-status').textContent='';sync();frame=requestAnimationFrame(tick);}
function toggle(){running?pause():start();}
function advance(){pause();const bar=document.querySelector('.masthead').getBoundingClientRect().height;window.scrollBy({top:Math.max(1,(innerHeight-bar)*.85),behavior:'instant'});}
$('settings').onclick=()=>{pause();panel.showModal();panel.querySelector('input:checked').focus();};$('close-settings').onclick=()=>panel.close();
for(const input of panel.querySelectorAll('input[name="navigation"]'))input.onchange=()=>{pause();mode=input.value;$('navigation-status').textContent='';persist();sync();};
$('scroll-speed').oninput=e=>{speed=Number(e.target.value);persist();sync();};
$('auto-toggle').onclick=toggle;$('settings-auto-start').onclick=()=>{panel.close();toggle();};$('screenful-next').onclick=advance;
// Only deliberate user inputs pause scrolling; our own scroll events do not.
document.addEventListener('wheel',()=>pause(),{passive:true});
document.addEventListener('pointerdown',e=>{if(!e.target.closest('#auto-toggle,#settings-auto-start'))pause();},{passive:true});
document.addEventListener('touchstart',e=>{if(e.target.closest('main'))pause();},{passive:true});
window.addEventListener('scroll',()=>{if(running&&Math.abs(scrollY-expected)>2)pause();},{passive:true});
document.addEventListener('keydown',e=>{
 if(document.body.classList.contains('library-open')||document.body.classList.contains('lyrics-open')||document.querySelector('dialog[open]')||e.target.closest('input,select,textarea,[contenteditable]'))return;
 if(mode==='hybrid'&&['PageDown','ArrowRight'].includes(e.key)){e.preventDefault();advance();return;}
 if(['ArrowDown','ArrowUp','PageDown','PageUp','Home','End',' '].includes(e.key))pause();
});
for(const name of ['blur','resize','beforeprint'])window.addEventListener(name,()=>pause());
document.addEventListener('visibilitychange',()=>{if(document.hidden)pause();});
new MutationObserver(()=>pause()).observe($('score'),{childList:true});
// Clearance tracks one/two-row phone toolbars and the optional navigation strip.
new ResizeObserver(()=>{const height=document.querySelector('.masthead').getBoundingClientRect().height;const safe=parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--playing-safe-bottom'))||0;document.documentElement.style.setProperty('--playing-bar-height',Math.max(54,height-safe)+'px');}).observe(document.querySelector('.masthead'));
sync();

document.addEventListener('library-open',()=>pause());
