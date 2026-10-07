// PrimarySongs renderCards/renderItemList pattern: one reusable Text collection,
// compact title rows, shared Favorites, edit actions and independent List memberships.
import {editIcon,favoriteIcon,listsIcon,filesIcon} from './icons.js';
const $=id=>document.getElementById(id);
const el=(tag,text,cls)=>{const e=document.createElement(tag);if(text)e.textContent=text;if(cls)e.className=cls;return e;};
const button=(label,action,cls)=>{const b=el('button',label,cls);b.type='button';b.onclick=action;return b;};
export function createTextsView({getState,save,edit,read,onHome,onFiles,onLists,onChanged,clearUndo}){
 let membership=null;
 for(const [id,label,icon] of [['texts-home','Library',$('songs').innerHTML],['texts-files','Files',filesIcon],['texts-lists','Lists',listsIcon]]){const control=$(id);control.innerHTML=icon;control.setAttribute('aria-label',label);control.title=label;control.classList.add('text-navigation-icon');}
 const item=id=>getState().textItems[id];
 function changed(){onChanged();render();}
 function favorite(id){const state=getState(),previous=state.favorites;state.favorites=previous.includes(id)?previous.filter(x=>x!==id):[...previous,id];if(!save()){state.favorites=previous;$('texts-status').textContent='Could not save Favorite. Please retry.';return;}changed();}
 function memberships(id){membership=id;const host=$('text-membership-rows');host.replaceChildren();$('text-memberships-title').textContent='Lists · '+item(id).title;$('text-memberships-error').textContent='';for(const g of getState().groups){const label=el('label',null,'list-membership-row'),check=el('input');check.type='checkbox';check.dataset.list=g.id;check.checked=g.songs.includes(id);label.append(check,document.createTextNode(g.name));host.append(label);}if(!host.children.length)host.append(el('p','Create a List first.'));$('text-memberships').showModal();}
 $('text-memberships-cancel').onclick=()=>$('text-memberships').close();
 $('text-memberships-form').onsubmit=e=>{e.preventDefault();const groups=getState().groups,previous=groups.map(g=>[g,[...g.songs]]);for(const check of $('text-membership-rows').querySelectorAll('input')){const g=groups.find(g=>g.id===check.dataset.list);if(!g)continue;if(check.checked&&!g.songs.includes(membership))g.songs.push(membership);else if(!check.checked)g.songs=g.songs.filter(id=>id!==membership);}if(!save()){for(const [g,songs] of previous)g.songs=songs;$('text-memberships-error').textContent='Could not save memberships. Please retry.';return;}$('text-memberships').close();changed();};
 function deleteItem(id){const state=getState(),text=item(id);if(!text)return false;const used=state.groups.filter(g=>g.songs.includes(id));if(!confirm('Delete “'+text.title+'” from this device? This also removes it from Favorites and '+used.length+' Lists. This cannot be undone.'))return false;const favorites=state.favorites,orders=used.map(g=>[g,[...g.songs]]);delete state.textItems[id];state.favorites=state.favorites.filter(x=>x!==id);for(const g of used)g.songs=g.songs.filter(x=>x!==id);if(!save()){state.textItems[id]=text;state.favorites=favorites;for(const [g,songs] of orders)g.songs=songs;alert('Could not save the deletion. Your Text has been kept.');return false;}clearUndo();changed();return true;}
 function render(){if($('texts-view').hidden)return;const state=getState(),query=$('texts-search').value.trim().toLocaleLowerCase(),favorites=$('texts-favorites').checked,host=$('texts-items');host.replaceChildren();$('texts-context').textContent='Your reusable Text items';
  const items=Object.entries(state.textItems).filter(([,item])=>item?.type==='text').sort((a,b)=>a[1].title.localeCompare(b[1].title,undefined,{numeric:true}));
  for(const [id,item] of items){if(query&&!item.title.toLocaleLowerCase().includes(query)||favorites&&!state.favorites.includes(id))continue;const row=el('div',null,'text-library-row');row.dataset.text=id;
   const star=button('',()=>favorite(id),'list-icon favorite');star.innerHTML=favoriteIcon;star.setAttribute('aria-pressed',String(state.favorites.includes(id)));star.setAttribute('aria-label','Favorite Text: '+item.title);star.title='Favorite';
   const used=state.groups.filter(g=>g.songs.includes(id)).length,entry=button('',()=>read(id),'text-library-entry');entry.append(el('strong',item.title),el('span','Text · '+used+' '+(used===1?'List':'Lists'),'song-meta'));
   const pencil=button('',()=>edit(null,id),'list-icon');pencil.innerHTML=editIcon;pencil.title='Edit Text';pencil.setAttribute('aria-label','Edit Text: '+item.title);
   const lists=button('',()=>memberships(id),'list-icon');lists.innerHTML=listsIcon;lists.title='Used in Lists';lists.setAttribute('aria-label','Lists for '+item.title);row.append(star,entry,pencil,lists);host.append(row);
  }
  if(!host.children.length)host.append(el('p',items.length?'No Text matches.':'No Text yet. Choose New Text to get started.'));
 }
 $('texts-new').onclick=()=>edit(null,null);$('texts-search').oninput=render;$('texts-favorites').onchange=render;
 $('texts-home').onclick=onHome;$('texts-files').onclick=onFiles;$('texts-lists').onclick=()=>onLists();document.addEventListener('text-items-changed',render);
 return {deleteItem,render,open(){$('texts-search').value='';$('texts-status').textContent='';$('texts-view').hidden=false;document.title='Text · MusicTranspose';render();window.scrollTo(0,0);$('texts-heading').focus({preventScroll:true});},hide(){$('texts-view').hidden=true;}};
}
