import {createRequire} from 'node:module';import assert from 'node:assert/strict';
const engines=createRequire(process.env.PLAYWRIGHT_PACKAGE)('playwright'),engine=process.env.WEBKIT?'webkit':'chromium',b=await engines[engine].launch(engine==='chromium'?{channel:'msedge',headless:true}:{});
try{for(const [width,height] of [[390,844],[820,1180],[1180,820],[1440,800]]){
 if(process.env.POSITION_WIDTH&&width!==Number(process.env.POSITION_WIDTH))continue;
 const c=await b.newContext({viewport:{width,height},hasTouch:width<1440,serviceWorkers:'block'}),p=await c.newPage();await c.addInitScript(()=>localStorage.setItem('music-transpose-navigation-v1',JSON.stringify({mode:'pages'})));
 const ready=async()=>{await p.waitForFunction(()=>prototype.ready&&!prototype.busy&&document.querySelector('#score').getAttribute('aria-busy')==='false');await p.waitForTimeout(200);};
 await p.goto(process.env.TEST_URL||'http://127.0.0.1:8780/');await p.locator('.library-row').first().waitFor();await p.evaluate(()=>window.positionNode=document.querySelector('#page-position'));
 const counter=p.locator('#page-position'),value=async()=>(await counter.getAttribute('aria-label')).replace('Page ','').replace(' of ',' / ');
 const tap=async(x,y)=>{if(width<1440)await p.touchscreen.tap(x,y);else await p.mouse.click(x,y);};
 const zone=async(x,y)=>{const r=await p.evaluate(async()=>(await import('./score-taps.js')).scoreTapGeometry());await tap(r.left+r.width*x,r.top+r.height*y);};
 const feedback=p.locator('#page-turn-feedback');
 const check=async()=>{
  assert.equal(await counter.count(),1);assert(await counter.isVisible());
  assert(await counter.evaluate(e=>e===window.positionNode&&e.parentElement.classList.contains('toolbar')));
  assert.equal(await p.locator('#score #page-position').count(),0);
  const r=await counter.boundingBox(),footer=await p.locator('.masthead').boundingBox();
  assert(r.x+r.width<=width&&r.y>=footer.y&&r.y+r.height<=height);
  assert.equal(await counter.evaluate(e=>getComputedStyle(e).pointerEvents),'none');
  assert.equal(await feedback.evaluate(e=>getComputedStyle(e).pointerEvents),'none');
  assert.equal(await counter.evaluate(e=>getComputedStyle(e).fontWeight),'400');
  const [page,total]=(await value()).split('/').map(Number);assert.equal(await counter.textContent(),`Page ${page}`);
  assert.equal(await counter.getAttribute('aria-label'),`Page ${page} of ${total}`);
  const controls=[];for(const id of ['songs','reset','score-size','key','score-tools','settings','show-lyrics']){const e=p.locator('#'+id);if(await e.isVisible())controls.push(await e.boundingBox());}
  for(const box of controls){assert(box.x>=0&&box.x+box.width<=width+.5);assert(box.x+box.width<=r.x||box.x>=r.x+r.width||box.y+box.height<=r.y||box.y>=r.y+r.height,'label clear of controls');}
  for(let i=0;i<controls.length;i++)for(let j=i+1;j<controls.length;j++){const a=controls[i],b=controls[j];assert(a.x+a.width<=b.x+.5||b.x+b.width<=a.x+.5||a.y+a.height<=b.y+.5||b.y+b.height<=a.y+.5,'controls do not overlap');}
  if(width>600){const group=await p.locator('.utility-controls').boundingBox();assert(Math.abs(group.x+group.width/2-width/2)<1,'main controls centered');}
  assert(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));return total;
 };
 const confirm=async expected=>{assert.equal(await feedback.textContent(),expected);assert(await feedback.isVisible());assert(await feedback.evaluate(e=>e.classList.contains('visible')));};
 const nav=async mode=>{await p.locator('#settings').click();await p.locator(`input[name=navigation][value=${mode}]`).check();await p.locator('#close-settings').click();await p.waitForTimeout(200);};
 for(const [label,id,view] of [['PDF','nativity',null],['XML','song-a13c43da-0243-4019-ad08-d7be530074f5','auto'],['Melody','song-a13c43da-0243-4019-ad08-d7be530074f5','large']]){
  await p.evaluate(({id,view})=>prototype.loadSong(id,view),{id,view});await ready();const total=await check();assert(total>1);assert.equal(await value(),`1 / ${total}`);
  const r=await counter.boundingBox();assert(await p.evaluate(({x,y})=>document.elementFromPoint(x,y)?.id!=='page-position',{x:r.x+r.width/2,y:r.y+r.height/2}));await tap(r.x+r.width/2,r.y+r.height/2);assert.equal(await value(),`1 / ${total}`);assert(await feedback.isHidden());await zone(.8,.65);await confirm(`2 / ${total}`);assert.equal(await value(),`2 / ${total}`);await check();await zone(.2,.65);assert.equal(await value(),`1 / ${total}`);await zone(.8,.1);assert.equal(await value(),`${total} / ${total}`);await zone(.2,.1);assert.equal(await value(),`1 / ${total}`);await confirm(`1 / ${total}`);await p.waitForTimeout(1500);assert(await feedback.isHidden());await p.keyboard.press('Home');assert(await feedback.isHidden());
  await p.evaluate(()=>{const e=document.querySelector('#score'),r=e.getBoundingClientRect();for(const type of ['pointerdown','pointercancel','pointerup'])e.dispatchEvent(new PointerEvent(type,{bubbles:true,pointerId:77,isPrimary:true,button:0,pointerType:'touch',clientX:r.x+r.width*.8,clientY:r.y+100}));});assert.equal(await value(),`1 / ${total}`);assert(await feedback.isHidden());await p.keyboard.press('End');await confirm(`${total} / ${total}`);await p.keyboard.press('Home');await confirm(`1 / ${total}`);await p.keyboard.press('ArrowRight');await confirm(`2 / ${total}`);await p.keyboard.press('ArrowLeft');await confirm(`1 / ${total}`);
  await p.screenshot({path:`test-results/page-position-${engine}-${width}-${label}.png`});await p.locator('#score-tools').click();await p.locator('#score-page-theme').click();await check();await p.screenshot({path:`test-results/page-position-${engine}-${width}-${label}-dark.png`});await p.locator('#score-tools').click();await p.locator('#score-page-theme').click();
  if(label==='PDF'){await p.locator('#score-tools').click();await p.locator('#score-annotate').click();await p.locator('#pdf-annotation-next').click();await confirm(`2 / ${total}`);assert.equal(await value(),`2 / ${total}`);await check();await p.locator('#pdf-annotation-previous').click();await confirm(`1 / ${total}`);assert.equal(await value(),`1 / ${total}`);await p.screenshot({path:`test-results/page-position-${engine}-${width}-annotation.png`});await p.locator('#pdf-annotation-done').click();}
  await p.evaluate(()=>prototype.preparePrint());assert.equal(await p.locator('#print-pages #page-position,#print-pages #page-turn-feedback').count(),0);await p.emulateMedia({media:'print'});assert(await counter.isHidden());assert(await feedback.isHidden());await p.emulateMedia({media:'screen'});await p.evaluate(()=>dispatchEvent(new Event('afterprint')));
  await nav('continuous');assert(await counter.isHidden());assert(await feedback.isHidden());await nav('auto');assert(await counter.isHidden());assert(await feedback.isHidden());await nav('pages');await check();
  if(await p.locator('#show-lyrics').isVisible()){await p.locator('#show-lyrics').click();await counter.waitFor({state:'hidden'});assert(await counter.isHidden());assert(await feedback.isHidden());await p.locator('.lyrics-score-toggle').click();await ready();await check();}
  await p.locator('#songs').click();assert(await counter.isHidden());assert(await feedback.isHidden());console.log('PASS counter, turns/cancel, footer passive status, successful feedback/no-op, modes, dark, print',engine,width,label,total);
 }
 await p.evaluate(()=>prototype.loadSong('hhc-1035'));await ready();assert.equal(await p.locator('.pdf-page-frame').count(),1);assert(await counter.isHidden());assert(await feedback.isHidden());await c.close();
}}finally{await b.close();}
