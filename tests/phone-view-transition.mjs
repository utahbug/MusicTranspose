import fs from 'node:fs';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
const {webkit}=createRequire(process.env.PLAYWRIGHT_PACKAGE||'C:/Users/kenro/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/package.json')('playwright');
const browser=await webkit.launch(),results=[],errors=[];
const id='song-138d4697-d2d9-414a-885c-82b760f1f371';
try{for(const [width,height] of [[402,650],[390,844],[430,932],[820,1180],[1440,1180]].filter(([w])=>!process.env.TRANSITION_WIDTH||w===Number(process.env.TRANSITION_WIDTH))){
 const context=await browser.newContext({viewport:{width,height},isMobile:width<600,hasTouch:width<900,serviceWorkers:'block'}),page=await context.newPage();page.setDefaultTimeout(90000);page.on('pageerror',e=>errors.push(e.message));
 // Observe each selected engraving, without changing source or rendering behavior.
 await page.route('**/app.js',async route=>{let body=await(await route.fetch()).text();if(process.env.TRANSITION_BASELINE)body=body.replace(/^window.visualViewport\?\.addEventListener.*$/m,'');body=body.replace('const fullRightMargin=',"const breakState={flags:osmd.Sheet.SourceMeasures.map(m=>[m.printNewSystemXml,m.printNewPageXml]),rule:osmd.EngravingRules.NewSystemAtXMLNewSystemAttribute};const fullRightMargin=").replace('return {systemLayout,svg:stage.innerHTML','return {breakState,systemLayout,svg:stage.innerHTML').replace('function commit(entry,shift,octave,w){','function commit(entry,shift,octave,w){window.selectedBreakState=entry.breakState;');await route.fulfill({body,contentType:'application/javascript'});});
 if(process.env.TRANSITION_BASELINE)await page.route('**/navigation.js',async route=>{const body=(await(await route.fetch()).text()).replace(/^window.visualViewport\?\.addEventListener.*$/m,'');await route.fulfill({body,contentType:'application/javascript'});});
 await page.addInitScript(()=>localStorage.setItem('music-transpose-navigation-v2',JSON.stringify({mode:'pages',explicit:true})));
 await page.goto(process.env.TEST_URL||'http://127.0.0.1:8780/');await page.locator('[data-home-source=all]').click();await page.evaluate(id=>prototype.loadSong(id),id);
 const ready=async()=>{await page.waitForFunction(()=>prototype.ready&&!prototype.busy&&!document.body.classList.contains('song-loading')&&document.querySelector('#score').getAttribute('aria-busy')==='false');await page.waitForTimeout(250);};await ready();
 const view=async mode=>{await page.locator('#score-size').click();await page.locator(`#score-size-options [data-size=${mode}]`).click();await ready();};
 const snapshot=()=>page.evaluate(()=>{const s=document.querySelector('#score');return {zoom:s.dataset.zoom,profile:s.dataset.fullScoreSpacing,breakState:selectedBreakState,pages:[...s.querySelectorAll('.mxl-page-frame')].map(f=>({height:parseFloat(f.style.height),systems:f._view.page.systems.map(x=>({start:x.start,end:x.end,height:x.height,y:x.y}))}))};});
 await view('auto');const fresh=await snapshot();await view('large');const melody=await snapshot();await view('auto');assert.deepEqual(await snapshot(),fresh,'Same geometry: fresh and post-Melody Full must match exactly');
 if(width<600){
  await view('large');
  // Reproduce Safari settling browser chrome with a visual-viewport event only.
  // Temporary layout height is 75px smaller, matching the physical report.
  await page.evaluate(height=>{window.heightDescriptor=Object.getOwnPropertyDescriptor(window,'innerHeight');Object.defineProperty(window,'innerHeight',{configurable:true,value:height-75});},height);
  await view('auto');await page.waitForTimeout(500);const transient=await snapshot();
  await page.evaluate(()=>{Object.defineProperty(window,'innerHeight',window.heightDescriptor);visualViewport.dispatchEvent(new Event('resize'));});
  if(process.env.TRANSITION_BASELINE)await page.evaluate(()=>dispatchEvent(new Event('resize')));
  await page.waitForTimeout(300);await ready();const settled=await snapshot();assert.deepEqual(settled,fresh,'Settled viewport must recover the same engraving and page budget');
  results.push({width,height,fresh,melody,transient,settled});
  // Pinch zoom is visual magnification, not an instruction to re-engrave.
  await page.evaluate(()=>{window.scaleDescriptor=Object.getOwnPropertyDescriptor(visualViewport,'scale');Object.defineProperty(visualViewport,'scale',{configurable:true,value:2});visualViewport.dispatchEvent(new Event('resize'));});await page.waitForTimeout(400);assert.deepEqual(await snapshot(),fresh);
  await page.evaluate(()=>{if(window.scaleDescriptor)Object.defineProperty(visualViewport,'scale',window.scaleDescriptor);else delete visualViewport.scale;});
 }else results.push({width,height,fresh,melody,settled:await snapshot()});
 if(width===402){
  for(const shift of [2,-2]){await page.evaluate(shift=>prototype.changeKey(shift),shift);await page.waitForTimeout(100);await ready();const full=await snapshot();await view('large');await view('auto');assert.deepEqual(await snapshot(),full,`Mode round-trip at ${shift}`);results.push({width,height,shift,full});}
  await page.locator('#score-navigation-button').click();await page.locator('[data-navigation=continuous]').click();await view('large');await view('auto');assert.equal(await page.locator('#score-navigation-label').textContent(),'Scroll');
 }
 console.log('PASS geometry and break state',width,height);await context.close();
}
// WebKit also emits this scheduling notification with the new handlers disabled
// (TRANSITION_BASELINE=1); retain it in output and fail on every other page error.
fs.writeFileSync(`test-results/phone-view-transition${process.env.TRANSITION_BASELINE?'-baseline':''}.json`,JSON.stringify(results,null,2));console.log('Browser notifications:',errors);assert.deepEqual(errors.filter(e=>e!=='ResizeObserver loop completed with undelivered notifications.'),[]);console.log('PASS Full/Melody break-state and geometry equivalence; visual viewport recovery; pinch exclusion; alternate keys; Continuous; tablet/desktop controls');}finally{await browser.close();}
