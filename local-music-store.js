// Private records are separate from public catalog/cache and survive app-shell updates.
const DB='music-transpose-my-music-v1';
let connection;
function db(){return connection??=new Promise((resolve,reject)=>{const r=indexedDB.open(DB,1);r.onupgradeneeded=()=>{const s=r.result.createObjectStore('songs',{keyPath:'metadata.id'});s.createIndex('hash','metadata.hash',{unique:true});r.result.createObjectStore('metadata',{keyPath:'id'});};r.onsuccess=()=>{r.result.onversionchange=()=>{r.result.close();connection=null;};resolve(r.result);};r.onerror=()=>{connection=null;reject(r.error);};});}
async function transaction(mode,run,store='songs'){const d=await db();return new Promise((resolve,reject)=>{const t=d.transaction(mode==='readwrite'?['songs','metadata']:store,mode);let r;try{r=run(t.objectStore(store),t);}catch(error){t.abort();reject(error);return;}t.oncomplete=()=>resolve(r?.result);t.onabort=t.onerror=()=>reject(t.error||r?.error||Error('Storage unavailable'));});}
export const localMetadata=()=>transaction('readonly',s=>s.getAll(),'metadata');
export const localRecords=()=>transaction('readonly',s=>s.getAll());
export const localRecord=id=>transaction('readonly',s=>s.get(id));
export const byHash=hash=>transaction('readonly',s=>s.index('hash').get(hash));
export const addRecord=record=>transaction('readwrite',(s,t)=>{t.objectStore('metadata').add(record.metadata);return s.add(record);});
export const updateRecord=record=>transaction('readwrite',(s,t)=>{t.objectStore('metadata').put(record.metadata);return s.put(record);});
export const removeRecord=id=>transaction('readwrite',(s,t)=>{t.objectStore('metadata').delete(id);return s.delete(id);});
export function storageMessage(error){return error?.name==='ConstraintError'?'This exact file is already in My Music.':error?.name==='QuotaExceededError'?'Not enough browser storage. Free some space and try again.':'Unable to save on this device. Check browser storage permissions and try again.';}
