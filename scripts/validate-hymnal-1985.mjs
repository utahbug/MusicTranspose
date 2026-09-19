import {createRequire} from 'node:module';import fs from 'node:fs';
const {chromium}=createRequire(process.env.PLAYWRIGHT_PACKAGE)('playwright');const b=await chromium.launch({channel:'msedge',headless:true});const p=await b.newPage({viewport:{width:820,height:1180}});const stem=process.env.IMPORT_REPORT||'hymnal-1985';const inventory=JSON.parse(fs.readFileSync(`reports/${stem}-inventory.json`,'utf8'));const only=process.env.HYMN_NUMBERS?.split(',');const results=only?JSON.parse(fs.readFileSync(`reports/${stem}-validation.json`,'utf8')).filter(r=>!only.includes(String(r.number))):[];
try{await p.goto(process.env.TEST_URL||'http://127.0.0.1:8768/');await p.locator('.library-row').first().waitFor();
for(const row of inventory.rows.filter(r=>r.asset&&(!only||only.includes(String(r.number))))){
 const result=await p.evaluate(async row=>{
  const {unpackMXL,parseXML,originalKey,transposeXML,shiftOctaveXML,buildKeys}=await import('./music.js');const {scoreTimeline}=await import('./playback.js');const {songs}=await import('./songs.js');const song=songs.find(s=>s.id===row.id),out={id:row.id,number:row.number,notes:[]};let host;
  try{
   const response=await fetch(row.asset);if(!response.ok)throw Error('Asset missing');const xml=unpackMXL(await response.arrayBuffer()),doc=parseXML(xml);out.parse='pass';out.firstMeasureNotes=doc.querySelectorAll('part > measure:first-of-type note').length;if(!out.firstMeasureNotes)throw Error('Empty first measure');
   out.sourceModeMissing=!doc.querySelector('key > mode');out.xmlTitle=doc.querySelector('work-title,movement-title')?.textContent||'';
   let key;try{key=originalKey(xml,song.modeOverride);out.key=key;}catch(e){out.notes.push(e.message);}
   const unsafe=doc.querySelector('transpose,unpitched,staff-tuning,scordatura,key-step')||[...doc.querySelectorAll('pitch')].some(x=>!Number.isInteger(Number(x.querySelector('alter')?.textContent||0)))||[...doc.querySelectorAll('part')].some(x=>!x.querySelector('measure:first-of-type > attributes > key > fifths'));
   if(unsafe)out.notes.push('Nonstandard pitch/part/instrument structure; view-only.');
   host=document.createElement('div');host.style.cssText='position:absolute;left:-10000px;width:780px';document.body.append(host);const osmd=new opensheetmusicdisplay.OpenSheetMusicDisplay(host,{backend:'svg',autoResize:false,drawTitle:false,newSystemFromXML:false,newPageFromXML:false});
   await osmd.load(xml);osmd.Zoom=.78;osmd.render();if(!host.querySelector('svg')||!osmd.GraphicSheet.MusicPages.length)throw Error('No engraved pages');out.render='pass';
   const {openingMetadata}=await import('./opening-metadata.js');
   const firstText=doc.querySelector('lyric text')?.textContent||'';
   const opening=()=>({notes:host.querySelectorAll('.vf-stavenote').length,firstNotes:host.querySelector('.vf-measure')?.querySelectorAll('.vf-stavenote').length,
    firstMeasure:osmd.GraphicSheet.MusicPages[0].MusicSystems[0].GraphicalMeasures.flat().some(g=>osmd.Sheet.SourceMeasures.indexOf(g.parentSourceMeasure)===0),
    firstLyric:!firstText||[...host.querySelectorAll('text')].some(e=>e.textContent.includes(firstText))});
   out.openingSource=opening();await osmd.load(openingMetadata(xml).displayXML);osmd.render();out.openingDisplay=opening();
   if(out.openingSource.notes!==out.openingDisplay.notes||out.openingSource.firstNotes!==out.openingDisplay.firstNotes||!out.openingDisplay.firstMeasure||out.openingSource.firstLyric&&!out.openingDisplay.firstLyric)throw Error('Opening display regression');
   out.opening='pass';if(!out.openingSource.firstLyric)out.notes.push('First source lyric not detected in raw engraving; inspect source layout.');

   const midi=d=>[...d.querySelectorAll('note > pitch')].map(x=>(Number(x.querySelector('octave').textContent)+1)*12+({C:0,D:2,E:4,F:5,G:7,A:9,B:11}[x.querySelector('step').textContent])+Number(x.querySelector('alter')?.textContent||0));
   const harmony=d=>[...d.querySelectorAll('harmony root,harmony bass')].map(x=>{const t=x.tagName;return ({C:0,D:2,E:4,F:5,G:7,A:9,B:11}[x.querySelector(t+'-step')?.textContent]??0)+Number(x.querySelector(t+'-alter')?.textContent||0);});
   const nonPitch=d=>{const c=d.cloneNode(true);for(const e of c.querySelectorAll('pitch,accidental,attributes > key,harmony root,harmony bass'))e.remove();return new XMLSerializer().serializeToString(c);};
   const pitches=midi(doc),chords=harmony(doc);out.pitchCount=pitches.length;out.harmonyCount=chords.length;
   if(key&&!unsafe){
    for(const shift of [-1,1]){const tx=transposeXML(xml,shift,song.modeOverride),d=parseXML(tx),ps=midi(d),hs=harmony(d);if(ps.some((n,i)=>n!==pitches[i]+shift)||ps.length!==pitches.length)throw Error('Pitch delta failure');if(hs.some((n,i)=>((n-chords[i]-shift)%12+12)%12))throw Error('Harmony delta failure');if(nonPitch(d)!==nonPitch(doc))throw Error('Non-pitch notation changed');if(originalKey(tx,song.modeOverride).fifths!==buildKeys(key).find(k=>k.shift===shift).fifths)throw Error('Signature mismatch');await osmd.load(tx);osmd.render();if(!host.querySelector('svg'))throw Error('Transpose rendering failed');}
    if(transposeXML(xml,0,song.modeOverride)!==xml)throw Error('Reset bytes differ');out.transposition='pass';
   }else out.transposition='view-only';
   try{const timeline=scoreTimeline(xml);out.playback=timeline.notes.length&&!doc.querySelector('transpose,unpitched')?'pass':'unavailable';out.playbackNotes=timeline.notes.length;out.fallbackTempo=timeline.fallbackTempo;out.repeats=timeline.repeats;out.playbackWarnings=timeline.warnings;out.duration=timeline.duration;
    if(out.transposition==='pass'){for(const [shift,octave] of [[1,0],[-1,0],[1,1]]){const next=scoreTimeline(shiftOctaveXML(transposeXML(xml,shift,song.modeOverride),octave));if(next.notes.length!==timeline.notes.length||next.notes.some((n,i)=>n.midi!==timeline.notes[i].midi+shift+octave*12||n.start!==timeline.notes[i].start||n.duration!==timeline.notes[i].duration))throw Error('Timeline delta failure');}}
   }catch(e){out.playback='unavailable';out.notes.push(e.message);}
  }catch(e){out.error=e.message;}finally{host?.remove();}return out;
 },row);results.push(result);if(results.length%20===0)console.log('Validated',results.length,'/',inventory.rows.filter(r=>r.asset).length,'errors',results.filter(r=>r.error).length);fs.writeFileSync(`reports/${stem}-validation.json`,JSON.stringify(results,null,2));
}
console.log('DONE',JSON.stringify({total:results.length,errors:results.filter(r=>r.error),viewOnly:results.filter(r=>r.transposition!=='pass').map(r=>[r.number,r.notes]),playbackUnavailable:results.filter(r=>r.playback!=='pass').map(r=>r.number)}));}finally{await b.close();}
