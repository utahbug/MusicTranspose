// Presentation-only help. Native dialog supplies modal focus trapping and Escape.
const help=document.getElementById('tap-zones-help'),opener=document.getElementById('show-tap-zones');
opener.addEventListener('click',()=>help.showModal());
document.getElementById('close-tap-zones').addEventListener('click',()=>help.close());
help.addEventListener('close',()=>opener.focus({preventScroll:true}));
const outside=e=>{const r=help.getBoundingClientRect();return e.target===help&&(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom);};
let startedOutside=false;
help.addEventListener('pointerdown',e=>{startedOutside=outside(e);});
help.addEventListener('click',e=>{if(startedOutside&&outside(e))help.close();startedOutside=false;});
