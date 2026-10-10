import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createRequire} from 'node:module';
import {songs} from '../songs.js';
import {requiredOfflineAssets} from '../offline-assets.js';
const {chromium,webkit}=createRequire('C:/Users/kenro/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/package.json')('playwright');
const b=process.env.NATIVITY_WEBKIT?await webkit.launch():await chromium.launch({channel:'msedge'});
const manifest=JSON.parse(fs.readFileSync('offline-catalog.json','utf8'));
assert.deepEqual(songs.filter(s=>s.performancePdf).map(s=>s.id),['nativity']);assert.deepEqual(requiredOfflineAssets(songs.find(s=>s.id==='nativity')),manifest.nativity);assert.equal(manifest.nativity.length,3);
fs.mkdirSync('test-results/nativity',{recursive:true});
try{for(const [width,height] of [[390,844],[744,1133],[820,1180],[1440,1000]]){
 const c=await b.newContext({viewport:{width,height},hasTouch:width<1000,isMobile:width<1000,...(width===390?{userAgent:'iPhone'}:{}),serviceWorkers:'block',acceptDownloads:true}),p=await c.newPage(),errors=[];p.on('pageerror',e=>errors.push(e.message));
 await c.addInitScript(()=>localStorage.setItem('music-transpose-navigation-v2',JSON.stringify({mode:'pages',explicit:true})));
 await p.goto('http://127.0.0.1:8780/');await p.waitForFunction(()=>prototype?.navigation);
 const ready=async()=>{await p.waitForFunction(()=>prototype.ready&&!prototype.busy&&!prototype.loading);await p.waitForTimeout(200);};
 await p.evaluate(()=>prototype.loadSong('nativity'));await ready();assert.equal(await p.locator('.pdf-page-frame').count(),2);
 const originalXML=await p.evaluate(()=>prototype.original),footer=await p.locator('.masthead .toolbar').boundingBox();
 const choice=async selector=>{await p.locator('#score-size').click();await p.locator(selector).click();await ready();};
 await choice('#score-pdf-performance');assert.equal(await p.locator('.pdf-page-frame').count(),1);assert.match(await p.locator('#pdf-original').getAttribute('href'),/performance/);
 assert.equal(await p.locator('#score-pdf-performance').getAttribute('aria-checked'),'true');assert.equal(await p.locator('#score-pdf-option').getAttribute('aria-checked'),'false');
 assert.match(await p.locator('#score-navigation-button').getAttribute('aria-label'),/1 of 1/);assert.deepEqual(await p.locator('.masthead .toolbar').boundingBox(),footer);
 const frame=await p.locator('.pdf-page-frame').boundingBox();assert(frame.y+frame.height<=footer.y+1);assert(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
 await p.keyboard.press('PageDown');assert.match(await p.locator('#score-navigation-button').getAttribute('aria-label'),/1 of 1/);
 const fingerprint=await p.locator('.pdf-page-frame').getAttribute('data-pdf-document');
 await p.screenshot({path:`test-results/nativity/performance-${width}.png`});
 const bytes=await p.evaluate(async()=>Array.from(await (await import('./pdf-score.js')).originalPdfData(document.querySelector('#pdf-original').href)));assert(Buffer.from(bytes).equals(fs.readFileSync('assets/pdfs/performance/nativity.pdf')));
 const printCount=await p.evaluate(()=>prototype.preparePrint());assert.equal(await p.locator('.print-page').count(),1);await p.evaluate(()=>document.body.classList.remove('prepared-print'));
 await p.locator('#score-tools').click();await p.locator('#score-export').click();const download=p.waitForEvent('download');await p.locator('#score-export-pdf').click();const d=await download;assert(fs.readFileSync(await d.path()).equals(fs.readFileSync('assets/pdfs/performance/nativity.pdf')));
 await p.locator('#score-navigation-button').click();await p.locator('[data-navigation=continuous]').click();assert.equal(await p.locator('.pdf-page-frame').count(),1);
 await p.locator('#score-navigation-button').click();await p.locator('[data-navigation=pages]').click();
 await choice('#score-pdf-option');assert.equal(await p.locator('.pdf-page-frame').count(),2);assert.notEqual(await p.locator('.pdf-page-frame').first().getAttribute('data-pdf-document'),fingerprint);
 // Native-harmony PDFs enter Transpose through Key (the existing workflow).
 await p.evaluate(()=>prototype.changeKey(1));await ready();
 for(const mode of ['auto','large']){await choice(`#score-size-options [data-size=${mode}]`);assert.equal(await p.locator('canvas.pdf-page').count(),0);assert.equal(await p.evaluate(()=>prototype.original),originalXML);await p.screenshot({path:`test-results/nativity/${mode}-${width}.png`});}
 await p.evaluate(()=>prototype.changeKey(1));await ready();assert.equal(await p.evaluate(()=>prototype.current),1);await p.locator('#reset').click();await ready();assert.equal(await p.evaluate(()=>prototype.current),0);
 await p.evaluate(()=>prototype.loadSong('faithful'));await ready();await p.locator('#score-size').click();assert(await p.locator('#score-pdf-performance').isHidden());await p.keyboard.press('Escape');
 assert.deepEqual(errors,[]);console.log('PASS Nativity original/performance, page count, geometry, print/export, scroll/pages, unchanged XML/modes/key, isolated annotation identity',width);await c.close();
}}finally{await b.close();}
