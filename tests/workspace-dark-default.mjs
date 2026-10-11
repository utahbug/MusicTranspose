import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
const {chromium,webkit}=createRequire('C:/Users/kenro/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/package.json')('playwright');
const b=process.env.THEME_WEBKIT?await webkit.launch():await chromium.launch({channel:'msedge'});
const key='music-transpose-library-theme-v1';
try{for(const width of [320,390,744,820,1024,1440]){
 const c=await b.newContext({viewport:{width,height:1000},...(width<=390?{userAgent:'iPhone',isMobile:true,hasTouch:true}:{}),serviceWorkers:'block'}),p=await c.newPage();
 const ready=()=>p.waitForFunction(()=>window.prototype?.navigation),theme=()=>p.locator('html').getAttribute('data-library-theme');
 await p.goto('http://127.0.0.1:8780/');await ready();assert.equal(await theme(),'dark');assert.equal(await p.evaluate(k=>localStorage.getItem(k),key),null);
 const fits=async()=>assert(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
 for(const [open,back] of [['#home-footer-lists','#lists-library'],['#home-footer-files','#files-library'],['#home-text','#texts-home'],['#home-keyboard','#keyboard-home']]){await p.locator(open).click();assert.equal(await theme(),'dark');await fits();await p.locator(back).click();}
 await p.locator('[data-home-source=all]').click();assert.equal(await theme(),'dark');await fits();
 await p.evaluate(()=>prototype.loadSong('nativity'));await p.waitForFunction(()=>prototype.ready&&!prototype.busy);
 assert.equal(await p.locator('.score-paper').evaluate(e=>getComputedStyle(e).backgroundColor),'rgb(255, 255, 255)');assert.equal(await p.locator('#score-frame-input').isChecked(),false);
 const footer=()=>p.locator('#key').evaluate(e=>({background:getComputedStyle(e).backgroundColor,ink:getComputedStyle(e).color,rect:e.getBoundingClientRect().toJSON()}));
 const dark=await footer();assert.equal(dark.ink,'rgb(240, 242, 244)');
 await p.locator('#show-lyrics').click();await p.locator('#lyrics-view').waitFor({state:'visible'});assert.equal(await p.locator('#lyrics-view').evaluate(e=>getComputedStyle(e).backgroundColor),'rgb(255, 255, 255)');
 await p.locator('.lyrics-score-toggle').click();await p.locator('#songs').click();
 // The return lands in Library. Use its Settings control to save Light.
 await p.locator('#library-more').click();await p.locator('#library-settings-theme').click();await p.keyboard.press('Escape');assert.equal(await theme(),'light');
 await p.reload();await ready();assert.equal(await theme(),'light');
 await p.evaluate(()=>prototype.loadSong('nativity'));await p.waitForFunction(()=>prototype.ready&&!prototype.busy);const light=await footer();assert.notEqual(light.ink,dark.ink);assert.deepEqual(light.rect,dark.rect);
 await p.locator('#score-tools').click();await p.locator('#score-page-theme').click();await p.keyboard.press('Escape');assert(await p.locator('#playing-view').evaluate(e=>e.classList.contains('score-page-dark')));
 await p.locator('#show-lyrics').click();await p.locator('#lyrics-settings').click();await p.locator('#lyrics-theme').click();await p.keyboard.press('Escape');assert(await p.locator('#lyrics-view').evaluate(e=>e.classList.contains('lyrics-dark')));
 await p.reload();await ready();assert.equal(await theme(),'light');assert.equal(await p.evaluate(()=>localStorage.getItem('music-transpose-score-dark-v1')),'true');assert.equal(await p.evaluate(()=>JSON.parse(localStorage.getItem('music-transpose-lyrics-appearance-v1')).dark),true);
 await p.locator('.lyrics-score-toggle').click();await p.waitForFunction(()=>prototype.ready&&!prototype.busy);assert(await p.locator('#playing-view').evaluate(e=>e.classList.contains('score-page-dark')));await p.locator('#songs').click();
 await p.locator('#library-more').click();await p.locator('#library-settings-theme').click();await p.keyboard.press('Escape');await p.reload();await ready();assert.equal(await theme(),'dark');assert.equal(await p.evaluate(k=>localStorage.getItem(k),key),'dark');await fits();
 await c.close();console.log('PASS',width,'fresh Dark, saved Light/Dark, shared workspaces, white reading defaults, independent dark reading preferences, footer colors/geometry');
}}finally{await b.close();}
