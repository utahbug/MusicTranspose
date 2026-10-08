import {songs} from './catalog.js';
import {isFileSong} from './library-query.js';
import {requiredOfflineAssets} from './offline-assets.js';
import {offlineSongState,offlineSummary,saveOfflineSong,removeOfflineSong} from './offline-manager.js';
export const catalogOfflineSong=song=>!!song&&!isFileSong(song)&&requiredOfflineAssets(song).length>0;
const icon=saved=>`<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M4 15v5h16v-5${saved?'m-13-6 4 4 6-7':'M12 3v12m-4-4 4 4 4-4'}"/></svg>`;
let notice,returnControl;
function explain(message,control){
 if(!notice){notice=document.createElement('dialog');notice.id='offline-control-notice';notice.className='app-dialog';notice.setAttribute('aria-labelledby','offline-control-title');notice.innerHTML='<div class="dialog-heading"><h2 id="offline-control-title">Saved on this device</h2><button type="button" class="close" aria-label="Close offline message">×</button></div><p role="status"></p>';notice.querySelector('button').onclick=()=>notice.close();notice.addEventListener('close',()=>{const target=returnControl?.isConnected?returnControl:[...document.querySelectorAll('.catalog-offline')].find(e=>e.dataset.offlineSong===returnControl?.dataset.offlineSong&&e.getClientRects().length);target?.focus({preventScroll:true});});document.body.append(notice);}
 returnControl=control;notice.querySelector('p').textContent=message;notice.showModal();notice.querySelector('button').focus();
}
export function syncOfflineControl(button,song){
 button.hidden=!catalogOfflineSong(song);if(button.hidden)return;
 button.dataset.offlineSong=song.id;const state=offlineSongState(song),summary=offlineSummary(),label=state.saved?'Saved on this device':'Save on this device';
 button.innerHTML=icon(state.saved);button.title=label;button.setAttribute('aria-label',label);button.setAttribute('aria-pressed',String(!!state.saved));button.setAttribute('aria-busy',String(summary.busy));button.disabled=summary.busy||!summary.shellReady;
 button.setAttribute('aria-description',state.saved?(state.lists?.length?'Retained by a saved List. Individual removal keeps List downloads.':'Activate to remove the individual offline save.'):'Save this song for offline use.');
}
export function createOfflineControl(song){
 const button=document.createElement('button');button.type='button';button.className='catalog-offline';syncOfflineControl(button,song);
 button.onclick=async event=>{event.stopPropagation();const current=songs.find(s=>s.id===button.dataset.offlineSong);if(!catalogOfflineSong(current))return;const state=offlineSongState(current);
  try{if(state.saved){if(state.individual)await removeOfflineSong(current);if(state.lists?.length)explain('This song is still saved by a List. Use Remove list downloads in that List to release its copy. Other saved Lists also keep their copies.',button);}else await saveOfflineSong(current);}
  catch{explain(offlineSummary().error||'Could not update offline storage. Please try again.',button);}
  finally{const replacement=button.isConnected?button:[...document.querySelectorAll('.catalog-offline')].find(e=>e.dataset.offlineSong===current.id&&e.getClientRects().length);if(!notice?.open)(replacement||document.querySelector('#library .header-home'))?.focus({preventScroll:true});}
 };
 return button;
}
document.addEventListener('offline-state-changed',()=>{for(const button of document.querySelectorAll('.catalog-offline'))syncOfflineControl(button,songs.find(s=>s.id===button.dataset.offlineSong));});
