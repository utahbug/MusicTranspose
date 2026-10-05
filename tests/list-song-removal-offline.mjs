import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
const {chromium}=createRequire('C:/Users/kenro/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/package.json')('playwright'),b=await chromium.launch({channel:'msedge'}),c=await b.newContext(),p=await c.newPage();
try{
 await c.addInitScript(()=>{if(localStorage.getItem('removal-offline'))return;localStorage.setItem('removal-offline','1');localStorage.setItem('music-transpose-library-v1',JSON.stringify({orderingVersion:1,favorites:['nativity'],groups:[{id:'a',name:'One',songs:['nativity']},{id:'b',name:'Two',songs:['nativity']}]}));});
 await p.goto('http://127.0.0.1:8780/');await p.waitForFunction(()=>window.prototype?.navigation&&navigator.serviceWorker.controller);await p.evaluate(()=>navigator.serviceWorker.ready);
 const call=(method,arg)=>p.evaluate(async({method,arg})=>(await import('./offline-manager.js'))[method](arg),{method,arg});
 await call('saveOfflineSong',{id:'nativity'});await call('saveOfflineList',{id:'a',songs:['nativity']});await call('saveOfflineList',{id:'b',songs:['nativity']});
 const status=async()=>{await call('refreshOffline');return call('offlineSongState',{id:'nativity'});},assets=()=>p.evaluate(async()=>{const name=(await caches.keys()).find(n=>n.startsWith('music-transpose-saved-'));return (await(await caches.open(name)).keys()).map(r=>r.url);});const before=await assets();assert(before.length>0);
 await p.locator('#home-lists').click();const card=id=>p.locator(`[data-list="${id}"]`),remove=async id=>{if(await card(id).locator('.list-overview-entry').getAttribute('aria-expanded')!=='true')await card(id).locator('.list-overview-entry').click();await card(id).locator('.edit-list-entry').click();await p.locator('#list-entry-remove').click();};
 await remove('a');await p.waitForFunction(async()=>{const m=await import('./offline-manager.js');await m.refreshOffline();return !m.offlineSongState({id:'nativity'}).lists.includes('a');});assert((await status()).saved);assert.deepEqual(await assets(),before);
 await p.locator('#list-removal-restore').click();await p.waitForFunction(async()=>{const m=await import('./offline-manager.js');await m.refreshOffline();return m.offlineSongState({id:'nativity'}).lists.includes('a');});assert((await status()).saved);
 await remove('a');await remove('b');await p.waitForFunction(async()=>{const m=await import('./offline-manager.js');await m.refreshOffline();return !m.offlineSongState({id:'nativity'}).lists.length;});assert((await status()).saved);assert.deepEqual(await assets(),before);
 await call('removeOfflineSong',{id:'nativity'});assert(!(await status()).saved);assert.deepEqual(await assets(),[]);
 assert.deepEqual(await p.evaluate(()=>JSON.parse(localStorage.getItem('music-transpose-library-v1')).favorites),['nativity']);
 await p.waitForFunction(()=>document.getElementById('list-removal-undo').hidden,{},{timeout:9000});console.log('PASS actual worker: List remove/Undo references, other List and individual protection, final asset release, Undo expiry');
}finally{await b.close()}
