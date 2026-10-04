// Explicit retention uses the existing worker; incidental and imported-file stores stay separate.
const SAVED_CACHE='music-transpose-saved-'+self.registration.scope,PIN_CACHE='music-transpose-pins-'+self.registration.scope;
const PIN_URL=new URL('./__offline-retention__',self.registration.scope).href;
let offlineQueue=Promise.resolve();
async function offlineManifest(name){const r=await(await caches.open(CACHE)).match(new URL(name,self.registration.scope));if(!r)throw Error('Offline information unavailable');return r.json();}
async function scoreStores(){return (await caches.keys()).filter(n=>n===SCORE_CACHE||n.startsWith('music-transpose-v')&&(n.endsWith('-'+self.registration.scope+'-scores')||n.endsWith('-'+self.registration.scope)));}
async function storedScore(request){for(const name of await scoreStores()){const r=await(await caches.open(name)).match(request);if(r)return r;}}
const emptyPins=()=>({individual:[],lists:{},assets:{}});
async function readPins(){const r=await(await caches.open(PIN_CACHE)).match(PIN_URL);return r?await r.json():emptyPins();}
async function writePins(pins){await(await caches.open(PIN_CACHE)).put(PIN_URL,new Response(JSON.stringify(pins),{headers:{'Content-Type':'application/json'}}));}
const retained=p=>new Set([...p.individual,...Object.values(p.lists).flat()]);
const assetURL=a=>new URL(a.url,self.registration.scope).href;
async function validAsset(cache,a){try{const r=await cache.match(assetURL(a));if(!r?.ok)return false;const bytes=await r.arrayBuffer();if(!bytes.byteLength)return false;const text=new TextDecoder().decode(bytes.slice(0,2048));return a.kind==='pdf'?text.startsWith('%PDF-'):(new Uint8Array(bytes)[0]===80&&new Uint8Array(bytes)[1]===75)||/<(?:[\w-]+:)?score-(?:partwise|timewise)\b/.test(text);}catch{return false;}}
async function savedStatus(){const pins=await readPins(),catalog=await offlineManifest('./offline-catalog.json'),cache=await caches.open(SAVED_CACHE),shell=await caches.open(CACHE),shellKeys=new Set((await shell.keys()).map(r=>r.url));const shellReady=ASSETS.every(a=>shellKeys.has(new URL(a,self.registration.scope).href));const songs={};let bytes=0;
 const verified=new Map();for(const id of retained(pins)){const assets=catalog[id]||pins.assets[id]||[];for(const a of assets){const url=assetURL(a);if(!verified.has(url)){const ok=await validAsset(cache,a);verified.set(url,ok);}}songs[id]={saved:shellReady&&assets.length>0&&assets.every(a=>verified.get(assetURL(a))),individual:pins.individual.includes(id),lists:Object.keys(pins.lists).filter(k=>pins.lists[k].includes(id))};}
 for(const request of await cache.keys())bytes+=(await(await cache.match(request)).arrayBuffer()).byteLength;
 return {protocol:1,songs,listIds:Object.keys(pins.lists),savedCount:Object.values(songs).filter(s=>s.saved).length,bytes,shellReady};
}
async function collectUnused(pins){const keep=new Set([...retained(pins)].flatMap(id=>pins.assets[id]||[]).map(assetURL)),cache=await caches.open(SAVED_CACHE);for(const r of await cache.keys())if(!keep.has(r.url))await cache.delete(r);}
async function notifyOffline(progress){for(const client of await self.clients.matchAll())client.postMessage({type:'explicit-offline-changed',...progress});}
async function saveOffline(data){const catalog=await offlineManifest('./offline-catalog.json'),pins=await readPins(),ids=[...new Set(data.ids||[])].filter(id=>Object.hasOwn(catalog,id));if(data.owner==='individual'){if(ids.length!==1)throw Error('Song unavailable');pins.individual=[...new Set([...pins.individual,...ids])];}else if(data.owner==='list'&&typeof data.listId==='string'){Object.defineProperty(pins.lists,data.listId,{value:ids,writable:true,enumerable:true,configurable:true});}else throw Error('Invalid retention request');for(const id of ids)pins.assets[id]=catalog[id];await writePins(pins);await collectUnused(pins);
 const cache=await caches.open(SAVED_CACHE);let done=0,failed=0,storageFull=false;
 for(const id of ids){let ok=true;for(const a of catalog[id]){if(await validAsset(cache,a))continue;try{const r=await fetch(assetURL(a),{cache:'no-store'});if(!r.ok)throw Error('File unavailable');const bytes=await r.arrayBuffer(),probe={match:async()=>new Response(bytes)};if(!await validAsset(probe,a))throw Error('Invalid score');await cache.put(assetURL(a),new Response(bytes,{headers:r.headers}));if(!await validAsset(cache,a))throw Error('Unable to verify');}catch(e){ok=false;if(e.name==='QuotaExceededError'){storageFull=true;break;}}}if(ok)done++;else failed++;await notifyOffline({progress:{listId:data.listId,done,total:ids.length,processed:done+failed}});if(storageFull)break;}
 return {...await savedStatus(),failed,storageFull};
}
async function offlineCommand(data){
 if(data.type==='explicit-offline-status')return savedStatus();
 if(data.type==='explicit-offline-save')return saveOffline(data);
 const pins=await readPins();
 if(data.type==='explicit-offline-remove'){if(data.owner==='individual')pins.individual=pins.individual.filter(id=>id!==data.id);else if(data.owner==='list')delete pins.lists[data.listId];else throw Error('Invalid retention request');}
 else if(data.type==='explicit-offline-clear'){await writePins(emptyPins());await caches.delete(SAVED_CACHE);return savedStatus();}
 else if(data.type==='explicit-offline-reconcile'){const catalog=await offlineManifest('./offline-catalog.json');for(const id of Object.keys(pins.lists)){const list=(data.lists||[]).find(g=>g.id===id);if(!list){delete pins.lists[id];continue;}pins.lists[id]=[...new Set(list.songs)].filter(song=>Object.hasOwn(catalog,song));for(const song of pins.lists[id])pins.assets[song]=catalog[song];}}
 else throw Error('Unsupported offline command');
 await writePins(pins);await collectUnused(pins);return savedStatus();
}
self.addEventListener('message',event=>{if(!event.data?.type?.startsWith('explicit-offline-'))return;const run=offlineQueue.then(()=>offlineCommand(event.data));offlineQueue=run.catch(()=>{});event.waitUntil(run.then(async state=>{event.ports[0]?.postMessage(state);if(event.data.type!=='explicit-offline-status')await notifyOffline();}).catch(error=>event.ports[0]?.postMessage({error:error.name==='QuotaExceededError'?'storage-full':'unavailable',protocol:1})));});
