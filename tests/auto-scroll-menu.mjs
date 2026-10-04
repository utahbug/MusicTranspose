import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {songs} from '../songs.js';
const {webkit}=createRequire('C:/Users/kenro/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/package.json')('playwright');
const browser=await webkit.launch();
try{for(const width of [390,430,820]){
 const context=await browser.newContext({viewport:{width,height:width===390?844:width===430?932:1180},isMobile:true,hasTouch:true,serviceWorkers:'block'}),page=await context.newPage(),errors=[];
 page.on('pageerror',e=>errors.push(e.message));page.setDefaultTimeout(60000);
 await page.goto('http://127.0.0.1:8780/');await page.waitForFunction(()=>window.prototype?.navigation);
 await page.evaluate(id=>prototype.loadSong(id),songs.find(s=>s.collection==='Hymns (1985)'&&s.page==='223').id);
 await page.waitForFunction(()=>prototype.ready&&!prototype.busy&&!prototype.loading);await page.waitForTimeout(400);
 const chip=page.locator('#score-navigation-button'),menu=page.locator('#score-navigation-menu'),toggle=page.locator('#auto-toggle');
 const running=async value=>assert.equal(await toggle.getAttribute('aria-pressed'),String(value));
 const open=async()=>{await chip.tap();assert(await menu.isVisible());await running(false);};
 const start=async()=>{const before=await page.evaluate(()=>scrollY);await toggle.tap();assert(await menu.isHidden(),'Start must close menu');await running(true);const after=await page.evaluate(()=>scrollY);assert(Math.abs(after-before)<15,'menu close must not jump score');await page.waitForTimeout(450);await running(true);assert(await page.evaluate(()=>scrollY)>after+3,'programmatic scrolling must continue');assert.equal(await page.locator('#score-navigation-label').textContent(),'Auto-scroll');assert(await chip.isVisible());};
 await open();await page.locator('[data-navigation=auto]').tap();await page.locator('#scroll-speed').fill('25');await page.locator('#scroll-speed').dispatchEvent('input');
 await start();await page.touchscreen.tap(width/2,160);await running(false);const paused=await page.evaluate(()=>scrollY);await page.waitForTimeout(200);assert.equal(await page.evaluate(()=>scrollY),paused);
 await open();await start();await open();await running(false);assert.equal(await page.locator('#scroll-speed').inputValue(),'25');
 await start();await page.locator('#score').dispatchEvent('wheel',{deltaY:40});await page.waitForTimeout(150);await running(false);
 await open();await page.keyboard.press('Escape');assert(await menu.isHidden());await open();await page.touchscreen.tap(width/2,160);assert(await menu.isHidden());
 for(const mode of ['continuous','pages']){await open();await page.locator(`[data-navigation=${mode}]`).tap();assert(await menu.isHidden());}
 assert.deepEqual(errors,[]);console.log('PASS',width,'start closes, keeps scrolling, touch/wheel pause, chip pauses/opens, resume, Escape/outside and mode selection');await context.close();
}}finally{await browser.close();}
