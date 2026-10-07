// The historical songs array remains the single manual sequence for all List items.
// Text IDs resolve through textItems; catalog/offline consumers use only song IDs.
export const textItem=(list,id)=>Object.hasOwn(list?.textItems||{},id)&&list.textItems[id]?.type==='text'?list.textItems[id]:null;
export const listSongIds=list=>list.songs.filter(id=>!textItem(list,id));
export const itemTitle=(list,id,songs)=>textItem(list,id)?.title||list.displayNames?.[id]||songs.find(s=>s.id===id)?.title||'Unavailable song';
export function listCount(list){const texts=list.songs.filter(id=>textItem(list,id)).length;return texts?list.songs.length+' items':list.songs.length+' '+(list.songs.length===1?'song':'songs');}
