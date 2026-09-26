import {createRequire} from 'node:module';
import fs from 'node:fs';
import assert from 'node:assert/strict';
const {chromium}=createRequire(process.env.PLAYWRIGHT_PACKAGE)('playwright');
const browser=await chromium.launch({channel:'msedge',headless:true});
try {
 const page=await browser.newPage();await page.goto(process.env.TEST_URL||'http://127.0.0.1:8771/');await page.locator('.library-row').first().waitFor();
 const baseline=fs.existsSync('reports/lead-phase2b-baseline.json')?JSON.parse(fs.readFileSync('reports/lead-phase2b-baseline.json','utf8')):null;
 const results=await page.evaluate(async baseline=>{
  const {songs}=await import('./songs.js'),{unpackMXL}=await import('./music.js'),{createLeadXML}=await import('./lead-view.js');
  const all=[],rows=[];
  for(const song of songs.filter(s=>s.scoreType!=='pdf')){
   const source=unpackMXL(await(await fetch(song.asset)).arrayBuffer()),result=createLeadXML(source,song);
   all.push({id:song.id,title:song.title,collection:song.collection,page:song.page,ok:result.ok,reason:result.reason});
   if(baseline?!baseline.targetIds.includes(song.id):result.reason!=='hymn-notation')continue;
   const doc=new DOMParser().parseFromString(source,'application/xml'),parts=[...doc.querySelectorAll('score-partwise>part')],notes=[];
   for(const [pi,part] of parts.entries())for(const [mi,m] of [...part.querySelectorAll(':scope>measure')].entries()){
    let anchor=null;
    for(const n of m.querySelectorAll(':scope>note')){
     if(!n.querySelector('chord'))anchor=n;
     if(!n.querySelector('cue,type[size="cue"]')&&n.getAttribute('type')!=='cue')continue;
     const txt=(n,t)=>n.querySelector(':scope>'+t)?.textContent.trim()||'',staff=txt(n,'staff')||'1';
     notes.push({part:part.id,staff,voice:txt(n,'voice')||'1',measure:m.getAttribute('number'),measureIndex:mi,upper:pi===0&&staff==='1',cue:!!n.querySelector('cue'),small:!!n.querySelector('type[size="cue"]'),full:!!n.querySelector('type[size="full"]'),rest:!!n.querySelector('rest'),chord:!!n.querySelector('chord'),lyrics:!!n.querySelector('lyric'),anchorCue:!!anchor?.querySelector('cue,type[size="cue"]'),sameDuration:txt(n,'duration')===txt(anchor,'duration'),xml:n.outerHTML});
    }
   }
   const other=[...doc.querySelectorAll('grace,unpitched,transpose,staff-tuning,ossia,part-link,measure-style,octave-shift,tremolo')].map(n=>n.localName);
   if([...doc.querySelectorAll('clef-octave-change')].some(n=>Number(n.textContent)!==0))other.push('octave-clef');
   const upper=notes.some(n=>n.upper),lower=notes.some(n=>!n.upper);
   const pattern=other.length?'other-notation':upper?(lower?'upper-and-lower-cues':'upper-cues'):notes.every(n=>n.cue&&n.full&&!n.rest)?'lower-full-cues':'lower-small-or-mixed-cues';
   // Diagnostic only: reveal later guards. This copy is never used by the app.
   for(const n of doc.querySelectorAll('cue'))n.remove();for(const n of doc.querySelectorAll('type[size="cue"]'))n.removeAttribute('size');
   const diagnostic=createLeadXML(new XMLSerializer().serializeToString(doc),song);
   rows.push({id:song.id,title:song.title,page:song.page,pattern,other:[...new Set(other)],notes,ok:result.ok,reason:result.reason,diagnostic:diagnostic.ok?'eligible-after-cue-removal':diagnostic.reason});
  }
  return {all,rows};
 },baseline);
 assert.equal(results.rows.length,124);
 if(!baseline)fs.writeFileSync('reports/lead-phase2b-baseline.json',JSON.stringify({targetIds:results.rows.map(r=>r.id),all:results.all},null,2)+'\n');
 fs.writeFileSync('reports/lead-phase2b-audit.json',JSON.stringify(results.rows,null,2)+'\n');
 fs.writeFileSync('test-results/lead-phase2b-current.json',JSON.stringify(results.all,null,2));
 const counts={};for(const r of results.rows){const k=r.pattern+' / '+r.diagnostic;counts[k]=(counts[k]||0)+1;}
 console.log(JSON.stringify(counts,null,2));console.log('Supported',results.all.filter(r=>r.ok).length);
} finally {await browser.close();}
