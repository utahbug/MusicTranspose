import assert from 'node:assert/strict';import {createRequire} from 'node:module';
const {chromium}=createRequire('C:/Users/kenro/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/package.json')('playwright'),b=await chromium.launch({channel:'msedge'});
try{for(const width of [390,820,1440]){
 const c=await b.newContext({viewport:{width,height:844},serviceWorkers:'block'}),p=await c.newPage();await p.goto('http://127.0.0.1:8780/');await p.waitForFunction(()=>window.prototype?.navigation);
 for(const theme of ['light','dark']){
  if(theme==='dark')await p.locator('.home-toolbar .library-theme-toggle').click();
  const check=async selector=>{const e=p.locator(selector);const s=await e.evaluate(e=>{const c=getComputedStyle(e),r=e.getBoundingClientRect();return {bg:c.backgroundImage,color:c.color,w:r.width,h:r.height,title:e.title,label:e.getAttribute('aria-label')};});assert.match(s.bg,/linear-gradient/);assert.match(s.bg,/47, 139, 97/);assert.equal(s.color,'rgb(255, 255, 255)');assert(s.w>=44&&s.h>=44);assert(s.title&&s.label);await e.hover();assert.equal(await e.evaluate(e=>getComputedStyle(e).backgroundImage),s.bg);return s.bg;};
  const gradient=await check('#home-current');
  for(const [trigger,view,home] of [['#home-footer-lists','#lists-view','#lists-library'],['#home-footer-files','#files-view','#files-library'],['#home-text','#texts-view','#texts-home']]){
   await p.locator(trigger).click();assert(await p.locator(view).isVisible());assert.equal(await check(home),gradient);
   for(const sibling of await p.locator(view+' .workspace-sibling').all()){assert.equal(await sibling.evaluate(e=>getComputedStyle(e).backgroundImage),'none');assert(await sibling.getAttribute('aria-label'));const box=await sibling.boundingBox();assert(box.width>=44&&box.height>=44);}
   await p.screenshot({path:`test-results/polish-${width}-${theme}-${view.slice(1)}.png`});await p.locator(home).click();assert(await p.locator('#library-home').isVisible());
  }
  assert.equal(await p.locator('#home-footer-lists').evaluate(e=>getComputedStyle(e).backgroundImage),'none');
  let heading;
  for(const [trigger,id,close] of [['#home-info-about','#about-dialog','#about-close'],['#add-home-screen','#home-screen-dialog','#home-screen-close']]){
   await p.locator('#home-about').click();assert.equal(await p.locator('#home-info-menu button:visible').count(),2);await p.locator(trigger).click();const d=p.locator(id);assert(await d.isVisible());const r=await d.boundingBox();assert(r.x>=0&&r.y>=0&&r.x+r.width<=width&&r.y+r.height<=844);assert(await d.evaluate(e=>e.scrollWidth<=e.clientWidth));const style=await d.locator('.dialog-heading').evaluate(e=>{const c=getComputedStyle(e);return [c.backgroundColor,c.borderTopColor,c.borderTopWidth,c.padding];});if(heading)assert.deepEqual(style,heading);else heading=style;const box=await p.locator(close).boundingBox();assert(box.width>=44&&box.height>=44);await p.screenshot({path:`test-results/polish-${width}-${theme}-${id.slice(1)}.png`});await p.keyboard.press('Escape');await p.waitForFunction(()=>document.activeElement.id==='home-about');
  }
 }
 console.log('PASS',width,'light/dark shared gradient, inactive siblings, navigation, matching modal surfaces, bounds, Escape/focus');await c.close();
}}finally{await b.close();}
