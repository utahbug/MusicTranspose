// Keep only Library quick links above a changing visual viewport. This does not
// write the Score footer inset, page budget, or dispatch score layout events.
export function installLibraryQuickAccess(){
 const library=document.getElementById('library'),footer=library.querySelector('.library-quick-access');
 let inset=0,frame=0;
 function update(){
  frame=0;if(!footer.getClientRects().length)return;
  const v=window.visualViewport;
  if(v&&Math.abs(v.scale-1)>.01)return;
  const visibleBottom=v?v.offsetTop+v.height:innerHeight;
  // Undo our own shift before measuring any native fixed-position adjustment.
  const next=Math.max(0,Math.round((footer.getBoundingClientRect().bottom+inset-visibleBottom)*100)/100);
  if(next===inset)return;inset=next;library.style.setProperty('--library-quick-inset',inset+'px');
 }
 const schedule=()=>{if(!frame)frame=requestAnimationFrame(update);};
 for(const type of ['resize','orientationchange'])window.addEventListener(type,schedule);
 for(const type of ['resize','scroll'])window.visualViewport?.addEventListener(type,schedule);
 new MutationObserver(schedule).observe(library,{attributes:true,attributeFilter:['hidden']});
 new ResizeObserver(schedule).observe(footer);
 schedule();
}
