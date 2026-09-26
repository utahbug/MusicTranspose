import {createRequire} from 'node:module';import assert from 'node:assert/strict';import fs from 'node:fs';
const {chromium}=createRequire(process.env.PLAYWRIGHT_PACKAGE)('playwright'),b=await chromium.launch({channel:'msedge',headless:true}),rows=[];
try{for(const [width,height] of [[320,568],[390,844],[430,932],[844,390],[820,1180],[1440,1000]]){
 const c=await b.newContext({viewport:{width,height},hasTouch:width<1000}),p=await c.newPage();
 await p.goto(process.env.TEST_URL||'http://127.0.0.1:8768/');await p.locator('.library-row').first().waitFor();await p.evaluate(()=>prototype.loadSong('nativity'));await p.waitForFunction(()=>prototype.ready&&!prototype.busy&&document.querySelector('#score').getAttribute('aria-busy')==='false');
 assert.equal(await p.locator('#score-tap-zones').count(),0);assert.equal(await p.locator('#tap-zones-help').count(),0);
 for(const page of [2,52,182,332]){
  await p.evaluate(page=>{const e=document.querySelector('#score-source');e.textContent='Hymns (1985) \u00b7 '+page;e.dataset.compact='Hymns \u00b7 '+page;},page);
  const geometry=await p.evaluate(()=>{const e=document.querySelector('#score-source'),r=e.getBoundingClientRect(),l=document.querySelector('#show-lyrics').getBoundingClientRect(),o=document.querySelector('#original-key-reference').getBoundingClientRect(),k=document.querySelector('#key').getBoundingClientRect();return {overflow:document.documentElement.scrollWidth>innerWidth,clipped:e.scrollWidth>e.clientWidth,gap:l.left-r.right,lyrics:l.width,originalAbove:o.bottom<=k.top,aligned:Math.abs(o.left-k.left)<1,keyHeight:k.height,footer:document.querySelector('.masthead').getBoundingClientRect().height};});
  assert(!geometry.overflow&&!geometry.clipped);assert(geometry.gap>=8&&geometry.lyrics>=44);assert(geometry.originalAbove&&geometry.aligned&&geometry.keyHeight>=44,JSON.stringify(geometry));assert(geometry.footer<=76);rows.push({width,height,page,...geometry});
 }
 await p.screenshot({path:`test-results/settings-score-${width}.png`});
 for(const how of ['button','escape','outside']){
  await p.locator('#settings').click();const text=await p.locator('#settings-dialog').innerText();assert(!/Diagram|Forthcoming|transition.chord/i.test(text));assert.equal(await p.locator('#show-tap-zones').textContent(),'Tap Zones');
  await p.screenshot({path:`test-results/settings-dialog-${width}.png`});const mode=await p.locator('input[name=navigation]:checked').inputValue();await p.locator('#show-tap-zones').click();assert(await p.locator('#settings-dialog').isHidden());
  assert.deepEqual(await p.locator('.score-tap-grid>span').allTextContents(),['Skip to first page','Skip to last page','Previous page','Next page']);assert.equal(await p.locator('#score-tap-overlay').evaluate(e=>e.style.getPropertyValue('--tap-upper')),'25%');
  assert(await p.locator('.score-tap-grid>span').evaluateAll(es=>es.every(e=>e.scrollHeight<=e.clientHeight&&e.scrollWidth<=e.clientWidth)));
  await p.screenshot({path:`test-results/settings-overlay-${width}.png`});
  if(how==='button')await p.locator('#dismiss-score-taps').click();else if(how==='escape')await p.keyboard.press('Escape');else await p.mouse.click(1,1);
  assert(await p.locator('#score-tap-overlay').isHidden());assert.equal(await p.evaluate(()=>document.activeElement.id),'settings');assert.equal(await p.locator('input[name=navigation]:checked').inputValue(),mode);
 }
 const original=await p.locator('#original-key-reference').textContent(),current=await p.locator('#key-name').textContent();await p.locator('#key').click();await p.locator('#key-dialog [data-shift="2"]').click();await p.waitForFunction(()=>!prototype.busy&&document.querySelector('#score').getAttribute('aria-busy')==='false');assert.equal(await p.locator('#original-key-reference').textContent(),original);assert.notEqual(await p.locator('#key-name').textContent(),current);
 await c.close();console.log('PASS score/settings layout, metadata digits, overlay labels and dismissal',width,height);
}fs.writeFileSync('test-results/settings-help.json',JSON.stringify(rows,null,2));}finally{await b.close();}
