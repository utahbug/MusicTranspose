import {offlineSummary,refreshOffline} from './offline-manager.js';

export function storageSize(bytes){if(!Number.isFinite(bytes)||bytes<0)return 'Unavailable';const unit=bytes===0||bytes>=1000000?'MB':bytes>=1000?'KB':'B',divisor=unit==='MB'?1000000:unit==='KB'?1000:1;return `${(bytes/divisor).toLocaleString(undefined,{maximumFractionDigits:1})} ${unit}`;}
export function initAppInfo({closeMenu,returnFocus}){
 const $=id=>document.getElementById(id),dialog=$('app-info-dialog');let sizes=null,load=null;
 function render(){
  if(!dialog.open)return;
  const state=offlineSummary();
  $('app-storage-core').textContent=sizes?storageSize(sizes.coreBytes):'Unavailable';
  $('app-storage-all').textContent=sizes?storageSize(sizes.coreBytes+sizes.catalogBytes):'Unavailable';
  $('app-storage-saved').textContent=state.shellReady?storageSize(state.bytes):'Unavailable';
  $('app-storage-count').textContent=state.shellReady?String(state.savedCount):'Unavailable';
  $('app-storage-scope').textContent=sizes?`${sizes.catalogSongs} supported catalog songs · ${storageSize(sizes.catalogBytes)} of music.`:'';
  $('app-storage-status').textContent=[!sizes?'Size estimates are unavailable. Open App Info & Storage again while online.':'',!state.shellReady?'Offline storage cannot currently be verified.':state.error].filter(Boolean).join(' ');
 }
 async function readSizes(){
  if(!load)load=fetch('./storage-sizes.json').then(r=>{if(!r.ok)throw Error('Size manifest unavailable');return r.json();}).then(data=>{
   if(data.version!==1||!['coreBytes','coreAssets','catalogBytes','catalogAssets','catalogSongs'].every(k=>Number.isSafeInteger(data[k])&&data[k]>=0))throw Error('Invalid size manifest');
   sizes=data;
  }).catch(()=>{load=null;});
  await load;render();
 }
 $('home-info-storage').onclick=()=>{closeMenu();dialog.showModal();$('app-info-title').focus();render();readSizes();refreshOffline();};
 $('app-info-close').onclick=()=>dialog.close();dialog.addEventListener('close',returnFocus);
 dialog.addEventListener('click',event=>{if(event.target!==dialog)return;const r=dialog.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)dialog.close();});
 document.addEventListener('offline-state-changed',render);
}
