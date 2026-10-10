import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
const {chromium,webkit}=createRequire('C:/Users/kenro/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/package.json')('playwright');
const browser=process.env.LYRICS_WEBKIT?await webkit.launch():await chromium.launch({channel:'msedge'});
const key='music-transpose-lyrics-appearance-v1',names=['Smallest','Small','Medium','Large','Extra Large'],ids=[4,0,1,2,3],sizes=['smallest','small','medium','large','extra-large'];
try{for(const width of [320,390,744,820,1024,1440]){
 const c=await browser.newContext({viewport:{width,height:900},serviceWorkers:'block'}),p=await c.newPage(),errors=[];p.on('pageerror',e=>errors.push(e.message));
 await p.goto('http://127.0.0.1:8780/');await p.waitForFunction(()=>window.prototype?.navigation);await p.evaluate(()=>prototype.openLyrics('hhc-1004'));await p.locator('#lyrics-copy').waitFor();
 const host=p.locator('#lyrics-view'),font=p.locator('#lyrics-font-size'),menu=p.locator('#lyrics-font-options');assert.equal(await host.getAttribute('data-size'),'small');assert(await host.evaluate(e=>e.classList.contains('lyrics-frame-hidden')));
 const footer=()=>p.locator('.lyrics-footer').boundingBox(),before=await footer(),text=await p.locator('.lyrics-body').textContent();
 await p.locator('#lyrics-settings').click();assert.deepEqual(await p.locator('#lyrics-settings-panel').evaluate(e=>[...e.querySelectorAll('#lyrics-font-size,#lyrics-frame,#lyrics-theme')].map(e=>e.id)),['lyrics-font-size','lyrics-frame','lyrics-theme']);
 for(const dark of [false,true]){
  if(dark)await p.locator('#lyrics-theme').click();
  for(let i=0;i<5;i++){
   await font.click();assert.deepEqual(await menu.locator('button').allTextContents(),names);const box=await menu.boundingBox();assert(box.y>=0&&box.y+box.height<=900);
   await menu.getByRole('menuitemradio',{name:names[i],exact:true}).click();assert.equal(await host.getAttribute('data-size'),sizes[i]);assert.equal(await p.evaluate(key=>JSON.parse(localStorage.getItem(key)).size,key),ids[i]);
   assert.equal(await p.locator('.lyric-lines').first().evaluate(e=>getComputedStyle(e).fontSize),[17,19,width<=600?22:24,30,36][i]+'px');assert.equal(await p.locator('.lyrics-body').textContent(),text);
   await p.keyboard.press('Escape');const choruses=p.locator('.lyrics-chorus');assert.equal(await choruses.count(),3);
   await choruses.nth(0).locator('summary').click();assert(await choruses.nth(0).evaluate(e=>e.open));assert(!(await choruses.nth(1).evaluate(e=>e.open)));
   await choruses.nth(1).locator('summary').click();await choruses.nth(0).locator('summary').click();assert(await choruses.nth(1).evaluate(e=>e.open));await choruses.nth(1).locator('summary').click();
   assert(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));assert.deepEqual(await footer(),before);
   assert(await p.locator('.lyric-lines').first().evaluate(e=>parseFloat(getComputedStyle(e).lineHeight)/parseFloat(getComputedStyle(e).fontSize)>=1.6));
   await p.locator('#lyrics-settings').click();
  }
 }
 await font.click();await menu.getByRole('menuitemradio',{name:'Smallest',exact:true}).click();await p.keyboard.press('Escape');
 await p.evaluate(()=>prototype.openLyrics('hhc-1003'));await p.locator('#lyrics-copy').waitFor();assert.equal(await host.getAttribute('data-size'),'smallest');await p.reload();await p.locator('#lyrics-copy').waitFor();assert.equal(await host.getAttribute('data-size'),'smallest');
 // Legacy values retain their exact meanings after reload; no preference migration.
 for(let size=0;size<4;size++){
  await p.evaluate(({key,size})=>localStorage.setItem(key,JSON.stringify({size,dark:false,frame:false})),{key,size});await p.reload();await p.locator('#lyrics-copy').waitFor();assert.equal(await host.getAttribute('data-size'),['small','medium','large','extra-large'][size]);assert.equal(await p.locator('.lyric-lines').first().evaluate(e=>getComputedStyle(e).fontSize),[19,width<=600?22:24,30,36][size]+'px');
 }
 assert.deepEqual(errors,[]);console.log('PASS five sizes, exact defaults/legacy values, Chorus independence, themes, geometry and persistence',width);await c.close();
}}finally{await browser.close();}
