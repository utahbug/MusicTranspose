import {listSongIds} from './list-items.js';
import {songs} from './catalog.js';
import {localRecords} from './local-music-store.js';
import {requiredOfflineAssets} from './offline-assets.js';
let snapshot={songs:{},listIds:[],savedCount:0,bytes:0,shellReady:false},localIds=new Set(),refreshing=null,refreshAgain=false,pending=0,problem='',progress=null;
const unavailableMessage='Offline storage is not available yet. Open the app online and try again.';
const emit=()=>document.dispatchEvent(new Event('offline-state-changed'));
export function offlineSongState(song){if(song?.local)return {local:true,saved:localIds.has(song.id)};return snapshot.songs[song?.id]||{saved:false,individual:false,lists:[]};}
export function offlineSummary(){return {...snapshot,busy:pending>0,error:problem,progress};}
export function offlineListState(list){let excluded=0;const playable=listSongIds(list).map(id=>songs.find(s=>s.id===id)).filter(s=>{const ok=s?.local?localIds.has(s.id):requiredOfflineAssets(s).length>0;if(!ok)excluded++;return ok;});return {total:playable.length,saved:playable.filter(s=>offlineSongState(s).saved).length,retained:snapshot.listIds.includes(list.id),excluded};}
export const offlineError=e=>e?.message==='storage-full'?'Device storage prevented completion. Music already saved has been kept.':'Could not save all files. Try again while online. If this continues, check browser storage permissions.';
async function request(type,extra={}){if(!navigator.serviceWorker)throw Error('unavailable');
 const registration=await Promise.race([navigator.serviceWorker.ready,new Promise((_,reject)=>setTimeout(()=>reject(Error('unavailable')),5000))]);const worker=registration.active;if(!worker)throw Error('unavailable');
 return new Promise((resolve,reject)=>{const channel=new MessageChannel(),timer=setTimeout(()=>{channel.port1.close();reject(Error('unavailable'));},type==='explicit-offline-save'?600000:30000);channel.port1.onmessage=e=>{clearTimeout(timer);channel.port1.close();if(e.data.error||e.data.protocol!==1)reject(Error(e.data.error||'unavailable'));else resolve(e.data);};worker.postMessage({type,...extra},[channel.port2]);});
}
async function accept(value){snapshot=value;try{localIds=new Set((await localRecords()).filter(r=>r.file?.size&&(r.metadata.scoreType==='pdf'||r.xml)).map(r=>r.metadata.id));}catch{localIds=new Set();}emit();return value;}
export function refreshOffline(){if(refreshing){refreshAgain=true;return refreshing;}refreshing=(async()=>{try{do{refreshAgain=false;try{const value=await request('explicit-offline-status');if(problem===unavailableMessage)problem='';await accept(value);}catch{problem=unavailableMessage;await accept({songs:{},listIds:[],savedCount:0,bytes:0,shellReady:false});}}while(refreshAgain);return snapshot;}finally{refreshing=null;}})();return refreshing;}

async function change(type,extra){pending++;problem='';emit();try{if(type==='explicit-offline-save')await navigator.storage?.persist?.().catch(()=>false);const value=await request(type,extra);await accept(value);if(value.storageFull)problem=offlineError(Error('storage-full'));else if(value.failed)problem=offlineError();return value;}catch(e){problem=offlineError(e);await refreshOffline();problem=offlineError(e);throw e;}finally{pending--;progress=null;emit();}}
export const saveOfflineSong=song=>change('explicit-offline-save',{owner:'individual',ids:[song.id]});
export const removeOfflineSong=song=>change('explicit-offline-remove',{owner:'individual',id:song.id});
export const saveOfflineList=list=>change('explicit-offline-save',{owner:'list',listId:list.id,ids:listSongIds(list)});
export const removeOfflineList=list=>change('explicit-offline-remove',{owner:'list',listId:list.id});
export const clearOfflineMusic=()=>change('explicit-offline-clear');
export async function reconcileOfflineLists(lists){try{await accept(await request('explicit-offline-reconcile',{lists:lists.map(g=>({id:g.id,songs:listSongIds(g)}))}));}catch{await refreshOffline();}}
export function offlineBadge(song){const state=offlineSongState(song);if(!state.saved)return null;const badge=document.createElement('span');badge.className='offline-saved-badge';badge.title=state.local?'On this device':'Saved on this device';badge.setAttribute('aria-label',badge.title);badge.setAttribute('role','img');badge.innerHTML='<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true"><rect x="5" y="2" width="14" height="20" rx="2"/><path d="m8 12 3 3 5-6"/></svg>';return badge;}
navigator.serviceWorker?.addEventListener('message',e=>{if(e.data?.type!=='explicit-offline-changed')return;if(e.data.progress){progress=e.data.progress;emit();}else refreshOffline();});
navigator.serviceWorker?.addEventListener('controllerchange',()=>refreshOffline());
window.addEventListener('focus',()=>refreshOffline());
document.addEventListener('local-music-changed',()=>refreshOffline());
