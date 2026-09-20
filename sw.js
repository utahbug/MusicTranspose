const CACHE='music-transpose-v86-'+self.registration.scope;
const SCORE_CACHE=CACHE+'-scores';
// Fallback PDFs are intentionally absent from install/warm lists: cache on first open.
const ASSETS=["./pdf-fallbacks.js", "./playback-settings.js", "./auto-layout.js", "./icons.js", "./files-view.js", "./lists-view.js", "./catalog.js", "./local-music-store.js", "./local-music-validation.js", "./my-music.js", "./", "./index.html", "./manifest.webmanifest", "./assets/icons/favicon.svg", "./assets/icons/favicon-32.png", "./assets/icons/apple-touch-icon.png", "./assets/icons/icon-192.png", "./assets/icons/icon-512.png", "./styles.css", "./app.js", "./playback.js", "./pdf-score.js", "./vendor/pdf.min.js", "./vendor/pdf.worker.min.js", "./library.js", "./view-history.js", "./library-query.js", "./lyrics-view.js", "./lyrics-fun.js", "./lyrics-fun-ambient.js", "./lyrics-index.js", "./assets/lyrics.json", "./list-reorder.js", "./score-layout.js", "./opening-metadata.js", "./navigation.js", "./settings-help.js", "./virtual-pages.js", "./music.js", "./instrument-keys.js", "./title-alignment.js", "./songs.js", "./imported-songs.js", "./vendor/opensheetmusicdisplay.min.js", "./vendor/fflate.min.js", "./offline-scores.json"];
self.addEventListener('install',e=>e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS.map(url=>new Request(url,{cache:'reload'})))).then(()=>self.skipWaiting())));
self.addEventListener('activate',e=>e.waitUntil((async()=>{
 // Retain already downloaded score bytes across the shell update.
 const scores=await caches.open(SCORE_CACHE);
 for(const name of await caches.keys())if(name!==CACHE&&name!==SCORE_CACHE&&name.startsWith('music-transpose-v')&&(name.endsWith('-'+self.registration.scope)||name.endsWith('-'+self.registration.scope+'-scores'))){
  const old=await caches.open(name);for(const request of await old.keys())if(/\.(mxl|pdf)$/.test(new URL(request.url).pathname)&&!await scores.match(request)){const response=await old.match(request);await scores.put(request,response);}
  await caches.delete(name);
 }await self.clients.claim();
})()));
let warming;
async function warmScores(){
 if(warming)return warming;
 warming=(async()=>{const shell=await caches.open(CACHE),manifest=await shell.match(new URL('./offline-scores.json',self.registration.scope));const assets=await manifest.json(),cache=await caches.open(SCORE_CACHE);let next=0,done=0;
 const report=async finished=>{for(const client of await self.clients.matchAll())client.postMessage({type:'score-cache-progress',done,total:assets.length,finished});};
 await Promise.all(Array.from({length:4},async()=>{while(next<assets.length){const path=assets[next++],url=new URL(path,self.registration.scope).href;try{if(!await cache.match(url)){const r=await fetch(url);if(!r.ok)throw Error('Asset unavailable');await cache.put(url,r);}done++;}catch{}if(done%20===0)await report(false);}}));await report(true);
 })();try{await warming;}finally{warming=null;}
}
self.addEventListener('message',e=>{if(e.data?.type==='cache-scores')e.waitUntil(warmScores());});
self.addEventListener('fetch',e=>{
 if(!e.request.url.startsWith('http')||e.request.method!=='GET'||new URL(e.request.url).origin!==self.location.origin)return;
 e.respondWith((async()=>{const score=/\.(mxl|pdf)$/.test(new URL(e.request.url).pathname),cache=await caches.open(score?SCORE_CACHE:CACHE);
 if(score){const stored=await cache.match(e.request);if(stored)return stored;}
 try{const r=await fetch(e.request,{cache:'no-cache'});if(r.ok)await cache.put(e.request,r.clone());return r;}catch(error){const stored=await cache.match(e.request);if(stored)return stored;throw error;}
 })());
});
