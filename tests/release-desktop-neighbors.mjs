import {createRequire} from 'node:module';import assert from 'node:assert/strict';import fs from 'node:fs';import {songs} from '../songs.js';
const {chromium}=createRequire('C:/Users/kenro/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/package.json')('playwright');
const browser=await chromium.launch({channel:'msedge',headless:true}),page=await browser.newPage({viewport:{width:1440,height:1000},serviceWorkers:'block'}),results=[];
const hymn=n=>songs.find(s=>s.collection==='Hymns (1985)'&&s.page===String(n)).id;
try{await page.goto('http://127.0.0.1:8780/');await page.locator('[data-home-source=hymnal]').click();await page.locator('#order-toggle').selectOption('number');await page.locator(`[data-song="${hymn(84)}"] .song-entry`).click();
const ready=()=>page.waitForFunction(()=>prototype.ready&&!prototype.busy&&!prototype.loading&&!document.body.classList.contains('song-loading'));
await ready();const ids=await page.evaluate(()=>prototype.navigation.ids);assert.equal(ids.length,335);assert(!ids.includes(hymn(86)));
for(const [n,d] of [[85,'next'],[87,'next'],[88,'next'],[87,'previous'],[85,'previous'],[84,'previous']]){await page.locator('#'+d+'-song').click();await ready();const r=await page.evaluate(()=>prototype.navigation);assert.equal(r.currentSongId,hymn(n));assert.deepEqual(r.ids,ids);assert(!r.previous.staleDisabled&&!r.next.staleDisabled);results.push(r);}
await page.screenshot({path:'test-results/release-footer-1440.png'});fs.writeFileSync('test-results/release-desktop-neighbors.json',JSON.stringify(results,null,2));console.log('PASS desktop actual Library 84 -> 85 -> 87 -> 88 -> 87 -> 85 -> 84');}finally{await browser.close();}
