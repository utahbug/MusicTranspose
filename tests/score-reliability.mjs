import {createRequire} from 'node:module';import fs from 'node:fs';import assert from 'node:assert/strict';
const require=createRequire(process.env.PLAYWRIGHT_PACKAGE),{chromium}=require('playwright');
const browser=await chromium.launch({channel:'msedge',headless:true}),base=process.env.TEST_URL||'http://127.0.0.1:8768/';
const ready=async p=>{await p.waitForFunction(()=>window.prototype?.ready&&!prototype.busy&&document.querySelector('#score').getAttribute('aria-busy')==='false');await p.waitForTimeout(200);};
const mode=async(p,value)=>{await p.locator('#settings').click();await p.locator(`input[name=navigation][value=${value}]`).check();await p.locator('#close-settings').click();await p.waitForTimeout(100);};
const rows=[];
try{
 const sizes=process.env.RELIABILITY_SMOKE?[[390,844,true]]:[[320,568,true],[390,844,true],[430,932,true],[844,390,true],[820,1180,true],[1440,1000,false]];
 for(const [width,height,touch] of sizes){
  const c=await browser.newContext({viewport:{width,height},hasTouch:touch}),p=await c.newPage(),errors=[];p.on('pageerror',e=>errors.push(e.message));
  await p.goto(base);await p.locator('.library-row').first().waitFor();await p.evaluate(id=>prototype.loadSong(id),width===1440?'cs-110':'nativity');await ready(p);await mode(p,'pages');
  const pos=()=>p.locator('#page-position').textContent();
  const geom=()=>p.evaluate(async()=> (await import('./score-taps.js')).scoreTapGeometry());
  const tap=async(left,upper)=>{const r=await geom(),x=r.left+r.width*(left?.2:.8),y=r.top+r.height*(upper?r.upper*.5:.65);if(touch)await p.touchscreen.tap(x,y);else await p.mouse.click(x,y);await p.waitForTimeout(90);};
  const count=await p.locator('.mxl-page-frame').count();assert(count>1);
  for(let i=0;i<4;i++){await tap(false,false);assert.equal(await pos(),`2 / ${count}`);await tap(true,false);assert.equal(await pos(),`1 / ${count}`);await tap(false,true);assert.equal(await pos(),`${count} / ${count}`);await tap(true,true);assert.equal(await pos(),`1 / ${count}`);}
  // The 35% point belongs to Next, not Last (the old half-height boundary).
  {const r=await geom();await p.mouse.click(r.left+r.width*.8,r.top+r.height*.35);assert.equal(await pos(),`2 / ${count}`);await tap(true,true);}
  // A synthetic compatibility click never navigates. Real touch/mouse taps above do.
  await p.locator('#score').dispatchEvent('click',{clientX:250,clientY:250});assert.equal(await pos(),`1 / ${count}`);
  await p.locator('#score-tap-zones').click();const r=await geom(),box=await p.locator('#score-tap-overlay').boundingBox(),cells=await p.locator('.score-tap-grid>span').evaluateAll(es=>es.map(e=>{const r=e.getBoundingClientRect();return {x:r.x,y:r.y,width:r.width,height:r.height};}));
  assert(Math.abs(box.y-r.top)<1&&Math.abs(box.height-r.height)<1);assert(Math.abs(cells[0].height/r.height-.25)<.01);
  await p.screenshot({path:`test-results/score-reliability-overlay-${width}.png`});await p.locator('#dismiss-score-taps').click();assert.equal(await pos(),`1 / ${count}`);await p.waitForTimeout(400);assert.equal(await pos(),`1 / ${count}`);
  await tap(false,false);assert.equal(await pos(),`2 / ${count}`);
  for(const [open,close] of [['#settings','#close-settings'],['#key','#close-dialog']]){
   await p.locator(open).click();assert.equal(await pos(),`2 / ${count}`);await p.keyboard.press('Escape');assert.equal(await pos(),`2 / ${count}`);
  }
  await p.locator('#score-size').click();assert.equal(await p.locator('[data-size=large]').textContent(),'Lead');await p.locator('#score-size').click();assert.equal(await pos(),`2 / ${count}`);
  // Drag, long press, multitouch, cancel, controls opening during a pointer and stale releases.
  const rejected=await p.evaluate(async()=>{
   const {scoreTapGeometry}=await import('./score-taps.js'),r=scoreTapGeometry(),host=document.querySelector('#score'),x=r.left+r.width*.8,y=r.top+r.height*.65;
   const ev=(type,props={},target=host)=>target.dispatchEvent(new PointerEvent(type,{bubbles:true,pointerId:91,isPrimary:true,button:0,clientX:x,clientY:y,...props}));
   const before=document.querySelector('#page-position').textContent;
   ev('pointerdown');await new Promise(r=>setTimeout(r,650));ev('pointerup');
   ev('pointerdown');ev('pointermove',{clientX:x-30});ev('pointerup');
   ev('pointerdown');ev('pointerdown',{pointerId:92,isPrimary:false});ev('pointerup');
   ev('pointerdown');ev('pointercancel');ev('pointerup');
   ev('pointerdown');document.querySelector('#settings-dialog').showModal();await Promise.resolve();document.querySelector('#settings-dialog').close();ev('pointerup');
   ev('pointerup');
   for(const html of ['<button>Button</button>','<a href="#">Link</a>','<input type="range">','<label>Label<input type="checkbox"></label>','<span role="menuitem">Menu</span>','<span role="link">Link</span>','<span contenteditable="true">Edit</span>']){
    const fixture=document.createElement('div');fixture.innerHTML=html;host.append(fixture);ev('pointerdown',{},fixture.firstChild);ev('pointerup',{},fixture.firstChild);fixture.remove();
   }
   return {before,after:document.querySelector('#page-position').textContent};
  });assert.equal(rejected.before,rejected.after);
  // Playback's interactive control cannot turn the page.
  const play=p.locator('.score-title-block .song-playback');if(await play.count()){const before=await pos();await play.click();await p.waitForTimeout(180);assert.equal(await pos(),before);await play.click();}
  const orig=await p.locator('#original-key-reference').textContent();await p.evaluate(()=>prototype.changeKey(2));await ready(p);assert.equal(await p.locator('#original-key-reference').textContent(),orig);assert.notEqual(await p.locator('#key-name').textContent(),orig.replace('Original: ',''));
  const layout=await p.evaluate(()=>{const rect=id=>{const e=document.getElementById(id),r=e.getBoundingClientRect();return {x:r.x,y:r.y,w:r.width,h:r.height,visible:!!e.getClientRects().length};};return {overflow:document.documentElement.scrollWidth>innerWidth,source:rect('score-source'),tap:rect('score-tap-zones'),lyrics:rect('show-lyrics'),key:rect('key'),original:rect('original-key-reference'),header:document.querySelector('.score-heading').getBoundingClientRect().height};});
  assert(!layout.overflow);assert(layout.tap.visible&&layout.tap.w>=44&&layout.tap.h>=44);assert(layout.lyrics.w>=44);assert(layout.key.h>=44);assert(layout.source.x+layout.source.w<=layout.tap.x+.5&&layout.tap.x+layout.tap.w<=layout.lyrics.x+.5);assert(layout.original.y>height-130);
  await p.screenshot({path:`test-results/score-reliability-${width}.png`});
  if(width===1440){const before=await pos();await p.locator('#score-tap-zones').click();await p.locator('#score-tap-overlay').waitFor({state:'hidden',timeout:10000});assert.equal(await pos(),before);}
  // Lyrics roundtrip and same data when changing songs. Header playback control must not turn pages.
  await p.locator('#show-lyrics').click();await p.locator('#lyrics-view').waitFor({state:'visible'});await p.locator('.lyrics-score-toggle').click();await ready(p);
  for(const id of ['shepherd','song-3f9eca82-5b22-4785-8ac8-9e7c8c34070b','cs-16','cs-164']){await p.evaluate(id=>prototype.loadSong(id),id);await ready(p);const expected=await p.evaluate(async id=>{const {songs}=await import('./songs.js');const s=songs.find(s=>s.id===id);return s.collection+(s.page?' · '+s.page:'');},id);assert.equal(await p.locator('#score-source').textContent(),expected);await tap(false,true);await tap(true,true);}
  await p.locator('#settings').click();await p.locator('#show-tap-zones').click();assert.equal(await p.locator('#tap-zones-help').evaluate(e=>e.style.getPropertyValue('--tap-upper')),'25%');await p.locator('#close-tap-zones').click();await p.locator('#close-settings').click();
  await p.locator('#score-size').click();await p.locator('[data-size=large]').click();await ready(p);assert.equal(await p.locator('#score-size').getAttribute('data-size'),'large');await tap(false,false);await tap(true,true);await p.locator('#score-size').click();await p.locator('[data-size=auto]').click();await ready(p);
  await p.evaluate(()=>prototype.loadSong('choose-to-serve-the-lord'));await ready(p);await mode(p,'pages');const pdfCount=await p.locator('.pdf-page-frame').count();await tap(false,false);assert.equal(await pos(),`2 / ${pdfCount}`);await tap(false,true);assert.equal(await pos(),`${pdfCount} / ${pdfCount}`);await tap(true,true);assert.equal(await pos(),`1 / ${pdfCount}`);
  await p.locator('#score-tap-zones').click();assert.equal(await p.locator('#score-tap-overlay').evaluate(e=>e.style.getPropertyValue('--tap-upper')),'50%');await p.keyboard.press('Escape');
  await p.evaluate(()=>prototype.loadSong('cs-110'));await ready(p);await mode(p,'continuous');await tap(false,false);assert(await p.evaluate(()=>scrollY)>0);await tap(true,true);assert.equal(await p.evaluate(()=>scrollY),0);
  if(width===390){await p.evaluate(()=>navigator.serviceWorker.ready);await p.waitForFunction(()=>navigator.serviceWorker.controller);await c.setOffline(true);await p.reload();await ready(p);await mode(p,'pages');await p.locator('#score-tap-zones').click();await p.keyboard.press('Escape');await tap(false,false);assert((await pos()).startsWith('2 /'));}
  assert.deepEqual(errors,[]);rows.push({width,height,touch,count,layout});await c.close();console.log('PASS navigation/metadata/overlay/controls/PDF/Lyrics',width,height,touch);
 }
 fs.writeFileSync('test-results/score-reliability.json',JSON.stringify(rows,null,2));
}finally{await browser.close();}

