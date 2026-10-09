import {createBulkRemoval,ownershipKey,individuallyRemovable} from './offline-bulk.js';
import {songs} from './catalog.js';
import {offlineSongState,offlineSummary,refreshOffline,removeOfflineSong} from './offline-manager.js';
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
 dialog.innerHTML=`<div class="dialog-heading"><h2 id="device-songs-title" tabindex="-1">Songs on this device</h2><button type="button" class="close" aria-label="Return to previous workspace">×</button></div>
 <div class="device-songs-body"><p id="device-songs-summary" role="status"></p><div class="device-songs-controls"><label>Search<input id="device-songs-search" type="search" placeholder="Title or song number"></label><label>Sort by<select id="device-songs-sort"><option value="title">Title (A–Z)</option><option value="number">Song number</option></select></label></div>
 <p class="setting-note">Only verified saves and imported files are listed. Removing individual saves keeps songs required by offline Lists. Imported files are managed in Files.</p>
 <section id="device-songs-review" hidden aria-labelledby="device-songs-review-title"><h3 id="device-songs-review-title" tabindex="-1">Review removal</h3><p></p></section>
 <section id="device-songs-report" hidden aria-labelledby="device-songs-report-title"><h3 id="device-songs-report-title" tabindex="-1">Removal results</h3><ul></ul></section>
 <ul id="device-songs-results" aria-label="Songs on this device"></ul></div>
 <div class="device-songs-actions"><p id="device-songs-progress" role="status" aria-live="polite" aria-atomic="true"></p><div class="device-songs-buttons">
 <button id="device-songs-select" type="button" class="quiet">Select</button><button id="device-songs-all" type="button" class="quiet">Select all shown</button><button id="device-songs-clear" type="button" class="quiet">Clear selection</button><button id="device-songs-cancel" type="button" class="quiet">Cancel</button>
 <button id="device-songs-remove" type="button" class="dialog-primary"></button><button id="device-songs-confirm" type="button" class="dialog-primary">Confirm removal</button><button id="device-songs-back" type="button" class="quiet">Back to selection</button><button id="device-songs-retry" type="button" class="dialog-primary">Review retry</button><button id="device-songs-stop" type="button" class="quiet">Stop after current song</button></div></div>`;
 document.body.append(dialog);const find=id=>dialog.querySelector('#device-songs-'+id),search=find('search'),sort=find('sort'),summary=find('summary'),results=find('results');
 const node=(tag,text,className)=>{const e=document.createElement(tag);e.textContent=text;if(className)e.className=className;return e;};
 let mode=false,checking=false,plan=null,report=null,message='',selected=new Map(),shown=[],retry=[];
 const bulk=createBulkRemoval({refresh:refreshOffline,summary:offlineSummary,remove:removeOfflineSong,changed:update=>{if(update.message)message=update.message;render();}});
 const locked=()=>checking||bulk.busy;
 function render(){
  const inventory=deviceSongs();entry.textContent='Songs on this device'+(inventory?' · '+inventory.length:'');if(!dialog.open)return;
  const focusId=document.activeElement?.dataset?.selectSong;
  results.replaceChildren();const query=normalizeSearch(search.value);shown=(inventory||[]).filter(({song})=>!query||normalizeSearch(song.title+' '+meaningfulNumber(song)).includes(query));
  shown.sort((a,b)=>(sort.value==='number'?compareNumbers(a.song,b.song):0)||compareAlphabeticalTitles(a.song,b.song));
  summary.textContent=inventory?(query?shown.length+' of ':'')+inventory.length+' '+(inventory.length===1?'song':'songs'):'Offline availability could not be verified. Open the app online and try again.';
  for(const {song,state} of shown){
   const row=node('li','');row.dataset.song=song.id;const number=meaningfulNumber(song),title=node('strong',song.title);
   if(mode&&individuallyRemovable(song,state)){
    const label=node('label','','device-song-select'),box=document.createElement('input');box.type='checkbox';box.dataset.selectSong=song.id;box.checked=selected.has(song.id);box.disabled=locked()||!!plan;box.setAttribute('aria-label','Select '+song.title+' for individual save removal');
    box.onchange=()=>{if(box.checked)selected.set(song.id,{song,key:ownershipKey(state)});else selected.delete(song.id);plan=null;message='';render();};label.append(box,title);row.append(label);
   }else row.append(title);
   row.append(node('span',[meaningfulSource(song),number].filter(Boolean).join(' · '),'song-meta'),node('span',retentionText(state,getLists()),'device-song-retention'));
   if(state.local)row.append(node('span','Imported file — excluded from offline removal.','device-song-protection'));
   else if(state.lists?.length)row.append(node('span',state.individual?'Removing the individual save keeps this song available through its offline Lists.':'Kept by an offline List — no individual save to remove.','device-song-protection'));
   results.append(row);
  }
  if(inventory&&!shown.length)results.append(node('li',inventory.length?'No saved songs match your search.':'No songs are saved on this device yet. Save a song or a List, or import a file.','empty-library'));
  if(focusId)for(const box of results.querySelectorAll('input'))if(box.dataset.selectSong===focusId)box.focus({preventScroll:true});
  find('review').hidden=!plan;
  if(plan){const releases=plan.filter(i=>i.action==='release'),kept=releases.filter(i=>i.state.lists?.length),cleanup=plan.filter(i=>i.action==='cleanup').length,skipped=plan.filter(i=>i.action==='skip').length,changes=plan.filter(i=>i.changed).length;
   find('review').querySelector('p').textContent=`${releases.length} individual saves can be removed. ${kept.length} will remain available because offline Lists require them. ${releases.length-kept.length} will no longer have an offline save.`+(cleanup?` Retry unused saved-cache cleanup for ${cleanup} previously attempted songs; no new individual saves will be removed by cleanup retries.`:'')+(skipped?` ${skipped} selections are protected or no longer saved individually and will be skipped.`:'')+(changes?` Ownership changed for ${changes} selections; these refreshed counts require confirmation.`:'')+' Cached bytes are not guaranteed to be reclaimed.';
  }
  find('report').hidden=!report;
  if(report){const list=find('report').querySelector('ul');list.replaceChildren();for(const item of report.outcomes)list.append(node('li',item.song.title+': '+item.detail));if(report.remaining.length)list.append(node('li',report.remaining.length+' songs not attempted. Review retry to continue.'));}
  const hidden=[...selected.keys()].filter(id=>!shown.some(i=>i.song.id===id)).length;
  find('progress').textContent=message||(mode?selected.size+' selected'+(hidden?' ('+hidden+' hidden by search or no longer listed)':'')+'. Select all shown adds only eligible search results.':report?'Review the results above.':'');
  const show=(id,visible,disabled=false)=>{const button=find(id);button.hidden=!visible;button.disabled=disabled;};
  show('select',!mode&&!plan&&!locked(),!inventory||!inventory.some(i=>individuallyRemovable(i.song,i.state)));
  show('all',mode&&!plan&&!locked(),!shown.some(i=>individuallyRemovable(i.song,i.state)));show('clear',mode&&!plan&&!locked(),!selected.size);show('cancel',mode&&!locked());show('remove',mode&&!plan&&!locked(),!selected.size||!inventory);find('remove').textContent='Remove '+selected.size+' from device';
  show('confirm',!!plan&&!locked(),!plan?.some(i=>i.action!=='skip'));show('back',!!plan&&!locked());show('retry',!mode&&!plan&&!locked()&&retry.length>0);show('stop',bulk.busy);dialog.dataset.busy=String(locked());
 }
 async function review(items){if(locked())return;checking=true;message='Refreshing ownership for confirmation…';render();try{plan=await bulk.review(items);message='Review the refreshed removal details before confirming.';}catch(error){message=error.message;}finally{checking=false;render();if(plan&&dialog.open)find('review-title').focus();}}
 find('select').onclick=()=>{mode=true;report=null;message='';render();find('all').focus();};
 find('all').onclick=()=>{for(const {song,state} of shown)if(individuallyRemovable(song,state)&&!selected.has(song.id))selected.set(song.id,{song,key:ownershipKey(state)});message='';render();};
 find('clear').onclick=()=>{selected.clear();message='';render();};
 find('cancel').onclick=()=>{selected.clear();mode=false;plan=null;message='Selection cancelled. No removal started.';render();find('select').focus();};
 find('back').onclick=()=>{plan=null;mode=true;message='';render();find('all').focus();};
 find('remove').onclick=()=>review([...selected.values()]);find('retry').onclick=()=>review(retry);
 find('confirm').onclick=async()=>{if(locked()||!plan)return;const confirmed=plan;plan=null;checking=true;render();try{const result=await bulk.run(confirmed);if(result?.review){plan=result.review;message='Ownership changed since review. Check the new counts and confirm again.';}else if(result){report=result;retry=[...new Map([...result.outcomes.filter(i=>['failed','uncertain','unverified','skipped'].includes(i.status)),...result.remaining].map(i=>[i.song.id,i])).values()];selected.clear();mode=false;const released=result.outcomes.filter(i=>i.status==='released'),kept=released.filter(i=>i.protected).length,uncertain=result.outcomes.filter(i=>['failed','uncertain'].includes(i.status)).length,skipped=result.outcomes.filter(i=>['unverified','skipped'].includes(i.status)).length,cleaned=result.outcomes.filter(i=>i.status==='cleaned').length;message=`${released.length} individual saves removed; ${kept} kept by offline Lists. ${cleaned} cleanup retries completed. ${skipped} skipped or unverified; ${result.remaining.length} not attempted.`+(uncertain?` ${uncertain} removal failed or timed out; cleanup may be incomplete. Review retry for a fresh check.`:'');}}catch(error){plan=confirmed;message=error.message;}finally{checking=false;render();if(dialog.open)(plan?find('review-title'):find('report-title')).focus();}};
 find('stop').onclick=()=>bulk.stop();
 entry.onclick=async()=>{beforeOpen();dialog.showModal();render();find('title').focus();await refreshOffline();render();};
 dialog.querySelector('.close').onclick=()=>dialog.close();dialog.addEventListener('close',()=>{if(bulk.busy)bulk.stop();if(!locked()){mode=false;plan=null;selected.clear();}document.getElementById('home-about').focus({preventScroll:true});});
 search.oninput=render;sort.onchange=render;document.addEventListener('offline-state-changed',render);render();refreshOffline();
}
