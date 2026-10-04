import {createRequire} from 'node:module';import assert from 'node:assert/strict';import fs from 'node:fs';
const {chromium}=createRequire(process.env.PLAYWRIGHT_PACKAGE||'C:/Users/kenro/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/package.json')('playwright'),b=await chromium.launch({channel:'msedge'}),p=await b.newPage({viewport:{width:820,height:1180},serviceWorkers:'block'}),errors=[],results=[];
p.setDefaultTimeout(90000);p.on('pageerror',e=>errors.push(e.message));fs.mkdirSync('test-results/octave-dialog',{recursive:true});
const ready=async()=>{await p.waitForFunction(()=>prototype.ready&&!prototype.busy&&!prototype.loading&&document.querySelector('#score').getAttribute('aria-busy')==='false');};
const open=async()=>{await p.locator('#key').click();assert.equal(await p.locator('#octave-toggle').getAttribute('aria-expanded'),'false');assert(await p.locator('#octave-panel').isHidden());};
const expand=async()=>{await p.locator('#octave-toggle').click();assert.equal(await p.locator('#octave-toggle').getAttribute('aria-expanded'),'true');};
const check=async(label)=>{await ready();assert.equal(await p.locator('#octave-label').textContent(),'Octave: '+label);assert(await p.locator('#key-dialog').isVisible());assert(await p.evaluate(async()=>{const {shiftStaffOctaves}=await import('./octave.js'),{transposeXML}=await import('./music.js');return prototype.xml===shiftStaffOctaves(transposeXML(prototype.original,prototype.current),prototype.octaveState,prototype.hands);}));results.push({label,state:await p.evaluate(()=>prototype.octaveState),xmlEquivalent:true});};
const shift=async(scope,n,label)=>{await p.locator('[data-scope='+scope+']').click();await p.locator('input[name=octave][value="'+n+'"]').check();await check(label);};
try{
 await p.goto('http://127.0.0.1:8780/');await p.waitForFunction(()=>prototype.navigation);await p.evaluate(()=>prototype.loadSong('nativity','normal'));await ready();assert(await p.evaluate(()=>prototype.hands.ok));
 await open();await check('Normal');assert.equal(await p.locator('#octave-summary').count(),0);await expand();await p.locator('#octave-toggle').click();assert(await p.locator('#octave-panel').isHidden());await expand();
 await shift('both',-1,'Both · 8vb');await shift('both',1,'Both · 8va');await shift('both',0,'Normal');await shift('rh',1,'RH · 8va');await shift('lh',-1,'Custom');await shift('lh',0,'RH · 8va');await shift('rh',0,'Normal');await shift('lh',-1,'LH · 8vb');
 await p.locator('#close-dialog').click();await open();await check('LH · 8vb');await p.locator('#close-dialog').click();await p.locator('#reset').click();await ready();await open();await check('Normal');await p.locator('#close-dialog').click();
 await p.locator('#score-size').click();await p.locator('#score-size-options [data-size=large]').click();await ready();assert(await p.evaluate(()=>prototype.lead?.ok));await open();await expand();assert(await p.locator('#octave-scopes').isHidden());
 await p.evaluate(()=>window.baseMelodyXML=prototype.viewXML);
 for(const [n,label] of [[-1,'8vb'],[0,'Normal'],[1,'8va']]){await p.locator('input[name=octave][value="'+n+'"]').check();await check(label);assert(await p.evaluate(async()=>{const {shiftOctaveXML}=await import('./music.js');return prototype.viewXML===shiftOctaveXML(window.baseMelodyXML,prototype.octaveState.lead);}));}
 await p.locator('#close-dialog').click();await p.locator('#score-size').click();await p.locator('#score-size-options [data-size=auto]').click();await ready();
 await p.evaluate(()=>prototype.loadSong('shepherd','normal'));await ready();assert.equal(await p.evaluate(()=>prototype.hands.ok),false);await open();await expand();assert(await p.locator('#octave-scopes').isHidden());assert(await p.locator('#octave-toggle').getAttribute('aria-description'));await p.locator('input[name=octave][value="-1"]').check();await check('8vb');assert.equal(await p.evaluate(()=>prototype.octaveState.all),-1);await p.locator('#close-dialog').click();
 await p.evaluate(()=>prototype.loadSong('nativity','normal'));await ready();
 for(const width of [390,430,820,1024,1440]){
  await p.setViewportSize({width,height:1180});await ready();await open();await p.locator('#octave-toggle').scrollIntoViewIfNeeded();
  assert(await p.evaluate(()=>{const lower=document.querySelector('#lower').getBoundingClientRect(),oct=document.querySelector('#key-octave').getBoundingClientRect();return oct.top>=lower.bottom;}));
  await p.screenshot({path:'test-results/octave-dialog/'+width+'-collapsed.png'});await p.locator('#octave-toggle').press('Enter');await p.locator('#octave-panel').scrollIntoViewIfNeeded();
  const geo=await p.evaluate(()=>{const d=document.querySelector('#key-dialog'),r=e=>{const b=e.getBoundingClientRect();return {width:b.width,height:b.height,left:b.left,right:b.right}};return {dialog:r(d),toggle:r(document.querySelector('#octave-toggle')),targets:[...document.querySelectorAll('#octave-scopes button,.octave-values label')].map(r),overflow:d.scrollWidth>d.clientWidth};});
  assert(!geo.overflow);assert(geo.toggle.height>=44);assert(geo.toggle.width<230);assert(geo.targets.every(t=>t.height>=44&&t.width>=44&&t.right<=geo.dialog.right));
  await p.screenshot({path:'test-results/octave-dialog/'+width+'-expanded.png'});results.push({width,...geo});await p.locator('#close-dialog').click();
 }
 assert.deepEqual(errors,[]);fs.writeFileSync('test-results/octave-dialog/results.json',JSON.stringify(results,null,2)+'\n');console.log('PASS labels, disclosure, hand/whole/Melody state and XML, reset, reopen and five widths');
}finally{await b.close();}
