import {inspectFile} from './local-music-validation.js';
import {byHash,localRecord,addRecord,updateRecord,removeRecord,storageMessage} from './local-music-store.js';
import {refreshLocalMusic,releaseLocalAsset} from './catalog.js';
const $=id=>document.getElementById(id);
export function initMyMusic(){
 const dialog=$('music-import');let pending=null,editing=null,working=false;
 const message=text=>$('import-message').textContent=text;
 function reset(){pending=null;editing=null;$('music-file').value='';$('import-preview').replaceChildren();$('import-details').hidden=true;$('import-save').disabled=true;$('import-delete').hidden=true;$('import-memberships').replaceChildren();message('');}
 function show(record){pending=record;$('import-title').value=record.metadata.title;$('import-page').value=record.metadata.page||'';$('import-summary').textContent=[record.metadata.fileType.toUpperCase(),record.metadata.capability,record.metadata.tonic?record.metadata.tonic+' '+record.metadata.mode:'Key not determined'].join(' · ');$('import-warnings').textContent=record.metadata.warnings?.join(' ')||'';$('import-details').hidden=false;$('import-save').disabled=false;}
 $('add-music').onclick=()=>{reset();$('music-file').disabled=false;$('import-save').textContent='Add to Library';dialog.showModal();$('music-file').focus();};
 $('close-import').onclick=()=>{if(!working)dialog.close();};dialog.addEventListener('cancel',e=>{if(working)e.preventDefault();});dialog.addEventListener('close',reset);
 $('music-file').onchange=async()=>{const file=$('music-file').files[0];if(!file)return;pending=null;$('import-details').hidden=true;$('import-save').disabled=true;working=true;$('music-file').disabled=true;message('Checking file and preparing preview…');
  try{const record=await inspectFile(file,$('import-preview'));if(await byHash(record.metadata.hash)){message('This exact file is already in My Music. Nothing was added.');$('import-preview').replaceChildren();return;}show(record);message('Preview ready. Check the score before adding it.');}catch(e){$('import-preview').replaceChildren();message(e.message);}finally{working=false;$('music-file').disabled=false;}
 };
 document.addEventListener('edit-local-music',async e=>{reset();working=true;try{const record=await localRecord(e.detail);if(!record)return;editing=record.metadata.id;show(record);$('music-file').disabled=true;$('import-delete').hidden=false;$('import-save').textContent='Save changes';
  const state=JSON.parse(localStorage.getItem('music-transpose-library-v1')||'{}');for(const g of state.groups||[]){const label=document.createElement('label'),check=document.createElement('input');check.type='checkbox';check.dataset.listId=g.id;check.checked=g.songs.includes(editing);label.append(check,document.createTextNode(g.name));$('import-memberships').append(label);}
  dialog.showModal();$('import-title').focus();}catch{message('Unable to read this local song.');}finally{working=false;}});
 $('import-save').onclick=async()=>{if(!pending||working)return;const title=$('import-title').value.trim();if(!title){message('Enter a title.');return;}working=true;$('import-save').disabled=true;
  try{pending.metadata.title=title;pending.metadata.page=$('import-page').value.trim();if(editing){await updateRecord(pending);const memberships=[...$('import-memberships').querySelectorAll('input')].map(e=>({id:e.dataset.listId,checked:e.checked}));document.dispatchEvent(new CustomEvent('local-music-memberships',{detail:{id:editing,memberships}}));}else await addRecord(pending);
   await refreshLocalMusic();dialog.close();if(navigator.storage?.persist)navigator.storage.persist().catch(()=>{});
  }catch(e){message(storageMessage(e));$('import-save').disabled=false;}finally{working=false;}
 };
 $('import-delete').onclick=async()=>{if(!editing||working||!confirm('Delete this imported song from this device? Its Favorites and list memberships will also be removed.'))return;working=true;
  try{await removeRecord(editing);releaseLocalAsset(editing);document.dispatchEvent(new CustomEvent('local-music-deleted',{detail:editing}));await refreshLocalMusic();dialog.close();}catch(e){message(storageMessage(e));}finally{working=false;}
 };
}
