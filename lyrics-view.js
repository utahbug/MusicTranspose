import {lyricIds} from './lyrics-index.js';
export {lyricIds};
let pending;
export async function getLyrics(id){
 if(!lyricIds.has(id))return null;
 if(!pending)pending=fetch(new URL('./assets/lyrics.json',import.meta.url)).then(r=>{if(!r.ok)throw new Error('Lyrics unavailable');return r.json();}).then(data=>new Map(data.songs.map(song=>[song.id,song]))).catch(e=>{pending=null;throw e;});
 return (await pending).get(id);
}
// Reusable DOM component: no app catalog, score renderer or storage dependency.
export function createLyricsView(host,{onScore,onLibrary}){
 let size=1,dark=true,current=null;
 const make=(tag,text,cls)=>{const e=document.createElement(tag);if(text)e.textContent=text;if(cls)e.className=cls;return e;};
 const button=(text,label,fn)=>{const e=make('button',text,'quiet');e.type='button';e.setAttribute('aria-label',label);e.title=label;e.onclick=fn;return e;};
 function draw(){
 host.replaceChildren();host.classList.toggle('lyrics-dark',dark);host.dataset.size=['small','medium','large'][size];
 const top=make('div',null,'lyrics-top'),tools=make('div',null,'lyrics-tools');
 const theme=button('◐',dark?'Use light background':'Use dark background',()=>{dark=!dark;draw();host.querySelector('.lyrics-tools button').focus();});theme.setAttribute('aria-pressed',String(dark));
 tools.append(theme,button(['A','A+','A++'][size],'Lyrics font size: '+['Small','Medium','Large'][size],()=>{size=(size+1)%3;draw();host.querySelectorAll('.lyrics-tools button')[1].focus();}),button('♫','Open score',onScore));top.append(button('Library','Return to Library',onLibrary),tools);host.append(top);
 const header=make('header');header.append(make('h1',current.title),make('p',current.collection+' · '+current.number,'lyrics-source'));const paper=make('div',null,'lyrics-paper');paper.append(header);host.append(paper);
 if(current.notes.length)paper.append(make('p','Shared ending shown separately; consult the score for repeats.','lyrics-notice'));
 const body=make('div',null,'lyrics-body');
 for(const verse of current.verses){const block=make('section');block.append(make('h2','Verse '+verse.number),make('p',verse.text));body.append(block);}
 for(const refrain of current.refrains){const block=make('section',null,'lyrics-refrain');block.append(make('h2',refrain.label||'Refrain'),make('p',refrain.text));body.append(block);}
 paper.append(body);
 }
 return {show(data,{fresh=false}={}){if(fresh){size=1;dark=true;}current=data;draw();host.hidden=false;const heading=host.querySelector('h1');heading.tabIndex=-1;heading.focus({preventScroll:true});},hide(){host.hidden=true;},reset(){size=1;dark=true;current=null;host.hidden=true;}};
}
