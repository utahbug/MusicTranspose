import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
const engines=createRequire('C:/Users/kenro/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/package.json')('playwright');
const base=process.env.TEST_URL||'http://127.0.0.1:8780/';
for(const engine of ['chromium','webkit']){
 const browser=await engines[engine].launch(engine==='chromium'?{channel:'msedge'}:{});
 try{for(const [width,height] of [[320,568],[375,812],[744,1133],[1194,834],[1440,1000]]){
  const context=await browser.newContext({viewport:{width,height},serviceWorkers:'block'}),page=await context.newPage();
  await context.addInitScript(()=>{
   if(localStorage.getItem('return-test'))return;
   localStorage.setItem('return-test','1');
   localStorage.setItem('music-transpose-library-v1',JSON.stringify({orderingVersion:1,favorites:['silent-night'],groups:Array.from({length:16},(_,i)=>({id:'list-'+i,name:'Program '+i,songs:['silent-night','nativity'],songView:i===8?'lyrics':'score'}))}));
  });
  await page.goto(base);await page.waitForFunction(()=>window.prototype?.navigation);
  await page.locator('#home-footer-lists').click();
  const personal=()=>page.evaluate(()=>{const s=JSON.parse(localStorage.getItem('music-transpose-library-v1'));return {favorites:s.favorites,groups:s.groups.map(({id,name,songs,songView})=>({id,name,songs,songView}))};});
  const saved=await personal();
  const card=id=>page.locator(`[data-list="list-${id}"]`);
  const ready=async lyrics=>page.waitForFunction(lyrics=>!prototype.loading&&!prototype.busy&&(lyrics?document.body.classList.contains('lyrics-open'):prototype.ready&&!document.body.classList.contains('lyrics-open')),lyrics);
  for(const [id,song,flow] of [[7,'silent-night','score'],[7,'nativity','switch'],[8,'silent-night','lyrics'],[8,'nativity','back']]){
   if(await card(id).locator('.list-overview-entry').getAttribute('aria-expanded')!=='true')await card(id).locator('.list-overview-entry').click();
   const entry=card(id).locator(`[data-song="${song}"] .workspace-song-entry`);
   await entry.scrollIntoViewIfNeeded();await entry.focus();
   const before=await page.evaluate(()=>scrollY);
   await entry.click();await ready(id===8);
   if(flow==='switch'){await page.locator('#show-lyrics').click();await ready(true);}
   if(flow==='back')await page.goBack();else await page.locator('#songs').click();
   await page.locator('#lists-view').waitFor({state:'visible'});
   assert.equal(await card(id).locator('.list-overview-entry').getAttribute('aria-expanded'),'true');
   assert.equal(await page.locator('.list-overview-entry[aria-expanded=true]').count(),1);
   assert(Math.abs(await page.evaluate(()=>scrollY)-before)<3,`${engine} ${width}: scroll restored`);
   if(flow!=='back')assert(await entry.evaluate(e=>e===document.activeElement),'song focus restored');
   const box=await entry.boundingBox(),footer=await page.locator('#lists-return').boundingBox();
   assert(box.y>=0&&box.y+box.height<=footer.y+1,'selected song visible above footer');
  }
  await card(8).locator('.list-overview-entry').click();
  assert.equal(await page.locator('.list-overview-entry[aria-expanded=true]').count(),0);
  assert.deepEqual(await personal(),saved,'memberships, order, names, preferences and favorites unchanged');
  // Delete the originating List, then revisit its Score history entry.
  await card(7).locator('.list-overview-entry').click();
  await card(7).locator('[data-song="silent-night"] .workspace-song-entry').click();await ready(false);
  await page.locator('#songs').click();await page.locator('#lists-view').waitFor({state:'visible'});
  await card(7).locator('.edit-list').click();page.once('dialog',d=>d.accept());await page.locator('#list-name-delete').click();
  await page.goBack();await ready(false);await page.locator('#songs').click();await page.locator('#lists-view').waitFor({state:'visible'});
  assert.equal(await card(7).count(),0,'deleted List stays deleted');
  await page.locator('#lists-library').click();await page.locator('#home-footer-lists').click();
  assert.equal(await page.locator('.list-overview-entry[aria-expanded=true]').count(),0,'independent Lists opening unchanged');
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
  console.log('PASS',engine,width,'Score/Lyrics return, consecutive songs, scroll/focus, Back, collapse, deleted origin and independent Lists');
  await context.close();
 }}finally{await browser.close();}
}
