import {createRequire} from 'node:module';import assert from 'node:assert/strict';
const {chromium}=createRequire(process.env.PLAYWRIGHT_PACKAGE)('playwright'),browser=await chromium.launch({channel:'msedge',headless:true});
try{for(const [width,height] of [[320,568],[390,844],[844,390],[820,1180],[1440,1000]]){
 const c=await browser.newContext({viewport:{width,height},hasTouch:true}),p=await c.newPage(),errors=[],gameRequests=[];p.on('pageerror',e=>errors.push(e.message));p.on('request',r=>{if(/lyrics-(fun|taps)/.test(r.url()))gameRequests.push(r.url());});
 await p.goto(process.env.TEST_URL||'http://127.0.0.1:8771/');await p.locator('.library-row').first().waitFor();await p.locator('[data-song=nativity] [title=Lyrics]').click();await p.locator('#lyrics-view').waitFor({state:'visible'});
 const text=await p.locator('.lyrics-body').textContent(),theme=p.locator('.lyrics-tools button').nth(0),font=p.locator('#lyrics-font-size');
 assert.equal(await p.locator('.lyrics-tools > button,.lyrics-font-wrap > button').count(),3);assert.equal(await p.locator('.lyrics-tools > button svg,.lyrics-font-wrap > button svg').count(),3);assert.equal(await p.locator('.lyrics-tools button').last().getAttribute('aria-label'),'View Score');
 const dark=await p.locator('#lyrics-view').evaluate(e=>e.classList.contains('lyrics-dark'));await theme.click();assert.equal(await p.locator('#lyrics-view').evaluate(e=>e.classList.contains('lyrics-dark')),!dark);
 const size=await p.locator('#lyrics-view').getAttribute('data-size');await font.click();await p.getByRole('menuitemradio',{name:'Large',exact:true}).click();const changed=await p.locator('#lyrics-view').getAttribute('data-size');assert.notEqual(changed,size);
 const paper=p.locator('.lyrics-body p').first();await paper.scrollIntoViewIfNeeded();const r=await paper.boundingBox(),x=r.x+12,y=Math.min(height-100,Math.max(80,r.y+12));
 for(let i=0;i<6;i++)await p.touchscreen.tap(x,y);
 await p.mouse.move(x,y);await p.mouse.down();await p.waitForTimeout(2200);await p.mouse.up();await p.mouse.dblclick(x,y);await p.mouse.click(x,y,{button:'right'});await p.keyboard.press('Escape');await p.keyboard.press('f');
 assert.equal(await p.locator('[class*="lyrics-fun"],.lyrics-top').count(),0);assert.equal(await p.getByRole('button',{name:'Stop Fun'}).count(),0);assert.equal(await p.locator('.lyrics-body').textContent(),text);assert.deepEqual(gameRequests,[]);
 assert.equal(await paper.evaluate(e=>getComputedStyle(e).userSelect),'auto');
 const controls=await p.locator('.lyrics-footer button:visible').evaluateAll(es=>es.map(e=>{const r=e.getBoundingClientRect();return {x:r.x,y:r.y,right:r.right,bottom:r.bottom,w:r.width,h:r.height};}));
 for(const r of controls)assert(r.w>=40&&r.h>=44&&r.x>=0&&r.right<=width&&r.bottom<=height);
 assert(controls[0].x<20);for(let i=1;i<controls.length;i++)assert(controls[i].x>=controls[i-1].right);assert(controls.at(-1).right>=width-12);
 await p.screenshot({path:`test-results/lyrics-corners-${width}.png`});await p.reload();await p.locator('#lyrics-view').waitFor({state:'visible'});assert.equal(await p.locator('#lyrics-view').getAttribute('data-size'),changed);assert.equal(await p.locator('#lyrics-view').evaluate(e=>e.classList.contains('lyrics-dark')),!dark);
 await p.locator('#songs').click();await p.locator('[data-song=nativity] [title=Lyrics]').click();await p.locator('#lyrics-view').waitFor({state:'visible'});assert.equal(await p.locator('[class*="lyrics-fun"]').count(),0);
 if(width===390){await p.evaluate(()=>navigator.serviceWorker.ready);await p.waitForFunction(()=>navigator.serviceWorker.controller);await c.setOffline(true);await p.reload();await p.locator('#lyrics-view').waitFor({state:'visible'});assert.equal(await p.locator('#lyrics-view').getAttribute('data-size'),changed);assert.equal(await p.locator('[class*="lyrics-fun"]').count(),0);}
 assert(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));assert.deepEqual(errors,[]);console.log('PASS footer controls, appearance persistence, no game activation/imports, ordinary text interaction',width,height);await c.close();
}}finally{await browser.close();}
