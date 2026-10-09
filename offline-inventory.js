import {songs} from './catalog.js';
import {offlineSongState,offlineSummary,refreshOffline} from './offline-manager.js';
import {meaningfulNumber,meaningfulSource} from './score-labels.js';
import {compareNumbers,compareAlphabeticalTitles} from './library-query.js';
import {normalizeSearch} from './songs.js';
// A read-only projection of the existing verified snapshot, never a second inventory store.
export function deviceSongs(){
 const summary=offlineSummary();if(!summary.inventoryReady)return null;
 const catalog=new Map(songs.map(song=>[song.id,song]));
 for(const [id,state] of Object.entries(summary.songs))if(state.saved&&!catalog.has(id))catalog.set(id,{id,title:'Saved song ('+id+')',collection:'Catalog details unavailable'});
 return [...catalog.values()].filter(song=>offlineSongState(song).saved).map(song=>({song,state:offlineSongState(song)}));
}
export function retentionText(state,lists){
 const reasons=[];if(state.local)reasons.push('Imported file');if(state.individual)reasons.push('Saved individually');
 for(const id of state.lists||[])reasons.push(lists.find(list=>list.id===id)?.name||'Saved List (name unavailable)');
 return ['On device',...reasons].join(' · ');
}
export function initOfflineInventory({getLists,beforeOpen}){
 const entry=document.getElementById('home-info-saved'),dialog=document.createElement('dialog');dialog.id='offline-inventory';dialog.className='app-dialog';dialog.setAttribute('aria-labelledby','device-songs-title');
 dialog.innerHTML='<div class="dialog-heading"><h2 id="device-songs-title" tabindex="-1">Songs on this device</h2><button type="button" class="close" aria-label="Return to previous workspace">×</button></div><p id="device-songs-summary" role="status"></p><div class="device-songs-controls"><label>Search<input id="device-songs-search" type="search" placeholder="Title or song number"></label><label>Sort by<select id="device-songs-sort"><option value="title">Title (A–Z)</option><option value="number">Song number</option></select></label></div><p class="setting-note">Opening a song alone does not guarantee offline access. Only verified saves and imported files are listed.</p><ul id="device-songs-results" aria-label="Songs on this device"></ul>';
 document.body.append(dialog);const find=id=>dialog.querySelector('#'+id),search=find('device-songs-search'),sort=find('device-songs-sort'),summary=find('device-songs-summary'),results=find('device-songs-results');
 const node=(tag,text,className)=>{const e=document.createElement(tag);e.textContent=text;if(className)e.className=className;return e;};
 function render(){
  const inventory=deviceSongs();entry.textContent='Songs on this device'+(inventory?' · '+inventory.length:'');if(!dialog.open)return;
  results.replaceChildren();if(!inventory){summary.textContent='Offline availability could not be verified. Open the app online and try again.';return;}
  const query=normalizeSearch(search.value),found=inventory.filter(({song})=>!query||normalizeSearch(song.title+' '+meaningfulNumber(song)).includes(query));
  found.sort((a,b)=>(sort.value==='number'?compareNumbers(a.song,b.song):0)||compareAlphabeticalTitles(a.song,b.song));
  summary.textContent=(query?found.length+' of ':'')+inventory.length+' '+(inventory.length===1?'song':'songs');
  for(const {song,state} of found){const row=node('li','');row.dataset.song=song.id;const number=meaningfulNumber(song);row.append(node('strong',song.title),node('span',[meaningfulSource(song),number].filter(Boolean).join(' · '),'song-meta'),node('span',retentionText(state,getLists()),'device-song-retention'));results.append(row);}
  if(!found.length)results.append(node('li',inventory.length?'No saved songs match your search.':'No songs are saved on this device yet. Save a song or a List, or import a file.','empty-library'));
 }
 entry.onclick=async()=>{beforeOpen();dialog.showModal();render();find('device-songs-title').focus();summary.textContent='Checking songs on this device…';await refreshOffline();render();};
 dialog.querySelector('button').onclick=()=>dialog.close();dialog.addEventListener('close',()=>document.getElementById('home-about').focus({preventScroll:true}));
 search.oninput=render;sort.onchange=render;document.addEventListener('offline-state-changed',render);render();refreshOffline();
}
