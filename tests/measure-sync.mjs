import {createRequire} from 'node:module';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const {chromium}=createRequire(process.env.PLAYWRIGHT_PACKAGE)('playwright');
const browser=await chromium.launch({channel:'msedge',headless:true});
const context=await browser.newContext({serviceWorkers:'block'}),page=await context.newPage();
const errors=[],results=[];page.on('pageerror',e=>errors.push(e.message));
const ready=()=>page.waitForFunction(()=>prototype.ready&&!prototype.busy&&document.querySelector('#score').getAttribute('aria-busy')==='false');
const base=process.env.TEST_URL||'http://127.0.0.1:8768/',smoke=Boolean(process.env.SYNC_SMOKE);
try{
 await page.goto(base);await page.locator('.library-row').first().waitFor();
 // Inspect every real engraving, including every Most music candidate. No
 // application test API, title match, or alternative rendering implementation.
 await page.evaluate(()=>{
  window.syncAudits=[];
  const original=opensheetmusicdisplay.OpenSheetMusicDisplay.prototype.render;
  opensheetmusicdisplay.OpenSheetMusicDisplay.prototype.render=function(...args){
   const result=original.apply(this,args),source=this.Sheet.SourceMeasures,indices=[],problems=[];
   let above=0,lyrics=0,notes=0;
   const check=(ok,message)=>{if(!ok)problems.push(message);};
   for(const system of this.GraphicSheet.MusicPages.flatMap(p=>p.MusicSystems)){
    for(const column of system.GraphicalMeasures){
     const first=column[0],index=source.indexOf(first.parentSourceMeasure);indices.push(index);
     const x=first.PositionAndShape.AbsolutePosition.x,w=first.PositionAndShape.Size.width;
     for(const measure of column){
      check(measure.parentSourceMeasure===source[index],`measure identity ${index}`);
      check(Math.abs(measure.PositionAndShape.AbsolutePosition.x-x)<1e-6,`left boundary ${index}`);
      check(Math.abs(measure.PositionAndShape.Size.width-w)<1e-6,`right boundary ${index}`);
      for(const entry of measure.staffEntries){
       for(const voice of entry.graphicalVoiceEntries)for(const note of voice.notes){
        notes++;
        check(note.sourceNote.ParentStaffEntry.VerticalContainerParent.ParentMeasure===source[index],`note moved to measure ${index}`);
        check(note.sourceNote.ParentVoiceEntry===voice.parentVoiceEntry,`voice changed ${index}`);
        if(!note.sourceNote.IsGraceNote)check(Math.abs(note.sourceNote.ParentVoiceEntry.Timestamp.RealValue-entry.relInMeasureTimestamp.RealValue)<1e-6,`note onset ${index}`);
       }
       for(const lyric of entry.LyricsEntries){
        lyrics++;
        check(lyric.LyricsEntry.Parent.ParentSourceStaffEntry===entry.sourceStaffEntry,`lyric owner ${index}`);
        const box=lyric.GraphicalLabel.PositionAndShape;
        if(lyric.LyricsEntry.musicTransposePlacement==='above'){
         above++;check(box.RelativePosition.y+box.BorderMarginBottom<0,`above lyric below staff ${index}`);
        }else check(box.RelativePosition.y>0,`below lyric above staff ${index}`);
        check(Number.isFinite(box.AbsolutePosition.x)&&Number.isFinite(box.AbsolutePosition.y),`lyric coordinates ${index}`);
       }
      }
     }
    }
   }
   // Source-order coverage: no missing, duplicated, or independently reduced bars.
   check(indices.length===source.length,'measure count');
   check(indices.every((n,i)=>n===i),'measure order');
   const audit={measures:source.length,notes,lyrics,above,systems:this.GraphicSheet.MusicPages.reduce((n,p)=>n+p.MusicSystems.length,0),problems};
   window.syncAudits.push(audit);window.lastEngraver=this;
   return result;
  };
 });
 const catalog=await page.evaluate(async(smoke)=>{
  const {songs}=await import('./songs.js'),{unpackMXL}=await import('./music.js');const affected=[];
  for(const song of songs.filter(s=>s.scoreType!=='pdf'&&(!smoke||s.id==='song-3f9eca82-5b22-4785-8ac8-9e7c8c34070b'))){
   const xml=unpackMXL(await (await fetch(song.asset)).arrayBuffer());
   const count=new DOMParser().parseFromString(xml,'application/xml').querySelectorAll('lyric[placement="above"]').length;
   if(count)affected.push({id:song.id,title:song.title,above:count});
  }
  return affected;
 },smoke);
 const primary=catalog.find(s=>s.id==='song-3f9eca82-5b22-4785-8ac8-9e7c8c34070b');assert(primary);assert.equal(primary.above,40);
 const controls=(smoke?[]:['nativity','shepherd','faithful','silent-night','cs-2','cs-110','cs-236','hhc-1010']).map(id=>({id,title:id,above:0}));
 async function record(song,width,mode,shift){
  await ready();
  const data=await page.evaluate(()=>{
   const structure=xml=>{const doc=new DOMParser().parseFromString(xml,'application/xml');for(const e of doc.querySelectorAll('pitch, accidental, key > fifths, root-step, root-alter, bass-step, bass-alter'))e.remove();return new XMLSerializer().serializeToString(doc);};
   return {audits:syncAudits.splice(0),overflow:document.documentElement.scrollWidth>innerWidth,unchangedStructure:structure(prototype.xml)===structure(prototype.original)};
  });
  assert(data.unchangedStructure,'rhythm/voices/lyrics/ties/slurs/repeats/harmony structure changed');
  assert(data.audits.length,`no render: ${song.id}`);
  for(const a of data.audits){assert.deepEqual(a.problems,[],`${song.id} ${width} ${mode} ${shift}`);assert.equal(a.above,song.above);}
  assert(!data.overflow,`overflow ${song.id} ${width}`);
  results.push({id:song.id,title:song.title,width,mode,shift,...data.audits.at(-1)});
 }
 for(const [width,height] of [[390,844],[844,390],[820,1180],[1180,820],[1440,1000]]){
  await page.setViewportSize({width,height});await page.waitForTimeout(220);
  for(const song of [...catalog,...controls]){
   await page.evaluate(()=>syncAudits.length=0);
   await page.evaluate(id=>prototype.loadSong(id),song.id);await ready();await record(song,width,'auto',0);
   if(song.id===primary.id){
    for(const mode of ['normal','legacy-lead']){
     if(mode==='legacy-lead'){await page.evaluate(id=>prototype.loadSong(id,'large'),song.id);await ready();assert.equal(await page.locator('#score-size').getAttribute('data-size'),'normal');}
     else{await page.locator('#score-size').click();await page.locator(`#score-size-options [data-size=${mode}]`).click();}await record(song,width,mode,0);
    }
    await page.locator('#score-size').click();await page.locator('#score-size-options [data-size=auto]').click();await ready();
    for(const shift of [-2,3]){await page.evaluate(n=>prototype.changeKey(n),shift);await record(song,width,'auto',shift);}
    await page.locator('#reset').click();await ready();
    await page.screenshot({path:`test-results/measure-sync-${width}.png`,fullPage:true});
    // Print uses the same lyric semantics and its own unchanged score source.
    await page.evaluate(()=>{syncAudits.length=0;return prototype.preparePrint();});await record(song,width,'print',0);
   }
  }
  console.log('PASS alignment/ownership/lyrics',width,catalog.length,'affected +',controls.length,'controls');
 }
 // A source-derived minimal fixture removes any dependency on hymn identity:
 // three parts, pickup, unequal voice activity, full-bar rest, above/below lyrics,
 // chord annotation, repeat and tied pitches. Ownership tests run on all notes.
 const fixture=`<?xml version="1.0"?><score-partwise version="4.0"><part-list><score-part id="A"><part-name>A</part-name></score-part><score-part id="B"><part-name>B</part-name></score-part><score-part id="C"><part-name>C</part-name></score-part></part-list>${['A','B','C'].map((id,i)=>`<part id="${id}"><measure number="0" implicit="yes"><attributes><divisions>2</divisions><key><fifths>0</fifths><mode>major</mode></key><time><beats>3</beats><beat-type>4</beat-type></time><clef><sign>${i?'F':'G'}</sign><line>${i?4:2}</line></clef></attributes><note><pitch><step>C</step><octave>${i?3:4}</octave></pitch><duration>2</duration><voice>1</voice><type>quarter</type><lyric number="1" placement="${i?'above':'below'}"><syllabic>single</syllabic><text>Start</text></lyric></note></measure><measure number="1"><print new-system="yes"/>${i?'<harmony><root><root-step>C</root-step></root><kind>major</kind></harmony><note><pitch><step>C</step><octave>3</octave></pitch><duration>4</duration><voice>1</voice><type>half</type><tie type="start"/><notations><tied type="start"/></notations><lyric number="1" placement="above"><syllabic>single</syllabic><text>Sing</text><extend/></lyric></note><note><pitch><step>C</step><octave>3</octave></pitch><duration>2</duration><voice>1</voice><type>quarter</type><tie type="stop"/><notations><tied type="stop"/></notations></note>':'<note><rest measure="yes"/><duration>6</duration></note>'}<barline location="right"><repeat direction="backward"/></barline></measure></part>`).join('')}</score-partwise>`;
 await page.evaluate(()=>syncAudits.length=0);await page.evaluate(xml=>prototype.loadScore(xml),fixture);await ready();await record({id:'synthetic',title:'synthetic',above:4},1440,'auto',0);
 await page.evaluate(()=>prototype.changeKey(2));await record({id:'synthetic',title:'synthetic',above:4},1440,'auto',2);
 assert.deepEqual(errors,[]);
 fs.writeFileSync(`test-results/measure-sync${smoke?'-smoke':''}.json`,JSON.stringify({catalog,results},null,2));
 console.log('PASS',results.length,'cases; no measure/voice/lyric ownership errors');
}finally{await browser.close();}
