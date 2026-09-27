import {createRequire} from 'node:module';import assert from 'node:assert/strict';
const engines=createRequire(process.env.PLAYWRIGHT_PACKAGE)('playwright'),engine=process.env.FUN_ENGINE||'chromium',browser=await engines[engine].launch(engine==='chromium'?{channel:'msedge',headless:true}:{headless:true});
try{for(const [width,height] of [[320,568],[390,844],[844,390],[820,1180],[1440,1000]]){
 const c=await browser.newContext({viewport:{width,height},hasTouch:width<1000}),p=await c.newPage(),errors=[];p.on('pageerror',e=>errors.push(e.message));await p.clock.install();await p.clock.pauseAt(new Date(Date.now()+1000));await p.goto(process.env.TEST_URL||'http://127.0.0.1:8771/');await p.locator('.library-row').first().waitFor();await p.locator('[data-song=nativity] [title=Lyrics]').click();await p.locator('#lyrics-view').waitFor({state:'visible'});
 const layer=p.locator('.lyrics-fun-layer'),stop=p.locator('.lyrics-footer .lyrics-fun-stop');
 const tap=async()=>{const r=await p.locator('.lyrics-body p').first().boundingBox();const x=r.x+15,y=Math.min(height-85,Math.max(130,r.y+10));if(width<1000)await p.touchscreen.tap(x,y);else await p.mouse.click(x,y);};
 const four=async()=>{for(let i=0;i<4;i++){await tap();await p.clock.runFor(100);}};
 const off=async()=>assert.equal(await layer.count(),0);
 await off();assert(await stop.isHidden());assert(!/\b(Game|Fun)\b/.test(await p.locator('#lyrics-view').innerText()));const text=await p.locator('.lyrics-body').textContent();
 for(let i=0;i<3;i++){await tap();await p.clock.runFor(100);await off();}await p.clock.runFor(1600);await tap();await off();
 // Controls and scrolling reset the whole sequence, not merely the current pointer.
 await p.locator('.lyrics-tools button').first().click();for(let i=0;i<3;i++)await tap();await off();await p.evaluate(()=>window.dispatchEvent(new Event('scroll')));await tap();await off();
 await p.locator('.lyrics-body p').first().evaluate(e=>{for(const [type,x] of [['pointerdown',30],['pointermove',60],['pointerup',60]])e.dispatchEvent(new PointerEvent(type,{bubbles:true,isPrimary:true,button:0,pointerId:99,clientX:x,clientY:180}));});for(let i=0;i<3;i++)await tap();await off();await p.clock.runFor(1600);
 await four();assert.equal(await layer.count(),1);assert(await stop.isVisible());assert.equal(await layer.evaluate(e=>getComputedStyle(e).pointerEvents),'none');assert.equal(await p.locator('.lyrics-body').textContent(),text);assert(await p.evaluate(()=>getSelection().isCollapsed));
 // Increase bottom safe-area reservation and verify actual measured footer exclusion.
 await p.evaluate(()=>document.documentElement.style.setProperty('--playing-safe-bottom','34px'));await p.clock.runFor(32);
 // Remove targets to exercise misses from both edges deterministically.
 for(const side of [0,.75]){
  await p.evaluate(side=>{document.querySelectorAll('.lyrics-fun-note').forEach(e=>e.remove());window.savedRandom=Math.random;Math.random=()=>side;},side);await tap();await p.evaluate(()=>Math.random=savedRandom);
  const shot=p.locator('.lyrics-fun-effect').last(),line=shot.locator('line');assert.equal(await shot.getAttribute('data-shot'),'miss');
  const retainedLine=await line.elementHandle();const initial=await line.evaluate(e=>({x:+e.getAttribute('x1'),y:+e.getAttribute('y1'),width:e.parentElement.getBoundingClientRect().width,top:e.parentElement.getBoundingClientRect().top,height:e.parentElement.getBoundingClientRect().height}));assert.equal(initial.x,side===0?0:initial.width);const footer=await p.locator('.lyrics-footer').boundingBox();assert(initial.top+initial.y<footer.y-8);assert(initial.y>=initial.height*.55&&initial.y<=initial.height*.9);
  await p.clock.runFor(300);if(width===390||width===820)await p.screenshot({path:`test-results/tracer-${engine}-${width}-${side===0?'left':'right'}.png`});await p.clock.runFor(300);const x=await line.evaluate(e=>+e.getAttribute('x2'));assert(side===0?x>initial.width*.88:x<initial.width*.12);assert.equal(await shot.locator('circle').count(),0);await p.clock.runFor(100);assert.equal(await retainedLine.evaluate(e=>+e.getAttribute('x2')),side===0?initial.width:0);assert.equal(await p.locator('.lyrics-fun-effect').count(),0);
 }
 // Re-enter with the original note flights and hit a live target, then remove one mid-shot.
 await stop.click();await off();await four();await p.clock.runFor(6000);assert(await p.locator('.lyrics-fun-note:visible').count()>0);await tap();assert.equal(await p.locator('.lyrics-fun-effect').last().getAttribute('data-shot'),'hit');await p.clock.runFor(720);assert(await p.locator('.lyrics-fun-spark').count()>0);await p.clock.runFor(420);
 await tap();assert.equal(await p.locator('.lyrics-fun-effect').last().getAttribute('data-shot'),'hit');await p.clock.runFor(150);await p.locator('.lyrics-fun-note').evaluateAll(es=>es.forEach(e=>e.remove()));await p.clock.runFor(32);const miss=p.locator('.lyrics-fun-effect').last();assert.equal(await miss.getAttribute('data-shot'),'miss');await p.clock.runFor(900);assert.equal(await p.locator('.lyrics-fun-effect').count(),0);assert.equal(await p.locator('.lyrics-fun-spark').count(),0);
 await p.screenshot({path:`test-results/lyrics-rework-${engine}-${width}.png`});await stop.click();await off();assert.equal(await p.locator('.lyrics-body').textContent(),text);assert(await stop.isHidden());
 // Re-entry while active never creates another layer; Stop/Library stay interactive.
 await four();await four();assert.equal(await layer.count(),1);await p.locator('#songs').click();await off();await p.locator('[data-song=nativity] [title=Lyrics]').click();await four();await p.reload();await p.locator('#lyrics-view').waitFor({state:'visible'});await off();
 if(width===390&&engine==='chromium'){await p.evaluate(()=>navigator.serviceWorker.ready);await p.waitForFunction(()=>navigator.serviceWorker.controller);await c.setOffline(true);await p.reload();await p.locator('#lyrics-view').waitFor({state:'visible'});await off();await four();await stop.click();await off();await c.setOffline(false);}
 assert(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));assert.deepEqual(errors,[]);console.log('PASS four taps, control/drag/scroll rejection, two-sided misses, disappearing target, hits, boundary, Stop/Library/reload',engine,width,height);await c.close();
}}finally{await browser.close();}
