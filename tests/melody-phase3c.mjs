import {createRequire} from 'node:module';
import {execFileSync} from 'node:child_process';
import fs from 'node:fs';
import assert from 'node:assert/strict';
const {chromium}=createRequire(process.env.PLAYWRIGHT_PACKAGE)('playwright');
const b=await chromium.launch({channel:'msedge',headless:true}),p=await b.newPage({viewport:{width:820,height:1180},serviceWorkers:'block'});
let baseline=execFileSync('git',['show','bc72389:lead-view.js'],{encoding:'utf8'});
baseline=baseline.replace('./right-hand-melody.js','./phase3c-rh-baseline.js');
const rhBaseline=execFileSync('git',['show','bc72389:right-hand-melody.js'],{encoding:'utf8'});
await p.route('**/phase3c-rh-baseline.js',r=>r.fulfill({contentType:'text/javascript',body:rhBaseline}));
await p.route('**/phase3-baseline.js',r=>r.fulfill({contentType:'text/javascript',body:baseline}));
try{
 await p.goto(process.env.TEST_URL||'http://127.0.0.1:8780/');
 const audit=await p.evaluate(async()=>{
  const {songs}=await import('./songs.js'),{unpackMXL}=await import('./music.js'),{createLeadXML}=await import('./lead-view.js'),{createLeadXML:old}=await import('./phase3-baseline.js');
  const must=(v,m)=>{if(!v)throw Error(m);},parse=s=>new DOMParser().parseFromString(s,'application/xml'),child=(n,k)=>[...n.children].find(c=>c.localName===k),txt=(n,k,d='')=>child(n,k)?.textContent.trim()??d;
  const pitch=n=>{const a=child(n,'pitch');return a?12*(Number(txt(a,'octave'))+1)+{C:0,D:2,E:4,F:5,G:7,A:9,B:11}[txt(a,'step')]+Number(txt(a,'alter','0')):null;};
  const events=d=>{const out=[];for(const part of d.querySelectorAll('score-partwise > part')){let div=1;for(const [mi,m] of [...part.children].entries()){let at=0,last=0;for(const n of m.children){if(n.localName==='attributes')div=Number(txt(n,'divisions',String(div)));const dur=Number(txt(n,'duration','0'))/div;if(n.localName==='backup')at-=dur;if(n.localName==='forward')at+=dur;if(n.localName==='note'){const t=child(n,'chord')?last:at;out.push({part:part.id,staff:txt(n,'staff','1'),voice:txt(n,'voice','1'),mi,at:t,duration:dur,pitch:pitch(n),node:n});if(!child(n,'chord')){last=at;at+=dur;}}}}}return out;};
  const {scoreTimeline}=await import('./playback.js');
  const rows=[];
  for(const song of songs.filter(s=>s.scoreType!=='pdf')){
   const source=unpackMXL(await(await fetch(song.asset)).arrayBuffer()),prior=old(source,song),lead=createLeadXML(source,song);
   if(prior.ok)must(lead.ok&&lead.xml===prior.xml,song.id+' existing projection changed');
   if(!lead.ok)must(lead.xml===source,song.id+' fallback source changed');
   if(lead.ok&&!prior.ok){
    const src=events(parse(source)),d=parse(lead.xml),dst=events(d),proof=lead.melodyProof;
    must(proof?.length===dst.length,song.id+' event proof length');must(d.querySelectorAll('part').length===1&&!d.querySelector('note > chord'),song.id+' monophonic projection');
    for(const [i,e] of dst.entries()){
     const a=proof[i],group=src.filter(s=>s.part===a.part&&s.staff===a.staff&&s.voice===a.voice&&s.duration>0&&s.mi===a.measure&&Math.abs(s.at-a.at)<1e-7),selected=group[a.sourceChordIndex];
     must(selected&&selected.pitch===e.pitch&&Math.abs(selected.duration-e.duration)<1e-7&&e.mi===a.measure&&Math.abs(e.at-a.at)<1e-7,song.id+' source event '+i);
     must(a.part===lead.selection.part&&a.staff===lead.selection.staff,song.id+' crossed RH domain');
     const childrenTies=n=>[...n.querySelectorAll(':scope > tie')].map(t=>t.getAttribute('type'));const adjustments=(lead.tieAdjustments||[]).filter(c=>c.measure===a.measure+1&&Math.abs(c.at-a.at)<1e-7&&c.pitch===e.pitch),expected=childrenTies(selected.node);
     for(const c of adjustments)if(c.action==='add-playback-stop')expected.push('stop');else if(c.action==='add-playback-start')expected.push('start');else if(c.action.startsWith('omit-playback-')){must(expected.includes(c.action.slice(14)),song.id+' absent source tie');expected.splice(expected.indexOf(c.action.slice(14)),1);}
     must(JSON.stringify(childrenTies(e.node).sort())===JSON.stringify(expected.sort()),song.id+' unreported tie change');
     const visual=n=>[...n.querySelectorAll('notations > tied')].map(t=>t.outerHTML),visualExpected=visual(selected.node).filter(mark=>!adjustments.some(c=>c.action.startsWith('omit-visual-')&&new DOMParser().parseFromString(mark,'application/xml').documentElement.getAttribute('type')===c.action.slice(12)));
     must(JSON.stringify(visual(e.node))===JSON.stringify(visualExpected),song.id+' unreported visual tie change');
     const owner=group.find(s=>s.node.querySelector('lyric'))||src.find(s=>s.mi===a.measure&&Math.abs(s.at-a.at)<1e-7&&s.duration>=a.duration-1e-7&&s.node.querySelector('lyric')&&src.some(v=>v.part===s.part&&v.voice===s.voice&&v.mi===s.mi&&v.at===s.at&&v.pitch===e.pitch));const lyrics=n=>[...n.querySelectorAll('lyric')].map(l=>l.outerHTML).join('');must(lyrics(e.node)===lyrics(owner?.node||selected.node),song.id+' lyrics lost');
    }
    must(d.querySelectorAll('harmony').length===parse(source).querySelectorAll('harmony').length,song.id+' harmony count changed');
    const a=scoreTimeline(source),b=scoreTimeline(lead.xml);
    // Independent written-order performance calculation from proven source
    // onsets/durations plus the explicitly checked projected tie endpoints.
    const lengths=[];for(const e of src)lengths[e.mi]=Math.max(lengths[e.mi]||0,e.at+e.duration);
    let sum=0;const starts=lengths.map(n=>{const at=sum;sum+=n;return at;});
    const seconds=beat=>{let at=0,time=0,bpm=90;for(const [pos,next] of a.tempos){if(pos>beat)break;time+=(pos-at)*60/bpm;at=pos;bpm=next;}return time+(beat-at)*60/bpm;};
    const expectedPlayback=[];let sustain=null;
    for(const e of dst){if(e.pitch===null){sustain=null;continue;}const beat=starts[e.mi]+e.at,types=[...e.node.querySelectorAll(':scope > tie')].map(t=>t.getAttribute('type'));
     if(types.includes('stop')&&sustain&&sustain.pitch===e.pitch&&Math.abs(sustain.beat+sustain.beats-beat)<1e-7){sustain.beats+=e.duration;if(!types.includes('start'))sustain=null;}
     else{const event={pitch:e.pitch,beat,beats:e.duration};expectedPlayback.push(event);sustain=types.includes('start')?event:null;}
    }
    must(expectedPlayback.length===b.notes.length,song.id+' duplicated/missing playback attacks');
    must(expectedPlayback.every((e,i)=>b.notes[i].midi===e.pitch&&Math.abs(b.notes[i].start-seconds(e.beat))<1e-7&&Math.abs(b.notes[i].duration-(seconds(e.beat+e.beats)-seconds(e.beat)))<1e-7),song.id+' playback timing/duration mismatch');
    must(JSON.stringify(a.tempos)===JSON.stringify(b.tempos),song.id+' tempo map changed');
    must(JSON.stringify(a.measures.map(m=>[m.length,m.beats,m.unit]))===JSON.stringify(b.measures.map(m=>[m.length,m.beats,m.unit])),song.id+' meter/rhythm changed');
    const bars=doc=>[...new Set([...doc.querySelectorAll('score-partwise > part')].flatMap(part=>[...part.children].flatMap((m,i)=>[...m.querySelectorAll('barline > ending,barline > repeat')].map(e=>[i,e.localName,e.getAttribute('type'),e.getAttribute('number'),e.getAttribute('direction')].join(':')))))].sort();
    must(JSON.stringify(bars(parse(source)))===JSON.stringify(bars(d)),song.id+' repeats/endings changed');
   }
   rows.push({id:song.id,title:song.title,collection:song.collection,page:song.page,oldOk:prior.ok,oldReason:prior.reason,ok:lead.ok,reason:lead.reason,detail:lead.detail,events:lead.ok?parse(lead.xml).querySelectorAll('note').length:null,harmonies:lead.ok?parse(lead.xml).querySelectorAll('harmony').length:null,lyriclessEvents:lead.ok?[...parse(lead.xml).querySelectorAll('note')].filter(n=>!n.querySelector('lyric')).length:null,selection:lead.selection,tieAdjustments:lead.tieAdjustments||[]});
  }
  must(rows.filter(r=>r.oldOk).length===578,'Baseline supported count');
  return rows;
 });
 fs.writeFileSync('test-results/phase3c-audit.json',JSON.stringify(audit,null,2));
 console.log('PASS independent source pitches/rh ownership/rhythm/lyrics/ties; all previous 578 outputs unchanged',audit.filter(r=>r.ok).length);
 const expected=['hhc-1021','hhc-1039','nativity','shepherd','cs-2','cs-95','cs-109','cs-82','hhc-1001','hhc-1004','hhc-1009','hhc-1010','hhc-1035','hhc-1054','hhc-1055','hhc-1072','hhc-1201','hhc-1210'];
 for(const id of expected){const r=audit.find(r=>r.id===id);assert(r?.ok,id+' named regression: '+r?.detail);console.log(id,r.ok,r.reason,r.detail||'');}
 if(process.env.PHASE3C_RENDER){
  const ready=()=>p.waitForFunction(()=>prototype.ready&&!prototype.busy&&document.querySelector('#score').getAttribute('aria-busy')==='false',{},{timeout:120000});
  const named=audit.filter(r=>r.ok&&!r.oldOk);
  await p.evaluate(()=>{const proto=opensheetmusicdisplay.OpenSheetMusicDisplay.prototype,render=proto.render;proto.render=function(...args){const result=render.apply(this,args);window.phase3Engraver=this;return result;};});
  const renders=[];
  for(const [width,height] of [[820,1180],[768,1024],[1440,1000]]){await p.setViewportSize({width,height});for(const r of named.filter(r=>r.ok)){
   await p.evaluate(id=>prototype.loadSong(id,'normal'),r.id);await ready();const full=await p.evaluate(async()=>{const v=await import('./virtual-pages.js');v.prepareVirtualPages(true);return v.virtualFrames().length;});
   await p.evaluate(id=>prototype.loadSong(id,'large'),r.id);await ready();assert(await p.evaluate(()=>prototype.lead?.ok),r.id);assert(await p.locator('#score svg').count());
   await p.evaluate(async()=>{
    const {scoreTimeline}=await import('./playback.js'),{transposeXML}=await import('./music.js');
    const xml=prototype.viewXML,doc=new DOMParser().parseFromString(xml,'application/xml');
    if(doc.querySelector('parsererror'))throw Error('Invalid export XML');
    const a=scoreTimeline(xml),shifted=transposeXML(xml,2),b=scoreTimeline(shifted);
    if(a.notes.length!==b.notes.length||!a.notes.length||!a.notes.every((n,i)=>b.notes[i].midi===n.midi+2&&b.notes[i].duration===n.duration))throw Error('Transposed melody playback mismatch');
   });
   const details=await p.evaluate(()=>({overflow:document.documentElement.scrollWidth>innerWidth,engravedSvgs:document.querySelectorAll('#score svg').length,view:document.querySelector('#score-view-label').textContent,lyricCollisions:window.phase3Engraver.GraphicSheet.MusicPages.flatMap(p=>p.MusicSystems).flatMap(s=>s.StaffLines.flatMap(l=>{const entries=l.Measures.flatMap(m=>m.staffEntries.flatMap(e=>e.LyricsEntries)).map(e=>{const b=e.GraphicalLabel.PositionAndShape;return {verse:e.LyricsEntry.VerseNumber,text:e.GraphicalLabel.Label.text,left:b.AbsolutePosition.x+b.BorderLeft,right:b.AbsolutePosition.x+b.BorderRight};});return [...new Set(entries.map(e=>e.verse))].flatMap(v=>{const row=entries.filter(e=>e.verse===v);return row.slice(1).flatMap((e,i)=>e.left<row[i].right-.05?[row[i].text+' / '+e.text]:[]);});}))}));
   assert(!details.overflow,r.id+' overflow');assert.equal(details.view,'Melody only');assert.deepEqual(details.lyricCollisions,[],r.id+' lyric collisions');
   await p.locator('#score').screenshot({path:`test-results/phase3c-${r.id}-${width}.png`,style:'.masthead,.toolbar{visibility:hidden!important}'});details.pages=await p.evaluate(async()=>{const v=await import('./virtual-pages.js');v.prepareVirtualPages(true);return v.virtualFrames().length;});assert(details.pages<=full+1,r.id+' Unexpected Melody page expansion');renders.push({id:r.id,width,full,...details});console.log('RENDER',r.id,width,full,details.pages);
  }}fs.writeFileSync('test-results/phase3c-renders.json',JSON.stringify(renders,null,2));
 }
}finally{await b.close();}
