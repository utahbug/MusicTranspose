import {scoreTapGeometry} from './score-taps.js';
// Help uses the real score geometry; it never changes the navigation mode.
const $=id=>document.getElementById(id),overlay=$('score-tap-overlay'),opener=$('show-tap-zones');
let timer=0;
const close=()=>{clearTimeout(timer);if(overlay.open)overlay.close();};
opener.addEventListener('click',()=>{
 $('settings-dialog').close();
 const r=scoreTapGeometry();if(r.height<=0)return;
 Object.assign(overlay.style,{left:r.left+'px',top:r.top+'px',width:r.width+'px',height:r.height+'px'});
 overlay.style.setProperty('--tap-upper',r.upper*100+'%');
 overlay.showModal();timer=setTimeout(close,8000);
});
overlay.addEventListener('pointerdown',()=>clearTimeout(timer));
overlay.addEventListener('click',close);
overlay.addEventListener('close',()=>{clearTimeout(timer);$('settings').focus({preventScroll:true});});
for(const event of ['resize','scroll','beforeprint'])window.addEventListener(event,close,{passive:true});
for(const event of ['library-open','score-session-reset'])document.addEventListener(event,close);
