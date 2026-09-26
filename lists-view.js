import {songs} from './catalog.js';
import {songSearchText,normalizeSearch} from './songs.js';
import {sourceChoices,matchesSource} from './library-query.js';
const $=id=>document.getElementById(id);
const el=(tag,text,cls)=>{const e=document.createElement(tag);if(text)e.textContent=text;if(cls)e.className=cls;return e;};
const button=(text,label,action)=>{const e=el('button',text,'quiet');e.type='button';e.setAttribute('aria-label',label);e.onclick=action;return e;};
// Only overview/management and selection live here. Active songs use Library rows.
export function createListsView({getState,save,onLibrary,onSelect,onAdded,onChanged}){
 let picking=null,selected=new Set(),naming=null;
 const group=id=>getState().groups.find(g=>g.id===id);
 const announce=text=>$('lists-status').textContent=text;
 const heading=()=>$('lists-heading').focus({preventScroll:true});
 // Keep completion above a mobile keyboard that shrinks only the visual viewport.
 function syncPickerViewport(){const viewport=window.visualViewport,inset=picking&&!$('lists-view').hidden&&viewport?Math.max(0,innerHeight-viewport.height-viewport.offsetTop):0;document.documentElement.style.setProperty('--list-keyboard-inset',inset+'px');}
 window.visualViewport?.addEventListener('resize',syncPickerViewport);window.visualViewport?.addEventListener('scroll',syncPickerViewport);window.addEventListener('resize',syncPickerViewport);
 function hide(){$('lists-view').hidden=true;document.body.classList.remove('list-picker-open');syncPickerViewport();}
 function show(){document.body.classList.add('library-open');$('library').hidden=true;$('lists-view').hidden=false;render();window.scrollTo({top:0,behavior:'instant'});heading();}
 function open(){picking=null;show();}
 function pick(id,reset=true){if(!group(id)){onLibrary();return;}if(reset||picking!==id){selected.clear();$('list-picker-search').value='';$('list-picker-source').value='all';$('list-picker-favorites').checked=false;}picking=id;show();}
 function name(id=null){naming=id;$('list-name-heading').textContent=id?'Rename list':'New list';$('list-name-input').value=group(id)?.name||'';$('list-name-error').textContent='';$('list-name-dialog').showModal();$('list-name-input').focus();}
 function remove(id){const g=group(id);if(!g||!confirm('Delete “'+g.name+'”? Songs remain in the Library.'))return;getState().groups=getState().groups.filter(g=>g.id!==id);const saved=save();onChanged();render();announce(saved?'List deleted. Songs remain in the Library.':'Changes last only while this page is open.');}
 $('list-name-cancel').onclick=()=>$('list-name-dialog').close();
 $('list-name-form').onsubmit=e=>{e.preventDefault();const title=$('list-name-input').value.trim(),state=getState();if(!title){$('list-name-error').textContent='Enter a list name.';return;}if(state.groups.some(g=>g.id!==naming&&normalizeSearch(g.name)===normalizeSearch(title))){$('list-name-error').textContent='That list name already exists.';return;}
  const created=!naming,id=naming||crypto.randomUUID();if(created)state.groups.push({id,name:title,songs:[]});else{const g=group(id);if(!g)return;g.name=title;}const saved=save();$('list-name-dialog').close();onChanged();if(created)onSelect(id);else{render();const target=$('lists-view').hidden?$('active-list-options'):$('lists-overview').querySelector(`[data-list="${CSS.escape(id)}"] .list-overview-entry`);target?.focus({preventScroll:true});}if(!saved)announce('Changes last only while this page is open.');
 };
 function selectionAction(){$('list-picker-done').textContent=selected.size+' selected — Add to list';$('list-picker-done').disabled=!selected.size;}
 function renderPicker(){const g=group(picking);if(!g){picking=null;render();return;}$('lists-heading').textContent='Add songs';$('lists-context').textContent=g.name;$('list-picker-target').textContent='To: '+g.name;$('list-picker-target').title=g.name;$('lists-back').hidden=false;$('lists-back').textContent='‹ Back to list';$('list-picker').hidden=false;
  const query=normalizeSearch($('list-picker-search').value),source=$('list-picker-source').value,favorites=$('list-picker-favorites').checked;
  const found=songs.filter(s=>matchesSource(s,source)&&(!favorites||getState().favorites.includes(s.id))&&query.split(/\s+/).every(word=>(songSearchText(s)+' '+normalizeSearch(s.originalFilename||'')).includes(word)));
  const host=$('list-picker-results');host.replaceChildren();
  for(const s of found){const label=el('label',null,'list-picker-row'),check=document.createElement('input');check.type='checkbox';check.dataset.song=s.id;const exists=g.songs.includes(s.id);check.checked=exists||selected.has(s.id);check.disabled=exists;check.setAttribute('aria-label',(exists?'Already in list: ':'Add: ')+s.title);check.onchange=()=>{if(check.checked)selected.add(s.id);else selected.delete(s.id);selectionAction();};const text=el('span');text.append(el('strong',s.title),el('span',[s.collection,s.page,exists?'Already in list':''].filter(Boolean).join(' · '),'song-meta'));label.append(check,text);host.append(label);}
  if(!found.length)host.append(el('p','No songs match. Try another search or source.'));$('list-picker-count').textContent=found.length+' songs';selectionAction();
 }
 function render(){if($('lists-view').hidden)return;const controls=$('lists-actions');controls.replaceChildren();$('lists-overview').replaceChildren();$('list-picker').hidden=true;document.body.classList.toggle('list-picker-open',!!picking);syncPickerViewport();document.title='Lists · MusicTranspose';if(picking){renderPicker();return;}
  $('lists-heading').textContent='All Lists';$('lists-context').textContent=getState().groups.length+' personal '+(getState().groups.length===1?'list':'lists');$('lists-back').hidden=true;controls.append(button('+ New List','New list',()=>name()));
  for(const g of getState().groups){const row=el('div',null,'list-overview-row');row.dataset.list=g.id;const entry=button('','Open list '+g.name,()=>onSelect(g.id));entry.classList.add('list-overview-entry');entry.append(el('strong',g.name),el('span',g.songs.length+' '+(g.songs.length===1?'song':'songs')));row.append(entry,button('Rename','Rename list: '+g.name,()=>name(g.id)),button('Delete','Delete list: '+g.name,()=>remove(g.id)));$('lists-overview').append(row);}
  if(!getState().groups.length)$('lists-overview').append(el('p','No lists yet. Create a list to organize your music.'));
 }
 const cancel=()=>{const id=picking;picking=null;selected.clear();onSelect(id);};
 $('lists-back').onclick=cancel;$('list-picker-cancel').onclick=cancel;$('lists-library').onclick=onLibrary;
 for(const id of ['list-picker-search','list-picker-source','list-picker-favorites'])$(id).addEventListener(id==='list-picker-search'?'input':'change',renderPicker);
 for(const [value,label] of sourceChoices)$('list-picker-source').append(new Option(label,value));
 $('list-picker-done').onclick=()=>{const g=group(picking);if(!g)return;const valid=new Set(songs.map(s=>s.id)),added=[...selected].filter(id=>valid.has(id)&&!g.songs.includes(id));if(!added.length)return;g.songs.push(...added);const saved=save(),id=picking;picking=null;selected.clear();onChanged();onAdded(id,added,saved);};
 return {open,pick,hide,render,name,remove};
}
