import {createRequire} from 'node:module';
import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
const require=createRequire(process.env.PLAYWRIGHT_PACKAGE || import.meta.url);const {chromium}=require('playwright');
const base=process.env.TEST_URL||'http://127.0.0.1:8767/';
const browser=await chromium.launch({channel:'msedge',headless:true});const context=await browser.newContext({viewport:{width:1180,height:820},hasTouch:true});const page=await context.newPage();const errors=[],remote=[];
page.on('pageerror',e=>errors.push(e.message));context.on('request',r=>{if(!r.url().startsWith(base)&&!r.url().startsWith('data:'))remote.push(r.url());});
const done=shift=>page.waitForFunction(s=>window.prototype?.ready&&!prototype.busy&&prototype.current===s&&document.getElementById('score').getAttribute('aria-busy')==='false',shift,{timeout:30000});
await page.goto(base);await done(0);await page.evaluate(()=>navigator.serviceWorker.ready);await page.waitForFunction(()=>navigator.serviceWorker.controller!==null);

await page.locator('#up').click();await done(1);
async function switchSong(id){await page.locator('#songs').click();await page.locator(`[data-song="${id}"]`).click();await page.waitForFunction(id=>prototype.song===id&&prototype.ready&&!prototype.busy&&prototype.current===0,id);}
await switchSong('shepherd');
assert.equal(await page.locator('#key-name').textContent(),'D minor');
const originalSVG=await page.locator('#score').innerHTML();const originalCredits=await page.locator('#source-credits').textContent();const results=[];
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
  const stripped=d=>{for(const x of d.querySelectorAll('note > pitch, note > accidental, attributes > key > fifths, attributes > key > mode, harmony > root, harmony > bass'))x.remove();return s.serializeToString(d);};
  return{pitchOK,noteCount:an.length,chordsOK,chordCount:chords,keyOK:[...b.querySelectorAll('attributes > key > fifths')].every(e=>Number(e.textContent)===fifths),unchanged,allOtherXMLUnchanged:stripped(a)===stripped(b),svgNotes:document.querySelectorAll('#score .vf-stavenote').length,svgCount:document.querySelectorAll('#score svg').length,svgText:document.getElementById('score').textContent,metrics:prototype.metrics.at(-1),viewportOverflow:document.documentElement.scrollWidth>innerWidth,svgWidth:document.querySelector('#score svg').getBoundingClientRect().width};
 },{shift,fifths});
 assert.equal(await page.locator('.key-choice[aria-pressed=true]').getAttribute('data-shift'),String(shift));assert.equal(await page.locator('#original .marker').textContent(),shift===0?'Original · Current':'Original · 0');assert(result.pitchOK,label+' pitches');assert(result.chordsOK,label+' chords');assert(result.keyOK,label+' signature');assert(Object.values(result.unchanged).every(Boolean),label+' invariants');assert(result.allOtherXMLUnchanged,label+' other XML');assert(result.svgCount>0);assert(!result.viewportOverflow,label+' overflow');assert.equal(await page.locator('#source-credits').textContent(),originalCredits);results.push({label,shift,...result,svgText:undefined});console.log(label,'PASS',result.noteCount,'notes',result.chordCount,'harmonies',result.metrics.ms.toFixed(1)+'ms');
}

await verify(0,-1,'Original D minor');
assert.deepEqual(await page.locator('#higher .name').allTextContents(),['E♭','E','F','F♯','G','G♯']);
assert.deepEqual(await page.locator('#lower .name').allTextContents(),['C♯','C','B','B♭','A','G♯']);
assert.deepEqual(await page.locator('#higher .distance').allTextContents(),['+1','+2','+3','+4','+5','+6']);
assert.deepEqual(await page.locator('#lower .distance').allTextContents(),['-1','-2','-3','-4','-5','-6']);
for(const [shift,fifths,name] of [[1,-6,'E♭'],[2,1,'E'],[-1,4,'C♯'],[-2,-3,'C'],[3,-4,'F'],[4,3,'F♯'],[5,-2,'G'],[6,5,'G♯'],[-3,2,'B'],[-4,-5,'B♭'],[-5,0,'A'],[-6,5,'G♯']]){
 await page.locator('#key').click();await page.locator(`[data-shift="${shift}"]`).click();await verify(shift,fifths,name+' minor');
 assert.equal(await page.locator('#key-name').textContent(),name+' minor');
 assert(await page.evaluate(()=>[...new DOMParser().parseFromString(prototype.xml,'application/xml').querySelectorAll('key > mode')].every(e=>e.textContent==='minor')));
 const chords=await page.evaluate(()=>[...new DOMParser().parseFromString(prototype.xml,'application/xml').querySelectorAll('harmony')].slice(0,2).map(h=>({step:h.querySelector('root-step').textContent,alter:Number(h.querySelector('root-alter')?.textContent||0),kind:h.querySelector('kind').textContent})));
 const expected={1:[['E',-1],['B',-1]],2:[['E',0],['B',0]],'-1':[['C',1],['G',1]],'-2':[['C',0],['G',0]]}[shift];
 if(expected)assert.deepEqual(chords,expected.map(([step,alter],i)=>({step,alter,kind:i?'dominant':'minor'})));
 if(shift===1)await page.screenshot({path:'test-results/shepherd-eb-minor.png',fullPage:true});
}
await page.locator('#reset').click();await done(0);assert(await page.evaluate(()=>prototype.xml===prototype.original));assert.equal(await page.locator('#score').innerHTML(),originalSVG);
for(const viewport of [{width:1180,height:820},{width:820,height:1180}]){
 await page.setViewportSize(viewport);await page.waitForTimeout(450);await done(0);
 assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
 await page.screenshot({path:`test-results/shepherd-${viewport.width}.png`,fullPage:true});
 await page.locator('#key').click();await page.screenshot({path:`test-results/minor-keys-${viewport.width}.png`});
 assert(await page.locator('.key-choice').evaluateAll(es=>es.every(e=>{const r=e.getBoundingClientRect();return r.width>=44&&r.height>=44&&r.top>=0&&r.bottom<=innerHeight;})));await page.keyboard.press('Escape');
 await page.locator('#songs').click();await page.screenshot({path:`test-results/songs-${viewport.width}.png`});
 assert(await page.locator('.song-choice').evaluateAll(es=>es.every(e=>{const r=e.getBoundingClientRect();return r.width>=44&&r.height>=44;})));await page.keyboard.press('Escape');
}
await page.locator('#up').click();await done(1);await page.evaluate(()=>scrollTo(0,400));await switchSong('nativity');assert.equal(await page.locator('#key-name').textContent(),'G major');assert.equal(await page.evaluate(()=>scrollY),0);
await page.locator('#down').click();await done(-1);await switchSong('shepherd');assert.equal(await page.locator('#key-name').textContent(),'D minor');assert(await page.evaluate(()=>prototype.xml===prototype.original));
await context.setOffline(true);await switchSong('nativity');await switchSong('shepherd');await page.locator('#up').click();await verify(1,-6,'Offline E-flat minor');await page.locator('#reset').click();await done(0);
const printPages=await page.evaluate(()=>prototype.preparePrint());assert(printPages>=1);await context.setOffline(false);
assert.deepEqual(errors,[]);assert.deepEqual(remote,[]);
await fs.writeFile('test-results/minor-navigation.json',JSON.stringify({results,exactReset:true,switchingBothWays:true,offlineBothSongs:true,printPages,errors,remote},null,2));await browser.close();console.log('Minor and navigation acceptance passed');
