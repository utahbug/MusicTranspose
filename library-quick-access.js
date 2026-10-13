import {onSettledFooterViewport} from './footer-viewport.js';
// Shared workspace chrome only. Score/Lyrics geometry and events stay separate.
export function installWorkspaceFooters(){
 const entries=[...document.querySelectorAll('.library-quick-access,.workspace-return,.library-home-footer')].map(footer=>({footer,owner:footer.parentElement,inset:0}));
 function update(){
  const v=window.visualViewport;
  // Do not chase the magnified viewport during pinch zoom.
  if(v&&Math.abs(v.scale-1)>.01)return;
  const visibleBottom=v?v.offsetTop+v.height:innerHeight;
  for(const entry of entries){
   const {footer,owner}=entry;if(!footer.getClientRects().length)continue;
   const rect=footer.getBoundingClientRect();
   // Undo only our own offset: Safari may already move fixed chrome natively.
   const next=Math.max(0,Math.round((rect.bottom+entry.inset-visibleBottom)*100)/100);
   if(next!==entry.inset){entry.inset=next;owner.style.setProperty('--workspace-footer-inset',next+'px');}
   const height=rect.height+'px';if(owner.style.getPropertyValue('--workspace-footer-height')!==height)owner.style.setProperty('--workspace-footer-height',height);
  }
 }
 // Run after the existing workspace constructors finish installing their icons.
 queueMicrotask(()=>{
  const home=new Set(['home-current','library-quick-home','lists-library','files-library','texts-home','keyboard-home']);
  const destinations={'library-home':'Home','library':'Library','lists-view':'Lists','files-view':'Files','texts-view':'Notes','keyboard-view':'Keyboard'};
  for(const {footer} of entries)for(const button of footer.querySelectorAll('button')){
   const label=home.has(button.id)?'Home':destinations[button.getAttribute('aria-controls')];
   if(!label)continue;
   button.dataset.footerDestination=label;
   const text=button.querySelector(':scope > span')||document.createElement('span');
   text.className='footer-destination-label';text.textContent=label;text.setAttribute('aria-hidden','true');button.append(text);
   if(home.has(button.id)){button.setAttribute('aria-label','Home');button.title='Home';}
  }
  schedule();
 });
 const schedule=onSettledFooterViewport(update);
 const visibility=new MutationObserver(schedule),size=new ResizeObserver(schedule);
 for(const {footer,owner} of entries){visibility.observe(owner,{attributes:true,attributeFilter:['hidden']});visibility.observe(footer,{attributes:true,attributeFilter:['hidden']});size.observe(footer);}
 schedule();
}
