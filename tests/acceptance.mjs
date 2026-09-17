import {createRequire} from 'node:module';
import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
const require=createRequire(process.env.PLAYWRIGHT_PACKAGE || import.meta.url);const {chromium}=require('playwright');
const base=process.env.TEST_URL||'http://127.0.0.1:8767/';
const browser=await chromium.launch({channel:'msedge',headless:true});const context=await browser.newContext({viewport:{width:1180,height:820},hasTouch:true});const page=await context.newPage();const errors=[],remote=[];
page.on('pageerror',e=>errors.push(e.message));context.on('request',r=>{if(!r.url().startsWith(base)&&!r.url().startsWith('data:'))remote.push(r.url());});
const done=shift=>page.waitForFunction(s=>window.prototype?.ready&&!prototype.busy&&prototype.current===s&&document.getElementById('score').getAttribute('aria-busy')==='false',shift,{timeout:30000});
await page.goto(base);await done(0);await page.evaluate(()=>navigator.serviceWorker.ready);await page.waitForFunction(()=>navigator.serviceWorker.controller!==null);
assert.equal(await page.locator('#down').textContent(),'↓');assert.equal(await page.locator('#up').textContent(),'↑');assert.equal(await page.locator('#close-dialog').textContent(),'×');assert.equal(await page.locator('.subtitle').textContent(),'Children’s Songbook · 52');
assert.equal(await page.locator('#reset').textContent(),'↺');assert.equal(await page.locator('#reset').getAttribute('aria-label'),'Reset to original key');
const originalSVG=await page.locator('#score').innerHTML();const originalCredits=await page.locator('#source-credits').textContent();
assert(originalCredits.includes('4.')&&originalCredits.includes('5.'));assert(!originalCredits.includes('\\n'));
const results=[];
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
await verify(0,1,'Original G');
const expectedG={higher:['A♭','A','B♭','B','C','D♭'],lower:['G♭','F','E','E♭','D','D♭']};
async function checkChooser(expected){
 assert.deepEqual(await page.locator('#higher .name').allTextContents(),expected.higher);
 assert.deepEqual(await page.locator('#lower .name').allTextContents(),expected.lower);
 assert.deepEqual(await page.locator('#higher .distance').allTextContents(),['+1','+2','+3','+4','+5','+6']);
 assert.deepEqual(await page.locator('#lower .distance').allTextContents(),['-1','-2','-3','-4','-5','-6']);
 assert.equal(await page.locator('#original .marker').textContent(),'Original · Current');
 assert.equal(await page.locator('.key-choice').count(),13);
 const css=await page.locator('#higher .key-choice').first().evaluate(e=>['name','signature','distance'].map(c=>parseFloat(getComputedStyle(e.querySelector('.'+c)).fontSize)));
 assert(css[0]>css[1]&&css[1]>css[2],'visual hierarchy');
}
await checkChooser(expectedG);
await page.locator('#key').click();await page.screenshot({path:'test-results/landscape-key-panel.png'});await page.keyboard.press('Escape');
await page.screenshot({path:'test-results/landscape-original.png',fullPage:true});
for(const [shift,fifths,label] of [[2,3,'A'],[1,-4,'A-flat'],[-2,-1,'F'],[-4,-3,'E-flat'],[-6,-5,'D-flat']]){
 await page.locator('#key').click();await page.locator(`[data-shift="${shift}"]`).click();await verify(shift,fifths,label);if(shift===1)await page.screenshot({path:'test-results/landscape-aflat.png',fullPage:true});
}
await page.locator('#reset').click();await verify(0,1,'Reset G');assert.equal(await page.locator('#score').innerHTML(),originalSVG,'exact rendered reset');assert(await page.evaluate(()=>prototype.xml===prototype.original),'exact XML reset');
// Test every conventional destination, including both signed tritone choices.
for(const [n,f] of [[-5,2],[-3,4],[-1,-6],[3,-2],[4,5],[5,0],[6,-5]]){await page.evaluate(n=>prototype.changeKey(n),n);await verify(n,f,'Additional key '+n);}
// Dispatch same-frame rapid arrow input; ensure the latest request wins.
await page.locator('#reset').click();await done(0);
await page.evaluate(()=>{for(let i=0;i<40;i++){document.getElementById('up').click();document.getElementById('down').click();}document.getElementById('up').click();document.getElementById('up').click();});await verify(2,3,'Rapid 82 arrow clicks');
await page.evaluate(()=>{for(let i=0;i<30;i++)document.getElementById('down').click();});await verify(-6,-5,'Lower bound');assert(await page.locator('#down').isDisabled());
await page.evaluate(()=>{for(let i=0;i<30;i++)document.getElementById('up').click();});await verify(6,-5,'Upper bound');assert(await page.locator('#up').isDisabled());
await page.locator('#reset').click();await done(0);
await page.setViewportSize({width:820,height:1180});await page.waitForTimeout(450);await verify(0,1,'Portrait G');await page.screenshot({path:'test-results/portrait-original.png',fullPage:true});
await page.locator('#key').click();await page.screenshot({path:'test-results/portrait-key-panel.png'});
const targetSizes=await page.locator('.key-choice').evaluateAll(els=>els.map(e=>({w:e.getBoundingClientRect().width,h:e.getBoundingClientRect().height})));assert(targetSizes.every(x=>x.w>=44&&x.h>=44));
await page.keyboard.press('Escape');assert(!await page.locator('#key-dialog').isVisible());assert(await page.locator('#key').evaluate(e=>e===document.activeElement));
await page.evaluate(async()=>{for(let i=0;i<12;i++){document.getElementById('up').click();await new Promise(r=>setTimeout(r,9));document.getElementById('down').click();await new Promise(r=>setTimeout(r,9));}document.getElementById('reset').click();});await verify(0,1,'Rapid input across renders then Reset');
await context.setOffline(true);await page.reload();await done(0);await page.locator('#up').click();await verify(1,-4,'Offline A-flat');await context.setOffline(false);
await page.locator('#reset').click();await done(0);const printPages=await page.evaluate(()=>prototype.preparePrint());assert(printPages>=1);await page.emulateMedia({media:'print'});await page.screenshot({path:'test-results/print-layout.png',fullPage:true});await page.emulateMedia({media:'screen'});

// Change the original key using in-memory versions of the same score; no extra songs/files.
const baseG=await page.evaluate(()=>prototype.original);
const otherOriginals=[
 {name:'C',seed:5,fifths:0,higher:['D♭','D','E♭','E','F','G♭'],lower:['B','B♭','A','A♭','G','G♭'],upF:[-5,2,-3,4,-1,-6],downF:[5,-2,3,-4,1,-6]},
 {name:'D',seed:-5,fifths:2,higher:['E♭','E','F','G♭','G','A♭'],lower:['D♭','C','B','B♭','A','A♭'],upF:[-3,4,-1,-6,1,-4],downF:[-5,0,5,-2,3,-4]}
];
for(const item of otherOriginals){
 await page.evaluate(async({baseG,seed})=>{const {transposeXML}=await import('./music.js');await prototype.loadScore(transposeXML(baseG,seed));},{baseG,seed:item.seed});
 await verify(0,item.fifths,'Loaded original '+item.name);await checkChooser(item);
 const original=await page.evaluate(()=>prototype.original),svg=await page.locator('#score').innerHTML();
 for(const direction of [1,-1])for(let n=1;n<=6;n++){
  await page.locator('#key').click();await page.locator(`[data-shift="${direction*n}"]`).click();
  await verify(direction*n,(direction>0?item.upF:item.downF)[n-1],item.name+' original '+(direction>0?'+':'-')+n);
 }
 await page.locator('#reset').click();await done(0);assert.equal(await page.evaluate(()=>prototype.xml),original);assert.equal(await page.locator('#score').innerHTML(),svg);
}
await page.evaluate(async xml=>prototype.loadScore(xml),baseG);await done(0);await checkChooser(expectedG);
// All supported source signatures produce integer diatonic intervals and a preserved 0 spelling.
const allOriginals=await page.evaluate(async()=>{const {buildKeys}=await import('./music.js');return Array.from({length:15},(_,i)=>buildKeys(i-7));});
assert(allOriginals.every(keys=>keys.length===13&&keys.every(k=>Number.isInteger(k.diatonic))));
assert.deepEqual(remote,[],'No external requests');assert.deepEqual(errors,[],'No browser errors');
await fs.writeFile('test-results/acceptance.json',JSON.stringify({browser:await browser.version(),viewports:['1180x820','820x1180'],errors,remoteRequests:remote,tests:results,keyTargetSizes:targetSizes,testedOriginalKeys:['G','C','D'],exactReset:true,offlineReload:true,printPages},null,2));await browser.close();
console.log('All acceptance tests passed');
