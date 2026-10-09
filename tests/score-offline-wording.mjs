import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
const {chromium}=createRequire('C:/Users/kenro/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/package.json')('playwright');
const browser=await chromium.launch({channel:'msedge'});
try{for(const width of [320,390,820,1440]){
 const context=await browser.newContext({viewport:{width,height:1000},hasTouch:width<1000,...(width<600?{isMobile:true,userAgent:'iPhone'}:{})}),page=await context.newPage();page.setDefaultTimeout(45000);
 const errors=[];page.on('pageerror',e=>errors.push(e.message));await page.goto('http://127.0.0.1:8780/');await page.waitForFunction(()=>window.prototype?.navigation&&navigator.serviceWorker.controller);
 await page.evaluate(()=>prototype.loadSong('nativity'));await page.waitForFunction(()=>prototype.ready&&!prototype.loading&&!prototype.busy);
 const call=(method,arg)=>page.evaluate(async({method,arg})=>(await import('./offline-manager.js'))[method](arg),{method,arg});await call('refreshOffline');assert((await call('offlineSummary')).shellReady);
 const open=async()=>{if(await page.locator('#score-tools-menu').isHidden())await page.locator('#score-tools').click();};
 await page.evaluate(async()=>{window.wordingOffline=await import('./offline-manager.js');});
 const state=async saved=>{await page.waitForFunction(saved=>{const m=window.wordingOffline,s=m.offlineSongState({id:'nativity'});return !m.offlineSummary().busy&&!!s.individual===saved&&(!saved||s.saved);},saved);};
 const check=async(name,id)=>{
  await open();const button=page.getByRole('menuitem',{name,exact:true});assert.equal(await button.getAttribute('id'),id);await button.scrollIntoViewIfNeeded();
  assert(await button.evaluate(e=>{const r=e.getBoundingClientRect(),m=e.closest('#score-tools-menu').getBoundingClientRect();const range=document.createRange();range.selectNodeContents(e);const t=range.getBoundingClientRect();return r.height>=44&&r.x>=0&&r.right<=innerWidth&&r.y>=m.y&&r.bottom<=m.bottom&&t.x>=r.x&&t.right<=r.right&&t.y>=r.y&&t.bottom<=r.bottom&&e.scrollWidth<=e.clientWidth&&e.contains(document.elementFromPoint(r.x+r.width/2,r.y+r.height/2));}),'unclipped text and accessible tap target: '+name);
  return button;
 };
 await open();assert.deepEqual(await page.locator('#score-tools-menu .tools-section-label').allTextContents(),['Offline','Output / Sharing','Score tools']);assert.equal(await page.locator('#score-offline-status').textContent(),'Not saved for offline use');assert(await page.locator('#score-offline-remove').isHidden());
 await (await check('Save song on this device','score-offline-save')).click();await state(true);assert((await call('offlineSongState',{id:'nativity'})).saved,JSON.stringify(await call('offlineSummary')));await open();assert.equal(await page.locator('#score-offline-status').textContent(),'Saved for offline use');assert(await page.locator('#score-offline-save').isHidden());
 await (await check('Remove song from this device','score-offline-remove')).click();await state(false);assert(!(await call('offlineSongState',{id:'nativity'})).saved);await open();assert.equal(await page.locator('#score-offline-status').textContent(),'Not saved for offline use');
 if(width===1440){await (await check('Save song on this device','score-offline-save')).click();await state(true);await call('saveOfflineList',{id:'protected-wording-test',songs:['nativity']});await (await check('Remove song from this device','score-offline-remove')).click();await state(false);const retained=await call('offlineSongState',{id:'nativity'});assert(retained.saved&&retained.lists.includes('protected-wording-test'));await open();assert.equal(await page.locator('#score-offline-status').textContent(),'Saved for offline use · Saved by List');assert(await page.locator('#score-offline-save').isHidden());assert(await page.locator('#score-offline-remove').isHidden());}
 assert.deepEqual(errors,[]);console.log('PASS Score offline labels/accessibility, actual Save/Remove, status and layout',width);await context.close();
}}finally{await browser.close();}
