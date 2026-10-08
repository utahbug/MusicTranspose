import {settingsIcon} from './icons.js';
// Shared, nonmodal display-preferences popover. Native inputs retain their semantics.
export function createDisplaySettings({id,label,controls}) {
 const element=document.createElement('div');element.className='display-settings';
 const button=document.createElement('button');button.id=id;button.type='button';button.className='display-settings-toggle';button.title=label;button.setAttribute('aria-label',label);button.setAttribute('aria-haspopup','dialog');button.setAttribute('aria-expanded','false');button.setAttribute('aria-controls',id+'-panel');button.innerHTML=settingsIcon;
 const panel=document.createElement('div');panel.id=id+'-panel';panel.className='display-settings-menu';panel.hidden=true;panel.setAttribute('role','dialog');panel.setAttribute('aria-label',label);
 const title=document.createElement('h2');title.textContent=label;panel.append(title,...controls);element.append(button,panel);
 const events=new AbortController(),options={signal:events.signal};
 function close(focus=false){panel.hidden=true;button.setAttribute('aria-expanded','false');if(focus)button.focus({preventScroll:true});}
 function open(){panel.hidden=false;button.setAttribute('aria-expanded','true');const r=button.getBoundingClientRect(),v=visualViewport,left=v?.offsetLeft||0,top=v?.offsetTop||0,width=v?.width||innerWidth;panel.style.maxHeight=Math.max(44,r.top-top-16)+'px';panel.style.left=Math.max(left+8,Math.min(r.right-panel.offsetWidth,left+width-panel.offsetWidth-8))+'px';panel.style.top=Math.max(top+8,r.top-panel.offsetHeight-8)+'px';panel.querySelector('select,button,input')?.focus({preventScroll:true});}
 button.onclick=()=>panel.hidden?open():close(true);
 button.addEventListener('keydown',e=>{if(['ArrowDown','ArrowUp'].includes(e.key)){e.preventDefault();e.stopPropagation();open();}});
 element.addEventListener('keydown',e=>{e.stopPropagation();if(e.key==='Escape'&&!panel.hidden){e.preventDefault();close(true);}});
 document.addEventListener('pointerdown',e=>{if(!element.contains(e.target))close();},options);
 document.addEventListener('focusin',e=>{if(!element.contains(e.target))close();},options);
 for(const event of ['resize','scroll','beforeprint'])window.addEventListener(event,()=>close(),options);
 return {element,close,destroy(){close();events.abort();element.remove();}};
}
