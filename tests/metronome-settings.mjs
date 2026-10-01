import {createRequire} from 'node:module';
import assert from 'node:assert/strict';
const {chromium}=createRequire(process.env.PLAYWRIGHT_PACKAGE)('playwright'),browser=await chromium.launch({channel:'msedge',headless:true});
const base=process.env.TEST_URL||'http://127.0.0.1:8780/';
const ready=(p,id)=>p.waitForFunction(id=>(!id||prototype.song===id)&&prototype.ready&&!prototype.busy&&!document.body.classList.contains('song-loading')&&document.querySelector('#score').getAttribute('aria-busy')==='false',id,{timeout:120000});
const tool=async(p,id)=>{await p.locator('#score-tools').click();await p.locator('#'+id).click();};
const metro=async p=>{await tool(p,'score-metronome');await p.waitForFunction(()=>!document.querySelector('#metronome-panel').hidden&&!document.querySelector('#metronome-visual').disabled);};
try{
 const c=await browser.newContext({viewport:{width:820,height:1180},serviceWorkers:'block'}),p=await c.newPage(),errors=[];p.on('pageerror',e=>errors.push(e.message));
 await p.addInitScript(()=>localStorage.setItem('music-transpose-navigation-v1',JSON.stringify({mode:'continuous'})));
 await p.goto(base);await p.locator('.library-row').first().waitFor();await p.evaluate(()=>prototype.loadSong('hhc-1035'));await ready(p,'hhc-1035');
 assert.equal(await p.evaluate(()=>prototype.playback.sound),'grand-piano');
 for(const exit of ['cancel','escape','backdrop']){
  await p.locator('#settings').click();await p.locator('#playback-sound').selectOption('electric-piano');await p.locator('#pdf-trim').uncheck();await p.locator('input[name=navigation][value=pages]').check();
  assert.equal(await p.evaluate(()=>prototype.playback.sound),'grand-piano');assert.equal(await p.evaluate(()=>document.body.classList.contains('page-navigation')),false);
  if(exit==='cancel')await p.locator('#close-settings').click();else if(exit==='escape')await p.keyboard.press('Escape');else await p.mouse.click(2,2);
  await p.waitForFunction(()=>!document.querySelector('#settings-dialog').open);await p.locator('#settings').click();assert.equal(await p.locator('#playback-sound').inputValue(),'grand-piano');assert(await p.locator('#pdf-trim').isChecked());assert(await p.locator('input[value=continuous]').isChecked());await p.locator('#close-settings').click();
 }
 await p.locator('#settings').click();await p.locator('#playback-sound').selectOption('electric-piano');await p.locator('input[value=auto]').check();await p.locator('#scroll-speed').fill('20');await p.locator('#apply-settings').click();
 assert.equal(await p.evaluate(()=>prototype.playback.sound),'electric-piano');assert.equal(await p.evaluate(()=>localStorage.getItem('music-transpose-playback-sound-v1')),'electric-piano');assert.equal(await p.locator('#speed-summary').textContent(),'20 px/s');
 await p.locator('#settings').click();assert.equal(await p.locator('#playback-sound').inputValue(),'electric-piano');await p.locator('input[value=continuous]').check();await p.locator('#apply-settings').click();
 console.log('PASS draft/Cancel/Escape/backdrop/Apply/persistence, navigation and trim drafts');
 // Count real click events without replacing their audio implementation.
 await p.evaluate(()=>{window.clickBeats=[];const fn=prototype.playback.clickBeat;prototype.playback.clickBeat=strong=>{clickBeats.push(strong);fn(strong);};});
 await metro(p);assert.equal(await p.locator('#score-view-label').textContent(),'Original');
 for(const [visual,click] of [[true,false],[true,true],[false,true],[false,false]]){
  for(const [id,on] of [['metronome-visual',visual],['metronome-click',click]])if(await p.locator('#'+id).getAttribute('aria-pressed')!==String(on))await p.locator('#'+id).click();
  await p.waitForFunction(({visual,click})=>document.querySelector('#metronome-visual').getAttribute('aria-pressed')===String(visual)&&document.querySelector('#metronome-click').getAttribute('aria-pressed')===String(click),{visual,click});
  const count=await p.evaluate(()=>clickBeats.length);await p.waitForTimeout(1300);
  assert.equal(await p.locator('.beat-rail:not([hidden])').count(),visual?2:0);assert.equal((await p.evaluate(()=>clickBeats.length))>count,click);
 }
 let bpm=await p.evaluate(()=>prototype.playback.tempo.bpm);await p.locator('#tempo-up').click();assert.equal(await p.evaluate(()=>prototype.playback.tempo.bpm),bpm+4);await p.locator('#tempo-down').click();assert.equal(await p.evaluate(()=>prototype.playback.tempo.bpm),bpm);
 await p.locator('#tap-tempo').click();await p.waitForTimeout(600);await p.locator('#tap-tempo').click();assert(Math.abs(await p.evaluate(()=>prototype.playback.tempo.bpm)-100)<15);
 await p.locator('#metronome-visual').click();await p.locator('#metronome-click').click();await p.locator('#metronome-done').click();assert(await p.locator('#metronome-panel').isHidden());await p.waitForTimeout(200);assert.equal(await p.locator('.beat-rail:not([hidden])').count(),2);await metro(p);assert.equal(await p.locator('#metronome-click').getAttribute('aria-pressed'),'true');
 // Shared playback clock: clicks pause with notes, resume, then clean up on stop.
 await p.locator('.score-heading .song-playback').click();await p.waitForFunction(()=>prototype.playback.state==='playing');await p.waitForTimeout(100);await p.locator('.score-heading .song-playback').click();await p.waitForFunction(()=>prototype.playback.state==='paused');await p.waitForTimeout(80);const pausedClicks=await p.evaluate(()=>clickBeats.length);await p.waitForTimeout(500);assert.equal(await p.evaluate(()=>clickBeats.length),pausedClicks);assert.equal(await p.evaluate(()=>prototype.playback.nodes+prototype.playback.clickNodes),0);
 await p.locator('.score-heading .song-playback').click();await p.waitForFunction(()=>prototype.playback.state==='playing');await p.evaluate(()=>prototype.playback.stop());assert.equal(await p.evaluate(()=>prototype.playback.nodes+prototype.playback.clickNodes),0);
 assert.equal(await p.evaluate(()=>localStorage.getItem('music-transpose-metronome-style-v1')),'side-pulse');
 console.log('PASS PDF+XML, all Visual/Click combinations, immediate BPM/tap tempo, Done retains live state');
 await tool(p,'score-annotate');assert(await p.locator('#metronome-panel').isHidden());assert(await p.locator('#pdf-annotation-panel').isVisible());await metro(p);assert(await p.locator('#pdf-annotation-panel').isHidden());assert(!await p.evaluate(()=>document.body.classList.contains('pdf-annotation-active')));
 console.log('PASS exclusive Annotation/Metronome panel ownership');
 for(const [width,height] of [[820,1180],[1440,1000],[390,844]]){
  await p.setViewportSize({width,height});await p.waitForTimeout(200);const r=await p.locator('#metronome-panel').boundingBox();assert(r.x>=0&&r.x+r.width<=width);assert.equal(await p.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);if(width>390)assert(r.height<70);await p.screenshot({path:`test-results/metronome-panel-${width}.png`});
  await p.locator('#settings').click();await p.screenshot({path:`test-results/metronome-settings-${width}.png`});assert.equal(await p.evaluate(()=>document.querySelector('#settings-dialog').scrollWidth>document.querySelector('#settings-dialog').clientWidth),false);await p.locator('#close-settings').click();
 }
 await p.setViewportSize({width:820,height:1180});await p.locator('#next-song').click();await p.waitForFunction(()=>prototype.song!=='hhc-1035');await ready(p);assert(await p.locator('#metronome-panel').isHidden());assert.equal(await p.locator('#metronome-visual').getAttribute('aria-pressed'),'false');assert.equal(await p.locator('#metronome-click').getAttribute('aria-pressed'),'false');assert.equal(await p.locator('.beat-rail:not([hidden])').count(),0);assert.equal(await p.evaluate(()=>prototype.playback.nodes+prototype.playback.clickNodes),0);await metro(p);assert(await p.evaluate(()=>prototype.playback.songKey.startsWith(prototype.song+':')));assert.equal(await p.evaluate(()=>prototype.playback.state),'stopped');
 await p.locator('#metronome-done').click();await p.evaluate(()=>prototype.loadSong('hhc-1035','normal'));await ready(p,'hhc-1035');await metro(p);await p.locator('#metronome-visual').click();await p.waitForFunction(()=>document.querySelectorAll('.beat-rail:not([hidden])').length===2);
 await p.locator('#metronome-done').click();await p.evaluate(()=>prototype.loadSong('choose-to-serve-the-lord'));await ready(p,'choose-to-serve-the-lord');await p.locator('#score-tools').click();assert(await p.locator('#score-metronome').isHidden());assert.equal(await p.locator('.beat-rail:not([hidden])').count(),0);await p.keyboard.press('Escape');
 console.log('PASS structured view, PDF-only hidden, Next song stops live state and prepares new timing; 3 responsive checks');
 // Small timing regression: pickup and compound meter retain the existing clock semantics.
 const timing=await p.evaluate(async()=>{const {scoreTimeline}=await import('./playback.js'),{pulseState}=await import('./metronome.js');const m=(length,tempo=60)=>`<measure><attributes><divisions>2</divisions><time><beats>6</beats><beat-type>8</beat-type></time></attributes><direction><sound tempo="${tempo}"/></direction><note><pitch><step>C</step><octave>4</octave></pitch><duration>${length*2}</duration></note></measure>`;const t=scoreTimeline('<score-partwise><part id="P">'+m(1.5)+m(3,120)+'</part></score-partwise>');return [pulseState(t,.001),pulseState(t,1.501),pulseState(t,2.251)];});assert.deepEqual(timing.map(x=>x.index),[1,0,1]);assert.deepEqual(timing.map(x=>x.side),['left','right','left']);assert.equal(timing[1].downbeat,true);
 assert.deepEqual(errors,[]);console.log('PASS compound meter/pickup/embedded tempo clock regression, no runtime errors');await c.close();
}finally{await browser.close();}
