import fs from 'node:fs';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {createRequire} from 'node:module';
import {footerObstruction} from '../footer-viewport.js';
const {webkit}=createRequire(process.env.PLAYWRIGHT_PACKAGE||'C:/Users/kenro/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/package.json')('playwright');
assert.equal(footerObstruction(874,650),224);
assert.equal(footerObstruction(874,650,650),0,'Native fixed positioning must not be compensated twice');
assert.equal(footerObstruction(874,670),204,'Visual offset contributes to visible bottom');
assert.equal(footerObstruction(874,874),0);
assert.equal(footerObstruction(650,650,874),224,'Measured fixed anchor may exceed innerHeight');
const browser=await webkit.launch(),results=[],errors=[];
const base=process.env.TEST_URL||'http://127.0.0.1:8780/';
const ready=async p=>{await p.waitForFunction(()=>prototype.ready&&!prototype.busy&&!document.body.classList.contains('song-loading')&&document.querySelector('#score').getAttribute('aria-busy')==='false');await p.waitForTimeout(400);};
const view=async(p,mode)=>{await p.locator('#score-size').click();await p.locator(`#score-size-options [data-size=${mode}]`).click();await ready(p);};
async function snapshot(p,label,lyrics=false){
 const s=await p.evaluate(async({label,lyrics})=>{
  const r=e=>{const x=e.getBoundingClientRect();return Object.fromEntries(['top','bottom','left','right','width','height'].map(k=>[k,x[k]]));};
  const bar=document.querySelector(lyrics?'.lyrics-footer':'.masthead'),score=document.querySelector('#score'),root=getComputedStyle(document.documentElement),rect=r(bar);
  const controls=[...bar.querySelectorAll('button')].filter(e=>e.getClientRects().length).map(e=>{const b=r(e),hit=document.elementFromPoint((b.left+b.right)/2,(b.top+b.bottom)/2);return {id:e.id||e.getAttribute('aria-label'),...b,hit:e===hit||e.contains(hit)};});
  return {label,lyrics,innerWidth,innerHeight,clientHeight:document.documentElement.clientHeight,visual:{height:visualViewport.height,offsetTop:visualViewport.offsetTop,scale:visualViewport.scale},safe:parseFloat(root.getPropertyValue('--playing-safe-bottom'))||0,inset:parseFloat(root.getPropertyValue('--footer-viewport-inset')),reserved:parseFloat(root.getPropertyValue('--playing-bar-height')),footer:rect,toolbar:r(lyrics?bar:bar.querySelector('.toolbar')),controls,overflow:document.documentElement.scrollWidth>innerWidth,budget:lyrics?null:(await import('/virtual-pages.js')).availableScoreHeight(score),zoom:score.dataset.zoom,pages:[...score.querySelectorAll('.mxl-page-frame')].map(f=>({height:parseFloat(f.style.height),start:f.dataset.start,end:f.dataset.end})),indicator:document.querySelector('#score-navigation').hidden?null:r(document.querySelector('#score-navigation')),metrics:prototype.metrics.length};
 },{label,lyrics});
 const bottom=s.visual.height+s.visual.offsetTop;
 assert(s.footer.bottom<=bottom+.5,label+' footer below visible edge');
 assert(!s.overflow,label+' horizontal overflow');
 for(const c of s.controls){assert(c.height>=43.9&&c.width>=43.9,label+' touch target '+c.id);assert(c.bottom<=bottom-s.safe+.5,label+' clipped '+c.id);assert(c.top>=s.visual.offsetTop-.5,label+' above visible edge '+c.id);assert(c.hit,label+' covered '+c.id);}
 if(!lyrics){assert(Math.abs(s.reserved+s.safe-(s.innerHeight-s.footer.top))<.5,label+' reserved footprint');if(s.indicator)assert(s.indicator.bottom<=s.footer.top+.5,label+' indicator under footer');}
 results.push(s);return s;
}
async function context(width,height,song,old=false){
 const c=await browser.newContext({viewport:{width,height},isMobile:width<900,hasTouch:width<1100,serviceWorkers:'block'}),p=await c.newPage();p.setDefaultTimeout(90000);p.on('pageerror',e=>errors.push(e.message));
 if(old)for(const file of ['app.js','navigation.js','virtual-pages.js','styles.css'])await p.route('**/'+file,r=>r.fulfill({body:execFileSync('git',['show','cdb851c:'+file],{encoding:'utf8'}),contentType:file.endsWith('css')?'text/css':'application/javascript'}));
 await p.addInitScript(height=>{window.testViewport={height,offsetTop:0,scale:1};for(const key of ['height','offsetTop','scale'])Object.defineProperty(visualViewport,key,{configurable:true,get:()=>testViewport[key]});localStorage.setItem('music-transpose-navigation-v2',JSON.stringify({mode:'pages',explicit:true}));},height);
 await p.goto(base);await p.locator('[data-home-source=all]').click();await p.evaluate(id=>prototype.loadSong(id),song);await ready(p);return {c,p};
}
async function viewport(p,height,offsetTop=0){await p.evaluate(({height,offsetTop})=>{Object.assign(testViewport,{height,offsetTop});for(let i=0;i<5;i++){visualViewport.dispatchEvent(new Event('resize'));visualViewport.dispatchEvent(new Event('scroll'));}},{height,offsetTop});await p.waitForTimeout(500);await ready(p);}
try{
 for(const [width,height,song] of [[390,844,'nativity'],[402,874,'faithful'],[430,932,'silent-night']].filter(([w])=>!process.env.FOOTER_WIDTH||w===Number(process.env.FOOTER_WIDTH))){
  const {c,p}=await context(width,height,song);
  for(const mode of ['pdf','auto','large','pdf']){await view(p,mode);await snapshot(p,`${width}-full-${mode}`);}
  await viewport(p,650);
  for(const mode of ['auto','large','auto','pdf']){await view(p,mode);await snapshot(p,`${width}-reduced-${mode}`);}
  await view(p,'auto');const reduced=await snapshot(p,`${width}-reduced-reference`);
  await viewport(p,height);await snapshot(p,`${width}-restored-full`);await viewport(p,650);
  const again=await snapshot(p,`${width}-reduced-again`);assert.deepEqual({zoom:again.zoom,pages:again.pages},{zoom:reduced.zoom,pages:reduced.pages},'Same budget recovers same fitting');
  const n=again.metrics;await p.waitForTimeout(700);assert.equal(await p.evaluate(()=>prototype.metrics.length),n,'No repeated rendering while stable');
  await p.screenshot({path:`test-results/footer-${width}-transpose.png`,clip:{x:0,y:0,width,height:650}});
  await p.evaluate(()=>document.documentElement.style.setProperty('--playing-safe-bottom','34px'));await p.waitForTimeout(500);await ready(p);await snapshot(p,`${width}-reduced-safe34`);
  await p.evaluate(id=>prototype.openLyrics(id),song);await p.waitForTimeout(250);await snapshot(p,`${width}-lyrics`,true);
  await p.locator('#lyrics-font-size').click();assert(await p.locator('#lyrics-font-options').evaluate(e=>e.getBoundingClientRect().bottom<=visualViewport.height));await p.keyboard.press('Escape');
  await p.screenshot({path:`test-results/footer-${width}-lyrics.png`,clip:{x:0,y:0,width,height:650}});
  await p.locator('[aria-label="View Score"]').click();await ready(p);await snapshot(p,`${width}-lyrics-return`);
  if(width===402){
   await viewport(p,630,20);await snapshot(p,'402-offset20');
   await p.locator('#score-navigation-button').click();await p.locator('[data-navigation=continuous]').click();await ready(p);await snapshot(p,'402-continuous');
   await p.evaluate(()=>scrollTo(0,180));await p.waitForTimeout(300);await snapshot(p,'402-continuous-scrolled');
   await p.evaluate(()=>scrollTo(0,0));await p.locator('#score-navigation-button').click();await p.locator('[data-navigation=pages]').click();await ready(p);
   // Native-anchor adaptation: simulate a browser that already shifts fixed boxes.
   await p.evaluate(()=>{window.nativeStyle=document.createElement('style');nativeStyle.textContent='.masthead,.lyrics-footer{transform:translateY(-224px)}';document.head.append(nativeStyle);Object.assign(testViewport,{height:650,offsetTop:0});visualViewport.dispatchEvent(new Event('resize'));});await p.waitForTimeout(500);await ready(p);const native=await snapshot(p,'402-native-anchor');assert.equal(native.inset,0);
   await p.evaluate(()=>{nativeStyle.textContent='.masthead,.lyrics-footer{transform:translateY(224px)}';visualViewport.dispatchEvent(new Event('resize'));});await p.waitForTimeout(500);await ready(p);const taller=await snapshot(p,'402-anchor-beyond-innerHeight');assert.equal(taller.inset,448);
   await p.evaluate(()=>{nativeStyle.remove();visualViewport.dispatchEvent(new Event('resize'));});await p.waitForTimeout(500);await ready(p);
   // Full-height standalone-like geometry; this is not a physical PWA claim.
   await viewport(p,height);await snapshot(p,'402-full-height-safe34');
   const before=await p.evaluate(()=>prototype.metrics.length);await p.evaluate(()=>{testViewport.scale=2;testViewport.height=437;visualViewport.dispatchEvent(new Event('resize'));});await p.waitForTimeout(500);assert.equal(await p.evaluate(()=>prototype.metrics.length),before,'Pinch does not re-engrave');await p.evaluate(()=>{testViewport.scale=1;});
  }
  // Actual orientation geometry change, keeping the established landscape toolbar.
  await p.setViewportSize({width:height,height:width});await viewport(p,width);await snapshot(p,`${width}-landscape`);await viewport(p,width-50);await snapshot(p,`${width}-landscape-reduced`);
  await c.close();console.log('PASS phone',width,song);
 }
 for(const [width,height] of [[820,1180],[1024,768],[1440,1180]].filter(()=>!process.env.FOOTER_WIDTH)){
  const runs=[];
  for(const old of [true,false]){const {c,p}=await context(width,height,'faithful',old);const modes=[];for(const mode of ['pdf','auto','large']){await view(p,mode);const s=await snapshot(p,`${width}-${old?'baseline':'current'}-${mode}`);modes.push({footer:s.footer,toolbar:s.toolbar,controls:s.controls,zoom:s.zoom,pages:s.pages});}runs.push(modes);await c.close();}
  assert.deepEqual(runs[1],runs[0],width+' tablet/desktop unchanged');console.log('PASS baseline equality',width);
 }
 assert.deepEqual(errors.filter(e=>e!=='ResizeObserver loop completed with undelivered notifications.'),[]);
 fs.writeFileSync(`test-results/footer-viewport${process.env.FOOTER_WIDTH?'-'+process.env.FOOTER_WIDTH:''}.json`,JSON.stringify({results,errors},null,2));console.log('PASS',results.length,'geometry snapshots, view switches, safe area, page-budget cache, Lyrics, orientation and baseline controls');
}finally{await browser.close();}
