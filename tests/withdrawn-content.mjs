import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import http from 'node:http';
import {execFileSync} from 'node:child_process';
import {createRequire} from 'node:module';
import {songs} from '../songs.js';
const engines=createRequire(process.env.PLAYWRIGHT_PACKAGE||'C:/Users/kenro/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/package.json')('playwright');
const ids=['choose-to-serve-the-lord','scripture-power'],root=process.cwd(),key='music-transpose-library-v1';
const previous='cd3a5a04ecf068bf078284d2667f41e047c8b632';
let old=true;const history=new Map();
for(const file of ['sw.js','offline-worker.js','offline-catalog.json',...ids.map(id=>'assets/pdfs/'+id+'.pdf')])history.set(file,execFileSync('git',['show',previous+':'+file],{maxBuffer:10e6}));
const server=http.createServer(async(req,res)=>{try{const rel=decodeURIComponent(new URL(req.url,'http://local').pathname).slice(1)||'index.html';if(rel==='fixture'){res.setHeader('Content-Type','text/html');res.end('<!doctype html><title>Isolated withdrawal upgrade test</title>');return;}const file=path.resolve(root,rel);if(!file.startsWith(root+path.sep))throw Error('path');const bytes=old&&history.has(rel)?history.get(rel):await fs.readFile(file);res.setHeader('Cache-Control','no-store');res.setHeader('Content-Type',({'.js':'text/javascript','.html':'text/html','.json':'application/json','.css':'text/css','.pdf':'application/pdf','.svg':'image/svg+xml','.webmanifest':'application/manifest+json'})[path.extname(file)]||'application/octet-stream');res.end(bytes);}catch{res.writeHead(404);res.end();}});
await new Promise(r=>server.listen(0,'127.0.0.1',r));const base=`http://127.0.0.1:${server.address().port}/`;
const original=JSON.parse(execFileSync('git',['show',previous+':assets/lyrics.json'],{encoding:'utf8',maxBuffer:10e6}));
const current=JSON.parse(await fs.readFile('assets/lyrics.json','utf8'));
assert.deepEqual(current.songs,original.songs.filter(s=>!ids.includes(s.id)),'no new/modified Lyrics');
assert(!songs.some(s=>ids.includes(s.id)));assert.match(songs.find(s=>s.id==='cs-60').title,/Sunbeam/);assert.match(songs.find(s=>s.id==='hhc-1001').title,/Come, Thou Fount/);
try{for(const engine of ['chromium','webkit']){
 old=true;const browser=await engines[engine].launch(engine==='chromium'?{channel:'msedge'}:{});
 try{
 const context=await browser.newContext();let p=await context.newPage();p.setDefaultTimeout(60000);await p.goto(base+'fixture');
 await p.evaluate(async()=>{await navigator.serviceWorker.register('./sw.js',{updateViaCache:'none'});await navigator.serviceWorker.ready;});await p.waitForFunction(()=>navigator.serviceWorker.controller);
 const rpc=(data)=>p.evaluate(data=>new Promise(resolve=>{const channel=new MessageChannel();channel.port1.onmessage=e=>resolve(e.data);navigator.serviceWorker.controller.postMessage(data,[channel.port2]);}),data);
 for(const id of ids){assert.equal(await p.evaluate(async id=>{const r=await fetch('./assets/pdfs/'+id+'.pdf');await r.arrayBuffer();return r.status;},id),200);const result=await rpc({type:'explicit-offline-save',owner:'individual',ids:[id]});assert(result.songs[id].saved);}
 assert((await rpc({type:'explicit-offline-save',owner:'list',listId:'personal',ids:[...ids,'nativity']})).songs.nativity.saved);
 const personal={orderingVersion:1,starterContentVersion:1,groups:[{id:'personal',name:'Custom order',songs:[ids[1],'nativity',ids[0]],songView:'lyrics'}],favorites:[ids[0],'nativity'],recent:[],textItems:{'text:private':{type:'text',title:'Private Note',html:'<p>Keep exactly</p>'}}};
 await p.evaluate(async({key,personal,base,ids})=>{localStorage.setItem(key,JSON.stringify(personal));localStorage.setItem('music-transpose-library-theme-v1','light');const store=await import('./local-music-store.js');await store.addRecord({metadata:{id:'local-private',hash:'personal-fixture',title:'Choose to Serve the Lord',scoreType:'pdf'},file:new Uint8Array([37,80,68,70,45,49,46,52]).buffer});for(const name of ['music-transpose-v100-'+base,'music-transpose-scores-'+base]){const cache=await caches.open(name);for(const id of ids)await cache.put('./assets/pdfs/'+id+'.pdf?old=1',new Response('%PDF-old'));await cache.put('./unrelated.pdf',new Response('%PDF-unrelated'));}}, {key,personal,base,ids});
 const stale=await context.newPage();await stale.goto(base+'fixture');
 old=false;await p.evaluate(async()=>{const changed=new Promise((resolve,reject)=>{navigator.serviceWorker.addEventListener('controllerchange',()=>resolve(),{once:true});setTimeout(()=>reject(Error('controllerchange timeout')),30000);});await(await navigator.serviceWorker.getRegistration()).update();await changed;});
 const state=await rpc({type:'explicit-offline-status'});assert(state.songs.nativity.saved);for(const id of ids)assert(!state.songs[id]);
 assert.equal((await rpc({type:'explicit-offline-save',owner:'individual',ids:[ids[0]]})).error,'unavailable');
 const retained=await p.evaluate(async base=>{const pin=await(await caches.open('music-transpose-pins-'+base)).match(base+'__offline-retention__');return pin.json();},base);assert.deepEqual(retained.lists.personal,['nativity']);assert(!ids.some(id=>retained.individual.includes(id)||id in retained.assets));
 const urls=await p.evaluate(async()=>{const result=[];for(const name of await caches.keys())for(const r of await(await caches.open(name)).keys())result.push(r.url);return result;});assert(!urls.some(url=>ids.some(id=>url.includes('/'+id+'.pdf'))));assert(urls.some(url=>url.endsWith('/unrelated.pdf')));
 for(const id of ids){assert.equal((await fetch(base+'assets/pdfs/'+id+'.pdf')).status,404);assert.equal(await p.evaluate(async id=>{const r=await fetch('./assets/pdfs/'+id+'.pdf');await r.arrayBuffer();return r.status;},id),410);}
 if(engine==='chromium'){ await context.setOffline(true);assert.equal(await p.evaluate(async()=> (await fetch('./assets/pdfs/performance/nativity.pdf')).status),200);for(const id of ids)assert.equal(await p.evaluate(async id=>(await fetch('./assets/pdfs/'+id+'.pdf?retry=1')).status,id),410);await context.setOffline(false);}else console.log('LIMITATION Windows WebKit offline emulation: cache contents verified; network-disabled SW fetch requires Safari verification.');
 assert.deepEqual(await p.evaluate(key=>JSON.parse(localStorage.getItem(key)),key),personal);
 await p.goto(base);await p.waitForFunction(()=>window.prototype?.navigation);assert.deepEqual(await p.evaluate(key=>JSON.parse(localStorage.getItem(key)),key),personal);
 await p.locator('#home-footer-lists').click();await p.locator('[data-list=personal] .list-overview-entry').click();for(const id of ids)assert(await p.locator(`[data-song="${id}"] .workspace-song-entry`).isDisabled());
 await p.locator('#lists-quick-files').click();assert.equal(await p.locator('.file-row').count(),1);assert(await p.locator('[data-file=local-private]').isVisible());assert.equal(await p.evaluate(async()=>{const r=await(await import('./local-music-store.js')).localRecord('local-private');return new Uint8Array(r.file).join(',');}),'37,80,68,70,45,49,46,52');
 await context.close();console.log('PASS',engine,'actual old-worker saves, upgrade purge, stale tab, offline unrelated score, imported same-title file, personal state');
 // Fresh profiles and responsive real application. No production storage or real personal data.
 for(const width of [320,390,744,820,1024,1440]){
  const c=await browser.newContext({viewport:{width,height:1000},serviceWorkers:'block'}),page=await c.newPage();await page.goto(base);await page.waitForFunction(()=>window.prototype?.navigation);const seed=await page.evaluate(key=>JSON.parse(localStorage.getItem(key)),key);assert.equal(seed.groups.length,3);assert.equal(seed.groups.flatMap(g=>g.songs).length,11);assert.deepEqual(seed.groups[0].songs,['cs-2','hhc-1004','cs-60']);assert(seed.groups[1].songs.includes('hhc-1001'));assert(!seed.groups.flatMap(g=>g.songs).some(id=>ids.includes(id)));
  await page.locator('#home-files').click();assert.equal(await page.locator('.file-row').count(),0);assert.equal(await page.locator('#files-restore-examples').count(),0);assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));await fs.mkdir('test-results/withdrawal',{recursive:true});await page.screenshot({path:`test-results/withdrawal/${engine}-${width}-files.png`});
  if(width===820){await page.locator('#files-library').click();await page.locator('[data-home-source=all]').click();for(const title of ['Choose to Serve the Lord','Scripture Power']){await page.locator('#library-search').fill(title);assert.equal(await page.locator('.library-row').count(),0);}for(const id of ['cs-60','hhc-1001']){await page.evaluate(id=>prototype.loadSong(id),id);await page.waitForFunction(()=>prototype.ready&&!prototype.busy&&!prototype.loading);assert.equal(await page.evaluate(()=>prototype.song),id);await page.locator('#songs').click();}}
  await c.close();
 }
 console.log('PASS',engine,'six widths, 11 starter entries, empty Files, withdrawn search, replacement scores');
 }finally{await browser.close();}
}}finally{server.close();}





