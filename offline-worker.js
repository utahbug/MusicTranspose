// Runs inside the existing service worker; no automatic PDF preparation.
let pdfJob=null,pdfStop=false,pdfResult={failed:0,storageFull:false};
async function offlineManifest(name){const shell=await caches.open(CACHE);const response=await shell.match(new URL(name,self.registration.scope));if(!response)throw Error('Offline information unavailable');return response.json();}
async function scoreStores(){const names=await caches.keys();return names.filter(n=>n===SCORE_CACHE||n.startsWith('music-transpose-v')&&(n.endsWith('-'+self.registration.scope+'-scores')||n.endsWith('-'+self.registration.scope)));}
async function storedScore(request){for(const name of await scoreStores()){const r=await(await caches.open(name)).match(request);if(r)return r;}return undefined;}
async function offlineStatus(){const [pdf,manifest,names]=await Promise.all([offlineManifest('./offline-pdfs.json'),offlineManifest('./offline-scores.json'),scoreStores()]);const urls=new Set();for(const name of names)for(const r of await(await caches.open(name)).keys())urls.add(r.url);const has=path=>urls.has(new URL(path,self.registration.scope).href),structured=manifest.filter(p=>/\.(mxl|xml|musicxml)$/i.test(p));return {type:'offline-music-status',total:pdf.assets.length,done:pdf.assets.filter(a=>has(a.url)).length,totalBytes:pdf.totalBytes,structuredTotal:structured.length,structuredDone:structured.filter(has).length,running:!!pdfJob,...pdfResult};}
async function broadcastOffline(){const status=await offlineStatus();for(const client of await self.clients.matchAll())client.postMessage(status);return status;}
async function prepareOriginalPdfs(){pdfStop=false;pdfResult={failed:0,storageFull:false};const {assets}=await offlineManifest('./offline-pdfs.json'),cache=await caches.open(SCORE_CACHE);
 for(const asset of assets){if(pdfStop)break;const url=new URL(asset.url,self.registration.scope).href;if(await storedScore(url))continue;
  try{const response=await fetch(url,{cache:'no-cache'});if(!response.ok)throw Error('Unavailable PDF');const bytes=await response.arrayBuffer();if(new TextDecoder().decode(bytes.slice(0,5))!=='%PDF-')throw Error('Invalid PDF');await cache.put(url,new Response(bytes,{headers:response.headers,status:response.status,statusText:response.statusText}));}
  catch(error){pdfResult.failed++;if(error.name==='QuotaExceededError'){pdfResult.storageFull=true;break;}}
  await broadcastOffline();
 }
}
self.addEventListener('message',event=>{const type=event.data?.type;if(!['offline-status','prepare-original-pdfs','stop-original-pdfs'].includes(type))return;
 const reply=value=>event.ports[0]?.postMessage(value);
 if(type==='stop-original-pdfs'){pdfStop=true;reply({ok:true});return;}
 if(type==='offline-status'){event.waitUntil(offlineStatus().then(reply).catch(()=>reply({error:true})));return;}
 if(!pdfJob){pdfJob=prepareOriginalPdfs().catch(error=>{pdfResult.failed++;pdfResult.storageFull=error.name==='QuotaExceededError';}).finally(async()=>{pdfJob=null;await broadcastOffline();});}reply({ok:true});event.waitUntil(pdfJob);
});
