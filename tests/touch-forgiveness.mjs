import {createRequire} from 'node:module';import assert from 'node:assert/strict';
const {chromium}=createRequire(process.env.PLAYWRIGHT_PACKAGE||'C:/Users/kenro/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/package.json')('playwright');
const browser=await chromium.launch({channel:'msedge',headless:true}),base=process.env.TEST_URL||'http://127.0.0.1:8780/',errors=[];
try{for(const width of [820,390]){
 const c=await browser.newContext({viewport:{width,height:width===820?1180:844},hasTouch:true,serviceWorkers:'block'}),p=await c.newPage();p.on('pageerror',e=>errors.push(e.message));await p.goto(base);await p.locator('[data-home-source=all]').click();await p.waitForFunction(()=>window.prototype);
 const ready=()=>p.waitForFunction(()=>prototype.ready&&!prototype.busy&&!document.body.classList.contains('song-loading')&&document.querySelector('#score').getAttribute('aria-busy')==='false');
 await p.evaluate(()=>prototype.loadSong('song-a13c43da-0243-4019-ad08-d7be530074f5'));await ready();
 const label=()=>p.locator('#score-navigation-label').textContent();
 if(width===390){
  assert.equal(await label(),'Scroll');const cdp=await c.newCDPSession(p);
  for(const view of ['pdf','auto','large']){
   if(view!=='pdf'){await p.locator('#score-size').click();await p.locator(`#score-size-options [data-size=${view}]`).click();await ready();}
   await p.evaluate(()=>scrollTo(0,0));await p.touchscreen.tap(280,400);assert.equal(await p.evaluate(()=>scrollY),0,'Continuous tap does not navigate');
   await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:220,y:550}]});for(let i=1;i<=6;i++){await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:220,y:550-i*30}]});await p.waitForTimeout(25);}await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await p.waitForTimeout(220);assert(await p.evaluate(()=>scrollY)>30,'Native scrolling '+view);assert.equal(await label(),'Scroll');
   await p.evaluate(()=>scrollTo(0,0));await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:260,y:450}]});await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:170,y:450}]});await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});assert.equal(await label(),'Scroll');assert(!(await p.locator('body').evaluate(e=>e.classList.contains('page-navigation'))),'Horizontal Continuous gesture does not activate Page Turns');
  }
  console.log('PASS 390px native Continuous scroll and inactive tap navigation: Original/Transpose/Melody');await c.close();continue;
 }
 for(const view of ['pdf','auto','large']){
  if(view!=='pdf'){await p.locator('#score-size').click();await p.locator(`#score-size-options [data-size=${view}]`).click();await ready();}
  const total=Number((await label()).split('/')[1]);assert(total>1,view+' multipage fixture');
  const gesture=opts=>p.evaluate(async({dx=0,dy=0,cancel=null,x=.8,y=.6})=>{
   const r=(await import('./score-taps.js')).scoreTapGeometry(),px=r.left+r.width*x,py=r.top+r.height*y,host=document.querySelector('#score');
   const send=(type,a=px,b=py)=>host.dispatchEvent(new PointerEvent(type,{bubbles:true,pointerType:'touch',pointerId:71,isPrimary:true,button:0,clientX:a,clientY:b}));
   send('pointerdown');send('pointermove',px+dx,py+dy);if(cancel)document.dispatchEvent(new Event(cancel));send('pointerup',px+dx,py+dy);send('pointerup',px+dx,py+dy);host.dispatchEvent(new Event('touchend',{bubbles:true}));host.click();
  },opts);
  for(const [dx,dy] of [[0,0],[8,0],[20,0],[30,0],[36,0],[0,20],[0,30],[0,36],[20,20],[25,25]]){await p.keyboard.press('Home');await gesture({dx,dy});assert.equal(await label(),`Page 2 / ${total}`,view+' drift '+dx+','+dy);}
  for(const opts of [{dx:40,dy:40},{dy:80},{dx:30,dy:30},{cancel:'pointercancel'},{cancel:'lostpointercapture'}]){await p.keyboard.press('Home');await gesture(opts);assert.equal(await label(),`Page 1 / ${total}`,view+' rejects '+JSON.stringify(opts));}
  await gesture({x:.501,dx:-30});assert.equal(await label(),`Page 2 / ${total}`,view+' retains down side');await p.keyboard.press('Home');await gesture({y:.251,dy:-30});assert.equal(await label(),`Page 2 / ${total}`,view+' retains down vertical zone');
  await p.locator('#score-navigation-button').click();assert.equal(await label(),`Page 2 / ${total}`);assert(await p.locator('#score-navigation-menu').isVisible());await p.keyboard.press('Escape');
  // Browser-delivered touch streams exercise capture and native gesture arbitration.
  const cdp=await c.newCDPSession(p);
  const physical=async(dx,dy,yFraction=.6)=>{const r=await p.evaluate(async()=>(await import('./score-taps.js')).scoreTapGeometry()),x=r.left+r.width*.6,y=r.top+r.height*yFraction;
   await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x,y}]});for(let i=1;i<=4;i++){await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:x+dx*i/4,y:y+dy*i/4}]});await p.waitForTimeout(25);}await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await p.waitForTimeout(50);
  };
  for(const [dx,dy] of [[0,0],[8,0],[20,0],[30,0],[36,0],[0,30],[0,36],[20,20]]){await p.keyboard.press('Home');await physical(dx,dy);assert.equal(await label(),`Page 2 / ${total}`,view+' browser slip '+dx+','+dy);}
  for(const [dx,dy] of [[-37,0],[-50,0],[-80,20]]){await p.keyboard.press('Home');await physical(dx,dy);assert.equal(await label(),`Page 2 / ${total}`,view+' browser swipe');await physical(-dx,-dy);assert.equal(await label(),`Page 1 / ${total}`,view+' previous swipe');}
  await p.keyboard.press('Home');await physical(80,0);assert.equal(await label(),`Page 1 / ${total}`,'First boundary');await p.keyboard.press('End');await physical(-80,0);assert.equal(await label(),`Page ${total} / ${total}`,'Last boundary');
  for(const [dx,dy] of [[20,80],[50,50],[0,-80]]){await p.keyboard.press('Home');await physical(dx,dy);assert.equal(await label(),`Page 1 / ${total}`,view+' browser rejects ambiguous/vertical');}
  await physical(-80,0,.15);assert.equal(await label(),`Page 2 / ${total}`,'Upper swipe never jumps to Last');await cdp.detach();
  console.log('PASS 820px',view,'bounded slips, large drags, cancellation, original zone, one action and indicator exclusion');
 }
 await c.close();
}assert.deepEqual(errors,[]);}finally{await browser.close();}
