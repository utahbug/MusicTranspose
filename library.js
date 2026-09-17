import {songs,collectionNames,songSearchText} from './songs.js';
const storageKey='music-transpose-library-v1';
const $=id=>document.getElementById(id);
const normalize=s=>s.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLocaleLowerCase();
const collator=new Intl.Collator(undefined,{numeric:true,sensitivity:'base'});
const searchIndex=new Map(songs.map(s=>[s.id,songSearchText(s)]));
function node(tag,text,className){const e=document.createElement(tag);if(text)e.textContent=text;if(className)e.className=className;return e;}
function button(text,label,action){const b=node('button',text,'quiet');b.type='button';if(label)b.setAttribute('aria-label',label);b.onclick=action;return b;}
export function initLibrary({loadSong,isBusy}){
 let state={favorites:[],groups:[],recent:[]},filter='all',current=null,target=null,scoreScroll=0,libraryScroll=0;
 try{const saved=JSON.parse(localStorage.getItem(storageKey)||'null');if(saved&&typeof saved==='object'){
  const ids=a=>Array.isArray(a)?[...new Set(a.filter(x=>typeof x==='string'))]:[];
  state.favorites=ids(saved.favorites);state.recent=ids(saved.recent).slice(0,30);
  state.groups=Array.isArray(saved.groups)?saved.groups.filter(g=>g&&typeof g.id==='string'&&typeof g.name==='string').map(g=>({id:g.id,name:g.name.slice(0,80),songs:ids(g.songs)})):[];
 }}catch{}
 function save(){try{localStorage.setItem(storageKey,JSON.stringify(state));}catch{$('library-message').textContent='Browser storage is unavailable. Changes will last only while this page is open.';}}
 function showScore(){document.body.classList.remove('library-open');$('library').hidden=true;document.title=current?songs.find(s=>s.id===current).title+' · Music Transpose':'MusicTranspose';}
 function showLibrary(){if(isBusy())return;scoreScroll=scrollY;document.dispatchEvent(new Event('library-open'));document.body.classList.add('library-open');$('library').hidden=false;document.title='MusicTranspose · Library';render();window.scrollTo({top:libraryScroll,behavior:'instant'});$('library-search').focus({preventScroll:true});}
 function resume(){if(!current)return;libraryScroll=scrollY;showScore();window.scrollTo({top:scoreScroll,behavior:'instant'});$('songs').focus({preventScroll:true});}
 function open(id){if(isBusy())return;libraryScroll=scrollY;if(id===current){resume();return;}loadSong(id);}
 function updateListSelect(){const selected=$('library-list').value;$('library-list').replaceChildren(new Option('All lists',''));for(const g of state.groups)$('library-list').append(new Option(g.name,g.id));$('library-list').value=state.groups.some(g=>g.id===selected)?selected:'';}
 function render(){
  const query=normalize($('library-search').value.trim()),group=state.groups.find(g=>g.id===$('library-list').value),sort=$('library-sort').value;
  let found=songs.filter(s=>(!query||query.split(/\s+/).every(word=>searchIndex.get(s.id).includes(word)))&&(!group||group.songs.includes(s.id))&&(filter==='all'||filter==='favorites'&&state.favorites.includes(s.id)||filter==='recent'&&state.recent.includes(s.id)||s.tags.includes(filter)||s.collection===filter||s.collectionMemberships.some(m=>m.collection===filter)));
  const title=(a,b)=>collator.compare(a.title,b.title),recent=s=>{const i=state.recent.indexOf(s.id);return i<0?Infinity:i;};
  found.sort((a,b)=>(sort==='number'?collator.compare(a.page,b.page):sort==='collection'?collator.compare(a.collection,b.collection):sort==='recent'?recent(a)-recent(b):0)||title(a,b));
  const fragment=document.createDocumentFragment();
  for(const s of found){
   const row=node('div',null,'library-row');row.dataset.song=s.id;
   const favorite=state.favorites.includes(s.id),star=button(favorite?'★':'☆',(favorite?'Remove favorite: ':'Favorite: ')+s.title,()=>{state.favorites=favorite?state.favorites.filter(id=>id!==s.id):[...state.favorites,s.id];save();render();const replacement=$('library-results').querySelector(`[data-song="${s.id}"] .favorite`);(replacement||$('library-search')).focus({preventScroll:true});});star.classList.add('favorite');star.setAttribute('aria-pressed',String(favorite));
   const entry=button('', 'Open '+s.title,()=>open(s.id));entry.className='song-entry';entry.append(node('strong',s.title),node('span',`${s.collection} · ${s.page} · ${s.tonic} ${s.mode}`,'song-meta'));
   if(s.id===current){row.classList.add('current-song');entry.append(node('span','Open · Return to score','current-label'));}
   const lists=button('＋','Lists for '+s.title,()=>openLists(s.id));lists.classList.add('song-lists');lists.title='Add to lists';
   row.append(star,entry,lists);fragment.append(row);
  }
  if(!found.length)fragment.append(node('p','No songs match. Try another search, filter, or list.','empty-library'));
  $('library-results').replaceChildren(fragment);$('library-count').textContent=`${found.length} ${found.length===1?'song':'songs'}`;
  $('resume-score').hidden=!current;if(current)$('resume-score').textContent='Return to '+songs.find(s=>s.id===current).title;
  for(const b of $('library-filters').children)b.setAttribute('aria-pressed',String(b.dataset.filter===filter));
 }
 for(const [value,label] of [['all','All'],['favorites','Favorites'],['recent','Recently Played'],['Primary','Primary'],['Christmas','Christmas'],...collectionNames.map(c=>[c,c])]){
  const b=button(label,null,()=>{filter=value;render();});b.dataset.filter=value;$('library-filters').append(b);
 }
 function openLists(id=null){target=id;$('lists-title').textContent=id?'Lists for '+songs.find(s=>s.id===id).title:'My lists';$('lists-hint').textContent=id?'Choose any number of personal lists. Source collections stay unchanged.':'Create lists for occasions, practice, arranging, or anything you need.';$('list-message').textContent='';renderGroups();$('lists-dialog').showModal();$('new-list-name').focus();}
 function renderGroups(){
  $('personal-lists').replaceChildren();
  for(const g of state.groups){const row=node('div',null,'personal-list');
   if(target){const label=node('label'),check=document.createElement('input');check.type='checkbox';check.checked=g.songs.includes(target);check.onchange=()=>{g.songs=check.checked?[...new Set([...g.songs,target])]:g.songs.filter(id=>id!==target);save();render();};label.append(check,node('span',g.name));row.append(label);}
   else{const input=document.createElement('input');input.value=g.name;input.maxLength=80;input.setAttribute('aria-label','List name: '+g.name);const rename=button('Save','Rename '+g.name,()=>{const name=input.value.trim();if(!name){$('list-message').textContent='Enter a list name.';return;}if(state.groups.some(x=>x.id!==g.id&&normalize(x.name)===normalize(name))){$('list-message').textContent='That list name already exists.';return;}g.name=name;save();updateListSelect();render();renderGroups();$('list-message').textContent='List renamed.';});const remove=button('Delete','Delete list '+g.name,()=>{state.groups=state.groups.filter(x=>x.id!==g.id);save();updateListSelect();render();renderGroups();$('list-message').textContent='List deleted. Songs remain in the Library.';});row.append(input,rename,remove);}
   $('personal-lists').append(row);
  }
  if(!state.groups.length)$('personal-lists').append(node('p','No personal lists yet. Create your first one above.'));
 }
 $('create-list').onsubmit=e=>{e.preventDefault();const name=$('new-list-name').value.trim();if(!name)return;if(state.groups.some(g=>normalize(g.name)===normalize(name))){$('list-message').textContent='That list already exists.';return;}state.groups.push({id:crypto.randomUUID(),name,songs:target?[target]:[]});$('new-list-name').value='';save();updateListSelect();renderGroups();render();$('list-message').textContent=target?'List created and song added.':'List created.';};
 $('manage-lists').onclick=()=>openLists();$('close-lists').onclick=()=>$('lists-dialog').close();
 $('library-search').oninput=render;$('library-sort').onchange=render;$('library-list').onchange=render;$('resume-score').onclick=resume;$('songs').onclick=showLibrary;
 updateListSelect();render();
 return {showScore,opened(id){current=id;state.recent=[id,...state.recent.filter(x=>x!==id)].slice(0,30);save();render();},failed(){document.body.classList.add('library-open');$('library').hidden=false;document.title='MusicTranspose · Library';render();$('library-message').textContent='Unable to open this score. Please try again when its bundled file is available.';}};
}
