import {createRequire} from 'node:module';import assert from 'node:assert/strict';
const {chromium}=createRequire(process.env.PLAYWRIGHT_PACKAGE)('playwright'),b=await chromium.launch({channel:'msedge',headless:true}),p=await b.newPage(),errors=[];p.on('pageerror',e=>errors.push(e.message));
const ready=async()=>{await p.waitForFunction(()=>prototype.ready&&!prototype.busy&&document.querySelector('#score').getAttribute('aria-busy')==='false');await p.waitForTimeout(150);};
try{await p.goto(process.env.TEST_URL||'http://127.0.0.1:8768/');await p.locator('[data-song="nativity"] .song-entry').click();await ready();
for(const [width,height] of [[320,740],[390,844],[600,900],[601,900],[820,1180],[1180,820],[1440,1000]]){
 await p.setViewportSize({width,height});await ready();const bar=await p.locator('.masthead').evaluate(e=>e.getBoundingClientRect().height);
 for(const title of ['The Nativity Song','“Give,” Said the Little Stream','How Wondrous and Great Thou Art, O Lord of Heaven and Earth'])for(const key of ['C Maj','F Maj','D Min','B♭ Maj','E♭ Maj','F♯ Min'])for(const lyrics of [true,false]){
  await p.evaluate(({title,key,lyrics})=>{const h=document.querySelector('.score-heading h1');h.firstChild.textContent=title;document.querySelector('#original-key-reference').textContent='Original key: '+key;document.querySelector('#show-lyrics').hidden=!lyrics;},{title,key,lyrics});
  const metrics=await p.evaluate(()=>{const box=s=>{const r=document.querySelector(s).getBoundingClientRect();return {left:r.left,right:r.right,top:r.top,bottom:r.bottom,width:r.width,height:r.height};};const range=document.createRange();range.selectNodeContents(document.querySelector('#original-key-reference'));return {text:[...range.getClientRects()].map(r=>({left:r.left,right:r.right,top:r.top,bottom:r.bottom})),button:box('#show-lyrics'),group:box('.score-actions'),title:box('.score-title-block'),bar:box('.masthead'),overflow:document.documentElement.scrollWidth>innerWidth};});
  assert(!metrics.overflow,JSON.stringify({width,key,title}));assert(metrics.title.right<=metrics.group.left+1);assert.equal(metrics.bar.height,bar);
  if(lyrics){assert(metrics.button.width>=44&&metrics.button.height>=44);for(const r of metrics.text)assert(r.right<=metrics.button.left-20||r.top>=metrics.button.bottom+3||r.bottom<=metrics.button.top-3);if(width>600)assert(Math.abs(metrics.button.left-Math.max(...metrics.text.map(r=>r.right))-24)<1);}
  else if(width>600)assert(Math.abs(metrics.group.right-Math.max(...metrics.text.map(r=>r.right)))<1);
 }
 await p.evaluate(()=>{document.querySelector('#show-lyrics').hidden=false;});await p.screenshot({path:`test-results/key-header-${width}.png`});console.log('PASS titles, six key lengths, lyrics/no-lyrics, button target, toolbar and overflow',width);
}
await p.evaluate(()=>prototype.loadSong('nativity'));await ready();const original=await p.locator('#original-key-reference').textContent();await p.locator('#key').click();await p.locator('[data-shift="1"]').click();await ready();assert.equal(await p.locator('#original-key-reference').textContent(),original);await p.locator('#reset').click();await ready();assert.equal(await p.locator('#original-key-reference').textContent(),original);await p.locator('#show-lyrics').click();await p.locator('#lyrics-view').waitFor({state:'visible'});await p.getByRole('button',{name:'View Score',exact:true}).click();await ready();await p.locator('#score-size').click();assert(await p.locator('#score-size-options').isVisible());await p.locator('#score-size-options [data-size=normal]').click();await ready();
await p.locator('.score-heading .song-playback').click();await p.waitForFunction(()=>prototype.playback.state==='playing');await p.locator('#songs').click();assert.equal(await p.evaluate(()=>prototype.playback.state),'stopped');
await p.locator('[data-song="hhc-1003"] .song-entry').click();await ready();assert(await p.locator('#show-lyrics').isHidden());assert(await p.locator('#original-key-reference').isVisible());
assert.deepEqual(errors,[]);console.log('PASS actual original-key preservation, transpose/reset, Lyrics, Score size, playback, Library, unavailable Lyrics');
}finally{await b.close();}

