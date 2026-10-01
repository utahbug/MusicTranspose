import {createRequire} from 'node:module';
import {execFileSync} from 'node:child_process';
import assert from 'node:assert/strict';
const {chromium}=createRequire(process.env.PLAYWRIGHT_PACKAGE||'C:/Users/kenro/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/package.json')('playwright');
const browser=await chromium.launch({channel:'msedge',headless:true});
const baseline=execFileSync('git',['show','8f30330:styles.css'],{encoding:'utf8'});
const ids=['songs','reset','score-size','key','score-tools','settings','show-lyrics','page-position'];
const boxes=p=>p.evaluate(ids=>Object.fromEntries(ids.map(id=>{const r=document.getElementById(id).getBoundingClientRect();return[id,{x:r.x,y:r.y,width:r.width,height:r.height}]})),ids);
async function open(width,old=false){
 const c=await browser.newContext({viewport:{width,height:1000},serviceWorkers:'block'}),p=await c.newPage();
 if(old)await p.route('**/styles.css',r=>r.fulfill({contentType:'text/css',body:baseline}));
 await c.addInitScript(()=>localStorage.setItem('music-transpose-navigation-v1',JSON.stringify({mode:'pages'})));
 await p.goto(process.env.TEST_URL||'http://127.0.0.1:8780/');
 await p.locator('[data-home-source=all]').click();await p.locator('[data-song=hhc-1035] .song-entry').click();
 await p.waitForFunction(()=>prototype.ready&&!prototype.busy&&document.querySelector('#score').getAttribute('aria-busy')==='false');
 if(!old&&width<=600){const pdf=await boxes(p);assert.equal(pdf.reset.width,0);assert.equal(pdf.key.width,0);assert(pdf['score-size'].x>=pdf.songs.x+44);assert(pdf['score-size'].x+pdf['score-size'].width<=width);assert.equal(pdf['score-tools'].y,pdf.settings.y);assert.equal(pdf.settings.y,pdf['show-lyrics'].y);}
 await p.locator('#score-size').click();await p.locator('#score-size-options [data-size=auto]').click();
 await p.waitForFunction(()=>prototype.ready&&!prototype.busy&&!document.body.classList.contains('pdf-score-open'));
 await p.waitForTimeout(200);return{c,p};
}
try{for(const width of [320,390,820,1440]){
 let before;if(width>600){const {c,p}=await open(width,true);before=await boxes(p);await c.close();}
 const {c,p}=await open(width);const errors=[];p.on('pageerror',e=>errors.push(e.message));const b=await boxes(p);
 if(before)assert.deepEqual(b,before,'tablet/desktop score geometry unchanged');
 for(const id of ids.slice(0,-1)){assert(b[id].width>=44&&b[id].height>=44,id+' touch target');assert(b[id].x>=0&&b[id].x+b[id].width<=width,id+' inside viewport');}
 if(width<=600){
  for(const id of ['reset','score-size','key'])assert.equal(b[id].y,b.songs.y,'first row');
  for(const id of ['settings','show-lyrics'])assert.equal(b[id].y,b['score-tools'].y,'second row');
  assert.equal(b.songs.x,b['score-tools'].x);assert.equal(b.reset.x,b.settings.x);assert(b['score-tools'].y>=b.songs.y+44);
  for(const row of [['songs','reset','score-size','key'],['score-tools','settings','show-lyrics','page-position']])for(let i=1;i<row.length;i++)assert(b[row[i]].x>=b[row[i-1]].x+b[row[i-1]].width,'no collision '+row);
  assert(width-b['page-position'].x-b['page-position'].width<=9);
 }
 assert(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
 await p.screenshot({path:`test-results/mobile-toolbar-${width}.png`});
 await p.locator('#score-size').click();await p.locator('#score-size-options').waitFor({state:'visible'});await p.keyboard.press('Escape');
 await p.locator('#score-tools').click();await p.locator('#score-tools-menu').waitFor({state:'visible'});await p.keyboard.press('Escape');
 await p.locator('#show-lyrics').click();await p.locator('#lyrics-view').waitFor({state:'visible'});
 const group=await p.locator('.lyrics-tools').boundingBox(),lib=await p.locator('#songs').boundingBox();assert(Math.abs(group.x+group.width/2-width/2)<.5);assert(lib.x+lib.width<group.x&&lib.x<=12);
 for(const selector of ['.lyrics-tools > button:first-child','#lyrics-font-size','.lyrics-score-toggle']){const r=await p.locator(selector).boundingBox();assert.equal(r.width,44);assert.equal(r.height,44);}
 await p.locator('#lyrics-font-size').click();const menu=await p.locator('#lyrics-font-options').boundingBox(),font=await p.locator('#lyrics-font-size').boundingBox();assert(menu.x>=0&&menu.x+menu.width<=width&&menu.y+menu.height<=font.y);await p.screenshot({path:`test-results/centered-lyrics-${width}.png`});await p.keyboard.press('Escape');
 await p.locator('.lyrics-score-toggle').click();await p.locator('#lyrics-view').waitFor({state:'hidden'});assert.deepEqual(await boxes(p),b,'return preserves score layout');
 // Simulate a bottom inset through the existing shared inset variable.
 await p.addStyleTag({content:':root{--playing-safe-bottom:34px!important}'});
 for(const id of ['score-tools','settings','show-lyrics','page-position']){const r=await p.locator('#'+id).boundingBox();assert(r.y+r.height<=1000-34,id+' safe area');}
 assert.deepEqual(errors,[]);console.log('PASS explicit phone rows / unchanged larger toolbar, centered Lyrics, popups, targets, safe area',width);await c.close();
}}finally{await browser.close();}


