import {createRequire} from 'node:module';import fs from 'node:fs';import assert from 'node:assert/strict';
const {chromium}=createRequire(process.env.PLAYWRIGHT_PACKAGE)('playwright'),b=await chromium.launch({channel:'msedge',headless:true}),p=await b.newPage({viewport:{width:820,height:1180},serviceWorkers:'block'});
try{await p.goto(process.env.TEST_URL||'http://127.0.0.1:8780/');await p.locator('.library-row').first().waitFor();const results=[];const rows=JSON.parse(fs.readFileSync('test-results/phase3-audit.json','utf8')).filter(r=>r.ok&&!r.oldOk);for(const [i,r] of rows.entries()){
 await p.evaluate(id=>prototype.loadSong(id,'large'),r.id);await p.waitForFunction(()=>prototype.ready&&!prototype.busy,{},{timeout:120000});
 const result=await p.evaluate(()=>({ok:prototype.lead?.ok,reason:prototype.lead?.reason,detail:prototype.lead?.detail,svg:document.querySelectorAll('#score svg').length,view:document.querySelector('#score-view-label').textContent,overflow:document.documentElement.scrollWidth>innerWidth}));results.push({id:r.id,...result});
 if(!result.ok||!result.svg||result.view!=='Melody only')console.log('FAIL',r.id,result);if(i%25===0)console.log('ENGRAVED',i+1,'/',rows.length,r.id);
 }fs.writeFileSync('test-results/phase3-all-render.json',JSON.stringify(results,null,2));assert(results.every(r=>r.ok&&r.svg&&r.view==='Melody only'&&!r.overflow),'Newly supported score engraving failure; see saved results');console.log('PASS all newly supported scores engrave',results.length);
}finally{await b.close();}
