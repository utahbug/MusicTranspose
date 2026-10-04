import {footerDiagnostics} from './layout-state.js';
import {availableScoreHeight} from './virtual-pages.js';
// Temporary, URL-gated diagnostics. No engraving, pagination, or preference writes.
if(new URLSearchParams(location.search).get('layoutdebug')==='1')startLayoutDiagnostics();
function startLayoutDiagnostics(){
 const $=selector=>document.querySelector(selector),round=n=>Math.round(n*100)/100;
 const rect=e=>e?Object.fromEntries(['width','height','top','left','bottom','right'].map(k=>[k,round(e.getBoundingClientRect()[k])])):null;
 const style=e=>e?Object.fromEntries(['paddingTop','paddingBottom','paddingLeft','paddingRight','marginLeft','marginRight'].map(k=>[k,getComputedStyle(e)[k]])):null;
 function safeArea(){const e=document.createElement('div');e.style.cssText='position:fixed;visibility:hidden;pointer-events:none;width:0;height:0;padding:env(safe-area-inset-top) env(safe-area-inset-right) env(safe-area-inset-bottom) env(safe-area-inset-left)';document.body.append(e);const css=getComputedStyle(e),value=Object.fromEntries(['Top','Right','Bottom','Left'].map(k=>[k.toLowerCase(),parseFloat(css['padding'+k])||0]));e.remove();return value;}
 const host=document.createElement('aside');host.id='layout-debug';host.style.cssText='position:fixed;top:max(8px,env(safe-area-inset-top));right:max(8px,env(safe-area-inset-right));z-index:2147483646;max-width:calc(100vw - 16px);';
 const shadow=host.attachShadow({mode:'open'});
 shadow.innerHTML=`<style>:host{font:13px system-ui;color:#182b34}*{box-sizing:border-box}button{min-height:44px;padding:8px 10px;background:#fff;color:#182b34;border:1px solid #78909c;border-radius:5px;font:inherit;cursor:pointer}button:focus-visible,textarea:focus-visible{outline:3px solid #006db0}#panel{width:min(460px,calc(100vw - 16px));max-height:65dvh;overflow:auto;overscroll-behavior:contain;background:#fff;border:1px solid #78909c;border-radius:6px;padding:10px;box-shadow:0 4px 16px #0003}#actions{display:flex;flex-wrap:wrap;gap:4px}pre{white-space:pre-wrap;overflow-wrap:anywhere;font:12px/1.5 ui-monospace,monospace}textarea{width:100%;height:150px;font:12px monospace}p{margin:8px 0}[hidden]{display:none!important}@media print{:host{display:none}}</style><button id="toggle" aria-expanded="false" aria-controls="panel">Layout diagnostics</button><section id="panel" aria-label="Layout diagnostics" hidden><div id="actions"><button id="refresh">Refresh measurements</button><button id="copy" disabled>Copy report</button><button id="close">Close</button></div><p id="status" role="status">Open a structured score to measure.</p><pre id="values"></pre><textarea id="report" aria-label="Diagnostic report for copying" readonly hidden></textarea></section>`;
 document.body.append(host);
 // Shadow-contained controls are outside score tap targets and never affect flow.
 for(const event of ['pointerdown','pointerup','click','dblclick'])host.addEventListener(event,e=>e.stopPropagation());
 const ui=id=>shadow.getElementById(id);let lastChange=performance.now(),running=false,report=null,generation=0;
 function clear(message){report=null;window.musicTransposeLayoutReport=null;ui('copy').disabled=true;ui('values').textContent='';ui('report').hidden=true;ui('status').textContent=message;}
 const entryTrace=[];
 function traceEntry(phase){if(!entryTrace.length&&phase!=='before-search-blur')return;const api=window.prototype;entryTrace.push({phase,at:Math.round(performance.now()),libraryHidden:$('#library')?.hidden,scoreVisible:!!$('#playing-view')?.getClientRects().length,busy:api?.busy,loading:api?.loading,renderCount:api?.metrics?.length,footer:footerDiagnostics(),scoreBudget:availableScoreHeight($('#score')),navigation:api?.navigation});if(entryTrace.length>32)entryTrace.splice(1,1);}
 document.addEventListener('score-entry',e=>{if(e.detail.phase==='before-search-blur')entryTrace.length=0;traceEntry(e.detail.phase);});
 new MutationObserver(()=>traceEntry($('#library').hidden?'Library hidden / Score visible':'Library shown')).observe($('#library'),{attributes:true,attributeFilter:['hidden']});
 new MutationObserver(()=>{if($('#score').getAttribute('aria-busy')==='false')traceEntry('render completed');}).observe($('#score'),{attributes:true,attributeFilter:['aria-busy']});
 window.visualViewport?.addEventListener('resize',()=>traceEntry('visualViewport resize'));
 window.visualViewport?.addEventListener('scroll',()=>traceEntry('visualViewport scroll'));
 function snapshot(){
  const score=$('#score'),api=window.prototype,v=window.visualViewport,frames=[...document.querySelectorAll('.mxl-page-frame')];let systemIndex=0;
  const pages=frames.map((frame,index)=>{const view=frame._view,available=parseFloat(frame.style.height),fit=view?Math.min(1,available/view.used):null;return {page:index+1,availableHeight:available,occupiedHeight:view?.used,displayFitScale:fit,unusedVerticalSpace:view?Math.max(0,available-view.used*fit):null,systemsAssigned:Number(frame.dataset.systems),systems:view?.page?.systems.map(s=>({system:++systemIndex,groupedSystems:s.systems||1,firstMeasureIndex:s.start,lastMeasureIndex:s.end,measures:s.end-s.start+1,effectiveWidth:view.width,renderedHeight:s.height*fit,plannedHeight:s.height,sourceTop:s.top,sourceBottom:s.bottom,y:s.y,scale:s.scale,gap:s.gap}))||[]};});
  const rawMode=$('#score-size-options [aria-pressed=true]')?.dataset.size;
  return {diagnosticVersion:5,url:location.href,userAgent:navigator.userAgent,
   viewport:{innerWidth,innerHeight,scrollX,scrollY,clientWidth:document.documentElement.clientWidth,clientHeight:document.documentElement.clientHeight,devicePixelRatio,screenWidth:screen.width,screenHeight:screen.height,screenAvailWidth:screen.availWidth,screenAvailHeight:screen.availHeight,orientation:screen.orientation?.type||(matchMedia('(orientation:portrait)').matches?'portrait':'landscape')},
   visualViewport:v?{width:v.width,height:v.height,scale:v.scale,offsetTop:v.offsetTop,offsetLeft:v.offsetLeft}:null,
   browserPageZoom:'Not reliably exposed; visualViewport.scale is an observable scale, not a browser page-zoom percentage.',
   mediaQueries:Object.fromEntries(['(max-width:600px)','(max-width:850px)','(orientation:portrait)','(pointer:coarse)','(display-mode:standalone)'].map(q=>[q,matchMedia(q).matches])),
   layout:{header:rect($('.score-heading')),footer:rect($('.masthead')),toolbar:rect($('.masthead .toolbar')),footerViewportInset:getComputedStyle(document.documentElement).getPropertyValue('--footer-viewport-inset'),playingBarHeight:getComputedStyle(document.documentElement).getPropertyValue('--playing-bar-height'),toolbarControls:[...document.querySelectorAll('.masthead button')].filter(e=>e.getClientRects().length).map(e=>({id:e.id,label:e.getAttribute('aria-label'),bounds:rect(e)})),score:rect(score),scoreInsets:style(score),safeAreaInsets:safeArea(),effectiveScoreWidth:score?.clientWidth,usableVirtualPageHeight:pages[0]?.availableHeight??null,calculatedAvailableHeight:pages.length?availableScoreHeight(score):null},
   music:{songId:api?.song,title:$('.score-heading h1')?.textContent,mode:({auto:'Most music',normal:'Normal',large:'Lead',pdf:'PDF'})[rawMode]||rawMode,notationScale:score?.dataset.zoom,spacingProfile:score?.dataset.fullScoreSpacing,currentKey:$('#key-name')?.textContent,keyShift:api?.current,octave:api?.octaveState,navigation:$('input[name=navigation]:checked')?.value,pageIndicator:$('#page-position')?.textContent,pageCount:pages.length||null,renderedSystemCount:Number(score?.dataset.systems)||null},
   entryTrace:[...entryTrace],footerDiagnostics:footerDiagnostics(),songNavigation:api?.navigation,renderCount:api?.metrics?.length,
   readiness:{loading:api?.loading,bodySongLoading:document.body.classList.contains('song-loading'),fonts:document.fonts.status,ready:api?.ready,busy:api?.busy,scoreBusy:score?.getAttribute('aria-busy')},pages};
 }
 function summary(r){const v=r.viewport,l=r.layout,m=r.music,visual=r.visualViewport,n=value=>value==null?'unavailable':round(value);return [
  `${m.title} · ${m.songId}`,
  `${m.mode} · notation scale ${m.notationScale} · ${m.spacingProfile}`,
  `Key ${m.currentKey} · navigation ${m.navigation} · pages ${m.pageCount??'unavailable'} (${m.pageIndicator})`,
  `Captured ${r.capturedAt} · stable ${r.settledForMs}ms · fonts ${r.readiness.fonts}`,
  '', 'DEVICE / VIEWPORT (CSS px)',
  `inner ${v.innerWidth} × ${v.innerHeight}; client ${v.clientWidth} × ${v.clientHeight}`,
  `DPR ${v.devicePixelRatio}; screen ${v.screenWidth} × ${v.screenHeight}`,
  `available screen ${v.screenAvailWidth} × ${v.screenAvailHeight}`,
  `screen orientation ${v.orientation}`,
  ...Object.entries(r.mediaQueries).map(([q,value])=>`${q}: ${value}`),
  '', 'VISUAL VIEWPORT',
  visual?`${n(visual.width)} × ${n(visual.height)}; scale ${visual.scale}; offsets top ${n(visual.offsetTop)}, left ${n(visual.offsetLeft)}`:'Unavailable',
  'Browser page zoom is not reliably exposed.',
  '', 'LAYOUT (CSS px)',
  `Header ${n(l.header?.height)}; footer ${n(l.footer?.height)}`,
  `Score ${n(l.score?.width)} × ${n(l.score?.height)}; top ${n(l.score?.top)}`,
  `Effective width ${l.effectiveScoreWidth}; usable page height ${n(l.usableVirtualPageHeight)}`,
  `Safe insets: ${JSON.stringify(l.safeAreaInsets)}`,
  '', `SYSTEMS / PAGES · ${m.renderedSystemCount??'unavailable'} rendered systems`,
  ...r.pages.flatMap(p=>[`Page ${p.page}: ${p.systemsAssigned} systems; unused ${n(p.unusedVerticalSpace)}px; fit scale ${n(p.displayFitScale)}`,...p.systems.map(s=>`  System ${s.system}: ${s.measures} measures; height ${n(s.renderedHeight)}px${s.groupedSystems>1?' (inseparable group of '+s.groupedSystems+')':''}`)]),
  '', 'SONG NAVIGATION',
  `Entry ${r.songNavigation?.entry?.path||'unknown'}; query ${JSON.stringify(r.songNavigation?.entry?.query)}; playable results ${r.songNavigation?.entry?.playableResultCount}; locator fallback ${r.songNavigation?.entry?.singleResultFallback}`,
  `Focus: ${JSON.stringify(r.footerDiagnostics?.activeElement)}`,
  `Origin ${r.songNavigation?.origin}; ${r.songNavigation?.count} captured IDs; current index ${r.songNavigation?.index}`,
  `Previous: ${JSON.stringify(r.songNavigation?.previous)}`,
  `Next: ${JSON.stringify(r.songNavigation?.next)}`,
  `Busy ${r.readiness.busy}; loading ${r.readiness.loading}; body loading ${r.readiness.bodySongLoading}; score busy ${r.readiness.scoreBusy}`,
  `Footer visible: ${r.footerDiagnostics?.footerWithinVisibleViewport}; controls visible: ${r.footerDiagnostics?.allControlsVisible}; renders: ${r.renderCount}`,
  '', 'Copy report includes full precision, measure indices, geometry and navigation state.'
 ].join('\n');}
 function ready(){return window.prototype?.ready&&!window.prototype.busy&&$('#score')?.getAttribute('aria-busy')==='false'&&!document.body.classList.contains('library-open')&&!$('#playing-view')?.hidden&&$('#lyrics-view')?.hidden;}
 const pause=ms=>new Promise(resolve=>setTimeout(resolve,ms));
 async function refresh(){
  generation++;clear('Waiting for fonts, engraving and pagination to settle…');if(running)return;running=true;
  try{await document.fonts.ready;let signature='',stableSince=performance.now(),started=performance.now();
   while(performance.now()-started<20000){
    await pause(200);if(!ready()){signature='';stableSince=performance.now();continue;}
    const ticket=generation,value=snapshot(),next=JSON.stringify(value);
    if(next!==signature){signature=next;stableSince=performance.now();}
    if(document.fonts.status!=='loaded'||performance.now()-Math.max(stableSince,lastChange)<1000)continue;
    await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));
    if(ticket!==generation||!ready()||JSON.stringify(snapshot())!==signature)continue;
    report={capturedAt:new Date().toISOString(),settledForMs:round(performance.now()-Math.max(stableSince,lastChange)),...value};window.musicTransposeLayoutReport=report;
    ui('values').textContent=summary(report);ui('report').value=JSON.stringify(report,null,2);ui('copy').disabled=false;
    ui('status').textContent='Settled measurements captured. '+(value.pages.length?'Measure indices include pickups.':'Virtual-page geometry unavailable in this view; use the same page-turn view that shows the problem.');return;
   }
   report={capturedAt:new Date().toISOString(),settledForMs:0,settled:false,captureReason:'Score did not become ready within 20 seconds; captured current state for diagnosis.',...snapshot()};window.musicTransposeLayoutReport=report;ui('values').textContent=summary(report);ui('report').value=JSON.stringify(report,null,2);ui('copy').disabled=false;ui('status').textContent='Current state captured, but not ready/settled. Copy report includes loading and disabled-control reasons.';
  }catch(error){clear('Unable to measure: '+error.message);}finally{running=false;}
 }
 let timer;function changed(){lastChange=performance.now();generation++;clear('Measurements changed; waiting for settled score…');clearTimeout(timer);timer=setTimeout(refresh,250);}
 ui('toggle').onclick=()=>{const open=ui('panel').hidden;ui('panel').hidden=!open;ui('toggle').setAttribute('aria-expanded',String(open));if(open)refresh();};
 ui('close').onclick=()=>{ui('panel').hidden=true;ui('toggle').setAttribute('aria-expanded','false');ui('toggle').focus();};
 ui('refresh').onclick=refresh;ui('copy').onclick=async()=>{if(!report)return;try{await navigator.clipboard.writeText(JSON.stringify(report,null,2));ui('status').textContent='Report copied. Paste it into this conversation.';}catch{ui('report').hidden=false;ui('report').focus();ui('report').select();ui('status').textContent='Select and copy the report below.';}};
 shadow.addEventListener('keydown',event=>{if(event.key==='Escape')ui('close').click();});
 document.addEventListener('score-engraved',changed);document.addEventListener('library-open',changed);window.addEventListener('resize',changed);window.visualViewport?.addEventListener('resize',changed);window.visualViewport?.addEventListener('scroll',changed);
 new MutationObserver(changed).observe($('#score'),{attributes:true,childList:true,subtree:true});
 new MutationObserver(changed).observe($('#page-position'),{childList:true,subtree:true,characterData:true});
 const observer=new ResizeObserver(changed);for(const selector of ['#score','.masthead','.score-heading'])observer.observe($(selector));
 document.fonts.addEventListener('loading',changed);document.fonts.addEventListener('loadingdone',changed);
 refresh();
}
