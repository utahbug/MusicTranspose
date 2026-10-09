import assert from 'node:assert/strict';import fs from 'node:fs';import {createHash} from 'node:crypto';import {createRequire} from 'node:module';import {songs} from '../songs.js';
const numbers=[7,62,100,108,246,270,292,301,307],keys=['F','E♭','F','G','D','F','G','D','B♭'];
const targets=numbers.map((n,i)=>{const matches=songs.filter(s=>s.collection==='Hymns (1985)'&&Number(s.page)===n);assert.equal(matches.length,1);const song=matches[0];assert.equal(createHash('sha256').update(fs.readFileSync(song.asset)).digest('hex'),song.sourceIdentity.sha256,'authoritative source bytes '+n);return {...song,expectedKey:keys[i]};});
const {chromium}=createRequire(process.env.PLAYWRIGHT_PACKAGE||'C:/Users/kenro/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/package.json')('playwright');
const browser=await chromium.launch({channel:'msedge'}),context=await browser.newContext({serviceWorkers:'block'}),p=await context.newPage(),errors=[],renders=[];p.setDefaultTimeout(60000);p.on('pageerror',e=>errors.push(e.message));
try{
 await p.goto(process.env.TEST_URL||'http://127.0.0.1:8780/');await p.waitForFunction(()=>window.prototype?.navigation);
 const audit=await p.evaluate(async targets=>{
  const {unpackMXL,parseXML,originalKey,buildKeys,transposeXML}=await import('./music.js'),{parseChordSymbol}=await import('./chord-symbol.js'),{withGeneratedHarmony}=await import('./generated-harmony.js'),{generatedHarmony}=await import('./generated-harmony-data.js'),{scoreTimeline}=await import('./playback.js');
  const check=(ok,why)=>{if(!ok)throw Error(why);},rows=[];
  for(const s of targets){
   const response=await fetch(s.asset);check(response.ok,s.page+' MXL fetch');const xml=unpackMXL(await response.arrayBuffer()),d=parseXML(xml),key=originalKey(xml,s.modeOverride),directions=[...d.querySelectorAll('direction > direction-type')].map(n=>[...n.querySelectorAll('words')].map(w=>w.textContent).join('')).filter(Boolean),base=scoreTimeline(xml);
   check(key.name===s.expectedKey&&key.mode==='major',s.page+' source key');check(!d.querySelector('harmony'),s.page+' no source harmony');check(directions.every(t=>!parseChordSymbol(t)),s.page+' prose is not a chord');check(!generatedHarmony[s.id],s.page+' no approved overlay');check(await withGeneratedHarmony(xml,s.id)===xml,s.page+' no invented chords');check(buildKeys(key).length===13,s.page+' supported range');
   for(let shift=-6;shift<=6;shift++){
    const out=transposeXML(xml,shift,s.modeOverride),next=parseXML(out),timeline=scoreTimeline(out);check(!next.querySelector('harmony'),s.page+' no invented transposed chords');check([...next.querySelectorAll('words,lyric')].map(n=>n.outerHTML).join('')===[...d.querySelectorAll('words,lyric')].map(n=>n.outerHTML).join(''),s.page+' lyrics/directions preserved');
    check(timeline.notes.length===base.notes.length&&timeline.duration===base.duration,s.page+' playback count/timing');check(timeline.notes.every((n,i)=>n.midi===base.notes[i].midi+shift&&n.start===base.notes[i].start&&n.duration===base.notes[i].duration),s.page+' note-driven playback shift '+shift);check(transposeXML(xml,shift,s.modeOverride)===out,s.page+' repeated transposition stable');check(transposeXML(xml,0,s.modeOverride)===xml,s.page+' exact reset');
   }
   rows.push({number:Number(s.page),id:s.id,title:s.title,key:key.name+' major',sourceSha256:s.sourceIdentity.sha256,harmonyCount:0,chordTextCount:0,generatedOverlay:false,directions:directions.map(t=>t.trim()),transpositions:'-6 through +6 semitones',playableNotes:base.notes.length,playbackOrder:base.order,repeats:base.repeats,outcome:'Source limitation'});
  }return rows;
 },targets);console.log('PASS nine source fingerprints, source annotation audit, no invented chords, 117 key cases, exact reset and note-driven playback');
 const ready=()=>p.waitForFunction(()=>prototype.ready&&!prototype.busy&&!prototype.loading&&document.querySelector('#score').getAttribute('aria-busy')==='false');
 for(const width of [390,820,1440]){await p.setViewportSize({width,height:1000});for(const s of targets){
  await p.evaluate(id=>prototype.loadSong(id),s.id);await ready();
  for(const mode of ['pdf','large']){
   await p.locator('#score-size').click();assert(await p.locator('#score-size-options [data-size=auto]').isDisabled(),s.page+' existing chord-gated Transpose view stays unavailable');const choice=p.locator(`#score-size-options [data-size=${mode}]`);assert(await choice.isEnabled(),s.page+' '+mode+' available');await choice.click();await ready();
   if(mode==='pdf'){assert(await p.locator('.pdf-page-frame').count()>0,s.page+' original PDF');continue;}
   for(const shift of [0,2,-2,2,0]){await p.evaluate(shift=>prototype.changeKey(shift),shift);await ready();assert.equal(await p.evaluate(()=>prototype.current),shift);assert.equal(await p.evaluate(()=>new DOMParser().parseFromString(prototype.viewXML,'application/xml').querySelectorAll('harmony').length),0);assert(await p.locator('#score svg').count()>0);assert(!await p.evaluate(()=>document.documentElement.scrollWidth>innerWidth));}
   const footer=await p.locator('#songs').boundingBox();assert(footer.width>=44&&footer.height>=44&&footer.x>=0&&footer.x+footer.width<=width&&footer.y+footer.height<=1000);renders.push({number:Number(s.page),width,mode,shifts:[0,2,-2,2,0]});
  }
  if(width===820){const play=p.locator('.score-heading .song-playback');await play.click();await p.waitForFunction(()=>prototype.playback.state==='playing');assert(await p.evaluate(()=>prototype.playback.timeline.notes.length>0));await p.evaluate(()=>prototype.playback.stop());}
  console.log('PASS',s.page,width,'PDF/Melody, existing Full-view restriction, repeated key/reset, no chords, footer/overflow');
 }}
 assert.deepEqual(errors,[]);fs.mkdirSync('test-results',{recursive:true});fs.writeFileSync('test-results/chord-priority-nine.json',JSON.stringify({audit,renders},null,2)+'\n');
}finally{await browser.close();}
