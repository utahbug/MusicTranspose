import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createRequire} from 'node:module';
import {lyricsClipboardText} from '../lyrics-view.js';
const records=JSON.parse(fs.readFileSync('assets/lyrics.json','utf8')).songs.filter(s=>['cs-16','song-708c0414-b2e0-4f70-b178-88aca2228fa7'].includes(s.id));
const {chromium}=createRequire('C:/Users/kenro/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/package.json')('playwright');
const browser=await chromium.launch({channel:'msedge'});
try{for(const width of [320,390,744,820,1440]){
 const context=await browser.newContext({viewport:{width,height:900},serviceWorkers:'block',permissions:['clipboard-read','clipboard-write'],hasTouch:width<1000});
 const page=await context.newPage();page.setDefaultTimeout(45000);
 await page.goto(process.env.APP_URL||'http://127.0.0.1:8780/');await page.waitForFunction(()=>window.prototype?.openLyrics);
 for(const r of records){
  await page.evaluate(id=>prototype.openLyrics(id),r.id);await page.locator('#lyrics-copy').waitFor();
  await page.waitForFunction(title=>document.querySelector('.lyrics-title-block')?.textContent.includes(title),r.title);
  assert.deepEqual(await page.locator('.lyrics-body>section>h2').allTextContents(),['Lyrics','Pronunciation guide (not sung)']);
  assert.equal(await page.locator('.lyrics-body details').count(),0);
  const texts=await page.locator('.lyrics-body>section .lyric-lines').allTextContents();assert.deepEqual(texts,r.refrains.map(s=>s.text));
  assert(!/Shared ending|Verse 2/.test(await page.locator('.lyrics-body').textContent()));
  assert(await page.locator('#lyrics-view').evaluate(e=>e.classList.contains('lyrics-frame-hidden')));
  const copy=page.locator('#lyrics-copy');await copy.click();await page.waitForFunction(()=>document.querySelector('#lyrics-copy').dataset.result==='success');
  const expected=r.title+'\n\nLyrics\n'+r.refrains[0].text+'\n\nPronunciation guide (not sung)\n'+r.refrains[1].text;
  assert.equal(lyricsClipboardText(r),expected);assert.equal((await page.evaluate(()=>navigator.clipboard.readText())).replaceAll('\r\n','\n'),expected);
  const c=await copy.boundingBox(),speaker=page.locator('.lyrics-identity-header .song-playback');const s=await speaker.boundingBox();assert(s&&s.width>=44&&s.height>=44&&s.x+s.width<=c.x);assert(c.width>=44&&c.height>=44&&c.x+c.width<=width);
  assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
  await page.screenshot({path:'test-results/lyrics-pronunciation-'+r.number+'-'+width+'.png',fullPage:true});
  await page.locator('.lyrics-score-toggle').click();await page.locator('#show-lyrics').click();await copy.waitFor();assert.deepEqual(await page.locator('.lyrics-body>section>h2').allTextContents(),['Lyrics','Pronunciation guide (not sung)']);
 }
 console.log('PASS both songs: named sections, exact sung/guide text, complete labeled Copy, speaker/touch targets, no overflow, Score transitions',width);await context.close();
}}finally{await browser.close();}
