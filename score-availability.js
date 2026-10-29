// Catalog membership is independent of score availability; missing local data is distinct.
export const isUnavailableScore=song=>song?.availability==='unavailable';
export const canOpenScore=song=>!!song&&!song.missing&&!isUnavailableScore(song)&&!!song.asset;
// List membership and favorites do not require a playable asset.
export const canListSong=song=>canOpenScore(song)||!!song&&!song.missing&&isUnavailableScore(song);
let dialog,returnFocus;
export function showUnavailableScore(song,origin=document.activeElement){
 if(!isUnavailableScore(song))return false;
 if(!dialog){
  dialog=document.createElement('dialog');dialog.id='score-unavailable-dialog';dialog.className='list-action-dialog';
  dialog.setAttribute('aria-labelledby','score-unavailable-title');dialog.setAttribute('aria-describedby','score-unavailable-song score-unavailable-body');
  dialog.innerHTML='<div class="score-unavailable-heading"><h2 id="score-unavailable-title">Score unavailable</h2><button type="button" class="quiet" autofocus>Close</button></div><div class="score-unavailable-content" tabindex="0" role="region" aria-label="Restriction and original credits"><p id="score-unavailable-song"></p><p id="score-unavailable-body">This hymn is part of Hymns (1985), but a digital score is not currently available in MusicSlate. It remains listed so the hymnal sequence is complete.</p><dl id="score-unavailable-credits" aria-label="Original hymn credits"></dl><p id="score-official-source" hidden><a target="_blank" rel="noopener noreferrer">Open official Church source (new tab)</a></p></div>';
  document.body.append(dialog);dialog.querySelector('button').onclick=()=>dialog.close();
  dialog.addEventListener('keydown',event=>{if(event.key==='Tab'){event.preventDefault();const stops=[dialog.querySelector('button'),dialog.querySelector('.score-unavailable-content'),...dialog.querySelectorAll('#score-official-source:not([hidden]) a')],index=stops.indexOf(document.activeElement);stops[(index+(event.shiftKey?-1:1)+stops.length)%stops.length].focus();}});
  dialog.addEventListener('close',()=>{if(returnFocus?.isConnected)returnFocus.focus({preventScroll:true});returnFocus=null;});
 }
 dialog.querySelector('#score-unavailable-song').textContent=`${song.songNumber??song.page} · ${song.title}`;
 const notice=song.unavailabilityNotice;
 const source=dialog.querySelector('#score-official-source'),link=source.querySelector('a');
 const official=typeof song.officialUrl==='string'&&song.officialUrl.startsWith('https://www.churchofjesuschrist.org/study/music/hymns-for-home-and-church/');
 source.hidden=!official;if(official)link.href=song.officialUrl;else link.removeAttribute('href');
 dialog.querySelector('#score-unavailable-title').textContent=official?'Official source only':'Score unavailable';
 dialog.querySelector('#score-unavailable-body').textContent=notice?.explanation||'This hymn is part of Hymns (1985), but a digital score is not currently available in MusicSlate. It remains listed so the hymnal sequence is complete.';
 const credits=dialog.querySelector('#score-unavailable-credits');credits.replaceChildren();
 for(const credit of notice?.credits||[]){const label=document.createElement('dt'),value=document.createElement('dd');label.textContent=credit.label;value.textContent=credit.text;credits.append(label,value);}
 credits.hidden=!credits.children.length;dialog.querySelector('.score-unavailable-content').scrollTop=0;
 if(!dialog.open){returnFocus=origin;dialog.showModal();dialog.querySelector('button').focus();}
 return true;
}
