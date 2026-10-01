import {inspectFile} from './local-music-validation.js';
import {byHash,localRecord,addRecord,updateRecord,removeRecord,storageMessage} from './local-music-store.js';
import {refreshLocalMusic,releaseLocalAsset} from './catalog.js';
const $=id=>document.getElementById(id);
export function initMyMusic(){
 const dialog=$('music-import');let pending=null,editing=null,working=false,fromFiles=false,previewRequest=0;
 const message=text=>$('import-message').textContent=text;
 function reset(){previewRequest++;working=false;pending=null;editing=null;$('music-file').value='';$('import-preview').replaceChildren();$('import-details').hidden=true;$('import-save').disabled=true;$('import-delete').hidden=true;$('import-memberships').replaceChildren();fromFiles=false;message('');}
 function show(record){pending=record;$('import-title').value=record.metadata.title;$('import-page').value=record.metadata.page||'';$('import-summary').textContent=[record.metadata.fileType.toUpperCase(),record.metadata.capability,record.metadata.tonic?record.metadata.tonic+' '+record.metadata.mode:'Key not determined'].join(' · ');$('import-warnings').textContent=record.metadata.warnings?.join(' ')||'';$('import-details').hidden=false;$('import-save').disabled=false;}
 $('add-music').onclick=()=>{reset();$('import-heading').textContent='Import music';$('music-file').disabled=false;$('import-save').textContent='Add to Library';document.dispatchEvent(new Event('music-import-open'));dialog.showModal();$('music-file').focus();};
 $('close-import').onclick=()=>{if(!working)dialog.close();};dialog.addEventListener('cancel',e=>{if(working)e.preventDefault();});dialog.addEventListener('close',()=>{if(!dialog.open){reset();document.dispatchEvent(new Event('music-import-close'));}});
 $('music-file').onchange=async()=>{const file=$('music-file').files[0];if(!file)return;const request=++previewRequest,preview=document.createElement('div');$('import-preview').replaceChildren(preview);pending=null;$('import-details').hidden=true;$('import-save').disabled=true;working=true;$('music-file').disabled=true;message('Checking file and preparing preview…');
  try{const record=await inspectFile(file,preview),duplicate=await byHash(record.metadata.hash);if(request!==previewRequest)return;if(duplicate){message('This exact file is already in Files. Nothing was added.');$('import-preview').replaceChildren();return;}show(record);message('Preview ready. Check the score before adding it.');}catch(e){if(request===previewRequest){$('import-preview').replaceChildren();message(e.message);}}finally{if(request===previewRequest){working=false;$('music-file').disabled=false;}}
 };
 document.addEventListener('edit-local-music',async e=>{reset();working=true;try{fromFiles=!!e.detail?.fromFiles;const record=await localRecord(fromFiles?e.detail.id:e.detail);if(!record)return;editing=record.metadata.id;$('import-heading').textContent='Manage file';show(record);$('music-file').disabled=true;$('import-delete').hidden=false;$('import-save').textContent='Save changes';
  const state=JSON.parse(localStorage.getItem('music-transpose-library-v1')||'{}');for(const g of fromFiles?[]:state.groups||[]){const label=document.createElement('label'),check=document.createElement('input');check.type='checkbox';check.dataset.listId=g.id;check.checked=g.songs.includes(editing);label.append(check,document.createTextNode(g.name));$('import-memberships').append(label);}
  dialog.showModal();$('import-title').focus();}catch{message('Unable to read this file.');}finally{working=false;}});
 $('import-save').onclick=async()=>{if(!pending||working)return;const title=$('import-title').value.trim();if(!title){message('Enter a title.');return;}working=true;$('import-save').disabled=true;const savedId=pending.metadata.id,savedMessage=editing?'File details saved.':'File added to Files.';
  try{pending.metadata.title=title;pending.metadata.page=$('import-page').value.trim();if(editing){await updateRecord(pending);const memberships=[...$('import-memberships').querySelectorAll('input')].map(e=>({id:e.dataset.listId,checked:e.checked}));if(!fromFiles)document.dispatchEvent(new CustomEvent('local-music-memberships',{detail:{id:editing,memberships}}));}else await addRecord(pending);
   await refreshLocalMusic();dialog.close();document.dispatchEvent(new CustomEvent('local-music-saved',{detail:{message:savedMessage,id:savedId}}));if(navigator.storage?.persist)navigator.storage.persist().catch(()=>{});
  }catch(e){message(storageMessage(e));$('import-save').disabled=false;}finally{working=false;}
 };
 $('import-delete').onclick=async()=>{if(!editing||working||!confirm('Delete this file from this device? Its Favorites and list memberships will also be removed.'))return;working=true;
  try{await removeRecord(editing);releaseLocalAsset(editing);document.dispatchEvent(new CustomEvent('local-music-deleted',{detail:editing}));await refreshLocalMusic();dialog.close();document.dispatchEvent(new CustomEvent('local-music-saved',{detail:'File deleted. Favorites and list references removed.'}));}catch(e){message(storageMessage(e));}finally{working=false;}
 };
}
