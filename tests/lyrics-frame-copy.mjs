import assert from 'node:assert/strict';
import fs from 'node:fs';
import {execFileSync} from 'node:child_process';
import {createRequire} from 'node:module';
import {lyricsClipboardText} from '../lyrics-view.js';
const baseline='4e4abafd5f732b55a16d18e136d3014dc10ed9c0';
const data=JSON.parse(fs.readFileSync('assets/lyrics.json','utf8'));
assert.deepEqual(data,JSON.parse(execFileSync('git',['show',baseline+':assets/lyrics.json'],{encoding:'utf8',maxBuffer:8e6})));
for(const song of data.songs){const text=lyricsClipboardText(song);if(song.available===false)assert.equal(text,'');else for(const section of [...song.verses,...song.refrains])if(section.text?.trim())assert(text.includes(section.text),song.id);}
for(const empty of [null,{}, {title:'No lyrics',verses:[],refrains:[]},{available:false,verses:[{text:'Unavailable'}]}])assert.equal(lyricsClipboardText(empty),'');
const fixture={title:'Example',verses:[{number:'1',text:'First.'},{number:'2',text:'Second.'},{number:'3',text:'Third.'}],refrains:[{label:'Chorus',text:'Response (echo).',verses:['1','3']},{label:'Bridge',text:'Bridge words.'},{label:'Final tag',text:'Final words.'}],sourceTextBlocks:['copyright'],alternateLyrics:[{text:'echo'}]};
assert.equal(lyricsClipboardText(fixture),'Example\n\nVerse 1\nFirst.\n\nChorus\nResponse (echo).\n\nVerse 2\nSecond.\n\nVerse 3\nThird.\n\nChorus (repeat)\n\nBridge\nBridge words.\n\nFinal tag\nFinal words.');
console.log('PASS complete structured text across catalog, selected repeats/endings, empty data, catalog unchanged');
const {chromium}=createRequire('C:/Users/kenro/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/package.json')('playwright');
const browser=await chromium.launch({channel:'msedge'});
const key='music-transpose-lyrics-appearance-v1';
try{for(const width of [320,390,744,820,1440]){
 const context=await browser.newContext({viewport:{width,height:900},serviceWorkers:'block',permissions:['clipboard-read','clipboard-write'],hasTouch:width<1000});
 const page=await context.newPage();page.setDefaultTimeout(45000);
 await page.goto(process.env.APP_URL||'http://127.0.0.1:8780/');await page.waitForFunction(()=>window.prototype?.openLyrics);
 await page.evaluate(()=>prototype.loadSong('hhc-1020'));await page.waitForFunction(()=>prototype.ready&&!prototype.busy&&!prototype.loading);await page.locator('#show-lyrics').click();
 const host=page.locator('#lyrics-view'),copy=page.locator('#lyrics-copy');await copy.waitFor();
 assert(await host.evaluate(e=>e.classList.contains('lyrics-frame-hidden')));
 assert.equal(await copy.getAttribute('aria-label'),'Copy lyrics');assert.equal(await copy.getAttribute('title'),'Copy lyrics');
 const geometry=()=>page.locator('.lyrics-paper,.lyrics-body,.lyrics-footer').evaluateAll(es=>es.map(e=>e.getBoundingClientRect().toJSON()));
 await page.locator('#lyrics-settings').click();
 assert.deepEqual(await page.locator('#lyrics-settings-panel').evaluate(e=>[...e.querySelectorAll('#lyrics-font-size,#lyrics-frame,#lyrics-theme')].map(e=>e.id)),['lyrics-font-size','lyrics-frame','lyrics-theme']);
 const before=await geometry();assert.equal(await page.locator('#lyrics-frame').getAttribute('aria-label'),'Show frame');await page.locator('#lyrics-frame').click();assert.equal(await page.locator('#lyrics-frame').getAttribute('aria-label'),'Hide frame');assert.deepEqual(await geometry(),before);
 assert.equal(await page.evaluate(key=>JSON.parse(localStorage.getItem(key)).frame,key),true);
 await page.locator('#lyrics-theme').click();await page.keyboard.press('Escape');
 for(const dark of [true,false]){
  if(!dark){await page.locator('#lyrics-settings').click();await page.locator('#lyrics-theme').click();await page.keyboard.press('Escape');}
  await page.screenshot({path:"test-results/lyrics-frame-copy-"+width+"-"+dark+".png"});const rect=await copy.boundingBox(),play=await page.locator('.lyrics-identity-header .song-playback').evaluateAll(es=>es[0]?.getBoundingClientRect().toJSON()||null);assert(rect.width>=44&&rect.height>=44&&rect.x+rect.width<=width);if(play)assert(play.x+play.width<=rect.x);
  assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
  await copy.click();await page.waitForFunction(()=>document.querySelector('#lyrics-copy')?.dataset.result);assert.equal(await copy.getAttribute('data-result'),'success');assert.equal((await page.evaluate(()=>navigator.clipboard.readText())).replaceAll('\r\n','\n'),lyricsClipboardText(data.songs.find(s=>s.id==='hhc-1020')));assert.equal(await page.locator('.lyrics-chorus[open]').count(),0);
 }
 await page.locator('.lyrics-chorus summary').first().click();await copy.click();await page.waitForFunction(()=>document.querySelector('#lyrics-copy')?.dataset.result);assert.equal(await page.locator('.lyrics-chorus[open]').count(),1);
 await page.reload();await page.locator('#lyrics-copy').waitFor();assert(!(await host.evaluate(e=>e.classList.contains('lyrics-frame-hidden'))));
 await page.evaluate(()=>prototype.openLyrics('hhc-1003'));await page.waitForFunction(()=>document.querySelector('.lyrics-body>section>h2')&&document.querySelectorAll('.lyrics-chorus').length===4);assert(!(await host.evaluate(e=>e.classList.contains('lyrics-frame-hidden'))));
 await copy.click();await page.waitForFunction(()=>document.querySelector('#lyrics-copy')?.dataset.result);assert.equal((await page.evaluate(()=>navigator.clipboard.readText())).replaceAll('\r\n','\n'),lyricsClipboardText(data.songs.find(s=>s.id==='hhc-1003')));
 await page.locator('#lyrics-settings').click();await page.locator('#lyrics-frame').click();await page.keyboard.press('Escape');
 await page.evaluate(()=>localStorage.setItem('music-transpose-score-frame-v1','true'));await page.reload();await copy.waitFor();assert(await host.evaluate(e=>e.classList.contains('lyrics-frame-hidden')));
 await page.locator('.lyrics-score-toggle').click();await page.locator('#show-lyrics').click();await copy.waitFor();assert(await host.evaluate(e=>e.classList.contains('lyrics-frame-hidden')));await page.screenshot({path:'test-results/lyrics-frame-hidden-'+width+'.png'});
 if(width===390){
  await page.evaluate(()=>{window.copyAttempts=0;Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText:async()=>{window.copyAttempts++;throw Error('Denied');}}});document.execCommand=()=>false;});
  await copy.tap();await page.waitForFunction(()=>document.querySelector('#lyrics-copy')?.dataset.result==='failure');assert.equal(await copy.getAttribute('data-result'),'failure');assert.match(await page.locator('#lyrics-copy-status').textContent(),/Unable to copy/);assert.equal(await page.evaluate(()=>copyAttempts),1);
  await page.evaluate(()=>{Object.defineProperty(navigator,'clipboard',{configurable:true,value:undefined});document.execCommand=()=>true;const r=document.createRange();r.selectNodeContents(document.querySelector('.lyric-lines'));getSelection().removeAllRanges();getSelection().addRange(r);});
  const selection=await page.evaluate(()=>getSelection().toString());await copy.click();await page.waitForFunction(()=>document.querySelector('#lyrics-copy')?.dataset.result);assert.equal(await copy.getAttribute('data-result'),'success');assert.equal(await page.evaluate(()=>getSelection().toString()),selection);
  await page.evaluate(async()=>{const {createLyricsView}=await import('./lyrics-view.js');const host=document.querySelector('#lyrics-view'),library=document.querySelector('#songs');window.emptyLyrics=createLyricsView(host,{onScore(){},libraryControl:library});emptyLyrics.show({title:'Empty',collection:'Test',number:'0',verses:[],refrains:[]});});assert(await copy.isDisabled());
 }
 console.log('PASS frame persistence/independence, menu, copy/repeats, themes, geometry, navigation',width);await context.close();
}}finally{await browser.close();}
