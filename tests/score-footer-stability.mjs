import {createRequire} from 'node:module';
import {execFileSync} from 'node:child_process';
import assert from 'node:assert/strict';
const {chromium}=createRequire(process.env.PLAYWRIGHT_PACKAGE||'C:/Users/kenro/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/package.json')('playwright');
const browser=await chromium.launch({channel:'msedge',headless:true});
const baseline=execFileSync('git',['show','754887f:styles.css'],{encoding:'utf8'});
const ids=['songs','reset','score-size','key','score-tools','settings','show-lyrics','page-position'];
const snapshot=p=>p.evaluate(ids=>Object.fromEntries([...ids,'.toolbar'].map(id=>{const e=id==='.toolbar'?document.querySelector('.masthead .toolbar'):document.getElementById(id),r=e.getBoundingClientRect();return[id,{x:r.x,y:r.y,width:r.width,height:r.height}]})),ids);
async function run(width,old=false){
 const c=await browser.newContext({viewport:{width,height:1000},serviceWorkers:'block'}),p=await c.newPage(),results={};
 if(old)await p.route('**/styles.css',r=>r.fulfill({contentType:'text/css',body:baseline}));
 await c.addInitScript(()=>localStorage.setItem('music-transpose-navigation-v1',JSON.stringify({mode:'pages'})));
 await p.goto(process.env.TEST_URL||'http://127.0.0.1:8780/');await p.locator('[data-home-source=all]').click();await p.locator('[data-song=hhc-1035] .song-entry').click();
 const ready=async()=>{await p.waitForFunction(()=>prototype.ready&&!prototype.busy&&document.querySelector('#score').getAttribute('aria-busy')==='false');await p.waitForTimeout(200);
 // One-page PDFs normally hide Page N. Exercise its occupied layout slot without changing app logic.
 await p.evaluate(()=>{const e=document.querySelector('#page-position');e.hidden=false;e.textContent='Page 12';});};await ready();
 for(const mode of ['pdf','auto','large','pdf']){
  if(Object.keys(results).length){await p.locator('#score-size').click();await p.locator(`#score-size-options [data-size=${mode}]`).click();await ready();}
  const b=await snapshot(p);results[mode]=b;
  if(!old){
   assert(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
   for(const id of ids.slice(0,-1)){if(mode==='pdf'&&['reset','key'].includes(id)){assert.equal(b[id].width,0);assert.equal(await p.locator('#'+id).evaluate(e=>{e.focus();return document.activeElement===e;}),false);continue;}assert(b[id].width>=44&&b[id].height>=44,id+' target');assert(b[id].x+b[id].width<=width,id+' fits');}
   if(width<=600){
    for(const id of ['songs','score-size','score-tools','settings','show-lyrics','page-position','.toolbar'])assert.deepEqual(b[id],results.pdf[id],id+' stays fixed across modes');
    assert.equal(b.songs.x,b['score-tools'].x);assert.equal(b.songs.y,b['score-size'].y);assert.equal(b.settings.y,b['show-lyrics'].y);assert.equal(b['score-tools'].y,b.settings.y);
    assert(b['show-lyrics'].x+44<b['page-position'].x);assert(width-b['page-position'].x-b['page-position'].width<=9);
    await p.screenshot({path:`test-results/stable-footer-${width}-${mode}.png`});
   }
  }
 }
 if(!old&&width<=600){await p.addStyleTag({content:':root{--playing-safe-bottom:34px!important}'});for(const id of ['score-tools','settings','show-lyrics','page-position']){const r=await p.locator('#'+id).boundingBox();assert(r.y+r.height<=966,'safe inset');}const aria=await p.locator('.masthead .toolbar').ariaSnapshot();assert(!aria.includes('Reset to original key'));assert.equal(await p.locator('#key').evaluate(e=>getComputedStyle(e).display),'none');}
 await c.close();return results;
}
try{for(const width of [390,320,820,1440]){const current=await run(width);if(width>600)assert.deepEqual(current,await run(width,true),'larger layouts unchanged');console.log('PASS stable mode geometry, hidden PDF controls, targets, overflow and inset',width,'footer height',current.pdf['.toolbar'].height);}}finally{await browser.close();}
