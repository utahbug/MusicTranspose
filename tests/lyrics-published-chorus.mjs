import assert from 'node:assert/strict';import fs from 'node:fs';import {createRequire} from 'node:module';
const records=JSON.parse(fs.readFileSync('assets/lyrics.json','utf8')).songs;
const cases=[['hhc-1002',2],['hhc-1005',3],['cs-2',4],['song-7076bf3f-727e-4280-90f1-60faf9796937',3],['song-c9add785-5429-47ec-bf7d-afc5581a87d6',4]];
const {chromium}=createRequire('C:/Users/kenro/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/package.json')('playwright'),b=await chromium.launch({channel:'msedge'});
try{
 const c=await b.newContext({viewport:{width:820,height:1000},serviceWorkers:'block'}),p=await c.newPage(),errors=[];p.on('pageerror',e=>errors.push(e.message));await p.goto('http://127.0.0.1:8780/');await p.waitForFunction(()=>window.prototype?.openLyrics);
 for(const [id,count] of cases){
  const data=records.find(s=>s.id===id);assert(data.available);assert.equal(data.verses.length,count);assert.equal(data.refrains[0].label,'Chorus');
  await p.evaluate(id=>prototype.openLyrics(id),id);await p.locator('#lyrics-view').waitFor({state:'visible'});
  assert.equal(await p.locator('.lyrics-body>section').count(),count);assert.equal(await p.locator('.lyrics-chorus').count(),count);assert.equal(await p.locator('.lyrics-notice,.lyrics-refrain').count(),0);assert.equal(await p.locator('.lyrics-chorus[open]').count(),0);
  const details=p.locator('.lyrics-chorus');await details.first().locator('summary').click();assert.equal(await p.locator('.lyrics-chorus[open]').count(),1);await details.nth(1).locator('summary').click();assert.equal(await p.locator('.lyrics-chorus[open]').count(),2);await details.first().locator('summary').click();assert.equal(await p.locator('.lyrics-chorus[open]').count(),1);
  console.log('PASS published Chorus, verses, initially collapsed and independent toggles',id);
 }
 // Genuine non-chorus shared-ending fixture uses the production renderer unchanged.
 await p.evaluate(async()=>{const {createLyricsView}=await import('./lyrics-view.js');const host=document.createElement('article'),control=document.createElement('button');host.id='shared-ending-control';document.body.append(control,host);createLyricsView(host,{onScore(){},libraryControl:control}).show({title:'Shared-ending control',collection:'Fixture',number:'',notes:['Unlabelled ending'],verses:[{number:'1',text:'A verse'}],refrains:[{label:'Shared ending',text:'A shared ending without chorus evidence'}]});});
 assert.equal(await p.locator('#shared-ending-control .lyrics-chorus').count(),0);assert.equal(await p.locator('#shared-ending-control .lyrics-refrain h2').textContent(),'Shared ending');assert(await p.locator('#shared-ending-control .lyrics-notice').isVisible());assert.deepEqual(errors,[]);console.log('PASS genuine Shared ending retains separate presentation');
}finally{await b.close();}
