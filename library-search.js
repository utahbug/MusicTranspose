import {normalizeSearch,songSearchText} from './songs.js';
// Language-specific text belongs to an immutable song ID; never create alias rows.
export const searchScopes=['titles','lyrics','all'];
export const lyricText=record=>['verses','refrains','alternateLyrics'].flatMap(key=>(record[key]||[]).map(item=>item.text||'')).join(' ');
export function createSongSearch(load=async()=>{const response=await fetch(new URL('./assets/lyrics.json',import.meta.url));if(!response.ok)throw Error('Lyrics unavailable');return response.json();}){
 const metadata=new WeakMap();let lyrics=null,pending=null;
 function fields(song){if(!metadata.has(song))metadata.set(song,{
  // Preserve legacy default matching, including existing tags/credits/filenames.
  titles:normalizeSearch([songSearchText(song),song.originalFilename,song.songNumber,...(song.collectionMemberships||[]).flatMap(m=>[m.title,m.songNumber])].filter(Boolean).join(' ')),
  extra:normalizeSearch([...(song.topics||[]),...(song.keywords||[])].join(' '))
 });return metadata.get(song);}
 async function prepare(){if(lyrics)return;if(!pending)pending=load().then(data=>{lyrics=new Map(data.songs.map(record=>[record.id,normalizeSearch(lyricText(record))]));}).catch(error=>{pending=null;throw error;});return pending;}
 function match(song,query,scope='titles'){
  const words=normalizeSearch(query).split(/\s+/).filter(Boolean),contains=text=>words.every(word=>text.includes(word)),base=fields(song);
  if(contains(base.titles))return {matched:true};
  const text=scope==='titles'?'':lyrics?.get(song.id)||'';
  // Deeper matches use the remembered phrase, avoiding scattered common words.
  if(text.includes(normalizeSearch(query)))return {matched:true,reason:'Matched lyrics'};
  if(scope==='all'&&contains(base.titles+' '+base.extra))return {matched:true,reason:'Matched metadata'};
  return {matched:false};
 }
 return {prepare,match};
}
