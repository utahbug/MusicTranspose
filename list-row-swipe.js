// One touch reveal per Lists workspace. Reordering continues to own its handle.
export function createListRowSwipe(){
 let opened=null,gesture=null;
 const settle=(row,x)=>{row.style.setProperty('--list-swipe-x',x+'px');const action=row.querySelector('.list-song-remove');action.inert=x===0;action.setAttribute('aria-hidden',String(x===0));row.classList.toggle('remove-open',x<0);};
 function close(){if(gesture){gesture.row.classList.remove('swiping');settle(gesture.row,0);gesture=null;}if(opened)settle(opened,0);opened=null;}
 document.addEventListener('pointerdown',e=>{if(opened&&!opened.contains(e.target))close();},true);
 document.addEventListener('scroll',close,{capture:true,passive:true});
 window.addEventListener('scroll',close,{passive:true});window.addEventListener('resize',close);window.addEventListener('orientationchange',close);
 document.addEventListener('keydown',e=>{if(e.key==='Escape')close();});
 function attach(row,front){
  let suppressUntil=0;
  front.addEventListener('pointerdown',e=>{
   if(e.pointerType!=='touch'||!e.isPrimary)return;if(e.target.closest('.reorder-grip')){close();return;}
   if(opened&&opened!==row)close();
   gesture={row,front,id:e.pointerId,x:e.clientX,y:e.clientY,start:opened===row?-80:0,offset:opened===row?-80:0,active:false};
  });
  front.addEventListener('pointermove',e=>{
   const g=gesture;if(!g||g.row!==row||g.id!==e.pointerId)return;
   const dx=e.clientX-g.x,dy=e.clientY-g.y;
   if(!g.active){if(Math.abs(dy)>8&&Math.abs(dy)>=Math.abs(dx)){gesture=null;return;}if(Math.abs(dx)<10||Math.abs(dx)<Math.abs(dy)*1.5)return;g.active=true;front.setPointerCapture(e.pointerId);row.classList.add('swiping');}
   g.offset=Math.max(-80,Math.min(0,g.start+dx));row.style.setProperty('--list-swipe-x',g.offset+'px');
  });
  function finish(e,cancel=false){const g=gesture;if(!g||g.row!==row||g.id!==e.pointerId)return;gesture=null;row.classList.remove('swiping');if(g.active){suppressUntil=performance.now()+500;const open=!cancel&&g.offset<=-40;settle(row,open?-80:0);opened=open?row:null;}if(front.hasPointerCapture(e.pointerId))front.releasePointerCapture(e.pointerId);}
  front.addEventListener('pointerup',e=>finish(e));front.addEventListener('pointercancel',e=>finish(e,true));front.addEventListener('lostpointercapture',e=>{if(e.target===front)finish(e,true);});
  front.addEventListener('click',e=>{if(performance.now()<suppressUntil||opened===row){e.preventDefault();e.stopImmediatePropagation();if(opened===row&&performance.now()>=suppressUntil)close();}},true);
  settle(row,0);
 }
 return {attach,close};
}
