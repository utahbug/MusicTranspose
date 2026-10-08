import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
const {chromium}=createRequire('C:/Users/kenro/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/package.json')('playwright');
const browser=await chromium.launch({channel:'msedge'});
try {
 for(const [width,height] of [[320,740],[390,844],[768,1024],[820,1180],[1024,768],[1440,1000]]) {
  const context=await browser.newContext({viewport:{width,height},hasTouch:width<1100,isMobile:width<600,...(width<600?{userAgent:'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Version/17.0 Mobile/15E148 Safari/604.1'}:{})});
  await context.addInitScript(()=>{
   window.audioProbe={contexts:[],notes:[],gains:[]};
   const Native=window.AudioContext;
   window.AudioContext=class extends Native {constructor(...args){super(...args);audioProbe.contexts.push(this);}
    createOscillator(){const o=super.createOscillator(),start=o.start.bind(o);o.start=(...args)=>{audioProbe.notes.push({frequency:o.frequency.value,type:o.type,time:this.currentTime});return start(...args);};return o;}
    createGain(){const g=super.createGain();audioProbe.gains.push(g);return g;}
   };
  });
  const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto('http://127.0.0.1:8780/');await page.waitForFunction(()=>window.prototype?.navigation);
  assert.equal(await page.evaluate(()=>audioProbe.contexts.length),0,'no unsolicited audio');
  const homeIcon=page.locator('#home-keyboard'),icon=await homeIcon.boundingBox();assert(icon.width>=44&&icon.height>=44);assert(icon.x+icon.width<=width);assert.equal(await homeIcon.getAttribute('title'),'Keyboard');
  await homeIcon.click();await page.waitForFunction(()=>!document.getElementById('keyboard-view').hidden);
  assert.equal(await page.locator('#keyboardTitle').textContent(),'MusicTranspose · Keyboard');
  assert.equal(await page.locator('.keyboard-white').count(),15);assert.equal(await page.locator('.keyboard-black').count(),10);
  assert.equal(await page.locator('[data-midi="60"]').getAttribute('aria-label'),'C4');assert.equal(await page.locator('[data-midi="61"]').getAttribute('aria-label'),'C sharp4');
  assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'no page overflow');
  const local=await page.locator('.keyboard-scroll').evaluate(e=>({width:e.clientWidth,scroll:e.scrollWidth}));if(width<700){assert(local.scroll>local.width);await page.locator('.keyboard-scroll').evaluate(e=>{e.scrollLeft=160;});assert(await page.locator('.keyboard-scroll').evaluate(e=>e.scrollLeft>0));await page.locator('.keyboard-scroll').evaluate(e=>{e.scrollLeft=0;});}
  await page.screenshot({path:`test-results/keyboard-${width}.png`,fullPage:true});
  const cKey=page.locator('[data-midi="60"]'),blackKey=page.locator('[data-midi="61"]');
  const play=async(key,midi)=>{await page.evaluate(()=>audioProbe.notes=[]);await key.dispatchEvent('pointerdown',{pointerId:41,pointerType:'touch',button:0});await page.waitForFunction(()=>audioProbe.notes.length>0);assert(await key.evaluate(e=>e.classList.contains('is-playing')));const f=await page.evaluate(()=>audioProbe.notes[0].frequency);assert(Math.abs(f-440*2**((midi-69)/12))<.02,`pitch ${midi}: ${f}`);await key.dispatchEvent('pointerup',{pointerId:41,pointerType:'touch'});assert(!(await key.evaluate(e=>e.classList.contains('is-playing'))));};
  await play(cKey,60);await play(blackKey,61);assert.equal(await page.evaluate(()=>audioProbe.contexts[0].state),'running');
  await page.locator('#keyboardTransposeUp').click();assert.match(await page.locator('#keyboardSoundStatus').textContent(),/Transpose \+1 · C sounds C♯/);await play(cKey,61);
  await page.locator('#keyboardTransposeReset').click();await page.locator('#keyboardTransposeDown').click();assert.match(await page.locator('#keyboardSoundStatus').textContent(),/Transpose -1 · C sounds B/);await play(cKey,59);await page.locator('#keyboardTransposeReset').click();
  await page.locator('#keyboardSound').selectOption('electric-piano');await play(cKey,60);assert.equal(await page.evaluate(()=>audioProbe.notes[0].type),'sine');await page.locator('#keyboardSound').selectOption('bell');await play(blackKey,61);await page.locator('#keyboardSound').selectOption('grand-piano');
  await page.locator('#keyboardVolume').fill('23');await page.waitForTimeout(150);assert(Math.abs(await page.evaluate(()=>audioProbe.gains[0].gain.value)-.23)<.001);await page.locator('#keyboardVolume').fill('58');
  await cKey.dispatchEvent('pointerdown',{pointerId:1,pointerType:'touch'});await blackKey.dispatchEvent('pointerdown',{pointerId:2,pointerType:'touch'});await page.waitForFunction(()=>document.querySelectorAll('.is-playing').length===2);await cKey.dispatchEvent('pointercancel',{pointerId:1});await blackKey.dispatchEvent('pointerup',{pointerId:2});
  await cKey.focus();await page.keyboard.down('Enter');assert(await cKey.evaluate(e=>e.classList.contains('is-playing')));await page.keyboard.up('Enter');
  await page.locator('#pianoChordRoot').selectOption('2');await page.locator('#pianoChordType').selectOption('minor7');assert.match(await page.locator('#pianoChordNotes').textContent(),/D Minor 7th/);assert.equal(await page.locator('.chord-highlight').count(),4);
  await page.evaluate(()=>audioProbe.notes=[]);await page.locator('#pianoChordPlayButton').click();await page.waitForFunction(()=>document.querySelectorAll('.game-preview').length===4);assert.equal(await page.evaluate(()=>audioProbe.notes.length),16);await page.waitForFunction(()=>document.querySelectorAll('.game-preview').length===0);
  await page.locator('#pianoStyle').selectOption('jazz');assert.equal(await page.locator('[data-style-root]').count(),3);await page.locator('[data-style-root]').first().click();assert.match(await page.locator('#pianoChordNotes').textContent(),/Minor 7th/);
  await page.locator('#keyChangeTab').click();assert.equal(await page.locator('#keyChangeTab').getAttribute('aria-selected'),'true');await page.locator('#keyChangeRoot').selectOption('7');await page.locator('#keyChangeUp').click();assert.match(await page.locator('#keyChangeResult').textContent(),/G\s*→\s*A♭/);await page.locator('[data-key-change-step="-2"]').click();assert.equal(await page.locator('#keyChangeSteps').textContent(),'−2');await page.locator('#keyChangeDown').click();assert.equal(await page.locator('#keyChangeSteps').textContent(),'−3');
  await page.screenshot({path:`test-results/keyboard-keys-${width}.png`,fullPage:true});
  await page.locator('#keyChangeTab').press('ArrowRight');assert.equal(await page.locator('#scaleGuideTab').getAttribute('aria-selected'),'true');assert.equal(await page.evaluate(()=>document.activeElement.id),'scaleGuideTab');
  await page.locator('#scaleRoot').selectOption('7');await page.locator('#scaleType').selectOption('blues');assert.match(await page.locator('#scaleResult').textContent(),/G Blues/);assert.equal(await page.locator('.chord-highlight').count(),7);await page.evaluate(()=>audioProbe.notes=[]);await page.locator('#scalePlayButton').click();await page.waitForFunction(()=>audioProbe.notes.length>=8);assert(await page.locator('.game-preview').count()>0);
  // Exit cancels the remaining scheduled scale, including all visual feedback.
  await page.locator('#keyboard-home').click();assert(await page.locator('#library-home').isVisible());await page.waitForTimeout(550);const stopped=await page.evaluate(()=>audioProbe.notes.length);await page.waitForTimeout(550);assert.equal(await page.evaluate(()=>audioProbe.notes.length),stopped);assert.equal(await page.locator('.game-preview,.is-playing').count(),0);
  await page.goBack();assert(await page.locator('#keyboard-view').isVisible());await page.locator('#keyboard-settings').click();await page.locator('#keyboard-view .library-theme-toggle').click();await page.keyboard.press('Escape');assert.equal(await page.locator('html').getAttribute('data-library-theme'),'dark');await page.screenshot({path:`test-results/keyboard-dark-${width}.png`,fullPage:true});
  assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));await page.locator('#keyboard-settings').click();await page.locator('#keyboard-view .library-theme-toggle').click();await page.keyboard.press('Escape');await page.goForward();assert(await page.locator('#library-home').isVisible());

  if(width===820){
   await page.locator('#home-keyboard').click();await page.locator('#scaleGuideTab').click();await page.locator('#scaleRoot').selectOption('0');await page.locator('#scaleType').selectOption('major');
   await page.evaluate(()=>audioProbe.notes=[]);await page.locator('#scalePlayButton').click();await page.waitForFunction(()=>audioProbe.notes.length===60);await page.waitForFunction(()=>!document.querySelector('.game-preview'));
   const midis=await page.evaluate(()=>audioProbe.notes.filter((_,i)=>i%4===0).map(n=>Math.round(69+12*Math.log2(n.frequency/440))));assert.deepEqual(midis,[60,62,64,65,67,69,71,72,71,69,67,65,64,62,60]);
   const times=await page.evaluate(()=>audioProbe.notes.filter((_,i)=>i%4===0).map(n=>n.time));assert(times.slice(1).every((t,i)=>Math.abs(t-times[i]-.47)<.12));
   await page.evaluate(()=>{window.analyser=audioProbe.contexts[0].createAnalyser();audioProbe.gains[0].connect(analyser);});await cKey.dispatchEvent('pointerdown',{pointerId:52,pointerType:'touch'});await page.waitForTimeout(100);assert(await page.evaluate(()=>{const data=new Float32Array(analyser.fftSize);analyser.getFloatTimeDomainData(data);return data.some(x=>Math.abs(x)>.001);}),'real audio output is non-silent');await cKey.dispatchEvent('pointerup',{pointerId:52});
   await page.locator('#keyboardTransposeUp').click();await page.reload();await page.waitForFunction(()=>window.prototype?.navigation);if(await page.locator('#keyboard-view').isHidden())await page.locator('#home-keyboard').click();assert.match(await page.locator('#keyboardSoundStatus').textContent(),/Transpose \+1/);await page.locator('#keyboardTransposeReset').click();
   await page.evaluate(()=>scrollTo(0,document.documentElement.scrollHeight));const footer=await page.locator('#keyboard-view .workspace-return').boundingBox();assert(footer.y+footer.height<=height+.5);const last=await page.locator('#keyboard-view .keyboard-panel').boundingBox();assert(last.y+last.height<=footer.y);await page.locator('#keyboard-home').click();
   console.log('PASS full ascending/descending scale timing, non-silent Web Audio, settings persistence, footer clearance');
  }
  if(width===1440){
   // Existing Score playback smoke only: one score, play/pause/resume/stop.
   await page.evaluate(()=>prototype.loadSong('nativity'));await page.waitForFunction(()=>prototype.ready&&!prototype.busy&&document.getElementById('score').getAttribute('aria-busy')==='false');
   const playButton=page.locator('.score-heading .song-playback');await playButton.click();await page.waitForFunction(()=>prototype.playback.state==='playing');assert(await page.evaluate(()=>prototype.playback.nodes>0));await playButton.click();assert.equal(await playButton.getAttribute('aria-label'),'Resume song');const position=await page.evaluate(()=>prototype.playback.position);await page.waitForTimeout(100);assert.equal(await page.evaluate(()=>prototype.playback.position),position);await playButton.click();await page.waitForFunction(()=>prototype.playback.state==='playing');await playButton.click({button:'right'});assert.equal(await page.evaluate(()=>prototype.playback.nodes),0);assert.equal(await playButton.getAttribute('aria-label'),'Play song');await page.locator('#songs').click();assert(await page.locator('#library-home').isVisible());await page.locator('#home-keyboard').click();assert(await page.locator('#keyboard-view').isVisible());await page.locator('#keyboard-home').click();console.log('PASS existing Score playback and return to Home/Keyboard');
  }

  assert.deepEqual(errors,[]);console.log('PASS Keyboard controls/audio/guides/history/theme/layout',width);await context.close();
 }
}finally{await browser.close();}
