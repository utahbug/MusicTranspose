// Explicit catalog withdrawals: never match personal files by title or touch IndexedDB.
const WITHDRAWN_IDS=new Set(['choose-to-serve-the-lord','scripture-power']);
const WITHDRAWN_PATHS=new Set([...WITHDRAWN_IDS].map(id=>new URL('./assets/pdfs/'+id+'.pdf',self.registration.scope).pathname));
function withdrawnAsset(value){try{const url=new URL(typeof value==='string'?value:value.url,self.registration.scope);return url.origin===self.location.origin&&WITHDRAWN_PATHS.has(decodeURIComponent(url.pathname));}catch{return false;}}
async function purgeWithdrawnCaches(){
 for(const name of await caches.keys()){
  if(!name.startsWith('music-transpose-')||!(name.endsWith('-'+self.registration.scope)||name.endsWith('-'+self.registration.scope+'-scores')))continue;
  const cache=await caches.open(name);
  for(const request of await cache.keys())if(withdrawnAsset(request))await cache.delete(request);
 }
}
async function purgeWithdrawnContent(){
 await purgeWithdrawnCaches();
 const pins=await readPins(),before=JSON.stringify(pins);
 pins.individual=pins.individual.filter(id=>!WITHDRAWN_IDS.has(id));
 for(const id of Object.keys(pins.lists))pins.lists[id]=pins.lists[id].filter(song=>!WITHDRAWN_IDS.has(song));
 for(const id of Object.keys(pins.assets)){
  if(WITHDRAWN_IDS.has(id))delete pins.assets[id];
  else pins.assets[id]=pins.assets[id].filter(asset=>!withdrawnAsset(asset.url));
 }
 if(JSON.stringify(pins)!==before)await writePins(pins);
}
