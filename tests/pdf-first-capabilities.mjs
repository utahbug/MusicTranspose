import {createRequire} from 'node:module';
import assert from 'node:assert/strict';
const engines=createRequire(process.env.PLAYWRIGHT_PACKAGE)('playwright'),engine=process.env.WEBKIT?'webkit':'chromium';
const browser=await engines[engine].launch(engine==='chromium'?{channel:'msedge',headless:true}:{});
try{for(const [width,height] of [[390,844],[820,1180],[1180,820],[1440,1000]]){
 if(process.env.CAP_WIDTH&&width!==Number(process.env.CAP_WIDTH))continue;
 const c=await browser.newContext({viewport:{width,height},serviceWorkers:'block'}),p=await c.newPage(),errors=[],requests=[];
 p.on('pageerror',e=>errors.push(e.message));p.on('request',r=>requests.push(r.url()));
 await c.addInitScript(()=>localStorage.setItem('music-transpose-navigation-v1',JSON.stringify({mode:'pages'})));
 await p.goto(process.env.TEST_URL||'http://127.0.0.1:8780/');await p.locator('.library-row').first().waitFor();
 const ready=async()=>{await p.waitForFunction(()=>prototype.ready&&!prototype.busy&&document.querySelector('#score').getAttribute('aria-busy')==='false');await p.waitForTimeout(150);};
 const open=async id=>{await p.locator('#library-search').fill(id==='hhc-1035'?'As I Keep the Sabbath Day':'The Spirit of God');await p.locator(`[data-song="${id}"] .song-entry`).click();await ready();};
 const view=async name=>{await p.locator('#score-size').click();await p.locator(`#score-size-options [data-size=${name}]`).click();await ready();};
 const pdf=async()=>{assert(await p.locator('#score .pdf-page-frame').count()>0);assert.equal(await p.locator('#score svg').count(),0);assert.equal(await p.locator('#score-view-label').textContent(),'Original');};
 const settings=async()=>{await p.locator('#settings').click();await p.waitForFunction(()=>!document.querySelector('#playback-settings').hidden&&document.querySelector('#tempo-value').textContent.includes('BPM'));};
 for(const id of ['hhc-1035','song-a13c43da-0243-4019-ad08-d7be530074f5']){
  const asset=await p.evaluate(async id=>(await import('./catalog.js')).songs.find(s=>s.id===id).asset,id),count=()=>requests.filter(u=>u.endsWith(asset.replace('./',''))).length;
  const initial=count(),renders=await p.evaluate(()=>prototype.metrics.length);await open(id);await pdf();assert.equal(count(),initial+1,'retain the source load used by Original MusicXML export');assert(await p.evaluate(()=>prototype.original.length>0));assert.equal(await p.evaluate(()=>prototype.lead),null);
  assert(await p.locator('#score-size-options [data-size=large]').isEnabled());assert(await p.locator('#score-size-options [data-size=auto]').isEnabled());
  const markup=await p.locator('#score').innerHTML();await settings();assert.equal(count(),initial+1,'timing reuses the cached source');assert.equal(await p.evaluate(()=>prototype.metrics.length),renders);assert.equal(await p.locator('#score').innerHTML(),markup,'timing parsing leaves PDF untouched');assert.equal(await p.locator('#score-export-xml').isEnabled(),true,'Original MusicXML export remains available');
  await p.locator('#metronome-mode').selectOption('dots');await p.locator('#close-settings').click();await p.waitForFunction(()=>document.querySelectorAll('.beat-rail:not([hidden])').length===2);await pdf();
  await p.waitForFunction(()=>Number(document.querySelector('.beat-rail-left').dataset.sequence)>0);
  const seq=Number(await p.locator('.beat-rail-left').getAttribute('data-sequence'));await p.keyboard.press('ArrowRight');assert(Number(await p.locator('.beat-rail-left').getAttribute('data-sequence'))>=seq);
  if(engine==='chromium'){await p.locator('.score-heading .song-playback').click();await p.waitForFunction(()=>prototype.playback.state==='playing');await pdf();await p.evaluate(()=>prototype.playback.stop());}
  await p.locator('#show-lyrics').click();await p.locator('#lyrics-view').waitFor({state:'visible'});assert.equal(await p.locator('.beat-rail:visible').count(),0);await p.locator('.lyrics-score-toggle').click();await ready();await pdf();await settings();await p.locator('#tempo-up').click();const rate=await p.evaluate(()=>prototype.playback.tempo.rate);await p.locator('#metronome-mode').selectOption('off');await p.locator('#close-settings').click();
  await view('large');assert(await p.evaluate(()=>prototype.lead?.ok));assert.equal(await p.locator('#score-view-label').textContent(),'Melody only');assert.equal(count(),initial+1);assert(await p.locator('#score svg').count()>0);
  await p.evaluate(()=>prototype.changeKey(1));await ready();await p.evaluate(()=>prototype.changeOctave(1));await ready();const state=await p.evaluate(()=>({xml:prototype.viewXML,key:prototype.current,octave:prototype.octaveState}));
  await view('pdf');await settings();assert.equal(await p.evaluate(()=>prototype.playback.tempo.rate),rate);await p.locator('#close-settings').click();
  // Original timing always uses the full source, never a retained Melody timeline.
  assert(await p.evaluate(async()=>{const {scoreTimeline}=await import('./playback.js');return JSON.stringify(prototype.playback.timeline)===JSON.stringify(scoreTimeline(prototype.original));}));
  await view('large');assert.deepEqual(await p.evaluate(()=>({xml:prototype.viewXML,key:prototype.current,octave:prototype.octaveState})),state);
  await view('pdf');await view('auto');assert.equal(await p.evaluate(()=>prototype.current),1);assert(await p.locator('#score svg').count()>0);
  await p.locator('#songs').click();await p.locator('#library').waitFor({state:'visible'});
 }
 // Fresh Original -> Transpose, independent of Melody preparation.
 await p.evaluate(()=>prototype.loadSong('cs-12'));await ready();await pdf();assert(await p.locator('#score-size-options [data-size=large]').isDisabled());await view('auto');assert(await p.locator('#score svg').count()>0);
 // True PDF-only: no structured capabilities or fabricated timing.
 await p.evaluate(()=>prototype.loadSong('choose-to-serve-the-lord'));await ready();await pdf();assert(await p.locator('#score-size-options [data-size=large]').isDisabled());assert(await p.locator('#score-size-options [data-size=auto]').isDisabled());await p.locator('#settings').click();assert(await p.locator('#playback-settings').isHidden());await p.locator('#close-settings').click();assert.equal(await p.locator('.beat-rail:visible').count(),0);assert.equal(await p.locator('.score-heading .song-playback').count(),0);
 // Import a real supported XML source to exercise the local leadAvailable model.
 // Windows WebKit cannot persist File/Blob to IndexedDB (also verified with pre-change app).
 if(width===820&&engine==='chromium'){const xml=await p.evaluate(async()=>{const {unpackMXL}=await import('./music.js');return unpackMXL(await(await fetch('./assets/scores/hhc-1054.mxl')).arrayBuffer());});await p.locator('#songs').click();await p.locator('#library-more').click();await p.locator('#library-import').click();await p.locator('#music-file').setInputFiles({name:'Capability XML-only.musicxml',mimeType:'application/xml',buffer:Buffer.from(xml)});await p.waitForFunction(()=>!document.querySelector('#import-save').disabled);await p.locator('#import-save').click();await p.locator('#music-import').waitFor({state:'hidden'});const id=await p.evaluate(async()=>(await(await import('./local-music-store.js')).localMetadata())[0].id);await p.evaluate(id=>prototype.loadSong(id),id);await ready();assert(await p.locator('#score-size-options [data-size=pdf]').isDisabled());assert(await p.locator('#score-size-options [data-size=large]').isEnabled());await settings();await p.locator('#close-settings').click();await view('large');assert(await p.evaluate(()=>prototype.lead?.ok));}
 assert.deepEqual(errors,[]);console.log('PASS PDF-first capabilities',engine,width,height,'lazy parse-only timing, direct Melody, state roundtrip, PDF-only',width===820&&engine==='chromium'?'XML-only import':'');await c.close();
}}finally{await browser.close();}
