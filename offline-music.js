import {refreshOffline,offlineSummary,clearOfflineMusic,offlineListState} from './offline-manager.js';
export function initOfflineMusic({closeMenu,returnFocus,viewSaved,getLists}){
 const $=id=>document.getElementById(id),dialog=$('offline-music-dialog');let navigating=false;
 function show(){const state=offlineSummary(),complete=getLists().filter(g=>{const s=offlineListState(g);return s.retained&&s.saved===s.total;}).length;$('offline-summary').textContent=`Saved songs: ${state.savedCount} · Saved Lists: ${complete}${complete<state.listIds.length?' ('+state.listIds.length+' requested)':''}`;$('offline-storage').textContent=state.bytes?`Storage used: approximately ${(state.bytes/1000000).toFixed(1)} MB`:'';$('offline-note').textContent=state.error||'Saved status is verified now. Browser or device storage can still be cleared.';for(const id of ['offline-remove-all','offline-confirm-remove'])$(id).disabled=state.busy||!state.shellReady;}
 $('offline-music').onclick=()=>{closeMenu();navigating=false;$('offline-confirm').hidden=true;dialog.showModal();$('offline-music-close').focus();show();refreshOffline();};
 $('offline-music-close').onclick=()=>dialog.close();$('offline-view-saved').onclick=()=>{navigating=true;dialog.close();viewSaved();};
 $('offline-remove-all').onclick=()=>{$('offline-confirm').hidden=false;$('offline-confirm-cancel').focus();};$('offline-confirm-cancel').onclick=()=>{$('offline-confirm').hidden=true;$('offline-remove-all').focus();};
 $('offline-confirm-remove').onclick=async()=>{try{await clearOfflineMusic();$('offline-confirm').hidden=true;$('offline-remove-all').focus();}catch{}show();};
 dialog.addEventListener('cancel',e=>{if(!$('offline-confirm').hidden){e.preventDefault();$('offline-confirm-cancel').click();}});dialog.addEventListener('close',()=>{if(!navigating)returnFocus();});document.addEventListener('offline-state-changed',()=>{if(dialog.open)show();});
}
