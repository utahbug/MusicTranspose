import {createRequire} from 'node:module';import assert from 'node:assert/strict';
const engines=createRequire(process.env.PLAYWRIGHT_PACKAGE)('playwright'),engine=process.env.WEBKIT?'webkit':'chromium',b=await engines[engine].launch(engine==='chromium'?{channel:'msedge',headless:true}:{});
try{for(const [width,height] of [[390,844],[820,1180],[1180,820],[1440,800]]){
 if(process.env.CLEARANCE_WIDTH&&width!==Number(process.env.CLEARANCE_WIDTH))continue;
 const c=await b.newContext({viewport:{width,height},hasTouch:width<1440,serviceWorkers:'block'}),p=await c.newPage();await c.addInitScript(()=>localStorage.setItem('music-transpose-navigation-v1',JSON.stringify({mode:'pages'})));
 await p.goto(process.env.TEST_URL||'http://127.0.0.1:8780/');await p.locator('.library-row').first().waitFor();
 const ready=async()=>{await p.waitForFunction(()=>prototype.ready&&!prototype.busy);await p.waitForTimeout(150);};
 const counter=p.locator('#page-position');
 // Dense PDFs no longer need an ink scan: persistent status is outside the paper.
 const check=async()=>{assert(await counter.isVisible());assert(await counter.evaluate(e=>e.parentElement.classList.contains('toolbar')));const r=await counter.boundingBox(),f=await p.locator('.pdf-page-frame.current-page').boundingBox();assert(r.y>=f.y+f.height,'persistent label below paper');assert.equal(await counter.evaluate(e=>getComputedStyle(e).pointerEvents),'none');};
 for(const id of ['choose-to-serve-the-lord','song-a13c43da-0243-4019-ad08-d7be530074f5']){
  await p.evaluate(id=>prototype.loadSong(id),id);await ready();const total=await p.locator('.pdf-page-frame').count();assert(total>1);
  for(let i=1;i<=total;i++){assert.equal(await counter.textContent(),`Page ${i}`);await check();await p.screenshot({path:`test-results/pdf-counter-clearance-${engine}-${width}-${id}-${i}.png`});if(i<total)await p.keyboard.press('ArrowRight');}
  await p.keyboard.press('Home');await check();await p.keyboard.press('End');await check();
  await p.locator('#score-tools').click();await p.locator('#score-page-theme').click();await check();await p.locator('#score-tools').click();await p.locator('#score-page-theme').click();
  await p.locator('#settings').click();await p.locator('#pdf-trim').uncheck();await p.locator('#close-settings').click();await check();await p.locator('#settings').click();await p.locator('#pdf-trim').check();await p.locator('#close-settings').click();await check();
  await p.keyboard.press('Home');await check();const r=await counter.boundingBox(),point={x:r.x+r.width/2,y:r.y+r.height/2};
  const action=await p.evaluate(async({x,y})=>(await import('./score-taps.js')).scoreTapAction(x,y),point);
  if(width<1440)await p.touchscreen.tap(point.x,point.y);else await p.mouse.click(point.x,point.y);
  assert.equal(await counter.textContent(),'Page 1');await p.keyboard.press('End');
  await p.locator('#score-tools').click();await p.locator('#score-annotate').click();await p.locator('#pdf-annotation-previous').click();assert.equal(await counter.textContent(),`Page ${total-1}`);await check();await p.locator('#pdf-annotation-next').click();assert.equal(await counter.textContent(),`Page ${total}`);await check();await p.locator('#pdf-annotation-done').click();await check();
 }
 console.log('PASS dense PDF footer clearance, trim, dark, keyboard and annotation',engine,width);await c.close();
}}finally{await b.close();}
