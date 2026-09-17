import {createRequire} from 'node:module';import assert from 'node:assert/strict';import fs from 'node:fs/promises';
const require=createRequire(process.env.PLAYWRIGHT_PACKAGE||import.meta.url),{chromium}=require('playwright');
const browser=await chromium.launch({channel:'msedge',headless:true});const context=await browser.newContext(),p=await context.newPage(),errors=[];p.on('pageerror',e=>errors.push(e.message));
const base=process.env.TEST_URL||'http://127.0.0.1:8767/';
const rows=p.locator('.library-row'),filter=v=>p.locator(`[data-filter="${v}"]`).click(),entry=id=>p.locator(`[data-song="${id}"] .song-entry`);
async function ready(n=0){await p.waitForFunction(n=>prototype.ready&&!prototype.busy&&prototype.current===n&&document.getElementById('score').getAttribute('aria-busy')==='false',n);}
async function home(){if(await p.locator('#library').isHidden())await p.locator('#songs').click();}
try{
 await p.goto(base);await rows.first().waitFor();assert.equal(await rows.count(),4);assert.equal(await p.locator('#score svg').count(),0);assert.equal(await p.locator('#song-dialog').count(),0);
 for(const [q,n] of [['nativ',1],['Children',2],['202',1],['',4]]){await p.locator('#library-search').fill(q);assert.equal(await rows.count(),n);}
 for(const [f,n] of [['Primary',2],['Christmas',4],['Hymns (1985)',2],['Children’s Songbook',2],['Hymns for Home and Church',0],['favorites',0],['recent',0],['all',4]]){await filter(f);assert.equal(await rows.count(),n);}
 await p.locator('[data-song="nativity"] .favorite').click();await filter('favorites');assert.equal(await rows.count(),1);await p.reload();await rows.first().waitFor();await filter('favorites');assert.equal(await rows.count(),1);await p.locator('[data-song="nativity"] .favorite').click();assert.equal(await rows.count(),0);await filter('all');
 await p.locator('[data-song="nativity"] .song-lists').click();
 for(const name of ['Practice','Christmas set']){await p.locator('#new-list-name').fill(name);await p.locator('#create-list button').click();}
 assert.equal(await p.locator('#personal-lists input:checked').count(),2);await p.locator('#personal-lists label').filter({hasText:'Practice'}).locator('input').uncheck();assert.equal(await p.locator('#personal-lists input:checked').count(),1);await p.locator('#close-lists').click();await p.reload();await rows.first().waitFor();await p.locator('[data-song="nativity"] .song-lists').click();assert.equal(await p.locator('#personal-lists input:checked').count(),1);await p.locator('#close-lists').click();
 await p.locator('#library-list').selectOption({label:'Christmas set'});assert.equal(await rows.count(),1);await p.locator('#library-list').selectOption({label:'Practice'});assert.equal(await rows.count(),0);await p.locator('#library-list').selectOption('');
 await p.locator('#manage-lists').click();await p.getByLabel('List name: Practice',{exact:true}).fill('Arranging');await p.getByLabel('Rename Practice',{exact:true}).click();await p.getByLabel('Delete list Arranging',{exact:true}).click();await p.locator('#close-lists').click();assert.equal(await rows.count(),4);
 for(const sort of ['title','number','collection','recent']){await p.locator('#library-sort').selectOption(sort);assert.equal(await rows.count(),4);}await p.locator('#library-sort').selectOption('number');assert.equal(await rows.first().getAttribute('data-song'),'shepherd');
 for(const size of [{width:375,height:812},{width:820,height:1180},{width:1180,height:820},{width:1440,height:1000}]){
  await p.setViewportSize(size);await home();await filter('all');await p.screenshot({path:`test-results/library-${size.width}.png`});assert(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
  for(const id of ['nativity','shepherd','faithful','silent-night']){
   await entry(id).click();await ready();assert(await p.locator('#library').isHidden());assert(await p.locator('#score svg').count());
   await p.locator('#up').click();await ready(1);await p.locator('#songs').click();assert(await p.locator(`[data-song="${id}"] .current-label`).isVisible());await p.locator('#resume-score').click();await ready(1);
   await p.locator('#down').click();await ready();await p.locator('#down').click();await ready(-1);await p.locator('#reset').click();await ready();assert(await p.evaluate(()=>prototype.xml===prototype.original));
   await p.locator('#key').click();assert(await p.locator('#key-dialog').isVisible());await p.locator('#close-dialog').click();await p.locator('#settings').click();await p.locator('input[value="hybrid"]').check();await p.locator('#close-settings').click();await p.locator('#screenful-next').click();
   await p.evaluate(()=>{window.print=()=>window.printInvoked=true;});await p.locator('#print').click();await p.waitForFunction(()=>window.printInvoked);await p.emulateMedia({media:'print'});assert(await p.locator('#library').isHidden());assert(await p.locator('.masthead').isHidden());assert(await p.locator('#print-pages svg').count());await p.emulateMedia({media:'screen'});
   await p.locator('#songs').click();
  }
 }
 await filter('recent');assert.equal(await rows.count(),4);await p.locator('#library-sort').selectOption('recent');assert.equal(await rows.first().getAttribute('data-song'),'silent-night');await p.reload();await rows.first().waitFor();assert(await p.locator('#library').isVisible());await filter('recent');assert.equal(await rows.count(),4);
 await p.evaluate(()=>navigator.serviceWorker.ready);await p.waitForFunction(()=>navigator.serviceWorker.controller);await context.setOffline(true);await p.reload();await rows.first().waitFor();for(const id of ['nativity','shepherd','faithful','silent-night']){await entry(id).click();await ready();await home();}await context.setOffline(false);
 assert.deepEqual(errors,[]);console.log('PASS Library search/filter/sort, persistent favorites/multiple lists/recents, four viewports, all songs, transposition, settings, print and offline reload.');
}finally{await browser.close();}
