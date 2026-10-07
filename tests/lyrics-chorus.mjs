import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createRequire} from 'node:module';
const data=JSON.parse(fs.readFileSync(new URL('../assets/lyrics.json',import.meta.url))).songs;
const id='song-c9add785-5429-47ec-bf7d-afc5581a87d6',song=data.find(s=>s.id===id);
assert.deepEqual(song.verses.map(v=>v.number),['1','2','3','4']);assert.equal(song.refrains.length,1);assert(song.refrains[0].text.startsWith('Out in the desert'));
assert(song.verses.every(v=>!v.text.includes('Out in the desert they wander')&&!v.text.includes('we’ll hasten')));assert(song.alternateLyrics.some(v=>v.text==='we’ll hasten,'));
const {chromium}=createRequire(process.env.PLAYWRIGHT_PACKAGE||'C:/Users/kenro/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/package.json')('playwright');
const browser=await chromium.launch({channel:'msedge'});
try{for(const width of (process.env.TEST_WIDTH?[Number(process.env.TEST_WIDTH)]:[390,820,1440])){
 const c=await browser.newContext({viewport:{width,height:1000},hasTouch:width<1000,serviceWorkers:'block'}),p=await c.newPage(),errors=[];p.on('pageerror',e=>errors.push(e.message));
 await c.addInitScript(id=>localStorage.setItem('music-transpose-library-v1',JSON.stringify({orderingVersion:1,favorites:[id],groups:[{id:'chorus-test',name:'Chorus test',songs:[id,'silent-night']}]})),id);
 await p.goto(process.env.TEST_URL||'http://127.0.0.1:8780/');await p.waitForFunction(()=>window.prototype?.navigation);await p.locator('[data-home-source=all]').click();
 const ready=()=>p.waitForFunction(()=>prototype.ready&&!prototype.busy&&!prototype.loading);
 for(const [target,count] of [[id,4],['hhc-1005',3],['cs-2',4],['silent-night',0]]){
  await p.locator(`[data-song="${target}"] .song-entry`).click();await ready();await p.locator('#show-lyrics').click();await p.locator('#lyrics-view').waitFor({state:'visible'});
  const details=p.locator('.lyrics-chorus');if(target===id)await p.screenshot({path:`test-results/chorus-collapsed-${width}.png`});assert.equal(await details.count(),count);assert.equal(await p.locator('.lyrics-chorus[open]').count(),0);
  if(count){assert.equal(await details.first().locator('summary').textContent(),'Chorus');assert((await details.first().locator('summary').boundingBox()).height>=44);
   await details.first().locator('summary')[width<1000?'tap':'click']();assert.equal(await p.locator('.lyrics-chorus[open]').count(),1);await details.nth(1).locator('summary').click();assert.equal(await p.locator('.lyrics-chorus[open]').count(),2);await details.first().locator('summary').click();assert.equal(await p.locator('.lyrics-chorus[open]').count(),1);
   await details.first().locator('summary').focus();await p.keyboard.press('Enter');assert.equal(await p.locator('.lyrics-chorus[open]').count(),2);
  }
  assert(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
  if(target===id){await p.locator('#lyrics-font-size').click();await p.getByRole('menuitemradio',{name:'Large',exact:true}).click();assert.equal(await p.locator('#lyrics-view').getAttribute('data-size'),'large');await p.screenshot({path:`test-results/chorus-${width}.png`});
   await p.getByRole('button',{name:'View Score',exact:true}).click();await ready();assert.equal(await p.evaluate(()=>prototype.song),id);
   if(width===820)for(const mode of ['pdf','large','auto']){
    await p.locator('#score-size').click();const option=p.locator('#score-size-options [data-size="'+mode+'"]');if(await option.isHidden()||await option.isDisabled()){await p.keyboard.press('Escape');continue;}await option.click();await ready();
    const before=await p.locator('#score-size').getAttribute('data-view');await p.locator('#show-lyrics').click();await p.locator('#lyrics-view').waitFor({state:'visible'});await p.getByRole('button',{name:'View Score',exact:true}).click();await ready();assert.equal(await p.locator('#score-size').getAttribute('data-view'),before);console.log('PASS Lyrics round trip for score mode',mode);assert.equal(await p.evaluate(()=>prototype.song),id);
   }
   const context=await p.evaluate(()=>prototype.navigation.ids);
   await p.locator('#show-lyrics').click();await p.locator('#lyrics-view').waitFor({state:'visible'});assert.equal(await p.locator('#lyrics-view').getAttribute('data-size'),'large');assert.deepEqual(await p.evaluate(()=>prototype.navigation.ids),context);
  }
  await p.locator('.lyrics-header-home').click();await p.locator('#library').waitFor({state:'visible'});
 }
 // Preserve intentional Library contexts across Lyrics and Score round trips.
 for(const scope of ['list:chorus-test','favorites']){
  if(scope==='favorites')await p.locator('#view-favorites').evaluate(e=>e.click());else{await p.locator('#library-source').click();await p.locator(`[data-source="${scope}"]`).click();}
  const before=await p.locator('#library-results [data-song]').evaluateAll(es=>es.map(e=>e.dataset.song));
  await p.locator(`[data-song="${id}"] .song-entry`).click();await ready();await p.locator('#show-lyrics').click();await p.locator('#lyrics-view').waitFor({state:'visible'});await p.getByRole('button',{name:'View Score',exact:true}).click();await ready();await p.locator('#show-lyrics').click();await p.locator('#lyrics-view').waitFor({state:'visible'});await p.locator('.lyrics-header-home').click();await p.locator('#library').waitFor({state:'visible'});assert.deepEqual(await p.locator('#library-results [data-song]').evaluateAll(es=>es.map(e=>e.dataset.song)),before);
 }
 assert.deepEqual(errors,[]);console.log('PASS chorus structure, independent keyboard/touch disclosures, font, Score/Lyrics and List/Favorites return',width);await c.close();
}}finally{await browser.close();}
