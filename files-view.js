import {removeMusicFile} from './my-music.js';
import {includedFileVisible} from './reviewer-starters.js';
import {fileTypeLabel,normalizeFileTags} from './local-music-store.js';
import {offlineBadge,refreshOffline} from './offline-manager.js';
import {editIcon} from './icons.js';
import {isFileSong} from './library-query.js';
import {songs} from './catalog.js';
const $=id=>document.getElementById(id);
const collator=new Intl.Collator(undefined,{numeric:true,sensitivity:'base'});
function element(tag,text,cls){const e=document.createElement(tag);if(text)e.textContent=text;if(cls)e.className=cls;return e;}
export function createFilesView({onLibrary,onSong}){
 const selection=new Set();let selecting=false,removing=false,visible=[];
 const fields=['Title','Filename','Type','Composer','Arranger','Category','Tags','Description'],selected=new Set(['Title','Composer','Arranger','Category','Tags']);
 const value=(file,field)=>field==='Type'?fileTypeLabel(file):field==='Filename'?(file.originalFilename||file.asset?.split('/').at(-1)||''):field==='Tags'?normalizeFileTags(file.tags).join(' '):String(file[field.toLowerCase()]||'');
 const fieldMenu=$('files-search-fields');
 for(const field of fields){const label=element('label'),check=document.createElement('input');check.type='checkbox';check.checked=selected.has(field);check.onchange=()=>{if(!check.checked&&selected.size===1){check.checked=true;$('files-status').textContent='Keep at least one search field selected.';return;}check.checked?selected.add(field):selected.delete(field);render();};label.append(check,document.createTextNode(field));fieldMenu.querySelector('div').append(label);}
 document.addEventListener('pointerdown',e=>{if(!fieldMenu.contains(e.target))fieldMenu.open=false;});fieldMenu.addEventListener('keydown',e=>{if(e.key==='Escape'){fieldMenu.open=false;fieldMenu.querySelector('summary').focus();}});fieldMenu.addEventListener('focusout',e=>{if(e.relatedTarget&&!fieldMenu.contains(e.relatedTarget))fieldMenu.open=false;});
 $('files-search').oninput=render;$('files-sort').onchange=render;
 function render(){
  const all=songs.filter(isFileSong).filter(includedFileVisible),sort=$('files-sort'),previous=sort.value,choices=['Title','Type',...['Category','Composer','Arranger'].filter(field=>all.some(file=>value(file,field).trim()))];
  sort.replaceChildren(...choices.map(field=>new Option(field,field)));sort.value=choices.includes(previous)?previous:'Title';
  const query=$('files-search').value.trim().toLocaleLowerCase();
  const files=all.filter(file=>!query||[...selected].some(field=>value(file,field).toLocaleLowerCase().includes(query))).sort((a,b)=>{const av=value(a,sort.value).trim(),bv=value(b,sort.value).trim();return Number(!av)-Number(!bv)||collator.compare(av,bv)||collator.compare(a.title,b.title);});
  visible=files;
  for(const id of selection)if(!all.some(f=>f.id===id))selection.delete(id);
  updateActions();
  $('files-count').textContent=files.length+' '+(files.length===1?'file':'files');
  const host=$('files-results');host.replaceChildren();
  if(!files.length){host.append(element('p',all.length?'No files match your search.':'No music files yet.','files-empty'));return;}
  for(const file of files){
   const row=element('div',null,'file-row');row.dataset.file=file.id;
   const open=element('button',null,'file-entry');open.type='button';open.setAttribute('aria-label','Open file: '+file.title);open.onclick=()=>onSong(file.id,files.map(song=>song.id));
   open.append(element('strong',file.title),element('span',file.local?'Added on this device':'Included example','song-meta'));
   const type=element('span',fileTypeLabel(file),'file-type');
   const badge=offlineBadge(file);if(badge)open.append(badge);
   const edit=element('button',null,'file-edit');edit.type='button';edit.setAttribute('aria-label','Edit file details: '+file.title);edit.title='Edit file details';edit.innerHTML=editIcon;
   edit.onclick=()=>document.dispatchEvent(new CustomEvent('edit-local-music',{detail:{id:file.id,fromFiles:true}}));
   if(selecting){const label=element('label',null,'file-select-target'),check=document.createElement('input');check.type='checkbox';check.checked=selection.has(file.id);check.disabled=removing;check.setAttribute('aria-label','Select file: '+file.title);check.onchange=()=>{check.checked?selection.add(file.id):selection.delete(file.id);open.setAttribute('aria-pressed',String(check.checked));updateActions();};label.append(check);row.append(label);open.onclick=()=>check.click();open.setAttribute('aria-label','Toggle selection: '+file.title);open.setAttribute('aria-pressed',String(check.checked));edit.hidden=true;}
   row.append(open,type,edit);host.append(row);
  }
 }
 function updateActions(){
  $('files-view').classList.toggle('selecting-files',selecting);
  $('add-music').hidden=selecting;$('files-select').hidden=selecting;
  $('files-remove').hidden=$('files-select-cancel').hidden=!selecting;
  $('files-select-all-label').hidden=!selecting;const all=$('files-select-all');all.disabled=removing||!visible.length;all.checked=!!visible.length&&visible.every(f=>selection.has(f.id));all.indeterminate=!all.checked&&visible.some(f=>selection.has(f.id));
  $('files-remove').textContent=`Remove selected (${selection.size})`;
  $('files-remove').disabled=removing||!selection.size;$('files-select-cancel').disabled=removing;
 }
 $('files-select-all').onchange=()=>{for(const file of visible)$('files-select-all').checked?selection.add(file.id):selection.delete(file.id);render();};
 function exitSelection(){selecting=false;selection.clear();render();}
 $('files-select').onclick=()=>{$('files-status').textContent='';selecting=true;selection.clear();render();$('files-select-cancel').focus();};
 $('files-select-cancel').onclick=()=>{exitSelection();$('files-select').focus();};
 const removal=$('files-remove-dialog');let pending=[];
 $('files-remove').onclick=()=>{
  pending=songs.filter(f=>selection.has(f.id)&&isFileSong(f));
  const imports=pending.filter(f=>f.local).length;
  $('files-remove-title').textContent=`Remove ${pending.length} selected files?`;
  $('files-remove-imported').textContent=`${imports} imported files will be deleted from this device.`;
  $('files-remove-included').textContent='';
  removal.showModal();$('files-remove-cancel').focus();
 };
 $('files-remove-cancel').onclick=()=>removal.close();
 removal.addEventListener('cancel',e=>{if(removing)e.preventDefault();});
 removal.addEventListener('close',()=>{if(selecting)$('files-remove').focus();});
 $('files-remove-confirm').onclick=async()=>{
  if(removing)return;removing=true;updateActions();render();
  $('files-remove-confirm').disabled=$('files-remove-cancel').disabled=true;
  const done=[],failed=[],warnings=[];
  for(const file of pending){try{const warning=await removeMusicFile(file.id);done.push(file.title);selection.delete(file.id);if(warning)warnings.push(file.title+': '+warning);}catch{failed.push(file.title);}}
  removing=false;$('files-remove-confirm').disabled=$('files-remove-cancel').disabled=false;
  if(!failed.length)exitSelection();else render();
  removal.close();$('files-status').textContent=[done.length?`Removed ${done.length}: ${done.join('; ')}.`:'No files removed.',failed.length?`Not removed (${failed.length}): ${failed.join('; ')}. Selection retained for retry.`:'',...warnings].filter(Boolean).join(' ');
  $(selecting?'files-remove':'files-select').focus();
 };

 const info=$('files-info-dialog');
 $('files-info').onclick=()=>{info.showModal();$('files-info-title').focus();};
 $('files-info-close').onclick=()=>info.close();
 info.addEventListener('close',()=>{$('files-info').focus({preventScroll:true});});
 info.addEventListener('click',e=>{if(e.target!==info)return;const r=info.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)info.close();});
 $('files-library').onclick=onLibrary;
 document.addEventListener('local-music-changed',render);
 document.addEventListener('offline-state-changed',()=>{if(!$('files-view').hidden)render();});
 document.addEventListener('local-music-saved',e=>{if(!$('files-view').hidden){$('files-status').textContent=e.detail.message||e.detail;const row=e.detail.id&&$('files-results').querySelector(`[data-file="${CSS.escape(e.detail.id)}"]`);if(row){row.classList.add('just-added');row.scrollIntoView({block:'nearest'});row.querySelector(e.detail.edited?'.file-edit':'.file-entry').focus({preventScroll:true});}else $('add-music').focus({preventScroll:true});}});
 return {render,open(){refreshOffline();render();$('files-status').textContent='';$('files-view').hidden=false;$('library').hidden=true;document.body.classList.add('library-open');document.title='Files · MusicSlate';window.scrollTo(0,0);$('files-heading').focus({preventScroll:true});},hide(){if(!removing)exitSelection();$('files-view').hidden=true;}};
}
