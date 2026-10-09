import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {createRequire} from 'node:module';
const {chromium}=createRequire('C:/Users/kenro/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/package.json')('playwright');
const base='http://127.0.0.1:8780/',baseline='2a7105d';
const old=Object.fromEntries(['index.html','styles.css'].map(f=>[f,execFileSync('git',['show',baseline+':'+f],{encoding:'utf8',maxBuffer:4e6})]));
const browser=await chromium.launch({channel:'msedge'});
try{for(const [width,height] of [[320,568],[390,844],[744,1000],[820,1180],[1440,1000],[844,390]]){
 const heights=[];
 for(const previous of [true,false]){
  const c=await browser.newContext({viewport:{width,height},serviceWorkers:'block',...(width<600||height<500?{isMobile:true,hasTouch:true,userAgent:'iPhone'}:{})});
  if(previous){await c.route(base,r=>r.fulfill({contentType:'text/html',body:old['index.html']}));await c.route(base+'styles.css',r=>r.fulfill({contentType:'text/css',body:old['styles.css']}));}
  const p=await c.newPage();await p.goto(base);await p.waitForFunction(()=>window.prototype?.navigation);await p.evaluate(()=>prototype.loadSong('scripture-power'));await p.waitForFunction(()=>prototype.ready&&!prototype.loading&&!prototype.busy);await p.locator('#score-tools').click();await p.locator('#score-metronome').click();await p.waitForFunction(()=>!document.querySelector('#metronome-visual').disabled);
  const panel=p.locator('#metronome-panel');heights.push((await panel.boundingBox()).height);
  if(!previous){
   assert.deepEqual(await panel.locator('button,select,output').evaluateAll(es=>es.map(e=>e.id)),['metronome-visual','metronome-click','metronome-sound','tempo-down','tempo-value','tempo-up','tap-tempo','metronome-done']);
   const click=await p.locator('#metronome-click').boundingBox(),sound=await p.locator('#metronome-sound').boundingBox();assert.equal(sound.y,click.y);assert(Math.abs(sound.x-click.x-click.width-6)<.1,'normal 6px spacing');
   await p.locator('#metronome-click').click();const before=await panel.boundingBox();await p.locator('#metronome-sound').click();assert.deepEqual(await panel.boundingBox(),before,'floating menu leaves panel height unchanged');await p.keyboard.press('Escape');
   for(const r of await panel.locator('button,select').evaluateAll(es=>es.map(e=>e.getBoundingClientRect().toJSON())))assert(r.width>=44&&r.height>=44&&r.x>=0&&r.right<=width&&r.y>=0&&r.bottom<=height);
   const bpm=()=>p.locator('#tempo-value').textContent();await p.locator('#tempo-up').click();assert.equal(await bpm(),'94 BPM');await p.locator('#tempo-down').click();assert.equal(await bpm(),'90 BPM');await p.locator('#tap-tempo').click();await p.waitForTimeout(500);await p.locator('#tap-tempo').click();assert.notEqual(await bpm(),'90 BPM');await p.locator('#metronome-done').click();assert(await panel.isHidden());
  }
  await c.close();
 }
 assert(heights[1]<heights[0]);if(width>=600)assert.deepEqual(heights,[58,48]);console.log('PASS control order, adjacency, targets, floating menu, tempo/Tap/Close; panel height',width,heights.join(' -> '));
}}finally{await browser.close();}

