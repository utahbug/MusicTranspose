import {createRequire} from 'node:module';import assert from 'node:assert/strict';
const engines=createRequire(process.env.PLAYWRIGHT_PACKAGE)('playwright'),engine=process.env.WEBKIT?'webkit':'chromium',b=await engines[engine].launch(engine==='chromium'?{channel:'msedge',headless:true}:{});
try{for(const [width,height] of [[390,844],[820,1180],[1180,820],[1440,800]]){
 if(process.env.CLEARANCE_WIDTH&&width!==Number(process.env.CLEARANCE_WIDTH))continue;
 const c=await b.newContext({viewport:{width,height},hasTouch:width<1440,serviceWorkers:'block'}),p=await c.newPage();await c.addInitScript(()=>localStorage.setItem('music-transpose-navigation-v1',JSON.stringify({mode:'pages'})));
 await p.goto(process.env.TEST_URL||'http://127.0.0.1:8780/');await p.locator('.library-row').first().waitFor();
 const ready=async()=>{await p.waitForFunction(()=>prototype.ready&&!prototype.busy);await p.waitForTimeout(150);};
 const counter=p.locator('#page-position');let collisions=0;
 // Independent full-resolution pixel check, not the production occupancy helper.
 const check=async()=>{assert(await counter.isVisible());assert(!await counter.evaluate(e=>e.classList.contains('sr-only')),'safe visible location found');const v=await p.evaluate(()=>{
  const e=document.querySelector('#page-position'),f=e.parentElement,canvas=f.querySelector('.pdf-page'),r=e.getBoundingClientRect(),fr=f.getBoundingClientRect(),cr=canvas.getBoundingClientRect(),s=canvas.width/cr.width;
  const ink=(x,y,w,h)=>{const left=Math.max(0,Math.floor((x-cr.left)*s)),top=Math.max(0,Math.floor((y-cr.top)*s)),right=Math.min(canvas.width,Math.ceil((x+w-cr.left)*s)),bottom=Math.min(canvas.height,Math.ceil((y+h-cr.top)*s)),d=canvas.getContext('2d').getImageData(left,top,right-left,bottom-top).data;let n=0;for(let i=0;i<d.length;i+=4)if(d[i+3]&&(d[i]<255||d[i+1]<255||d[i+2]<255))n++;return n;};
  const t=document.querySelector('#pdf-annotation-panel'),tr=t.getBoundingClientRect();return {ink:ink(r.left-3,r.top-3,r.width+6,r.height+6),oldInk:ink(fr.right-8-r.width,fr.bottom-8-r.height,r.width,r.height),inside:r.left>=fr.left&&r.top>=fr.top&&r.right<=fr.right&&r.bottom<=fr.bottom,clearTools:t.hidden||r.right<=tr.left||r.left>=tr.right||r.bottom<=tr.top||r.top>=tr.bottom,pointer:getComputedStyle(e).pointerEvents,right:fr.right-r.right,bottom:fr.bottom-r.bottom};
 });assert.equal(v.ink,0,JSON.stringify(v));assert(v.inside&&v.clearTools);assert.equal(v.pointer,'none');if(v.oldInk)collisions++;return v;};
 for(const id of ['choose-to-serve-the-lord','song-a13c43da-0243-4019-ad08-d7be530074f5']){
  await p.evaluate(id=>prototype.loadSong(id),id);await ready();const total=await p.locator('.pdf-page-frame').count();assert(total>1);
  for(let i=1;i<=total;i++){assert.equal(await counter.textContent(),`${i} / ${total}`);await check();await p.screenshot({path:`test-results/pdf-counter-clearance-${engine}-${width}-${id}-${i}.png`});if(i<total)await p.keyboard.press('ArrowRight');}
  await p.keyboard.press('Home');await check();await p.keyboard.press('End');await check();
  await p.locator('#score-tools').click();await p.locator('#score-page-theme').click();await check();await p.locator('#score-tools').click();await p.locator('#score-page-theme').click();
  await p.locator('#settings').click();await p.locator('#pdf-trim').uncheck();await p.locator('#close-settings').click();await check();await p.locator('#settings').click();await p.locator('#pdf-trim').check();await p.locator('#close-settings').click();await check();
  await p.keyboard.press('Home');await check();const r=await counter.boundingBox(),point={x:r.x+r.width/2,y:r.y+r.height/2};
  const action=await p.evaluate(async({x,y})=>(await import('./score-taps.js')).scoreTapAction(x,y),point);
  if(width<1440)await p.touchscreen.tap(point.x,point.y);else await p.mouse.click(point.x,point.y);
  assert.equal(await counter.textContent(),`${Math.max(1,Math.min(total,1+action))} / ${total}`);await p.keyboard.press('End');
  await p.locator('#score-tools').click();await p.locator('#score-annotate').click();await p.locator('#pdf-annotation-previous').click();assert.equal(await counter.textContent(),`${total-1} / ${total}`);await check();await p.locator('#pdf-annotation-next').click();assert.equal(await counter.textContent(),`${total} / ${total}`);await check();await p.locator('#pdf-annotation-done').click();await check();
 }
 assert(collisions>0,'real dense PDF regression exercised');console.log('PASS dense PDF pixel clearance, trim, dark, keyboard and annotation',engine,width,'old-corner collisions:',collisions);await c.close();
}}finally{await b.close();}
