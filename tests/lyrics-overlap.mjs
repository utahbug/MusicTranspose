import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createRequire} from 'node:module';
import {lyricsClipboardText} from '../lyrics-view.js';
const records=JSON.parse(fs.readFileSync('assets/lyrics.json','utf8')).songs.filter(s=>s.collection==='Hymns (1985)'&&['52','144','241','246'].includes(s.number));assert.equal(records.length,4);
const {chromium}=createRequire('C:/Users/kenro/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/package.json')('playwright');
const browser=await chromium.launch({channel:'msedge'});
try{for(const width of [320,390,744,820,1440]){
 const context=await browser.newContext({viewport:{width,height:900},serviceWorkers:'block',permissions:['clipboard-read','clipboard-write'],hasTouch:width<1000});
 const page=await context.newPage();page.setDefaultTimeout(45000);
 await page.goto(process.env.APP_URL||'http://127.0.0.1:8780/');await page.waitForFunction(()=>window.prototype?.openLyrics);
 for(const r of records){
  await page.evaluate(id=>prototype.openLyrics(id),r.id);await page.locator('#lyrics-copy').waitFor();
  await page.waitForFunction(title=>document.querySelector('.lyrics-title-block')?.textContent.includes(title),r.title);
  assert.deepEqual(await page.locator('.lyrics-body>section>h2').allTextContents(),['Verse 1','Verse 2','Verse 3','Verse 4','Overlapping chorus part (sung with Chorus)']);
  assert.deepEqual(await page.locator('.lyrics-body>section>.lyric-lines').allTextContents(),[...r.verses.map(v=>v.text),r.refrains[1].text]);
  const disclosures=page.locator('.lyrics-chorus');assert.equal(await disclosures.count(),4);
  for(let i=0;i<4;i++){assert.equal(await disclosures.nth(i).locator('summary').getAttribute('aria-label'),'Chorus after verse '+(i+1));assert.equal(await disclosures.nth(i).locator('.lyric-lines').textContent(),r.refrains[0].text);}
  await disclosures.nth(0).locator('summary').click();await disclosures.nth(1).locator('summary').click();assert.equal(await page.locator('.lyrics-chorus[open]').count(),2);await disclosures.nth(0).locator('summary').click();assert.equal(await disclosures.nth(1).getAttribute('open'),'');assert.equal(await page.locator('.lyrics-chorus[open]').count(),1);
  assert(!/Shared ending|Verse 5/.test(await page.locator('.lyrics-body').textContent()));
  assert(await page.locator('#lyrics-view').evaluate(e=>e.classList.contains('lyrics-frame-hidden')));
  const copy=page.locator('#lyrics-copy');await copy.click();await page.waitForFunction(()=>document.querySelector('#lyrics-copy').dataset.result==='success');
  const copied=(await page.evaluate(()=>navigator.clipboard.readText())).replaceAll('\r\n','\n');assert.equal(copied,lyricsClipboardText(r));for(const v of [...r.verses,...r.refrains])assert(copied.includes(v.text));assert(copied.includes('Overlapping chorus part (sung with Chorus)'));
  const c=await copy.boundingBox(),s=await page.locator('.lyrics-identity-header .song-playback').boundingBox();assert(s&&s.width>=44&&s.height>=44&&s.x+s.width<=c.x);assert(c.width>=44&&c.height>=44&&c.x+c.width<=width);
  assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
  if(r.number==='241')await page.screenshot({path:'test-results/lyrics-overlap-'+width+'.png',fullPage:true});
  await page.locator('.lyrics-score-toggle').click();await page.locator('#show-lyrics').click();await copy.waitFor();assert.equal(await disclosures.count(),4);
 }
 console.log('PASS all four hymns: exact verse/parallel text, independent Chorus, labeled complete Copy, speaker/touch targets, overflow, frame default and Score transitions',width);await context.close();
}}finally{await browser.close();}
