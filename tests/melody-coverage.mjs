import {createRequire} from 'node:module';
import {execFileSync} from 'node:child_process';
import fs from 'node:fs';
import assert from 'node:assert/strict';
const {chromium}=createRequire(process.env.PLAYWRIGHT_PACKAGE)('playwright');
const browser=await chromium.launch({channel:'msedge',headless:true});
try{
 const p=await browser.newPage({viewport:{width:820,height:1180},serviceWorkers:'block'});
 await p.goto(process.env.TEST_URL||'http://127.0.0.1:8780/');await p.locator('.library-row').first().waitFor();
 const audit=await p.evaluate(async()=>{
  const {songs}=await import('./songs.js'),{supportsLead}=await import('./catalog.js'),{bundledLeadIds}=await import('./lead-availability.js'),{createLeadXML}=await import('./lead-view.js'),{unpackMXL}=await import('./music.js');
  const rows=[];
  for(const s of songs){
   const row={id:s.id,title:s.title,collection:s.collection,page:s.page||'',asset:s.asset,pdfOnly:s.scoreType==='pdf',indexed:bundledLeadIds.has(s.id),supportsLead:supportsLead(s)};
   if(!row.pdfOnly){
    const response=await fetch(s.asset);if(!response.ok)throw Error(s.id+' HTTP '+response.status);
    const source=unpackMXL(await response.arrayBuffer()),lead=createLeadXML(source,s);
    const doc=lead.ok?new DOMParser().parseFromString(lead.xml,'application/xml'):null;
    Object.assign(row,{ok:lead.ok,reason:lead.reason??null,detail:lead.detail??null,message:lead.message??null,selection:lead.selection??null,melodyEvents:doc?doc.querySelectorAll('part > measure > note').length:null,harmonies:doc?doc.querySelectorAll('part > measure > harmony').length:null,classification:row.indexed?(lead.ok?'A':'C'):(lead.ok?'B':'D')});
   }
   rows.push(row);
  }
  const collections=[...new Set(rows.map(r=>r.collection))].map(collection=>{const all=rows.filter(r=>r.collection===collection),structured=all.filter(r=>!r.pdfOnly),melody=structured.filter(r=>r.supportsLead).length;return {collection,total:all.length,pdfOnly:all.length-structured.length,structured:structured.length,melody,noMelody:structured.length-melody,coverage:structured.length?Number((100*melody/structured.length).toFixed(2)):null,liveSuccess:structured.filter(r=>r.ok).length};});
  return {rows,collections,orphanIndexIds:[...bundledLeadIds].filter(id=>!songs.some(s=>s.id===id)),indexSize:bundledLeadIds.size};
 });
 audit.sourceCommit=execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim();
 audit.classifications=Object.fromEntries(['A','B','C','D'].map(k=>[k,audit.rows.filter(r=>r.classification===k).length]));
 audit.failures=[...new Set(audit.rows.filter(r=>r.ok===false).map(r=>r.reason))].map(reason=>{const rows=audit.rows.filter(r=>r.ok===false&&r.reason===reason);return {reason,count:rows.length,collections:Object.fromEntries([...new Set(rows.map(r=>r.collection))].map(c=>[c,rows.filter(r=>r.collection===c).length])),examples:rows.slice(0,3).map(({id,title,collection,detail})=>({id,title,collection,detail}))};}).sort((a,b)=>b.count-a.count);
 fs.writeFileSync(process.env.COVERAGE_REPORT||'reports/melody-coverage.json',JSON.stringify(audit,null,2)+'\n');
 assert.equal(new Set(audit.rows.map(r=>r.id)).size,audit.rows.length,'catalog IDs unique');
 assert.deepEqual(audit.orphanIndexIds,[],'indexed IDs exist in catalog');
 assert(audit.rows.every(r=>r.indexed===r.supportsLead),'bundled metadata and supportsLead agree');
 assert.equal(audit.classifications.B,0,'missing successful entries; inspect saved report before metadata update');
 assert.equal(audit.classifications.C,0,'stale positive entries; inspect saved report');
 console.log(JSON.stringify({collections:audit.collections,indexSize:audit.indexSize,classifications:audit.classifications,failures:audit.failures,amazingGrace:audit.rows.filter(r=>/amazing grace/i.test(r.title))},null,2));
 const ready=async()=>{await p.waitForFunction(()=>prototype.ready&&!prototype.busy&&document.querySelector('#score').getAttribute('aria-busy')==='false');};
 const checks=['hhc-1010','hhc-1009','cs-2','nativity','hhc-1035','hhc-1054','cs-168','cs-169','cs-275a','song-a13c43da-0243-4019-ad08-d7be530074f5'];
 for(const id of checks){await p.evaluate(id=>prototype.loadSong(id),id);await ready();assert(await p.locator('#score-size-options [data-size=large]').isEnabled());await p.locator('#score-size').click();await p.locator('#score-size-options [data-size=large]').click();await ready();assert(await p.evaluate(()=>prototype.lead?.ok));assert.equal(await p.locator('#score-view-label').textContent(),'Melody only');console.log('PASS representative Melody open',id);}
}finally{await browser.close();}
