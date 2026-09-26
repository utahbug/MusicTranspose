import {createRequire} from 'node:module';
import {execFileSync} from 'node:child_process';
import fs from 'node:fs';import assert from 'node:assert/strict';

const oldHymn=execFileSync('git',['show','997bd3f:hymn-melody.js'],{encoding:'utf8'}),oldLead=execFileSync('git',['show','997bd3f:lead-view.js'],{encoding:'utf8'});
const {chromium}=createRequire(process.env.PLAYWRIGHT_PACKAGE)('playwright'),b=await chromium.launch({channel:'msedge',headless:true});
try{const p=await b.newPage({serviceWorkers:'block'});await p.route('**/phase2-old-hymn.mjs',route=>route.fulfill({contentType:'text/javascript',body:oldHymn}));await p.route('**/phase2-old-lead.mjs',route=>route.fulfill({contentType:'text/javascript',body:oldLead.replace("'./hymn-melody.js'","'./phase2-old-hymn.mjs'")}));await p.goto(process.env.TEST_URL||'http://127.0.0.1:8771/');await p.locator('.library-row').first().waitFor();
const rows=await p.evaluate(async()=>{
 const prior=await import('./phase2-old-lead.mjs');
 const {songs}=await import('./songs.js'),{createLeadXML}=await import('./lead-view.js'),{unpackMXL,transposeXML,shiftOctaveXML,originalKey}=await import('./music.js'),{scoreTimeline}=await import('./playback.js');
 const must=(v,m)=>{if(!v)throw Error(m);},parse=x=>new DOMParser().parseFromString(x,'application/xml'),rows=[];
 for(const s of songs.filter(s=>s.scoreType!=='pdf')){
  const source=unpackMXL(await(await fetch(s.asset)).arrayBuffer()),old=prior.createLeadXML(source,s),now=createLeadXML(source,s);
  if(old.ok){must(now.ok&&now.xml===old.xml,s.title+' previous output changed');continue;}
  if(!now.ok){must(now.xml===source,s.title+' unrelated fallback changed');continue;}
  must(s.id==='song-af8cc3c9-0ae1-4878-9a60-9c5a37a19918',s.title+' unexpected new coverage');
  const d=parse(source),parts=[...d.querySelectorAll('score-partwise>part')],upper=parts[0];
  const output=parse(now.xml),cue=output.querySelector('type[size="cue"]')?.closest('note');must(cue&&cue.querySelector('pitch step').textContent==='A'&&cue.querySelector('pitch alter').textContent==='1'&&cue.querySelector('pitch octave').textContent==='4','A-sharp 4 connector retained');must(cue.closest('measure').getAttribute('number')==='X11'&&!cue.querySelector('lyric'),'connector location and absent lyric retained');must(output.querySelectorAll('type[size="cue"]').length===1,'exactly one connector');must(!output.querySelector('note>chord'),'Lead remains monophonic');
  let viewOnly=false;try{originalKey(source,s.modeOverride);}catch(e){must(/modulations require review/.test(e.message),s.title+' unexpected source-key error');viewOnly=true;let leadRejects=false;try{originalKey(now.xml,s.modeOverride);}catch{leadRejects=true;}must(leadRejects,s.title+' modulation lost');}
  for(const shift of (viewOnly?[]:[-3,2])){const a=createLeadXML(transposeXML(source,shift,s.modeOverride),s);must(a.ok&&parse(a.xml).documentElement.outerHTML===parse(transposeXML(now.xml,shift,s.modeOverride)).documentElement.outerHTML,s.title+' transposition mismatch');}
  const notes=scoreTimeline(now.xml).notes;for(const octave of [-1,1]){const shifted=scoreTimeline(shiftOctaveXML(now.xml,octave)).notes;must(shifted.length===notes.length&&shifted.every((n,i)=>n.midi===notes[i].midi+octave*12),s.title+' octave playback');}
  rows.push({id:s.id,title:s.title,page:s.page,viewOnly});
 }
 return rows;
});assert.equal(rows.length,1);fs.writeFileSync('test-results/lead-continuity-new.json',JSON.stringify(rows,null,2));console.log('PASS existing outputs and unrelated fallbacks unchanged; sole new source retains A-sharp connector; key/octave/playback checks');
}finally{await b.close();}
