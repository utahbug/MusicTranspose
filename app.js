import {scoreIcon} from './icons.js';
import {meaningfulSource,meaningfulNumber,scoreMetadata} from './score-labels.js';
import {parseChordSymbol} from './chord-symbol.js';
import {initOfflineScore} from './offline-score-ui.js';
import {refreshOffline} from './offline-manager.js';
import {showUnavailableScore} from './score-availability.js';
import {phoneFooter} from './footer-viewport.js';
import {screenSecondaryLyrics} from './screen-secondary-lyrics.js';
import {installScreenPickupLayout,enableScreenPickupLayout} from './screen-pickup-layout.js';
installScreenPickupLayout(opensheetmusicdisplay);
import {withGeneratedHarmony} from './generated-harmony.js';
import {applyScorePageHint} from './score-page-hints.js';
import {installAccompanimentLayout,configureAccompanimentLayout} from './accompaniment-layout.js';
installAccompanimentLayout(opensheetmusicdisplay);
import {preferMusicalSections} from './section-layout.js';
import {appendSourceCreditFooter} from './print-source-credits.js';
import {createPdfAnnotations} from './pdf-annotations.js';
import {renderFullScoreLayout,renderPhoneFullScore} from './full-score-layout.js';
import {planSystemPages,measuredSystems,createSystemCanvas,showSystemPage} from './system-pagination.js';
import {applyLeadLayout,balanceLeadTail,renderLeadLayout,leadPrintXML} from './lead-layout.js';
import {normalOctaves,pianoHands,octaveSummary,shiftStaffOctaves} from './octave.js';
import {createMetronome} from './metronome.js';
import {createLeadXML,leadReasons,leadEngravingXML,installLeadHarmony} from './lead-view.js';
import {installLyricPlacement} from './lyric-placement.js';
installLyricPlacement(opensheetmusicdisplay);
installLeadHarmony(opensheetmusicdisplay);
import {readScoreSize,saveScoreSize,candidateZooms,assessLayout,chooseLayout,fitPhoneLayout} from './auto-layout.js';
import {lyricsIcon} from './icons.js';
import {openingMetadata,showOpeningMetadata} from './opening-metadata.js';
import {captureSystems,availableScoreHeight,rememberReadingPosition,restoreReadingPosition} from './virtual-pages.js';
import {alignTitleSubtitles} from './title-alignment.js';
import {showInstrumentKeys,initEnsemble} from './instrument-keys.js';
import {initPlaybackPreferences} from './playback-preferences.js';
import {createPlayback} from './playback.js';
import {getLyrics,lyricIds,createLyricsView} from './lyrics-view.js';
import {renderPdf,preparePdfPrint,originalPdfData,originalPageCount} from './pdf-score.js';
import {createScoreExport} from './score-export.js';
import {initLibrary} from './library.js';
import {avoidTempoCollisions} from './score-layout.js';
import {songs,supportsLead,refreshLocalMusic,localXML,localAsset} from './catalog.js';
import {initMyMusic} from './my-music.js';
import {buildKeys,originalKey,signature,unpackMXL,transposeXML,shiftOctaveXML,parseXML} from './music.js';
// New annotation-rejected RH textures use the established RH spacing profile.
const rightHandLead=lead=>lead?.selection?.voice==='rh-melody'||lead?.selection?.rightHandTexture===true;
const $=id=>document.getElementById(id),score=$('score'),stage=$('staging'),dialog=$('key-dialog');
$('show-lyrics').innerHTML=lyricsIcon;
let activeSong=songs[0],modeOverride,loading=false,pdfFallback=false,scoreSize=readScoreSize();
// OSMD uses container width / Zoom / 10 as the logical page width BEFORE layout.
let autoChoice=null,renderHeight=0,renderBudget=null;
const scoreSizes={normal:1};
let leadSource=null,leadState=null,lastViewXML='';
let readingPosition=null,handLayout={ok:false},octaveScope='both';
let KEYS=[],original='',current=0,wanted=0,currentOctave=normalOctaves(),wantedOctave=currentOctave,busy=false,ready=false,renderWidth=0,timer,osmd;
new MutationObserver(()=>{$('status').classList.toggle('visible-error',/Unable|Could not/.test($('status').textContent));}).observe($('status'),{childList:true});
let preparedHasChords=false,preparedHasSourceChords=false;
const wideScore=()=>matchMedia('(min-width:601px)').matches;
const keyFromPdf=()=>pdfFallback&&!!original&&KEYS.length>0&&!viewOnly();
const isPdf=()=>activeSong.scoreType==='pdf'||pdfFallback;
const hasTiming=song=>!!song&&!song.missing&&song.scoreType!=='pdf'&&song.playbackAvailable!==false;
const viewOnly=()=>activeSong.transpositionAvailable===false;
async function scoreSource(song){if(song.local)return localXML(song);const r=await fetch(song.asset);if(!r.ok)throw Error('Score unavailable');return unpackMXL(await r.arrayBuffer());}
let metronome;
let library,lyricsSong=null,scoreScroll=0,selectionVersion=0,rendering=null;
// One in-memory working view, scoped to the current Library/List context.
let workingSession=null,scoreContext=null;
const loadingNote=document.createElement('p');loadingNote.id='song-loading';loadingNote.setAttribute('role','status');loadingNote.hidden=true;score.before(loadingNote);
function finishSelection(token){if(token!==selectionVersion)return;loading=false;loadingNote.hidden=true;document.body.classList.remove('song-loading');setControls();}
// Selection identity and presentation change before the first asynchronous boundary.
// Same-song Lyrics toggles retain the transposed score behind the neutral loading state.
function beginSelection(song,retainScore=false){
 $('pdf-offline-message').hidden=true;
 const token=++selectionVersion;clearTimeout(timer);clearTimeout(resizeTimer);loading=true;if(!playback.songKey.startsWith(song.id+':'))playback.stop();lyricsView.hide();document.body.classList.remove('lyrics-open');
 if(!retainScore){workingSession=null;ready=false;original='';lastXML='';lastViewXML='';KEYS=[];leadSource=null;leadState=null;cache.clear();readingPosition=null;engravedXML='';score.replaceChildren();$('source-credits').replaceChildren();document.querySelector('.subtitle').replaceChildren();document.querySelector('.footnote').textContent='';$('key-name').textContent='';$('key-name').dataset.compact='';$('key-signature').textContent='';$('key').setAttribute('aria-label','Current key loading');document.querySelector('.masthead').dataset.printKey='';$('pdf-original').removeAttribute('href');pdfFallback=false;document.body.classList.remove('pdf-fallback-open');document.dispatchEvent(new Event('score-session-reset'));}
 activeSong=song;lyricsSong=null;document.querySelector('.score-heading h1').textContent=song.title;score.setAttribute('aria-label',song.title+' sheet music');score.setAttribute('aria-busy','true');$('status').textContent='Loading '+song.title+'…';loadingNote.textContent='Loading '+song.title+'…';loadingNote.hidden=false;document.body.classList.add('song-loading');library?.showScore();document.title=song.title+' · Music Transpose';setControls();return token;
}
const playback=createPlayback(async()=>{
 const song=document.body.classList.contains('lyrics-open')?lyricsSong:activeSong;
 if(!hasTiming(song))throw Error('No structured score');
 const xml=ready&&activeSong.id===song.id&&!isPdf()?(scoreSize==='large'&&leadState?.ok?lastViewXML:lastXML):await structuredSource(song);
 return {id:song.id,key:song.id+':'+xml,xml};
});
initPlaybackPreferences(playback);
initOfflineScore();
metronome=createMetronome(playback,()=>({standalone:!hasTiming(activeSong),available:ready&&!busy&&!loading&&!!activeSong&&!activeSong.missing&&!document.body.classList.contains('library-open')&&!document.body.classList.contains('lyrics-open'),xml:isPdf()?'pdf:'+activeSong.id:scoreSize==='large'&&leadState?.ok?lastViewXML:lastXML,song:activeSong.id}));
function playbackControls(){$('score-sound').hidden=!hasTiming(activeSong);const actions=document.querySelector('.score-heading .score-title-block');if(ready&&hasTiming(activeSong)){playback.attach(actions);}else actions.querySelector('.song-playback')?.remove();}
const lyricsView=createLyricsView($('lyrics-view'),{libraryControl:$('songs'),onScore:()=>showScoreView(lyricsSong?.id)});
const annotations=createPdfAnnotations({getState:()=>({song:activeSong,pdf:isPdf(),available:ready&&!busy&&!loading&&!document.body.classList.contains('library-open')&&!document.body.classList.contains('lyrics-open')})});
async function showScoreView(id){
 if(!id)return;
 library?.navigating('score',id);
 document.body.classList.remove('lyrics-open');lyricsView.hide();
 if(ready&&activeSong.id===id){document.title=activeSong.title+' · Music Transpose';window.scrollTo({top:scoreScroll,behavior:'instant'});$('show-lyrics').focus({preventScroll:true});document.dispatchEvent(new Event('score-view-shown'));metronome?.sync();}
 else{await loadSong(id);if(ready&&activeSong.id===id)$('show-lyrics').focus({preventScroll:true});}
}
async function openLyrics(id){
 const song=songs.find(s=>s.id===id);if(!song||!lyricIds.has(id))return;
 const fromScore=!document.body.classList.contains('library-open')&&!document.body.classList.contains('lyrics-open')&&ready&&activeSong.id===id;
 const retained=ready&&activeSong.id===id;scoreScroll=document.body.classList.contains('library-open')?0:scrollY;
 library?.navigating('lyrics',id);const token=beginSelection(song,retained);
 try{const data=await getLyrics(id);if(token!==selectionVersion)return;if(!data)throw Error('Lyrics unavailable');if(retained)score.setAttribute('aria-busy','false');lyricsSong=song;
 document.dispatchEvent(new CustomEvent('library-open',{detail:{retainScore:retained}}));document.body.classList.add('lyrics-open');
 lyricsView.show(data);if(!pdfFallback)playback.attach($('lyrics-view').querySelector('h1'));library.opened(id);document.title=song.title+' · Lyrics · MusicTranspose';window.scrollTo({top:0,behavior:'instant'});if(fromScore)$('lyrics-view').querySelector('.lyrics-score-toggle').focus({preventScroll:true});
 }catch(e){if(token!==selectionVersion)return;finishSelection(token);library?.failed();$('library-message').textContent='Unable to load lyrics. Please try again.';$('status').textContent='Unable to load lyrics. Please try again.';}finally{finishSelection(token);}
}
$('show-lyrics').onclick=()=>openLyrics(activeSong.id);
const sourceCache=new Map(),sourcePending=new Map(); // Share timing/view loads without engraving.
async function structuredSource(song){
 if(sourceCache.has(song.asset))return sourceCache.get(song.asset);
 if(!sourcePending.has(song.asset))sourcePending.set(song.asset,scoreSource(song).then(xml=>{sourceCache.set(song.asset,xml);return xml;}).finally(()=>sourcePending.delete(song.asset)));
 return sourcePending.get(song.asset);
}
const cache=new Map(),metrics=[];let lastXML='',engravedXML='';
const scoreExport=createScoreExport({originalPdfData,preparePrint,getState:()=>{
 const pdf=isPdf(),melody=!pdf&&scoreSize==='large'&&!!leadState?.ok,key=KEYS.find(k=>k.shift===current);
 return {songId:activeSong.id,local:!!activeSong.local,title:activeSong.title,view:pdf?'original':melody?'melody':'transpose',
  available:ready&&!busy&&!loading&&score.getAttribute('aria-busy')==='false'&&(pdf||wanted===current&&wantedOctave===currentOctave),
  xml:pdf?original:melody?lastViewXML:lastXML,pdfUrl:$('pdf-original').href,
  key:key?key.name+' '+(key.mode==='minor'?'Minor':'Major'):''};
}});
function width(){return Math.round(score.clientWidth);}
function setControls(){scoreExport.sync();annotations.sync();metronome?.sync();document.body.classList.toggle('lead-score-open',!isPdf()&&scoreSize==='large'&&!!leadState?.ok);$('score-source').textContent=scoreMetadata(activeSong);$('score-source').hidden=!scoreMetadata(activeSong);$('score-source').title=$('score-source').textContent;$('score-source').dataset.compact=[({'Children’s Songbook':'CS',"Children's Songbook":"CS",'Hymns (1985)':'Hymns','Hymns for Home and Church':'HHC'}[activeSong.collection]||meaningfulSource(activeSong)),meaningfulNumber(activeSong)].filter(Boolean).join(' · ');const sourceKey=!isPdf()&&KEYS.find(k=>k.shift===0);$('original-key-reference').hidden=!sourceKey;$('original-key-reference').textContent=sourceKey?'Original: '+sourceKey.name+' '+(sourceKey.mode==='minor'?'Min':'Maj'):''; requestAnimationFrame(alignTitleSubtitles); const concert=KEYS.find(k=>k.shift===current);if(concert&&!isPdf()&&!viewOnly())showInstrumentKeys(concert,KEYS); playback.setBlocked(!hasTiming(activeSong)||busy||loading||!isPdf()&&(wanted!==current||wantedOctave!==currentOctave));playbackControls(); $('show-lyrics').hidden=!lyricIds.has(activeSong.id);$('show-lyrics').disabled=!ready||busy||loading; syncScoreView(); $('songs').disabled=busy||loading;$('reset').hidden=isPdf()||viewOnly()||!(current!==0||Object.values(currentOctave).some(n=>n!==0));$('reset').disabled=isPdf()||viewOnly()||!ready||busy||loading;$('key').disabled=(isPdf()&&!keyFromPdf())||viewOnly()||!ready||(keyFromPdf()&&(busy||loading));document.body.classList.toggle('pdf-key-available',keyFromPdf());if(keyFromPdf()){const k=KEYS.find(k=>k.shift===0);$('key-name').textContent=k.name+' '+(k.mode==='minor'?'Min':'Maj');$('key-signature').textContent=k.fifths?'('+signature(k)+')':'';$('key').setAttribute('aria-label',`PDF key ${k.name} ${k.mode}. Choose key`);showInstrumentKeys(k,KEYS);}$('print').disabled=!ready||busy;
 syncOctaveControls();
 for(const b of dialog.querySelectorAll('[data-shift]')){const n=Number(b.dataset.shift);b.setAttribute('aria-pressed',String(n===(keyFromPdf()?0:current)));b.querySelector('.marker').textContent=n===(keyFromPdf()?0:current)?(n===0?'Original · Current':'Current'):n===0?'Original · 0':'';}
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
function commit(entry,shift,octave,w){if(scoreSize==='auto'&&autoChoice)autoChoice.zoom=entry.zoom;score.innerHTML=entry.svg;document.dispatchEvent(new CustomEvent('score-engraved',{detail:{song:activeSong.id,systems:entry.systemLayout,lead:!!entry.leadState?.ok}}));score.dataset.systems=entry.systems;trimScreenMargin();restoreReadingPosition(readingPosition);readingPosition=null;current=shift;currentOctave=octave;renderWidth=w;renderHeight=innerHeight;renderBudget=entry.footerBudget;score.dataset.zoom=entry.zoom;score.autoReport=entry.autoReport||null;score.dataset.fullScoreSpacing=entry.fullScoreSpacing||'lead';lastXML=entry.xml;lastViewXML=entry.viewXML||entry.xml;leadState=entry.leadState||null;if(viewOnly()){$('status').textContent='View only · Transposition unavailable';document.querySelector('.masthead').dataset.printKey='';score.setAttribute('aria-busy','false');return;}const k=KEYS.find(k=>k.shift===current);$('key-name').textContent=k.name+' '+(k.mode==='minor'?'Min':'Maj');$('key-name').dataset.compact=k.name+' '+(k.mode==='minor'?'Min':'Maj');$('key-signature').textContent=k.fifths?'('+signature(k)+')':'';$('key').setAttribute('aria-label',`Current key ${k.name} ${k.mode}, ${Math.abs(k.fifths)} ${k.fifths<0?'flats':'sharps'}. Choose key`);$('status').textContent=`${k.name} ${k.mode}${shift===0?' · Original key':''} · ${octaveSummary(octave,handLayout,scoreSize==='large')}`;document.querySelector('.masthead').dataset.printKey=k.name+' '+k.mode;score.setAttribute('aria-busy','false');}
// Keep the shared OSMD instance serialized; obsolete owners cannot publish its output.
function pump(){
 if(rendering)return rendering.then(()=>pump());
 const task=renderScore();rendering=task;return task.finally(()=>{if(rendering===task)rendering=null;});
}
async function renderScore(){
 const token=selectionVersion;
 if(isPdf()||busy||!original||width()<100)return;busy=true;setControls();
 // Browser chrome can change the usable phone height without changing innerHeight.
 // Cache and retry against that budget, not the previous view's fitting result.
 try{while(true){const target=wanted,octave=wantedOctave,w=width();if(w<100)break;const footerBudget=phoneFooter()?Math.round(availableScoreHeight(score)):null;const density=scoreSize,phoneTarget=matchMedia('(max-width:600px)').matches?(originalPageCount(activeSong.pdfAsset)||1):null;const id=`${w}:${innerHeight}:${matchMedia('(max-width:600px)').matches}:${target}:${JSON.stringify(octave)}:${density}:${phoneTarget}:${footerBudget}`;const start=performance.now();const cached=cache.get(id);
  if(cached){commit(cached,target,octave,w);metrics.push({shift:target,octave,width:w,ms:performance.now()-start,cached:true});}
  else{const xml=viewOnly()?original:shiftStaffOctaves(transposeXML(original,target,modeOverride),octave,handLayout);let lead=null,viewXML=xml;if(density==='large'){if(!leadSource){leadSource=createLeadXML(original,activeSong);if(!leadSource.ok)console.info('Lead fallback',activeSong.id,leadSource.reason,leadSource.detail);}lead={...leadSource,xml:undefined};if(lead.ok)viewXML=viewOnly()?leadSource.xml:shiftOctaveXML(transposeXML(leadSource.xml,target,modeOverride),octave.lead);}
   applyLeadLayout(osmd,!!lead?.ok,{rightHand:rightHandLead(lead),phone:matchMedia('(max-width:600px)').matches});
   // Screen presentation only. Keep xml/viewXML canonical for timing, print and export.
   const screenXML=lead?.ok?viewXML:screenSecondaryLyrics(viewXML).xml;
   const displayXML=openingMetadata(lead?.ok?leadEngravingXML(screenXML):screenXML).displayXML;stage.style.width=w+'px';configureAccompanimentLayout(osmd,displayXML);osmd.EngravingRules.SpacingBetweenTextLines=0;if(engravedXML!==displayXML){await osmd.load(displayXML);if(token!==selectionVersion)return;engravedXML=displayXML;}if(target!==wanted||octave!==wantedOctave||w!==width()||(phoneFooter()&&footerBudget!==Math.round(availableScoreHeight(score))))continue;
   // Internal engraving margins participate in automatic system breaking.
   // Share compact header-aligned bounds; retain each mode's existing notation scale.
   const phone=matchMedia('(max-width:600px)').matches;
   if(!lead?.ok){osmd.EngravingRules.PageLeftMargin=.6;osmd.EngravingRules.PageRightMargin=.6;}
   const base=phone||w<800?.78:.9,available=availableScoreHeight(score),geometry=`${w}:${innerHeight}:${phone}:${Math.round(available)}`;
   // Tail balancing can install temporary system breaks. Each phone scale trial
   // must begin with the source breaks, not inherit the preceding larger layout.
   const phoneBreaks=phone&&lead?.ok?osmd.Sheet.SourceMeasures.map(m=>m.printNewSystemXml):null,phoneBreakRule=osmd.EngravingRules.NewSystemAtXMLNewSystemAttribute;
   const fullRightMargin=osmd.EngravingRules.SystemRightMargin;
   const renderOnce=(zoom,staffOwnership=false)=>{if(phoneBreaks){osmd.Sheet.SourceMeasures.forEach((m,i)=>m.printNewSystemXml=phoneBreaks[i]);osmd.EngravingRules.NewSystemAtXMLNewSystemAttribute=phoneBreakRule;}osmd.Zoom=zoom;if(lead?.ok)renderLeadLayout(osmd,stage);else if(phone)renderPhoneFullScore(osmd,stage,fullRightMargin);else osmd.render();avoidTempoCollisions(stage,displayXML);let systemLayout=captureSystems(osmd,stage,{staffOwnership});if(lead?.ok)systemLayout=preferMusicalSections(osmd,stage,viewXML,systemLayout,{width:w,available,zoom,render:(staffOwnership=false)=>{renderLeadLayout(osmd,stage);avoidTempoCollisions(stage,displayXML);return captureSystems(osmd,stage,{staffOwnership});}});return {systemLayout,svg:stage.innerHTML,xml,viewXML,leadState:lead,zoom,systems:osmd.GraphicSheet.MusicPages.reduce((n,p)=>n+p.MusicSystems.length,0)};};
   // Screen-only lower bound: 11px lyric text and at least .55 notation scale.
   const phoneQuality={minimumLyric:11,lyricTolerance:lead?.ok?0:1e-6,pagination:{gapCap:lead?.ok?14:24,minimumGap:lead?.ok?8:12,preferSections:!!lead?.ok}};
   const assess=e=>assessLayout(stage,e.systemLayout,w,available,e.zoom,phone?phoneQuality:undefined);
   const render=zoom=>lead?.ok&&!rightHandLead(lead)?renderOnce(zoom):renderFullScoreLayout(osmd,()=>renderOnce(zoom),assess);
   let entry;
   if(phone&&(density==='auto'||lead?.ok)){
    entry=fitPhoneLayout(render,assess,lead?.ok?.88:base,phoneTarget);
   }else if(density==='auto'){
    const candidates=[];
    // Keep a valid density across nearby key/register changes, avoiding visual jumps.
    if(autoChoice?.geometry===geometry){const retained=render(autoChoice.zoom);retained.autoReport=assessLayout(stage,retained.systemLayout,w,available,retained.zoom);if(retained.autoReport.readable&&retained.autoReport.collisions===0){entry=retained;entry.autoReport.retained=true;}else candidates.push(retained);}
    if(!entry){for(const zoom of candidateZooms(base,phone)){let candidate=candidates.find(e=>e.zoom===zoom);if(!candidate){candidate=render(zoom);candidate.autoReport=assessLayout(stage,candidate.systemLayout,w,available,zoom);candidates.push(candidate);}candidate.autoReport.baseline=zoom===base;}entry=chooseLayout(candidates);entry.autoReport.candidates=candidates.map(e=>({...e.autoReport,candidates:undefined}));}
    autoChoice={geometry,zoom:entry.zoom};
   }else entry=render(density==='large'?(lead?.ok?(phone?.88:.9):base):base*scoreSizes[density]);
   if(target!==wanted||octave!==wantedOctave||w!==width()||(phoneFooter()&&footerBudget!==Math.round(availableScoreHeight(score))))continue;
   if(!lead?.ok)entry=applyScorePageHint(osmd,stage,activeSong.id,'transpose',entry,{width:w,available,render:renderOnce});
   entry.footerBudget=footerBudget;cache.set(id,entry);if(cache.size>36)cache.delete(cache.keys().next().value);commit(entry,target,octave,w);metrics.push({shift:target,octave,width:w,ms:performance.now()-start,cached:false});
  }
  if(target===wanted&&octave===wantedOctave&&w===width())break;
 }}catch(e){if(token!==selectionVersion)return;if(scoreSize==='large'&&leadSource?.ok){console.warn('Lead engraving fallback',activeSong.id,e);leadSource={ok:false,xml:original,reason:'rendering',message:leadReasons.rendering,detail:e.message};scoreSize='normal';saveScoreSize(scoreSize);engravedXML='';cache.clear();busy=false;return await renderScore();}console.error(e);wanted=current;wantedOctave=currentOctave;$('status').textContent='Could not change the score. Please reload to try again.';score.setAttribute('aria-busy','false');}
 finally{busy=false;if(token===selectionVersion)ready=!!score.querySelector('svg');setControls();}
}
export function changeKey(n){playback.stop();if((isPdf()&&!keyFromPdf())||viewOnly())return;if(!Number.isInteger(n)||n< -6||n>6)return;if(keyFromPdf()){leavePdfView();scoreSize='auto';saveScoreSize(scoreSize);autoChoice=null;cache.clear();}wanted=n;score.setAttribute('aria-busy','true');$('status').textContent='Changing to '+KEYS.find(k=>k.shift===n).name+' '+KEYS.find(k=>k.shift===n).mode+'…';setControls();clearTimeout(timer);timer=setTimeout(pump,20);}
function syncOctaveControls(){
 const lead=scoreSize==='large'&&leadSource?.ok,split=handLayout.ok&&!lead,disabled=isPdf()||viewOnly()||!ready||busy||loading;
 $('key-octave').hidden=isPdf()||viewOnly();
 $('octave-scopes').hidden=!split;
 const down=n=>n<0?'8vb':'8va',spoken=n=>n<0?'one octave down':'one octave up';
 let label='Normal',description='Normal';
 if(lead||!split){const n=lead?wantedOctave.lead:wantedOctave.all;if(n){label=down(n);description=spoken(n);}}
 else{const {rh,lh}=wantedOctave;if(rh||lh){if(rh&&lh&&rh!==lh){label='Custom';description='Custom, right hand '+spoken(rh)+', left hand '+spoken(lh);}
 else{const hand=rh===lh?'Both':rh?'RH':'LH',n=rh||lh;label=hand+' · '+down(n);description=({Both:'both hands',RH:'right hand',LH:'left hand'})[hand]+', '+spoken(n);}}}
 $('octave-label').textContent='Octave: '+label;
 $('octave-toggle').setAttribute('aria-label','Octave, '+description);
 const reason=!split&&!lead?(handLayout.reason||'Separate hands require a clear two-staff piano layout.'):'';
 $('octave-toggle').title=reason;
 if(reason)$('octave-toggle').setAttribute('aria-description',reason);else $('octave-toggle').removeAttribute('aria-description');
 for(const button of $('octave-scopes').querySelectorAll('button')){button.disabled=disabled;button.setAttribute('aria-pressed',String(button.dataset.scope===octaveScope));}
 const value=lead?wantedOctave.lead:!split?wantedOctave.all:octaveScope==='both'?(wantedOctave.rh===wantedOctave.lh?wantedOctave.rh:null):wantedOctave[octaveScope];
 for(const input of document.querySelectorAll('input[name=octave]')){input.disabled=disabled;input.checked=Number(input.value)===value;}
}
function changeOctave(n,scope=octaveScope){
 playback.stop();
 if(isPdf()||viewOnly()||!ready||!Number.isInteger(n)||Math.abs(n)>1)return;
 const lead=scoreSize==='large'&&leadSource?.ok;
 if(!['both','rh','lh'].includes(scope)||!lead&&!handLayout.ok&&scope!=='both')return;
 wantedOctave=lead?{...wantedOctave,lead:n}:!handLayout.ok?{...wantedOctave,all:n}:scope==='both'?{...wantedOctave,rh:n,lh:n}:{...wantedOctave,[scope]:n};score.setAttribute('aria-busy','true');$('status').textContent='Changing score register…';setControls();clearTimeout(timer);timer=setTimeout(pump,20);
}
const closeEnsemble=initEnsemble(shift=>{dialog.close();changeKey(shift);});
function buildChooser(){
 closeEnsemble();
 for(const id of ['higher','original','lower'])$(id).replaceChildren();
 for(const key of KEYS){const b=document.createElement('button');b.className='key-choice';b.dataset.shift=key.shift;b.setAttribute('aria-label',`${key.name} ${key.mode}, ${Math.abs(key.fifths)} ${key.fifths<0?'flats':'sharps'}${key.shift===0?', original key':`, ${key.shift>0?'+':''}${key.shift} semitones from original`}`);b.innerHTML=`<span class="name">${key.name}</span><span class="signature" aria-hidden="true">${signature(key)}</span><span class="distance">${key.shift>0?'+':''}${key.shift}</span><span class="marker"></span>`;if(key.shift===0)b.querySelector('.distance').remove();b.onclick=()=>{dialog.close();changeKey(key.shift);};$(key.shift>0?'higher':key.shift<0?'lower':'original').append(b);}
// Lower keys are ordered outward from the original, not by numeric pitch.
$('lower').replaceChildren(...[...$('lower').children].reverse());
}
$('reset').onclick=()=>{wantedOctave=normalOctaves();changeKey(0);};
function syncScoreView(){
 const wide=wideScore();
 const view=isPdf()?'pdf':scoreSize==='large'?'large':'auto',label={pdf:'Original',auto:'Transpose',large:'Melody only'}[view];
 $('score-size').disabled=!ready||busy||loading;$('score-size').dataset.size=scoreSize;$('score-size').dataset.view=view;
 $('score-view-label').textContent=wide?'Score':label;$('score-size').setAttribute('aria-label',wide?'Score':'Score View: '+label);$('score-size').title=wide?'Score':'Score View: '+label;
 const available={pdf:activeSong.scoreType==='pdf'||!!activeSong.pdfAsset,auto:activeSong.scoreType!=='pdf'&&!!original&&preparedHasChords&&!(keyFromPdf()&&preparedHasSourceChords&&!activeSong.local),large:activeSong.scoreType!=='pdf'&&(leadSource?leadSource.ok:supportsLead(activeSong))};
 const explanations={pdf:'Original PDF is not available for this song.',auto:'Transpose is not available for this score.',large:'Melody only is not available for this score.'};
 for(const option of $('score-size-options').querySelectorAll('[data-size]')){const type=option.dataset.size;option.textContent={pdf:'View PDF',auto:'Show chords',large:preparedHasChords&&original?'Melody only (lead sheet)':'Melody only'}[type];option.hidden=!available[type];option.disabled=!available[option.dataset.size];const selected=!option.disabled&&option.dataset.size===view;option.setAttribute('aria-pressed',String(selected));option.setAttribute('aria-checked',String(selected));if(option.disabled){option.title=explanations[option.dataset.size];option.setAttribute('aria-description',option.title);}else{option.removeAttribute('title');option.removeAttribute('aria-description');}}
}
const sizeOptions=$('score-size-options');
// A fixed popup must not inherit the phone sheet's viewport clipping.
document.body.append(sizeOptions);
function closeSizeOptions(focus=false){sizeOptions.hidden=true;$('score-size').setAttribute('aria-expanded','false');if(focus)$('score-size').focus({preventScroll:true});}
$('score-size').onclick=()=>{if(busy||loading||!ready)return;if(!sizeOptions.hidden){closeSizeOptions();return;}sizeOptions.hidden=false;$('score-size').setAttribute('aria-expanded','true');const rect=$('score-size').getBoundingClientRect();sizeOptions.style.left=Math.max(8,Math.min(rect.right-sizeOptions.offsetWidth,innerWidth-sizeOptions.offsetWidth-8))+'px';sizeOptions.style.top=(rect.bottom+sizeOptions.offsetHeight+14>innerHeight?Math.max(8,rect.top-sizeOptions.offsetHeight-6):rect.bottom+6)+'px';(sizeOptions.querySelector('[aria-pressed=true]:not([hidden])')||sizeOptions.querySelector('button:not([hidden]):not(:disabled)'))?.focus({preventScroll:true});};
for(const option of sizeOptions.querySelectorAll('[data-size]'))option.onclick=async()=>{
 if(option.disabled)return;
 playback.stop();
 const next=option.dataset.size;closeSizeOptions(true);$('pdf-offline-message').hidden=true;
 const restoreFocus=()=>{const button=$('score-size');if(document.activeElement===document.body&&!button.disabled&&button.getClientRects().length)button.focus({preventScroll:true});};
 if(next==='pdf'){if(!isPdf())await showPdfFallback();restoreFocus();return;}
 if(!original){
  const token=selectionVersion,song=activeSong;loading=true;setControls();
  try{await prepareStructured(song,token);if(token!==selectionVersion)return;}
  catch(error){if(token!==selectionVersion)return;ready=true;score.setAttribute('aria-busy','false');$('status').textContent='Unable to prepare this score. Please try again.';return;}
  finally{finishSelection(token);}
 }
 if(next==='large'&&!leadSource)leadSource=createLeadXML(original,activeSong);
 if(next==='large'&&!leadSource?.ok){$('status').textContent='Unable to prepare Melody only. '+(leadSource?.message||'Melody only is unavailable for this score.');ready=true;score.setAttribute('aria-busy','false');setControls();restoreFocus();return;}
 if(pdfFallback){wanted=0;leavePdfView();}
 else readingPosition=rememberReadingPosition();
 scoreSize=next;saveScoreSize(scoreSize);if(scoreSize==='auto'){autoChoice=null;cache.clear();}
 score.setAttribute('aria-label',activeSong.title+' sheet music');score.setAttribute('aria-busy','true');await pump();restoreFocus();
};
function leavePdfView(){pdfFallback=false;document.body.classList.remove('pdf-score-open','pdf-fallback-open','pdf-key-available');$('pdf-notice').hidden=true;$('pdf-offline-message').hidden=true;document.dispatchEvent(new Event('score-session-reset'));readingPosition=null;}
// Legacy helper also serves the normal Original PDF presentation (not an error).
async function showPdfFallback(selectionToken){
 if(!activeSong.pdfAsset||busy||(loading&&selectionToken!==selectionVersion))return;
 const token=selectionToken??++selectionVersion;
 playback.stop();loading=true;ready=false;pdfFallback=true;clearTimeout(timer);
 document.dispatchEvent(new Event('score-session-reset'));document.body.classList.add('pdf-score-open','pdf-fallback-open');
 $('pdf-notice').hidden=false;$('pdf-original').href=activeSong.pdfAsset;score.style.removeProperty('--score-trim');
 score.setAttribute('aria-label',activeSong.title+' PDF score');score.setAttribute('aria-busy','true');setControls();
 try{await renderPdf(activeSong.pdfAsset,score,activeSong.title,()=>token===selectionVersion);if(token!==selectionVersion)return;ready=true;score.setAttribute('aria-busy','false');$('status').textContent='PDF score';window.scrollTo({top:0,behavior:'instant'});}
 catch(error){if(token!==selectionVersion)return;console.error(error);pdfFallback=false;document.body.classList.remove('pdf-score-open','pdf-fallback-open');$('pdf-notice').hidden=true;await pump();$('status').textContent='Original PDF is not available offline yet. Use Save on this device in Tools while online.';$('pdf-offline-message').textContent=$('status').textContent;$('pdf-offline-message').hidden=false;}
 finally{finishSelection(token);}
}
document.addEventListener('pointerdown',e=>{if(!sizeOptions.hidden&&!sizeOptions.contains(e.target)&&!$('score-size').contains(e.target))closeSizeOptions();});
sizeOptions.addEventListener('keydown',e=>{
 if(['ArrowDown','ArrowRight','ArrowUp','ArrowLeft','Home','End'].includes(e.key)){e.preventDefault();e.stopPropagation();const options=[...sizeOptions.querySelectorAll('button:not([hidden]):not(:disabled)')],index=options.indexOf(document.activeElement);options[e.key==='Home'?0:e.key==='End'?options.length-1:(index+(['ArrowDown','ArrowRight'].includes(e.key)?1:-1)+options.length)%options.length]?.focus();}
});
document.addEventListener('keydown',e=>{if(!sizeOptions.hidden&&e.key==='Escape'){e.preventDefault();closeSizeOptions(true);}});
document.addEventListener('focusin',e=>{if(!sizeOptions.hidden&&!sizeOptions.contains(e.target)&&e.target!==$('score-size'))closeSizeOptions();});
// One control map at every viewport; move existing buttons, preserving handlers/focus.
document.querySelector('.playing-controls').prepend($('songs'));
// True left/right footer zones; phone CSS still flattens these into its existing row.
document.querySelector('.playing-controls').append($('score-size'),$('key'),$('reset'));
document.querySelector('.utility-controls').prepend($('show-lyrics'));
$('score-size').querySelector('.score-view-icon').outerHTML=scoreIcon.replace('class="ui-icon', 'class="score-view-icon ui-icon');
$('show-lyrics').classList.add('view-switch');
window.addEventListener('resize',()=>{closeSizeOptions();setControls();});
document.addEventListener('library-open',()=>closeSizeOptions());
for(const button of $('octave-scopes').querySelectorAll('button'))button.onclick=()=>{octaveScope=button.dataset.scope;syncOctaveControls();};
for(const input of document.querySelectorAll('input[name=octave]'))input.onchange=()=>changeOctave(Number(input.value));
$('octave-toggle').onclick=()=>{const expanded=$('octave-panel').hidden;$('octave-panel').hidden=!expanded;$('octave-toggle').setAttribute('aria-expanded',String(expanded));};
$('key').onclick=()=>{$('octave-panel').hidden=true;$('octave-toggle').setAttribute('aria-expanded','false');setControls();dialog.showModal();dialog.scrollTop=0;$('close-dialog').focus({preventScroll:true});};$('close-dialog').onclick=()=>dialog.close();dialog.onclick=e=>{if(e.target===dialog){const r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)dialog.close();}};
async function preparePrint(){
 if(isPdf())return preparePdfPrint(score,$('print-pages'));
 const printXML=lastViewXML||lastXML,printKey=viewOnly()?'':KEYS.find(k=>k.shift===current).name+' '+KEYS.find(k=>k.shift===current).mode;const host=$('print-staging');host.replaceChildren();host.style.width='794px';
 const engraver=new opensheetmusicdisplay.OpenSheetMusicDisplay(host,{backend:'svg',autoResize:false,pageFormat:'A4 P',drawTitle:true,drawSubtitle:false,drawComposer:false,drawLyricist:false,drawPartNames:false,drawFingerings:true,drawLyrics:true,drawMeasureNumbers:false,newSystemFromXML:false,newPageFromXML:false});
 applyLeadLayout(engraver,!!leadState?.ok&&scoreSize==='large',{print:true,rightHand:rightHandLead(leadState)});
 await engraver.load(leadState?.ok&&scoreSize==='large'?leadPrintXML(leadEngravingXML(printXML),activeSong.title):printXML);engraver.Zoom=.8;
 const printWidth=794,keyInset=22,available=printWidth*270/190-keyInset;
 const renderPrint=()=>{engraver.render();if(leadState?.ok&&scoreSize==='large')balanceLeadTail(engraver);avoidTempoCollisions(host,printXML);return {systemLayout:captureSystems(engraver,host)};};
 if(leadState?.ok&&scoreSize==='large'&&!rightHandLead(leadState)){engraver.render();balanceLeadTail(engraver);avoidTempoCollisions(host,printXML);}else renderFullScoreLayout(engraver,renderPrint,e=>assessLayout(host,e.systemLayout,printWidth,available,.8));
 const pages=$('print-pages');pages.replaceChildren();
 const originals=[...host.querySelectorAll('svg')];
 const groups=planSystemPages(measuredSystems(captureSystems(engraver,host),originals,printWidth),available,{gapCap:leadState?.ok&&scoreSize==='large'?14:24,minimumGap:leadState?.ok&&scoreSize==='large'?8:12});
 for(const group of groups){const section=document.createElement('section');section.className='print-page';section.dataset.systems=group.count;section.dataset.used=group.used;section.dataset.available=available;const label=document.createElement('p');label.className='print-key';label.textContent=printKey;
  const svg=showSystemPage(createSystemCanvas(originals),group,printWidth);svg.setAttribute('viewBox',`0 ${-keyInset} ${printWidth} ${group.used+keyInset}`);svg.setAttribute('height',group.used+keyInset);section.append(label,svg);pages.append(section);}
 pages.lastElementChild?.classList.add('last-score-page');
 appendSourceCreditFooter(original,pages,activeSong.title);
 document.body.classList.add('prepared-print');return pages.querySelectorAll('.print-page').length;
}
$('print').onclick=async()=>{if(busy)return;$('print').disabled=true;try{await preparePrint();window.print();}catch(e){console.error(e);$('status').textContent='Unable to prepare printing. Please try again.';}finally{setControls();}};
let resizeTimer;
function scheduleScoreResize(){clearTimeout(resizeTimer);resizeTimer=setTimeout(()=>{if(original&&width()>100&&(width()!==renderWidth||(scoreSize==='auto'&&innerHeight!==renderHeight)||(phoneFooter()&&Math.round(availableScoreHeight(score))!==renderBudget)))pump();},140);}
new ResizeObserver(scheduleScoreResize).observe(score);
window.addEventListener('resize',scheduleScoreResize);
document.addEventListener('score-footer-geometry',scheduleScoreResize);
// Mobile Safari can settle its browser chrome through visualViewport alone.
// Reuse the existing fitting path; pinch zoom must not re-engrave the score.
window.visualViewport?.addEventListener('resize',()=>{if(matchMedia('(max-width:600px)').matches&&Math.abs(visualViewport.scale-1)<.01)scheduleScoreResize();});
async function loadScore(xml,override,token=selectionVersion,engrave=true,deriveLead=true){
 if(rendering)await rendering;if(token!==selectionVersion)return;
 xml=await withGeneratedHarmony(xml,activeSong.id);if(token!==selectionVersion)return;
 const chordDoc=parseXML(xml);preparedHasChords=!!chordDoc.querySelector('harmony')||[...chordDoc.querySelectorAll('direction > direction-type')].some(type=>{const words=[...type.children].filter(e=>e.localName==='words');return words.length&&!words.some(w=>w.children.length)&&!!parseChordSymbol(words.map(w=>w.textContent).join(''));});
 // Bundled PDFs preserve source chords; generated overlays add information absent from them.
 // Local PDF/XML pairings are not assumed to share the same chord content.
 preparedHasSourceChords=preparedHasChords&&(!chordDoc.querySelector('harmony[id^="mt-generated-"]'));
 const source=viewOnly()?null:originalKey(xml,override),keys=source?buildKeys(source):[];modeOverride=override;
 clearTimeout(timer);autoChoice=null;leadSource=deriveLead?createLeadXML(xml,activeSong):null;leadState=null;lastViewXML='';if(scoreSize==='large'&&leadSource&&!leadSource.ok){scoreSize='normal';saveScoreSize(scoreSize);}original=xml;handLayout=pianoHands(xml);KEYS=keys;current=0;wanted=0;currentOctave=normalOctaves();wantedOctave=currentOctave;octaveScope='both';ready=false;cache.clear();
 showOpeningMetadata(document.querySelector('.score-heading .subtitle'),scoreMetadata(activeSong),xml,$('score-source'));
 if(!source){showOpeningMetadata(document.querySelector('.score-heading .subtitle'),scoreMetadata(activeSong)+' · View only',xml,$('score-source'));document.querySelector('.footnote').textContent='Transposition unavailable for this imported score.';score.setAttribute('aria-busy','true');if(engrave)await pump();return;}
 buildChooser();document.querySelector('.dialog-hint').textContent='All destinations remain '+source.mode+'.';document.querySelector('.footnote').textContent='Original key: '+source.name+' '+source.mode+' · Tap the key to choose another.';
 score.setAttribute('aria-busy','true');if(engrave)await pump();
}
async function prepareStructured(song,token,deriveLead=true){
  const xml=await structuredSource(song);if(token!==selectionVersion)return;
  if(song.transpositionAvailable!==false){const key=originalKey(xml,song.modeOverride);if(key.name!==song.tonic||key.mode!==song.mode||key.fifths!==song.fifths)throw new Error('Score and registry disagree');}
  activeSong=song;document.title=song.title+' · Music Transpose';document.querySelector('.score-heading h1').textContent=song.title;
  document.querySelector('.subtitle').replaceChildren();score.setAttribute('aria-label',song.title+' sheet music');
  $('source-credits').replaceChildren();
  const credits=[...parseXML(xml).querySelectorAll('credit')].map(c=>[...c.querySelectorAll('credit-words')].map(w=>w.textContent).join('')).filter(t=>t.trim()!==song.title);
  const verses=document.createElement('div');verses.className='extra-verses';$('source-credits').append(verses);
  for(const text of credits){const p=document.createElement('p');p.textContent=text.replaceAll('\\n','\n');if(/^\d+\./.test(text))verses.append(p);else{p.className='credit-note';$('source-credits').append(p);}}
  // Prepare structured controls without engraving an XML page behind the PDF.
  await loadScore(xml,song.modeOverride,token,false,deriveLead);if(token!==selectionVersion)return;
}
async function loadSong(id,requestedView){
 const song=songs.find(s=>s.id===id);if(!song)throw new Error('Unknown song');
 if(showUnavailableScore(song))return;
 const context=library?.context()??null;
 const resume=!requestedView&&workingSession?.id===id&&workingSession.context===context?workingSession:null;
 const originalPdf=!requestedView&&!resume&&!!song.pdfAsset&&song.scoreType!=='pdf';
 if(resume)scoreSize=resume.view;
 scoreContext=context;
 if(requestedView==='large'||(requestedView==='normal'||!requestedView&&!resume)&&scoreSize==='large'){scoreSize=requestedView||'normal';saveScoreSize(scoreSize);}
 library?.navigating('score',id);
 const token=beginSelection(song);
 try{
  pdfFallback=false;document.body.classList.remove('pdf-fallback-open');document.body.classList.toggle('view-only-score',song.transpositionAvailable===false);
  document.body.classList.toggle('pdf-score-open',song.scoreType==='pdf');$('pdf-notice').hidden=song.scoreType!=='pdf';score.style.removeProperty('--score-trim');
  if(song.scoreType==='pdf'){
   if(scoreSize==='large'){scoreSize='normal';saveScoreSize(scoreSize);}current=0;wanted=0;currentOctave=normalOctaves();wantedOctave=currentOctave;octaveScope='both';score.setAttribute('aria-label',song.title+' PDF score');
   const asset=song.local?await localAsset(song):song.asset;if(token!==selectionVersion)return;$('pdf-original').href=asset;
   await renderPdf(asset,score,song.title,()=>token===selectionVersion);if(token!==selectionVersion)return;ready=true;score.setAttribute('aria-busy','false');$('status').textContent='PDF score. Transposition unavailable.';library?.opened(song.id);window.scrollTo({top:0,behavior:'instant'});return;
  }
  await prepareStructured(song,token,!originalPdf);if(token!==selectionVersion)return;
  if(resume){wanted=resume.key;wantedOctave={...resume.octave};}
  if(originalPdf)await showPdfFallback(token);else await pump();
  if(token!==selectionVersion)return;window.scrollTo({top:0,behavior:'instant'});library?.opened(song.id);
 }catch(e){if(token!==selectionVersion)return;console.error(e);finishSelection(token);$('status').textContent=song.scoreType==='pdf'&&!song.local?'Original PDF is not available offline yet. Use Save on this device in Tools while online.':'Unable to open this score. Please try again.';if(song.scoreType==='pdf'&&!song.local){$('pdf-offline-message').textContent=$('status').textContent;$('pdf-offline-message').hidden=false;}library?.failed();}
 finally{finishSelection(token);}
}
// Retain deliberate structured work for a same-song, same-context reopening only.
// Parsed source assets stay cached; Library data and navigation preferences are independent.
function cancelPendingSelection(){if(!loading&&!busy)return;selectionVersion++;loading=false;ready=false;original='';score.replaceChildren();setControls();}
function leaveScore(){
 if(ready&&!isPdf())workingSession={id:activeSong.id,context:scoreContext,view:scoreSize,key:current,octave:{...currentOctave}};
 selectionVersion++;loading=false;loadingNote.hidden=true;document.body.classList.remove('song-loading');
 playback.stop();pdfFallback=false;document.body.classList.remove('pdf-fallback-open');$('playback-message').textContent='';
 lyricsView.reset();lyricsSong=null;document.body.classList.remove('lyrics-open');

 clearTimeout(timer);current=0;wanted=0;currentOctave=normalOctaves();wantedOctave=currentOctave;octaveScope='both';ready=false;document.dispatchEvent(new Event('score-session-reset'));
 original='';lastXML='';renderWidth=0;cache.clear();score.replaceChildren();score.setAttribute('aria-busy','false');
 document.body.classList.remove('prepared-print');$('print-pages').replaceChildren();
 dialog.close();setControls();
}
// Local acceptance-test hooks.
window.prototype={playback,get loading(){return loading;},get navigation(){return library?.diagnostics();},get lead(){return leadState;},get viewXML(){return lastViewXML;},get pdfFallback(){return pdfFallback;},get current(){return current;},get wanted(){return wanted;},get octave(){return handLayout.ok?(currentOctave.rh===currentOctave.lh?currentOctave.rh:null):currentOctave.all;},get octaveState(){return {...currentOctave};},get hands(){return handLayout;},get wantedOctave(){return wantedOctave;},get busy(){return busy;},get ready(){return ready;},get xml(){return lastXML;},get original(){return original;},get metrics(){return metrics;},get song(){return activeSong.id;},openLyrics,changeKey,changeOctave,preparePrint,loadScore,loadSong};
(async()=>{try{osmd=new opensheetmusicdisplay.OpenSheetMusicDisplay(stage,{backend:'svg',autoResize:false,drawTitle:false,drawSubtitle:false,drawComposer:false,drawLyricist:false,drawPartNames:false,drawFingerings:true,drawLyrics:true,drawMeasureNumbers:false,drawMetronomeMarks:true,newSystemFromXML:false,newPageFromXML:false});
 enableScreenPickupLayout(osmd);
 try{await refreshLocalMusic();}catch{$('library-message').textContent='Local music storage is unavailable. Built-in songs remain available.';}
 initMyMusic();library=initLibrary({loadSong,openLyrics,isBusy:()=>busy||loading,leaveScore,cancelPendingSelection,stopPlayback:()=>playback.stop(),showScoreView});library.startHistory();
 if('serviceWorker' in navigator){try{// Refresh an already-controlled Library after a deployment, never interrupt a score.
 let controlled=!!navigator.serviceWorker.controller,pendingUpdate=false;
 const refreshLibrary=()=>{if(pendingUpdate&&document.body.classList.contains('library-open'))location.reload();};
 navigator.serviceWorker.addEventListener('controllerchange',()=>{if(controlled){pendingUpdate=true;refreshLibrary();}controlled=true;});
 document.addEventListener('library-open',()=>setTimeout(refreshLibrary,0));
 await navigator.serviceWorker.register('./sw.js',{updateViaCache:'none'});await navigator.serviceWorker.ready;$('offline').textContent='Save songs for offline use in Tools.';refreshOffline();}catch(e){$('offline').textContent='Local score';}}
 }catch(e){console.error(e);$('status').textContent='Unable to start MusicTranspose. Please reload or try again online.';$('library-message').textContent=$('status').textContent;}})();

window.addEventListener('resize',()=>requestAnimationFrame(alignTitleSubtitles));
document.fonts.ready.then(alignTitleSubtitles);
