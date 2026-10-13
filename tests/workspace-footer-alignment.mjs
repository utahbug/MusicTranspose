import assert from 'node:assert/strict';import fs from 'node:fs/promises';import {createRequire} from 'node:module';
const {chromium,webkit}=createRequire('C:/Users/kenro/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/package.json')('playwright');
const phase=process.env.PHASE||'after',out='test-results/workspace-alignment',base=process.env.TEST_URL||'http://127.0.0.1:8786/';await fs.mkdir(out,{recursive:true});
const results=[],protectedResults=[];
// PHASE=before captures reference geometry/screenshots; normal runs also work independently.
const baseline=phase==='after'?await fs.readFile(`${out}/baseline.json`,'utf8').then(JSON.parse).catch(e=>{if(e.code==='ENOENT')return null;throw e;}):null;
const metrics=element=>{const r=element.getBoundingClientRect(),s=getComputedStyle(element);return {x:r.x,y:r.y,width:r.width,height:r.height,background:s.background,color:s.color};};
for(const [engine,type] of Object.entries({chromium,webkit})){
 const browser=await type.launch(engine==='chromium'?{channel:'msedge'}:{});
 try{for(const [width,device] of [...[320,390,600,744,820,1024,1194,1440].map(w=>[w,w<600?'iPhone':w<1440?'iPad':'desktop']),...[320,390,600].map(w=>[w,'desktop'])]){
 if(process.env.WIDTH&&width!==Number(process.env.WIDTH))continue;
 const c=await browser.newContext({viewport:{width,height:900},serviceWorkers:'block',...(device==='desktop'?{}:{userAgent:device,hasTouch:true,isMobile:true})}),p=await c.newPage(),errors=[];p.on('pageerror',e=>errors.push(e.message));
 await p.goto(base);await p.waitForFunction(()=>window.prototype?.navigation);
 const root=name=>p.locator(`#${name}-view`),foot=name=>root(name).locator('.workspace-return');
 const homeButtons={lists:'home-footer-lists',files:'home-files',texts:'home-text'};
 const destinations={lists:['Home','Files','Notes'],files:['Home','Lists','Notes'],texts:['Home','Files','Lists']};
 for(const theme of ['light','dark']){
  await p.locator('#home-footer-lists').click();
  if(await p.locator('html').getAttribute('data-library-theme')!==theme)await foot('lists').locator('.library-theme-toggle').click();
  const measurements={};
  for(const [name,next] of [['lists','Notes'],['texts','Lists'],['lists','Files'],['files','Notes'],['texts','Files'],['files','Lists'],['lists','Files'],['files','Home']]){
   await root(name).waitFor({state:'visible'});
   const data=await foot(name).evaluate(e=>{const rect=n=>{const r=n.getBoundingClientRect();return {x:r.x,y:r.y,width:r.width,height:r.height};};return {rect:rect(e),buttons:[...e.querySelectorAll('[data-footer-destination]')].map(b=>({label:b.dataset.footerDestination,rect:rect(b),icon:rect(b.querySelector('svg')),labelVisible:!!b.querySelector('.footer-destination-label').getClientRects().length,clipped:b.scrollWidth>b.clientWidth,background:getComputedStyle(b).background})),overflow:document.documentElement.scrollWidth>innerWidth};});
   assert.deepEqual(data.buttons.map(b=>b.label),destinations[name]);assert(!data.overflow);assert(data.rect.y+data.rect.height<=900.1);
   for(const b of data.buttons){assert(b.rect.width>=44&&b.rect.height===44);assert(b.rect.x>=0&&b.rect.x+b.rect.width<=width);assert(!b.clipped);}
   if(phase==='after'){
    const labeled=width>=700&&device!=='iPhone';
    const previous=baseline?.results.find(r=>r.engine===engine&&r.width===width&&r.device===device&&r.theme===theme&&r.name===name);if(previous){assert.equal(data.rect.height,previous.rect.height,'unchanged footer height');assert.equal(data.buttons[0].background,previous.buttons[0].background,'unchanged Home styling');}
    for(const b of data.buttons){assert.equal(b.rect.width,labeled?88:44);assert.equal(b.icon.width,30);assert.equal(b.labelVisible,labeled);}
    const positions=data.buttons.map(b=>b.rect);for(const previous of Object.values(measurements))assert.deepEqual(positions,previous.buttons.map(b=>b.rect),'stable navigation slots');
   }
   if(measurements[name])assert.deepEqual(data,measurements[name],'stable return navigation');
   else{measurements[name]=data;results.push({engine,width,device,theme,name,...data});if(width===820||width===390&&device==='iPhone')await p.screenshot({path:`${out}/${phase}-${engine}-${width}-${theme}-${name}.png`});}
   await foot(name).locator(`[data-footer-destination="${next}"]`).click();
  }
  for(const name of ['lists','files','texts']){await p.locator('#'+homeButtons[name]).click();await foot(name).locator('[data-footer-destination=Home]').focus();await p.keyboard.press('Enter');assert(await p.locator('#library-home').isVisible());}
 }
 // These footers are out of scope: compare their actual geometry and colors to pre-change captures.
 if(width===390&&device==='iPhone'||width===820){
  await p.locator('#home-keyboard').click();const keyboard=await p.locator('#keyboard-view .workspace-return').evaluate(e=>[...e.querySelectorAll('button')].map(b=>{const r=b.getBoundingClientRect();return {x:r.x,y:r.y,width:r.width,height:r.height,background:getComputedStyle(b).background};}));
  await p.locator('#keyboard-home').click();await p.evaluate(()=>prototype.loadSong('faithful','normal'));await p.waitForFunction(()=>prototype.ready&&!prototype.busy&&!prototype.loading);
  const score=[];for(const id of ['songs','score-size','key','show-lyrics','score-markup','score-tools'])score.push([id,await p.locator('#'+id).evaluate(metrics)]);
  await p.locator('#show-lyrics').click();const lyrics=[];for(const selector of ['.lyrics-score-toggle','#lyrics-view .display-settings-toggle'])lyrics.push([selector,await p.locator(selector).evaluate(metrics)]);
  const value={engine,width,device,keyboard,score,lyrics};protectedResults.push(value);if(baseline)assert.deepEqual(value,baseline.protectedResults.find(r=>r.engine===engine&&r.width===width&&r.device===device),'unchanged Keyboard/Score/Lyrics footers');
 }
 assert.deepEqual(errors.filter(e=>e!=='ResizeObserver loop completed with undelivered notifications.'),[]);
 console.log('PASS',phase,engine,width,device,'navigation, themes, touch targets, geometry');await c.close();
 }}finally{await browser.close();}
}
await fs.writeFile(`${out}/${phase==='before'?'baseline':'results'}.json`,JSON.stringify({results,protectedResults},null,2));
