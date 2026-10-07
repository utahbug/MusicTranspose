// Shared Text content is stored once; each List's historical songs array holds ordered IDs.
let sharedItems={};
export function initializeTextItems(state){
 state.textItems=state.textItems&&typeof state.textItems==='object'&&!Array.isArray(state.textItems)?state.textItems:{};
 sharedItems=state.textItems;let changed=false;
 for(const list of state.groups){
  if(!list.textItems||typeof list.textItems!=='object')continue;
  for(const [id,item] of Object.entries(list.textItems)){
   if(item?.type!=='text')continue; // Preserve unknown legacy data.
   let key=id;
   if(Object.hasOwn(sharedItems,key)&&JSON.stringify(sharedItems[key])!==JSON.stringify(item)){
    key='text:'+crypto.randomUUID();list.songs=list.songs.map(value=>value===id?key:value);
    if(Object.hasOwn(list.displayNames||{},id)){list.displayNames[key]=list.displayNames[id];delete list.displayNames[id];}
   }
   Object.defineProperty(sharedItems,key,{value:item,writable:true,enumerable:true,configurable:true});delete list.textItems[id];changed=true;
  }
  if(!Object.keys(list.textItems).length)delete list.textItems;
 }
 return changed;
}
export const textItem=(list,id)=>Object.hasOwn(sharedItems,id)&&sharedItems[id]?.type==='text'?sharedItems[id]:null;
export const listSongIds=list=>list.songs.filter(id=>!textItem(list,id));
export const itemTitle=(list,id,songs)=>textItem(list,id)?.title||list.displayNames?.[id]||songs.find(s=>s.id===id)?.title||'Unavailable song';
export function listCount(list){const texts=list.songs.filter(id=>textItem(list,id)).length;return texts?list.songs.length+' items':list.songs.length+' '+(list.songs.length===1?'song':'songs');}
