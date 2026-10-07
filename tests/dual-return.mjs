import assert from 'node:assert/strict';import {createRequire} from 'node:module';
const {chromium}=createRequire('C:/Users/kenro/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/package.json')('playwright'),b=await chromium.launch({channel:'msedge'});
try{for(const width of [390,820,1440]){
 const c=await b.newContext({viewport:{width,height:width===390?740:1000},hasTouch:width<1000,serviceWorkers:'block'}),p=await c.newPage(),errors=[];p.on('pageerror',e=>errors.push(e.message));await p.goto('http://127.0.0.1:8780/');await p.waitForFunction(()=>window.prototype?.navigation);
 const ready=()=>p.waitForFunction(()=>prototype.ready&&!prototype.busy&&!prototype.loading&&document.querySelector('#score').getAttribute('aria-busy')==='false');
 const mode=async name=>{await p.evaluate(()=>scrollTo({top:0,behavior:'instant'}));await p.waitForTimeout(100);await p.locator('#score-navigation-button').click();await p.locator(`[data-navigation=${name}]`).click();if(name==='auto')await p.keyboard.press('Escape');};
 const scroll=async y=>{await p.evaluate(y=>window.scrollTo({top:y,behavior:'instant'}),y);await p.waitForTimeout(100);};
 const visible=()=>p.locator('.return-start:visible').count();
 const running=()=>p.locator('#auto-toggle').getAttribute('aria-pressed');
 const start=async()=>{await p.locator('#score-navigation-button').click();await p.locator('#auto-toggle').click();assert.equal(await running(),'true');};
 await p.locator('[data-home-source=all]').click();await p.locator('[data-song=song-138d4697-d2d9-414a-885c-82b760f1f371] .song-entry').click();await ready();
 for(const format of ['pdf','structured']){
  if(format==='structured'){await p.locator('#key').click();await p.locator('#key-dialog [data-shift="0"]').click();await ready();}
  const xml=await p.evaluate(()=>prototype.original);
  for(const kind of ['continuous','auto']){
   await mode(kind);await scroll(0);assert.equal(await visible(),0);
   for(const y of [99,100,95,81,79]){await scroll(y);assert.equal(await visible(),y>=80&&y!==99?2:0,JSON.stringify({width,format,kind,y,actual:await p.evaluate(()=>({scrollY,height:document.documentElement.scrollHeight,mode:document.querySelector("#score-navigation-label").textContent,hidden:document.querySelector("#return-start").hidden}))}));}
   for(const side of ['return-start-left','return-start']){
    await scroll(400);assert.equal(await visible(),2);if(kind==='auto')await start();
    const layout=await p.evaluate(()=>{const rect=e=>{const r=e.getBoundingClientRect();return {left:r.left,right:r.right,top:r.top,bottom:r.bottom,width:r.width,height:r.height};};return {buttons:[...document.querySelectorAll('.return-start')].map(rect),status:rect(document.querySelector('#score-navigation-button')),footer:rect(document.querySelector('.masthead')),label:document.querySelector('#score-navigation-label').textContent};});
    const [left,right]=layout.buttons;assert.equal(left.width,44);assert.equal(right.height,44);assert.equal(left.top,right.top);assert(left.left<width/2&&right.right>width/2);assert(right.bottom<=layout.footer.top-8);assert(left.bottom<layout.footer.top);assert.equal(layout.label,kind==='auto'?'Auto: Running':'Scroll');assert.equal(await p.locator('#score-navigation-button').isVisible(),kind==='auto');
    await p.locator('#'+side)[width<1000?'tap':'click']();assert.equal(await p.evaluate(()=>scrollY),0);assert.equal(await visible(),0);assert.equal(await running(),'false');await p.waitForTimeout(250);assert.equal(await p.evaluate(()=>scrollY),0);
   }
   if(kind==='auto'){await scroll(350);await start();await p.waitForTimeout(250);assert.equal(await running(),'true');await p.locator('#score').dispatchEvent('wheel',{deltaY:40});assert.equal(await running(),'false');await start();await p.touchscreen?.tap?.(100,160).catch(()=>p.mouse.click(100,160));assert.equal(await running(),'false');}
   assert.equal(await p.evaluate(()=>prototype.original),xml);
   await scroll(999999);const endHeight=await p.evaluate(()=>document.documentElement.scrollHeight);await p.waitForTimeout(250);assert.equal(await p.evaluate(()=>document.documentElement.scrollHeight),endHeight,'end clearance is stable');await scroll(400);await p.screenshot({path:`test-results/dual-return-${width}-${format}-${kind}.png`});
  }
  await mode('pages');assert.equal(await visible(),0);await p.keyboard.press('Home');const label=await p.locator('#score-navigation-label').textContent();await p.keyboard.press('ArrowRight');assert.notEqual(await p.locator('#score-navigation-label').textContent(),label);assert.equal(await visible(),0);
 }
 assert.deepEqual(errors,[]);console.log('PASS',width,'PDF/structured Scroll/Auto, both sides, paused return, status clearance, manual pause, Page Turns');await c.close();
}}finally{await b.close();}
