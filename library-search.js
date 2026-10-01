import {normalizeSearch} from './songs.js';
export const searchFields=['title','lyrics','page'];
export function normalizeSearchFields(value){const fields=Array.isArray(value)?searchFields.filter(field=>value.includes(field)):[];return fields.length?fields:[...searchFields];}
export const pageSearchKey=value=>normalizeSearch(String(value??'')).replace(/[^a-z0-9]/g,'');
export const lyricText=record=>['verses','refrains','alternateLyrics'].flatMap(key=>(record[key]||[]).map(item=>item.text||'')).join(' ');
export function createSongSearch(load=async()=>{const response=await fetch(new URL('./assets/lyrics.json',import.meta.url));if(!response.ok)throw Error('Lyrics unavailable');return response.json();}){
 const metadata=new WeakMap();let lyrics=null,pending=null;
 function fields(song){if(!metadata.has(song))metadata.set(song,{title:normalizeSearch(song.title||''),pages:[song.page,song.songNumber,...(song.collectionMemberships||[]).flatMap(m=>[m.page,m.songNumber])].filter(v=>v!=null).map(pageSearchKey)});return metadata.get(song);}
 async function prepare(){if(lyrics)return;if(!pending)pending=load().then(data=>{lyrics=new Map(data.songs.map(record=>[record.id,normalizeSearch(lyricText(record))]));}).catch(error=>{pending=null;throw error;});return pending;}
 function match(song,query,enabled=searchFields){
  const text=normalizeSearch(query),base=fields(song),words=text.split(/\s+/).filter(Boolean);
  if(!text)return {matched:true};
  if(enabled.includes('page')&&/^\d+[a-z]?$/.test(pageSearchKey(query))&&base.pages.includes(pageSearchKey(query)))return {matched:true,reason:'Matched page',pageMatch:true};
  if(enabled.includes('title')&&words.every(word=>base.title.includes(word)))return {matched:true};
  if(enabled.includes('lyrics')&&(lyrics?.get(song.id)||'').includes(text))return {matched:true,reason:'Matched lyrics'};
  return {matched:false};
 }
 return {prepare,match};
}
