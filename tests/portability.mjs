import {createRequire} from 'node:module';
import fs from 'node:fs/promises';import path from 'node:path';import os from 'node:os';import http from 'node:http';import assert from 'node:assert/strict';import {createHash} from 'node:crypto';
const require=createRequire(process.env.PLAYWRIGHT_PACKAGE||import.meta.url);const {chromium}=require('playwright');
const project=path.resolve('.'),temp=await fs.mkdtemp(path.join(os.tmpdir(),'music-transpose-portable-'));const root=path.join(temp,'music-transpose-prototype');await fs.mkdir(root);
const items=['index.html','styles.css','app.js','score-layout.js','navigation.js','music.js','songs.js','sw.js','manifest.webmanifest','robots.txt','assets','vendor','.nojekyll'];
for(const item of items)await fs.cp(path.join(project,item),path.join(root,item),{recursive:true,errorOnExist:true});
const hash=b=>createHash('sha256').update(b).digest('hex');const hashes=[];
async function walk(dir){let out=[];for(const e of await fs.readdir(dir,{withFileTypes:true})){const f=path.join(dir,e.name);if(e.isDirectory())out.push(...await walk(f));else out.push(f);}return out;}
for(const f of await walk(root)){const rel=path.relative(root,f);const bytes=await fs.readFile(f);assert.equal(hash(bytes),hash(await fs.readFile(path.join(project,rel))));hashes.push({file:rel,sha256:hash(bytes)});}
const missing=[],requests=[],external=[],errors=[],checks=[];const prefix='/music-transpose-prototype/';
const server=http.createServer(async(req,res)=>{try{const url=new URL(req.url,'http://test');if(!url.pathname.startsWith(prefix))throw Error('outside prefix');let rel=decodeURIComponent(url.pathname.slice(prefix.length));if(!rel||rel.endsWith('/'))rel+='index.html';const file=path.resolve(root,rel);if(!file.startsWith(root+path.sep))throw Error('outside copy');const bytes=await fs.readFile(file);res.setHeader('Content-Type',({'.html':'text/html','.js':'text/javascript','.css':'text/css','.mxl':'application/vnd.recordare.musicxml'})[path.extname(file)]||'application/octet-stream');res.end(bytes);}catch{missing.push(req.url);res.writeHead(404);res.end('Not found');}});
await new Promise(r=>server.listen(0,'127.0.0.1',r));const base=`http://127.0.0.1:${server.address().port}${prefix}`;
const browser=await chromium.launch({channel:process.env.BROWSER_CHANNEL||'msedge',headless:true});
try{
const context=await browser.newContext({hasTouch:true});context.on('request',r=>{requests.push(r.url());if(!r.url().startsWith(base)&&!r.url().startsWith('data:'))external.push(r.url());});
await context.route('**/*',route=>route.request().url().startsWith(base)?route.continue():route.abort());const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));
const done=n=>page.waitForFunction(n=>window.prototype?.ready&&!prototype.busy&&prototype.current===n,n);
async function select(id){await page.locator('#songs').click();await page.locator(`[data-song="${id}"]`).click();await page.waitForFunction(id=>prototype.song===id&&prototype.ready&&!prototype.busy&&prototype.current===0,id);}
for(const viewport of [{width:1180,height:820},{width:820,height:1180}]){
 await page.setViewportSize(viewport);await page.goto(base);await done(0);await page.evaluate(()=>navigator.serviceWorker.ready);await page.waitForFunction(()=>navigator.serviceWorker.controller);
 for(const [song,key,target,fifths] of [['nativity','G major','A major',3],['shepherd','D minor','E minor',1]]){
  await select(song);assert.equal(await page.locator('#key-name').textContent(),key);const original=await page.evaluate(()=>prototype.original);
  assert(await page.locator('#score svg').count()>0);await page.locator('#key').click();await page.locator('[data-shift="2"]').click();await done(2);assert.equal(await page.locator('#key-name').textContent(),target);
  const music=await page.evaluate(fifths=>{const parse=s=>new DOMParser().parseFromString(s,'application/xml');const a=parse(prototype.original),b=parse(prototype.xml),nat={C:0,D:2,E:4,F:5,G:7,A:9,B:11};const pitches=d=>[...d.querySelectorAll('note > pitch')].map(n=>(+n.querySelector('octave').textContent+1)*12+nat[n.querySelector('step').textContent]+Number(n.querySelector('alter')?.textContent||0));const ap=pitches(a),bp=pitches(b);return ap.every((x,i)=>bp[i]===x+2)&&[...b.querySelectorAll('key > fifths')].every(x=>+x.textContent===fifths);},fifths);assert(music);
  await page.locator('#reset').click();await done(0);assert.equal(await page.evaluate(()=>prototype.xml),original);
  assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));const sizes=await page.locator('#songs,#print,#down,#key,#up,#reset').evaluateAll(es=>es.map(e=>{const r=e.getBoundingClientRect();return {w:r.width,h:r.height,right:r.right};}));assert(sizes.every(r=>r.w>=44&&r.h>=44&&r.right<=viewport.width));
  await page.screenshot({path:`test-results/portable-${song}-${viewport.width}.png`});checks.push({song,viewport,render:true,transpose:true,resetExact:true,dialogs:true,noOverflow:true});
 }
}
const scope=await page.evaluate(async()=>(await navigator.serviceWorker.ready).scope);assert.equal(scope,base);
await context.setOffline(true);await page.reload();await done(0);await select('shepherd');await page.locator('#up').click();await done(1);assert.equal(await page.locator('#key-name').textContent(),'E♭ minor');await select('nativity');assert.equal(await page.locator('#key-name').textContent(),'G major');
assert.deepEqual(missing,[]);assert.deepEqual(external,[]);assert.deepEqual(errors,[]);
await fs.writeFile('test-results/portability.json',JSON.stringify({temporaryCopy:root,base,scope,hashes,checks,offlineReloadAndSwitching:true,missing,external,errors,requestedPaths:[...new Set(requests.map(u=>u.replace(base,'./')))]},null,2));console.log('PASS: copied static subdirectory, both songs, major/minor, exact reset, both viewports, offline reload/switching; no missing assets or external requests.');console.log('Temporary copy: '+root);
}finally{await browser.close();await new Promise(r=>server.close(r));}
// Keep the isolated test copy for inspection; it is outside the project and is never a deployment source.
