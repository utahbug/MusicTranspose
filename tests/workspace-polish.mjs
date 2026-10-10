import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
const {chromium,webkit}=createRequire('C:/Users/kenro/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/package.json')('playwright');
const browser=process.env.POLISH_WEBKIT?await webkit.launch():await chromium.launch({channel:'msedge'});
try {for(const width of [390,820,1440]){
 const c=await browser.newContext({viewport:{width,height:1000},serviceWorkers:'block'}),p=await c.newPage(),errors=[];p.on('pageerror',e=>errors.push(e.message));
 await c.addInitScript(()=>{if(localStorage.getItem('polish-seeded'))return;localStorage.setItem('polish-seeded','1');localStorage.setItem('music-transpose-library-v1',JSON.stringify({orderingVersion:1,favorites:[],groups:Array.from({length:30},(_,i)=>({id:'polish-'+i,name:'List '+i,description:'',songs:['nativity']}))}));});
 await p.goto('http://127.0.0.1:8780/');await p.waitForFunction(()=>window.prototype?.navigation);
 const fits=async()=>assert(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
 await p.locator('[data-home-source=all]').click();
 assert.equal((await p.locator('#library .workspace-banner').innerText()).trim(),'MusicTranspose');
 await p.locator('#library-source').click();
 assert.deepEqual(await p.locator('#library-source-menu > *').evaluateAll(es=>es.map(e=>e.tagName==='HR'?'divider':e.textContent)),['All Sources','Hymns','Children’s Songs','Hymns for Home and Church','divider','Imported Files','My Lists']);
 await p.locator('#library-source-menu [data-source=my-music]').click();assert.equal(await p.locator('#library-source-label').innerText(),'Imported Files');
 const source=await p.locator('#library-source').boundingBox(),sort=await p.locator('.sort-choice').boundingBox(),gap=sort.x-source.x-source.width;
 if(width===820)assert(gap>=18&&gap<=24,`tablet gap ${gap}`);await fits();
 await p.locator('#library-source').click();await p.keyboard.press('End');assert.equal(await p.evaluate(()=>document.activeElement.textContent),'My Lists');await p.keyboard.press('Enter');await p.locator('#lists-view').waitFor({state:'visible'});
 assert.equal(await p.locator('[data-list]').count(),30);
 await p.locator('[data-list="polish-0"] .list-overview-entry').click();await p.locator('[data-list="polish-0"] .list-actions-toggle').click();
 const indents=await p.locator('#list-command-menu').evaluate(e=>{const h=e.querySelector('.menu-section-label'),buttons=[...e.querySelectorAll('button')].filter(b=>!b.hidden);return buttons.map(b=>({delta:b.getBoundingClientRect().left+parseFloat(getComputedStyle(b).paddingLeft)-h.getBoundingClientRect().left-parseFloat(getComputedStyle(h).paddingLeft),height:b.getBoundingClientRect().height}));});
 assert(indents.every(x=>x.delta>=12&&x.delta<=16&&x.height>=44),JSON.stringify(indents));await p.keyboard.press('Escape');
 const saved=await p.evaluate(()=>localStorage.getItem('music-transpose-library-v1'));
 for(const [name,open,back] of [['lists',null,'lists-library'],['files','home-footer-files','files-library'],['texts','home-text','texts-home']]){
  if(open)await p.locator('#'+open).click();const button=p.locator('#'+name+'-theme'),r=await button.boundingBox(),footer=await button.locator('..').boundingBox();
  assert(r.width>=44&&r.height>=44&&r.x+r.width<=width&&footer.x+footer.width-r.x-r.width<=24,JSON.stringify({name,r,footer}));assert.equal(await button.locator('.pdf-mobile-theme-swatch').count(),1);
  if(name==='texts')assert.equal(await p.locator('#texts-context').innerText(),'Create program items, cues, teaching notes, and other activities');
  await button.focus();await p.keyboard.press('Enter');assert.equal(await p.locator('html').getAttribute('data-library-theme'),'dark');await fits();
  await p.reload();await p.waitForFunction(()=>window.prototype?.navigation);assert.equal(await p.locator('html').getAttribute('data-library-theme'),'dark');
  await p.locator('#'+name+'-theme').click();assert.equal(await p.locator('html').getAttribute('data-library-theme'),'light');await fits();await p.locator('#'+back).click();
 }
 assert.equal(await p.evaluate(()=>localStorage.getItem('music-transpose-library-v1')),saved);assert.deepEqual(errors,[]);await c.close();console.log('PASS',width,'compact menu, destinations, spacing, theme keyboard/persistence, Notes, indentation, no overflow or List mutations');
}}finally{await browser.close();}


