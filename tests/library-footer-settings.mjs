import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createRequire} from 'node:module';
import {settingsIcon} from '../icons.js';
const {chromium,webkit}=createRequire('C:/Users/kenro/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/package.json')('playwright');
const browser=process.env.LIBRARY_WEBKIT?await webkit.launch():await chromium.launch({channel:'msedge'});
fs.mkdirSync('test-results/library-settings',{recursive:true});
try{for(const width of [320,390,600,744,820,1024,1440]){
 const c=await browser.newContext({viewport:{width,height:900},serviceWorkers:'block'}),p=await c.newPage(),errors=[];p.on('pageerror',e=>errors.push(e.message));
 await c.addInitScript(()=>{if(localStorage.getItem('seed'))return;localStorage.setItem('seed','1');localStorage.setItem('music-transpose-library-v1',JSON.stringify({orderingVersion:1,favorites:['cs-2'],groups:[{id:'practice',name:'Practice',songs:['cs-2','cs-4','hhc-1035']}]}));});
 await p.goto('http://127.0.0.1:8780/');await p.locator('[data-home-source=all]').click();
 const trigger=p.locator('#library-more'),menu=p.locator('#library-more-dialog'),sort=p.locator('#order-toggle');
 assert.equal(await p.locator('.library-filter-row #order-toggle,.library-filter-row #library-more,#library-lists').count(),0);
 assert.equal(await p.locator('.library-heading #order-toggle').count(),1);assert.equal(await p.locator('.library-filter-row #library-source').count(),1);
 assert.equal(await trigger.getAttribute('aria-label'),'Library Settings');assert.equal(await trigger.innerHTML(),await p.evaluate(svg=>{const d=document.createElement('div');d.innerHTML=svg;return d.innerHTML;},settingsIcon));
 assert.deepEqual(await menu.locator('button').evaluateAll(es=>es.map(e=>e.id)),['view-files','view-lists','library-import','clear-favorites','library-saved-filter','offline-music']);
 for(const theme of ['light','dark']){
  await p.evaluate(t=>{document.documentElement.dataset.libraryTheme=t;scrollTo({top:0,behavior:'instant'});},theme);await p.waitForTimeout(200);
  const [title,label,head,foot,button]=await p.evaluate(()=>['#library .workspace-banner h1','.sort-choice','#library .workspace-banner','.library-quick-access','#library-more'].map(s=>{const {x,y,width,height}=document.querySelector(s).getBoundingClientRect();return {x,y,width,height};}));
  assert(label.x>=head.x&&label.x+label.width<=head.x+head.width&&label.y+label.height<=head.y+head.height,JSON.stringify({width,theme,label,head}));
  assert(title.y+title.height<=label.y||title.x+title.width<=label.x,JSON.stringify({width,theme,title,label}));
  assert(await p.locator('#library .header-home').evaluate(e=>e.scrollWidth<=e.clientWidth+1));
  assert.equal(button.width,44);assert.equal(button.height,44);assert(button.x+button.width>=width-10);assert(foot.y>=head.y+head.height);
  assert(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
  await trigger.focus();await p.keyboard.press('ArrowUp');assert(await menu.isVisible());assert.equal(await p.evaluate(()=>document.activeElement.id),'offline-music');
  const box=await menu.boundingBox();assert(box.y>=8&&box.y+box.height<=button.y-4&&box.x>=0&&box.x+box.width<=width);
  await p.keyboard.press('Escape');assert(await menu.isHidden());await p.waitForFunction(()=>document.activeElement.id==='library-more');
  await trigger.click();await p.locator('#library-source').click();assert(await menu.isHidden());await p.keyboard.press('Escape');
  await trigger.click();await p.keyboard.press('Tab');assert(await menu.isHidden());
  await p.evaluate(()=>scrollTo(0,700));await p.mouse.wheel(0,300);await p.waitForTimeout(100);assert.deepEqual(await trigger.boundingBox(),button);await p.evaluate(()=>scrollTo(0,document.body.scrollHeight));await p.mouse.wheel(0,1000);await p.waitForTimeout(100);assert.deepEqual(await trigger.boundingBox(),button);await p.evaluate(()=>scrollTo(0,0));
  await p.screenshot({path:`test-results/library-settings/${width}-${theme}.png`});
 }
 await sort.selectOption('number');assert.equal(await sort.inputValue(),'number');assert.equal(await p.evaluate(()=>JSON.parse(localStorage.getItem('music-transpose-library-preferences-v1')).order),'number');
 await p.locator('#library-source').click();await p.locator('[data-source="list:practice"]').click();assert.equal(await sort.inputValue(),'manual');
 await p.locator('#view-favorites').click();assert.equal(await p.locator('.library-row').count(),1);assert.equal(await p.locator('#library-source-label').innerText(),'Practice');await p.locator('#view-favorites').click();assert.equal(await p.locator('.library-row').count(),3);
 await p.locator('#library-search-options').click();await p.locator('[data-search-field=lyrics]').check();await p.locator('[data-search-field=page]').check();await p.keyboard.press('Escape');await p.locator('#library-search').fill('1000000');assert.equal(await p.locator('.library-row').count(),0);await p.locator('#library-clear').click();assert.equal(await p.locator('.library-row').count(),3);
 await trigger.click();await p.locator('#clear-favorites').click();assert(await p.locator('#clear-favorites-dialog').isVisible());await p.locator('#clear-favorites-cancel').click();await p.waitForFunction(()=>document.activeElement.id==='library-more');
 await trigger.click();await p.locator('#library-saved-filter').click();assert(await menu.isHidden());assert.equal(await p.locator('#library-saved-filter').getAttribute('aria-checked'),'true');await p.waitForFunction(()=>document.activeElement.id==='library-more');await trigger.click();await p.locator('#library-saved-filter').click();
 await trigger.click();await p.locator('#offline-music').click();assert(await p.locator('#offline-music-dialog').isVisible());await p.locator('#offline-music-close').click();await p.waitForFunction(()=>document.activeElement.id==='library-more');
 await trigger.click();await p.locator('#view-files').click();assert(await p.locator('#files-view').isVisible());await p.goBack();await p.locator('#library').waitFor({state:'visible'});
 await trigger.click();await p.locator('#view-lists').click();assert(await p.locator('#lists-view').isVisible());await p.goBack();await p.locator('#library').waitFor({state:'visible'});
 await p.locator('#library-quick-lists').click();assert(await p.locator('#lists-view').isVisible());await p.goBack();await p.locator('#library').waitFor({state:'visible'});
 await p.locator('#library-quick-home').click();await p.locator('[data-home-source=all]').click();assert.equal(await sort.inputValue(),'number');await p.reload();await p.locator('#library').waitFor({state:'visible'});assert.equal(await sort.inputValue(),'number');
 await trigger.click();await p.locator('#clear-favorites').click();await p.locator('#clear-favorites-confirm').click();await p.waitForFunction(()=>document.activeElement.id==='library-more');assert.equal(await p.evaluate(()=>JSON.parse(localStorage.getItem('music-transpose-library-v1')).favorites.length),0);
 await p.locator('#library-import').evaluate(e=>e.click());assert(await p.locator('#music-import').isVisible());await p.locator('#close-import').click();
 assert.deepEqual(errors,[]);console.log('PASS Library header/footer geometry, menu commands/focus, search, Source/List, sort and filters',width);await c.close();
}}finally{await browser.close();}
