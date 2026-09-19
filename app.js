import {openingMetadata,showOpeningMetadata} from './opening-metadata.js';
import {captureSystems,rememberReadingPosition,restoreReadingPosition} from './virtual-pages.js';
import {alignTitleSubtitles} from './title-alignment.js';
import {showInstrumentKeys,initEnsemble} from './instrument-keys.js';
import {createPlayback} from './playback.js';
import {getLyrics,lyricIds,createLyricsView} from './lyrics-view.js';
import {renderPdf,preparePdfPrint} from './pdf-score.js';
import {initLibrary} from './library.js';
import {avoidTempoCollisions} from './score-layout.js';
import {songs,refreshLocalMusic,localXML,localAsset} from './catalog.js';
import {initMyMusic} from './my-music.js';
import {buildKeys,originalKey,signature,unpackMXL,transposeXML,shiftOctaveXML,parseXML} from './music.js';
const $=id=>document.getElementById(id),score=$('score'),stage=$('staging'),dialog=$('key-dialog');
let activeSong=songs[0],modeOverride,loading=false,scoreSize='normal';
// OSMD uses container width / Zoom / 10 as the logical page width BEFORE layout.
const scoreSizes={normal:1,compact:.62/.78,large:.94/.78};
let readingPosition=null;
let KEYS=[],original='',current=0,wanted=0,currentOctave=0,wantedOctave=0,busy=false,ready=false,renderWidth=0,timer,osmd;
new MutationObserver(()=>{$('status').classList.toggle('visible-error',/Unable|Could not/.test($('status').textContent));}).observe($('status'),{childList:true});
const isPdf=()=>activeSong.scoreType==='pdf';
const viewOnly=()=>activeSong.local&&activeSong.transpositionAvailable===false;
async function scoreSource(song){if(song.local)return localXML(song);const r=await fetch(song.asset);if(!r.ok)throw Error('Score unavailable');return unpackMXL(await r.arrayBuffer());}
let library,lyricsSong=null,scoreScroll=0;
const playback=createPlayback(async()=>{
 const song=document.body.classList.contains('lyrics-open')?lyricsSong:activeSong;
 if(!song||song.scoreType==='pdf'||song.playbackAvailable===false)throw Error('No structured score');
 let xml=ready&&activeSong.id===song.id?lastXML:sourceCache.get(song.asset);
 if(!xml){xml=await scoreSource(song);sourceCache.set(song.asset,xml);}
 return {key:song.id+':'+xml,xml};
});
function playbackControls(){const h=document.querySelector('.score-heading h1');if(!isPdf()&&ready&&activeSong.playbackAvailable!==false)playback.attach(h);else h.querySelector('.song-playback')?.remove();}
const lyricsView=createLyricsView($('lyrics-view'),{onLibrary:()=>library?.showLibrary(),onScore:()=>{
 document.body.classList.remove('lyrics-open');lyricsView.hide();document.title=(lyricsSong?.title||activeSong.title)+' · Music Transpose';
 if(ready&&activeSong.id===lyricsSong?.id){window.scrollTo({top:scoreScroll,behavior:'instant'});$('show-lyrics').focus({preventScroll:true});}else if(lyricsSong)loadSong(lyricsSong.id);
}});
async function openLyrics(id){
 const song=songs.find(s=>s.id===id);if(!song||!lyricIds.has(id)||busy||loading)return;
 loading=true;setControls();
 try{const data=await getLyrics(id);if(!data)return;
 const fresh=lyricsSong?.id!==id;scoreScroll=document.body.classList.contains('library-open')?0:scrollY;lyricsSong=song;
 document.dispatchEvent(new Event('library-open'));library.showScore();document.body.classList.add('lyrics-open');
 lyricsView.show(data,{fresh});playback.attach($('lyrics-view').querySelector('h1'));library.opened(id);document.title=song.title+' · Lyrics · MusicTranspose';window.scrollTo({top:0,behavior:'instant'});
 }catch(e){$('library-message').textContent='Unable to load lyrics. Please try again.';$('status').textContent='Unable to load lyrics. Please try again.';}finally{loading=false;setControls();}
}
$('show-lyrics').onclick=()=>openLyrics(activeSong.id);
const sourceCache=new Map(); // Unpack a bundled score only on its first selection.
const cache=new Map(),metrics=[];let lastXML='',engravedXML='';
function width(){return Math.round(score.clientWidth);}
function setControls(){const sourceKey=!isPdf()&&KEYS.find(k=>k.shift===0);$('original-key-reference').hidden=!sourceKey;$('original-key-reference').textContent=sourceKey?'Original key: '+sourceKey.name+' '+(sourceKey.mode==='minor'?'Min':'Maj'):''; requestAnimationFrame(alignTitleSubtitles); const concert=KEYS.find(k=>k.shift===current);if(concert&&!isPdf()&&!viewOnly())showInstrumentKeys(concert,KEYS); playback.setBlocked(busy||loading||wanted!==current||wantedOctave!==currentOctave);playbackControls(); $('show-lyrics').hidden=!lyricIds.has(activeSong.id);$('show-lyrics').disabled=!ready||busy||loading; $('score-size').disabled=isPdf()||!ready||busy||loading;$('score-size').dataset.size=scoreSize;for(const option of $('score-size-options').querySelectorAll('[data-size]'))option.setAttribute('aria-pressed',String(option.dataset.size===scoreSize)); $('songs').disabled=busy||loading;$('reset').disabled=isPdf()||viewOnly()||!ready;$('key').disabled=isPdf()||viewOnly()||!ready;$('print').disabled=!ready||busy;
 $('key-octave').hidden=isPdf()||viewOnly();for(const input of document.querySelectorAll('input[name=octave]')){input.disabled=isPdf()||viewOnly()||!ready||busy||loading;input.checked=Number(input.value)===wantedOctave;}
 for(const b of dialog.querySelectorAll('[data-shift]')){const n=Number(b.dataset.shift);b.setAttribute('aria-pressed',String(n===current));b.querySelector('.marker').textContent=n===current?(n===0?'Original · Current':'Current'):n===0?'Original · 0':'';}
}
// Screen-only framing: keep every SVG node and an 8-unit safety margin above its ink.
// Print uses a separate engraver and never calls this function.
function trimScreenMargin(){
 const svg=score.querySelector('svg');if(!svg)return;
 svg.classList.add('screen-first-page');
 const box=svg.getBBox(),view=svg.viewBox.baseVal;
 const trim=view.width>0?Math.max(0,box.y-view.y-8)*svg.getBoundingClientRect().width/view.width:0;
 score.style.setProperty('--score-trim',trim+'px');
}
function commit(entry,shift,octave,w){score.innerHTML=entry.svg;document.dispatchEvent(new CustomEvent('score-engraved',{detail:{song:activeSong.id,systems:entry.systemLayout}}));score.dataset.systems=entry.systems;trimScreenMargin();restoreReadingPosition(readingPosition);readingPosition=null;current=shift;currentOctave=octave;renderWidth=w;lastXML=entry.xml;if(viewOnly()){$('status').textContent='View only · Transposition unavailable';document.querySelector('.masthead').dataset.printKey='';score.setAttribute('aria-busy','false');return;}const k=KEYS.find(k=>k.shift===current);$('key-name').textContent=k.name+' '+(k.mode==='minor'?'Min':'Maj');$('key-name').dataset.compact=k.name+' '+(k.mode==='minor'?'Min':'Maj');$('key-signature').textContent=k.fifths?'('+signature(k)+')':'';$('key').setAttribute('aria-label',`Current key ${k.name} ${k.mode}, ${Math.abs(k.fifths)} ${k.fifths<0?'flats':'sharps'}. Choose key`);$('status').textContent=`${k.name} ${k.mode}${shift===0?' · Original key':''}${octave?' · '+(octave>0?'Up':'Down')+' one octave':''}`;document.querySelector('.masthead').dataset.printKey=k.name+' '+k.mode;score.setAttribute('aria-busy','false');}
async function pump(){
 if(isPdf()||busy||!original||width()<100)return;busy=true;setControls();
 try{while(true){const target=wanted,octave=wantedOctave,w=width();if(w<100)break;const density=scoreSize;const id=`${w}:${target}:${octave}:${density}`;const start=performance.now();const cached=cache.get(id);
  if(cached){commit(cached,target,octave,w);metrics.push({shift:target,octave,width:w,ms:performance.now()-start,cached:true});}
  else{const xml=viewOnly()?original:shiftOctaveXML(transposeXML(original,target,modeOverride),octave);const displayXML=openingMetadata(xml).displayXML;stage.style.width=w+'px';if(engravedXML!==displayXML){await osmd.load(displayXML);engravedXML=displayXML;}if(target!==wanted||octave!==wantedOctave||w!==width())continue;
   // Internal engraving margins participate in automatic system breaking.
   // Normal retains the existing responsive baseline; density changes logical width.
   const phone=matchMedia('(max-width:600px)').matches;
   osmd.EngravingRules.PageLeftMargin=phone?.8:5;osmd.EngravingRules.PageRightMargin=phone?.8:5;
   osmd.Zoom=(phone||w<800?.78:.9)*scoreSizes[density];osmd.render();avoidTempoCollisions(stage,displayXML);if(target!==wanted||octave!==wantedOctave||w!==width())continue;
   const entry={systemLayout:captureSystems(osmd,stage),svg:stage.innerHTML,xml,systems:osmd.GraphicSheet.MusicPages.reduce((n,p)=>n+p.MusicSystems.length,0)};cache.set(id,entry);if(cache.size>36)cache.delete(cache.keys().next().value);commit(entry,target,octave,w);metrics.push({shift:target,octave,width:w,ms:performance.now()-start,cached:false});
  }
  if(target===wanted&&octave===wantedOctave&&w===width())break;
 }}catch(e){console.error(e);wanted=current;wantedOctave=currentOctave;$('status').textContent='Could not change the score. Please reload to try again.';score.setAttribute('aria-busy','false');}
 finally{busy=false;ready=!!score.querySelector('svg');setControls();}
}
export function changeKey(n){playback.stop();if(isPdf()||viewOnly())return;if(!Number.isInteger(n)||n< -6||n>6)return;wanted=n;score.setAttribute('aria-busy','true');$('status').textContent='Changing to '+KEYS.find(k=>k.shift===n).name+' '+KEYS.find(k=>k.shift===n).mode+'…';setControls();clearTimeout(timer);timer=setTimeout(pump,20);}
function changeOctave(n){
 playback.stop();
 if(isPdf()||viewOnly()||!ready||!Number.isInteger(n)||Math.abs(n)>1)return;
 wantedOctave=n;score.setAttribute('aria-busy','true');$('status').textContent='Changing score register…';setControls();clearTimeout(timer);timer=setTimeout(pump,20);
}
const closeEnsemble=initEnsemble(shift=>{dialog.close();changeKey(shift);});
function buildChooser(){
 closeEnsemble();
 for(const id of ['higher','original','lower'])$(id).replaceChildren();
 for(const key of KEYS){const b=document.createElement('button');b.className='key-choice';b.dataset.shift=key.shift;b.setAttribute('aria-label',`${key.name} ${key.mode}, ${Math.abs(key.fifths)} ${key.fifths<0?'flats':'sharps'}${key.shift===0?', original key':`, ${key.shift>0?'+':''}${key.shift} semitones from original`}`);b.innerHTML=`<span class="name">${key.name}</span><span class="signature" aria-hidden="true">${signature(key)}</span><span class="distance">${key.shift>0?'+':''}${key.shift}</span><span class="marker"></span>`;if(key.shift===0)b.querySelector('.distance').remove();b.onclick=()=>{dialog.close();changeKey(key.shift);};$(key.shift>0?'higher':key.shift<0?'lower':'original').append(b);}
// Lower keys are ordered outward from the original, not by numeric pitch.
$('lower').replaceChildren(...[...$('lower').children].reverse());
}
$('reset').onclick=()=>{wantedOctave=0;changeKey(0);};
const sizeOptions=$('score-size-options');
function closeSizeOptions(focus=false){sizeOptions.hidden=true;$('score-size').setAttribute('aria-expanded','false');if(focus)$('score-size').focus({preventScroll:true});}
$('score-size').onclick=()=>{if(isPdf()||busy||!ready)return;if(!sizeOptions.hidden){closeSizeOptions();return;}sizeOptions.hidden=false;$('score-size').setAttribute('aria-expanded','true');const rect=$('score-size').getBoundingClientRect();sizeOptions.style.left=Math.max(8,Math.min(rect.right-sizeOptions.offsetWidth,innerWidth-sizeOptions.offsetWidth-8))+'px';sizeOptions.style.top=(rect.bottom+sizeOptions.offsetHeight+14>innerHeight?Math.max(8,rect.top-sizeOptions.offsetHeight-6):rect.bottom+6)+'px';sizeOptions.querySelector('[aria-pressed=true]').focus({preventScroll:true});};
for(const option of sizeOptions.querySelectorAll('[data-size]'))option.onclick=()=>{readingPosition=rememberReadingPosition();scoreSize=option.dataset.size;closeSizeOptions(true);score.setAttribute('aria-busy','true');pump();};
document.addEventListener('pointerdown',e=>{if(!sizeOptions.hidden&&!sizeOptions.contains(e.target)&&!$('score-size').contains(e.target))closeSizeOptions();});
document.addEventListener('keydown',e=>{if(!sizeOptions.hidden&&e.key==='Escape'){e.preventDefault();closeSizeOptions(true);}});
document.addEventListener('focusin',e=>{if(!sizeOptions.hidden&&!sizeOptions.contains(e.target)&&e.target!==$('score-size'))closeSizeOptions();});
const phoneControls=matchMedia('(max-width:600px)');
function placePerformanceControls(){
 closeSizeOptions();const header=document.querySelector('.score-actions');
 if(phoneControls.matches){header.insertBefore($('songs'),$('original-key-reference'));header.append($('score-size'));}
 else{document.querySelector('.playing-controls').prepend($('songs'));document.querySelector('.utility-controls').prepend($('score-size'));}
}
phoneControls.addEventListener('change',placePerformanceControls);placePerformanceControls();
window.addEventListener('resize',()=>closeSizeOptions());
document.addEventListener('library-open',()=>closeSizeOptions());
for(const input of document.querySelectorAll('input[name=octave]'))input.onchange=()=>changeOctave(Number(input.value));
$('key').onclick=()=>{setControls();dialog.showModal();dialog.querySelector(`[data-shift="${current}"]`).focus();};$('close-dialog').onclick=()=>dialog.close();dialog.onclick=e=>{if(e.target===dialog){const r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)dialog.close();}};
async function preparePrint(){
 if(isPdf())return preparePdfPrint(score,$('print-pages'));
 const printXML=lastXML,printKey=viewOnly()?'':KEYS.find(k=>k.shift===current).name+' '+KEYS.find(k=>k.shift===current).mode;const host=$('print-staging');host.replaceChildren();host.style.width='794px';
 const engraver=new opensheetmusicdisplay.OpenSheetMusicDisplay(host,{backend:'svg',autoResize:false,pageFormat:'A4 P',drawTitle:true,drawSubtitle:false,drawComposer:false,drawLyricist:false,drawPartNames:false,drawFingerings:true,drawLyrics:true,drawMeasureNumbers:false,newSystemFromXML:false,newPageFromXML:false});
 await engraver.load(printXML);engraver.Zoom=.8;engraver.render();avoidTempoCollisions(host,printXML);
 const pages=$('print-pages');pages.replaceChildren();
 for(const svg of host.querySelectorAll('svg')){const section=document.createElement('section');section.className='print-page';const label=document.createElement('p');label.className='print-key';label.textContent=printKey;section.append(label,svg.cloneNode(true));pages.append(section);}
 const credits=document.createElement('section');credits.className='print-credits';const h=document.createElement('h2');h.textContent=activeSong.title+' · Score credits';const creditCopy=$('source-credits').cloneNode(true);creditCopy.removeAttribute('id');creditCopy.className='source-copy';credits.append(h,creditCopy);pages.append(credits);document.body.classList.add('prepared-print');return pages.querySelectorAll('svg').length;
}
$('print').onclick=async()=>{if(busy)return;$('print').disabled=true;try{await preparePrint();window.print();}catch(e){console.error(e);$('status').textContent='Unable to prepare printing. Please try again.';}finally{setControls();}};
let resizeTimer;new ResizeObserver(()=>{clearTimeout(resizeTimer);resizeTimer=setTimeout(()=>{if(original&&width()>100&&width()!==renderWidth)pump();},140);}).observe(score);
async function loadScore(xml,override){
 if(busy)throw new Error('Wait for the current rendering before loading a score.');
 const source=viewOnly()?null:originalKey(xml,override),keys=source?buildKeys(source):[];modeOverride=override;
 clearTimeout(timer);original=xml;KEYS=keys;current=0;wanted=0;currentOctave=0;wantedOctave=0;ready=false;cache.clear();
 showOpeningMetadata(document.querySelector('.score-heading .subtitle'),activeSong.collection+' · '+activeSong.page,xml);
 if(!source){showOpeningMetadata(document.querySelector('.score-heading .subtitle'),activeSong.collection+(activeSong.page?' · '+activeSong.page:'')+' · View only',xml);document.querySelector('.footnote').textContent='Transposition unavailable for this imported score.';score.setAttribute('aria-busy','true');await pump();return;}
 buildChooser();document.querySelector('.dialog-hint').textContent='All destinations remain '+source.mode+'.';document.querySelector('.footnote').textContent='Original key: '+source.name+' '+source.mode+' · Tap the key to choose another.';
 score.setAttribute('aria-busy','true');await pump();
}
async function loadSong(id){
 if(busy||loading)return;
 const song=songs.find(s=>s.id===id);if(!song)throw new Error('Unknown song');
 if(!playback.songKey.startsWith(song.id+':'))playback.stop();document.body.classList.remove('lyrics-open');lyricsView.hide();scoreSize='normal';library?.showScore();loading=true;ready=false;document.dispatchEvent(new Event('score-session-reset'));$('status').textContent='Loading score…';setControls();clearTimeout(timer);
 try{
  document.body.classList.toggle('view-only-score',!!song.local&&!song.transpositionAvailable);
  document.body.classList.toggle('pdf-score-open',song.scoreType==='pdf');$('pdf-notice').hidden=song.scoreType!=='pdf';score.style.removeProperty('--score-trim');
  if(song.scoreType==='pdf'){
   activeSong=song;original='';lastXML='';current=0;wanted=0;currentOctave=0;wantedOctave=0;cache.clear();document.title=song.title+' · Music Transpose';document.querySelector('.score-heading h1').textContent=song.title;document.querySelector('.subtitle').textContent=song.collection;score.setAttribute('aria-label',song.title+' PDF score');score.setAttribute('aria-busy','true');$('source-credits').replaceChildren();$('pdf-original').href=song.local?await localAsset(song):song.asset;
   await renderPdf(song.local?await localAsset(song):song.asset,score,song.title);ready=true;score.setAttribute('aria-busy','false');$('status').textContent='PDF score. Transposition unavailable.';library?.opened(song.id);window.scrollTo({top:0,behavior:'instant'});return;
  }
  let xml=sourceCache.get(song.asset);if(!xml){xml=await scoreSource(song);sourceCache.set(song.asset,xml);}
  if(!song.local||song.transpositionAvailable){const key=originalKey(xml,song.modeOverride);if(key.name!==song.tonic||key.mode!==song.mode||key.fifths!==song.fifths)throw new Error('Score and registry disagree');}
  activeSong=song;document.title=song.title+' · Music Transpose';document.querySelector('.score-heading h1').textContent=song.title;
  document.querySelector('.subtitle').textContent=song.collection+' · '+song.page;score.setAttribute('aria-label',song.title+' sheet music');
  $('source-credits').replaceChildren();
  const credits=[...parseXML(xml).querySelectorAll('credit')].map(c=>[...c.querySelectorAll('credit-words')].map(w=>w.textContent).join('')).filter(t=>t.trim()!==song.title);
  const verses=document.createElement('div');verses.className='extra-verses';$('source-credits').append(verses);
  for(const text of credits){const p=document.createElement('p');p.textContent=text.replaceAll('\\n','\n');if(/^\d+\./.test(text))verses.append(p);else{p.className='credit-note';$('source-credits').append(p);}}
  await loadScore(xml,song.modeOverride);window.scrollTo({top:0,behavior:'instant'});library?.opened(song.id);
 }catch(e){console.error(e);$('status').textContent='Unable to open this score. Please try again.';library?.failed();}
 finally{loading=false;setControls();}
}
// Exiting ends a temporary playing session, including reopening the same song.
// Parsed source assets stay cached; Library data and navigation preferences are independent.
function leaveScore(){
 playback.stop();$('playback-message').textContent='';
 lyricsView.reset();lyricsSong=null;document.body.classList.remove('lyrics-open');
 scoreSize='normal';

 clearTimeout(timer);current=0;wanted=0;currentOctave=0;wantedOctave=0;ready=false;document.dispatchEvent(new Event('score-session-reset'));
 original='';lastXML='';renderWidth=0;cache.clear();score.replaceChildren();score.setAttribute('aria-busy','false');
 document.body.classList.remove('prepared-print');$('print-pages').replaceChildren();
 dialog.close();$('settings-dialog').close();setControls();
}
// Local acceptance-test hooks.
window.prototype={playback,get current(){return current;},get wanted(){return wanted;},get octave(){return currentOctave;},get wantedOctave(){return wantedOctave;},get busy(){return busy;},get ready(){return ready;},get xml(){return lastXML;},get original(){return original;},get metrics(){return metrics;},get song(){return activeSong.id;},changeKey,changeOctave,preparePrint,loadScore,loadSong};
(async()=>{try{osmd=new opensheetmusicdisplay.OpenSheetMusicDisplay(stage,{backend:'svg',autoResize:false,drawTitle:false,drawSubtitle:false,drawComposer:false,drawLyricist:false,drawPartNames:false,drawFingerings:true,drawLyrics:true,drawMeasureNumbers:false,drawMetronomeMarks:true,newSystemFromXML:false,newPageFromXML:false});
 try{await refreshLocalMusic();}catch{$('library-message').textContent='Local music storage is unavailable. Bundled songs remain available.';}
 initMyMusic();library=initLibrary({loadSong,openLyrics,isBusy:()=>busy||loading,leaveScore});
 if('serviceWorker' in navigator){try{// Refresh an already-controlled Library after a deployment, never interrupt a score.
 let controlled=!!navigator.serviceWorker.controller,pendingUpdate=false;
 const refreshLibrary=()=>{if(pendingUpdate&&document.body.classList.contains('library-open'))location.reload();};
 navigator.serviceWorker.addEventListener('controllerchange',()=>{if(controlled){pendingUpdate=true;refreshLibrary();}controlled=true;});
 document.addEventListener('library-open',()=>setTimeout(refreshLibrary,0));
 await navigator.serviceWorker.register('./sw.js',{updateViaCache:'none'});await navigator.serviceWorker.ready;$('offline').textContent='Available offline';}catch(e){$('offline').textContent='Local score';}}
 }catch(e){console.error(e);$('status').textContent='Unable to start MusicTranspose. Please reload or try again online.';$('library-message').textContent=$('status').textContent;}})();

window.addEventListener('resize',()=>requestAnimationFrame(alignTitleSubtitles));
document.fonts.ready.then(alignTitleSubtitles);
