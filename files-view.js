import {songs} from './catalog.js';
const $=id=>document.getElementById(id);
const collator=new Intl.Collator(undefined,{numeric:true,sensitivity:'base'});
function element(tag,text,cls){const e=document.createElement(tag);if(text)e.textContent=text;if(cls)e.className=cls;return e;}
export function createFilesView({onLibrary,onSong}){
 function render(){
  const files=songs.filter(s=>s.local).sort((a,b)=>collator.compare(a.title,b.title)||collator.compare(a.originalFilename,b.originalFilename));
  $('files-count').textContent=files.length+' local '+(files.length===1?'file':'files');
  const host=$('files-results');host.replaceChildren();
  if(!files.length){host.append(element('p','No files added yet.','files-empty'));return;}
  for(const file of files){
   const row=element('div',null,'file-row');row.dataset.file=file.id;
   const open=element('button',null,'file-entry');open.type='button';open.setAttribute('aria-label','Open file: '+file.title);open.onclick=()=>onSong(file.id);
   open.append(element('strong',file.title));
   const status=file.scoreType==='pdf'?['PDF',file.pages?file.pages+' '+(file.pages===1?'page':'pages'):'']:['MusicXML',file.capability,file.tonic?file.tonic+' '+file.mode:'',file.warnings?.length?'Needs review':''];
   open.append(element('span',status.filter(Boolean).join(' · '),'song-meta'),element('span',file.originalFilename,'file-name'));
   const edit=element('button',null,'file-edit');edit.type='button';edit.setAttribute('aria-label','Manage file: '+file.title);edit.title='Manage file';edit.innerHTML='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m15 4 5 5M4 20l5-1L21 7a2 2 0 0 0-5-5L4 14Z"/></svg>';
   edit.onclick=()=>document.dispatchEvent(new CustomEvent('edit-local-music',{detail:{id:file.id,fromFiles:true}}));
   row.append(open,edit);host.append(row);
  }
 }
 $('files-library').onclick=onLibrary;
 document.addEventListener('local-music-changed',render);
 document.addEventListener('local-music-saved',e=>{if(!$('files-view').hidden){$('files-status').textContent=e.detail;$('add-music').focus({preventScroll:true});}});
 return {render,open(){render();$('files-status').textContent='';$('files-view').hidden=false;$('library').hidden=true;document.body.classList.add('library-open');document.title='Files · MusicTranspose';window.scrollTo(0,0);$('files-heading').focus({preventScroll:true});},hide(){$('files-view').hidden=true;}};
}
