import {scoreIcon,themeIcon} from './icons.js';
import {createDisplaySettings} from './display-settings.js';
import {lyricIds} from './lyrics-index.js';
export {lyricIds};
let pending;
export async function getLyrics(id){
 if(!lyricIds.has(id))return null;
 if(!pending)pending=fetch(new URL('./assets/lyrics.json',import.meta.url)).then(r=>{if(!r.ok)throw new Error('Lyrics unavailable');return r.json();}).then(data=>new Map(data.songs.map(song=>[song.id,song]))).catch(e=>{pending=null;throw e;});
 return (await pending).get(id);
}
// Rendering-only phrase opportunities. Every source character is retained.
export function lyricPhrases(text,target=52){
 if(/[\r\n]/.test(text))return [text]; // Authoritative line breaks take priority.
 const sentences=[];let start=0;
 for(const match of text.matchAll(/[.!?;:]["”’')]*\s+/g)){
  const end=match.index+match[0].length;if(end-start<12)continue;sentences.push(text.slice(start,end));start=end;
 }
 if(start<text.length)sentences.push(text.slice(start));
 const phrases=[];
 for(const sentence of sentences){
  if(sentence.length<=target){phrases.push(sentence);continue;}
  let start=0,last=0;
  for(const match of sentence.matchAll(/,["”’')]*\s+/g)){
   const end=match.index+match[0].length;
   if(end-start>target&&last>start){phrases.push(sentence.slice(start,last));start=last;}
   last=end;
   if(end-start>=target*.8){phrases.push(sentence.slice(start,end));start=end;}
  }
  if(start<sentence.length)phrases.push(sentence.slice(start));
 }
 return phrases.length?phrases:[text];
}
const appearanceKey='music-transpose-lyrics-appearance-v1';
const sizes=['small','medium','large','extra-large'],sizeNames=['Small','Medium','Large','Extra Large'];
function readAppearance(){try{const p=JSON.parse(localStorage.getItem(appearanceKey))||{};return {dark:typeof p.dark==='boolean'?p.dark:false,size:Number.isInteger(p.size)&&p.size>=0&&p.size<=3?p.size:0};}catch{return {dark:false,size:0};}}
// The same Library node keeps its shared navigation handler and accessible name.
export function createLyricsView(host,{onScore,libraryControl}){
 let {size,dark}=readAppearance(),current=null,libraryHome=null,listeners=null,paragraphs=[],settings=null;
 function rephrase(){const target=Math.max(26,Math.min(58,Math.floor((Math.min(innerWidth,820)-72)/([19,24,30,36][size]*.5))));for(const [p,text] of paragraphs){p.replaceChildren(...lyricPhrases(text,target).map(phrase=>{const line=document.createElement('span');line.className='lyric-phrase';line.textContent=phrase;return line;}));}}
 function lyricParagraph(text){const p=make('p',null,'lyric-lines');paragraphs.push([p,text]);return p;}
 const saveAppearance=()=>{try{localStorage.setItem(appearanceKey,JSON.stringify({dark,size}));}catch{}};
 function restoreLibrary(){if(libraryHome){libraryHome.parent.insertBefore(libraryControl,libraryHome.next?.parentNode===libraryHome.parent?libraryHome.next:null);libraryHome=null;}}
 function dispose(){settings?.destroy();settings=null;listeners?.abort();listeners=null;restoreLibrary();}
 const make=(tag,text,cls)=>{const e=document.createElement(tag);if(text)e.textContent=text;if(cls)e.className=cls;return e;};
 const button=(text,label,fn)=>{const e=make('button',text,'quiet');e.type='button';e.setAttribute('aria-label',label);e.title=label;e.onclick=fn;return e;};
 function draw(){
 dispose();paragraphs=[];host.replaceChildren();host.classList.toggle('lyrics-dark',dark);host.dataset.size=sizes[size];
 const theme=button('','Light / Dark background',()=>{dark=!dark;saveAppearance();host.classList.toggle('lyrics-dark',dark);theme.setAttribute('aria-checked',String(dark));});
 theme.id='lyrics-theme';theme.innerHTML=themeIcon+'<span>Light / Dark background</span>';theme.setAttribute('role','menuitemcheckbox');theme.setAttribute('aria-checked',String(dark));
 const fontWrap=make('div',null,'lyrics-font-wrap'),menu=make('div',null,'lyrics-font-menu');menu.id='lyrics-font-options';menu.hidden=true;menu.setAttribute('role','menu');menu.setAttribute('aria-label','Lyrics text size');
 const closeFont=(focus=false)=>{menu.hidden=true;font.setAttribute('aria-expanded','false');if(focus)font.focus({preventScroll:true});};
 const openFont=()=>{menu.hidden=false;font.setAttribute('aria-expanded','true');const r=font.getBoundingClientRect();menu.style.left=Math.max(8,Math.min(r.right-menu.offsetWidth,innerWidth-menu.offsetWidth-8))+'px';menu.style.top=Math.max(8,r.top-menu.offsetHeight-8)+'px';menu.querySelector('[aria-checked=true]').focus({preventScroll:true});};
 const font=button('','Font size',()=>menu.hidden?openFont():closeFont(true));font.id='lyrics-font-size';font.innerHTML='<span class="lyrics-font-art" aria-hidden="true">A</span><span>Font size</span><span class="lyrics-font-chevron" aria-hidden="true">›</span>';font.setAttribute('aria-haspopup','menu');font.setAttribute('aria-expanded','false');font.setAttribute('aria-controls',menu.id);
 for(const [index,name] of sizeNames.entries()){const option=button(name,name,()=>{size=index;saveAppearance();rephrase();host.dataset.size=sizes[size];for(const [i,item] of [...menu.children].entries())item.setAttribute('aria-checked',String(i===size));font.title='Font size: '+sizeNames[size];closeFont(true);});option.setAttribute('role','menuitemradio');option.setAttribute('aria-checked',String(index===size));menu.append(option);}
 font.title='Font size: '+sizeNames[size];fontWrap.append(font,menu);
 settings=createDisplaySettings({id:'lyrics-settings',label:'Lyrics settings',controls:[fontWrap,theme],onClose:()=>closeFont()});
 font.addEventListener('keydown',e=>{if(['ArrowDown','ArrowUp'].includes(e.key)){e.preventDefault();openFont();}});
 menu.addEventListener('keydown',e=>{e.stopPropagation();const items=[...menu.children],i=items.indexOf(document.activeElement);if(e.key==='Escape'){e.preventDefault();closeFont(true);}else if(['ArrowDown','ArrowUp','Home','End'].includes(e.key)){e.preventDefault();items[e.key==='Home'?0:e.key==='End'?items.length-1:(i+(e.key==='ArrowDown'?1:-1)+items.length)%items.length].focus();}});
 listeners=new AbortController();const options={signal:listeners.signal};window.addEventListener('resize',rephrase,options);
 document.addEventListener('pointerdown',e=>{if(!fontWrap.contains(e.target))closeFont();},options);
 document.addEventListener('focusin',e=>{if(!fontWrap.contains(e.target))closeFont();},options);
 document.addEventListener('keydown',e=>{if(!menu.hidden&&e.key==='Escape'){e.preventDefault();e.stopPropagation();closeFont(true);}},options);
 for(const event of ['resize','scroll','beforeprint'])window.addEventListener(event,()=>closeFont(),options);
 const scoreToggle=button('','View Score',onScore);scoreToggle.classList.add('lyrics-score-toggle','view-switch');scoreToggle.innerHTML=scoreIcon;
 const footer=make('div',null,'lyrics-footer'),pair=make('div',null,'footer-view-pair');pair.append(scoreToggle,settings.element);
 libraryHome={parent:libraryControl.parentNode,next:libraryControl.nextSibling};footer.append(libraryControl,pair);host.append(footer);
 const header=make('header',null,'lyrics-identity-header'),home=make('button',null,'header-home lyrics-header-home');home.type='button';home.setAttribute('aria-label','Return to Library');header.append(home,make('h1',current.title),make('p',current.collection+' · '+current.number,'lyrics-source'));const paper=make('div',null,'lyrics-paper');paper.append(header);host.append(paper);
 if(current.refrains.some(r=>r.label==='Shared ending'))paper.append(make('p','Shared ending shown separately; consult the score for repeats.','lyrics-notice'));
 const body=make('div',null,'lyrics-body');
 const repeated=current.refrains.filter(r=>/^(chorus|refrain)$/i.test(r.label||''));
 for(const verse of current.verses){
  const block=make('section');block.append(make('h2','Verse '+verse.number),lyricParagraph(verse.text));
  for(const refrain of repeated){
   if(refrain.verses&&!refrain.verses.map(String).includes(String(verse.number)))continue;
   const disclosure=make('details',null,'lyrics-chorus'),summary=make('summary',refrain.label||'Chorus');
   summary.setAttribute('aria-label',(refrain.label||'Chorus')+' after verse '+verse.number);
   disclosure.append(summary,lyricParagraph(refrain.text));block.append(disclosure);
  }
  body.append(block);
 }
 for(const refrain of current.refrains.filter(r=>!current.verses.length||!repeated.includes(r))){const block=make('section',null,'lyrics-refrain');block.append(make('h2',refrain.label||'Refrain'),lyricParagraph(refrain.text));body.append(block);}
 paper.append(body);rephrase();
 const heading=header.querySelector('h1');heading.tabIndex=-1;
 }
 return {show(data){({size,dark}=readAppearance());current=data;draw();host.hidden=false;host.querySelector('h1').focus({preventScroll:true});},hide(){dispose();host.hidden=true;},reset(){dispose();({size,dark}=readAppearance());current=null;host.hidden=true;}};
}
