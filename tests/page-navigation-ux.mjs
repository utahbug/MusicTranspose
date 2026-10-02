import {createRequire} from 'node:module';import assert from 'node:assert/strict';
const {chromium}=createRequire(process.env.PLAYWRIGHT_PACKAGE||'C:/Users/kenro/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/package.json')('playwright');
const b=await chromium.launch({channel:'msedge',headless:true}),base=process.env.TEST_URL||'http://127.0.0.1:8780/',errors=[];
const key='music-transpose-navigation-v2',long='choose-to-serve-the-lord',structured='song-a13c43da-0243-4019-ad08-d7be530074f5';
try{for(const width of [390,430,820,1024,1440].filter(w=>!process.env.NAV_WIDTH||w===Number(process.env.NAV_WIDTH))){
 const c=await b.newContext({viewport:{width,height:width<600?844:1180},hasTouch:width<1100,serviceWorkers:'block'}),p=await c.newPage();p.setDefaultTimeout(30000);p.on('pageerror',e=>errors.push(e.message));
 await p.goto(base);await p.locator('[data-home-source=all]').click();await p.waitForFunction(()=>window.prototype);
 const ready=async()=>{await p.waitForFunction(()=>prototype.ready&&!prototype.busy&&!document.body.classList.contains('song-loading'));await p.locator('#score-navigation-button').waitFor();};
 const load=async id=>{await p.evaluate(id=>prototype.loadSong(id),id);await ready();};
 const label=()=>p.locator('#score-navigation-label').textContent();
 const choose=async mode=>{await p.locator('#score-navigation-button').click();await p.locator(`[data-navigation=${mode}]`).click();};
 await load(long);const count=await p.locator('.pdf-page-frame').count();assert(count>1);assert.equal(await label(),width<=600?'Scroll':`Page 1 / ${count}`);assert.equal(await p.evaluate(key=>localStorage.getItem(key),key),null,'Default is not saved as explicit');assert.equal(await p.locator('#page-position').count(),0);
 const geometry=await p.evaluate(()=>{const r=document.querySelector('#score-navigation-button').getBoundingClientRect(),paper=document.querySelector('.score-paper').getBoundingClientRect(),bar=document.querySelector('.masthead').getBoundingClientRect();return {inside:r.left>=paper.left&&r.right<=paper.right&&r.bottom<=Math.min(paper.bottom,bar.top),target:r.height>=44&&r.width>=44,overflow:document.documentElement.scrollWidth>innerWidth};});assert(geometry.inside&&geometry.target&&!geometry.overflow,JSON.stringify(geometry));
 if(width>600){assert(await p.locator('#page-navigation-hint').isVisible());await p.keyboard.press('PageDown');assert.equal(await label(),`Page 2 / ${count}`);assert(await p.locator('#page-navigation-hint').isHidden());await p.keyboard.press('Home');}else assert(await p.locator('#page-navigation-hint').isHidden());
 await p.locator('#score-navigation-button').focus();await p.keyboard.press('Enter');assert(await p.locator('#score-navigation-menu').isVisible());assert.equal(await label(),width<=600?'Scroll':`Page 1 / ${count}`,'Opening chooser does not turn');await p.screenshot({path:`test-results/navigation-mode-${width}.png`});await p.keyboard.press('Escape');assert(await p.locator('#score-navigation-button').evaluate(e=>e===document.activeElement));
 await choose(width<=600?'pages':'continuous');assert(await p.locator('#score-navigation-menu').isHidden());assert.deepEqual(await p.evaluate(key=>JSON.parse(localStorage.getItem(key)),key),{mode:width<=600?'pages':'continuous',explicit:true});
 await p.reload();await p.waitForFunction(()=>window.prototype);if(await p.locator('[data-home-source=all]').isVisible())await p.locator('[data-home-source=all]').click();await load(long);assert.equal(await label(),width<=600?`Page 1 / ${count}`:'Scroll','Explicit choice survives reload');
 if(width===430){
  // This device has not seen a hint in Continuous mode. Its first Page Turns
  // session gets the timed hint, and a one-page song never gets another.
  await p.evaluate(()=>{localStorage.removeItem('music-transpose-page-hint-v1');});await p.reload();await p.waitForFunction(()=>window.prototype);await load(long);assert(await p.locator('#page-navigation-hint').isVisible());await p.waitForTimeout(6200);assert(await p.locator('#page-navigation-hint').isHidden());
  await load('hhc-1035');assert.equal(await label(),'Page 1 / 1');assert(await p.locator('#page-navigation-hint').isHidden());
 }
 if(width===820){
  await choose('pages');assert(await p.locator('#page-navigation-hint').isHidden(),'Hint stays dismissed after reload');
  const pos=()=>p.evaluate(()=>[...document.querySelectorAll('.pdf-page-frame')].findIndex(e=>e.classList.contains('current-page')));
  const cdp=await c.newCDPSession(p);
  const gesture=async(dx,dy)=>{const r=await p.evaluate(async()=>(await import('./score-taps.js')).scoreTapGeometry()),x=r.left+r.width*.8,y=r.top+r.height*.65;await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x,y}]});for(let i=1;i<=5;i++){await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:x+dx*i/5,y:y+dy*i/5}]});await p.waitForTimeout(20);}await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await p.waitForTimeout(180);};
  await gesture(8,2);assert.equal(await pos(),1,'Small touch wobble turns once');await choose('pages');assert.equal(await pos(),1,'Selecting the active mode preserves page position');await p.keyboard.press('Home');await gesture(0,-140);assert.equal(await pos(),0,'Vertical swipe does not turn');
  await choose('continuous');await p.evaluate(()=>scrollTo(0,0));await gesture(0,-180);assert(await p.evaluate(()=>scrollY)>30,'Trusted touch scrolls continuously');
  await p.evaluate(()=>scrollTo(0,0));const before=await p.evaluate(()=>scrollY);const r=await p.evaluate(async()=>(await import('./score-taps.js')).scoreTapGeometry());await p.touchscreen.tap(r.left+r.width*.8,Math.min(r.top+r.height*.5,600));assert.equal(await p.evaluate(()=>scrollY),before,'Continuous taps do not scroll/turn');
  await cdp.detach();
  await load(structured);
  for(const view of ['auto','large','pdf']){await p.locator('#score-size').click();await p.locator(`#score-size-options [data-size=${view}]`).click();await ready();assert.equal(await label(),'Scroll');await choose('pages');assert.match(await label(),/^Page \d+ \/ \d+$/);await choose('continuous');}
  await p.locator('#settings').click();assert.equal(await p.locator('#navigation-settings legend').textContent(),'Page navigation');await p.locator('input[name=navigation][value=pages]').check();await p.locator('#close-settings').click();assert.equal(await label(),'Scroll','Settings Cancel discards draft');await p.locator('#settings').click();await p.locator('input[name=navigation][value=pages]').check();await p.locator('#apply-settings').click();assert.match(await label(),/^Page/,'Settings shares committed mode');
  await p.evaluate(()=>{localStorage.removeItem('music-transpose-navigation-v2');sessionStorage.removeItem('music-transpose-navigation-v2');localStorage.setItem('music-transpose-navigation-v1',JSON.stringify({mode:'continuous'}));sessionStorage.setItem('music-transpose-navigation-v1',JSON.stringify({mode:'continuous'}));});await p.reload();await p.waitForFunction(()=>window.prototype);if(await p.locator('[data-home-source=all]').isVisible())await p.locator('[data-home-source=all]').click();await load(long);assert.match(await label(),/^Page 1/,'Ambiguous legacy default cannot override new device rule');
 }
 console.log('PASS navigation',width);await c.close();
}assert.deepEqual(errors,[]);}finally{await b.close();}
