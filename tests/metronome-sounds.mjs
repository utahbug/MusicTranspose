import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {createRequire} from 'node:module';
import {metronomeSounds} from '../metronome-sounds.js';
const source=fs.readFileSync('metronome-sounds.js','utf8').replace(/\r/g,'');
const recipes=source.slice(source.indexOf('  if (sound === "classic")'),source.indexOf('\nexport function scheduleMetronomeTone'));
assert.equal(createHash('sha256').update(recipes).digest('hex'),'90e26b85bc04093363fe717c51bb3a69f3a8614b0e3f4ee91e28a1548707bca8','exact seven recipes from PrimarySongs 610a1eb, only sound parameter renamed');
const original=s=>s.slice(s.indexOf('  const oscillator=context.createOscillator(),gain=context.createGain(),now=context.currentTime;'),s.indexOf('\n function silence(){')).replace(/\r/g,'');
assert.equal(original(fs.readFileSync('playback.js','utf8')),original(execFileSync('git',['show','4f2bf0a:playback.js'],{encoding:'utf8'})),'original click body unchanged');
const {chromium}=createRequire('C:/Users/kenro/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/package.json')('playwright');
const b=await chromium.launch({channel:'msedge'});
try{for(const [width,height] of [[1440,1000],[320,568],[390,844],[744,1000],[820,1180],[844,390]]){
 if(process.env.SOUND_WIDTH&&width!==Number(process.env.SOUND_WIDTH))continue;
 const c=await b.newContext({viewport:{width,height},serviceWorkers:'block',hasTouch:width<1000,...(width===320||width===390||height===390?{isMobile:true,userAgent:'iPhone'}:{})});
 await c.addInitScript(()=>{window.audioStarts=[];window.audioContexts=[];const Native=window.AudioContext;window.AudioContext=class extends Native{constructor(...a){super(...a);audioContexts.push(this);this.probe=this.createAnalyser();}createGain(){const node=super.createGain(),connect=node.connect.bind(node);node.connect=(dest,...args)=>{if(dest===this.destination)connect(this.probe);return connect(dest,...args);};return node;}createOscillator(){const node=super.createOscillator(),start=node.start.bind(node);node.start=(time)=>{audioStarts.push({time,type:node.type,frequency:node.frequency.value});return start(time);};return node;}};});
 const p=await c.newPage();p.setDefaultTimeout(45000);const errors=[];p.on('pageerror',e=>errors.push(e.message));await p.goto('http://127.0.0.1:8780/');await p.waitForFunction(()=>window.prototype?.navigation);
 const load=async id=>{await p.evaluate(id=>prototype.loadSong(id),id);await p.waitForFunction(()=>prototype.ready&&!prototype.loading&&!prototype.busy);};
 const open=async()=>{await p.locator('#score-tools').click();await p.locator('#score-metronome').click();await p.waitForFunction(()=>!document.querySelector('#metronome-visual').disabled);};
 await load('scripture-power');await open();const select=p.locator('#metronome-sound');assert.equal(await select.inputValue(),'original');assert.equal(await select.evaluate(e=>getComputedStyle(e).direction),'rtl','native popup opens inward from the right edge');assert(await select.isDisabled());assert.deepEqual(await select.locator('option').allTextContents(),Object.values(metronomeSounds));assert.equal(await p.evaluate(()=>audioStarts.length),0);
 const geom=()=>p.locator('#metronome-panel').evaluate(e=>Object.fromEntries([...e.querySelectorAll('button,select')].map(e=>[e.id,e.getBoundingClientRect().toJSON()])));const initial=await geom();assert.equal(await p.locator('#tap-tempo').textContent(),'Tap');assert.equal(await p.locator('#tap-tempo').getAttribute('aria-label'),'Tap tempo');if(width>=600)assert.equal(new Set(Object.values(initial).map(r=>r.y)).size,1,'single-row tablet/desktop/landscape panel');else assert(new Set(Object.values(initial).map(r=>r.y)).size<=(width<360?3:2),'only essential wrapping on narrow phones');
 for(const [id,r] of Object.entries(initial)){assert(r.width>=44&&r.height>=44,id);assert(r.x>=0&&r.right<=width&&r.y>=0&&r.bottom<=height,id+' bounds');}
 assert(await p.locator('#metronome-done').evaluate(e=>{const r=e.getBoundingClientRect();return e.contains(document.elementFromPoint(r.x+r.width/2,r.y+r.height/2));}),'Close hit target above navigation chip');
 const panel=await p.locator('#metronome-panel').boundingBox(),footer=await p.locator('.masthead').boundingBox();assert(panel.y+panel.height<=footer.y,'panel clears footer');
 await p.locator('#metronome-click').click();assert(await select.isEnabled());assert.deepEqual(await geom(),initial,'Click toggle never moves controls');await p.waitForFunction(()=>audioStarts.length>0);await select.focus();assert.equal(await p.evaluate(()=>document.activeElement.id),'metronome-sound');await p.keyboard.press('ArrowDown');await p.keyboard.press('Enter');assert.equal(await select.inputValue(),'wood');assert.deepEqual(await geom(),initial,'native picker does not reflow panel');
 if(width===1440){
  await p.evaluate(()=>{window.beats=[];const original=prototype.playback.clickBeat;prototype.playback.clickBeat=(strong,sound)=>{beats.push({time:performance.now(),sound});return original(strong,sound);};});
  const bpm=await p.locator('#tempo-value').textContent();
  for(const sound of Object.keys(metronomeSounds)){
   const count=await p.evaluate(()=>beats.length);await select.selectOption(sound);await p.waitForFunction(({count,sound})=>beats.length>count&&beats.at(-1).sound===sound,{count,sound});
   await p.waitForFunction(()=>{const ctx=audioContexts[0],data=new Float32Array(ctx.probe.fftSize);ctx.probe.getFloatTimeDomainData(data);return data.some(n=>Math.abs(n)>.00001);});
   assert.equal(await p.locator('#tempo-value').textContent(),bpm);assert.equal(await p.evaluate(()=>prototype.playback.state),'stopped','selection does not start Score playback');
  }
  const intervals=await p.evaluate(()=>beats.slice(1).map((x,i)=>x.time-beats[i].time));assert(intervals.every(t=>t>400&&t<950),JSON.stringify(intervals));
  const rendered=await p.evaluate(async()=>{const {primaryMetronomeTones,scheduleMetronomeTone,metronomeSounds}=await import('./metronome-sounds.js');const result=[];for(const sound of Object.keys(metronomeSounds).filter(s=>s!=='original'))for(const strong of [false,true]){const ctx=new OfflineAudioContext(1,22050,44100),voices=new Set();primaryMetronomeTones(sound,0,strong,(t,o)=>scheduleMetronomeTone(ctx,voices,t,o));const data=(await ctx.startRendering()).getChannelData(0);result.push({sound,strong,valid:data.every(Number.isFinite)&&data.some(v=>Math.abs(v)>.001)});}return result;});assert(rendered.every(r=>r.valid));
 }
 await select.selectOption('water');await p.locator('#metronome-click').click();assert(await select.isDisabled());assert.equal(await select.inputValue(),'water');assert.equal(await p.evaluate(()=>prototype.playback.clickNodes),0);const stopped=await p.evaluate(()=>audioStarts.length);await p.locator('#metronome-visual').click();await p.waitForTimeout(800);assert.equal(await p.evaluate(()=>audioStarts.length),stopped);assert.equal(await p.locator('.beat-rail:not([hidden])').count(),2);
 await p.locator('#metronome-click').click();assert(await select.isEnabled());assert.equal(await select.inputValue(),'water');await p.locator('#metronome-click').click();
 await p.reload();await p.waitForFunction(()=>window.prototype?.navigation);assert(await p.locator('#metronome-panel').isHidden());assert.equal(await p.evaluate(()=>audioStarts.length),0);await load('scripture-power');await open();assert.equal(await select.inputValue(),'water');assert(await select.isDisabled());
 if(width===1440){
  await load('faithful');await open();await p.locator('#tempo-up').click();const tempo=await p.evaluate(()=>prototype.playback.tempo.bpm);
  await p.locator('#metronome-click').click();await p.locator('.score-heading .song-playback').click();await p.waitForFunction(()=>prototype.playback.state==='playing');await p.waitForTimeout(300);
  const position=await p.evaluate(()=>prototype.playback.position);await select.selectOption('bell');await p.waitForTimeout(200);
  assert.equal(await p.evaluate(()=>prototype.playback.state),'playing');assert((await p.evaluate(()=>prototype.playback.position))>position,'sound change never restarts transport');assert.equal(await p.evaluate(()=>prototype.playback.tempo.bpm),tempo);
  await p.locator('#songs').click();assert.equal(await p.evaluate(()=>prototype.playback.nodes+prototype.playback.clickNodes),0,'navigation silences every sound layer');
 }
 assert.deepEqual(errors,[]);console.log('PASS sound/default/persistence/audio/geometry',width,height);await c.close();
}}finally{await b.close();}
