import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {createRequire} from 'node:module';
import {songs} from '../songs.js';
const {chromium,webkit}=createRequire(process.env.PLAYWRIGHT_PACKAGE||'C:/Users/kenro/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/package.json')('playwright');
const engine=process.env.WEBKIT?'webkit':'chromium',b=await(process.env.WEBKIT?webkit.launch():chromium.launch({channel:'msedge'}));
const id='song-95273aa4-6219-4608-a682-8db1ff47c3eb',song=songs.find(s=>s.id===id),out='test-results/hymn70';await fs.mkdir(out,{recursive:true});
try{
 const p=await b.newPage({viewport:{width:820,height:1180},serviceWorkers:'block',acceptDownloads:true});p.setDefaultTimeout(90000);
 await p.goto(process.env.TEST_URL||'http://127.0.0.1:8792/');await p.waitForFunction(()=>window.prototype?.navigation);
 const ready=()=>p.waitForFunction(()=>prototype.ready&&!prototype.busy&&!prototype.loading&&document.getElementById('score').getAttribute('aria-busy')==='false');
 const source=await p.evaluate(async song=>{
  const {unpackMXL}=await import('./music.js'),{hymn70FullScore,hymn70Engraving}=await import('./hymn70-score.js'),{createLeadXML}=await import('./lead-view.js'),{scoreTimeline}=await import('./playback.js');
  const xml=unpackMXL(await(await fetch(song.asset)).arrayBuffer()),fixed=hymn70FullScore(xml,song),parse=x=>new DOMParser().parseFromString(x,'application/xml'),a=parse(xml),z=parse(fixed),ser=n=>new XMLSerializer().serializeToString(n);
  if(a.querySelectorAll('score-partwise > part').length!==6||z.querySelectorAll('score-partwise > part').length!==2)throw Error('part count');
  for(const part of z.querySelectorAll('score-partwise > part'))if(ser(part)!==ser(a.querySelector('part[id='+part.id+']')))throw Error('print part changed');
  if(hymn70FullScore(xml,{...song,id:'other'})!==xml||hymn70FullScore(xml,{...song,local:true})!==xml||hymn70FullScore(fixed,song)!==fixed)throw Error('scope/idempotence');
  const altered=xml.replace('<part id="P6">','<part id="P6"><measure number="extra"><note><pitch><step>C</step><octave>8</octave></pitch><duration>1</duration></note></measure>');
  if(hymn70FullScore(altered,song)!==altered)throw Error('unique material protection');
  const baseline=scoreTimeline(xml),timeline=scoreTimeline(fixed),expected=baseline.notes.filter(n=>n.part==='P1'||n.part==='P2');
  if(JSON.stringify(timeline.notes)!==JSON.stringify(expected)||timeline.duration!==baseline.duration)throw Error('playback preservation');
  const engraving=hymn70Engraving(fixed,song);if(!engraving.includes('music-transpose-rh-gap')||fixed.includes('music-transpose-rh-gap'))throw Error('engraving separation');
  return {fixed,lead:createLeadXML(xml,song).xml,native:z.querySelectorAll('harmony').length,verses:[...new Set([...z.querySelectorAll('lyric')].map(n=>n.getAttribute('number')))],timeline,rawNotes:baseline.notes.length};
 },song);
 assert.equal(source.native,30);assert.deepEqual(source.verses,['1','2','3','4']);
 await p.evaluate(id=>prototype.loadSong(id,'normal'),id);await ready();
 for(const shift of [0,-2,3]){
  await p.evaluate(n=>prototype.changeKey(n),shift);await ready();
  const result=await p.evaluate(async({source,shift})=>{const {transposeXML}=await import('./music.js');const xml=prototype.xml,d=new DOMParser().parseFromString(xml,'application/xml');return {xml,expected:transposeXML(source,shift),parts:d.querySelectorAll('score-partwise > part').length,harmonies:d.querySelectorAll('harmony').length};},{source:source.fixed,shift});
  assert.equal(result.parts,2);assert.equal(result.harmonies,30);assert.equal(result.xml,result.expected);
  await p.locator('#score-tools').click();await p.locator('#score-export').click();const pending=p.waitForEvent('download');await p.locator('#score-export-xml').click();const download=await pending;assert.equal(await download.failure(),null);assert.match(download.suggestedFilename(),/Hymns 1985 70/);const bytes=await fs.readFile(await download.path());assert.equal(bytes.toString(),result.xml);await fs.writeFile(`${out}/${engine}-${shift}.musicxml`,bytes);
 }
 await p.locator('#reset').click();await ready();assert.equal(await p.evaluate(()=>prototype.current),0);assert.equal(await p.evaluate(()=>prototype.xml),source.fixed);
 if(engine==='chromium'){await p.locator('.score-heading .song-playback').click();await p.waitForFunction(()=>prototype.playback.state==='playing');assert.deepEqual(await p.evaluate(()=>prototype.playback.timeline.notes),source.timeline.notes);await p.locator('.score-heading .song-playback').click({button:'right'});await p.waitForFunction(()=>prototype.playback.state==='stopped');}else console.log('LIMITATION: Windows WebKit playback start timed out; real audio start/stop covered in Chromium, timeline checked in both engines.');
 for(const width of [320,390,744,820,1024,1440]){
  await p.setViewportSize({width,height:1180});await p.waitForTimeout(800);await ready();
  const collisions=await p.evaluate(()=>{
   const replacements=[],bad=[];let seen=0;for(const use of document.querySelectorAll('#score .mxl-page-frame svg[data-system-start] > use')){const clone=document.querySelector(use.getAttribute('href')).cloneNode(true);clone.removeAttribute('id');use.replaceWith(clone);replacements.push([clone,use]);}
   for(const svg of document.querySelectorAll('#score .mxl-page-frame svg[data-system-start]')){const clip=svg.getBoundingClientRect();if(!clip.width)continue;const texts=[...svg.querySelectorAll('text')].filter(n=>n.closest('.lyrics')).map(n=>({text:n.textContent,r:n.getBoundingClientRect()})).filter(n=>n.r.width&&(n.r.top+n.r.bottom)/2>=clip.top&&(n.r.top+n.r.bottom)/2<=clip.bottom);seen+=texts.length;for(let i=0;i<texts.length;i++)for(const z of texts.slice(i+1)){const a=texts[i],x=Math.min(a.r.right,z.r.right)-Math.max(a.r.left,z.r.left),y=Math.min(a.r.bottom,z.r.bottom)-Math.max(a.r.top,z.r.top);if(x>1&&y>2)bad.push([a.text,z.text,x,y]);}}
   for(const [clone,use]of replacements)clone.replaceWith(use);if(!seen)throw Error('No lyric boxes measured');return bad;
  });assert.deepEqual(collisions,[],`${engine} ${width} lyrics`);assert(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));await p.screenshot({path:`${out}/${engine}-${width}.png`,fullPage:true});console.log('PASS lyrics/overflow/screenshot',engine,width);
 }
 await p.locator('#score-size').click();await p.locator('#score-size-options [data-size=large]').click();await ready();assert.equal(await p.evaluate(()=>prototype.viewXML),source.lead);
 await p.locator('#score-size').click();await p.locator('#score-size-options [data-size=pdf]').click();await ready();assert.match(await p.locator('#pdf-original').getAttribute('href'),/song-95273aa4-6219-4608-a682-8db1ff47c3eb.pdf/);
 const other=songs.find(s=>Number(s.page)===190&&s.collection.includes('Songbook'));assert(other);await p.evaluate(id=>prototype.loadSong(id,'normal'),other.id);await ready();assert.equal(await p.evaluate(async other=>{const {hymn70FullScore,hymn70Engraving}=await import('./hymn70-score.js');return hymn70FullScore(prototype.original,other)===prototype.original&&hymn70Engraving(prototype.original,other)===prototype.original;},other),true);
 console.log('PASS two exact preserved print parts, source guard, four verses, 30 harmonies, D/C/F export, Reset, playback timeline, unchanged Melody/PDF and CS190 scope; source playback notes',source.rawNotes,'corrected',source.timeline.notes.length);
}finally{await b.close();}
