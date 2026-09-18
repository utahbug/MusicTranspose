import {createRequire} from 'node:module';
import assert from 'node:assert/strict';
import {chooseRelativeKey} from './key-selection-helper.mjs';
const require=createRequire(process.env.PLAYWRIGHT_PACKAGE),{chromium}=require('playwright');
const browser=await chromium.launch({channel:'msedge',headless:true}),context=await browser.newContext({hasTouch:true,viewport:{width:1180,height:820}}),page=await context.newPage(),errors=[];
page.on('pageerror',e=>errors.push(e.message));page.setDefaultTimeout(30000);
const ready=async()=>{await page.waitForFunction(()=>prototype.ready&&!prototype.busy&&document.querySelector('#score').getAttribute('aria-busy')==='false');await page.waitForTimeout(100);};
const mode=async value=>{await page.locator('#settings').click();await page.locator(`input[name=navigation][value=${value}]`).check();await page.locator('#close-settings').click();await page.waitForTimeout(100);};
const position=()=>page.locator('#page-position').textContent();
const printMarkup=()=>page.locator('#print-pages').evaluate(e=>{const copy=e.cloneNode(true);for(const n of copy.querySelectorAll('[id]'))n.removeAttribute('id');return copy.innerHTML;});
const location=()=>page.locator('.mxl-page-frame.current-page').evaluate(e=>({start:Number(e.dataset.start),end:Number(e.dataset.end)}));
const contains=async anchor=>{const at=await location();assert(at.start<=anchor&&at.end>=anchor,JSON.stringify({anchor,at}));};
const client=await context.newCDPSession(page);
async function touch(x,y,endY=y){await client.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x,y}]});if(endY!==y)await client.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x,y:endY}]});await client.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await page.waitForTimeout(40);}
async function inspect(){return page.evaluate(()=>{const frames=[...document.querySelectorAll('.mxl-page-frame')],current=document.querySelector('.mxl-page-frame.current-page'),score=document.querySelector('#score'),bar=document.querySelector('.masthead');return {pages:frames.length,systems:frames.reduce((n,f)=>n+Number(f.dataset.systems||0),0),expected:Number(score.dataset.systems),overflow:document.documentElement.scrollWidth>innerWidth,bottom:current.getBoundingClientRect().bottom,bar:bar.getBoundingClientRect().top,scroll:scrollY,groups:frames.filter(f=>f._view).map(f=>({start:+f.dataset.start,end:+f.dataset.end,top:f._view.top,bottom:f._view.bottom,svg:f._view.svgIndex})),credits:[...document.querySelectorAll('#source-credits p')].map(p=>p.textContent).join('\n'),copies:[...document.querySelectorAll('.mxl-credit-page p')].map(p=>p.textContent).join('\n')};});}
try{
 await page.goto(process.env.TEST_URL||'http://127.0.0.1:8767/');await page.locator('.library-row').first().waitFor();
 for(const [width,height] of [[1180,820],[820,1180],[390,844],[1440,1000]]){
  await page.setViewportSize({width,height});
  for(const id of ['hhc-1010','cs-236','nativity','shepherd','faithful','silent-night','cs-12','cs-110','hhc-1001']){
   // Canonical IDs are used, never page-number identity guessing.
   const exists=await page.evaluate(id=>!!document.querySelector(`[data-song="${id}"]`),id);if(!exists)throw Error('Missing test song '+id);
   await page.evaluate(id=>prototype.loadSong(id),id);await ready();await mode('pages');
   const result=await inspect();assert.equal(result.systems,result.expected);assert(!result.overflow);assert(result.bottom<=result.bar-8);assert.equal(result.scroll,0);assert.equal(result.credits,result.copies);assert(result.groups.every(g=>Number.isFinite(g.start)&&g.end>=g.start&&g.bottom>g.top));
   for(let i=1;i<result.groups.length;i++){const a=result.groups[i-1],b=result.groups[i];assert(b.start>a.end);if(a.svg===b.svg)assert(a.bottom<b.top,'Ink must not cross a page cut');}
   const before=await page.evaluate(()=>({renders:prototype.metrics.length,requests:performance.getEntriesByType('resource').length}));
   for(let i=1;i<result.pages;i++){await page.locator('#page-next').click();assert.equal(await position(),`${i+1} / ${result.pages}`);assert.equal(await page.evaluate(()=>scrollY),0);const bounds=await page.locator('.mxl-page-frame.current-page').evaluate(e=>{const svg=e.querySelector('svg');return {overflow:e.scrollHeight>Math.ceil(e.clientHeight)+2,inside:!svg||svg.getBoundingClientRect().bottom<=e.getBoundingClientRect().bottom+1};});assert(!bounds.overflow);assert(bounds.inside);}
   assert(await page.locator('#page-next').isDisabled());await page.keyboard.press('Home');assert.equal(await position(),`1 / ${result.pages}`);
   assert.deepEqual(await page.evaluate(()=>({renders:prototype.metrics.length,requests:performance.getEntriesByType('resource').length})),before);
   if(['nativity','cs-110','faithful'].includes(id))await page.screenshot({path:`test-results/virtual-${id}-${width}.png`});
   console.log('complete systems/clearance/credits',width,id,result.pages,result.systems);
  }
 }
 await page.setViewportSize({width:1180,height:820});await page.evaluate(()=>prototype.loadSong('nativity'));await ready();await mode('pages');
 const count=await page.locator('.mxl-page-frame').count(),box=await page.locator('#score').boundingBox(),x=box.x+box.width*.8,y=box.y+box.height*.4;
 await touch(x,y);assert.equal(await position(),`2 / ${count}`);await touch(x,y);assert.equal(await position(),`3 / ${count}`);await touch(box.x+box.width*.2,y);assert.equal(await position(),`2 / ${count}`);await touch(x,y,y-70);assert.equal(await position(),`2 / ${count}`);
 await page.keyboard.press('Home');const timings=[];await context.setOffline(true);
 for(let i=0;i<10;i++){const start=performance.now();await page.keyboard.press('ArrowRight');assert.equal(await position(),`2 / ${count}`);await page.keyboard.press('ArrowLeft');assert.equal(await position(),`1 / ${count}`);timings.push((performance.now()-start)/2);}
 await context.setOffline(false);console.log('keyboard round-trip ms/turn',Math.round(Math.max(...timings)));
 await page.keyboard.press('PageDown');const held=await position();await page.evaluate(()=>document.body.dispatchEvent(new KeyboardEvent('keydown',{key:'PageDown',repeat:true,bubbles:true})));assert.equal(await position(),held);
 await page.locator('#settings').click();await page.keyboard.press('ArrowRight');assert.equal(await position(),held);await page.locator('#close-settings').click();
 let anchor=(await location()).start;await chooseRelativeKey(page,1);await ready();await contains(anchor);anchor=(await location()).start;await page.setViewportSize({width:820,height:1180});await page.waitForTimeout(500);await ready();await contains(anchor);
 await page.setViewportSize({width:390,height:844});await page.waitForTimeout(500);await ready();
 for(const size of ['compact','large','normal']){anchor=(await location()).start;await page.locator('#score-size').click();await page.locator(`#score-size-options [data-size=${size}]`).click();await ready();await contains(anchor);}
 anchor=(await location()).start;await page.locator('#settings').click();await page.locator('input[name=octave][value="1"]').check();await page.locator('#close-settings').click();await ready();await contains(anchor);assert.equal(await page.evaluate(()=>prototype.octave),1);
 await page.locator('#reset').click();await ready();assert.equal(await page.evaluate(()=>prototype.xml===prototype.original),true);
 // Printing uses the independent unchanged A4 engraver, not virtual SVG viewports.
 await page.evaluate(()=>prototype.preparePrint());const print=await printMarkup();await mode('continuous');await page.evaluate(()=>prototype.preparePrint());assert((await printMarkup())===print,'Print content/geometry must be invariant (renderer-generated IDs ignored)');await mode('pages');await page.emulateMedia({media:'print'});assert(await page.locator('.masthead').isHidden());assert.equal(await page.locator('.mxl-page-frame:visible').count(),0);await page.emulateMedia({media:'screen'});
 await page.locator('.score-heading .song-playback').click();await page.waitForFunction(()=>prototype.playback.state==='playing');await page.locator('#page-next').click();assert.equal(await page.evaluate(()=>prototype.playback.state),'playing');await page.locator('#show-lyrics').click();await page.getByRole('button',{name:'Open score',exact:true}).click();await ready();assert.equal(await page.evaluate(()=>prototype.playback.state),'playing');
 await page.locator('#songs').click();await page.locator('[data-song="nativity"] .song-entry').click();await ready();assert((await position()).startsWith('1 /'));assert.equal(await page.evaluate(()=>prototype.playback.state),'stopped');
 await page.evaluate(()=>prototype.loadSong('scripture-power'));await ready();assert(await page.locator('.pdf-page-frame.current-page').isVisible());await page.evaluate(()=>prototype.loadSong('shepherd'));await ready();assert((await position()).startsWith('1 /'));assert(await page.locator('.mxl-page-frame.current-page').isVisible());
 assert.deepEqual(errors,[]);console.log('PASS virtual pages, true touch/drag safety, offline instant navigation, measure retention, size/key/octave, print, playback, Lyrics and PDF transitions');
}finally{await browser.close();}
