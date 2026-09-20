import {createLyricsFun} from './lyrics-fun.js';
import {lyricIds} from './lyrics-index.js';
export {lyricIds};
let pending;
export async function getLyrics(id){
 if(!lyricIds.has(id))return null;
 if(!pending)pending=fetch(new URL('./assets/lyrics.json',import.meta.url)).then(r=>{if(!r.ok)throw new Error('Lyrics unavailable');return r.json();}).then(data=>new Map(data.songs.map(song=>[song.id,song]))).catch(e=>{pending=null;throw e;});
 return (await pending).get(id);
}
// Only explicit Fun choices are stored; missing/invalid fields receive defaults.
const funPreferenceKey='music-transpose-lyrics-fun-v1';
function readFunPreference(){try{const p=JSON.parse(localStorage.getItem(funPreferenceKey))||{};return {enabled:typeof p.enabled==='boolean'?p.enabled:false,count:Number.isInteger(p.count)&&p.count>=1&&p.count<=4?p.count:4};}catch{return {enabled:false,count:4};}}
// Reusable DOM component; independent of score rendering and catalog.
export function createLyricsView(host,{onScore,onLibrary}){
 let size=1,dark=true,current=null,fun=readFunPreference().enabled,noteLimit=readFunPreference().count,stopFun=null;
 const saveFun=()=>{try{localStorage.setItem(funPreferenceKey,JSON.stringify({enabled:fun,count:noteLimit}));}catch{/* Keep current-view choices when storage is unavailable. */}};
 const cleanup=()=>{stopFun?.();stopFun=null;};
 const make=(tag,text,cls)=>{const e=document.createElement(tag);if(text)e.textContent=text;if(cls)e.className=cls;return e;};
 const button=(text,label,fn)=>{const e=make('button',text,'quiet');e.type='button';e.setAttribute('aria-label',label);e.title=label;e.onclick=fn;return e;};
 function draw(){
 cleanup();host.replaceChildren();host.classList.toggle('lyrics-dark',dark);host.dataset.size=['small','medium','large'][size];
 const top=make('div',null,'lyrics-top'),tools=make('div',null,'lyrics-tools');
 const theme=button('◐',dark?'Use light background':'Use dark background',()=>{dark=!dark;host.classList.toggle('lyrics-dark',dark);theme.setAttribute('aria-pressed',String(dark));theme.title=dark?'Use light background':'Use dark background';theme.setAttribute('aria-label',theme.title);});theme.setAttribute('aria-pressed',String(dark));
 tools.append(theme,button(['A','A+','A++'][size],'Lyrics font size: '+['Small','Medium','Large'][size],()=>{size=(size+1)%3;host.dataset.size=['small','medium','large'][size];const control=host.querySelectorAll('.lyrics-tools button')[1];control.textContent=['A','A+','A++'][size];control.title='Lyrics font size: '+['Small','Medium','Large'][size];control.setAttribute('aria-label',control.title);}));const funPanel=make('dialog',null,'fun-settings');funPanel.setAttribute('aria-label','Lyrics Fun settings');
 const funButton=button('✦','Lyrics Fun settings',()=>funPanel.showModal());funButton.setAttribute('aria-haspopup','dialog');funButton.setAttribute('aria-pressed',String(fun));
 const enable=make('input');enable.type='checkbox';enable.checked=fun;const enableLabel=make('label','Fun mode');enableLabel.prepend(enable);
 const count=make('select');count.setAttribute('aria-label','Notes on screen');for(let i=1;i<=4;i++){const option=make('option',String(i));option.value=i;count.append(option);}count.value=noteLimit;
 const countLabel=make('label','Notes on screen');countLabel.append(count);
 enable.onchange=()=>{fun=enable.checked;saveFun();cleanup();funButton.setAttribute('aria-pressed',String(fun));if(fun)stopFun=createLyricsFun(host,host.querySelector('.lyrics-paper'),noteLimit);};
 count.onchange=()=>{noteLimit=Number(count.value);saveFun();stopFun?.setLimit(noteLimit);};
 funPanel.append(make('h2','Lyrics Fun'),enableLabel,countLabel,button('Done','Close Fun settings',()=>funPanel.close()));funPanel.addEventListener('close',()=>funButton.focus());host.append(funPanel);tools.append(funButton);top.append(button('Library','Return to Library',onLibrary),tools);host.append(top);const scoreToggle=button('♫','View Score',onScore);scoreToggle.classList.add('lyrics-score-toggle');host.append(scoreToggle);
 const header=make('header');header.append(make('h1',current.title),make('p',current.collection+' · '+current.number,'lyrics-source'));const paper=make('div',null,'lyrics-paper');paper.append(header);host.append(paper);
 if(current.notes.length)paper.append(make('p','Shared ending shown separately; consult the score for repeats.','lyrics-notice'));
 const body=make('div',null,'lyrics-body');
 for(const verse of current.verses){const block=make('section');block.append(make('h2','Verse '+verse.number),make('p',verse.text));body.append(block);}
 for(const refrain of current.refrains){const block=make('section',null,'lyrics-refrain');block.append(make('h2',refrain.label||'Refrain'),make('p',refrain.text));body.append(block);}
 paper.append(body);if(fun)stopFun=createLyricsFun(host,paper,noteLimit);
 }
 function alignToggle(rect){const control=host.querySelector('.lyrics-score-toggle');if(!control)return;const base=host.getBoundingClientRect(),top=host.querySelector('.lyrics-top');Object.assign(control.style,{left:rect.x-base.left+'px',top:rect.y-base.top+'px',width:rect.width+'px',height:rect.height+'px'});top.style.paddingRight=Math.max(0,top.getBoundingClientRect().right-rect.x+8)+'px';}
 return {alignToggle,show(data,{fresh=false}={}){if(fresh){size=1;dark=true;fun=readFunPreference().enabled;noteLimit=readFunPreference().count;}current=data;draw();host.hidden=false;const heading=host.querySelector('h1');heading.tabIndex=-1;heading.focus({preventScroll:true});},hide(){host.querySelector('dialog')?.close();cleanup();fun=readFunPreference().enabled;noteLimit=readFunPreference().count;host.hidden=true;},reset(){host.querySelector('dialog')?.close();cleanup();fun=readFunPreference().enabled;noteLimit=readFunPreference().count;size=1;dark=true;current=null;host.hidden=true;}};
}
