import {createRequire} from 'node:module';
import assert from 'node:assert/strict';
const engines=createRequire(process.env.PLAYWRIGHT_PACKAGE)('playwright');
const engine=process.env.TAP_ENGINE||'chromium',baseline=!!process.env.TAP_BASELINE,cycles=Number(process.env.TAP_CYCLES||50);
const browser=await engines[engine].launch(engine==='chromium'?{channel:'msedge',headless:true}:{headless:true});
try{for(const [width,height,touch] of (baseline?[[820,1180,true]]:[[820,1180,true],[1180,820,true],[390,844,true],[1440,800,false]])){
 if(process.env.TAP_WIDTH&&width!==Number(process.env.TAP_WIDTH))continue;
 const context=await browser.newContext({viewport:{width,height},hasTouch:touch,serviceWorkers:'block'}),p=await context.newPage(),errors=[];
 p.on('pageerror',e=>errors.push(e.message));await p.goto(process.env.TEST_URL||'http://127.0.0.1:8775/');await p.locator('.library-row').first().waitFor();
 const ready=async()=>{await p.waitForFunction(()=>prototype.ready&&!prototype.busy&&document.querySelector('#score').getAttribute('aria-busy')==='false');await p.waitForTimeout(150);};
 const position=async()=>Number((await p.locator('#page-position').getAttribute('aria-label')).match(/^Page (\d+)/)[1]);
 const geometry=()=>p.evaluate(async()=>(await import('./score-taps.js')).scoreTapGeometry());
 const tap=async(x,y)=>{const r=await geometry();const a=r.left+r.width*x,b=r.top+r.height*y;if(touch)await p.touchscreen.tap(a,b);else await p.mouse.click(a,b);await p.waitForTimeout(20);};
 // Synthetic drift/cancellation complements browser-generated touch/mouse taps.
 const gesture=opts=>p.evaluate(async opts=>{
  const {scoreTapGeometry}=await import('./score-taps.js'),r=scoreTapGeometry(),host=document.querySelector('#score');
  const x=r.left+r.width*(opts.x??.8),y=r.top+r.height*(opts.y??.65);
  const send=(type,extra={})=>host.dispatchEvent(new PointerEvent(type,{bubbles:true,pointerId:51,isPrimary:true,button:0,pointerType:opts.pointerType||'touch',clientX:x,clientY:y,...extra}));
  send('pointerdown');if(opts.move)send('pointermove',{clientX:x+opts.move});
  if(opts.mutation==='content'){const marker=document.createElement('span');host.append(marker);await new Promise(requestAnimationFrame);marker.remove();}
  if(opts.mutation==='hidden'){const el=document.querySelector('#auto-options');el.hidden=el.hidden;await Promise.resolve();}
  if(opts.mutation==='virtual'){const v=await import('./virtual-pages.js');v.displayVirtual(v.virtualFrames().findIndex(f=>f.classList.contains('current-page')));await Promise.resolve();}
  if(opts.cancel==='busy'){host.setAttribute('aria-busy','true');await Promise.resolve();host.setAttribute('aria-busy','false');}
  else if(opts.cancel==='modal'){document.querySelector('#settings-dialog').showModal();await Promise.resolve();document.querySelector('#settings-dialog').close();}
  else if(opts.cancel==='second')send('pointerdown',{pointerId:52,isPrimary:false});
  else if(opts.cancel){const target=['scroll','resize','blur'].includes(opts.cancel)?window:document;target.dispatchEvent(new Event(opts.cancel));}
  if(opts.delay)await new Promise(r=>setTimeout(r,opts.delay));
  send('pointerup',{clientX:x+(opts.dx||0),clientY:y+(opts.dy||0)});
  // A stale duplicate release, touchend and compatibility click must do nothing.
  send('pointerup');host.dispatchEvent(new Event('touchend',{bubbles:true}));host.dispatchEvent(new MouseEvent('click',{bubbles:true,clientX:x,clientY:y}));
 },opts);
 for(const [name,id,view] of [['PDF','choose-to-serve-the-lord',null],['XML','song-a13c43da-0243-4019-ad08-d7be530074f5','auto'],['Lead','song-a13c43da-0243-4019-ad08-d7be530074f5','large']]){
  await p.evaluate(id=>prototype.loadSong(id),id);await ready();
  if(view){await p.locator('#score-size').click();await p.locator(`#score-size-options [data-size=${view}]`).click();await ready();}
  await p.locator('#settings').click();await p.locator('input[name=navigation][value=pages]').check();await p.locator('#close-settings').click();await p.waitForTimeout(100);
  const count=await p.locator(name==='PDF'?'.pdf-page-frame':'.mxl-page-frame').count();assert(count>=2,`${name} needs multiple pages at ${width}: ${count}`);
  const home=async()=>{await p.keyboard.press('Home');await p.waitForTimeout(20);};
  const outcomes=[];for(const opts of [{dx:12,move:12},{dx:16,move:16},{y:.251,dy:-4},{x:.499,dx:4},{mutation:'content'},{mutation:'hidden'},...(name==='PDF'?[]:[{mutation:'virtual'}])]){await home();await gesture(opts);outcomes.push({opts,page:await position()});}
  if(baseline){console.log('BASELINE',name,count,JSON.stringify(outcomes));continue;}
  for(const {opts,page} of outcomes)assert.equal(page,opts.x?1:2,`${name} ${width} ${JSON.stringify(opts)}`);
  // Fifty cycles exercise replacement of SVG slices, not just the first transition.
  for(let i=0;i<cycles;i++){await home();await tap(.8,.65);assert.equal(await position(),2,`${name} next cycle ${i}`);if(count>=3){await tap(.8,.65);assert.equal(await position(),3);await tap(.2,.65);assert.equal(await position(),2);}await tap(.2,.65);assert.equal(await position(),1);await tap(.8,.1);assert.equal(await position(),count);await tap(.2,.1);assert.equal(await position(),1);}
  await home();await gesture({y:.249,dy:4});assert.equal(await position(),count);await home();
  for(const opts of [{move:18},{move:30,dx:0},{delay:650},...['pointercancel','lostpointercapture','scroll','resize','blur','busy','modal','second'].map(cancel=>({cancel})),{pointerType:'mouse',dx:12},{pointerType:'pen',dx:12},{pointerType:'mouse',y:.251,dy:-4},{pointerType:'pen',y:.251,dy:-4}]){
   await gesture(opts);assert.equal(await position(),1,`${name} cancellation ${JSON.stringify(opts)}`);
  }
  for(const pointerType of ['mouse','pen']){await gesture({pointerType,dx:8});assert.equal(await position(),2);await home();}
  // Browser-generated drift supplements synthetic PointerEvent boundary tests.
  if(touch&&engine==='chromium'){
   const cdp=await context.newCDPSession(p),r=await geometry(),x=r.left+r.width*.8,y=r.top+r.height*.65;
   for(const dx of [8,12]){
    await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x,y}]});
    await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:x+dx,y}]});
    await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
    await p.waitForTimeout(30);assert.equal(await position(),2,`${name} browser touch drift ${dx}`);await home();
   }
   // A trusted touch survives replacement of its original virtual-frame hit target.
   if(name!=='PDF'){
    await p.evaluate(({x,y})=>{const marker=document.createElement('span');marker.id='tap-hit-fixture';Object.assign(marker.style,{position:'fixed',left:(x-10)+'px',top:(y-10)+'px',width:'20px',height:'20px',zIndex:5});document.querySelector('.mxl-page-frame.current-page').append(marker);},{x,y});
    await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x,y}]});
    await p.evaluate(async()=>{document.querySelector('#tap-hit-fixture').remove();const v=await import('./virtual-pages.js');v.displayVirtual(0);});
    await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await p.waitForTimeout(30);assert.equal(await position(),2,`${name} replaced hit target`);await home();
   }
   await cdp.detach();
  }
  await p.locator('#show-tap-zones').click();assert.equal(await p.locator('#score-tap-overlay').evaluate(e=>e.style.getPropertyValue('--tap-upper')),'25%');await p.keyboard.press('Escape');assert.equal(await position(),1);
  console.log('PASS',name,width,height,count,`pages: ${cycles} repeated cycles, 16px drift/down-zone retention, benign DOM updates, cancellation, single-action, mouse/pen, 25% guide`);
 }
 assert.deepEqual(errors,[]);await context.close();
}}finally{await browser.close();}
