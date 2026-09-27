// Tools appearance and toggle behavior adapted from PrimarySongs v528.
const button=document.getElementById('score-tools'),menu=document.getElementById('score-tools-menu'),theme=document.getElementById('score-page-theme');
const preference='music-transpose-score-dark-v1';let dark=false;
try{dark=localStorage.getItem(preference)==='true';}catch{}
function applyTheme(){document.getElementById('playing-view').classList.toggle('score-page-dark',dark);theme.setAttribute('aria-pressed',String(dark));theme.lastElementChild.textContent=dark?'Light page':'Dark page';button.classList.toggle('has-active-tool',dark);}
function close(focus=false){menu.hidden=true;button.setAttribute('aria-expanded','false');if(focus)button.focus();}
const items=()=>[...menu.querySelectorAll('button:not(:disabled)')];
function open(){menu.hidden=false;button.setAttribute('aria-expanded','true');items()[0]?.focus();}
button.addEventListener('click',e=>{e.stopPropagation();menu.hidden?open():close(true);});
button.addEventListener('keydown',e=>{if(['ArrowDown','ArrowUp'].includes(e.key)){e.preventDefault();e.stopPropagation();open();if(e.key==='ArrowUp')items().at(-1)?.focus();}});
menu.addEventListener('click',e=>{e.stopPropagation();if(e.target.closest('button:not(:disabled)'))close(true);});
theme.addEventListener('click',()=>{dark=!dark;try{localStorage.setItem(preference,String(dark));}catch{}applyTheme();});
// Capture keys before score/pedal navigation sees them. Tab keeps natural focus order.
menu.addEventListener('keydown',e=>{e.stopPropagation();const list=items(),index=list.indexOf(document.activeElement);if(e.key==='Escape'){e.preventDefault();close(true);}else if(['ArrowDown','ArrowUp','Home','End'].includes(e.key)){e.preventDefault();list[e.key==='Home'?0:e.key==='End'?list.length-1:(index+(e.key==='ArrowDown'?1:-1)+list.length)%list.length]?.focus();}});
document.addEventListener('click',()=>close());
document.addEventListener('focusin',e=>{if(!menu.hidden&&!e.target.closest('.pdf-footer-tools-wrap'))close();});
for(const event of ['library-open','score-session-reset'])document.addEventListener(event,()=>close());
window.addEventListener('beforeprint',()=>close());
applyTheme();
