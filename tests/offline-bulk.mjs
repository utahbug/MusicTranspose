import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import vm from 'node:vm';
import {createBulkRemoval,ownershipKey} from '../offline-bulk.js';
// Execute the shipped worker against isolated Cache API doubles; no user's storage is touched.
const scope='https://test.invalid/',stores=new Map();let failDelete=0,deleteCalls=0,failPinWrite=false;
class Cache{constructor(){this.data=new Map();}key(r){return typeof r==='string'?new URL(r,scope).href:r.url||r.href;}async match(r){return this.data.get(this.key(r))?.clone();}async put(r,v){if(failPinWrite&&this.key(r).endsWith('__offline-retention__')){failPinWrite=false;throw Error('pin write failed');}this.data.set(this.key(r),v.clone());}async keys(){return [...this.data.keys()].map(u=>new Request(u));}async delete(r){deleteCalls++;if(failDelete&&deleteCalls===failDelete)throw Error('cleanup failed');return this.data.delete(this.key(r));}}
const caches={async open(name){if(!stores.has(name))stores.set(name,new Cache());return stores.get(name);},async keys(){return [...stores.keys()];},async delete(name){return stores.delete(name);}};
const listeners={},context=vm.createContext({URL,Request,Response,TextDecoder,Uint8Array,console,caches,fetch:async url=>new Response(url.endsWith('.pdf')?'%PDF-1.4 fixture':'<score-partwise/>'),CACHE:'shell',SCORE_CACHE:'runtime',ASSETS:['./'],self:{registration:{scope},clients:{matchAll:async()=>[]},addEventListener:(name,fn)=>listeners[name]=fn}});
await vm.runInContext(await fs.readFile(new URL('../offline-worker.js',import.meta.url),'utf8'),context);
const catalog={a:[{url:'shared.xml',kind:'xml'}],b:[{url:'shared.xml',kind:'xml'}],c:[{url:'unique.xml',kind:'xml'},{url:'unique.pdf',kind:'pdf'}],d:[{url:'last.xml',kind:'xml'}]};
const shell=await caches.open('shell');await shell.put(scope,new Response('shell'));await shell.put(scope+'offline-catalog.json',new Response(JSON.stringify(catalog)));
const call=async data=>{context.command=data;return JSON.parse(JSON.stringify(await vm.runInContext('offlineCommand(command)',context)));};
const song=id=>({id,title:id}),save=id=>call({type:'explicit-offline-save',owner:'individual',ids:[id]}),saveList=(id,ids)=>call({type:'explicit-offline-save',owner:'list',listId:id,ids});
let snapshot;const refresh=async()=>{snapshot={...await call({type:'explicit-offline-status'}),inventoryReady:true};};
const removals=[];let responseLost=false;
const bulk=createBulkRemoval({refresh,summary:()=>snapshot,remove:async(s,guard)=>{removals.push(s.id);const result=await call({type:'explicit-offline-remove',owner:'individual',id:s.id,...guard});snapshot={...result,inventoryReady:true};if(responseLost){responseLost=false;throw Error('timeout');}return result;}});
const items=ids=>ids.map(id=>({song:song(id),key:ownershipKey(snapshot.songs[id])}));
await save('a');await save('c');await save('d');await saveList('one',['a','b']);await saveList('two',['a']);await refresh();
let plan=await bulk.review(items(['a','b','c']));assert.deepEqual(plan.map(i=>i.action),['release','skip','release']);
let result=await bulk.run(plan);assert.equal(result.outcomes[0].protected,true);assert.equal(result.outcomes[1].status,'skipped');assert.equal(result.outcomes[2].status,'released');assert.deepEqual(removals,['a','c']);assert.equal(snapshot.songs.a.saved,true);assert.deepEqual(snapshot.songs.a.lists,['one','two']);assert(snapshot.songs.b.saved);
assert(await(await caches.open('music-transpose-saved-'+scope)).match(scope+'shared.xml'),'shared asset retained across distinct song IDs');
await call({type:'explicit-offline-remove',owner:'list',listId:'two'});await refresh();assert(snapshot.songs.a.saved);assert(snapshot.songs.b.saved);
// Changes between confirmation and execution require a fresh confirmation; nothing is written.
await save('a');await refresh();plan=await bulk.review(items(['a']));await saveList('three',['a']);const count=removals.length;result=await bulk.run(plan);assert(result.review);assert.equal(removals.length,count);assert(snapshot.songs.a.individual);
// Worker guards close the race between a fresh snapshot and the serialized write.
result=await call({type:'explicit-offline-remove',owner:'individual',id:'a',expectedLists:['one']});assert(result.skipped);assert(result.songs.a.individual);
result=await call({type:'explicit-offline-remove',owner:'individual',id:'a',cleanupOnly:true});assert(result.skipped);assert(result.songs.a.individual);
// Partial collectUnused failure occurs after the pin write and after one asset was deleted.
await save('c');await refresh();plan=await bulk.review(items(['c','d']));deleteCalls=0;failDelete=2;result=await bulk.run(plan);failDelete=0;assert.equal(result.outcomes[0].status,'uncertain');assert.match(result.outcomes[0].detail,/released.*not confirmed/);assert(!snapshot.songs.c);assert(snapshot.songs.d.individual);assert.equal(result.remaining[0].song.id,'d');
const leftover=await caches.open('music-transpose-saved-'+scope);assert(await leftover.match(scope+'unique.pdf'));
plan=await bulk.review([result.outcomes[0]]);assert.equal(plan[0].action,'cleanup');result=await bulk.run(plan);assert.equal(result.outcomes[0].status,'cleaned');assert(!await leftover.match(scope+'unique.pdf'));assert(snapshot.songs.a.saved&&snapshot.songs.b.saved);
// An acknowledged command whose response is lost is uncertain, never a false success.
await refresh();plan=await bulk.review(items(['d']));responseLost=true;result=await bulk.run(plan);assert.equal(result.outcomes[0].status,'uncertain');plan=await bulk.review([result.outcomes[0]]);assert.equal(plan[0].action,'cleanup');
await save('d');result=await bulk.run(plan);assert(result.review);assert.equal(result.review[0].action,'release');assert(snapshot.songs.d.individual,'newly saved ownership requires a new confirmation');
// A rejected ownership write is a confirmed failure when the fresh pin is still present.
await refresh();plan=await bulk.review(items(['d']));failPinWrite=true;result=await bulk.run(plan);assert.equal(result.outcomes[0].status,'failed');assert(snapshot.songs.d.individual);
// Dependencies changed between two operations are revalidated and skipped, not blindly released.
await save('c');await refresh();let altered=false;const changing=createBulkRemoval({refresh,summary:()=>snapshot,changed:()=>{},remove:async(s,guard)=>{const value=await call({type:'explicit-offline-remove',owner:'individual',id:s.id,...guard});if(!altered){altered=true;await saveList('late',['d']);}return value;}});
result=await changing.run(await changing.review(items(['c','d'])));assert.equal(result.outcomes[1].status,'skipped');assert(snapshot.songs.d.individual);assert(snapshot.songs.d.saved);
// Imports never reach the remover, even if fed directly into the workflow.
const imported={song:{id:'local-file',title:'Personal',local:true},key:ownershipKey({local:true})};result=await bulk.run(await bulk.review([imported]));assert.equal(result.outcomes[0].status,'skipped');assert(!removals.includes('local-file'));
// Closing/stopping during the authoritative read prevents the first operation; duplicate run is ignored.
let unblock,started;const entered=new Promise(r=>started=r),gate=new Promise(r=>unblock=r);const paused=createBulkRemoval({refresh:async()=>{started();await gate;await refresh();},summary:()=>snapshot,remove:()=>assert.fail('must not remove after stop')});
const active=paused.run(await bulk.review(items(['d'])));await entered;assert.equal(await paused.run([]),null);paused.stop();unblock();result=await active;assert.equal(result.outcomes.length,0);assert.equal(result.remaining.length,1);
// A failed per-song ownership refresh stops without writes and counts each selection once.
let reads=0;const unavailable=createBulkRemoval({refresh:async()=>{await refresh();if(++reads===3)snapshot.inventoryReady=false;},summary:()=>snapshot,remove:()=>assert.fail('unverified ownership')});
result=await unavailable.run(await unavailable.review(items(['a','d'])));assert.equal(result.outcomes[0].status,'unverified');assert.equal(result.outcomes.length+result.remaining.length,2);
// Old workers/unverified storage cannot be used for destructive operations.
await assert.rejects(createBulkRemoval({refresh:async()=>{},summary:()=>({inventoryReady:true}),remove:()=>assert.fail()}).review([]),/updating/);
await assert.rejects(createBulkRemoval({refresh:async()=>{},summary:()=>({bulkRemoval:1,inventoryReady:false}),remove:()=>assert.fail()}).review([]),/verified/);
console.log('PASS bulk controller + shipped worker: individual/one/multiple Lists, shared assets, protected/import exclusions, stale ownership and worker guards, partial cleanup, uncertain timeout, safe retry/new saves, stopping/duplicates and old-worker safety');
