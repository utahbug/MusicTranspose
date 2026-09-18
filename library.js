import {lyricIds} from './lyrics-index.js';
import {attachReorderHandle} from './list-reorder.js';
import {songs,collectionNames,songSearchText,normalizeSearch} from './songs.js';
const storageKey='music-transpose-library-v1';
const $=id=>document.getElementById(id);
const normalize=s=>s.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLocaleLowerCase();
const collator=new Intl.Collator(undefined,{numeric:true,sensitivity:'base'});
// Presentation only: native selects stay accessible, sized to their selected label.
const textMeasure=document.createElement('canvas').getContext('2d');
function fitLibrarySelects(){for(const id of ['library-list']){const select=$(id);textMeasure.font=getComputedStyle(select).font;select.style.width=Math.ceil(textMeasure.measureText(select.selectedOptions[0]?.text||'').width+28)+'px';}}
const searchIndex=new Map(songs.map(s=>[s.id,songSearchText(s)]));
function node(tag,text,className){const e=document.createElement(tag);if(text)e.textContent=text;if(className)e.className=className;return e;}
function button(text,label,action){const b=node('button',text,'quiet');b.type='button';if(label)b.setAttribute('aria-label',label);b.onclick=action;return b;}
export function initLibrary({loadSong,openLyrics,isBusy,leaveScore}){
 let state={favorites:[],groups:[],recent:[]},filter='all',current=null,target=null,libraryScroll=0,editing=false,contextKey='',globalSort='title',activeList='',renaming=null;
 try{const saved=JSON.parse(localStorage.getItem(storageKey)||'null');if(saved&&typeof saved==='object'){
  const ids=a=>Array.isArray(a)?[...new Set(a.filter(x=>typeof x==='string'))]:[];
  state.orderingVersion=saved.orderingVersion;state.favorites=ids(saved.favorites);state.recent=ids(saved.recent).slice(0,30);
  state.groups=Array.isArray(saved.groups)?saved.groups.filter(g=>g&&typeof g.id==='string'&&typeof g.name==='string').map(g=>({id:g.id,name:g.name.slice(0,80),songs:ids(g.songs)})):[];
 }}catch{}
 function save(){try{localStorage.setItem(storageKey,JSON.stringify(state));}catch{$('library-message').textContent='Browser storage is unavailable. Changes will last only while this page is open.';}}
 // Previous list views defaulted to Title. Migrate once without dropping unknown IDs.
 if(state.orderingVersion!==1){
  const titles=new Map(songs.map(s=>[s.id,s.title]));
  const initial=(a,b)=>collator.compare(titles.get(a)||a,titles.get(b)||b);
  state.favorites.sort(initial);for(const g of state.groups)g.songs.sort(initial);
  state.orderingVersion=1;save();
 }
 function orderedList(){const group=state.groups.find(g=>g.id===$('library-list').value);return group?{key:group.id,name:group.name,ids:group.songs}:filter==='favorites'?{key:'@favorites',name:'Favorites',ids:state.favorites}:null;}
 function syncOrderContext(){
  const list=orderedList(),key=list?.key||'';
  if(key!==contextKey){editing=false;contextKey=key;$('library-sort').value=key?'list':globalSort;}
  const option=$('library-sort').querySelector('[value="list"]');option.hidden=!list;option.disabled=!list;
  $('reorder-list').hidden=!list;$('reorder-list').textContent=editing?'Done':'Reorder';$('reorder-list').setAttribute('aria-pressed',String(editing));
  $('order-note').textContent=list?(editing?'Reordering '+list.name+'. Drag a grip or use Move up / down. Search-hidden songs keep their positions.':$('library-sort').value==='list'?'':'Temporary sort · saved list order is unchanged.') : '';
  return list;
 }
 function moveSong(id,to,before=true){
  const list=orderedList();if(!list)return;
  const visible=[...$('library-results').querySelectorAll('[data-song]')].map(e=>e.dataset.song);
  const from=visible.indexOf(id);if(from<0)return;visible.splice(from,1);
  const destination=visible.indexOf(to);if(destination<0)return;visible.splice(destination+(before?0:1),0,id);
  const included=new Set(visible);let i=0;list.ids.splice(0,list.ids.length,...list.ids.map(song=>included.has(song)?visible[i++]:song));
  save();render();$('reorder-status').textContent='Moved '+songs.find(s=>s.id===id).title+'. Order saved.';
  $('library-results').querySelector(`[data-song="${id}"] .reorder-grip`)?.focus({preventScroll:true});
 }
 $('reorder-list').onclick=()=>{editing=!editing;if(editing)$('library-sort').value='list';render();};
 function showScore(){document.body.classList.remove('library-open');$('library').hidden=true;document.title=current?songs.find(s=>s.id===current).title+' · Music Transpose':'MusicTranspose';}
 function showLibrary(){if(isBusy())return;document.dispatchEvent(new Event('library-open'));leaveScore?.();document.body.classList.add('library-open');$('library').hidden=false;document.title='MusicTranspose · Library';render();window.scrollTo({top:libraryScroll,behavior:'instant'});$('library-search').focus({preventScroll:true});}
 function resume(){if(!current||isBusy())return;libraryScroll=scrollY;loadSong(current);}
 function open(id){if(isBusy())return;libraryScroll=scrollY;if(id===current){resume();return;}loadSong(id);}
 function updateListSelect(){
  const select=$('library-list'),choices=document.createElement('optgroup');choices.label='Your lists';choices.append(new Option('All lists',''));
  for(const g of state.groups)choices.append(new Option(g.name,g.id));
  select.replaceChildren(new Option('Manage lists…','@manage-lists'),choices);
  activeList=state.groups.some(g=>g.id===activeList)?activeList:'';select.value=activeList;
 }
 function render(){
  const ordered=syncOrderContext();
  const query=normalizeSearch($('library-search').value),group=state.groups.find(g=>g.id===$('library-list').value),sort=$('library-sort').value;
  let found=songs.filter(s=>(!query||query.split(/\s+/).every(word=>searchIndex.get(s.id).includes(word)))&&(!group||group.songs.includes(s.id))&&(filter==='all'||filter==='favorites'&&state.favorites.includes(s.id)||filter==='recent'&&state.recent.includes(s.id)||(s.tags||[]).includes(filter)||s.collection===filter||(s.collectionMemberships||[]).some(m=>m.collection===filter)));
  const title=(a,b)=>collator.compare(a.title,b.title),recent=s=>{const i=state.recent.indexOf(s.id);return i<0?Infinity:i;};
  found.sort((a,b)=>(/^\d+[ab]?$/.test(query)?Number(String(b.page).toLowerCase()===query)-Number(String(a.page).toLowerCase()===query):0)||(sort==='list'&&ordered?ordered.ids.indexOf(a.id)-ordered.ids.indexOf(b.id):sort==='number'?collator.compare(a.page||'',b.page||''):sort==='collection'?collator.compare(a.collection||'',b.collection||''):sort==='recent'?recent(a)-recent(b):0)||title(a,b));
  const fragment=document.createDocumentFragment();
  for(const s of found){
   const row=node('div',null,'library-row');row.dataset.song=s.id;
   const favorite=state.favorites.includes(s.id),star=button(favorite?'★':'☆',(favorite?'Remove favorite: ':'Favorite: ')+s.title,()=>{state.favorites=favorite?state.favorites.filter(id=>id!==s.id):[...state.favorites,s.id];save();render();const replacement=$('library-results').querySelector(`[data-song="${s.id}"] .favorite`);(replacement||$('library-search')).focus({preventScroll:true});});star.classList.add('favorite');star.setAttribute('aria-pressed',String(favorite));
   const entry=button('', 'Open '+s.title,()=>open(s.id));entry.className='song-entry';entry.append(node('strong',s.title),node('span',[s.collection,s.page,s.scoreType==='pdf'?'PDF score':`${s.tonic} ${s.mode}`].filter(Boolean).join(' · '),'song-meta'));
   if(s.id===current){row.classList.add('current-song');entry.append(node('span','Open · Return to score','current-label'));}
   const lists=button('⋯','Actions for '+s.title,()=>openSongActions(s.id));lists.classList.add('song-actions');lists.title='Song actions';lists.setAttribute('aria-haspopup','dialog');lists.setAttribute('aria-controls','song-actions');
   if(editing&&ordered){
    row.classList.add('reordering');entry.disabled=true;
    const grip=button('⠿','Drag to reorder '+s.title,()=>{});grip.classList.add('reorder-grip');grip.title='Drag to reorder';
    attachReorderHandle(grip,row,$('library-results'),(to,before)=>moveSong(s.id,to,before));
    const actions=node('div',null,'reorder-actions'),index=found.indexOf(s);
    const up=button('↑','Move up: '+s.title,()=>moveSong(s.id,found[index-1].id,true));up.disabled=index===0;
    const down=button('↓','Move down: '+s.title,()=>moveSong(s.id,found[index+1].id,false));down.disabled=index===found.length-1;
    actions.append(up,down);row.append(grip,entry,actions);
   }else{const views=node('div',null,'song-view-actions');const scoreButton=button('♫','Open score: '+s.title,()=>open(s.id));scoreButton.title='Open score';views.append(scoreButton);if(lyricIds.has(s.id)){const lyricsButton=button('≡','Open lyrics: '+s.title,()=>{if(!isBusy())openLyrics(s.id);});lyricsButton.title='Open lyrics';views.append(lyricsButton);}row.append(star,entry,views,lists);}
   fragment.append(row);
  }
  if(!found.length)fragment.append(node('p','No songs match. Try another search, filter, or list.','empty-library'));
  $('library-results').replaceChildren(fragment);$('library-count').textContent=`${found.length} ${found.length===1?'song':'songs'}`;
  for(const [id,label,defaultValue] of [['library-filter','Filter songs','all'],['library-sort','Sort songs',ordered?'list':'title']]){const select=$(id),text=select.selectedOptions[0]?.text||'';select.title=label+': '+text;select.parentElement.title=select.title;select.parentElement.dataset.active=String(select.value!==defaultValue);}
  fitLibrarySelects();
  $('resume-score').hidden=!current;if(current)$('resume-score').textContent='Return to '+songs.find(s=>s.id===current).title;

 }
 for(const [value,label] of [['all','All'],['favorites','Favorites'],['recent','Recently Played'],['Primary','Primary'],['Christmas','Christmas'],...collectionNames.map(c=>[c,c])]){
  $('library-filter').append(new Option(label,value));
 }
 $('library-filter').onchange=()=>{filter=$('library-filter').value;render();};
 function openSongActions(id){
  const song=songs.find(s=>s.id===id),group=state.groups.find(g=>g.id===activeList);
  $('song-actions-title').textContent=song.title;$('song-remove-list').hidden=!group;
  $('song-add-list').onclick=()=>{$('song-actions').close();openLists(id);};
  $('song-remove-list').onclick=()=>{if(!group)return;group.songs=group.songs.filter(songId=>songId!==id);save();$('song-actions').close();render();$('reorder-status').textContent='Removed '+song.title+' from '+group.name+'.';$('library-list').focus({preventScroll:true});};
  $('song-actions').showModal();$('song-add-list').focus();
 }
 $('close-song-actions').onclick=()=>$('song-actions').close();
 function openLists(id=null){target=id;renaming=null;$('lists-title').textContent=id?'Lists for '+songs.find(s=>s.id===id).title:'My lists';$('lists-hint').textContent=id?'Choose any number of personal lists. Source collections stay unchanged.':'Create a list, or rename and delete existing lists.';$('create-list').hidden=!!id;$('manage-membership-lists').hidden=!id;$('list-message').textContent='';renderGroups();if(!$('lists-dialog').open)$('lists-dialog').showModal();(id?$('close-lists'):$('new-list-name')).focus();}
 function renderGroups(){
  $('personal-lists').replaceChildren();
  for(const g of state.groups){const row=node('div',null,'personal-list');
   if(target){const label=node('label'),check=document.createElement('input');check.type='checkbox';check.checked=g.songs.includes(target);check.onchange=()=>{g.songs=check.checked?[...new Set([...g.songs,target])]:g.songs.filter(id=>id!==target);save();render();};label.append(check,node('span',g.name));row.append(label);}
   else if(renaming===g.id){
    const input=document.createElement('input');input.value=g.name;input.maxLength=80;input.setAttribute('aria-label','List name: '+g.name);
    const cancel=()=>{renaming=null;renderGroups();$('personal-lists').querySelector(`[data-list-id="${g.id}"] .rename-list`)?.focus();};
    const rename=button('Save','Save list name',()=>{const name=input.value.trim();if(!name){$('list-message').textContent='Enter a list name.';return;}if(state.groups.some(x=>x.id!==g.id&&normalize(x.name)===normalize(name))){$('list-message').textContent='That list name already exists.';return;}g.name=name;renaming=null;save();updateListSelect();render();renderGroups();$('list-message').textContent='List renamed.';$('personal-lists').querySelector(`[data-list-id="${g.id}"] .rename-list`)?.focus();});
    input.onkeydown=e=>{if(e.key==='Enter'){e.preventDefault();rename.click();}if(e.key==='Escape'){e.preventDefault();e.stopPropagation();cancel();}};
    row.append(input,rename,button('Cancel','Cancel rename',cancel));
   }else{
    const name=node('span',g.name,'personal-list-name'),rename=button('Rename','Rename '+g.name,()=>{renaming=g.id;renderGroups();const input=$('personal-lists').querySelector('input');input.focus();input.select();});rename.classList.add('rename-list');
    const remove=button('Delete','Delete list '+g.name,()=>{if(!window.confirm('Delete “'+g.name+'”? Songs, Favorites and other lists will stay unchanged.'))return;state.groups=state.groups.filter(x=>x.id!==g.id);save();updateListSelect();render();renderGroups();$('list-message').textContent='List deleted. Songs remain in the Library.';});row.append(name,rename,remove);
   }
   row.dataset.listId=g.id;
   $('personal-lists').append(row);
  }
  if(!state.groups.length)$('personal-lists').append(node('p',target?'No personal lists yet. Open Manage lists to create one.':'No personal lists yet. Create your first one above.'));
 }
 $('create-list').onsubmit=e=>{e.preventDefault();if(target)return;const name=$('new-list-name').value.trim();if(!name)return;if(state.groups.some(g=>normalize(g.name)===normalize(name))){$('list-message').textContent='That list already exists.';return;}renaming=null;state.groups.push({id:crypto.randomUUID(),name,songs:[]});$('new-list-name').value='';save();updateListSelect();renderGroups();render();$('list-message').textContent='List created.';};
 $('manage-membership-lists').onclick=()=>openLists();$('close-lists').onclick=()=>$('lists-dialog').close();
 $('library-search').oninput=render;$('library-sort').onchange=()=>{editing=false;if(!orderedList())globalSort=$('library-sort').value;render();};$('library-list').onchange=()=>{if($('library-list').value==='@manage-lists'){$('library-list').value=activeList;openLists();return;}activeList=$('library-list').value;render();};$('resume-score').onclick=resume;$('songs').onclick=showLibrary;
 updateListSelect();render();
 return {showScore,showLibrary,opened(id){$('library-message').textContent='';current=id;state.recent=[id,...state.recent.filter(x=>x!==id)].slice(0,30);save();render();},failed(){document.body.classList.add('library-open');$('library').hidden=false;document.title='MusicTranspose · Library';render();$('library-message').textContent='Unable to open this score. Try again online or choose another song.';}};
}
