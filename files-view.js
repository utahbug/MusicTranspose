import {offlineBadge,refreshOffline} from './offline-manager.js';
import {editIcon} from './icons.js';
import {isFileSong} from './library-query.js';
import {songs} from './catalog.js';
const $=id=>document.getElementById(id);
const collator=new Intl.Collator(undefined,{numeric:true,sensitivity:'base'});
function element(tag,text,cls){const e=document.createElement(tag);if(text)e.textContent=text;if(cls)e.className=cls;return e;}
export function createFilesView({onLibrary,onSong}){
 function render(){
  const files=songs.filter(isFileSong).sort((a,b)=>collator.compare(a.title,b.title)||collator.compare(a.originalFilename,b.originalFilename));
  $('files-count').textContent=files.length+' '+(files.length===1?'file':'files');
  const host=$('files-results');host.replaceChildren();
  if(!files.length){host.append(element('p','No music files yet.','files-empty'));return;}
  for(const file of files){
   const row=element('div',null,'file-row');row.dataset.file=file.id;
   const open=element('button',null,'file-entry');open.type='button';open.setAttribute('aria-label','Open file: '+file.title);open.onclick=()=>onSong(file.id,files.map(song=>song.id));
   open.append(element('strong',file.title));
   const status=file.scoreType==='pdf'?['PDF',file.pages?file.pages+' '+(file.pages===1?'page':'pages'):'']:['MusicXML',file.capability,file.tonic?file.tonic+' '+file.mode:'',file.warnings?.length?'Needs review':''];
   open.append(element('span',[file.category,...status].filter(Boolean).join(' · '),'song-meta'),element('span',file.originalFilename||file.asset.split('/').at(-1),'file-name'));
   const badge=offlineBadge(file);if(badge)open.querySelector('.song-meta').append(badge);
   const edit=element('button',null,'file-edit');edit.type='button';edit.setAttribute('aria-label','Edit file details: '+file.title);edit.title='Edit file details';edit.innerHTML=editIcon;
   edit.onclick=()=>document.dispatchEvent(new CustomEvent('edit-local-music',{detail:{id:file.id,fromFiles:true}}));
   row.append(open,edit);host.append(row);
  }
 }
 const info=$('files-info-dialog');
 $('files-info').onclick=()=>{info.showModal();$('files-info-title').focus();};
 $('files-info-close').onclick=()=>info.close();
 info.addEventListener('close',()=>{$('files-info').focus({preventScroll:true});});
 info.addEventListener('click',e=>{if(e.target!==info)return;const r=info.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)info.close();});
 $('files-library').onclick=onLibrary;
 document.addEventListener('local-music-changed',render);
 document.addEventListener('offline-state-changed',()=>{if(!$('files-view').hidden)render();});
 document.addEventListener('local-music-saved',e=>{if(!$('files-view').hidden){$('files-status').textContent=e.detail.message||e.detail;const row=e.detail.id&&$('files-results').querySelector(`[data-file="${CSS.escape(e.detail.id)}"]`);if(row){row.classList.add('just-added');row.scrollIntoView({block:'nearest'});row.querySelector(e.detail.edited?'.file-edit':'.file-entry').focus({preventScroll:true});}else $('add-music').focus({preventScroll:true});}});
 return {render,open(){refreshOffline();render();$('files-status').textContent='';$('files-view').hidden=false;$('library').hidden=true;document.body.classList.add('library-open');document.title='Files · MusicTranspose';window.scrollTo(0,0);$('files-heading').focus({preventScroll:true});},hide(){$('files-view').hidden=true;}};
}
