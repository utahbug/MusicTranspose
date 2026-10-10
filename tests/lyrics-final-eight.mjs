import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createRequire} from 'node:module';
import {lyricsClipboardText} from '../lyrics-view.js';
const records=JSON.parse(fs.readFileSync('assets/lyrics.json','utf8')).songs.filter(s=>['hhc-1053','song-a13c43da-0243-4019-ad08-d7be530074f5','song-53c57be6-2733-45c7-94ad-773835a4fd19','song-dac6f94b-6a48-40de-993c-82bb543bf96d','song-ffd5b22c-dacd-462e-9e86-5a887fc3970d','song-dcb0645f-f0b0-4137-a0e4-1bb309078370'].includes(s.id));assert.equal(records.length,6);
const {chromium}=createRequire('C:/Users/kenro/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/package.json')('playwright');
const browser=await chromium.launch({channel:'msedge'});
try{for(const width of [320,390,744,820,1440]){
 const context=await browser.newContext({viewport:{width,height:900},serviceWorkers:'block',permissions:['clipboard-read','clipboard-write'],hasTouch:width<1000});
 const page=await context.newPage();page.setDefaultTimeout(45000);
 await page.goto(process.env.APP_URL||'http://127.0.0.1:8780/');await page.waitForFunction(()=>window.prototype?.openLyrics);
 for(const r of records){
  await page.evaluate(id=>prototype.openLyrics(id),r.id);await page.locator('#lyrics-copy').waitFor();
  await page.waitForFunction(title=>document.querySelector('.lyrics-title-block')?.textContent.includes(title),r.title);
  const repeated=r.refrains.filter(c=>/^(Chorus|Refrain)$/.test(c.label)),other=r.refrains.filter(c=>!repeated.includes(c));
  assert.deepEqual(await page.locator('.lyrics-body>section>h2').allTextContents(),[...r.verses.map(v=>'Verse '+v.number),...other.map(c=>c.label)]);
  assert.deepEqual(await page.locator('.lyrics-body>section>.lyric-lines').allTextContents(),[...r.verses.map(v=>v.text),...other.map(c=>c.text)]);
  const disclosures=page.locator('.lyrics-chorus'),count=repeated.length?r.verses.length:0;assert.equal(await disclosures.count(),count);
  for(let i=0;i<count;i++){assert.equal(await disclosures.nth(i).locator('summary').getAttribute('aria-label'),'Chorus after verse '+(i+1));assert.equal(await disclosures.nth(i).locator('.lyric-lines').textContent(),repeated[0].text);}
  if(count){await disclosures.nth(0).locator('summary').click();await disclosures.nth(1).locator('summary').click();assert.equal(await page.locator('.lyrics-chorus[open]').count(),2);await disclosures.nth(0).locator('summary').click();assert.equal(await disclosures.nth(1).getAttribute('open'),'');assert.equal(await page.locator('.lyrics-chorus[open]').count(),1);}
  assert(!/Shared ending|Verse 5/.test(await page.locator('.lyrics-body').textContent()));
  assert(await page.locator('#lyrics-view').evaluate(e=>e.classList.contains('lyrics-frame-hidden')));
  const copy=page.locator('#lyrics-copy');await copy.click();await page.waitForFunction(()=>document.querySelector('#lyrics-copy').dataset.result==='success');
  const copied=(await page.evaluate(()=>navigator.clipboard.readText())).replaceAll('\r\n','\n');assert.equal(copied,lyricsClipboardText(r));for(const v of [...r.verses,...r.refrains])assert(copied.includes(v.text));for(const section of other)assert(copied.includes(section.label));
  const c=await copy.boundingBox(),s=await page.locator('.lyrics-identity-header .song-playback').boundingBox();assert(s&&s.width>=44&&s.height>=44&&s.x+s.width<=c.x);assert(c.width>=44&&c.height>=44&&c.x+c.width<=width);
  assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
  if(['1053','230'].includes(r.number))await page.screenshot({path:'test-results/lyrics-final-eight-'+r.number+'-'+width+'.png',fullPage:true});
  await page.locator('.lyrics-score-toggle').click();await page.locator('#show-lyrics').click();await copy.waitFor();assert.equal(await disclosures.count(),count);
 }
 console.log('PASS six corrected records: exact verse/parallel text, independent Chorus, labeled complete Copy, speaker/touch targets, overflow, frame default and Score transitions',width);await context.close();
}}finally{await browser.close();}
