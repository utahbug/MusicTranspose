import fs from 'node:fs';import assert from 'node:assert/strict';import {createRequire} from 'node:module';
const {chromium}=createRequire(process.env.PLAYWRIGHT_PACKAGE||'C:/Users/kenro/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/package.json')('playwright');const b=await chromium.launch({channel:'msedge'});
try{const p=await b.newPage();await p.goto(process.env.TEST_URL||'http://127.0.0.1:8780/');const result=await p.evaluate(async()=>{
 const {songs}=await import('./songs.js'),{unpackMXL,parseXML}=await import('./music.js'),{screenSecondaryLyrics}=await import('./screen-secondary-lyrics.js'),{createLeadXML}=await import('./lead-view.js'),{scoreTimeline}=await import('./playback.js'),{pulseState}=await import('./metronome.js'),{withGeneratedHarmony}=await import('./generated-harmony.js');
 const check=(ok,msg)=>{if(!ok)throw Error(msg);},same=(a,b)=>JSON.stringify(a)===JSON.stringify(b),serialize=d=>new XMLSerializer().serializeToString(d);
 const matches=[],errors=[];let total=0;const controls=[];
 for(const song of songs.filter(s=>s.scoreType!=='pdf')){total++;const raw=unpackMXL(await(await fetch(song.asset)).arrayBuffer()),clean=screenSecondaryLyrics(raw);
  if(clean.suppressed.length)matches.push({id:song.id,title:song.title,collection:song.collection,page:song.page,suppressed:clean.suppressed});else check(clean.xml===raw,'Unmatched XML must be byte-identical');
  if(song.collection==='Hymns (1985)'&&['202','223','68','204','212'].includes(String(song.page))){check(clean.xml===raw,'Legitimate lyric/direction control changed');controls.push({id:song.id,title:song.title,page:song.page,lyrics:parseXML(raw).querySelectorAll('lyric').length,words:parseXML(raw).querySelectorAll('direction words').length});}
  if(song.collection!=='Hymns (1985)'||String(song.page)!=='201')continue;
  check(song.id==='song-b84d63a6-cb12-4f44-a1b5-c83641a234f9','Stable ID');check(clean.suppressed.length===1&&clean.suppressed[0].count===12,'Expected 12 secondary syllables');
  const expected=parseXML(raw);for(const l of expected.querySelectorAll('part[id="P2"] lyric[number="5"]'))l.remove();check(serialize(expected)===clean.xml,'Only proven secondary lyrics removed');
  const canonical=await withGeneratedHarmony(raw,song.id),before=canonical,screen=screenSecondaryLyrics(canonical);check(canonical===before,'Canonical input changed');
  const timeline=scoreTimeline(canonical),other=scoreTimeline(screen.xml);check(same(timeline,other),'Timing changed');for(let t=0;t<timeline.duration;t+=.25)check(same(pulseState(timeline,t),pulseState(other,t)),'Metronome pulse changed');
  check(same([...parseXML(canonical).querySelectorAll('harmony')].map(serialize),[...parseXML(screen.xml).querySelectorAll('harmony')].map(serialize)),'Harmony changed');
  const lead=createLeadXML(canonical,song);check(lead.ok,'Melody source unavailable');check(screenSecondaryLyrics(lead.xml).xml===lead.xml,'Melody changed');
  const negative=(edit,msg)=>{const d=parseXML(raw);edit(d);const x=serialize(d);check(screenSecondaryLyrics(x).xml===x,msg);};
  negative(d=>d.querySelector('part[id="P2"] lyric text').textContent='Unique','Unique bass text must survive');
  negative(d=>{for(const l of d.querySelectorAll('part[id="P2"] lyric'))l.setAttribute('number','1');},'Normal verse lane must survive');
  negative(d=>{const n=d.querySelector('part[id="P2"] lyric').parentNode;n.querySelector('pitch').remove();n.prepend(d.createElement('rest'));},'Rest lyric must survive');
  negative(d=>{d.querySelector('score-part[id="P2"] instrument-name').textContent='Choir';d.querySelector('score-part[id="P2"] midi-program').textContent='53';},'Vocal bass lyrics must survive');
  negative(d=>d.querySelector('part[id="P2"] clef sign').textContent='G','Unknown lower ownership must survive');
  negative(d=>d.querySelector('part[id="P2"] lyric').append(d.createElement('laughing')),'Unique lyric markup must survive');
 }
 return {total,matches,controls,errors};
});assert.equal(result.matches.length,1);assert.equal(result.matches[0].page,'201');assert.equal(result.controls.length,5);fs.writeFileSync('test-results/201-secondary-audit.json',JSON.stringify(result,null,2));console.log('PASS',result.total,'structured sources; only Hymn 201 qualifies; exact removal, negative guards, timing/metronome, harmony and Melody invariance;',result.controls.length,'controls');}finally{await b.close();}
