import {createRequire} from 'node:module';
import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
const require=createRequire(process.env.PLAYWRIGHT_PACKAGE || import.meta.url);const {chromium}=require('playwright');
const base=process.env.TEST_URL||'http://127.0.0.1:8767/';
const browser=await chromium.launch({channel:'msedge',headless:true});const context=await browser.newContext({viewport:{width:1180,height:820},hasTouch:true});const page=await context.newPage();const errors=[],remote=[];
page.on('pageerror',e=>errors.push(e.message));context.on('request',r=>{if(!r.url().startsWith(base)&&!r.url().startsWith('data:'))remote.push(r.url());});
const done=shift=>page.waitForFunction(s=>window.prototype?.ready&&!prototype.busy&&prototype.current===s&&document.getElementById('score').getAttribute('aria-busy')==='false',shift,{timeout:30000});
await page.goto(base);await page.locator('[data-song="nativity"] .song-entry').click();await done(0);await page.evaluate(()=>navigator.serviceWorker.ready);await page.waitForFunction(()=>navigator.serviceWorker.controller!==null);

const results=[];let originalCredits='';
async function verify(shift,fifths,label){
 await done(shift);
 const result=await page.evaluate(({shift,fifths})=>{
  const parse=x=>new DOMParser().parseFromString(x,'application/xml');const a=parse(prototype.original),b=parse(prototype.xml);const nat={C:0,D:2,E:4,F:5,G:7,A:9,B:11};
  const nval=n=>(Number(n.querySelector('octave').textContent)+1)*12+nat[n.querySelector('step').textContent]+Number(n.querySelector('alter')?.textContent||0);
  const an=[...a.querySelectorAll('note > pitch')],bn=[...b.querySelectorAll('note > pitch')];
  const pitchOK=an.length===bn.length&&an.every((n,i)=>nval(bn[i])-nval(n)===shift);
  let chords=0,chordsOK=true;for(const kind of ['root','bass']){const get=d=>[...d.querySelectorAll('harmony > '+kind)];const aa=get(a),bb=get(b);chords+=aa.length;if(aa.length!==bb.length)chordsOK=false;for(let i=0;i<aa.length;i++){const val=x=>nat[x.querySelector(kind+'-step').textContent]+Number(x.querySelector(kind+'-alter')?.textContent||0);if(((val(bb[i])-val(aa[i])-shift)%12+12)%12!==0)chordsOK=false;}}
  const s=new XMLSerializer(),list=(d,selector)=>[...d.querySelectorAll(selector)].map(e=>s.serializeToString(e));
  const unchanged={};for(const sel of ['lyric','fingering','duration','voice','staff','time','notations','direction','barline','credit','backup','forward'])unchanged[sel]=JSON.stringify(list(a,sel))===JSON.stringify(list(b,sel));
  const stripped=d=>{for(const x of d.querySelectorAll('note > pitch, note > accidental, attributes > key > fifths, harmony > root, harmony > bass'))x.remove();return s.serializeToString(d);};
  return{pitchOK,noteCount:an.length,chordsOK,chordCount:chords,keyOK:[...b.querySelectorAll('attributes > key > fifths')].every(e=>Number(e.textContent)===fifths),unchanged,allOtherXMLUnchanged:stripped(a)===stripped(b),svgNotes:document.querySelectorAll('#score .vf-stavenote').length,svgCount:document.querySelectorAll('#score svg').length,svgText:document.getElementById('score').textContent,metrics:prototype.metrics.at(-1),viewportOverflow:document.documentElement.scrollWidth>innerWidth,svgWidth:document.querySelector('#score svg').getBoundingClientRect().width};
 },{shift,fifths});
 assert.equal(await page.locator('.key-choice[aria-pressed=true]').getAttribute('data-shift'),String(shift));assert.equal(await page.locator('#original .marker').textContent(),shift===0?'Original · Current':'Original · 0');assert(result.pitchOK,label+' pitches');assert(result.chordsOK,label+' chords');assert(result.keyOK,label+' signature');assert(Object.values(result.unchanged).every(Boolean),label+' invariants');assert(result.allOtherXMLUnchanged,label+' other XML');assert(result.svgCount>0);assert(!result.viewportOverflow,label+' overflow');assert.equal(await page.locator('#source-credits').textContent(),originalCredits);results.push({label,shift,...result,svgText:undefined});console.log(label,'PASS',result.noteCount,'notes',result.chordCount,'harmonies',result.metrics.ms.toFixed(1)+'ms');
}

const missing=[];page.on('response',r=>{if(r.status()>=400)missing.push({url:r.url(),status:r.status()});});
assert.equal(await page.locator('.song-entry strong').count(),121);
async function select(id){await page.locator('#songs').click();await page.locator(`[data-song="${id}"] .song-entry`).click();await page.waitForFunction(id=>prototype.song===id&&prototype.ready&&!prototype.busy&&prototype.current===0,id);}
for(const song of [{id:'faithful',key:'G',fifths:1,up:['A♭','A','B♭','B','C','D♭'],down:['G♭','F','E','E♭','D','D♭'],upF:[-4,3,-2,5,0,-5],downF:[-6,-1,4,-3,2,-5]}, {id:'silent-night',key:'B♭',fifths:-2,up:['B','C','D♭','D','E♭','E'],down:['A','A♭','G','G♭','F','E'],upF:[5,0,-5,2,-3,4],downF:[3,-4,1,-6,-1,4]}]){
 await select(song.id);originalCredits=await page.locator('#source-credits').textContent();const original=await page.evaluate(()=>prototype.original),svg=await page.locator('#score').innerHTML();await verify(0,song.fifths,song.id+' original');
 assert.equal(await page.locator('#key-name').textContent(),song.key+' major');assert.deepEqual(await page.locator('#higher .name').allTextContents(),song.up);assert.deepEqual(await page.locator('#lower .name').allTextContents(),song.down);
 assert.deepEqual(await page.locator('#higher .distance').allTextContents(),['+1','+2','+3','+4','+5','+6']);assert.deepEqual(await page.locator('#lower .distance').allTextContents(),['-1','-2','-3','-4','-5','-6']);
 await page.locator('#up').click();await verify(1,song.upF[0],song.id+' quick up');await page.locator('#reset').click();await done(0);await page.locator('#down').click();await verify(-1,song.downF[0],song.id+' quick down');
 for(const dir of [1,-1])for(let n=1;n<=6;n++){await page.locator('#key').click();await page.locator(`[data-shift="${dir*n}"]`).click();await verify(dir*n,(dir>0?song.upF:song.downF)[n-1],song.id+' '+dir*n);if(n===2)await page.screenshot({path:`test-results/hymn-${song.id}-${dir*n}.png`,fullPage:true});}
 await page.locator('#reset').click();await done(0);assert.equal(await page.evaluate(()=>prototype.xml),original);assert.equal(await page.locator('#score').innerHTML(),svg);
 await page.evaluate(async()=>{for(let i=0;i<10;i++){document.getElementById('up').click();await new Promise(r=>setTimeout(r,9));document.getElementById('down').click();await new Promise(r=>setTimeout(r,9));}document.getElementById('up').click();document.getElementById('up').click();});await verify(2,song.upF[1],song.id+' rapid +2');await page.locator('#reset').click();await done(0);assert.equal(await page.evaluate(()=>prototype.xml),original);
}
for(const viewport of [{width:1180,height:820},{width:820,height:1180}]){
 await page.setViewportSize(viewport);await page.waitForTimeout(450);
 for(const [id,key] of [['nativity','G major'],['shepherd','D minor'],['faithful','G major'],['silent-night','B♭ major']]){
  await select(id);assert.equal(await page.locator('#key-name').textContent(),key);assert(await page.locator('#score svg').count()>0);assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
  await page.locator('#key').click();assert(await page.locator('.key-choice').evaluateAll(es=>es.every(e=>{const r=e.getBoundingClientRect();return r.width>=44&&r.height>=44&&r.bottom<=innerHeight;})));await page.keyboard.press('Escape');
  await page.screenshot({path:`test-results/four-songs-${id}-${viewport.width}.png`});await page.locator('#up').click();await done(1);await page.locator('#down').click();await done(0);assert(await page.evaluate(()=>prototype.xml===prototype.original));await page.locator('#up').click();await done(1);
 }
 await page.locator('#songs').click();assert(await page.locator('.song-entry').evaluateAll(es=>es.every(e=>{const r=e.getBoundingClientRect();return r.height>=44&&r.bottom<=innerHeight;})));await page.screenshot({path:`test-results/four-song-chooser-${viewport.width}.png`});await page.locator('#resume-score').click();await page.locator('#reset').click();await done(0);
}
await context.setOffline(true);await page.reload();await page.locator('[data-song="nativity"] .song-entry').click();await done(0);for(const id of ['nativity','shepherd','faithful','silent-night'])await select(id);await context.setOffline(false);
for(const asset of ['assets/nativity.mxl','assets/shepherd.mxl','assets/faithful.mxl','assets/silent-night.mxl','assets/icons/favicon.svg','assets/icons/apple-touch-icon.png','manifest.webmanifest'])assert.equal((await page.request.get(base+asset)).status(),200,asset);
assert.deepEqual(missing,[]);assert.deepEqual(remote,[]);assert.deepEqual(errors,[]);
await fs.writeFile('test-results/four-songs.json',JSON.stringify({base,results,offlineAllFour:true,missing,remote,errors},null,2));await browser.close();console.log('Four-song verification passed');
