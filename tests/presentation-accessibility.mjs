import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {createRequire} from 'node:module';
const pw=createRequire(process.env.PLAYWRIGHT_PACKAGE||'C:/Users/kenro/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/package.json')('playwright');
const out=process.env.OUT; if(out)await fs.mkdir(out,{recursive:true});
const results=[];
for(const engine of ['chromium','webkit']){
 const browser=await pw[engine].launch(engine==='chromium'?{channel:'msedge'}:{});
 try{for(const theme of ['light','dark']){
  const context=await browser.newContext({viewport:{width:1440,height:900},serviceWorkers:'block'});
  await context.addInitScript(theme=>{
   localStorage.setItem('music-transpose-library-theme-v1',theme);
   if(!localStorage.getItem('music-transpose-library-v1'))localStorage.setItem('music-transpose-library-v1',JSON.stringify({orderingVersion:1,favorites:['silent-night'],groups:['blue','teal','green','violet'].map(t=>({id:t,name:'Rehearsal '+t,songs:['silent-night','nativity']}))}));
  },theme);
  const page=await context.newPage();
  const home=async()=>{await page.goto(process.env.TEST_URL||'http://127.0.0.1:8782/');await page.waitForFunction(()=>window.prototype?.navigation);};
  for(const width of [320,375,390,744,820,1194,1440])for(const scale of [1,2]){
   await page.setViewportSize({width,height:900});await home();
   if(scale===2)await page.evaluate(()=>{
    // Text-only enlargement, including the dynamically generated footer labels.
    const nodes=[...document.querySelectorAll('#library-home *')].filter(e=>[...e.childNodes].some(n=>n.nodeType===3&&n.textContent.trim()));
    const sizes=nodes.map(e=>parseFloat(getComputedStyle(e).fontSize));nodes.forEach((e,i)=>e.style.fontSize=sizes[i]*2+'px');
   });
   await page.waitForTimeout(200);
   const geometry=await page.evaluate(()=>{
    const footer=document.querySelector('.library-home-footer'),r=footer.getBoundingClientRect();
    return {overflow:document.documentElement.scrollWidth-innerWidth,height:r.height,reserved:parseFloat(document.querySelector('#library-home').style.getPropertyValue('--workspace-footer-height')),buttons:[...footer.querySelectorAll('button')].map(b=>{
     const z=b.getBoundingClientRect(),s=b.querySelector('.footer-destination-label,.home-settings-label'),ink=[];
     if(s&&s.getClientRects().length){const range=document.createRange();range.selectNodeContents(s);for(const line of range.getClientRects())ink.push({left:line.left,right:line.right,top:line.top,bottom:line.bottom});}
     const svg=b.querySelector('svg').getBoundingClientRect();
     return {id:b.id,name:b.getAttribute('aria-label'),x:z.x,y:z.y,w:z.width,h:z.height,inside:z.left>=0&&z.right<=innerWidth&&z.bottom<=innerHeight,inkInside:ink.every(t=>t.left>=z.left-1&&t.right<=z.right+1&&t.top>=z.top-1&&t.bottom<=z.bottom+1),iconInside:svg.left>=z.left&&svg.right<=z.right&&svg.top>=z.top&&svg.bottom<=z.bottom};
    })};
   });
   assert.equal(geometry.buttons.length,6);assert(geometry.overflow<=1);assert(Math.abs(geometry.height-geometry.reserved)<1);
   for(const b of geometry.buttons){assert(b.name);assert(b.w>=44&&b.h>=44);assert(b.inside&&b.inkInside&&b.iconInside,`${engine} ${theme} ${width} ${scale}: ${JSON.stringify(b)}`);}
   if(scale===1)assert.equal(geometry.buttons[0].h,52,'normal button height unchanged');
   await page.locator('#home-current').focus();
   for(const id of ['home-footer-lists','home-footer-files','home-text','home-keyboard','home-settings']){await page.keyboard.press('Tab');assert.equal(await page.evaluate(()=>document.activeElement.id),id);assert(await page.evaluate(()=>getComputedStyle(document.activeElement).outlineStyle!=='none'));}
   await page.keyboard.press('Enter');assert(await page.locator('#home-settings-menu').isVisible());await page.keyboard.press('Escape');assert.equal(await page.evaluate(()=>document.activeElement.id),'home-settings');
   await page.evaluate(()=>scrollTo(0,document.documentElement.scrollHeight));
   assert(await page.locator('#home-files').evaluate(e=>e.getBoundingClientRect().bottom<=document.querySelector('.library-home-footer').getBoundingClientRect().top),'last card clears enlarged footer');
   if(out&&[375,1440].includes(width))await page.screenshot({path:`${out}/${engine}-${theme}-${width}-${scale}x.png`,fullPage:true});
   results.push({engine,theme,width,scale,...geometry});
  }
  await home();await page.locator('#home-footer-lists').click();
  await page.evaluate(()=>document.querySelectorAll('[data-list]').forEach(e=>e.dataset.listTint=e.dataset.list));
  const contrasts=[];
  // Compose translucent hover backgrounds over the actual ancestor colors.
  const measure=selector=>page.locator(selector).evaluateAll(es=>{
   const rgba=s=>s.match(/[\d.]+/g).map(Number),over=(a,b)=>{const alpha=a[3]??1;return a.slice(0,3).map((c,i)=>c*alpha+b[i]*(1-alpha));};
   const lum=c=>c.slice(0,3).map(n=>{n/=255;return n<=.04045?n/12.92:((n+.055)/1.055)**2.4;}).reduce((s,n,i)=>s+n*[.2126,.7152,.0722][i],0);
   return es.map(e=>{const chain=[];for(let p=e;p;p=p.parentElement)chain.unshift(p);let bg=[255,255,255];for(const p of chain)bg=over(rgba(getComputedStyle(p).backgroundColor),bg);const fg=over(rgba(getComputedStyle(e).color),bg),a=lum(fg),b=lum(bg);return {text:e.textContent,color:getComputedStyle(e).color,bg,ratio:(Math.max(a,b)+.05)/(Math.min(a,b)+.05)};});
  });
  for(const tint of ['blue','teal','green','violet']){
   const entry=page.locator(`[data-list="${tint}"] .list-overview-entry`);
   for(const expanded of [false,true]){
    if((await entry.getAttribute('aria-expanded')==='true')!==expanded)await entry.click();
    for(const state of ['normal','hover','focus']){
     await page.mouse.move(1400,10);await entry.evaluate(e=>e.blur());
     if(state==='hover')await entry.hover();if(state==='focus')await entry.focus();
     const values=await measure(`[data-list="${tint}"] .list-header-identity strong,[data-list="${tint}"] .list-count`);
     for(const v of values)assert(v.ratio>=4.5,`${engine} ${theme} ${tint} ${expanded} ${state}: ${JSON.stringify(v)}`);
     contrasts.push({tint,expanded,state,values});
    }
   }
  }
  await home();await page.locator('#home-settings').click();const heading=await measure('#home-settings-menu .menu-section-label');assert(heading[0].ratio>=4.5);
  results.push({engine,theme,contrasts,heading});console.log('PASS',engine,theme,'7 widths × 2 text sizes; keyboard; all List tints/states; Settings contrast');await context.close();
 }}finally{await browser.close();}
}
if(out)await fs.writeFile(`${out}/measurements.json`,JSON.stringify(results,null,2));
