import {songs as bundled} from './songs.js';
import {localMetadata,localRecord} from './local-music-store.js';
export const songs=[...bundled];
const urls=new Map();
export async function refreshLocalMusic(){const records=await localMetadata();songs.splice(0,songs.length,...bundled,...records.map(r=>({...r,local:true,asset:'local:'+r.id})));document.dispatchEvent(new Event('local-music-changed'));}
export async function localXML(song){const r=await localRecord(song.id);if(!r?.xml)throw Error('Local score unavailable');return r.xml;}
export async function localAsset(song){if(!urls.has(song.id)){const r=await localRecord(song.id);if(!r)throw Error('Local file unavailable');urls.set(song.id,URL.createObjectURL(r.file));}return urls.get(song.id);}
export function releaseLocalAsset(id){if(urls.has(id)){URL.revokeObjectURL(urls.get(id));urls.delete(id);}}
