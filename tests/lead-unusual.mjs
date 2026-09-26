import {createRequire} from 'node:module';
import {execFileSync} from 'node:child_process';
import fs from 'node:fs';import assert from 'node:assert/strict';
const baseline=JSON.parse(fs.readFileSync('reports/lead-phase2b-baseline.json','utf8'));
const oldHymn=execFileSync('git',['show','8166f44:hymn-melody.js'],{encoding:'utf8'}),oldLead=execFileSync('git',['show','8166f44:lead-view.js'],{encoding:'utf8'});
const {chromium}=createRequire(process.env.PLAYWRIGHT_PACKAGE)('playwright'),b=await chromium.launch({channel:'msedge',headless:true});
try{const p=await b.newPage({serviceWorkers:'block'});await p.route('**/phase2-old-hymn.mjs',route=>route.fulfill({contentType:'text/javascript',body:oldHymn}));await p.route('**/phase2-old-lead.mjs',route=>route.fulfill({contentType:'text/javascript',body:oldLead.replace("'./hymn-melody.js'","'./phase2-old-hymn.mjs'")}));await p.goto(process.env.TEST_URL||'http://127.0.0.1:8771/');await p.locator('.library-row').first().waitFor();
const rows=await p.evaluate(async({baseline,oldHymn,oldLead})=>{
 const prior=await import('./phase2-old-lead.mjs');
 const {songs}=await import('./songs.js'),{createLeadXML}=await import('./lead-view.js'),{unpackMXL,transposeXML,shiftOctaveXML,originalKey}=await import('./music.js'),{scoreTimeline}=await import('./playback.js');
 const must=(v,m)=>{if(!v)throw Error(m);},parse=x=>new DOMParser().parseFromString(x,'application/xml'),rows=[];
 for(const s of songs.filter(s=>s.scoreType!=='pdf')){
  const source=unpackMXL(await(await fetch(s.asset)).arrayBuffer()),old=prior.createLeadXML(source,s),now=createLeadXML(source,s),before=baseline.all.find(r=>r.id===s.id);
  must(old.ok===before.ok&&old.reason===before.reason,s.title+' baseline drift');
  if(!baseline.targetIds.includes(s.id)){must(now.ok===old.ok&&now.reason===old.reason&&now.xml===old.xml,s.title+' outside scope changed');continue;}
  if(!now.ok){must(now.xml===source,s.title+' fallback not exact');continue;}
  must(!old.ok,s.title+' not newly enabled');
  const d=parse(source),parts=[...d.querySelectorAll('score-partwise>part')],upper=parts[0];
  for(const cue of d.querySelectorAll('cue,type[size="cue"]')){const n=cue.closest('note');must(n&&!(n.closest('part')===upper&&(n.querySelector('staff')?.textContent||'1')==='1'),s.title+' upper cue slipped through');}
  must(!parse(now.xml).querySelector('cue,type[size="cue"]'),s.title+' cue leaked');
  let viewOnly=false;try{originalKey(source,s.modeOverride);}catch(e){must(/modulations require review/.test(e.message),s.title+' unexpected source-key error');viewOnly=true;let leadRejects=false;try{originalKey(now.xml,s.modeOverride);}catch{leadRejects=true;}must(leadRejects,s.title+' modulation lost');}
  for(const shift of (viewOnly?[]:[-3,2])){const a=createLeadXML(transposeXML(source,shift,s.modeOverride),s);must(a.ok&&parse(a.xml).documentElement.outerHTML===parse(transposeXML(now.xml,shift,s.modeOverride)).documentElement.outerHTML,s.title+' transposition mismatch');}
  const notes=scoreTimeline(now.xml).notes;for(const octave of [-1,1]){const shifted=scoreTimeline(shiftOctaveXML(now.xml,octave)).notes;must(shifted.length===notes.length&&shifted.every((n,i)=>n.midi===notes[i].midi+octave*12),s.title+' octave playback');}
  rows.push({id:s.id,title:s.title,page:s.page,viewOnly});
 }
 return rows;
},{baseline,oldHymn,oldLead});assert.equal(rows.length,40);fs.writeFileSync('test-results/lead-unusual-new.json',JSON.stringify(rows,null,2));console.log('PASS all 203 existing outputs unchanged; original 42 other Hymn fallbacks unchanged; 40 lower-cue hymns transpose/octave/playback; upper cues excluded');
}finally{await b.close();}
