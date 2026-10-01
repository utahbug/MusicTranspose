import {musicIcon} from './icons.js';
import {lyricIds} from './lyrics-index.js';
export {lyricIds};
let pending;
export async function getLyrics(id){
 if(!lyricIds.has(id))return null;
 if(!pending)pending=fetch(new URL('./assets/lyrics.json',import.meta.url)).then(r=>{if(!r.ok)throw new Error('Lyrics unavailable');return r.json();}).then(data=>new Map(data.songs.map(song=>[song.id,song]))).catch(e=>{pending=null;throw e;});
 return (await pending).get(id);
}
const appearanceKey='music-transpose-lyrics-appearance-v1';
const sizes=['small','medium','large','extra-large'],sizeNames=['Small','Medium','Large','Extra Large'];
function readAppearance(){try{const p=JSON.parse(localStorage.getItem(appearanceKey))||{};return {dark:typeof p.dark==='boolean'?p.dark:false,size:Number.isInteger(p.size)&&p.size>=0&&p.size<=3?p.size:0};}catch{return {dark:false,size:0};}}
// The same Library node keeps its shared navigation handler and accessible name.
export function createLyricsView(host,{onScore,libraryControl}){
 let {size,dark}=readAppearance(),current=null,libraryHome=null,listeners=null;
 const saveAppearance=()=>{try{localStorage.setItem(appearanceKey,JSON.stringify({dark,size}));}catch{}};
 function restoreLibrary(){if(libraryHome){libraryHome.parent.insertBefore(libraryControl,libraryHome.next?.parentNode===libraryHome.parent?libraryHome.next:null);libraryHome=null;}}
 function dispose(){listeners?.abort();listeners=null;restoreLibrary();}
 const make=(tag,text,cls)=>{const e=document.createElement(tag);if(text)e.textContent=text;if(cls)e.className=cls;return e;};
 const button=(text,label,fn)=>{const e=make('button',text,'quiet');e.type='button';e.setAttribute('aria-label',label);e.title=label;e.onclick=fn;return e;};
 function draw(){
 dispose();host.replaceChildren();host.classList.toggle('lyrics-dark',dark);host.dataset.size=sizes[size];
 const tools=make('div',null,'lyrics-tools');tools.setAttribute('role','group');tools.setAttribute('aria-label','Lyrics controls');
 const theme=button('',dark?'Use light background':'Use dark background',()=>{dark=!dark;saveAppearance();host.classList.toggle('lyrics-dark',dark);theme.setAttribute('aria-pressed',String(dark));theme.title=dark?'Use light background':'Use dark background';theme.setAttribute('aria-label',theme.title);});theme.innerHTML='<span class="pdf-mobile-theme-swatch" aria-hidden="true"></span>';theme.setAttribute('aria-pressed',String(dark));
 const fontWrap=make('div',null,'lyrics-font-wrap'),menu=make('div',null,'lyrics-font-menu');menu.id='lyrics-font-options';menu.hidden=true;menu.setAttribute('role','menu');menu.setAttribute('aria-label','Lyrics text size');
 const closeFont=(focus=false)=>{menu.hidden=true;font.setAttribute('aria-expanded','false');if(focus)font.focus({preventScroll:true});};
 const openFont=()=>{menu.hidden=false;font.setAttribute('aria-expanded','true');const r=font.getBoundingClientRect();menu.style.left=Math.max(8,Math.min(r.right-menu.offsetWidth,innerWidth-menu.offsetWidth-8))+'px';menu.style.top=Math.max(8,r.top-menu.offsetHeight-8)+'px';menu.querySelector('[aria-checked=true]').focus({preventScroll:true});};
 const font=button('','Lyrics text size',()=>menu.hidden?openFont():closeFont(true));font.id='lyrics-font-size';font.textContent=['A','A+','A++'][Math.min(size,2)];font.setAttribute('aria-haspopup','menu');font.setAttribute('aria-expanded','false');font.setAttribute('aria-controls',menu.id);
 for(const [index,name] of sizeNames.entries()){const option=button(name,name,()=>{size=index;saveAppearance();host.dataset.size=sizes[size];for(const [i,item] of [...menu.children].entries())item.setAttribute('aria-checked',String(i===size));font.textContent=['A','A+','A++'][Math.min(size,2)];font.title='Lyrics text size: '+sizeNames[size];closeFont(true);});option.setAttribute('role','menuitemradio');option.setAttribute('aria-checked',String(index===size));menu.append(option);}
 font.title='Lyrics text size: '+sizeNames[size];fontWrap.append(font,menu);
 font.addEventListener('keydown',e=>{if(['ArrowDown','ArrowUp'].includes(e.key)){e.preventDefault();openFont();}});
 menu.addEventListener('keydown',e=>{e.stopPropagation();const items=[...menu.children],i=items.indexOf(document.activeElement);if(e.key==='Escape'){e.preventDefault();closeFont(true);}else if(['ArrowDown','ArrowUp','Home','End'].includes(e.key)){e.preventDefault();items[e.key==='Home'?0:e.key==='End'?items.length-1:(i+(e.key==='ArrowDown'?1:-1)+items.length)%items.length].focus();}});
 listeners=new AbortController();const options={signal:listeners.signal};
 document.addEventListener('pointerdown',e=>{if(!fontWrap.contains(e.target))closeFont();},options);
 document.addEventListener('focusin',e=>{if(!fontWrap.contains(e.target))closeFont();},options);
 document.addEventListener('keydown',e=>{if(!menu.hidden&&e.key==='Escape'){e.preventDefault();e.stopPropagation();closeFont(true);}},options);
 for(const event of ['resize','scroll','beforeprint'])window.addEventListener(event,()=>closeFont(),options);
 const scoreToggle=button('','View Score',onScore);scoreToggle.classList.add('lyrics-score-toggle','view-switch');scoreToggle.innerHTML=musicIcon;
 tools.append(theme,fontWrap,scoreToggle);
 const footer=make('div',null,'lyrics-footer');
 libraryHome={parent:libraryControl.parentNode,next:libraryControl.nextSibling};footer.append(libraryControl,tools);host.append(footer);
 const header=make('header',null,'lyrics-identity-header');header.append(make('h1',current.title),make('p',current.collection+' · '+current.number,'lyrics-source'));const paper=make('div',null,'lyrics-paper');paper.append(header);host.append(paper);
 if(current.notes.length)paper.append(make('p','Shared ending shown separately; consult the score for repeats.','lyrics-notice'));
 const body=make('div',null,'lyrics-body');
 for(const verse of current.verses){const block=make('section');block.append(make('h2','Verse '+verse.number),make('p',verse.text));body.append(block);}
 for(const refrain of current.refrains){const block=make('section',null,'lyrics-refrain');block.append(make('h2',refrain.label||'Refrain'),make('p',refrain.text));body.append(block);}
 paper.append(body);
 const heading=header.querySelector('h1');heading.tabIndex=-1;
 }
 return {show(data){({size,dark}=readAppearance());current=data;draw();host.hidden=false;host.querySelector('h1').focus({preventScroll:true});},hide(){dispose();host.hidden=true;},reset(){dispose();({size,dark}=readAppearance());current=null;host.hidden=true;}};
}
