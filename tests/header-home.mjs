import {createRequire} from 'node:module';import assert from 'node:assert/strict';
const {chromium}=createRequire(process.env.PLAYWRIGHT_PACKAGE)('playwright'),browser=await chromium.launch({channel:'msedge',headless:true});
const ready=p=>p.waitForFunction(()=>prototype.ready&&!prototype.busy&&!document.body.classList.contains('song-loading')&&document.querySelector('#score').getAttribute('aria-busy')==='false');
const home=(p,scope)=>p.locator(scope+' .header-home');
const noBox=async(p,selector)=>assert.equal(await p.locator(selector).evaluate(e=>getComputedStyle(e).outlineStyle),'none');
const library=async p=>{await p.locator('#library').waitFor({state:'visible'});assert.equal(await p.locator('#library-search').inputValue(),'Sabbath');};
try{for(const [width,height] of [[820,1180],[1440,1000],[390,844]]){
const c=await browser.newContext({viewport:{width,height},serviceWorkers:'block'}),p=await c.newPage(),errors=[];p.on('pageerror',e=>errors.push(e.message));await p.goto('http://127.0.0.1:8780/');await p.locator('.library-row').first().waitFor();assert.equal(await p.evaluate(()=>document.activeElement.tagName),'BODY');
// Native identity button does not change the Library header's text geometry.
assert(await p.evaluate(()=>{const button=document.querySelector('.library-heading .header-home'),h=button.parentElement,header=h.parentElement,before=header.getBoundingClientRect().height;const children=[...button.childNodes];h.replaceChildren(...children);const old=header.getBoundingClientRect().height;button.append(...children);h.append(button);return before===old;}));
await p.locator('#library-search').fill('Sabbath');await home(p,'.library-heading').focus();await p.keyboard.press('Tab');await p.keyboard.press('Shift+Tab');await noBox(p,'.library-heading .header-home');assert.equal(await p.locator('.library-heading h1').evaluate(e=>getComputedStyle(e).textDecorationLine),'underline');await p.keyboard.press('Enter');await library(p);
await p.reload();await library(p);assert.equal(await p.evaluate(()=>document.activeElement.tagName),'BODY');
await p.locator('[data-song="hhc-1035"] .song-entry').click();await ready(p);assert.equal((await p.locator('.score-identity-header').boundingBox()).height,48);
// Reloading a Score route keeps the compact header and no heading focus rectangle.
await p.reload();await ready(p);await p.locator('.score-heading h1').focus();await noBox(p,'.score-heading h1');await p.locator('#show-tap-zones').click();await p.locator('#score-tap-overlay').waitFor({state:'visible'});await p.keyboard.press('Escape');
await p.locator('#show-lyrics').click();await p.waitForFunction(()=>document.body.classList.contains('lyrics-open'));await noBox(p,'.lyrics-identity-header h1');await home(p,'.lyrics-identity-header').click();await library(p);
await p.goBack();await p.waitForFunction(()=>document.body.classList.contains('lyrics-open'));await p.goForward();await library(p);
await p.locator('[data-song="hhc-1035"] .song-entry').click();await ready(p);await home(p,'.score-identity-header').focus();await p.keyboard.press('Enter');await library(p);await p.goBack();await ready(p);await p.goForward();await library(p);
await p.locator('#library-more').click();await p.locator('#view-files').click();await p.locator('#files-view').waitFor({state:'visible'});await noBox(p,'#files-heading');await p.reload();await p.locator('#files-view').waitFor({state:'visible'});await home(p,'.files-heading').click();await library(p);
await p.locator('#library-source').click();await p.locator('[data-source="edit-lists"]').click();await p.locator('#lists-view').waitFor({state:'visible'});await home(p,'.lists-heading').click();await library(p);
await p.locator('#library-search').focus();await p.waitForTimeout(250);assert.equal(await p.evaluate(()=>document.activeElement.id),'library-search');assert.equal(await p.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);assert.deepEqual(errors,[]);
await p.screenshot({path:`test-results/header-home-${width}.png`});console.log('PASS Library/Score/Lyrics/Files/Lists Home, reload/history, keyboard underline, Search focus, header geometry',width);await c.close();
}}finally{await browser.close();}
