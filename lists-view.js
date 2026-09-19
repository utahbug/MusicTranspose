import {songs} from './catalog.js';
import {songSearchText,normalizeSearch} from './songs.js';
import {sourceChoices,matchesSource} from './library-query.js';
import {lyricIds} from './lyrics-index.js';
import {attachReorderHandle} from './list-reorder.js';
const $=id=>document.getElementById(id);
const el=(tag,text,cls)=>{const e=document.createElement(tag);if(text)e.textContent=text;if(cls)e.className=cls;return e;};
const button=(text,label,action)=>{const e=el('button',text,'quiet');e.type='button';e.setAttribute('aria-label',label);e.onclick=action;return e;};
export function createListsView({getState,save,onLibrary,onSong}){
 let active=null,picking=false,selected=new Set(),naming=null,position=0,saveFailed=false;
 const group=()=>getState().groups.find(g=>g.id===active);
 const persist=()=>{saveFailed=save()===false;};
 const announce=text=>$('lists-status').textContent=saveFailed?'Browser storage is unavailable. Changes last only while this page is open.':text;
 function focusHeading(){$('lists-heading').focus({preventScroll:true});}
 function open(){document.body.classList.add('library-open');$('library').hidden=true;$('lists-view').hidden=false;render();window.scrollTo({top:position,behavior:'instant'});focusHeading();}
 function hide(){if(!$('lists-view').hidden)position=scrollY;$('lists-view').hidden=true;}
 function enter(id){active=id;picking=false;position=0;announce('');render();window.scrollTo(0,0);focusHeading();}
 function nameDialog(id=null){naming=id;$('list-name-heading').textContent=id?'Rename list':'New list';$('list-name-input').value=id?group().name:'';$('list-name-error').textContent='';$('list-name-dialog').showModal();$('list-name-input').focus();}
 $('list-name-cancel').onclick=()=>$('list-name-dialog').close();
 $('list-name-form').onsubmit=e=>{e.preventDefault();const name=$('list-name-input').value.trim();if(!name)return;const state=getState();if(state.groups.some(g=>g.id!==naming&&normalizeSearch(g.name)===normalizeSearch(name))){$('list-name-error').textContent='That list name already exists.';return;}
  if(naming){const g=state.groups.find(g=>g.id===naming);if(!g)return;g.name=name;}else{active=crypto.randomUUID();state.groups.push({id:active,name,songs:[]});}persist();$('list-name-dialog').close();enter(active);announce(naming?'List renamed.':'List created.');
 };
 function move(id,to,before=true){const g=group();if(!g||id===to)return;const from=g.songs.indexOf(id);if(from<0||!g.songs.includes(to))return;g.songs.splice(from,1);g.songs.splice(g.songs.indexOf(to)+(before?0:1),0,id);persist();render();announce('Song moved. Order saved.');$('list-songs').querySelector(`[data-song="${CSS.escape(id)}"] .reorder-grip`)?.focus({preventScroll:true});}
 function openSong(id,lyrics=false){position=scrollY;onSong(id,lyrics);}
 function renderPicker(){const g=group();$('lists-back').textContent='‹ Back to list';$('lists-heading').textContent='Add songs';$('lists-context').textContent=g.name;$('list-picker').hidden=false;
  const query=normalizeSearch($('list-picker-search').value),source=$('list-picker-source').value,favorites=$('list-picker-favorites').checked;
  const found=songs.filter(s=>matchesSource(s,source)&&(!favorites||getState().favorites.includes(s.id))&&query.split(/\s+/).every(word=>(songSearchText(s)+' '+normalizeSearch(s.originalFilename||'')).includes(word)));
  const host=$('list-picker-results');host.replaceChildren();
  for(const s of found){const label=el('label',null,'list-picker-row'),check=document.createElement('input');check.type='checkbox';check.dataset.song=s.id;const exists=g.songs.includes(s.id);check.checked=exists||selected.has(s.id);check.disabled=exists;check.setAttribute('aria-label',(exists?'Already in list: ':'Add: ')+s.title);check.onchange=()=>{if(check.checked)selected.add(s.id);else selected.delete(s.id);$('list-picker-done').textContent=selected.size?'Add '+selected.size+' · Done':'Done';};const text=el('span');text.append(el('strong',s.title),el('span',[s.collection,s.page,exists?'Already in list':''].filter(Boolean).join(' · '),'song-meta'));label.append(check,text);host.append(label);}
  if(!found.length)host.append(el('p','No songs match. Try another search or source.'));$('list-picker-count').textContent=found.length+' songs';
 }
 function render(){const state=getState(),g=group();if(active&&!g)active=null;const controls=$('lists-actions'),content=$('list-songs');controls.replaceChildren();content.replaceChildren();$('list-picker').hidden=true;$('lists-overview').replaceChildren();$('lists-back').hidden=!active&&!picking;$('lists-back').textContent=active?'‹ Lists':'‹ Library';if(!$('lists-view').hidden)document.title='Lists · MusicTranspose';
  if(picking&&g){renderPicker();return;}
  if(!g){$('lists-heading').textContent='Lists';$('lists-context').textContent=state.groups.length+' personal '+(state.groups.length===1?'list':'lists');controls.append(button('+ New List','New list',()=>nameDialog()));
   for(const list of state.groups){const row=button('','Open list '+list.name+', '+list.songs.length+' songs',()=>enter(list.id));row.classList.add('list-overview-row');row.dataset.list=list.id;row.append(el('strong',list.name),el('span',list.songs.length+' '+(list.songs.length===1?'song':'songs')));$('lists-overview').append(row);}
   if(!state.groups.length)$('lists-overview').append(el('p','No lists yet. Create a list to organize your music.'));return;
  }
  $('lists-heading').textContent=g.name;$('lists-context').textContent=g.songs.length+' '+(g.songs.length===1?'song':'songs')+' · Saved order';
  controls.append(button('Add songs','Add songs',()=>{selected=new Set();picking=true;announce('');$('list-picker-search').value='';$('list-picker-source').value='all';$('list-picker-favorites').checked=false;$('list-picker-done').textContent='Done';render();$('list-picker-search').focus();}));
  const manage=el('details',null,'list-manage');manage.append(el('summary','Manage'));manage.append(button('Rename','Rename list',()=>nameDialog(g.id)),button('Delete','Delete list',()=>{if(!confirm('Delete “'+g.name+'”? Songs, Favorites and imported files will remain.'))return;state.groups=state.groups.filter(x=>x.id!==g.id);persist();enter(null);announce('List deleted. Songs remain in the Library.');}));controls.append(manage);
  g.songs.forEach((id,index)=>{const song=songs.find(s=>s.id===id),title=song?.title||'Unavailable song',row=el('li',null,'list-song-row');row.dataset.song=id;
   const grip=button('⠿','Drag to reorder '+title,()=>{});grip.classList.add('reorder-grip');attachReorderHandle(grip,row,content,(to,before)=>move(id,to,before));
   const entry=button('','Open score: '+title,()=>openSong(id));entry.classList.add('list-song-title');entry.disabled=!song;entry.append(el('strong',(index+1)+'. '+title));entry.append(el('span',song?[song.collection,song.page].filter(Boolean).join(' · '):'Retained in saved order; source is not currently available.','song-meta'));
   const actions=el('div',null,'list-song-actions');if(lyricIds.has(id)){const lyrics=button('','Open lyrics: '+title,()=>openSong(id,true));lyrics.innerHTML='<svg class="lyrics-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M3 6v12h5M12 6h9M12 10h7M12 14h9M12 18h6"/></svg>';actions.append(lyrics);}
   const up=button('↑','Move up: '+title,()=>move(id,g.songs[index-1],true));up.disabled=index===0;const down=button('↓','Move down: '+title,()=>move(id,g.songs[index+1],false));down.disabled=index===g.songs.length-1;
   actions.append(up,down,button('−','Remove from this list: '+title,()=>{g.songs=g.songs.filter(x=>x!==id);persist();render();announce(title+' removed from this list.');const next=content.children[Math.min(index,content.children.length-1)];(next?.querySelector('.list-song-title')||$('lists-heading')).focus({preventScroll:true});}));row.append(grip,entry,actions);content.append(row);
  });if(!g.songs.length)content.append(el('li','No songs yet. Choose Add songs to get started.','list-empty'));
 }
 $('lists-back').onclick=()=>{if(picking){picking=false;render();focusHeading();}else if(active)enter(null);else onLibrary();};$('lists-library').onclick=onLibrary;
 for(const id of ['list-picker-search','list-picker-source','list-picker-favorites'])$(id).addEventListener(id==='list-picker-search'?'input':'change',renderPicker);
 for(const [value,label] of sourceChoices)$('list-picker-source').append(new Option(label,value));
 $('list-picker-done').onclick=()=>{const g=group();if(!g)return;const valid=new Set(songs.map(s=>s.id)),added=[...selected].filter(id=>valid.has(id)&&!g.songs.includes(id));g.songs.push(...added);persist();picking=false;render();focusHeading();announce(added.length+' songs added.');};
 return {open,hide,render,get active(){return active;}};
}
