import {bundledLeadIds} from './lead-availability.js';
import {createLeadXML} from './lead-view.js';
import {songs as bundled} from './songs.js';
import {localMetadata,localRecord} from './local-music-store.js';
export const songs=[...bundled];
// Bundled capability metadata and imported-source checks share one filter predicate.
export const supportsLead=song=>!song.missing&&song.scoreType!=='pdf'&&(song.local?song.leadAvailable===true:bundledLeadIds.has(song.id));
const urls=new Map();
export async function refreshLocalMusic(){
 const records=await localMetadata();
 const local=await Promise.all(records.map(async r=>{
  let leadAvailable=false;
  if(r.scoreType!=='pdf'){
   try{const record=await localRecord(r.id);leadAvailable=!!record?.xml&&createLeadXML(record.xml).ok;}catch{}
  }
  return {...r,local:true,asset:'local:'+r.id,leadAvailable};
 }));
 songs.splice(0,songs.length,...bundled,...local);
 document.dispatchEvent(new Event('local-music-changed'));
}
export async function localXML(song){const r=await localRecord(song.id);if(!r?.xml)throw Error('Local score unavailable');return r.xml;}
export async function localAsset(song){if(!urls.has(song.id)){const r=await localRecord(song.id);if(!r)throw Error('Local file unavailable');urls.set(song.id,URL.createObjectURL(r.file));}return urls.get(song.id);}
export function releaseLocalAsset(id){if(urls.has(id)){URL.revokeObjectURL(urls.get(id));urls.delete(id);}}
