import {createTextsView} from './texts-view.js';
import {initializeTextItems,textItem} from './list-items.js';
import {offlineSongState,offlineBadge,refreshOffline,reconcileOfflineLists} from './offline-manager.js';
import {initLibraryTheme} from './library-theme.js';
import {installLibraryQuickAccess} from './library-quick-access.js';
import {canOpenScore,isUnavailableScore,showUnavailableScore} from './score-availability.js';
import {favoriteIcon,editIcon,orderIcon,listsIcon,filesIcon,textIcon} from './icons.js';
import {beginLibrarySession} from './library-session.js';
import {initOfflineMusic} from './offline-music.js';
import {initHomeScreen} from './home-screen.js';
import {createSongSearch,normalizeSearchFields,readSearchPreferences,searchPreferenceKey} from './library-search.js';
import {attachReorderHandle} from './list-reorder.js';
import {createViewHistory} from './view-history.js';
import {sourceChoices,normalizeSource,matchesSource,isFileSong,compareNumbers,compareAlphabeticalTitles,songForSource} from './library-query.js';
import {lyricIds} from './lyrics-index.js';
import {createFilesView} from './files-view.js';
import {createListsView} from './lists-view.js';
import {normalizeSearch} from './songs.js';
import {songs} from './catalog.js';
const storageKey='music-transpose-library-v1';
const $=id=>document.getElementById(id);
const normalize=s=>s.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLocaleLowerCase();
const collator=new Intl.Collator(undefined,{numeric:true,sensitivity:'base'});

function node(tag,text,className){const e=document.createElement(tag);if(text)e.textContent=text;if(className)e.className=className;return e;}
function button(text,label,action){const b=node('button',text,'quiet');b.type='button';if(label)b.setAttribute('aria-label',label);b.onclick=action;return b;}
export function initLibrary({loadSong,openLyrics,isBusy,leaveScore,cancelPendingSelection,stopPlayback,showScoreView}){
 const freshLaunch=beginLibrarySession();
 initLibraryTheme();
 installLibraryQuickAccess();
 for(const [id,icon] of [['library-quick-lists',listsIcon],['library-quick-files',filesIcon]])$(id).insertAdjacentHTML('afterbegin',icon);
 for(const id of ['files-library','lists-library'])$(id).innerHTML=$('songs').innerHTML;
 $('lists-library').onclick=showHome;
 for(const [workspace,destination,icon,open] of [['lists','Files',filesIcon,showFiles],['files','Lists',listsIcon,showLists]]){
  const quick=button('',destination,open);quick.id=workspace+'-quick-'+destination.toLowerCase();quick.classList.add('workspace-sibling');quick.title=destination;quick.setAttribute('aria-controls',destination.toLowerCase()+'-view');quick.innerHTML=icon;$(workspace+'-library').after(quick);
 }
 const scoreLists=button('','Lists',()=>{const id=originatingList();showLists(id,songSet?.origin==='lists');});scoreLists.id='score-lists';scoreLists.title='Lists';scoreLists.hidden=true;scoreLists.innerHTML=listsIcon;$('songs').after(scoreLists);
 let navigation,orderedSongs=[],songSet=null,pendingSongSet=null,restoringSongSet=false;
 const search=createSongSearch();let enabledFields=normalizeSearchFields(),searchLoading=true,searchError='';
 try{enabledFields=readSearchPreferences(localStorage);}catch{}
 const fieldControls=[...document.querySelectorAll('[data-search-field]')],options=$('library-search-options'),fieldPanel=$('library-search-fields');
 function closeSearchOptions(focus=false){fieldPanel.classList.remove('open');options.setAttribute('aria-expanded','false');if(focus)options.focus();}
 options.onclick=()=>{const open=options.getAttribute('aria-expanded')!=='true';closeSource();closeMore();fieldPanel.classList.toggle('open',open);options.setAttribute('aria-expanded',String(open));if(open)fieldControls[0].focus();};
 document.addEventListener('keydown',e=>{if(e.key==='Escape'&&options.getAttribute('aria-expanded')==='true'){e.preventDefault();closeSearchOptions(true);}});
 document.addEventListener('pointerdown',e=>{if(!fieldPanel.contains(e.target)&&!options.contains(e.target))closeSearchOptions();});
 fieldPanel.addEventListener('focusout',e=>{if(e.relatedTarget&&!fieldPanel.contains(e.relatedTarget)&&e.relatedTarget!==options)closeSearchOptions();});
 for(const control of fieldControls)control.onchange=()=>{const selected=fieldControls.filter(e=>e.checked).map(e=>e.dataset.searchField);if(!selected.length){control.checked=true;$('library-search-status').textContent='Keep at least one search field enabled.';return;}enabledFields=selected;try{localStorage.setItem(searchPreferenceKey,JSON.stringify(enabledFields));}catch{}render();};
 // Navigation restores browsing context, never text-entry intent.
 const libraryHeading=document.querySelector('.library-heading .header-home');
 function blurSearch(){if(document.activeElement===$('library-search'))$('library-search').blur();}
 function focusLibrary(){blurSearch();libraryHeading.focus({preventScroll:true});}
 blurSearch();
 window.addEventListener('pagehide',blurSearch);
 window.addEventListener('pageshow',event=>{if(event.persisted)blurSearch();});
 let state={favorites:[],groups:[],recent:[]},favoritesOnly=false,savedOnly=false,current=null,libraryScroll=0,globalSort='title',sort='title',source='all',activeList=null,reordering=false;
 const contexts=new Map(),workspaceKey='music-transpose-list-workspace-v1';
 const searchEpochKey='music-transpose-search-epoch-v1';let searchEpoch=0;
 try{searchEpoch=Number(sessionStorage.getItem(searchEpochKey))||0;}catch{}
 function clearLeavingSearch(snapshot=true){
  if($('library').hidden)return;
  // Song IDs are captured independently before this invalidates old query snapshots.
  $('library-search').value='';$('library-clear').hidden=true;searchEpoch++;
  try{sessionStorage.setItem(searchEpochKey,String(searchEpoch));}catch{}
  for(const [id,context] of contexts)contexts.set(id,{...context,query:''});
  remember();persistWorkspace();if(snapshot)navigation?.snapshot();
 }
 const group=()=>state.groups.find(g=>g.id===activeList);
 try{const saved=JSON.parse(localStorage.getItem(storageKey)||'null');if(saved&&typeof saved==='object'){
  const ids=a=>Array.isArray(a)?[...new Set(a.filter(x=>typeof x==='string'))]:[];
  state.textItems=saved.textItems;state.orderingVersion=saved.orderingVersion;state.favorites=ids(saved.favorites);state.recent=ids(saved.recent).slice(0,30);
  state.groups=Array.isArray(saved.groups)?saved.groups.filter(g=>g&&typeof g.id==='string'&&typeof g.name==='string').map(g=>({...g,id:g.id,name:g.name.slice(0,80),songs:ids(g.songs),description:typeof g.description==='string'?g.description.slice(0,2000):'',displayNames:Object.fromEntries(Object.entries(g.displayNames||{}).filter(([id,value])=>ids(g.songs).includes(id)&&typeof value==='string'&&value.trim()).map(([id,value])=>[id,value.trim().slice(0,200)]))})):[];
 }}catch{}
 const textMigrated=initializeTextItems(state);
 const preferencesKey='music-transpose-library-preferences-v1';
 try{const prefs=JSON.parse(localStorage.getItem(preferencesKey)||'null');if(prefs){globalSort=prefs.order==='number'?'number':'title';sort=globalSort;source='all';}}catch{}
 function savePreferences(){if(activeList){remember();persistWorkspace();return;}try{localStorage.setItem(preferencesKey,JSON.stringify({order:globalSort}));}catch{}}
 function save(){try{localStorage.setItem(storageKey,JSON.stringify(state));reconcileOfflineLists(state.groups);return true;}catch{$('library-message').textContent='Browser storage is unavailable. Changes will last only while this page is open.';return false;}}
 // Preserve every existing sequence, including older stores without a version marker.
 if(state.orderingVersion!==1||textMigrated){state.orderingVersion=1;save();}
 const browse=()=>({query:$('library-search').value,source,sort,searchFields:[...enabledFields],searchFieldsVersion:2,favoritesOnly,savedOnly,scroll:($('library').hidden?libraryScroll:scrollY)});
 // Filters travel with score history, but remain session-only workspace preferences.

 function remember(){contexts.set(activeList||'library',browse());}
 function persistWorkspace(){try{sessionStorage.setItem(workspaceKey,JSON.stringify({activeList,contexts:[...contexts]}));}catch{}}
 function applyContext(context={}){if(!context||typeof context!=='object')context={};source=activeList?'all':normalizeSource(context.source);sort=activeList?(['manual','title','number'].includes(context.sort)?context.sort:'manual'):(context.sort==='number'?'number':'title');$('library-search').value=context.query||'';libraryScroll=context.scroll||0;favoritesOnly=!!context.favoritesOnly;savedOnly=!!context.savedOnly;if(context.searchFieldsVersion===2)enabledFields=normalizeSearchFields(context.searchFields);}
 const lists=createListsView({onDeleteText:id=>texts.deleteItem(id),freshLaunch,getState:()=>state,save,onPick:id=>{navigation?.visit({view:'lists',list:id,picking:true,workspace:true});lists.pick(id);},onSong:(list,id,ids)=>{pendingSongSet={ids:[...ids],origin:'lists',list};open(id);},onLibrary:()=>navigation?.current.picking?selectList(null):showLibrary(),onSelect:id=>navigation?.current.workspace?showLists():selectList(id),onChanged:()=>{if(activeList&&!group()){if(!$('lists-view').hidden){activeList=null;reordering=false;applyContext(contexts.get('library'));}else{selectList(null);return;}}render();persistWorkspace();},onAdded:(id,added,saved)=>{if(navigation?.current.workspace){showLists();lists.finishAdded(id,added);navigation?.snapshot();return;}selectList(id);sort='manual';source='all';$('library-search').value='';render();$('library-message').textContent=saved?added.length+' songs added.':'Changes last only while this page is open.';requestAnimationFrame(()=>{const row=$('library-results').querySelector(`[data-song="${CSS.escape(added[0])}"]`);if(row)window.scrollTo({top:scrollY+row.getBoundingClientRect().top-document.querySelector('.library-header-panel').getBoundingClientRect().height-8,behavior:'instant'});row?.querySelector('.song-entry')?.focus({preventScroll:true});libraryScroll=scrollY;remember();persistWorkspace();navigation?.snapshot();});}});
 const files=createFilesView({onLibrary:showHome,onSong:(id,ids)=>{pendingSongSet={ids,origin:'files'};open(id);}});
 const texts=createTextsView({getState:()=>state,save,edit:lists.editText,read:lists.readText,onHome:showHome,onFiles:showFiles,onLists:showLists,clearUndo:lists.clearUndo,onChanged:()=>{lists.render();render();}});
 $('home-text').onclick=()=>showTexts();
 for(const workspace of ['files','lists']){const control=button('','Text',()=>showTexts());control.innerHTML=textIcon;control.title='Text';control.setAttribute('aria-controls','texts-view');control.classList.add('workspace-sibling');$(workspace+'-library').parentElement.append(control);}
 function showTexts(){if(isBusy())return;clearLeavingSearch();$('library-home').hidden=true;$('library').hidden=true;closeMore();closeSource();blurSearch();files.hide();lists.hide();texts.hide();document.body.classList.add('library-open');navigation?.visit({view:'text',list:null});texts.open();}
 function returnLabels(){for(const id of ['songs','files-library','lists-library']){$(id).setAttribute('aria-label','Library Home');$(id).title='Library Home';$(id).setAttribute('aria-controls','library-home');}}
 returnLabels();
 function showScore(){$('library-home').hidden=true;blurSearch();files.hide();lists.hide();texts.hide();returnLabels();document.body.classList.remove('library-open');$('library').hidden=true;document.title=current?(songs.find(s=>s.id===current)?.title||'Music')+' · Music Transpose':'MusicTranspose';}
 function showLibrary(){if(isBusy())return;$('library-home').hidden=true;const position=libraryScroll;navigation?.visit({view:'library',list:activeList,song:null});files.hide();lists.hide();texts.hide();document.dispatchEvent(new Event('library-open'));leaveScore?.();document.body.classList.add('library-open');$('library').hidden=false;document.title=(group()?.name||'Library')+' · MusicTranspose';render();window.scrollTo({top:position,behavior:'instant'});libraryScroll=scrollY;remember();persistWorkspace();navigation?.snapshot();focusLibrary();}
 function selectList(id){if(isBusy())return;if(!$('library').hidden)remember();const next=state.groups.some(g=>g.id===id)?id:null;navigation?.visit({view:'library',list:next,song:null});activeList=next;reordering=false;applyContext(contexts.get(activeList||'library')||(activeList?{sort:'manual'}:{sort:globalSort}));showLibrary();remember();persistWorkspace();}
 function open(id,view){
  if(showUnavailableScore(songs.find(s=>s.id===id)))return;reordering=false;
  if(!$('library').hidden){
   libraryScroll=scrollY;remember();persistWorkspace();
   const query=$('library-search').value,singleSearch=!!normalizeSearch(query)&&orderedSongs.length===1&&orderedSongs[0]===id;
   // Page and exact-title hits locate an identity; multi-book result counts are not boundaries.
   // Explicit Lists, Favorites/saved subsets and broad keyword searches retain their scope.
   const selected=songs.find(song=>song.id===id),hit=selected&&search.match(selected,query,enabledFields);
   const locator=!!selected&&!!normalizeSearch(query)&&!activeList&&!favoritesOnly&&!savedOnly&&!isFileSong(selected)&&(hit?.pageMatch||enabledFields.includes('title')&&normalizeSearch(songForSource(selected,source).title)===normalizeSearch(query));
   const bookSources={'Hymns (1985)':'hymnal','Children’s Songbook':'children','Hymns for Home and Church':'home-church'};
   const locatorSource=locator?(source==='all'?bookSources[selected.collection]:source):null;
   const bookFallback=locatorSource&&source==='all';
   const ids=bookFallback?songs.filter(song=>canOpenScore(song)&&matchesSource(song,locatorSource)).map(song=>songForSource(song,locatorSource)).sort(compareNumbers).map(song=>song.id):(locatorSource||singleSearch)?findSongs('').filter(canOpenScore).map(s=>s.id):[...orderedSongs];
   pendingSongSet={ids,origin:'library',entry:{path:normalizeSearch(query)?'Search':'Library direct',query,resultCount:$('library-results').querySelectorAll('.library-row').length,playableResultCount:orderedSongs.length,displayedPlayableIds:[...orderedSongs],singleResultFallback:singleSearch,locatorSource:locatorSource||null,source,sort,favoritesOnly,list:activeList}};
   document.dispatchEvent(new CustomEvent('score-entry',{detail:{phase:'before-search-blur',entry:pendingSongSet.entry}}));
   // Dismiss text-entry focus before selection changes or any score layout starts.
   blurSearch();
   document.dispatchEvent(new CustomEvent('score-entry',{detail:{phase:'after-search-blur',entry:pendingSongSet.entry}}));
  }
  loadSong(id,view);
 }
 function listTools(){const g=group();$('active-list-tools').hidden=!g;$('library').classList.toggle('editing-list',!!g&&reordering);$('library-context').textContent=g?'List':'Library';$('edit-list-order').textContent=reordering?'Done editing':'Edit order';$('edit-list-order').setAttribute('aria-pressed',String(reordering));$('order-toggle').disabled=reordering;$('library-source').disabled=reordering;$('library-search').disabled=reordering;options.disabled=reordering;for(const control of fieldControls)control.disabled=reordering;$('library-clear').disabled=reordering;$('view-favorites').disabled=reordering;}
 function move(id,to,before=true){const g=group();if(!g||id===to||!g.songs.includes(id)||!g.songs.includes(to))return;g.songs.splice(g.songs.indexOf(id),1);g.songs.splice(g.songs.indexOf(to)+(before?0:1),0,id);const saved=save();render();$('library-message').textContent=saved?'Order saved.':'Changes last only while this page is open.';$('library-results').querySelector(`[data-song="${CSS.escape(id)}"] .reorder-grip`)?.focus({preventScroll:true});}
 function rowFocus(id,selector){$('library-results').querySelector(`[data-song="${CSS.escape(id)}"] ${selector}`)?.focus({preventScroll:true});}
 function removeSong(id){const g=group();if(!g)return;const i=g.songs.indexOf(id);g.songs=g.songs.filter(x=>x!==id);delete g.displayNames?.[id];const saved=save();render();$('library-message').textContent=saved?'Removed from this list. Song remains in the Library.':'Changes last only while this page is open.';const rows=$('library-results').children;(rows[Math.min(i,rows.length-1)]?.querySelector('.song-entry')||$('edit-list-order')).focus({preventScroll:true});}
 $('add-list-songs').onclick=()=>{if(!group())return;remember();persistWorkspace();reordering=false;navigation?.visit({view:'lists',list:activeList,picking:true,workspace:false});lists.pick(activeList);};
 $('edit-list-order').onclick=()=>{reordering=!reordering;if(reordering){source='all';sort='manual';$('library-search').value='';$('library-message').textContent='Editing the full list in saved order.';}else $('library-message').textContent='';render();};
 $('active-list-options').onclick=()=>{const dialog=$('active-list-dialog');$('active-list-heading').textContent=group()?.name||'List';dialog.showModal();};
 $('close-active-list').onclick=()=>$('active-list-dialog').close();
 $('rename-active-list').onclick=()=>{$('active-list-dialog').close();lists.name(activeList);};
 $('delete-active-list').onclick=()=>{$('active-list-dialog').close();lists.remove(activeList);};
 const sourceButton=$('library-source'),sourceMenu=$('library-source-menu');
 const sourceLabel=id=>({hymnal:'Hymns',children:'Children’s Songs'}[id]||sourceChoices.find(([value])=>value===id)?.[1]||'All Sources');
 function closeSource(focus=false){sourceMenu.hidden=true;sourceButton.setAttribute('aria-expanded','false');if(focus)sourceButton.focus({preventScroll:true});}
 function placeSource(){if(sourceMenu.hidden)return;const r=sourceButton.getBoundingClientRect();sourceMenu.style.left=Math.max(8,Math.min(r.left,innerWidth-sourceMenu.offsetWidth-8))+'px';sourceMenu.style.top=Math.max(8,Math.min(r.bottom+4,innerHeight-sourceMenu.offsetHeight-8))+'px';}
 function refreshLists(){
  const label=group()?.name||sourceLabel(source);$('library-source-label').textContent=label;sourceButton.title='Source: '+label;sourceButton.setAttribute('aria-label','Source: '+label);
  sourceMenu.replaceChildren();
  const heading=text=>{const e=node('div',text,'source-menu-heading');e.setAttribute('role','presentation');sourceMenu.append(e);};
  const divider=()=>{const e=node('hr');e.setAttribute('role','separator');sourceMenu.append(e);};
  const item=(text,selected,action,value)=>{const e=button(text,null,()=>{closeSource(true);action();});e.setAttribute('role','menuitemradio');e.setAttribute('aria-checked',String(selected));e.dataset.source=value;sourceMenu.append(e);};
  heading('Sources');
  for(const [id] of sourceChoices){if(id==='my-music')divider();item(sourceLabel(id),!activeList&&source===id,()=>{if(activeList)selectList(null);source=id;libraryScroll=0;savePreferences();render();window.scrollTo({top:0,behavior:'instant'});remember();persistWorkspace();navigation?.snapshot();},id);}
  divider();heading('My Lists');
  for(const g of state.groups)item(g.name,activeList===g.id,()=>selectList(g.id),'list:'+g.id);
  divider();const edit=button('Manage Lists…',null,showLists);edit.setAttribute('role','menuitem');edit.dataset.source='edit-lists';sourceMenu.append(edit);
 }
 sourceButton.onclick=()=>{blurSearch();if(!sourceMenu.hidden){closeSource();return;}closeMore();sourceMenu.hidden=false;sourceButton.setAttribute('aria-expanded','true');placeSource();(sourceMenu.querySelector('[aria-checked=true]')||sourceMenu.querySelector('button')).focus({preventScroll:true});};
 document.addEventListener('pointerdown',e=>{if(!sourceMenu.hidden&&!sourceMenu.contains(e.target)&&!sourceButton.contains(e.target))closeSource();});
 document.addEventListener('keydown',e=>{if(sourceMenu.hidden)return;if(e.key==='Escape'){e.preventDefault();closeSource(true);}else if(e.key==='Tab')closeSource();else if(['ArrowDown','ArrowUp','Home','End'].includes(e.key)){e.preventDefault();const items=[...sourceMenu.querySelectorAll('button')],i=items.indexOf(document.activeElement);items[e.key==='Home'?0:e.key==='End'?items.length-1:(i+(e.key==='ArrowDown'?1:-1)+items.length)%items.length].focus();}});
 window.addEventListener('resize',placeSource);window.addEventListener('scroll',placeSource,{passive:true});
 const more=$('library-more-dialog'),moreButton=$('library-more');
 function closeMore(focus=false){more.hidden=true;moreButton.setAttribute('aria-expanded','false');if(focus)moreButton.focus({preventScroll:true});}
 function placeMore(){if(more.hidden)return;const r=moreButton.getBoundingClientRect();more.style.left=Math.max(8,Math.min(r.right-more.offsetWidth,innerWidth-more.offsetWidth-8))+'px';more.style.top=Math.max(8,Math.min(r.bottom+4,innerHeight-more.offsetHeight-8))+'px';}
 moreButton.onclick=()=>{closeSource();blurSearch();if(!more.hidden){closeMore();return;}more.hidden=false;moreButton.setAttribute('aria-expanded','true');placeMore();more.querySelector('button').focus({preventScroll:true});};
 document.addEventListener('pointerdown',e=>{if(!more.hidden&&!more.contains(e.target)&&!moreButton.contains(e.target))closeMore();});
 document.addEventListener('keydown',e=>{if(more.hidden)return;if(e.key==='Escape'){e.preventDefault();closeMore(true);}else if(e.key==='Tab')closeMore();else if(['ArrowDown','ArrowUp','Home','End'].includes(e.key)){e.preventDefault();const items=[...more.querySelectorAll('button:not(:disabled):not([hidden])')],i=items.indexOf(document.activeElement);items[e.key==='Home'?0:e.key==='End'?items.length-1:(i+(e.key==='ArrowDown'?1:-1)+items.length)%items.length].focus();}});
 window.addEventListener('resize',placeMore);window.addEventListener('scroll',placeMore,{passive:true});

 const clearFavoritesDialog=$('clear-favorites-dialog');
 $('clear-favorites').onclick=()=>{if(!state.favorites.length)return;closeMore();clearFavoritesDialog.showModal();};
 $('clear-favorites-cancel').onclick=()=>clearFavoritesDialog.close();
 clearFavoritesDialog.addEventListener('close',()=>moreButton.focus({preventScroll:true}));
 clearFavoritesDialog.addEventListener('click',e=>{if(e.target!==clearFavoritesDialog)return;const r=clearFavoritesDialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)clearFavoritesDialog.close();});
 $('clear-favorites-confirm').onclick=()=>{state.favorites=[];const saved=save();render();clearFavoritesDialog.close();$('library-message').textContent=saved?'Favorites cleared.':'Favorites cleared for this session. Browser storage is unavailable.';};

 initOfflineMusic({getLists:()=>state.groups,closeMenu:()=>closeMore(),returnFocus:()=>moreButton.focus({preventScroll:true}),viewSaved:()=>{activeList=null;applyContext({source:'all',sort:globalSort,savedOnly:true});showLibrary();refreshOffline();}});
 $('library-saved-filter').onclick=()=>{savedOnly=!savedOnly;closeMore();render();refreshOffline();};
 document.addEventListener('offline-state-changed',()=>{render();});
 document.addEventListener('library-open',()=>refreshOffline());
 initHomeScreen({closeMenu:()=>closeMore(),returnFocus:()=>moreButton.focus({preventScroll:true})});
 $('library-import').onclick=()=>{render();closeMore();$('add-music').click();};
 $('library-clear').onclick=()=>{$('library-search').value='';render();$('library-search').focus({preventScroll:true});};
 // One query/filter/order path serves both visible results and locator fallback.
 function findSongs(query){
  const g=group(),pool=g?g.songs.map(id=>textItem(g,id)?{id,title:textItem(g,id).title,text:true}:songs.find(s=>s.id===id)||{id,title:'Unavailable song',missing:true}):songs;
  let found=pool.filter(s=>s.text?(!savedOnly&&(!query||normalizeSearch(s.title).includes(query))&&(!favoritesOnly||state.favorites.includes(s.id))):(!savedOnly||offlineSongState(s).saved)&&(!query||search.match(s,query,enabledFields).matched)&&matchesSource(s,source)&&(reordering||!favoritesOnly||state.favorites.includes(s.id))).map(s=>songForSource(s,source));
  const title=(a,b)=>collator.compare(a.title,b.title);
  if(sort!=='manual')found.sort((a,b)=>(sort==='manual'?g.songs.indexOf(a.id)-g.songs.indexOf(b.id):0)||(query?Number(!!search.match(b,query,enabledFields).pageMatch)-Number(!!search.match(a,query,enabledFields).pageMatch):0)||(sort==='number'?(compareNumbers(a,b)||title(a,b)):compareAlphabeticalTitles(a,b)));
  return found;
 }
 function render(){
  $('library-saved-filter').setAttribute('aria-checked',String(savedOnly));
  $('clear-favorites').hidden=state.favorites.length===0;
  $('view-favorites').setAttribute('aria-pressed',String(favoritesOnly));$('view-favorites').setAttribute('aria-label',favoritesOnly?'Show all songs':'Show Favorites');$('view-favorites').title=favoritesOnly?'Show all songs':'Show Favorites';
  $('library-clear').hidden=!$('library-search').value;
  const query=normalizeSearch($('library-search').value);
  for(const control of fieldControls)control.checked=enabledFields.includes(control.dataset.searchField);
  $('library-search-status').textContent=searchLoading&&enabledFields.includes('lyrics')?'Loading lyrics…':searchError;
  $('library-results').setAttribute('aria-busy',String(searchLoading));
  const g=group(),found=findSongs(query);
  orderedSongs=found.filter(canOpenScore).map(s=>s.id);
  const fragment=document.createDocumentFragment();
  for(const s of found){
   if(s.text){const row=node('div',null,'library-row list-entry-row');row.dataset.song=s.id;const entry=button('', 'Open '+s.title,()=>lists.readText(s.id));entry.className='song-entry';entry.append(node('strong',s.title),node('span','Text','song-meta'));const favored=state.favorites.includes(s.id),star=button('','Favorite Text: '+s.title,()=>{state.favorites=favored?state.favorites.filter(id=>id!==s.id):[...state.favorites,s.id];save();render();});star.className='favorite';star.innerHTML=favoriteIcon;star.setAttribute('aria-pressed',String(favored));const edit=button('','Edit Text: '+s.title,()=>lists.editText(g.id,s.id));edit.innerHTML=editIcon;edit.className='list-icon edit-list-entry';row.append(star,entry,edit);fragment.append(row);continue;}

   const row=node('div',null,'library-row');row.dataset.song=s.id;if(g)row.classList.add('list-entry-row');const displayName=g&&Object.hasOwn(g.displayNames||{},s.id)?g.displayNames[s.id]:s.title;
   const favorite=state.favorites.includes(s.id),star=button('',(favorite?'Remove from Favorites: ':'Add to Favorites: ')+s.title,()=>{state.favorites=favorite?state.favorites.filter(id=>id!==s.id):[...state.favorites,s.id];save();render();const replacement=$('library-results').querySelector(`[data-song="${s.id}"] .favorite`);(replacement||libraryHeading).focus({preventScroll:true});});star.innerHTML=favoriteIcon;star.classList.add('favorite');star.setAttribute('aria-pressed',String(favorite));
   const number=String(s.songNumber??s.page??'').trim(),numberFirst=sort==='number'&&/^\d+[a-z]?$/i.test(number);
   const entry=button('', 'Open '+displayName+(numberFirst?', '+number:''),()=>open(s.id));entry.className='song-entry'+(numberFirst?' numbered-song':'');if(numberFirst)entry.append(node('span',number+' ·','song-number'));entry.append(node('strong',displayName,'song-title'),node('span',[isFileSong(s)?'Files':s.collection,isUnavailableScore(s)?'Score unavailable':''].filter(Boolean).join(' · '),'song-meta'));
   const badge=offlineBadge(s);if(badge)entry.querySelector('.song-meta').append(badge);
   const reason=query&&search.match(s,query,enabledFields).reason;if(reason==='Matched lyrics')entry.append(node('span',reason,'song-meta'));
   entry.title=displayName;row.append(entry);if(isUnavailableScore(s)){entry.setAttribute('aria-label',`${number}, ${displayName}, score unavailable`);}else row.append(star);
   if(g&&!isUnavailableScore(s)){const pencil=button('','Edit song in list: '+displayName,()=>lists.editEntry(g.id,s,()=>rowFocus(s.id,'.edit-list-entry')));pencil.classList.add('list-icon','edit-list-entry');pencil.innerHTML=editIcon;pencil.title='Edit song in list';
    const grip=button('',(reordering?'Drag or use Arrow keys to reorder: ':'Order song: ')+displayName,()=>{if(!reordering){$('edit-list-order').click();rowFocus(s.id,'.reorder-grip');}});grip.classList.add('list-icon','order-song');grip.innerHTML=orderIcon;grip.title=reordering?'Drag to reorder; Arrow Up / Down moves one place':'Edit saved list order';
    if(reordering){grip.classList.add('reorder-grip');attachReorderHandle(grip,row,$('library-results'),(to,before)=>move(s.id,to,before));grip.addEventListener('keydown',e=>{const index=g.songs.indexOf(s.id);if(e.key==='ArrowUp'||e.key==='ArrowDown'){e.preventDefault();move(s.id,g.songs[index+(e.key==='ArrowUp'?-1:1)],e.key==='ArrowUp');}});}
    row.insertBefore(pencil,star);row.append(grip);
   }
   if(s.missing){for(const b of row.querySelectorAll('button'))b.disabled=true;row.querySelector('.song-meta').textContent='Source unavailable · retained in saved order';}
   if(g&&reordering){const tools=node('div',null,'list-row-tools');const index=g.songs.indexOf(s.id),up=button('↑','Move up: '+s.title,()=>move(s.id,g.songs[index-1],true)),down=button('↓','Move down: '+s.title,()=>move(s.id,g.songs[index+1],false));up.disabled=index===0;down.disabled=index===g.songs.length-1;tools.append(node('span',String(index+1),'list-order-number'),up,down,button('Remove','Remove from list: '+s.title,()=>removeSong(s.id)));row.append(tools);}
   fragment.append(row);
  }
  if(!found.length)fragment.append(node('p',g&&!g.songs.length?'No songs yet. Choose Add songs.':source==='legacy'?'No Legacy songs.':'No songs match. Try another search or source.','empty-library'));
  $('library-results').replaceChildren(fragment);$('library-count').textContent=searchLoading?'Loading lyrics…':`${found.length}${g?' / '+g.songs.length:''} ${g&&g.songs.some(id=>textItem(g,id))?'items':(g?g.songs.length:found.length)===1?'song':'songs'}${savedOnly?' · Saved on this device':''}`;
  $('order-toggle').replaceChildren(...[...(g?[['manual','Manual order']]:[]),['title','Title (A–Z)'],['number','Page number']].map(([value,label])=>new Option(label,value)));$('order-toggle').value=sort;
  $('library-sort-label').replaceChildren(node('span','Sort by: ','desktop-prefix'),node('span',sort==='manual'?'Manual':sort==='number'?'Page number':'Title','desktop-sort'),node('span',sort==='manual'?'Manual':sort==='number'?'Page number':'Title','phone-sort'));
  $('library-clear').setAttribute('aria-label','Clear search');$('library-clear').title='Clear search';
  refreshLists();listTools();if(!$('library').hidden){remember();persistWorkspace();}navigation?.snapshot();

 }
 $('view-favorites').innerHTML=favoriteIcon;
 $('view-favorites').onclick=()=>{closeSource();closeMore();closeSearchOptions();favoritesOnly=!favoritesOnly;render();};
 $('order-toggle').onchange=()=>{sort=$('order-toggle').value;if(!activeList)globalSort=sort;savePreferences();render();};

 function showHome(){if(isBusy())return;clearLeavingSearch();closeSource();closeMore();blurSearch();navigation?.visit({view:'home',list:null,song:null});files.hide();lists.hide();texts.hide();leaveScore?.();document.dispatchEvent(new Event('library-open'));document.body.classList.add('library-open');$('library').hidden=true;$('library-home').hidden=false;document.title='Library · MusicTranspose';window.scrollTo({top:0,behavior:'instant'});$('library-home-title').focus({preventScroll:true});}
 for(const control of document.querySelectorAll('[data-home-source]'))control.onclick=()=>{activeList=null;reordering=false;applyContext({source:control.dataset.homeSource,sort:globalSort});showLibrary();};
 const about=$('about-dialog');$('home-about').onclick=()=>{about.showModal();$('about-title').focus();};$('about-close').onclick=()=>about.close();about.addEventListener('close',()=>$('home-about').focus({preventScroll:true}));about.addEventListener('click',e=>{if(e.target!==about)return;const r=about.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)about.close();});
 $('home-search-form').onsubmit=e=>{e.preventDefault();if(isBusy())return;const query=$('home-search').value;$('home-search').blur();activeList=null;reordering=false;applyContext({source:'all',sort:globalSort,query});showLibrary();$('home-search').value='';};
 $('home-files').onclick=()=>showFiles();$('home-lists').onclick=()=>showLists();
 function showFiles(){clearLeavingSearch();$('library-home').hidden=true;closeMore();blurSearch();navigation?.visit({view:'files'});if(!$('library').hidden){libraryScroll=scrollY;remember();persistWorkspace();}lists.hide();texts.hide();files.open();}
 function showLists(target=null,restoreScroll=false){if(typeof target!=='string'||!state.groups.some(g=>g.id===target))target=null;if(isBusy())return;clearLeavingSearch();leaveScore?.();document.dispatchEvent(new Event('library-open'));$('library-home').hidden=true;closeMore();closeSource();blurSearch();navigation?.visit({view:'lists',list:target,picking:false,workspace:true});if(!$('library').hidden){libraryScroll=scrollY;remember();persistWorkspace();}files.hide();texts.hide();if(target)lists.openList(target,{restoreScroll});else lists.open();navigation?.snapshot();}
 $('view-lists').onclick=showLists;$('library-lists').onclick=showLists;
 $('view-files').onclick=showFiles;
 $('library-quick-lists').onclick=showLists;$('library-quick-files').onclick=showFiles;
 document.addEventListener('music-import-open',()=>{if($('files-view').hidden)showFiles();navigation?.visit({view:'import'});});
 document.addEventListener('music-import-close',()=>{if(navigation?.current.view==='import')navigation.replace({view:'files'});});
 document.addEventListener('local-music-saved',()=>{if(navigation?.current.view==='import')navigation.replace({view:'files'});});
 $('library-search').onkeydown=e=>{if(e.key==='Escape'&&e.currentTarget.value){e.preventDefault();$('library-clear').click();}};
 $('library-search').oninput=render;$('songs').onclick=showHome;
 document.addEventListener('click',e=>{if(e.target.closest('#library .header-home'))showHome();else if(e.target.closest('.header-home')&&$('library').hidden)showLibrary();});
 document.addEventListener('local-music-changed',()=>{render();lists.render();});
 document.addEventListener('local-music-deleted',e=>{const id=e.detail;state.favorites=state.favorites.filter(x=>x!==id);state.recent=state.recent.filter(x=>x!==id);for(const g of state.groups){g.songs=g.songs.filter(x=>x!==id);delete g.displayNames?.[id];}if(current===id)current=null;save();});
 document.addEventListener('local-music-memberships',e=>{for(const item of e.detail.memberships){const g=state.groups.find(g=>g.id===item.id);if(g){g.songs=item.checked?[...new Set([...g.songs,e.detail.id])]:g.songs.filter(id=>id!==e.detail.id);if(!item.checked)delete g.displayNames?.[e.detail.id];}}save();});
 function capture(route){if(!$('library').hidden){libraryScroll=scrollY;remember();persistWorkspace();}return {...route,scroll:scrollY,library:{...browse(),searchEpoch,activeList,current}};}
 async function restore(route){
  closeSource();closeMore();for(const d of document.querySelectorAll('dialog[open]'))d.close();blurSearch();reordering=false;
  const context=route.library||{},candidate=Object.hasOwn(context,'activeList')?context.activeList:route.origin?.list??route.list;activeList=state.groups.some(g=>g.id===candidate)?candidate:null;applyContext({...context,query:context.searchEpoch===searchEpoch?context.query:'',sort:context.sort||(activeList?'manual':globalSort)});current=context.current||current;

  if(!activeList)globalSort=sort;
  if(route.view==='score'||route.view==='lyrics'){
   if(songs.some(s=>s.id===route.song&&canOpenScore(s))){songSet=route.songSet||fallbackSet(route.song);restoringSongSet=true;try{if(route.view==='lyrics'&&lyricIds.has(route.song))await openLyrics(route.song);else{route={...route,view:'score'};await showScoreView(route.song);}}finally{restoringSongSet=false;syncSongNavigation();}if(!document.body.classList.contains('library-open')){window.scrollTo({top:route.scroll||0,behavior:'instant'});return route;}}
   route={...route,view:'library',list:activeList,song:null,scroll:libraryScroll};
  }
  leaveScore?.();document.dispatchEvent(new Event('library-open'));document.body.classList.add('library-open');files.hide();lists.hide();texts.hide();$('library-home').hidden=true;$('library').hidden=true;
  if(route.view==='home'){showHome();}
  else if(route.view==='lists'&&route.picking&&state.groups.some(g=>g.id===route.list))lists.pick(route.list,false);
  else if(route.view==='lists'&&route.workspace&&!route.picking)lists.openList(route.list,{restoreScroll:true});
  else if(route.view==='lists'&&!route.list)lists.open();
  else if(route.view==='text')texts.open();
  else if(route.view==='files'||route.view==='import'){files.open();if(route.view==='import'){await new Promise(resolve=>setTimeout(resolve,0));$('add-music').click();}}
  else{if(route.view==='lists'){activeList=state.groups.some(g=>g.id===route.list)?route.list:null;sort=activeList?'manual':globalSort;route={...route,view:'library',list:activeList};}$('library').hidden=false;document.title=(group()?.name||'Library')+' · MusicTranspose';render();if(document.activeElement!==document.body&&document.activeElement!==$('library-search'))focusLibrary();}
  window.scrollTo({top:route.scroll||0,behavior:'instant'});return route;
 }
 // A snapshot of the displayed IDs is shared by score routes, never catalog-wide by accident.
 function fallbackSet(id){
  const song=songs.find(s=>s.id===id);if(!song)return {ids:[],origin:'unavailable'};
  const sourceId=sourceChoices.find(([value])=>value!=='all'&&matchesSource(song,value))?.[0];
  if(!sourceId)return {ids:[id],origin:'unavailable'};
  const ids=songs.filter(s=>canOpenScore(s)&&matchesSource(s,sourceId)).map(s=>songForSource(s,sourceId)).sort(compareAlphabeticalTitles).map(s=>s.id);
  return {ids,origin:'collection',source:sourceId};
 }
 function neighbors(){
  const ids=(songSet?.ids||[]).filter(id=>songs.some(s=>s.id===id&&canOpenScore(s))),index=ids.indexOf(current);
  return index<0?[]:[ids[index-1],ids[index+1]];
 }
 let lastNavigationSync=null;
 // Read-only diagnostics: preserve both the captured set and filtered playable neighbors.
 function navigationDiagnostics(){
  const captured=songSet?.ids||[],ids=captured.filter(id=>songs.some(s=>s.id===id&&canOpenScore(s))),index=ids.indexOf(current),api=window.prototype;
  const busy=!!api?.busy,loading=!!api?.loading,bodyLoading=document.body.classList.contains('song-loading');
  const candidate=(id,button)=>{const song=songs.find(s=>s.id===id),reasons=[];if(busy)reasons.push('busy');if(loading)reasons.push('loading');if(bodyLoading)reasons.push('body.song-loading');if(index<0)reasons.push('current-not-in-songSet');else if(!id)reasons.push(button==='previous-song'?'start-of-set':'end-of-set');if(id&&!song)reasons.push('candidate-not-in-catalog');else if(id&&!canOpenScore(song))reasons.push('candidate-not-playable');const disabled=$(button).disabled;return {id:id||null,exists:!!song,playable:canOpenScore(song),disabled,reasons,staleDisabled:disabled&&!reasons.length};};
  return {currentSongId:current,activeSongId:api?.song,hymnNumber:songs.find(s=>s.id===current)?.page,origin:songSet?.origin||null,count:captured.length,playableCount:ids.length,index,capturedIndex:captured.indexOf(current),ids:[...captured],previous:candidate(index>=0?ids[index-1]:null,'previous-song'),next:candidate(index>=0?ids[index+1]:null,'next-song'),busy,loading,bodySongLoading:bodyLoading,scoreBusy:$('score').getAttribute('aria-busy'),isBusy:!!isBusy(),lastSync:lastNavigationSync,route:navigation?.current,context:{source,sort,query:$('library-search').value,favoritesOnly,activeList},entry:songSet?.entry||null,orderedSongs:[...orderedSongs],pendingSongSet:pendingSongSet?{...pendingSongSet,ids:[...pendingSongSet.ids]}:null};
 }
 function originatingList(){const id=songSet?.origin==='lists'?songSet.list:songSet?.origin==='library'?songSet.entry?.list:null;return state.groups.some(g=>g.id===id)?id:null;}
 function syncSongNavigation(){
  scoreLists.hidden=!originatingList();scoreLists.disabled=!!isBusy();
  // current changes only in opened(), after the destination has successfully rendered.
  const song=songs.find(s=>s.id===current),shown=song&&songForSource(song,songSet?.origin==='library'?songSet.entry?.locatorSource||songSet.entry?.source||source:songSet?.source||'all');
  const label=[shown?.songNumber,shown?.page].map(value=>String(value??'').trim()).find(value=>/^\d+[a-z]?$/i.test(value)&&Number.parseInt(value,10)>0)||'Song';
  $('score-song-number').textContent=label;
  document.querySelector('.score-song-navigation').setAttribute('aria-label','Song navigation, current '+(label==='Song'?'song':`song ${label}`));
  const adjacent=neighbors();for(const [i,id] of ['previous-song','next-song'].entries())$(id).disabled=isBusy()||document.body.classList.contains('song-loading')||!adjacent[i];
  lastNavigationSync={at:Math.round(performance.now()),current,isBusy:!!isBusy(),busy:!!window.prototype?.busy,loading:!!window.prototype?.loading,bodySongLoading:document.body.classList.contains('song-loading'),scoreBusy:$('score').getAttribute('aria-busy'),previous:adjacent[0]||null,next:adjacent[1]||null,previousDisabled:$('previous-song').disabled,nextDisabled:$('next-song').disabled};
 }
 async function stepSong(direction){
  if(isBusy()||document.body.classList.contains('song-loading'))return;
  const id=neighbors()[direction];if(!id)return;
  await loadSong(id);syncSongNavigation();
  const control=$(direction?'next-song':'previous-song');
  if(!control.disabled)control.focus({preventScroll:true});
  else document.querySelector('.score-heading h1').focus({preventScroll:true});
 }
 $('previous-song').onclick=()=>stepSong(0);$('next-song').onclick=()=>stepSong(1);
 new MutationObserver(syncSongNavigation).observe(document.body,{attributes:true,attributeFilter:['class']});
 new MutationObserver(syncSongNavigation).observe($('score'),{attributes:true,attributeFilter:['aria-busy']});
 // Workspace preferences supplement, never rewrite, saved list membership.
 try{if(freshLaunch)sessionStorage.removeItem(workspaceKey);const saved=JSON.parse(sessionStorage.getItem(workspaceKey)||'null');if(saved){for(const item of saved.contexts||[])if(Array.isArray(item)&&item.length===2){const {leadOnly:obsoleteLeadFilter,...context}=item[1]||{};contexts.set(item[0],context);}activeList=state.groups.some(g=>g.id===saved.activeList)?saved.activeList:null;if(contexts.has(activeList||'library'))applyContext(contexts.get(activeList||'library'));}}catch{}
 search.prepare().catch(()=>{searchError='Lyrics search unavailable offline until the bundled lyrics are saved on this device.';}).finally(()=>{searchLoading=false;render();});
 const startupScroll=libraryScroll;render();if(!history.state?.musicTransposeNavigation){window.scrollTo({top:startupScroll,behavior:'instant'});libraryScroll=scrollY;remember();persistWorkspace();}
 navigation=createViewHistory({capture,restore,isBusy,initialView:'home',restoreHistory:!freshLaunch,onTravel:(next,previous)=>{if(previous.view==='library'&&next.view!=='library')clearLeavingSearch(false);cancelPendingSelection?.();if(!['score','lyrics'].includes(next.view)||next.song!==previous.song)stopPlayback?.();}});
 return {diagnostics:navigationDiagnostics,context:()=>activeList,startHistory:()=>navigation.start(),navigating(view,id){const previous=navigation.current;if(!restoringSongSet){songSet=pendingSongSet||(['score','lyrics'].includes(previous.view)&&songSet?.ids.includes(id)?songSet:fallbackSet(id));pendingSongSet=null;}if(songSet)songSet={...songSet,ids:songSet.ids.filter(id=>songs.some(s=>s.id===id&&canOpenScore(s)))};clearLeavingSearch();navigation.visit({view,song:id,songSet,origin:['score','lyrics'].includes(previous.view)?previous.origin:{view:previous.view,list:activeList,scroll:scrollY}});},showScore,showLibrary,opened(id){returnLabels();$('library-message').textContent='';current=id;syncSongNavigation();state.recent=[id,...state.recent.filter(x=>x!==id)].slice(0,30);save();render();},failed(){leaveScore?.();navigation.replace({view:'library',list:activeList,song:null});files.hide();lists.hide();texts.hide();document.body.classList.add('library-open');$('library').hidden=false;document.title='MusicTranspose · Library';render();$('library-message').textContent='Unable to open this score. Try again online or choose another song.';}};
}
