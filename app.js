import {initLibrary} from './library.js';
import {avoidTempoCollisions} from './score-layout.js';
import {songs} from './songs.js';
import {buildKeys,originalKey,signature,unpackMXL,transposeXML,parseXML} from './music.js';
const $=id=>document.getElementById(id),score=$('score'),stage=$('staging'),dialog=$('key-dialog');
let activeSong=songs[0],modeOverride,loading=false;
let KEYS=[],original='',current=0,wanted=0,busy=false,ready=false,renderWidth=0,timer,osmd;
new MutationObserver(()=>{$('status').classList.toggle('visible-error',/Unable|Could not/.test($('status').textContent));}).observe($('status'),{childList:true});
let library;
const cache=new Map(),metrics=[];let lastXML='';
function width(){return Math.round(score.clientWidth);}
function setControls(){ $('songs').disabled=busy||loading;$('down').disabled=!ready||wanted<=-6;$('up').disabled=!ready||wanted>=6;$('reset').disabled=!ready;$('key').disabled=!ready;$('print').disabled=!ready||busy;
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
function commit(entry,shift,w){score.innerHTML=entry.svg;trimScreenMargin();current=shift;renderWidth=w;lastXML=entry.xml;const k=KEYS.find(k=>k.shift===current);$('key-name').textContent=k.name+' '+k.mode;$('key-name').dataset.compact=k.name+' '+(k.mode==='minor'?'Min':'Maj');$('key-signature').textContent=k.fifths?signature(k):'';$('key').setAttribute('aria-label',`Current key ${k.name} ${k.mode}, ${Math.abs(k.fifths)} ${k.fifths<0?'flats':'sharps'}. Choose key`);$('status').textContent=`${k.name} ${k.mode}${shift===0?' · Original key':''}`;document.querySelector('.masthead').dataset.printKey=k.name+' '+k.mode;score.setAttribute('aria-busy','false');}
async function pump(){
 if(busy||!original||width()<100)return;busy=true;setControls();
 try{while(true){const target=wanted,w=width();if(w<100)break;const id=`${w}:${target}`;const start=performance.now();const cached=cache.get(id);
  if(cached){commit(cached,target,w);metrics.push({shift:target,width:w,ms:performance.now()-start,cached:true});}
  else{const xml=transposeXML(original,target,modeOverride);stage.style.width=w+'px';await osmd.load(xml);if(target!==wanted||w!==width())continue;
   osmd.Zoom=w<800?.78:.9;osmd.render();avoidTempoCollisions(stage,xml);if(target!==wanted||w!==width())continue;
   const entry={svg:stage.innerHTML,xml};cache.set(id,entry);if(cache.size>36)cache.delete(cache.keys().next().value);commit(entry,target,w);metrics.push({shift:target,width:w,ms:performance.now()-start,cached:false});
  }
  if(target===wanted&&w===width())break;
 }}catch(e){console.error(e);wanted=current;$('status').textContent='Could not change the score. Please reload to try again.';score.setAttribute('aria-busy','false');}
 finally{busy=false;ready=!!score.querySelector('svg');setControls();}
}
export function changeKey(n){if(!Number.isInteger(n)||n< -6||n>6)return;wanted=n;score.setAttribute('aria-busy','true');$('status').textContent='Changing to '+KEYS.find(k=>k.shift===n).name+' '+KEYS.find(k=>k.shift===n).mode+'…';setControls();clearTimeout(timer);timer=setTimeout(pump,20);}
function buildChooser(){
 for(const id of ['higher','original','lower'])$(id).replaceChildren();
 for(const key of KEYS){const b=document.createElement('button');b.className='key-choice';b.dataset.shift=key.shift;b.setAttribute('aria-label',`${key.name} ${key.mode}, ${Math.abs(key.fifths)} ${key.fifths<0?'flats':'sharps'}${key.shift===0?', original key':`, ${key.shift>0?'+':''}${key.shift} semitones from original`}`);b.innerHTML=`<span class="name">${key.name}</span><span class="signature" aria-hidden="true">${signature(key)}</span><span class="distance">${key.shift>0?'+':''}${key.shift}</span><span class="marker"></span>`;if(key.shift===0)b.querySelector('.distance').remove();b.onclick=()=>{dialog.close();changeKey(key.shift);};$(key.shift>0?'higher':key.shift<0?'lower':'original').append(b);}
// Lower keys are ordered outward from the original, not by numeric pitch.
$('lower').replaceChildren(...[...$('lower').children].reverse());
}
$('down').onclick=()=>changeKey(Math.max(-6,wanted-1));$('up').onclick=()=>changeKey(Math.min(6,wanted+1));$('reset').onclick=()=>changeKey(0);
$('key').onclick=()=>{setControls();dialog.showModal();dialog.querySelector(`[data-shift="${current}"]`).focus();};$('close-dialog').onclick=()=>dialog.close();dialog.onclick=e=>{if(e.target===dialog){const r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)dialog.close();}};
async function preparePrint(){
 const printXML=lastXML,printKey=KEYS.find(k=>k.shift===current).name+' '+KEYS.find(k=>k.shift===current).mode;const host=$('print-staging');host.replaceChildren();host.style.width='794px';
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
 const source=originalKey(xml,override),keys=buildKeys(source);modeOverride=override;
 clearTimeout(timer);original=xml;KEYS=keys;current=0;wanted=0;ready=false;cache.clear();
 buildChooser();document.querySelector('.dialog-hint').textContent='All destinations remain '+source.mode+'.';document.querySelector('.footnote').textContent='Original key: '+source.name+' '+source.mode+' · Tap the key to choose another.';
 score.setAttribute('aria-busy','true');await pump();
}
async function loadSong(id){
 if(busy||loading)return;
 const song=songs.find(s=>s.id===id);if(!song)throw new Error('Unknown song');
 library?.showScore();loading=true;ready=false;setControls();clearTimeout(timer);
 try{
  const r=await fetch(song.asset);if(!r.ok)throw new Error('Local score unavailable');const xml=unpackMXL(await r.arrayBuffer());
  const key=originalKey(xml,song.modeOverride);if(key.name!==song.tonic||key.mode!==song.mode||key.fifths!==song.fifths)throw new Error('Score and registry disagree');
  activeSong=song;document.title=song.title+' · Music Transpose';document.querySelector('.score-heading h1').textContent=song.title;
  document.querySelector('.subtitle').textContent=song.collection+' · '+song.page;score.setAttribute('aria-label',song.title+' sheet music');
  $('source-credits').replaceChildren();
  const credits=[...parseXML(xml).querySelectorAll('credit')].map(c=>[...c.querySelectorAll('credit-words')].map(w=>w.textContent).join('')).filter(t=>t.trim()!==song.title);
  const verses=document.createElement('div');verses.className='extra-verses';$('source-credits').append(verses);
  for(const text of credits){const p=document.createElement('p');p.textContent=text.replaceAll('\\n','\n');if(/^\d+\./.test(text))verses.append(p);else{p.className='credit-note';$('source-credits').append(p);}}
  await loadScore(xml,song.modeOverride);window.scrollTo({top:0,behavior:'instant'});library?.opened(song.id);
 }catch(e){console.error(e);$('status').textContent='Unable to load this local score. Reload to try again.';library?.failed();}
 finally{loading=false;setControls();}
}
// Local acceptance-test hooks.
window.prototype={get current(){return current;},get wanted(){return wanted;},get busy(){return busy;},get ready(){return ready;},get xml(){return lastXML;},get original(){return original;},get metrics(){return metrics;},get song(){return activeSong.id;},changeKey,preparePrint,loadScore,loadSong};
(async()=>{try{osmd=new opensheetmusicdisplay.OpenSheetMusicDisplay(stage,{backend:'svg',autoResize:false,drawTitle:false,drawSubtitle:false,drawComposer:false,drawLyricist:false,drawPartNames:false,drawFingerings:true,drawLyrics:true,drawMeasureNumbers:false,drawMetronomeMarks:true,newSystemFromXML:false,newPageFromXML:false});
 library=initLibrary({loadSong,isBusy:()=>busy||loading});
 if('serviceWorker' in navigator){try{await navigator.serviceWorker.register('./sw.js');await navigator.serviceWorker.ready;$('offline').textContent='Available offline';}catch(e){$('offline').textContent='Local score';}}
 }catch(e){console.error(e);$('status').textContent='Unable to load. Open this project through its local server.';}})();
