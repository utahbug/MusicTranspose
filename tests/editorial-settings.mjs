import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {createRequire} from 'node:module';
const pw=createRequire(process.env.PLAYWRIGHT_PACKAGE||'C:/Users/kenro/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/package.json')('playwright');
const about='The app provides original scores, transposition to a selected key, and melody-only views.';
const storage='Title Undecided downloads music as songs are opened. Individual songs or entire Lists can be saved on this device for offline access.';
const baseline=execFileSync('git',['show','7108e52:index.html'],{encoding:'utf8'}).replaceAll('\r\n','\n');
assert.equal(readFileSync('index.html','utf8').replaceAll('\r\n','\n'),baseline.replace('Transpose music into a comfortable key, choose between original and structured score views, or simplify an arrangement using <strong>Melody only</strong>.',about).replace('Title Undecided downloads music when you open or save it. Save individual songs or a List when you want music available offline.',storage));
for(const engine of ['chromium','webkit']){
 const browser=await pw[engine].launch(engine==='chromium'?{channel:'msedge'}:{});
 try{for(const width of [320,390,744,820,1024,1440]){
 const context=await browser.newContext({viewport:{width,height:1000},serviceWorkers:'block'});const p=await context.newPage();
 await p.goto(process.env.TEST_URL||'http://127.0.0.1:8786/');await p.waitForFunction(()=>window.prototype?.navigation);
 await p.locator('#home-about').click();await p.locator('#home-info-about').click();
 const para=p.locator('#about-dialog p').filter({hasText:about});assert.equal(await para.textContent(),about);assert.equal(await para.locator('*').count(),0);await p.keyboard.press('Escape');
 await p.locator('#home-about').click();await p.locator('#home-info-storage').click();assert.equal(await p.locator('#app-info-dialog p').filter({hasText:storage}).textContent(),storage);await p.keyboard.press('Escape');
 for(const theme of ['light','dark']){
 await p.locator('#home-settings').click();
 if(await p.locator('html').getAttribute('data-library-theme')!==theme){await p.locator('#home-settings-theme').click();if(!await p.locator('#home-settings-menu').isVisible())await p.locator('#home-settings').click();}
 assert.equal(await p.locator('html').getAttribute('data-library-theme'),theme);
 const geometry=await p.evaluate(()=>{const m=document.querySelector('#home-settings-menu'),h=m.querySelector('.menu-section-label'),b=m.querySelector('[data-song-view]'),r=b.getBoundingClientRect(),hr=h.getBoundingClientRect();return {indent:r.left+parseFloat(getComputedStyle(b).paddingLeft)-hr.left-parseFloat(getComputedStyle(h).paddingLeft),height:r.height,width:r.width,parent:b.parentElement.getBoundingClientRect().width,overflow:document.documentElement.scrollWidth>innerWidth,inside:m.getBoundingClientRect().left>=0&&m.getBoundingClientRect().right<=innerWidth};});
 assert.equal(geometry.indent,14);assert.ok(geometry.height>=44&&geometry.width===geometry.parent&&geometry.inside&&!geometry.overflow);
 for(const view of ['lyrics','score']){const button=p.locator(`#home-settings-menu [data-song-view=${view}]`);await button.focus();await p.keyboard.press('Enter');assert.equal(await button.getAttribute('aria-checked'),'true');assert.ok(await p.locator(`#home-song-view input[value=${view}]`).isChecked());assert.equal(await p.evaluate(()=>localStorage.getItem('music-transpose-song-view-v1')),view);if(!await p.locator('#home-settings-menu').isVisible())await p.locator('#home-settings').click();}
 await p.keyboard.press('Escape');assert.equal(await p.locator('#home-settings-menu').isVisible(),false);
 }
 await p.locator('#home-settings').click();await p.locator('#home-settings-menu [data-song-view=lyrics]').click({position:{x:3,y:22}});await p.reload();await p.waitForFunction(()=>window.prototype?.navigation);assert.ok(await p.locator('#home-song-view input[value=lyrics]').isChecked());await p.locator('#home-settings').click();assert.equal(await p.locator('#home-settings-menu [data-song-view=lyrics]').getAttribute('aria-checked'),'true');
 console.log('PASS',engine,width,'exact prose, legal preservation, 14px indent, full-width 44px targets, themes, keyboard, synchronization and persistence');await context.close();
 }}finally{await browser.close();}
}
