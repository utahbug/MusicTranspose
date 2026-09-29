import {createRequire} from 'node:module';
import assert from 'node:assert/strict';
const {chromium}=createRequire(process.env.PLAYWRIGHT_PACKAGE)('playwright');
const b=await chromium.launch({channel:'msedge',headless:true});
try{
 const c=await b.newContext({viewport:{width:820,height:1180},hasTouch:true,serviceWorkers:'block'}),p=await c.newPage();
 const base=process.env.TEST_URL||'http://127.0.0.1:8775/';
 await p.route('**/tap-contract',r=>r.fulfill({contentType:'text/html',body:`<style>body{margin:0}#score{width:800px;height:1000px}.masthead{position:fixed;top:1100px}</style><div id="playing-view"><div id="score" aria-busy="false"></div><button id="control">Control</button></div><div class="masthead"></div><dialog id="modal"></dialog><div id="score-size-options" hidden></div><div id="score-tools-menu" hidden></div><div id="unrelated" hidden></div>`}));
 await p.goto(base+'tap-contract');
 const result=await p.evaluate(async()=>{
  const {installScoreTaps,scoreTapGeometry}=await import('./score-taps.js'),actions=[];let enabled=true;
  installScoreTaps({enabled:()=>enabled,navigate:a=>actions.push(a)});
  const score=document.querySelector('#score'),assert=(ok,label)=>{if(!ok)throw Error(label);};
  const event=(type,extra={},target=score)=>target.dispatchEvent(new PointerEvent(type,{bubbles:true,pointerType:'touch',pointerId:51,isPrimary:true,button:0,clientX:650,clientY:650,...extra}));
  const down=()=>{actions.length=0;event('pointerdown');},up=()=>event('pointerup');
  for(const form of ['pdf','xml','lead']){
   document.body.classList.toggle('pdf-score-open',form==='pdf');
   for(const mutation of [()=>score.replaceChildren(document.createElement('span')),()=>document.querySelector('#unrelated').hidden=false]){down();mutation();await Promise.resolve();up();assert(actions.length===1,form+' harmless DOM');}
   const r=scoreTapGeometry();
   for(const [x,y,dx,dy,action] of [[.501,.65,-4,0,1],[.499,.65,4,0,-1],[.8,.251,0,-4,1],[.8,.249,0,4,Infinity],[.2,.249,0,4,-Infinity]]){
    actions.length=0;const clientX=r.left+r.width*x,clientY=r.top+r.height*y;
    event('pointerdown',{clientX,clientY});event('pointerup',{clientX:clientX+dx,clientY:clientY+dy});
    assert(actions.length===1&&actions[0]===action,form+' retained boundary action');
   }
   for(const id of ['score-size-options','score-tools-menu']){down();document.getElementById(id).hidden=false;document.getElementById(id).hidden=true;await Promise.resolve();up();assert(!actions.length,form+' transient blocker');}
   down();document.querySelector('#modal').showModal();document.querySelector('#modal').close();await Promise.resolve();up();assert(!actions.length,form+' transient modal');
   down();up();up();score.dispatchEvent(new Event('touchend',{bubbles:true}));score.click();assert(actions.length===1&&actions[0]===1,form+' exactly one action');
   for(const name of ['score-session-reset','score-engraved','library-open','visibilitychange','pointercancel','lostpointercapture']){down();document.dispatchEvent(new Event(name));up();assert(!actions.length,form+' '+name);}
   for(const name of ['scroll','resize','blur','beforeprint']){down();window.dispatchEvent(new Event(name));up();assert(!actions.length,form+' '+name);}
   for(const id of ['score-size-options','score-tools-menu']){down();document.getElementById(id).hidden=false;await Promise.resolve();document.getElementById(id).hidden=true;up();assert(!actions.length,form+' '+id);}
   down();score.setAttribute('aria-busy','true');score.setAttribute('aria-busy','false');await Promise.resolve();up();assert(!actions.length,form+' busy transaction');
   down();document.querySelector('#modal').showModal();await Promise.resolve();document.querySelector('#modal').close();up();assert(!actions.length,form+' modal');
   down();enabled=false;up();enabled=true;assert(!actions.length,form+' disabled');
   down();event('pointerdown',{pointerId:52,isPrimary:false});up();assert(!actions.length,form+' multitouch');
   down();event('pointermove',{clientX:680});up();assert(!actions.length,form+' out and back');
   down();const range=document.createRange();range.selectNodeContents(document.querySelector('#control'));getSelection().addRange(range);up();getSelection().removeAllRanges();assert(!actions.length,form+' selection');
   actions.length=0;event('pointerdown',{},document.querySelector('#control'));up();assert(!actions.length,form+' interactive start');
   down();const rect=document.querySelector('#control').getBoundingClientRect();event('pointerup',{clientX:rect.x+5,clientY:rect.y+5});assert(!actions.length,form+' interactive release');
  }
  return 'PASS exact action count, duplicate pointer/touch/click protection, semantic cancellation, harmless DOM changes, selection, controls, multitouch across PDF/XML/Lead';
 });console.log(result);
}finally{await b.close();}
