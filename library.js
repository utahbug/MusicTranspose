import {attachReorderHandle} from './list-reorder.js';
import {lyricsIcon} from './icons.js';
import {createViewHistory} from './view-history.js';
import {sourceChoices,matchesSource,compareNumbers,compareAlphabeticalTitles,songForSource} from './library-query.js';
import {lyricIds} from './lyrics-index.js';
import {createFilesView} from './files-view.js';
import {createListsView} from './lists-view.js';
import {songSearchText,normalizeSearch} from './songs.js';
import {songs,supportsLead} from './catalog.js';
const storageKey='music-transpose-library-v1';
const $=id=>document.getElementById(id);
const normalize=s=>s.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLocaleLowerCase();
const collator=new Intl.Collator(undefined,{numeric:true,sensitivity:'base'});
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
 let state={favorites:[],groups:[],recent:[]},filter='all',current=null,libraryScroll=0,globalSort='title',sort='title',source='all',favoritesFirst=false,activeList=null,reordering=false,leadOnly=false;
 const contexts=new Map(),workspaceKey='music-transpose-list-workspace-v1';
 const group=()=>state.groups.find(g=>g.id===activeList);
 try{const saved=JSON.parse(localStorage.getItem(storageKey)||'null');if(saved&&typeof saved==='object'){
  const ids=a=>Array.isArray(a)?[...new Set(a.filter(x=>typeof x==='string'))]:[];
  state.orderingVersion=saved.orderingVersion;state.favorites=ids(saved.favorites);state.recent=ids(saved.recent).slice(0,30);
  state.groups=Array.isArray(saved.groups)?saved.groups.filter(g=>g&&typeof g.id==='string'&&typeof g.name==='string').map(g=>({id:g.id,name:g.name.slice(0,80),songs:ids(g.songs)})):[];
 }}catch{}
 const preferencesKey='music-transpose-library-preferences-v1';
 try{const prefs=JSON.parse(localStorage.getItem(preferencesKey)||'null');if(prefs){favoritesFirst=prefs.favoritesFirst===true;globalSort=prefs.order==='number'?'number':'title';sort=globalSort;if(sourceChoices.some(([id])=>id===prefs.source))source=prefs.source;}}catch{}
 function savePreferences(){if(activeList){remember();persistWorkspace();return;}try{localStorage.setItem(preferencesKey,JSON.stringify({order:globalSort,source,favoritesFirst}));}catch{}}
 function save(){try{localStorage.setItem(storageKey,JSON.stringify(state));return true;}catch{$('library-message').textContent='Browser storage is unavailable. Changes will last only while this page is open.';return false;}}
 // Preserve every existing sequence, including older stores without a version marker.
 if(state.orderingVersion!==1){state.orderingVersion=1;save();}
 const browse=()=>({query:$('library-search').value,source,sort,favoritesFirst,leadOnly,scroll:$('library').hidden?libraryScroll:scrollY});
 function remember(){contexts.set(activeList||'library',browse());}
 function persistWorkspace(){try{localStorage.setItem(workspaceKey,JSON.stringify({activeList,contexts:[...contexts]}));}catch{}}
 function applyContext(context={}){if(!context||typeof context!=='object')context={};source=sourceChoices.some(([id])=>id===context.source)?context.source:'all';sort=activeList?(['manual','title','number'].includes(context.sort)?context.sort:'manual'):(context.sort==='number'?'number':'title');favoritesFirst=context.favoritesFirst===true;leadOnly=context.leadOnly===true;$('library-source').value=source;$('library-search').value=context.query||'';libraryScroll=context.scroll||0;}
 const lists=createListsView({getState:()=>state,save,onLibrary:()=>selectList(null),onSelect:selectList,onChanged:()=>{if(activeList&&!group()){if(!$('lists-view').hidden){activeList=null;reordering=false;applyContext(contexts.get('library'));}else{selectList(null);return;}}render();persistWorkspace();},onAdded:(id,added,saved)=>{selectList(id);sort='manual';source='all';favoritesFirst=false;leadOnly=false;$('library-search').value='';$('library-source').value='all';render();$('library-message').textContent=saved?added.length+' songs added.':'Changes last only while this page is open.';requestAnimationFrame(()=>{const row=$('library-results').querySelector(`[data-song="${CSS.escape(added[0])}"]`);if(row)window.scrollTo({top:scrollY+row.getBoundingClientRect().top-document.querySelector('.library-header-panel').getBoundingClientRect().height-8,behavior:'instant'});row?.querySelector('.song-entry')?.focus({preventScroll:true});libraryScroll=scrollY;remember();persistWorkspace();navigation?.snapshot();});}});
 const files=createFilesView({onLibrary:()=>{showLibrary();$('library-more').focus({preventScroll:true});},onSong:id=>open(id)});
 function returnLabels(){const label=activeList?'Back to list':'Library';$('songs').setAttribute('aria-label',label);$('songs').title=label;}
 function showScore(){blurSearch();files.hide();lists.hide();returnLabels();document.body.classList.remove('library-open');$('library').hidden=true;document.title=current?(songs.find(s=>s.id===current)?.title||'Music')+' · Music Transpose':'MusicTranspose';}
 function showLibrary(){if(isBusy())return;const position=libraryScroll;navigation?.visit({view:'library',list:activeList,song:null});files.hide();lists.hide();document.dispatchEvent(new Event('library-open'));leaveScore?.();document.body.classList.add('library-open');$('library').hidden=false;document.title=(group()?.name||'Library')+' · MusicTranspose';render();window.scrollTo({top:position,behavior:'instant'});libraryScroll=scrollY;remember();persistWorkspace();navigation?.snapshot();focusLibrary();}
 function selectList(id){if(isBusy())return;if(!$('library').hidden)remember();const next=state.groups.some(g=>g.id===id)?id:null;navigation?.visit({view:'library',list:next,song:null});activeList=next;reordering=false;applyContext(contexts.get(activeList||'library')||(activeList?{sort:'manual'}:{sort:globalSort}));showLibrary();remember();persistWorkspace();}
 function open(id,view='normal'){if(isBusy())return;reordering=false;libraryScroll=scrollY;remember();persistWorkspace();loadSong(id,view);}
 function listTools(){const g=group();$('active-list-tools').hidden=!g;$('library').classList.toggle('editing-list',!!g&&reordering);$('library-context').textContent=leadOnly?(g?'List \u00b7 Lead':'Lead sheets'):(g?'List':'Library');$('library-list').title=g?'List: '+g.name:'Lists';$('edit-list-order').textContent=reordering?'Done editing':'Edit order';$('edit-list-order').setAttribute('aria-pressed',String(reordering));$('order-toggle').disabled=reordering;$('library-source').disabled=reordering;$('library-search').disabled=reordering;$('library-clear').disabled=reordering;$('view-favorites').disabled=reordering;$('view-lead-sheets').disabled=reordering;}
 function move(id,to,before=true){const g=group();if(!g||id===to||!g.songs.includes(id)||!g.songs.includes(to))return;g.songs.splice(g.songs.indexOf(id),1);g.songs.splice(g.songs.indexOf(to)+(before?0:1),0,id);const saved=save();render();$('library-message').textContent=saved?'Order saved.':'Changes last only while this page is open.';$('library-results').querySelector(`[data-song="${CSS.escape(id)}"] .reorder-grip`)?.focus({preventScroll:true});}
 function removeSong(id){const g=group();if(!g)return;const i=g.songs.indexOf(id);g.songs=g.songs.filter(x=>x!==id);const saved=save();render();$('library-message').textContent=saved?'Removed from this list. Song remains in the Library.':'Changes last only while this page is open.';const rows=$('library-results').children;(rows[Math.min(i,rows.length-1)]?.querySelector('.song-entry')||$('edit-list-order')).focus({preventScroll:true});}
 $('add-list-songs').onclick=()=>{if(!group())return;remember();persistWorkspace();reordering=false;navigation?.visit({view:'lists',list:activeList,picking:true});lists.pick(activeList);};
 $('edit-list-order').onclick=()=>{reordering=!reordering;if(reordering){leadOnly=false;source='all';sort='manual';favoritesFirst=false;$('library-source').value='all';$('library-search').value='';$('library-message').textContent='Editing the full list in saved order.';}else $('library-message').textContent='';render();};
 $('active-list-options').onclick=()=>{const dialog=$('active-list-dialog');$('active-list-heading').textContent=group()?.name||'List';dialog.showModal();};
 $('close-active-list').onclick=()=>$('active-list-dialog').close();
 $('rename-active-list').onclick=()=>{$('active-list-dialog').close();lists.name(activeList);};
 $('delete-active-list').onclick=()=>{$('active-list-dialog').close();lists.remove(activeList);};
 function refreshLists(){const select=$('library-list');select.replaceChildren(new Option(activeList?'Full Library':'Lists',''),new Option('All Lists','overview'),...state.groups.map(g=>new Option(g.name,g.id)));select.value=activeList||'';select.parentElement.style.width=Math.min(240,select.selectedOptions[0].text.length*7+28)+'px';}
 const more=$('library-more-dialog'),moreButton=$('library-more');
 function closeMore(focus=false){more.hidden=true;moreButton.setAttribute('aria-expanded','false');if(focus)moreButton.focus({preventScroll:true});}
 function placeMore(){if(more.hidden)return;const r=moreButton.getBoundingClientRect();more.style.left=Math.max(8,Math.min(r.right-more.offsetWidth,innerWidth-more.offsetWidth-8))+'px';more.style.top=Math.max(8,Math.min(r.bottom+4,innerHeight-more.offsetHeight-8))+'px';}
 moreButton.onclick=()=>{blurSearch();if(!more.hidden){closeMore();return;}more.hidden=false;moreButton.setAttribute('aria-expanded','true');placeMore();more.querySelector('button').focus({preventScroll:true});};
 document.addEventListener('pointerdown',e=>{if(!more.hidden&&!more.contains(e.target)&&!moreButton.contains(e.target))closeMore();});
 document.addEventListener('keydown',e=>{if(more.hidden)return;if(e.key==='Escape'){e.preventDefault();closeMore(true);}else if(e.key==='Tab')closeMore();else if(['ArrowDown','ArrowUp','Home','End'].includes(e.key)){e.preventDefault();const items=[...more.querySelectorAll('button:not(:disabled)')],i=items.indexOf(document.activeElement);items[e.key==='Home'?0:e.key==='End'?items.length-1:(i+(e.key==='ArrowDown'?1:-1)+items.length)%items.length].focus();}});
 window.addEventListener('resize',placeMore);window.addEventListener('scroll',placeMore,{passive:true});
 $('library-import').onclick=()=>{closeMore();$('add-music').click();};
 $('library-clear').onclick=()=>{leadOnly=false;$('library-search').value='';render();$('library-clear').focus({preventScroll:true});};
 function render(){
  $('library').classList.toggle('lead-filter-active',leadOnly);
  const query=normalizeSearch($('library-search').value);
  const g=group(),pool=g?g.songs.map(id=>songs.find(s=>s.id===id)||{id,title:'Unavailable song',missing:true}):songs;
  let found=pool.filter(s=>(!leadOnly||supportsLead(s))&&(!query||query.split(/\s+/).every(word=>searchText(s).includes(word)))&&matchesSource(s,source)&&(filter==='all'||filter==='favorites'&&state.favorites.includes(s.id)||filter==='recent'&&state.recent.includes(s.id))).map(s=>songForSource(s,source));
  const title=(a,b)=>collator.compare(a.title,b.title);
  if(sort!=='manual'||favoritesFirst)found.sort((a,b)=>(favoritesFirst?Number(state.favorites.includes(b.id))-Number(state.favorites.includes(a.id)):0)||(sort==='manual'?g.songs.indexOf(a.id)-g.songs.indexOf(b.id):0)||(/^\d+[ab]?$/.test(query)?Number(String(b.page).toLowerCase()===query)-Number(String(a.page).toLowerCase()===query):0)||(sort==='number'?(compareNumbers(a,b)||title(a,b)):compareAlphabeticalTitles(a,b)));
  const fragment=document.createDocumentFragment();
  for(const s of found){
   const row=node('div',null,'library-row');row.dataset.song=s.id;
   const favorite=state.favorites.includes(s.id),star=button(favorite?'★':'☆',(favorite?'Remove favorite: ':'Favorite: ')+s.title,()=>{state.favorites=favorite?state.favorites.filter(id=>id!==s.id):[...state.favorites,s.id];save();render();const replacement=$('library-results').querySelector(`[data-song="${s.id}"] .favorite`);(replacement||libraryHeading).focus({preventScroll:true});});star.classList.add('favorite');star.setAttribute('aria-pressed',String(favorite));
   const number=String(s.songNumber??s.page??'').trim(),numberFirst=sort==='number'&&/^\d+[a-z]?$/i.test(number);
   const entry=button('', 'Open '+s.title+(numberFirst?', '+number:''),()=>open(s.id));entry.className='song-entry';entry.append(node('strong',numberFirst?number+' · '+s.title:s.title),node('span',[s.collection,numberFirst?'':s.page,s.scoreType==='pdf'?'PDF score':(s.local||s.transpositionAvailable===false)?'MusicXML · '+s.capability:`${s.tonic} ${s.mode}`].filter(Boolean).join(' · '),'song-meta'));
   if(s.id===current){row.classList.add('current-song');entry.append(node('span','Open · Return to score','current-label'));}
   {const views=node('div',null,'song-view-actions');if(lyricIds.has(s.id)){const lyricsButton=button('','Open lyrics',()=>{if(!isBusy()){reordering=false;libraryScroll=scrollY;remember();persistWorkspace();openLyrics(s.id);}});lyricsButton.innerHTML=lyricsIcon;lyricsButton.setAttribute('aria-label','Lyrics');lyricsButton.title='Lyrics';views.append(lyricsButton);}if(!lyricIds.has(s.id)){const reserved=node('span',null,'lyrics-slot');reserved.setAttribute('aria-hidden','true');views.append(reserved);}row.append(entry,views,star);}
   if(s.missing){for(const b of row.querySelectorAll('button'))b.disabled=true;row.querySelector('.song-meta').textContent='Source unavailable · retained in saved order';}
   if(g&&reordering){const tools=node('div',null,'list-row-tools'),grip=button('⠿','Drag to reorder '+s.title,()=>{});grip.classList.add('reorder-grip');attachReorderHandle(grip,row,$('library-results'),(to,before)=>move(s.id,to,before));const index=g.songs.indexOf(s.id),up=button('↑','Move up: '+s.title,()=>move(s.id,g.songs[index-1],true)),down=button('↓','Move down: '+s.title,()=>move(s.id,g.songs[index+1],false));up.disabled=index===0;down.disabled=index===g.songs.length-1;tools.append(grip,node('span',String(index+1),'list-order-number'),up,down,button('Remove','Remove from list: '+s.title,()=>removeSong(s.id)));row.append(tools);}
   fragment.append(row);
  }
  if(!found.length)fragment.append(node('p',g&&!g.songs.length?'No songs yet. Choose Add songs.':source==='legacy'?'No Legacy songs.':'No songs match. Try another search or source.','empty-library'));
  $('library-results').replaceChildren(fragment);$('library-count').textContent=`${found.length}${g?' / '+g.songs.length:''} ${(g?g.songs.length:found.length)===1?'song':'songs'}`;
  $('order-toggle').replaceChildren(...[...(g?[['manual','Manual order']]:[]),['title','Title'],['number','Song number']].map(([value,label])=>new Option(label,value)));$('order-toggle').value=sort;
  $('library-sort-label').textContent=sort==='manual'?'Order':sort==='number'?'#':'A–Z';
  $('view-lead-sheets').textContent=`Lead sheets (${songs.filter(supportsLead).length})`;$('view-lead-sheets').setAttribute('aria-checked',String(leadOnly));$('library-clear').setAttribute('aria-label',leadOnly?'Clear search and Lead filter':'Clear search');$('library-clear').title=leadOnly?'Clear search and Lead filter':'Clear search';
  $('view-favorites').setAttribute('aria-pressed',String(favoritesFirst));$('view-favorites').setAttribute('aria-checked',String(favoritesFirst));
  $('library-source').parentElement.style.width=Math.min(210,$('library-source').selectedOptions[0].text.length*7+28)+'px';$('library-source').title=sourceChoices.find(([id])=>id===source)?.[1]||'Sources';refreshLists();listTools();if(!$('library').hidden){remember();persistWorkspace();}navigation?.snapshot();

 }
 for(const [value,label] of sourceChoices)$('library-source').append(new Option(({hymnal:'Hymns',children:'Children’s Songs'}[value]||label),value));
 $('library-source').value=source;
 $('library-source').onchange=()=>{source=$('library-source').value;savePreferences();render();};
 $('view-lead-sheets').onclick=()=>{closeMore(true);leadOnly=!leadOnly;render();};
 $('view-favorites').onclick=()=>{closeMore(true);favoritesFirst=!favoritesFirst;filter='all';savePreferences();render();};
 $('order-toggle').onchange=()=>{sort=$('order-toggle').value;if(sort==='manual')favoritesFirst=false;if(!activeList)globalSort=sort;savePreferences();render();};
 $('library-list').onchange=()=>{const id=$('library-list').value;if(id==='overview'){remember();persistWorkspace();blurSearch();navigation?.visit({view:'lists',list:null,picking:false});files.hide();lists.open();}else selectList(id||null);};
 $('view-files').onclick=()=>{closeMore();blurSearch();navigation?.visit({view:'files'});libraryScroll=scrollY;remember();persistWorkspace();lists.hide();files.open();};
 $('library-search').oninput=render;$('songs').onclick=showLibrary;
 document.addEventListener('local-music-changed',()=>{render();lists.render();});
 document.addEventListener('local-music-deleted',e=>{const id=e.detail;state.favorites=state.favorites.filter(x=>x!==id);state.recent=state.recent.filter(x=>x!==id);for(const g of state.groups)g.songs=g.songs.filter(x=>x!==id);if(current===id)current=null;save();});
 document.addEventListener('local-music-memberships',e=>{for(const item of e.detail.memberships){const g=state.groups.find(g=>g.id===item.id);if(g)g.songs=item.checked?[...new Set([...g.songs,e.detail.id])]:g.songs.filter(id=>id!==e.detail.id);}save();});
 function capture(route){if(!$('library').hidden){libraryScroll=scrollY;remember();persistWorkspace();}return {...route,scroll:scrollY,library:{...browse(),activeList,current}};}
 async function restore(route){
  closeMore();for(const d of document.querySelectorAll('dialog[open]'))d.close();blurSearch();reordering=false;
  const context=route.library||{},candidate=Object.hasOwn(context,'activeList')?context.activeList:route.origin?.list??route.list;activeList=state.groups.some(g=>g.id===candidate)?candidate:null;applyContext({...context,sort:context.sort||(activeList?'manual':globalSort)});current=context.current||current;
  if(context.favoritesFirst===undefined&&context.filter==='favorites')favoritesFirst=true;
  if(!activeList)globalSort=sort;
  if(route.view==='score'||route.view==='lyrics'){
   if(songs.some(s=>s.id===route.song)){if(route.view==='lyrics'&&lyricIds.has(route.song))await openLyrics(route.song);else{route={...route,view:'score'};await showScoreView(route.song);}if(!document.body.classList.contains('library-open')){window.scrollTo({top:route.scroll||0,behavior:'instant'});return route;}}
   route={...route,view:'library',list:activeList,song:null,scroll:libraryScroll};
  }
  leaveScore?.();document.dispatchEvent(new Event('library-open'));document.body.classList.add('library-open');files.hide();lists.hide();$('library').hidden=true;
  if(route.view==='lists'&&route.picking&&state.groups.some(g=>g.id===route.list))lists.pick(route.list,false);
  else if(route.view==='lists'&&!route.list)lists.open();
  else if(route.view==='files')files.open();
  else{if(route.view==='lists'){activeList=state.groups.some(g=>g.id===route.list)?route.list:null;sort=activeList?'manual':globalSort;route={...route,view:'library',list:activeList};}$('library').hidden=false;document.title=(group()?.name||'Library')+' · MusicTranspose';render();focusLibrary();}
  window.scrollTo({top:route.scroll||0,behavior:'instant'});return route;
 }
 // Workspace preferences supplement, never rewrite, saved list membership.
 try{const saved=JSON.parse(localStorage.getItem(workspaceKey)||'null');if(saved){for(const item of saved.contexts||[])if(Array.isArray(item)&&item.length===2)contexts.set(item[0],item[1]);activeList=state.groups.some(g=>g.id===saved.activeList)?saved.activeList:null;if(contexts.has(activeList||'library'))applyContext(contexts.get(activeList||'library'));}}catch{}
 const startupScroll=libraryScroll;render();if(!history.state?.musicTransposeNavigation){window.scrollTo({top:startupScroll,behavior:'instant'});libraryScroll=scrollY;remember();persistWorkspace();}
 navigation=createViewHistory({capture,restore,isBusy,onTravel:(next,previous)=>{if(!['score','lyrics'].includes(next.view)||next.song!==previous.song)stopPlayback?.();}});
 return {startHistory:()=>navigation.start(),navigating(view,id){const previous=navigation.current;navigation.visit({view,song:id,origin:['score','lyrics'].includes(previous.view)?previous.origin:{view:previous.view,list:activeList,scroll:scrollY}});},showScore,showLibrary,opened(id){returnLabels();$('library-message').textContent='';current=id;state.recent=[id,...state.recent.filter(x=>x!==id)].slice(0,30);save();render();},failed(){leaveScore?.();navigation.replace({view:'library',list:activeList,song:null});files.hide();lists.hide();document.body.classList.add('library-open');$('library').hidden=false;document.title='MusicTranspose · Library';render();$('library-message').textContent='Unable to open this score. Try again online or choose another song.';}};
}
