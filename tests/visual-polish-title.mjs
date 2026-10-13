import assert from 'node:assert/strict';import fs from 'node:fs/promises';import {createRequire} from 'node:module';
const engines=createRequire(process.env.PLAYWRIGHT_PACKAGE||'C:/Users/kenro/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/package.json')('playwright');
const base=process.env.TEST_URL||'http://127.0.0.1:8786/',themeKey='music-transpose-library-theme-v1';
await fs.mkdir('test-results/visual-polish',{recursive:true});
for(const name of ['chromium','webkit']){const browser=await engines[name].launch(name==='chromium'?{channel:'msedge'}:{});try{
 for(const [width,height,device] of [[320,900,'desktop'],[390,900,'desktop'],[744,1133,'iPad'],[820,1180,'iPad'],[1024,768,'iPad'],[1440,1000,'desktop'],[320,740,'iPhone'],[390,844,'iPhone'],[844,390,'iPhone'],[500,1000,'iPad']]){
  if(process.env.PREFERENCES_ONLY)continue;const context=await browser.newContext({viewport:{width,height},serviceWorkers:'block',...(device==='desktop'?{}:{userAgent:device,isMobile:true,hasTouch:true})}),page=await context.newPage();
  try{await page.goto(base);await page.waitForFunction(()=>window.prototype?.navigation);assert.equal(await page.locator('html').getAttribute('data-library-theme'),'light');
  const foot=()=>page.locator('.library-home-footer:visible,.workspace-return:visible,.library-quick-access:visible');
  const inspect=async()=>{
   assert.match(await page.title(),/Title Undecided/);assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
   const data=await foot().evaluate(e=>[...e.querySelectorAll('button')].filter(b=>b.getClientRects().length).map(b=>{const r=b.getBoundingClientRect(),label=b.querySelector('.footer-destination-label');return {id:b.id,destination:b.dataset.footerDestination,label:label?.textContent,visible:!!label?.getClientRects().length,x:r.x,right:r.right,y:r.y,bottom:r.bottom,width:r.width,height:r.height,hit:document.elementFromPoint(r.x+r.width/2,r.y+r.height/2)?.closest('button')===b,overflow:b.scrollWidth>b.clientWidth};}));
   for(const a of data){assert(a.width>=44&&a.height>=44&&a.x>=0&&a.right<=width&&a.hit,JSON.stringify({name,width,device,a}));if(a.destination){assert.equal(a.label,a.destination);assert.equal(a.visible,width>=700&&device!=='iPhone');assert(!a.overflow,JSON.stringify(a));}for(const z of data)if(a!==z)assert(!(a.x<z.right&&a.right>z.x&&a.y<z.bottom&&a.bottom>z.y),'footer overlap');}
   const settings=data.find(a=>a.id==='home-settings');if(settings)assert.equal(settings.right,Math.max(...data.map(a=>a.right)));
  };
  for(const theme of ['light','dark']){
   await page.evaluate(theme=>{if(document.documentElement.dataset.libraryTheme!==theme)document.querySelector('.library-theme-toggle').click();},theme);await inspect();
   if(width===820||width===844)await page.screenshot({path:`test-results/visual-polish/${name}-${device}-${width}-${theme}-home.png`});
   for(const [open,owner,back] of [['#home-footer-lists','#lists-view','#lists-library'],['#home-footer-files','#files-view','#files-library'],['#home-text','#texts-view','#texts-home'],['#home-keyboard','#keyboard-view','#keyboard-home']]){await page.locator(open).click();assert(await page.locator(owner).isVisible());await inspect();assert.equal(await page.locator(back+' .footer-destination-label').textContent(),'Home');if(width===820&&owner==='#lists-view')await page.screenshot({path:`test-results/visual-polish/${name}-${theme}-lists.png`});await page.locator(back).click();assert(await page.locator('#library-home').isVisible());}
   await page.locator('[data-home-source=all]').click();await inspect();await page.locator('#library-quick-home').click();assert(await page.locator('#library-home').isVisible());
  }
  await page.reload();await page.waitForFunction(()=>window.prototype?.navigation);assert.equal(await page.locator('html').getAttribute('data-library-theme'),'dark');assert.equal(await page.evaluate(k=>localStorage.getItem(k),themeKey),'dark');
  await page.evaluate(()=>prototype.loadSong('faithful','auto'));await page.waitForFunction(()=>prototype.ready&&!prototype.busy&&!prototype.loading);assert(!(await page.locator('#playing-view').evaluate(e=>e.classList.contains('score-page-dark'))));
  if(device!=='iPhone'){
   const normal=await page.locator('.score-identity-header').boundingBox();await page.locator('#score-hide-controls').click();assert.match(await page.locator('#score-focus-info').textContent(),/^View: Transpose · G major$/);
   const t=await page.locator('.score-heading h1').boundingBox(),v=await page.locator('#score-focus-info').boundingBox();if(width>=700){assert(t.x+t.width<=v.x,'title/view horizontal separation');assert(Math.abs(t.y+t.height/2-v.y-v.height/2)<2,'vertical alignment');}else assert(t.y+t.height<=v.y||t.x+t.width<=v.x);
   if(width===820)await page.screenshot({path:`test-results/visual-polish/${name}-focus.png`});await page.locator('#score-show-controls').click();assert.deepEqual(await page.locator('.score-identity-header').boundingBox(),normal);
  }
  assert.equal(await page.locator('.masthead .footer-destination-label').count(),0);await page.locator('#show-lyrics').click();await page.locator('#lyrics-view').waitFor({state:'visible'});assert(!(await page.locator('#lyrics-view').evaluate(e=>e.classList.contains('lyrics-dark'))));assert.equal(await page.locator('.lyrics-footer .footer-destination-label').count(),0);
  console.log('PASS',name,width,height,device,'labels/actions/themes/branding/focus');
  }catch(e){await page.screenshot({path:`test-results/visual-polish/FAIL-${name}-${width}-${device}.png`});throw e;}finally{await context.close();}
 }
 // Explicit saved Light/Dark choices and independent reading appearance remain authoritative.
 for(const theme of ['light','dark']){const c=await browser.newContext({serviceWorkers:'block'});await c.addInitScript(({key,theme})=>{localStorage.setItem(key,theme);localStorage.setItem('music-transpose-score-dark-v1','true');localStorage.setItem('music-transpose-lyrics-appearance-v1',JSON.stringify({dark:true,frame:true,size:2}));}, {key:themeKey,theme});const p=await c.newPage();await p.goto(base);await p.waitForFunction(()=>window.prototype?.navigation);assert.equal(await p.locator('html').getAttribute('data-library-theme'),theme);assert(await p.locator('#playing-view').evaluate(e=>e.classList.contains('score-page-dark')));await p.evaluate(()=>prototype.openLyrics('faithful'));assert(await p.locator('#lyrics-view').evaluate(e=>e.classList.contains('lyrics-dark')));assert.deepEqual(await p.evaluate(()=>JSON.parse(localStorage.getItem('music-transpose-lyrics-appearance-v1'))),{dark:true,frame:true,size:2});console.log('PASS saved browsing/Score/Lyrics preferences',name,theme);await c.close();}
}finally{await browser.close();}}
