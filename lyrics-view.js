import {attachLyricsHold} from './lyrics-hold.js';
import {createLyricsFun} from './lyrics-fun.js';
import {lyricIds} from './lyrics-index.js';
export {lyricIds};
let pending;
export async function getLyrics(id){
 if(!lyricIds.has(id))return null;
 if(!pending)pending=fetch(new URL('./assets/lyrics.json',import.meta.url)).then(r=>{if(!r.ok)throw new Error('Lyrics unavailable');return r.json();}).then(data=>new Map(data.songs.map(song=>[song.id,song]))).catch(e=>{pending=null;throw e;});
 return (await pending).get(id);
}
// Fun activation is view-scoped; retain the existing note-count preference.
const funPreferenceKey='music-transpose-lyrics-fun-v1',appearanceKey='music-transpose-lyrics-appearance-v1';
function readFunCount(){try{const p=JSON.parse(localStorage.getItem(funPreferenceKey))||{};return Number.isInteger(p.count)&&p.count>=1&&p.count<=4?p.count:4;}catch{return 4;}}
function readAppearance(){try{const p=JSON.parse(localStorage.getItem(appearanceKey))||{};return {dark:typeof p.dark==='boolean'?p.dark:true,size:Number.isInteger(p.size)&&p.size>=0&&p.size<=2?p.size:1};}catch{return {dark:true,size:1};}}
// The same Library node keeps its shared navigation handler and accessible name.
export function createLyricsView(host,{onScore,libraryControl}){
 let {size,dark}=readAppearance(),current=null,fun=false,noteLimit=readFunCount(),stopFun=null,stopHold=null,libraryHome=null;
 const saveAppearance=()=>{try{localStorage.setItem(appearanceKey,JSON.stringify({dark,size}));}catch{}};
 const saveFun=()=>{try{localStorage.setItem(funPreferenceKey,JSON.stringify({enabled:false,count:noteLimit}));}catch{}};
 const cleanup=()=>{stopFun?.();stopFun=null;};
 function restoreLibrary(){if(libraryHome){libraryHome.parent.insertBefore(libraryControl,libraryHome.next?.parentNode===libraryHome.parent?libraryHome.next:null);libraryHome=null;}}
 function dispose(){stopHold?.();stopHold=null;host.querySelector('dialog')?.close();cleanup();fun=false;host.classList.remove('lyrics-fun-active');restoreLibrary();}
 const make=(tag,text,cls)=>{const e=document.createElement(tag);if(text)e.textContent=text;if(cls)e.className=cls;return e;};
 const button=(text,label,fn)=>{const e=make('button',text,'quiet');e.type='button';e.setAttribute('aria-label',label);e.title=label;e.onclick=fn;return e;};
 function draw(){
 dispose();host.replaceChildren();host.classList.toggle('lyrics-dark',dark);host.dataset.size=['small','medium','large'][size];
 const top=make('div',null,'lyrics-top'),tools=make('div',null,'lyrics-tools');
 const theme=button('◐',dark?'Use light background':'Use dark background',()=>{dark=!dark;saveAppearance();host.classList.toggle('lyrics-dark',dark);theme.setAttribute('aria-pressed',String(dark));theme.title=dark?'Use light background':'Use dark background';theme.setAttribute('aria-label',theme.title);});theme.setAttribute('aria-pressed',String(dark));
 tools.append(theme,button(['A','A+','A++'][size],'Lyrics font size: '+['Small','Medium','Large'][size],()=>{size=(size+1)%3;saveAppearance();host.dataset.size=['small','medium','large'][size];const control=host.querySelectorAll('.lyrics-tools button')[1];control.textContent=['A','A+','A++'][size];control.title='Lyrics font size: '+['Small','Medium','Large'][size];control.setAttribute('aria-label',control.title);}));const funPanel=make('dialog',null,'fun-settings');funPanel.setAttribute('aria-label','Lyrics Fun settings');
 const footer=make('div',null,'lyrics-footer');
 libraryHome={parent:libraryControl.parentNode,next:libraryControl.nextSibling};footer.append(libraryControl);
 const stop=button('Stop','Stop Fun',()=>{fun=false;funPanel.close();cleanup();stop.hidden=true;host.classList.remove('lyrics-fun-active');host.querySelector('h1').focus({preventScroll:true});});stop.classList.add('lyrics-fun-stop');stop.hidden=true;footer.append(stop);host.append(footer);
 const count=make('select');count.setAttribute('aria-label','Notes on screen');for(let i=1;i<=4;i++){const option=make('option',String(i));option.value=i;count.append(option);}count.value=noteLimit;
 const countLabel=make('label','Notes on screen');countLabel.append(count);
 count.onchange=()=>{noteLimit=Number(count.value);saveFun();stopFun?.setLimit(noteLimit);};
 funPanel.append(make('h2','Lyrics Fun'),countLabel,button('Stop','Stop Fun',()=>stop.click()),button('Done','Close Fun settings',()=>funPanel.close()));funPanel.addEventListener('close',()=>{if(fun)host.querySelector('h1')?.focus({preventScroll:true});});host.append(funPanel);top.append(tools);host.append(top);const scoreToggle=button('♫','View Score',onScore);scoreToggle.classList.add('lyrics-score-toggle');host.append(scoreToggle);
 const header=make('header');header.append(make('h1',current.title),make('p',current.collection+' · '+current.number,'lyrics-source'));const paper=make('div',null,'lyrics-paper');paper.append(header);host.append(paper);
 if(current.notes.length)paper.append(make('p','Shared ending shown separately; consult the score for repeats.','lyrics-notice'));
 const body=make('div',null,'lyrics-body');
 for(const verse of current.verses){const block=make('section');block.append(make('h2','Verse '+verse.number),make('p',verse.text));body.append(block);}
 for(const refrain of current.refrains){const block=make('section',null,'lyrics-refrain');block.append(make('h2',refrain.label||'Refrain'),make('p',refrain.text));body.append(block);}
 paper.append(body);
 const heading=header.querySelector('h1');heading.tabIndex=0;heading.classList.add('lyrics-hold-target');
 stopHold=attachLyricsHold(heading,()=>{if(fun){funPanel.showModal();return;}fun=true;stopFun=createLyricsFun(host,paper,noteLimit);stop.hidden=false;host.classList.add('lyrics-fun-active');});
 }
 function alignToggle(rect){const control=host.querySelector('.lyrics-score-toggle');if(!control)return;const base=host.getBoundingClientRect(),top=host.querySelector('.lyrics-top');Object.assign(control.style,{left:rect.x-base.left+'px',top:rect.y-base.top+'px',width:rect.width+'px',height:rect.height+'px'});top.style.paddingRight=Math.max(0,top.getBoundingClientRect().right-rect.x+8)+'px';}
 return {alignToggle,show(data){({size,dark}=readAppearance());noteLimit=readFunCount();current=data;draw();host.hidden=false;host.querySelector('h1').focus({preventScroll:true});},hide(){dispose();host.classList.remove('lyrics-fun-active');host.hidden=true;},reset(){dispose();host.classList.remove('lyrics-fun-active');({size,dark}=readAppearance());current=null;host.hidden=true;}};
}
