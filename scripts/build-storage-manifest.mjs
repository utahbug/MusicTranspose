// Read shipped bytes at build time; never download the catalog to estimate its size.
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const worker=await fs.readFile(path.join(root,'sw.js'),'utf8');
const shell=JSON.parse(worker.match(/const ASSETS=(\[[\s\S]*?\]);/)[1]);
const catalog=JSON.parse(await fs.readFile(path.join(root,'offline-catalog.json'),'utf8'));
const file=url=>{
 const normalized=url==='./'?'index.html':url.replace(/^\.\//,'');
 if(/^[a-z]+:/i.test(normalized)||normalized.split('/').includes('..'))throw Error('Expected local asset: '+url);
 return normalized;
};
const core=[...new Set(shell.map(file))].filter(p=>p!=='storage-sizes.json').sort();
const music=[...new Set(Object.values(catalog).flat().map(a=>file(a.url)))].sort();
const bytes=async names=>(await Promise.all(names.map(async name=>(await fs.stat(path.join(root,name))).size))).reduce((sum,n)=>sum+n,0);
const result={version:1,coreBytes:await bytes(core),coreAssets:core.length,catalogBytes:await bytes(music),catalogAssets:music.length,catalogSongs:Object.keys(catalog).length};
const output=JSON.stringify(result,null,2)+'\n',destination=path.join(root,'storage-sizes.json');
if(process.argv.includes('--check')){if((await fs.readFile(destination,'utf8')).replaceAll('\r\n','\n')!==output)throw Error('Storage sizes are stale. Run node scripts/build-storage-manifest.mjs.');}
else await fs.writeFile(destination,output);
console.log(result);
