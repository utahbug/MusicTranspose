// Read-only catalog audit. Diagnostic cue removal is never production extraction.
import {createRequire} from 'node:module';import {execFileSync} from 'node:child_process';import fs from 'node:fs';import assert from 'node:assert/strict';
const {chromium}=createRequire(process.env.PLAYWRIGHT_PACKAGE)('playwright'),b=await chromium.launch({channel:'msedge',headless:true});
try{const p=await b.newPage({serviceWorkers:'block'});for(const file of ['lead-view.js','hymn-melody.js','lead-availability.js']){const body=execFileSync('git',['show','997bd3f:'+file],{encoding:'utf8'});await p.route('**/'+file,route=>route.fulfill({contentType:'text/javascript',body}));}await p.goto(process.env.TEST_URL||'http://127.0.0.1:8771/');await p.locator('.library-row').first().waitFor();
const result=await p.evaluate(async()=>{
 const {songs}=await import('./songs.js'),{unpackMXL}=await import('./music.js'),{createLeadXML}=await import('./lead-view.js'),{hymnMelody}=await import('./hymn-melody.js'),{bundledLeadIds}=await import('./lead-availability.js');
 const rows=[];let supported=0,total=0;const text=(n,t,f='')=>n.querySelector(':scope>'+t)?.textContent.trim()??f;
 for(const song of songs.filter(s=>s.scoreType!=='pdf')){
  total++;const source=unpackMXL(await(await fetch(song.asset)).arrayBuffer()),lead=createLeadXML(source,song);if(lead.ok!==bundledLeadIds.has(song.id))throw Error(song.id+' availability mismatch');if(lead.ok){supported++;continue;}
  if(lead.xml!==source)throw Error(song.id+' source mutated');
  const doc=new DOMParser().parseFromString(source,'application/xml');if(!doc.querySelector('cue,type[size="cue"],note[type="cue"]'))continue;
  const parts=[...doc.querySelectorAll('score-partwise>part')],notes=[];
  for(const [pi,part] of parts.entries()){let div=1;for(const [mi,m] of [...part.children].filter(n=>n.localName==='measure').entries()){let at=0,last=0;
   for(const n of m.children){if(n.localName==='attributes')div=Number(text(n,'divisions',String(div)));else if(n.localName==='backup')at-=Number(text(n,'duration'))/div;else if(n.localName==='forward')at+=Number(text(n,'duration'))/div;else if(n.localName==='note'){
    const chord=!!n.querySelector('chord'),when=chord?last:at,duration=Number(text(n,'duration','0'))/div;if(!chord){last=at;at+=duration;}
    notes.push({pi,part:part.id,staff:text(n,'staff','1'),voice:text(n,'voice','1'),mi,measure:m.getAttribute('number'),at:when,duration,chord,lyric:!!n.querySelector('lyric'),pitched:!!n.querySelector('pitch'),cue:!!n.querySelector('cue,type[size="cue"]')||n.getAttribute('type')==='cue',words:[...n.querySelectorAll('lyric text')].map(n=>n.textContent)});
   }}
  }}
  const upper=notes.filter(n=>n.pi===0&&n.staff==='1'),lyrics=upper.filter(n=>n.lyric),voices=[...new Set(lyrics.map(n=>n.voice))];
  const isBefore=(a,b)=>a.mi<b.mi||a.mi===b.mi&&a.at<b.at;
  const first=lyrics[0],last=lyrics.at(-1),nonlyric=upper.filter(n=>voices.includes(n.voice)&&n.pitched&&!n.lyric&&!n.chord);
  const pre=first?nonlyric.filter(n=>isBefore(n,first)):[],post=last?nonlyric.filter(n=>isBefore(last,n)):[];
  const cueContinuation=nonlyric.filter(n=>n.cue);
  const instrumentMeasures=[...new Set(nonlyric.filter(n=>!lyrics.some(l=>l.mi===n.mi)).map(n=>n.measure))];
  const originalCheck=hymnMelody(source);
  // Reveal additional blockers only; do not remove cues from app or assets.
  for(const n of doc.querySelectorAll('cue'))n.remove();for(const n of doc.querySelectorAll('type[size="cue"]'))n.removeAttribute('size');
  const diagnostic=hymnMelody(new XMLSerializer().serializeToString(doc));
  rows.push({id:song.id,title:song.title,collection:song.collection,page:song.page,reason:lead.reason,parts:parts.length,lyricVoices:voices,cueNotes:notes.filter(n=>n.cue).length,upperCues:upper.filter(n=>n.cue).length,nonlyricNotes:nonlyric.length,preludeCandidates:pre,postludeCandidates:post,instrumentMeasures,cueContinuation,originalStructuralCheck:originalCheck.ok?'passes':originalCheck.reason,diagnosticAfterCueRemoval:diagnostic.ok?'passes':diagnostic.reason,diagnosticDetail:diagnostic.detail||'',firstSungMeasure:first?.measure,lastSungMeasure:last?.measure});
 }
 return {total,supported,fallback:total-supported,rows};
});assert.equal(result.supported,243);assert.equal(result.total,679);fs.writeFileSync('reports/lead-phase2c-audit.json',JSON.stringify(result,null,2)+String.fromCharCode(10));
console.log('CATALOG',result.total,result.supported,result.fallback,'cue-bearing fallbacks',result.rows.length);
for(const r of result.rows.filter(r=>r.preludeCandidates.length||r.postludeCandidates.length||r.cueContinuation.length))console.log(r.id,r.title,'pre/post',r.preludeCandidates.length,r.postludeCandidates.length,'cue continuation',r.cueContinuation.length,'instrumental measures',r.instrumentMeasures.join(','),'guard',r.diagnosticAfterCueRemoval,r.diagnosticDetail);
}finally{await b.close();}
