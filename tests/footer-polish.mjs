import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
const {chromium}=createRequire('C:/Users/kenro/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/package.json')('playwright');
const browser=await chromium.launch({channel:'msedge'});
try{for(const [width,height] of [[390,844],[744,1133],[768,1024],[820,1180],[900,900],[1024,768],[1440,1000]]){
 const context=await browser.newContext({viewport:{width,height},...(width===390?{userAgent:'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 Version/18.0 Mobile/15E148 Safari/604.1'}:{})});
 const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://127.0.0.1:8780/');await page.waitForFunction(()=>window.prototype?.navigation);
 await page.locator('#home-keyboard').click();await page.locator('#keyChangeTab').click();
 assert.equal(await page.locator('.key-change-reminders p').count(),2);
 assert(await page.locator('.key-change-reminders').isVisible());
 assert.equal(await page.locator('.key-change-reminders').evaluate(e=>!!e.closest('details')),false);
 assert(!await page.locator('#keyChangeGuide').evaluate(e=>e.textContent.includes('One semitone equals one half step.')||e.textContent.includes('Key change tips')));
 for(const dark of [false,true]){
  if(dark){await page.locator('#keyboard-settings').click();await page.locator('#keyboard-theme').click();await page.keyboard.press('Escape');}
  assert.match(await page.locator('#keyChangeTab').evaluate(e=>getComputedStyle(e).backgroundImage),/linear-gradient/);
  assert.equal(await page.locator('#scaleGuideTab').evaluate(e=>getComputedStyle(e).backgroundImage),'none');
 }
 await page.locator('#keyboard-home').click();await page.evaluate(()=>prototype.loadSong('nativity'));
 await page.waitForFunction(()=>prototype.ready&&!prototype.busy&&document.getElementById('score').getAttribute('aria-busy')==='false');
 const geometry=()=>page.evaluate(()=>({paper:document.querySelector('.score-paper').getBoundingClientRect().toJSON(),score:document.querySelector('#score').getBoundingClientRect().toJSON(),footer:document.querySelector('.masthead').getBoundingClientRect().height}));
 assert.equal(await page.locator('#mt-icon-blue-teal').getAttribute('gradientUnits'),'userSpaceOnUse');
 assert.match(await page.locator('#score-size svg.ui-icon').evaluate(e=>getComputedStyle(e).stroke),/mt-icon-blue-teal-dark/);
 assert.match(await page.locator('#show-lyrics svg').evaluate(e=>getComputedStyle(e).stroke),/mt-icon-blue-teal-dark/);
 const initial=await geometry();assert.equal(initial.footer,54);assert.equal(initial.paper.width,Math.min(width-(width<=600?12:width<=850?24:48),1140));
 // Conditional visibility isolates layout from score availability/transposition behavior.
 for(const reset of [false,true])for(const lyrics of [false,true]){
  await page.evaluate(({reset,lyrics})=>{document.getElementById('reset').hidden=!reset;document.getElementById('reset').disabled=false;document.getElementById('show-lyrics').hidden=!lyrics;},{reset,lyrics});
  const controls=await page.locator('.toolbar button:visible').evaluateAll(es=>es.map(e=>({id:e.id,...e.getBoundingClientRect().toJSON()})));
  assert(controls.every(r=>r.width>=44&&r.height>=44&&r.x>=0&&r.right<=width&&r.bottom<=height),'visible 44px controls inside viewport');
  const tools=await page.locator('#score-tools').boundingBox();
  assert(Math.abs(tools.x+tools.width-(width-(width===390?4:12)))<1,'Tools anchored at right safe edge');
  if(width===390){assert(await page.locator('#score-hide-controls').isHidden());}
  else{
   const focus=await page.locator('#score-hide-controls').boundingBox();assert.equal(focus.width,44);assert.equal(focus.height,44);assert(Math.abs(focus.x+22-width/2)<.5);
   const left=await page.locator('.playing-controls').boundingBox(),right=await page.locator('.utility-controls').boundingBox();assert(left.x+left.width<=focus.x&&right.x>=focus.x+44);
   const pill=await page.locator('#score-hide-controls').evaluate(e=>{const s=getComputedStyle(e,'::before');return parseFloat(s.left)+parseFloat(s.width)/2;});assert.equal(pill,22,'visible pill centered in target');
   await page.locator('#score-hide-controls').click();const show=await page.locator('#score-show-controls').boundingBox();assert.equal(show.x,focus.x);assert.equal(show.y,focus.y);await page.locator('#score-show-controls').click();
  }
  assert.deepEqual(await geometry(),initial,'conditional controls and Focus round-trip retain score geometry');
 }
 await page.screenshot({path:`test-results/footer-polish-${width}.png`});
 await page.locator('#score-tools').click();assert(await page.locator('#score-tools-menu').isVisible());assert.equal(await page.locator('#score-tools svg').evaluate(e=>getComputedStyle(e).stroke),'rgb(255, 255, 255)');await page.keyboard.press('Escape');
 const tap=await page.locator('#show-tap-zones').boundingBox();assert(tap.width>=44&&tap.height>=44);await page.locator('#show-tap-zones').click();assert(await page.locator('#score-tap-overlay').isVisible());await page.keyboard.press('Escape');assert.equal(await page.evaluate(()=>document.activeElement.id),'show-tap-zones');
 await page.locator('#songs').click();assert(await page.locator('#library-home').isVisible());
 assert.deepEqual(errors,[]);console.log('PASS tabs/reminders, footer zones, all Reset/Lyrics combinations, Focus anchors, unchanged geometry',width);await context.close();
}}finally{await browser.close();}
