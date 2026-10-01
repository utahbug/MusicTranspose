import {createRequire} from 'node:module';
import {execFileSync} from 'node:child_process';
import fs from 'node:fs';
import assert from 'node:assert/strict';
const {chromium}=createRequire(process.env.PLAYWRIGHT_PACKAGE)('playwright');
const b=await chromium.launch({channel:'msedge',headless:true}),p=await b.newPage({viewport:{width:820,height:1180},serviceWorkers:'block'});
const baseline=execFileSync('git',['show','f9f3934:lead-view.js'],{encoding:'utf8'});
await p.route('**/phase3-baseline.js',r=>r.fulfill({contentType:'text/javascript',body:baseline}));
try{
 await p.goto(process.env.TEST_URL||'http://127.0.0.1:8780/');
 const audit=await p.evaluate(async()=>{
  const {songs}=await import('./songs.js'),{unpackMXL}=await import('./music.js'),{createLeadXML}=await import('./lead-view.js'),{createLeadXML:old}=await import('./phase3-baseline.js');
  const must=(v,m)=>{if(!v)throw Error(m);},parse=s=>new DOMParser().parseFromString(s,'application/xml'),child=(n,k)=>[...n.children].find(c=>c.localName===k),txt=(n,k,d='')=>child(n,k)?.textContent.trim()??d;
  const pitch=n=>{const a=child(n,'pitch');return a?12*(Number(txt(a,'octave'))+1)+{C:0,D:2,E:4,F:5,G:7,A:9,B:11}[txt(a,'step')]+Number(txt(a,'alter','0')):null;};
  const events=d=>{const out=[];for(const part of d.querySelectorAll('score-partwise > part')){let div=1;for(const [mi,m] of [...part.children].entries()){let at=0,last=0;for(const n of m.children){if(n.localName==='attributes')div=Number(txt(n,'divisions',String(div)));const dur=Number(txt(n,'duration','0'))/div;if(n.localName==='backup')at-=dur;if(n.localName==='forward')at+=dur;if(n.localName==='note'){const t=child(n,'chord')?last:at;out.push({part:part.id,staff:txt(n,'staff','1'),voice:txt(n,'voice','1'),mi,at:t,duration:dur,pitch:pitch(n),node:n});if(!child(n,'chord')){last=at;at+=dur;}}}}}return out;};
  const rows=[];
  for(const song of songs.filter(s=>s.scoreType!=='pdf')){
   const source=unpackMXL(await(await fetch(song.asset)).arrayBuffer()),prior=old(source,song),lead=createLeadXML(source,song);
   if(prior.ok)must(lead.ok&&lead.xml===prior.xml,song.id+' existing projection changed');
   if(!lead.ok)must(lead.xml===source,song.id+' fallback source changed');
   if(lead.ok&&!prior.ok){
    const src=events(parse(source)),d=parse(lead.xml),dst=events(d),proof=lead.melodyProof;
    must(proof?.length===dst.length,song.id+' event proof length');must(d.querySelectorAll('part').length===1&&!d.querySelector('note > chord'),song.id+' monophonic projection');
    for(const [i,e] of dst.entries()){
     const a=proof[i],group=src.filter(s=>s.part===a.part&&s.staff===a.staff&&s.voice===a.voice&&s.mi===a.measure&&Math.abs(s.at-a.at)<1e-7),selected=group[a.sourceChordIndex];
     must(selected&&selected.pitch===e.pitch&&Math.abs(selected.duration-e.duration)<1e-7&&e.mi===a.measure&&Math.abs(e.at-a.at)<1e-7,song.id+' source event '+i);
     must(a.part===lead.selection.part&&a.staff===lead.selection.staff,song.id+' crossed RH domain');
     const tie=n=>[...n.querySelectorAll(':scope > tie')].map(t=>t.getAttribute('type')).join(',');must(tie(e.node)===tie(selected.node),song.id+' tie changed');
     const owner=group.find(s=>s.node.querySelector('lyric'));const lyrics=n=>[...n.querySelectorAll('lyric')].map(l=>l.outerHTML).join('');must(lyrics(e.node)===lyrics(owner?.node||selected.node),song.id+' lyrics lost');
    }
    must(d.querySelectorAll('harmony').length<=parse(source).querySelectorAll('harmony').length,song.id+' invented harmonies');
   }
   rows.push({id:song.id,title:song.title,collection:song.collection,page:song.page,oldOk:prior.ok,oldReason:prior.reason,ok:lead.ok,reason:lead.reason,detail:lead.detail,events:lead.ok?parse(lead.xml).querySelectorAll('note').length:null,selection:lead.selection});
  }
  return rows;
 });
 fs.writeFileSync('test-results/phase3-audit.json',JSON.stringify(audit,null,2));
 console.log('PASS independent source pitches/rh ownership/rhythm/lyrics/ties; all previous 245 outputs unchanged',audit.filter(r=>r.ok).length);
 const expected=['nativity','shepherd','cs-2','cs-95','cs-109','cs-82','hhc-1001','hhc-1004','hhc-1009','hhc-1010','hhc-1035','hhc-1054','hhc-1055','hhc-1072','hhc-1201','hhc-1210'];
 for(const id of expected){const r=audit.find(r=>r.id===id);assert(r?.ok,id+' named regression: '+r?.detail);console.log(id,r.ok,r.reason,r.detail||'');}
 if(process.env.PHASE3_RENDER){
  const ready=()=>p.waitForFunction(()=>prototype.ready&&!prototype.busy&&document.querySelector('#score').getAttribute('aria-busy')==='false',{},{timeout:120000});
  const named=audit.filter(r=>expected.includes(r.id)||r.collection==='Children’s Songbook'&&r.page==='42'||r.collection==='Hymns (1985)'&&r.page==='19');
  await p.evaluate(()=>{const proto=opensheetmusicdisplay.OpenSheetMusicDisplay.prototype,render=proto.render;proto.render=function(...args){const result=render.apply(this,args);window.phase3Engraver=this;return result;};});
  const renders=[];
  for(const [width,height] of [[820,1180],[768,1024],[1440,1000]]){await p.setViewportSize({width,height});for(const r of named.filter(r=>r.ok)){
   await p.evaluate(id=>prototype.loadSong(id,'normal'),r.id);await ready();const full=await p.evaluate(async()=>{const v=await import('./virtual-pages.js');v.prepareVirtualPages(true);return v.virtualFrames().length;});
   await p.evaluate(id=>prototype.loadSong(id,'large'),r.id);await ready();assert(await p.evaluate(()=>prototype.lead?.ok),r.id);assert(await p.locator('#score svg').count());
   const details=await p.evaluate(()=>({overflow:document.documentElement.scrollWidth>innerWidth,engravedSvgs:document.querySelectorAll('#score svg').length,view:document.querySelector('#score-view-label').textContent,lyricCollisions:window.phase3Engraver.GraphicSheet.MusicPages.flatMap(p=>p.MusicSystems).flatMap(s=>s.StaffLines.flatMap(l=>{const entries=l.Measures.flatMap(m=>m.staffEntries.flatMap(e=>e.LyricsEntries)).map(e=>{const b=e.GraphicalLabel.PositionAndShape;return {verse:e.LyricsEntry.VerseNumber,text:e.GraphicalLabel.Label.text,left:b.AbsolutePosition.x+b.BorderLeft,right:b.AbsolutePosition.x+b.BorderRight};});return [...new Set(entries.map(e=>e.verse))].flatMap(v=>{const row=entries.filter(e=>e.verse===v);return row.slice(1).flatMap((e,i)=>e.left<row[i].right-.05?[row[i].text+' / '+e.text]:[]);});}))}));
   assert(!details.overflow,r.id+' overflow');assert.equal(details.view,'Melody only');assert.deepEqual(details.lyricCollisions,[],r.id+' lyric collisions');
   await p.locator('#score').screenshot({path:`test-results/phase3-${r.id}-${width}.png`,style:'.masthead,.toolbar{visibility:hidden!important}'});details.pages=await p.evaluate(async()=>{const v=await import('./virtual-pages.js');v.prepareVirtualPages(true);return v.virtualFrames().length;});assert(details.pages<=full,r.id+' Melody exceeds full-score page count');renders.push({id:r.id,width,full,...details});console.log('RENDER',r.id,width,full,details.pages);
  }}fs.writeFileSync('test-results/phase3-renders.json',JSON.stringify(renders,null,2));
 }
}finally{await b.close();}
