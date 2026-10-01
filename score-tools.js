// Tools appearance and toggle behavior adapted from PrimarySongs v528.
const button=document.getElementById('score-tools'),menu=document.getElementById('score-tools-menu'),theme=document.getElementById('score-page-theme');
const exportButton=document.getElementById('score-export'),exportMenu=document.getElementById('score-export-options'),exportBack=document.getElementById('score-export-back');
const preference='music-transpose-score-dark-v1';let dark=false;
try{dark=localStorage.getItem(preference)==='true';}catch{}
function applyTheme(){document.getElementById('playing-view').classList.toggle('score-page-dark',dark);theme.setAttribute('aria-pressed',String(dark));theme.lastElementChild.textContent=dark?'Light page':'Dark page';button.classList.toggle('has-active-tool',dark);}
function mainMenu(){exportMenu.hidden=true;exportButton.setAttribute('aria-expanded','false');menu.classList.remove('export-open');}
function close(focus=false){menu.hidden=true;mainMenu();button.setAttribute('aria-expanded','false');if(focus)button.focus();}
const items=()=>[...(exportMenu.hidden?menu:exportMenu).querySelectorAll(':scope > button:not(:disabled):not([hidden])')];
function position(){
 menu.style.right='0px';menu.style.maxHeight=Math.max(44,button.getBoundingClientRect().top-16)+'px';
 const r=menu.getBoundingClientRect();menu.style.right=(r.left<8?r.left-8:Math.max(0,r.right-innerWidth+8))+'px';
}
function open(){mainMenu();menu.hidden=false;button.setAttribute('aria-expanded','true');position();items()[0]?.focus();}
function openExport(){if(exportButton.disabled)return;exportMenu.hidden=false;menu.classList.add('export-open');exportButton.setAttribute('aria-expanded','true');position();document.getElementById('score-export-pdf').focus();}
function back(){if(exportButton.disabled){close(true);return;}mainMenu();position();exportButton.focus();}
button.addEventListener('click',e=>{e.stopPropagation();menu.hidden?open():close(true);});
button.addEventListener('keydown',e=>{if(['ArrowDown','ArrowUp'].includes(e.key)){e.preventDefault();e.stopPropagation();open();if(e.key==='ArrowUp')items().at(-1)?.focus();}});
menu.addEventListener('click',e=>{e.stopPropagation();const target=e.target.closest('button');if(target===exportButton)openExport();else if(target===exportBack)back();else if(target)close(true);});
theme.addEventListener('click',()=>{dark=!dark;try{localStorage.setItem(preference,String(dark));}catch{}applyTheme();});
// Capture keys before score/pedal navigation sees them. Tab keeps natural focus order.
menu.addEventListener('keydown',e=>{
 e.stopPropagation();const list=items(),index=list.indexOf(document.activeElement);
 if(e.key==='Escape'){e.preventDefault();exportMenu.hidden?close(true):back();}
 else if(e.key==='ArrowLeft'&&!exportMenu.hidden){e.preventDefault();back();}
 else if(e.key==='ArrowRight'&&document.activeElement===exportButton){e.preventDefault();openExport();}
 else if(['ArrowDown','ArrowUp','Home','End'].includes(e.key)){e.preventDefault();list[e.key==='Home'?0:e.key==='End'?list.length-1:(index+(e.key==='ArrowDown'?1:-1)+list.length)%list.length]?.focus();}
});
document.addEventListener('click',()=>close());
document.addEventListener('focusin',e=>{if(!menu.hidden&&!e.target.closest('.pdf-footer-tools-wrap'))close();});
for(const event of ['library-open','score-session-reset'])document.addEventListener(event,()=>close());
for(const event of ['beforeprint','resize'])window.addEventListener(event,()=>close());
applyTheme();
