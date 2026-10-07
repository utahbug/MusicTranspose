import {textItem,listCount} from './list-items.js';
// Plain text only; copying never changes List membership, order or navigation.
export function listClipboardText(list,songs){
 const rows=list.songs.map(id=>{
  const text=textItem(list,id);if(text)return text.title+' — Text';
  const song=songs.find(s=>s.id===id);if(!song)return 'Unavailable song';
  const alias=list.displayNames?.[id]?.trim(),title=song.title||'Untitled music';
  const number=String(song.songNumber??song.page??'').trim();
  const same=alias?.toLocaleLowerCase()===title.toLocaleLowerCase();
  const label=alias&&!same?[alias,title].join(' — '):title;
  const collection=song.collection||'Files';
  // An alias may already begin with its page number; avoid duplicating it.
  return [number&&!(alias&&!same&&(alias===number||alias.startsWith(number+' ')))?number:null,label,collection].filter(Boolean).join(' — ');
 });
 return [list.name,listCount(list),'',...rows].join('\n');
}
export async function copyListText(text){
 try{if(navigator.clipboard?.writeText){await navigator.clipboard.writeText(text);return true;}}catch{}
 const focused=document.activeElement,selection=window.getSelection(),ranges=[];
 for(let i=0;selection&&i<selection.rangeCount;i++)ranges.push(selection.getRangeAt(i).cloneRange());
 const field=document.createElement('textarea');field.value=text;field.readOnly=true;field.setAttribute('aria-label','List text to copy');
 field.style.cssText='position:fixed;top:0;left:0;width:1px;height:1px;opacity:0;font-size:16px';document.body.append(field);
 try{field.focus({preventScroll:true});field.select();field.setSelectionRange(0,text.length);return !!document.execCommand('copy');}catch{return false;}
 finally{field.remove();focused?.focus({preventScroll:true});if(selection){selection.removeAllRanges();for(const range of ranges)selection.addRange(range);}}
}
