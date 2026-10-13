import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {mkdirSync,readFileSync} from 'node:fs';
import {songs} from '../songs.js';
for(const [id,page,title] of [['nativity','52','The Nativity Song'],['song-d165ef87-2efa-4a0c-a4b1-e07a742ea654','42','Away in a Manger'],['song-1d22a11a-9dd3-480d-a6f4-8c8e3fbd84a7','190','Love Is Spoken Here']]){const song=songs.find(s=>s.id===id);assert.equal(song.page,page);assert.equal(song.title,title);assert.equal(song.collection,'Children’s Songbook');}
import {ipadLandscape,fitPdfSpreads,spreadTurn} from '../pdf-spreads.js';
const {chromium,webkit}=createRequire('C:/Users/kenro/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/package.json')('playwright');
assert(!ipadLandscape({userAgent:'iPhone',platform:'MacIntel',maxTouchPoints:5},1024,768));
assert(!ipadLandscape({userAgent:'Macintosh',platform:'MacIntel',maxTouchPoints:0},1440,900));
assert(!fitPdfSpreads([.77,.77],790,700));assert(fitPdfSpreads([.77,.77],1000,700));
assert.deepEqual([0,2,4].map(i=>spreadTurn(i,1,5)),[2,4,4]);assert.equal(spreadTurn(3,-1,5),0);
const base=process.env.TEST_URL||'http://127.0.0.1:8786/';mkdirSync('test-results',{recursive:true});
for(const [engine,type] of Object.entries({chromium,webkit})){
 if(process.env.ENGINE&&process.env.ENGINE!==engine)continue;
 const browser=await type.launch(engine==='chromium'?{channel:'msedge'}:{});
 try{
 const c=await browser.newContext({viewport:{width:1366,height:1024},hasTouch:true,serviceWorkers:'block'});
 await c.addInitScript(()=>{Object.defineProperty(navigator,'platform',{get:()=> 'MacIntel'});Object.defineProperty(navigator,'maxTouchPoints',{get:()=>5});localStorage.setItem('music-transpose-page-hint-v1','seen');});
 const p=await c.newPage(),errors=[];p.on('pageerror',e=>errors.push(e.message));p.setDefaultTimeout(30000);
 await p.goto(base);await p.waitForFunction(()=>window.prototype?.loadSong);await p.locator('[data-home-source=all]').click();
 const open=async id=>{await p.evaluate(id=>prototype.loadSong(id,'pdf'),id);await p.waitForFunction(()=>prototype.ready&&!prototype.busy&&!prototype.loading);if(!await p.locator('body').evaluate(e=>e.classList.contains('pdf-score-open'))){await p.locator('#score-size').click();await p.locator('#score-size-options [data-size=pdf]').click();}await p.waitForFunction(()=>prototype.ready&&!prototype.busy&&!prototype.loading);await p.waitForTimeout(300);};
 const visible=()=>p.locator('#score>.pdf-page-frame.current-page').evaluateAll(es=>es.map(e=>+e.dataset.pdfPage));
 const check=async expected=>{assert.deepEqual(await visible(),expected);assert(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));};
 await open('choose-to-serve-the-lord');
 console.log(engine,'initial',await p.locator('#score-navigation-label').textContent(),await p.locator('#score').boundingBox());
 await check([1,2]);
 // Boundary turns must not replace an odd physical reading anchor with its partner.
 await p.locator('#pdf-spread-toggle').click();await p.keyboard.press('ArrowRight');await check([2]);await p.locator('#pdf-spread-toggle').click();await check([1,2]);await p.keyboard.press('ArrowLeft');await p.locator('#pdf-spread-toggle').click();await check([2]);await p.keyboard.press('Home');await p.locator('#pdf-spread-toggle').click();
 const originals=await p.locator('#score>.pdf-page-frame').evaluateAll(es=>es.map(e=>({page:e.dataset.pdfPage,doc:e.dataset.pdfDocument,canvas:e.querySelector('.pdf-page').toDataURL()})));
 await p.screenshot({path:`test-results/spreads-${engine}-1366.png`});
 await p.keyboard.press('ArrowRight');await check([3,4]);assert.equal(await p.locator('#page-turn-feedback').textContent(),'Pages 3–4 of 5');
 await p.keyboard.press('PageDown');await check([5]);await p.keyboard.press('PageDown');await check([5]);
 const last=await p.locator('.pdf-page-frame.current-page').boundingBox(),score=await p.locator('#score').boundingBox();assert(Math.abs(last.x+last.width/2-score.x-score.width/2)<1);
 await p.screenshot({path:`test-results/spreads-${engine}-odd.png`});
 await p.keyboard.press('Home');await check([1,2]);await p.keyboard.press('End');await check([5]);await p.keyboard.press('PageUp');await check([3,4]);
 await p.locator('#pdf-spread-toggle').click();await check([3]);assert.equal(await p.evaluate(()=>localStorage.getItem('music-transpose-pdf-landscape-pages-v1')),'1');
 await p.keyboard.press('ArrowRight');await check([4]);await p.locator('#pdf-spread-toggle').click();await check([3,4]);
 await p.setViewportSize({width:1024,height:1366});await p.waitForTimeout(350);await check([4]);assert(await p.locator('#pdf-spread-toggle').isHidden());
 await p.setViewportSize({width:1366,height:1024});await p.waitForTimeout(350);await check([3,4]);
 await p.locator('#score-hide-controls').click();await p.waitForTimeout(200);await check([3,4]);assert(await p.locator('#pdf-spread-toggle').isVisible());
 await p.locator('#score-show-controls').click();await p.waitForTimeout(200);
 await p.locator('#score-markup').click();await check([4]);assert.equal(await p.locator('#score-markup').getAttribute('aria-pressed'),'true');assert(await p.locator('#pdf-spread-toggle').isDisabled());
 const layer=p.locator('.current-page .pdf-annotation-canvas');await layer.waitFor({state:'visible'});
 await layer.evaluate(el=>{const r=el.getBoundingClientRect();for(const [type,x] of [['pointerdown',.3],['pointermove',.4],['pointerup',.4]])el.dispatchEvent(new PointerEvent(type,{bubbles:true,pointerId:55,isPrimary:true,button:0,pointerType:'pen',clientX:r.x+r.width*x,clientY:r.y+r.height*.3}));});
 const annotations=await p.evaluate(()=>localStorage.getItem('music-transpose-pdf-annotations-v1'));assert(annotations?.includes('choose-to-serve-the-lord'));
 await p.locator('#pdf-annotation-next').click();await check([5]);await p.locator('#pdf-annotation-done').click();await check([5]);await p.keyboard.press('ArrowLeft');await check([3,4]);
 assert.equal(await p.evaluate(()=>localStorage.getItem('music-transpose-pdf-annotations-v1')),annotations);
 assert.deepEqual(await p.locator('#score>.pdf-page-frame').evaluateAll(es=>es.map(e=>({page:e.dataset.pdfPage,doc:e.dataset.pdfDocument,canvas:e.querySelector('.pdf-page').toDataURL()}))),originals);
 await p.evaluate(()=>prototype.preparePrint());assert.equal(await p.locator('#print-pages .pdf-print-page').count(),5);
 await p.evaluate(()=>document.body.classList.remove('prepared-print'));
 await p.locator('#score-tools').click();await p.locator('#score-export').click();const downloading=p.waitForEvent('download');await p.locator('#score-export-pdf').click();assert(readFileSync(await(await downloading).path()).equals(readFileSync('assets/pdfs/choose-to-serve-the-lord.pdf')));

 // Geometry: music ends above the navigation strip; controls stay above footer.
 const g=await p.evaluate(()=>{const r=e=>{const b=e.getBoundingClientRect();return {left:b.left,right:b.right,top:b.top,bottom:b.bottom,width:b.width,height:b.height};};return {nav:r(document.querySelector('#score-navigation')),footer:r(document.querySelector('.masthead')),pages:[...document.querySelectorAll('.pdf-page-frame.current-page')].map(r),toggle:r(document.querySelector('#pdf-spread-toggle'))};});
 assert(g.pages.every(r=>r.bottom<g.nav.top&&r.width>=400),JSON.stringify(g));assert(g.nav.bottom<=g.footer.top,JSON.stringify(g));assert(g.toggle.height>=44&&g.toggle.width>=44);
 const tap=await p.evaluate(async()=>(await import('./score-taps.js')).scoreTapGeometry());await p.touchscreen.tap(tap.left+tap.width*.8,tap.top+tap.height*.4);await check([5]);
 await p.keyboard.press('Home');await check([1,2]);
 // Existing horizontal touch stream is also the pedal/key spread path's caller.
 await p.locator('.current-page .pdf-page').first().evaluate(el=>{const r=el.getBoundingClientRect();for(const [type,x] of [['pointerdown',.7],['pointermove',.4],['pointerup',.4]])el.dispatchEvent(new PointerEvent(type,{bubbles:true,pointerId:77,isPrimary:true,button:0,pointerType:'touch',clientX:r.x+r.width*x,clientY:r.y+r.height*.5}));});await check([3,4]);
 await p.keyboard.press('Home');await check([1,2]);
 await p.setViewportSize({width:744,height:600});await p.waitForTimeout(350);await check([1]);assert(await p.locator('#pdf-spread-toggle').isHidden());assert.equal(await p.evaluate(()=>localStorage.getItem('music-transpose-pdf-landscape-pages-v1')),'2');
 await p.setViewportSize({width:1366,height:1024});await p.waitForTimeout(350);await check([1,2]);
 for(const [id,count] of [['nativity',1],['song-d165ef87-2efa-4a0c-a4b1-e07a742ea654',2],['song-1d22a11a-9dd3-480d-a6f4-8c8e3fbd84a7',2]]){
  await open(id);assert.equal(await p.locator('#score>.pdf-page-frame').count(),count);console.log(engine,id,await p.locator('#score-navigation-label').textContent());await check(count===1?[1]:[1,2]);await p.screenshot({path:`test-results/spreads-${engine}-${id}.png`});
 if(count===2){await p.locator('#pdf-spread-toggle').click();await check([1]);await p.keyboard.press('ArrowRight');await check([2]);await p.locator('#pdf-spread-toggle').click();await check([1,2]);}

 }
 await p.locator('#pdf-spread-toggle').click();await check([2]);
 await p.reload();await p.waitForFunction(()=>window.prototype?.navigation);await open('choose-to-serve-the-lord');await check([1]);
 assert.equal(await p.locator('#pdf-spread-toggle').getAttribute('aria-pressed'),'false');await p.locator('#pdf-spread-toggle').click();await check([1,2]);
 assert.equal(await p.evaluate(()=>localStorage.getItem('music-transpose-pdf-annotations-v1')),annotations);
 for(const mode of ['continuous','auto','pages']){await p.locator('#score-navigation-button').click();await p.locator(`[data-navigation=${mode}]`).click();if(mode==='auto')await p.keyboard.press('Escape');assert.equal(await p.locator('#pdf-spread-toggle').isVisible(),mode==='pages');if(mode==='pages')await check([1,2]);else assert.equal(await p.locator('#score>.pdf-page-frame:visible').count(),5);}
 assert.deepEqual(errors,[]);await c.close();console.log('PASS',engine,'spreads, position, annotation ownership, original canvas bytes, print pages, focus, touch, fallback');

 // Separate device contexts: no spoofed app state and no source-data overrides.
 for(const [width,height,device,expected] of [[1366,1024,'iPad',true],[1180,820,'iPad',true],[1024,768,'iPad',true],[820,1180,'iPad',false],[744,1133,'iPad',false],[744,600,'iPad',false],[320,740,'iPhone',false],[390,844,'iPhone',false],[844,390,'iPhone',false],...[320,390,744,820,1024,1440].map(w=>[w,900,'desktop',false])]){
 const c=await browser.newContext({viewport:{width,height},serviceWorkers:'block',...(device==='desktop'?{}:{userAgent:device,hasTouch:true,isMobile:true})});const p=await c.newPage();
 await p.goto(base);await p.waitForFunction(()=>window.prototype?.navigation);await p.evaluate(()=>prototype.loadSong('choose-to-serve-the-lord'));await p.waitForFunction(()=>prototype.ready&&!prototype.busy&&!prototype.loading);await p.waitForTimeout(200);
 if(device==='iPhone')assert.equal(await p.locator('#score-navigation-label').textContent(),'Scroll');
 await p.locator('#score-navigation-button').click();await p.locator('[data-navigation=pages]').click();await p.waitForTimeout(200);
 assert.equal(await p.locator('#pdf-spread-toggle').isVisible(),expected,`${engine} ${device} ${width}`);
 assert.equal(await p.locator('.pdf-page-frame.current-page').count(),expected?2:1);
 for(const theme of ['light','dark']){
 await p.evaluate(t=>{if(document.documentElement.dataset.libraryTheme!==t)document.querySelector('.library-theme-toggle').click();},theme);
 assert(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
 const boxes=await p.locator('.pdf-page-frame.current-page').evaluateAll(es=>es.map(e=>{const b=e.getBoundingClientRect();return {left:b.left,right:b.right,bottom:b.bottom};}));assert(boxes.every(b=>b.left>=0&&b.right<=width));
 }
 if(expected){
 await p.evaluate(()=>document.documentElement.style.setProperty('--playing-safe-bottom','20px'));await p.waitForTimeout(200);
 const safe=await p.evaluate(()=>{const nav=document.querySelector('#score-navigation').getBoundingClientRect(),footer=document.querySelector('.masthead').getBoundingClientRect();return nav.bottom<=footer.top&&[...document.querySelectorAll('.pdf-page-frame.current-page')].every(e=>e.getBoundingClientRect().bottom<nav.top);});assert(safe);
 await p.evaluate(()=>document.documentElement.style.removeProperty('--playing-safe-bottom'));await p.waitForTimeout(200);
 }
 await p.screenshot({path:`test-results/spreads-${engine}-${device}-${width}x${height}.png`});
 await p.locator('#score-tools').click();assert(await p.locator('#score-tools-menu').isVisible());await p.keyboard.press('Escape');
 console.log('PASS responsive',engine,device,width,height,'spread',expected);await c.close();
 }
 }finally{await browser.close();}
}
