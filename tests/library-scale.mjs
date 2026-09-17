import {createRequire} from 'node:module';import assert from 'node:assert/strict';import fs from 'node:fs/promises';
const require=createRequire(process.env.PLAYWRIGHT_PACKAGE||import.meta.url),{chromium}=require('playwright');const b=await chromium.launch({channel:'msedge',headless:true});const p=await b.newPage({viewport:{width:375,height:812},serviceWorkers:'block'});
const base=process.env.TEST_URL||'http://127.0.0.1:8767/';
try{
 await p.route('**/songs.js',async route=>{const r=await route.fetch();const body=await r.text();await route.fulfill({response:r,body:body+`\nfor(let i=1;i<=500;i++)songs.push({...songs[0],id:'fixture-'+i,title:'Scale fixture '+i,page:String(i)});`});});
 await p.goto(base);await p.waitForFunction(()=>document.querySelectorAll('.library-row').length===504);const start=performance.now();await p.locator('#library-search').fill('fixture 487');assert.equal(await p.locator('.library-row').count(),1);assert((await p.locator('.song-entry strong').textContent()).includes('487'));const searchMs=Math.round(performance.now()-start);await p.locator('#library-search').fill('');assert.equal(await p.locator('.library-row').count(),504);assert(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
 console.log(`PASS: 504-entry in-memory fixture; search ${searchMs}ms including browser automation. No additional scores imported.`);
}finally{await b.close();}
