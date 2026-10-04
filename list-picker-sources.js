import {sourceChoices,matchesSource} from './library-query.js';
const storageKey='music-transpose-list-picker-sources-v1';
const choices=sourceChoices.filter(([id])=>id!=='all'),ids=choices.map(([id])=>id);
// UI preferences only: never write List membership, order, aliases or Favorites.
export function createPickerSources({onChange,getListIds}){
 const button=document.getElementById('list-picker-source'),panel=document.getElementById('list-picker-sources'),status=document.getElementById('list-picker-source-status');
 let selected=new Set(ids),listId=null,scheduled=0;
 function read(){try{const value=JSON.parse(localStorage.getItem(storageKey)||'{}');return value&&typeof value==='object'&&!Array.isArray(value)?value:{};}catch{return {};}}
 function prune(){const value=read(),valid=new Set(getListIds()),entries=Object.entries(value).filter(([id])=>valid.has(id));if(entries.length!==Object.keys(value).length)try{localStorage.setItem(storageKey,JSON.stringify(Object.fromEntries(entries)));}catch{}}
 function save(){const entries=Object.entries(read()).filter(([id])=>id!==listId);entries.push([listId,ids.filter(id=>selected.has(id))]);try{localStorage.setItem(storageKey,JSON.stringify(Object.fromEntries(entries)));}catch{status.hidden=false;status.textContent='Could not save these source preferences on this device.';}}
 const checks=new Map();
 for(const [id,label] of sourceChoices){const row=document.createElement('label'),check=document.createElement('input'),text=document.createElement('span');check.type='checkbox';check.dataset.source=id;text.textContent=label;row.append(check,text);panel.insertBefore(row,status);checks.set(id,check);
  check.onchange=()=>{
   status.textContent='';status.hidden=true;
   if(id==='all'){
    selected=new Set(check.checked?ids:[ids[0]]);
    if(!check.checked){status.textContent=`Keep at least one source selected. ${choices[0][1]} remains selected.`;status.hidden=false;}
   }else if(check.checked)selected.add(id);
   else if(selected.size>1)selected.delete(id);
   else{status.textContent='Keep at least one source selected.';status.hidden=false;}
   sync();save();onChange();position();
  };
 }
 function sync(){const all=selected.size===ids.length,names=choices.filter(([id])=>selected.has(id)).map(([,name])=>name);button.querySelector('span').textContent=all?'All Sources':names.length===1?names[0]:`${names.length} Sources`;button.setAttribute('aria-label',`Sources: ${all?'All Sources':names.join(', ')}`);
  for(const [id,check] of checks){check.checked=id==='all'?all:selected.has(id);check.indeterminate=id==='all'&&!all;}
 }
 function close(focus=false){panel.hidden=true;button.setAttribute('aria-expanded','false');if(focus)button.focus({preventScroll:true});}
 function position(){if(panel.hidden)return;const v=window.visualViewport,left=v?.offsetLeft||0,top=v?.offsetTop||0,width=v?.width||innerWidth,bottom=top+(v?.height||innerHeight),r=button.getBoundingClientRect(),completion=document.getElementById('list-picker-completion').getBoundingClientRect();
  const limit=completion.height?Math.min(bottom,completion.top):bottom;
  panel.style.width=Math.min(320,width-16)+'px';panel.style.maxHeight=Math.max(44,limit-top-16)+'px';
  const height=panel.getBoundingClientRect().height,below=limit-r.bottom-12,above=r.top-top-12,up=below<height&&above>below;
  panel.style.maxHeight=Math.max(44,up?above:below)+'px';const actual=panel.getBoundingClientRect();
  panel.style.left=Math.max(left+8,Math.min(r.left,left+width-actual.width-8))+'px';panel.style.top=Math.max(top+8,up?r.top-actual.height-4:r.bottom+4)+'px';
 }
 function open(){panel.hidden=false;button.setAttribute('aria-expanded','true');position();checks.get('all').focus({preventScroll:true});}
 button.onclick=()=>panel.hidden?open():close(true);
 button.onkeydown=e=>{if(e.key==='ArrowDown'){e.preventDefault();open();}else if(e.key==='Escape'&&!panel.hidden){e.preventDefault();close(true);}};
 panel.onkeydown=e=>{if(e.key==='Escape'){e.preventDefault();e.stopPropagation();close(true);}else if(['ArrowUp','ArrowDown','Home','End'].includes(e.key)){e.preventDefault();const all=[...checks.values()],i=all.indexOf(document.activeElement);all[e.key==='Home'?0:e.key==='End'?all.length-1:(i+(e.key==='ArrowDown'?1:-1)+all.length)%all.length].focus();}};
 document.addEventListener('pointerdown',e=>{if(!panel.hidden&&!panel.contains(e.target)&&!button.contains(e.target))close();});
 document.addEventListener('focusin',e=>{if(!panel.hidden&&!panel.contains(e.target)&&e.target!==button)close();});
 const schedule=()=>{if(!scheduled&&!panel.hidden)scheduled=requestAnimationFrame(()=>{scheduled=0;position();});};
 window.addEventListener('resize',schedule);window.addEventListener('scroll',schedule,{passive:true});window.visualViewport?.addEventListener('resize',schedule);window.visualViewport?.addEventListener('scroll',schedule);
 function load(id){close();listId=id;const saved=read()[id],valid=Array.isArray(saved)?saved.filter(id=>ids.includes(id)):[];selected=new Set(valid.length?valid:ids);status.textContent='';status.hidden=true;sync();}
 prune();sync();
 return {load,close,prune,matches:song=>[...selected].some(source=>matchesSource(song,source))};
}
