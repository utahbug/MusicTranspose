import {lyricsIcon} from './icons.js';
import {createViewHistory} from './view-history.js';
import {sourceChoices,matchesSource,compareNumbers,compareAlphabeticalTitles,songForSource} from './library-query.js';
import {lyricIds} from './lyrics-index.js';
import {createFilesView} from './files-view.js';
import {createListsView} from './lists-view.js';
import {songSearchText,normalizeSearch} from './songs.js';
import {songs} from './catalog.js';
const storageKey='music-transpose-library-v1';
const $=id=>document.getElementById(id);
const normalize=s=>s.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLocaleLowerCase();
const collator=new Intl.Collator(undefined,{numeric:true,sensitivity:'base'});
// Presentation only: native selects stay accessible, sized to their selected label.
const textMeasure=document.createElement('canvas').getContext('2d');
function fitLibrarySelects(){for(const id of ['library-source']){const select=$(id);textMeasure.font=getComputedStyle(select).font;select.style.width=Math.ceil(textMeasure.measureText(select.selectedOptions[0]?.text||'').width+28)+'px';}}
const searchText=s=>songSearchText(s)+' '+normalizeSearch(s.originalFilename||'');
function node(tag,text,className){const e=document.createElement(tag);if(text)e.textContent=text;if(className)e.className=className;return e;}
function button(text,label,action){const b=node('button',text,'quiet');b.type='button';if(label)b.setAttribute('aria-label',label);b.onclick=action;return b;}
export function initLibrary({loadSong,openLyrics,isBusy,leaveScore,stopPlayback,showScoreView}){
 let navigation;
 // Navigation restores browsing context, never text-entry intent.
 const libraryHeading=document.querySelector('.library-heading h1');
 libraryHeading.tabIndex=-1;
 function blurSearch(){if(document.activeElement===$('library-search'))$('library-search').blur();}
 function focusLibrary(){blurSearch();libraryHeading.focus({preventScroll:true});}
 blurSearch();
 window.addEventListener('pagehide',blurSearch);
 window.addEventListener('pageshow',event=>{if(event.persisted)blurSearch();});
 let state={favorites:[],groups:[],recent:[]},filter='all',current=null,libraryScroll=0,globalSort='title',sort='title',source='all',fromList=false;
 try{const saved=JSON.parse(localStorage.getItem(storageKey)||'null');if(saved&&typeof saved==='object'){
  const ids=a=>Array.isArray(a)?[...new Set(a.filter(x=>typeof x==='string'))]:[];
  state.orderingVersion=saved.orderingVersion;state.favorites=ids(saved.favorites);state.recent=ids(saved.recent).slice(0,30);
  state.groups=Array.isArray(saved.groups)?saved.groups.filter(g=>g&&typeof g.id==='string'&&typeof g.name==='string').map(g=>({id:g.id,name:g.name.slice(0,80),songs:ids(g.songs)})):[];
 }}catch{}
 const preferencesKey='music-transpose-library-preferences-v1';
 try{const prefs=JSON.parse(localStorage.getItem(preferencesKey)||'null');if(prefs){globalSort=prefs.order==='number'?'number':'title';sort=globalSort;if(sourceChoices.some(([id])=>id===prefs.source))source=prefs.source;}}catch{}
 function savePreferences(){try{localStorage.setItem(preferencesKey,JSON.stringify({order:globalSort,source}));}catch{}}
 function save(){try{localStorage.setItem(storageKey,JSON.stringify(state));return true;}catch{$('library-message').textContent='Browser storage is unavailable. Changes will last only while this page is open.';return false;}}
 // Previous list views defaulted to Title. Migrate once without dropping unknown IDs.
 if(state.orderingVersion!==1){
  const titles=new Map(songs.map(s=>[s.id,s.title]));
  const initial=(a,b)=>collator.compare(titles.get(a)||a,titles.get(b)||b);
  state.favorites.sort(initial);for(const g of state.groups)g.songs.sort(initial);
  state.orderingVersion=1;save();
 }
 const lists=createListsView({onNavigate:list=>navigation?.visit({view:'lists',list}),getState:()=>state,save,onLibrary:()=>{fromList=false;showLibrary();},onSong:(id,lyrics)=>{if(isBusy())return;fromList=true;if(lyrics)openLyrics(id);else loadSong(id);}});
 const files=createFilesView({onLibrary:()=>{fromList=false;showLibrary();$('view-files').focus({preventScroll:true});},onSong:id=>open(id)});
 function returnLabels(){const label=fromList?'Back to list':'Library';$('songs').setAttribute('aria-label',label);$('songs').title=label;const back=document.querySelector('.lyrics-top > button');if(back){back.textContent=label;back.setAttribute('aria-label',fromList?'Back to list':'Return to Library');back.title=back.getAttribute('aria-label');}}
 function showScore(){blurSearch();files.hide();lists.hide();returnLabels();document.body.classList.remove('library-open');$('library').hidden=true;document.title=current?songs.find(s=>s.id===current).title+' · Music Transpose':'MusicTranspose';}
 function showLibrary(){if(isBusy())return;navigation?.visit(fromList?{view:'lists',list:lists.active}:{view:'library',song:null});files.hide();document.dispatchEvent(new Event('library-open'));leaveScore?.();document.body.classList.add('library-open');$('library').hidden=false;if(fromList){lists.open();return;}lists.hide();document.title='MusicTranspose · Library';render();window.scrollTo({top:libraryScroll,behavior:'instant'});focusLibrary();}
 function open(id){if(isBusy())return;fromList=false;libraryScroll=scrollY;loadSong(id);}
 function render(){
  const query=normalizeSearch($('library-search').value);
  let found=songs.filter(s=>(!query||query.split(/\s+/).every(word=>searchText(s).includes(word)))&&matchesSource(s,source)&&(filter==='all'||filter==='favorites'&&state.favorites.includes(s.id)||filter==='recent'&&state.recent.includes(s.id))).map(s=>songForSource(s,source));
  const title=(a,b)=>collator.compare(a.title,b.title);
  found.sort((a,b)=>(/^\d+[ab]?$/.test(query)?Number(String(b.page).toLowerCase()===query)-Number(String(a.page).toLowerCase()===query):0)||(sort==='number'?(compareNumbers(a,b)||title(a,b)):compareAlphabeticalTitles(a,b)));
  const fragment=document.createDocumentFragment();
  for(const s of found){
   const row=node('div',null,'library-row');row.dataset.song=s.id;
   const favorite=state.favorites.includes(s.id),star=button(favorite?'★':'☆',(favorite?'Remove favorite: ':'Favorite: ')+s.title,()=>{state.favorites=favorite?state.favorites.filter(id=>id!==s.id):[...state.favorites,s.id];save();render();const replacement=$('library-results').querySelector(`[data-song="${s.id}"] .favorite`);(replacement||libraryHeading).focus({preventScroll:true});});star.classList.add('favorite');star.setAttribute('aria-pressed',String(favorite));
   const number=String(s.songNumber??s.page??'').trim(),numberFirst=sort==='number'&&/^\d+[a-z]?$/i.test(number);
   const entry=button('', 'Open '+s.title+(numberFirst?', '+number:''),()=>open(s.id));entry.className='song-entry';entry.append(node('strong',numberFirst?number+' · '+s.title:s.title),node('span',[s.collection,numberFirst?'':s.page,s.scoreType==='pdf'?'PDF score':(s.local||s.transpositionAvailable===false)?'MusicXML · '+s.capability:`${s.tonic} ${s.mode}`].filter(Boolean).join(' · '),'song-meta'));
   if(s.id===current){row.classList.add('current-song');entry.append(node('span','Open · Return to score','current-label'));}
   {const views=node('div',null,'song-view-actions');const scoreButton=button('♫','Open score: '+s.title,()=>open(s.id));scoreButton.title='Open score';views.append(scoreButton);if(lyricIds.has(s.id)){const lyricsButton=button('','Open lyrics',()=>{if(!isBusy()){fromList=false;libraryScroll=scrollY;openLyrics(s.id);}});lyricsButton.innerHTML=lyricsIcon;lyricsButton.setAttribute('aria-label','Lyrics');lyricsButton.title='Lyrics';views.append(lyricsButton);}if(!lyricIds.has(s.id)){const reserved=node('span',null,'lyrics-slot');reserved.setAttribute('aria-hidden','true');views.append(reserved);}if(s.local){const edit=button('✎','Edit local music: '+s.title,()=>{blurSearch();document.dispatchEvent(new CustomEvent('edit-local-music',{detail:s.id}));});views.append(edit);}row.append(star,entry,views);}
   fragment.append(row);
  }
  if(!found.length)fragment.append(node('p',source==='legacy'?'No Legacy songs.':'No songs match. Try another search or source.','empty-library'));
  $('library-results').replaceChildren(fragment);$('library-count').textContent=`${found.length} ${found.length===1?'song':'songs'}`;
  $('order-toggle').textContent=sort==='number'?'123':'A–Z';
  $('order-toggle').setAttribute('aria-label',sort==='number'?'Sort numerically. Switch to alphabetical order.':'Sort alphabetically. Switch to numeric order.');
  $('view-favorites').setAttribute('aria-pressed',String(filter==='favorites'));
  fitLibrarySelects();navigation?.snapshot();

 }
 for(const [value,label] of sourceChoices)$('library-source').append(new Option(label,value));
 $('library-source').value=source;
 $('library-source').onchange=()=>{source=$('library-source').value;savePreferences();render();};
 $('view-favorites').onclick=()=>{filter=filter==='favorites'?'all':'favorites';render();};
 $('order-toggle').onclick=()=>{globalSort=sort=sort==='number'?'title':'number';savePreferences();render();};
 $('manage-lists').onclick=()=>{blurSearch();navigation?.visit({view:'lists',list:lists.active});files.hide();fromList=true;lists.open();};
 $('view-files').onclick=()=>{blurSearch();navigation?.visit({view:'files'});fromList=false;libraryScroll=scrollY;lists.hide();files.open();};
 $('library-search').oninput=render;$('songs').onclick=showLibrary;
 document.addEventListener('local-music-changed',()=>{render();lists.render();});
 document.addEventListener('local-music-deleted',e=>{const id=e.detail;state.favorites=state.favorites.filter(x=>x!==id);state.recent=state.recent.filter(x=>x!==id);for(const g of state.groups)g.songs=g.songs.filter(x=>x!==id);if(current===id)current=null;save();});
 document.addEventListener('local-music-memberships',e=>{for(const item of e.detail.memberships){const g=state.groups.find(g=>g.id===item.id);if(g)g.songs=item.checked?[...new Set([...g.songs,e.detail.id])]:g.songs.filter(id=>id!==e.detail.id);}save();});
 function capture(route){return {...route,scroll:scrollY,library:{query:$('library-search').value,source,filter,sort,scroll:$('library').hidden?libraryScroll:scrollY}};}
 async function restore(route){
  for(const d of document.querySelectorAll('dialog[open]'))d.close();
  blurSearch();
  const context=route.library||{};
  source=sourceChoices.some(([id])=>id===context.source)?context.source:source;
  filter=['all','favorites','recent'].includes(context.filter)?context.filter:'all';
  globalSort=sort=context.sort==='number'?'number':'title';
  $('library-source').value=source;$('library-search').value=context.query||'';libraryScroll=context.scroll||0;
  savePreferences();render();
  if(route.view==='score'||route.view==='lyrics'){
   if(!songs.some(s=>s.id===route.song))route={...route,view:'library',song:null,scroll:libraryScroll};
   else{
    fromList=route.origin?.view==='lists';
    if(fromList)lists.restore(route.origin.list,route.origin.scroll||0,false);
    if(route.view==='lyrics'&&lyricIds.has(route.song))await openLyrics(route.song);
    else{route={...route,view:'score'};await showScoreView(route.song);}
    if(!document.body.classList.contains('library-open')){window.scrollTo({top:route.scroll||0,behavior:'instant'});return route;}
    route={...route,view:'library',song:null,scroll:libraryScroll};
   }
  }
  leaveScore?.();document.dispatchEvent(new Event('library-open'));document.body.classList.add('library-open');
  files.hide();lists.hide();$('library').hidden=true;fromList=route.view==='lists';
  if(route.view==='lists'){lists.restore(route.list,route.scroll||0);route={...route,list:lists.active};}
  else if(route.view==='files')files.open();
  else{$('library').hidden=false;document.title='MusicTranspose · Library';render();focusLibrary();}
  window.scrollTo({top:route.scroll||0,behavior:'instant'});return route;
 }
 render();
 navigation=createViewHistory({capture,restore,isBusy,onTravel:(next,previous)=>{if(!['score','lyrics'].includes(next.view)||next.song!==previous.song)stopPlayback?.();}});
 return {startHistory:()=>navigation.start(),navigating(view,id){const previous=navigation.current;navigation.visit({view,song:id,origin:['score','lyrics'].includes(previous.view)?previous.origin:{view:previous.view,list:lists.active,scroll:scrollY}});},showScore,showLibrary,opened(id){returnLabels();$('library-message').textContent='';current=id;state.recent=[id,...state.recent.filter(x=>x!==id)].slice(0,30);save();render();},failed(){leaveScore?.();navigation.replace({view:'library',song:null});files.hide();lists.hide();fromList=false;document.body.classList.add('library-open');$('library').hidden=false;document.title='MusicTranspose · Library';render();$('library-message').textContent='Unable to open this score. Try again online or choose another song.';}};
}
