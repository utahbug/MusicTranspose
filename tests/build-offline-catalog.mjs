import fs from 'node:fs';import {songs} from '../songs.js';import {requiredOfflineAssets} from '../offline-assets.js';
fs.writeFileSync('offline-catalog.json',JSON.stringify(Object.fromEntries(songs.map(s=>[s.id,requiredOfflineAssets(s)]).filter(([,a])=>a.length)),null,2)+'\n');
