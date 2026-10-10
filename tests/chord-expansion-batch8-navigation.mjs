import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {songs} from '../songs.js';
const {chromium}=createRequire('C:/Users/kenro/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/package.json')('playwright');
const b=await chromium.launch({channel:'msedge'});
try {for(const width of [390,820,1440]) {
 const c=await b.newContext({viewport:{width,height:1000},serviceWorkers:'block'}),p=await c.newPage(),errors=[];
 p.on('pageerror',e=>errors.push(e.message));
 await p.goto('http://127.0.0.1:8780/');await p.waitForFunction(()=>window.prototype?.navigation);
 const ready=()=>p.waitForFunction(()=>prototype.ready&&!prototype.busy&&!prototype.loading&&document.querySelector('#score').getAttribute('aria-busy')==='false');
 const song=songs.find(s=>s.collection==='Hymns (1985)'&&s.page==='176');
 await p.evaluate(id=>prototype.loadSong(id,'normal'),song.id);await ready();
 await p.evaluate(()=>prototype.changeKey(2));await ready();
 const before=await p.evaluate(()=>({xml:prototype.xml,current:prototype.current}));
 await p.locator('#show-lyrics').click();await p.locator('#lyrics-view').waitFor({state:'visible'});
 assert((await p.locator('#lyrics-view').innerText()).length>50);
 await p.locator('.lyrics-score-toggle').click();await ready();
 assert.deepEqual(await p.evaluate(()=>({xml:prototype.xml,current:prototype.current})),before);
 assert(await p.locator('#score svg').count()>0);
 await p.locator('#songs').click();await p.waitForFunction(()=>document.body.classList.contains('library-open'));
 assert.deepEqual(errors,[]);console.log('PASS Batch 8 Score/Lyrics return, transposed harmony state and Library return',width);await c.close();
}}finally{await b.close();}
