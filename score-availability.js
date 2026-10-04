// Catalog membership is independent of score availability; missing local data is distinct.
export const isUnavailableScore=song=>song?.availability==='unavailable';
export const canOpenScore=song=>!!song&&!song.missing&&!isUnavailableScore(song)&&!!song.asset;
let dialog,returnFocus;
export function showUnavailableScore(song,origin=document.activeElement){
 if(!isUnavailableScore(song))return false;
 if(!dialog){
  dialog=document.createElement('dialog');dialog.id='score-unavailable-dialog';dialog.className='list-action-dialog';
  dialog.setAttribute('aria-labelledby','score-unavailable-title');dialog.setAttribute('aria-describedby','score-unavailable-song score-unavailable-body');
  dialog.innerHTML='<h2 id="score-unavailable-title">Score unavailable</h2><p id="score-unavailable-song"></p><p id="score-unavailable-body">This hymn is part of Hymns (1985), but a digital score is not currently available in MusicTranspose. It remains listed so the hymnal sequence is complete.</p><button type="button" class="quiet" autofocus>Close</button>';
  document.body.append(dialog);dialog.querySelector('button').onclick=()=>dialog.close();
  dialog.addEventListener('keydown',event=>{if(event.key==='Tab'){event.preventDefault();dialog.querySelector('button').focus();}});
  dialog.addEventListener('close',()=>{if(returnFocus?.isConnected)returnFocus.focus({preventScroll:true});returnFocus=null;});
 }
 dialog.querySelector('#score-unavailable-song').textContent=`${song.songNumber??song.page} · ${song.title}`;
 if(!dialog.open){returnFocus=origin;dialog.showModal();dialog.querySelector('button').focus();}
 return true;
}
