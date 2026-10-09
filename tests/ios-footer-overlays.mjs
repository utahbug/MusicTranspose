import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
const {webkit,chromium}=createRequire(process.env.PLAYWRIGHT_PACKAGE||'C:/Users/kenro/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/package.json')('playwright');
const base=process.env.APP_URL||'http://127.0.0.1:8780/';
const touch=(p,type)=>p.evaluate(type=>{const e=new Event(type,{bubbles:true});Object.defineProperty(e,'touches',{value:type==='touchstart'?[{}]:[]});document.body.dispatchEvent(e);},type);
const viewport=(p,gap,top=0)=>p.evaluate(({gap,top})=>{Object.assign(mockViewport,{gap,top});visualViewport.dispatchEvent(new Event('resize'));visualViewport.dispatchEvent(new Event('scroll'));},{gap,top});
for(const [name,width,engine] of [['iphone',390,webkit],['ipad',820,webkit],['mini',744,webkit],['desktop',1440,chromium]]){
 const b=await engine.launch(engine===chromium?{channel:'msedge'}:{});
 try{
 const ios=name!=='desktop',c=await b.newContext({viewport:{width,height:1000},hasTouch:ios,isMobile:ios,serviceWorkers:'block',...(ios?{userAgent:name==='iphone'?'iPhone':name==='mini'?'Macintosh':'iPad'}:{})});
 await c.addInitScript(name=>{
  if(name==='mini'){Object.defineProperty(navigator,'platform',{get:()=> 'MacIntel'});Object.defineProperty(navigator,'maxTouchPoints',{get:()=>5});}
  window.mockViewport={gap:0,top:0,scale:1};
  for(const [k,get] of Object.entries({height:()=>innerHeight-mockViewport.gap,offsetTop:()=>mockViewport.top,scale:()=>mockViewport.scale}))Object.defineProperty(visualViewport,k,{configurable:true,get});
  window.insetWrites=[];const set=CSSStyleDeclaration.prototype.setProperty;CSSStyleDeclaration.prototype.setProperty=function(k,v,p){if(k==='--workspace-footer-inset'||k==='--footer-viewport-inset')insetWrites.push([k,v]);return set.call(this,k,v,p);};
  localStorage.setItem('music-transpose-library-v1',JSON.stringify({orderingVersion:1,favorites:[],groups:Array.from({length:25},(_,i)=>({id:'stability-'+i,name:'List '+i,songs:['nativity']}))}));
 },name);
 const p=await c.newPage(),errors=[];p.on('pageerror',e=>errors.push(e.message));
 const ready=()=>p.waitForFunction(()=>window.prototype?.navigation);
 const settle=()=>p.waitForTimeout(550);
 const foot=()=>p.locator('.workspace-return:visible,.library-quick-access:visible,.library-home-footer:visible');
 const geometry=()=>foot().evaluate(e=>{const r=e.getBoundingClientRect();return {x:r.x,y:r.y,width:r.width,height:r.height,inset:e.parentElement.style.getPropertyValue('--workspace-footer-inset'),padding:getComputedStyle(e.parentElement).paddingBottom};});
 const check=async()=>{assert(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));const r=await foot().boundingBox();assert(Math.abs(r.y+r.height-await p.evaluate(()=>visualViewport.height+visualViewport.offsetTop))<1);assert(await foot().evaluate(e=>[...e.querySelectorAll('button')].filter(x=>x.getClientRects().length).every(x=>{const r=x.getBoundingClientRect();return r.width>=44&&r.height>=44&&document.elementFromPoint(r.x+r.width/2,r.y+r.height/2)?.closest('button')===x;})));};
 for(const section of ['Home','Lists','Files','Notes','Keyboard','Library']){
  await p.goto(base);await ready();
  if(section==='Library'){await p.locator('#home-search').fill('Nativity');await p.locator('#home-search-form').evaluate(e=>e.requestSubmit());}
  else if(section!=='Home')await foot().getByRole('button',{name:section,exact:true}).click();
  await settle();await check();const before=await geometry();await p.evaluate(()=>insetWrites=[]);
  if(ios){
   await viewport(p,25);await touch(p,'touchstart');
   for(const [gap,top] of [[90,0],[130,-30],[100,20],[80,0]]){await viewport(p,gap,top);await p.evaluate(()=>scrollBy(0,70));await p.waitForTimeout(55);assert.deepEqual(await geometry(),before,section+' must not chase dragging/overscroll');}
   await touch(p,'touchend');
   for(const gap of [95,85,80]){await viewport(p,gap);await p.evaluate(()=>scrollBy(0,40));await p.waitForTimeout(65);assert.equal(await p.evaluate(()=>insetWrites.length),0,'no writes during momentum');}
   await settle();assert.deepEqual(await p.evaluate(()=>insetWrites),[['--workspace-footer-inset','80px']],section+' single settled correction');await check();
   await touch(p,'touchstart');await viewport(p,0);await touch(p,'touchcancel');await settle();await check();
   if(section==='Lists'){await p.evaluate(()=>scrollTo(0,document.documentElement.scrollHeight));await settle();const last=await p.locator('.list-workspace-section').last().boundingBox(),bar=await foot().boundingBox();assert(last.y+last.height<=bar.y,'last List remains reachable');}
  }else{await viewport(p,80);await settle();await check();await viewport(p,0);await settle();}
  if(section==='Home'){
   await p.locator('#home-search').focus();await viewport(p,330);await settle();await check();await p.locator('#home-search').blur();await viewport(p,0);await settle();await check();
   await p.evaluate(()=>dispatchEvent(new Event('orientationchange')));await settle();await check();
  }
  console.log('PASS',name,section,'footer, gestures/settle, targets and clearance');
 }
 await p.evaluate(()=>prototype.loadSong('faithful'));await p.waitForFunction(()=>prototype.ready&&!prototype.busy);await p.evaluate(()=>prototype.changeKey(1));await p.waitForFunction(()=>prototype.ready&&!prototype.busy&&prototype.current===1&&document.querySelector('#score svg'));
 await p.locator('#score-navigation-button').click();await p.locator('[data-navigation=continuous]').click();await settle();
 const overlay=()=>p.evaluate(()=>Object.fromEntries([...document.querySelectorAll('.return-start,#score-navigation')].map(e=>{const r=e.getBoundingClientRect();return [e.id,{bottom:getComputedStyle(e).bottom,y:r.y,height:r.height}];})));
 await p.evaluate(()=>scrollTo(0,0));await settle();assert(await p.locator('#return-start').isHidden());
 let anchor;
 for(const y of [130,450,100000,300,130]){
  await p.evaluate(y=>scrollTo(0,y),y);await settle();assert(await p.locator('#return-start').isVisible());const s=await overlay();if(anchor)assert.deepEqual(s,anchor,'overlay cannot track paper bottom');else anchor=s;
  assert(await p.locator('.return-start:visible').evaluateAll(es=>es.every(e=>{const r=e.getBoundingClientRect(),bar=document.querySelector('.masthead').getBoundingClientRect();return r.width>=44&&r.height>=44&&r.bottom<=bar.top-7&&document.elementFromPoint(r.x+22,r.y+22)?.closest('button')===e;})));
 }
 if(ios){await touch(p,'touchstart');for(const gap of [40,95,60]){await viewport(p,gap);await p.evaluate(()=>scrollBy(0,40));await p.waitForTimeout(60);assert.deepEqual(await overlay(),anchor);}await touch(p,'touchcancel');await viewport(p,0);await settle();}
 await p.locator('#return-start').click();await settle();assert.equal(await p.evaluate(()=>scrollY),0);assert(await p.locator('#return-start').isHidden());
 await p.screenshot({path:`test-results/footer-stability-${name}.png`});assert.deepEqual(errors,[]);console.log('PASS',name,'Continuous Scroll overlay top/middle/bottom, reverse scroll, hit targets and return action');await c.close();
 }finally{await b.close();}
}
