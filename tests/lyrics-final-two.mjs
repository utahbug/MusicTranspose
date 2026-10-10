import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createRequire} from 'node:module';
import {lyricsClipboardText} from '../lyrics-view.js';
const ids=['song-97b815d1-3074-402d-87dc-054a26201437','song-be95cf4e-2b13-4a09-a71b-52ef90125517'];const records=JSON.parse(fs.readFileSync('assets/lyrics.json','utf8')).songs.filter(r=>ids.includes(r.id));
const {chromium}=createRequire('C:/Users/kenro/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/package.json')('playwright');
const b=await chromium.launch({channel:'msedge'});
try{for(const width of [320,390,820,1440]){
 const context=await b.newContext({viewport:{width,height:900},serviceWorkers:'block',permissions:['clipboard-read','clipboard-write']});const page=await context.newPage();page.setDefaultTimeout(45000);
 await page.addInitScript(()=>{window.audioStarts=0;const original=AudioContext.prototype.createOscillator;AudioContext.prototype.createOscillator=function(){const o=original.call(this),start=o.start.bind(o);o.start=(...args)=>{window.audioStarts++;return start(...args);};return o;};});
 await page.goto('http://127.0.0.1:8780/');await page.waitForFunction(()=>window.prototype?.openLyrics);
 for(const r of records){
  await page.evaluate(id=>prototype.openLyrics(id),r.id);const copy=page.locator('#lyrics-copy'),audio=page.locator('#lyrics-view .song-playback');await copy.waitFor();await page.waitForFunction(title=>document.querySelector('.lyrics-title-block')?.textContent.includes(title),r.title);
  assert.equal(await page.evaluate(()=>prototype.playback.state),'stopped');assert.equal(await page.locator('.lyrics-body>section').count(),r.refrains.length);
  assert.deepEqual(await page.locator('.lyrics-body .lyric-lines').allTextContents(),r.refrains.map(s=>s.text));assert.deepEqual(await page.locator('.lyrics-body h2,.lyrics-body summary').allTextContents(),r.refrains.map(s=>s.label));
  assert(!/Shared ending|Verse [1-6]/.test(await page.locator('.lyrics-body').textContent()));
  const details=page.locator('.lyrics-body details');assert.equal(await details.count(),r.refrains.filter(s=>s.disclosure).length);assert.equal(await page.locator('.lyrics-body details[open]').count(),0);
  await details.first().locator('summary').focus();await page.keyboard.press('Enter');assert.equal(await details.first().getAttribute('open'),'');
  if(await details.count()>1){await details.nth(1).locator('summary').click();await details.first().locator('summary').click();assert.equal(await details.nth(1).getAttribute('open'),'');}
  assert(await page.locator('#lyrics-view').evaluate(e=>e.classList.contains('lyrics-frame-hidden')));
  await audio.click();await page.waitForFunction(()=>prototype.playback.state==='playing'&&prototype.playback.nodes>0);assert(await page.evaluate(()=>audioStarts>0));
  await copy.click();await page.waitForFunction(()=>document.querySelector('#lyrics-copy').dataset.result==='success');const copied=(await page.evaluate(()=>navigator.clipboard.readText())).replaceAll('\r\n','\n');assert.equal(copied,[r.title,...r.refrains.map(s=>s.label+'\n'+s.text)].join('\n\n'));assert.equal(copied,lyricsClipboardText(r));
  await audio.click();assert.equal(await audio.getAttribute('aria-label'),'Resume song');await audio.click();await page.waitForFunction(()=>prototype.playback.state==='playing');await audio.press('Escape');assert.equal(await page.evaluate(()=>prototype.playback.nodes),0);
  const a=await audio.boundingBox(),c=await copy.boundingBox(),t=await page.locator('.lyrics-identity-header h1').boundingBox();assert(a.width>=44&&a.height>=44&&c.width>=44&&c.height>=44);assert(Math.abs(a.x-t.x-t.width-4)<1&&a.x+a.width<=c.x&&c.x+c.width<=width);assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
  await page.screenshot({path:'test-results/lyrics-final-two-'+r.number+'-'+width+'.png',fullPage:true});
  await page.locator('.lyrics-score-toggle').click();await page.locator('#show-lyrics').click();await copy.waitFor();assert.deepEqual(await page.locator('.lyrics-body .lyric-lines').allTextContents(),r.refrains.map(s=>s.text));
 }
 console.log('PASS both complex songs: role/path/parallel labels, independent keyboard disclosures, exact complete Copy, real audio/pause/resume, header geometry, frame default and navigation',width);await context.close();
}}finally{await b.close();}
