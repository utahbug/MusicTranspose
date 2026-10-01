import {createRequire} from 'node:module';import {execFileSync} from 'node:child_process';import assert from 'node:assert/strict';import {createHash} from 'node:crypto';
const {chromium}=createRequire('C:/Users/kenro/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/package.json')('playwright'),browser=await chromium.launch({channel:'msedge',headless:true});const results=[];
try{for(const baseline of [true,false]){
 const context=await browser.newContext({viewport:{width:820,height:1180},serviceWorkers:'block'}),p=await context.newPage();if(baseline)await p.route('**/app.js',r=>r.fulfill({contentType:'text/javascript',body:execFileSync('git',['show','048dd2a:app.js'],{encoding:'utf8'})}));
 await p.goto('http://127.0.0.1:8780/');await p.locator('.library-row').first().waitFor();const ready=()=>p.waitForFunction(()=>prototype.ready&&!prototype.busy&&document.querySelector('#score').getAttribute('aria-busy')==='false');
 const rows=[];for(const mode of ['large','pdf','auto','large']){
 await p.evaluate(mode=>prototype.loadSong('song-c25734b4-ba49-4c88-ba90-4927ede707c4',mode),mode);await ready();
 const data=await p.evaluate(async()=>{const v=await import('./virtual-pages.js');v.prepareVirtualPages();return {xml:prototype.viewXML,pdf:document.body.classList.contains('pdf-score-open'),canvases:[...document.querySelectorAll('.pdf-page')].map(c=>c.toDataURL()),svg:document.querySelector('#score svg')?.outerHTML.replace(/id="[^"]*"/g,'')||'',pages:v.virtualFrames().length};});
 rows.push({mode,xml:data.xml,pdf:data.pdf,pages:data.pages,art:createHash('sha256').update(data.pdf?data.canvases.join():data.svg).digest('hex')});
 }
 const short=await p.evaluate(async()=>{const {songs}=await import('./catalog.js');return songs.find(s=>s.title==='Praise God, from Whom All Blessings Flow');});assert(short);
 await p.evaluate(id=>prototype.loadSong(id,'auto'),short.id);await ready();const one=await p.evaluate(async()=>{const v=await import('./virtual-pages.js');v.prepareVirtualPages();return {pages:v.virtualFrames().length,xml:prototype.viewXML,svg:document.querySelector('#score svg').outerHTML.replace(/id="[^"]*"/g,'')};});assert.equal(one.pages,1,'short score remains one page');rows.push({mode:'short',...one});results.push(rows);await context.close();
 }
 for(const i of [0,1,3,4])assert.deepEqual(results[1][i],results[0][i],'Melody, Original and short score unchanged');assert.deepEqual(results[1][0],results[1][3],'returning to Melody is stable');console.log('PASS: True Melody and Original exact artwork/XML, repeat view switching, short 1-page Praise God score unchanged');
}finally{await browser.close();}
