import {createRequire} from 'node:module';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const {chromium}=createRequire(process.env.PLAYWRIGHT_PACKAGE)('playwright');
const browser=await chromium.launch({channel:'msedge',headless:true}),context=await browser.newContext(),page=await context.newPage(),errors=[];
page.on('pageerror',e=>errors.push(e.message));
const base=process.env.TEST_URL||'http://127.0.0.1:8768/';
const ready=()=>page.waitForFunction(()=>prototype.ready&&!prototype.busy&&document.querySelector('#score').getAttribute('aria-busy')==='false');
try{
 await page.goto(base);await page.locator('.library-row').first().waitFor();
 const unit=await page.evaluate(async()=>{
  const {parseChordSymbol,transposeChordSymbol}=await import('./chord-symbol.js');
  const {transposeXML,parseXML,originalKey,buildKeys}=await import('./music.js');
  const {openingMetadata}=await import('./opening-metadata.js'),{scoreTimeline}=await import('./playback.js');
  const checks=[];const check=(ok,why)=>{if(!ok)throw Error(why);checks.push(why);};
  const examples=['(G)','(Dm)','(G7)','(Gmaj7)','(Gsus4)','(Gadd9)','(G/B)','(Bb/D)','(F#m7/C#)','(G7(b9,#11)/B)','Csus4(add9)','Fadd9#11','Gm(maj7)','C6/9','[Bb/D]','Optional: (G7/B)','G (optional)','  ( G7 / B )  ','(B aug)','(G♭maj7/D♭)','(G𝄪7/B𝄫)','(G), (G/B)','GmMaj7','Cdom7','(G/B♭)'];
  const nonchords=['(Child)','(Piano)','(Conduct two beats to a measure.)','A tempo','D.C. al Fine','Coda','Chorus','Gently','(Guitar)','Section (A)','G7/Broken','(G7','G7)','N.C.','G7(foo)',''];
  for(const t of examples)check(Boolean(parseChordSymbol(t)),'parse '+t);
  for(const t of nonchords)check(parseChordSymbol(t)===null,'keep prose '+t);
  const make=(text,fifths=0,mode='major')=>`<score-partwise version="4.0"><part-list><score-part id="P"><part-name>Test</part-name></score-part></part-list><part id="P"><measure number="1"><attributes><divisions>1</divisions><key><fifths>${fifths}</fifths><mode>${mode}</mode></key><time><beats>4</beats><beat-type>4</beat-type></time><clef><sign>G</sign><line>2</line></clef></attributes><direction placement="above"><direction-type><words default-y="25" font-style="italic">${text}</words></direction-type><offset>0</offset><staff>1</staff></direction><note><pitch><step>G</step><octave>4</octave></pitch><duration>4</duration><type>whole</type></note></measure></part></score-partwise>`;
  check(parseXML(transposeXML(make('(G/B♭)'),1)).querySelector('words').textContent==='(A♭/C♭)','Unicode accidental style across slash chord');
  const values=['(G)','(Dm)','(G/B)'];
  const golden={2:['(A)','(Em)','(A/C#)'],'-2':['(F)','(Cm)','(F/A)'],1:['(Ab)','(Ebm)','(Ab/C)'],'-1':['(F#)','(C#m)','(F#/A#)'],6:['(Db)','(Abm)','(Db/F)']};
  for(const [shift,expected] of Object.entries(golden))for(let i=0;i<values.length;i++)check(parseXML(transposeXML(make(values[i]),Number(shift))).querySelector('words').textContent===expected[i],`golden ${values[i]} ${shift}`);
  const pc=p=>({C:0,D:2,E:4,F:5,G:7,A:9,B:11}[p.step]+p.alter+120)%12;
  for(const [fifths,mode] of [[0,'major'],[-1,'minor'],[2,'major'],[-3,'major']])for(let shift=-6;shift<=6;shift++)for(const text of examples){
   const xml=make(text,fifths,mode),out=transposeXML(xml,shift),d=parseXML(out),word=d.querySelector('words'),a=parseChordSymbol(text),b=parseChordSymbol(word.textContent);
   check(b&&a.pitches.length===b.pitches.length,`model ${text} ${shift}`);
   const mask=c=>{let s=c.text;for(const p of [...c.pitches].reverse())s=s.slice(0,p.start)+'@'+s.slice(p.end);return s;};
   check(mask(a)===mask(b),`punctuation/suffix ${text} ${shift}`);
   for(let i=0;i<a.pitches.length;i++)check(pc(b.pitches[i])===(pc(a.pitches[i])+shift+12)%12,`root/bass pitch ${text} ${shift}`);
   check(word.getAttribute('font-style')==='italic'&&word.getAttribute('default-y')==='25','format attributes');
   const before=scoreTimeline(xml),after=scoreTimeline(out);check(after.notes[0].midi===before.notes[0].midi+shift&&after.duration===before.duration,'playback pitch/time');
   if(!shift)check(out===xml,'exact original');
  }
  // Structured harmony suffix/degree/display attributes remain intact. Multiple
  // harmony-chords inside one harmony must all transpose, not only the first.
  const harmony='<harmony arrangement="vertical"><root><root-step>G</root-step></root><kind text="7(add13)" parentheses-degrees="yes">dominant</kind><bass><bass-step>B</bass-step></bass><degree><degree-value>13</degree-value><degree-alter>0</degree-alter><degree-type>add</degree-type></degree><root><root-step>D</root-step></root><kind text="m">minor</kind><bass><bass-step>F</bass-step><bass-alter>1</bass-alter></bass></harmony>';
  const hx=make('(G)').replace('<note>',harmony+'<note>'),hd=parseXML(transposeXML(hx,2));
  check([...hd.querySelectorAll('harmony > root > root-step')].map(n=>n.textContent).join()==='A,E','stacked roots');
  check([...hd.querySelectorAll('harmony > bass > bass-step')].map(n=>n.textContent).join()==='C,G','stacked basses');
  check(hd.querySelector('kind').getAttribute('text')==='7(add13)'&&hd.querySelector('degree-value').textContent==='13','structured suffix/degree');
  const split=make('(F#m7/C#)').replace('(F#m7/C#)</words>','(F</words><words font-weight="bold">#m7/</words><words>C#)</words>');
  const sd=parseXML(transposeXML(split,2));check([...sd.querySelectorAll('words')].map(w=>w.textContent).join('')==='(G#m7/D#)','split styled words');check(sd.querySelector('[font-weight="bold"]').textContent==='m7/','split style kept');
  check(openingMetadata(make('G')).displayXML.includes('>G</words>'),'opening chord retained in score');
  check(openingMetadata(make('Triumphantly')).text==='Triumphantly','opening expression unchanged');
  return {checks:checks.length,examples:examples.length};
 });
 console.log('PASS grammar, punctuation, key spelling, root/bass, structured harmony, playback and opening metadata',unit);
 const audit=await page.evaluate(async()=>{
  const {songs}=await import('./songs.js'),{unpackMXL,transposeXML,parseXML}=await import('./music.js'),{parseChordSymbol}=await import('./chord-symbol.js');
  const rows=[];let structured=0,slash=0,optional=0,textChords=0,nonchords=0;
  for(const song of songs.filter(s=>s.scoreType!=='pdf')){
   const xml=unpackMXL(await (await fetch(song.asset)).arrayBuffer()),d=parseXML(xml),words=[...d.querySelectorAll('direction > direction-type > words')];
   const chords=words.filter(w=>parseChordSymbol(w.textContent));structured+=d.querySelectorAll('harmony').length;slash+=d.querySelectorAll('harmony > bass').length;
   textChords+=chords.length;optional+=chords.filter(w=>w.textContent.trim().startsWith('(')).length;nonchords+=words.length-chords.length;
   const cases=[];
   if(song.transpositionAvailable!==false)for(const shift of [-2,1,3]){
    const out=parseXML(transposeXML(xml,shift,song.modeOverride)),updated=[...out.querySelectorAll('direction > direction-type > words')];
    for(let i=0;i<words.length;i++){
     const a=parseChordSymbol(words[i].textContent),b=parseChordSymbol(updated[i].textContent);
     if(!a){if(words[i].outerHTML!==updated[i].outerHTML)throw Error('Prose changed '+song.id);continue;}
     if(!b||a.pitches.length!==b.pitches.length)throw Error('Chord lost '+song.id);
     const pc=p=>({C:0,D:2,E:4,F:5,G:7,A:9,B:11}[p.step]+p.alter+120)%12;
     if(a.pitches.some((p,j)=>(pc(p)+shift+12)%12!==pc(b.pitches[j])))throw Error('Chord pitch '+song.id);
    }
    const hs=[...d.querySelectorAll('harmony')],ht=[...out.querySelectorAll('harmony')];
    if(hs.length!==ht.length)throw Error('Harmony count '+song.id);
    const skeleton=e=>{if(['root-alter','bass-alter'].includes(e.localName))return null;return [e.localName,[...e.attributes].map(a=>[a.name,a.value]),e.children.length?[...e.children].map(skeleton).filter(Boolean):(['root-step','bass-step'].includes(e.localName)?'pitch':e.textContent.trim())];};
    for(let j=0;j<hs.length;j++){
     if(JSON.stringify(skeleton(hs[j]))!==JSON.stringify(skeleton(ht[j])))throw Error('Harmony suffix/format changed '+song.id);
     const ps=[...hs[j].querySelectorAll(':scope > root, :scope > bass')],pt=[...ht[j].querySelectorAll(':scope > root, :scope > bass')];
     for(let k=0;k<ps.length;k++){
      const pitch=n=>{const tag=n.localName;return ({C:0,D:2,E:4,F:5,G:7,A:9,B:11}[n.querySelector(tag+'-step').textContent]+Number(n.querySelector(tag+'-alter')?.textContent||0)+120)%12;};
      if((pitch(ps[k])+shift+12)%12!==pitch(pt[k]))throw Error('Structured harmony pitch '+song.id);
     }
    }
    cases.push(shift);
   }
   if(chords.length)rows.push({id:song.id,title:song.title,collection:song.collection,page:song.page,chords:chords.map(w=>w.textContent),shifts:cases});
  }
  return {structured,slash,optional,textChords,nonchords,rows};
 });
 fs.writeFileSync('test-results/chord-harmony-audit.json',JSON.stringify(audit,null,2));console.log('PASS catalog audit',JSON.stringify({...audit,rows:audit.rows.length}));
 const representatives=['cs-16','cs-2','cs-164','cs-174','hhc-1042','hhc-1056','hhc-1064'];
 for(const [width,height] of [[390,844],[844,390],[820,1180],[1440,1000]]){
  await page.setViewportSize({width,height});await page.waitForTimeout(200);
  for(const id of representatives){
   await page.evaluate(id=>prototype.loadSong(id),id);await ready();
   await page.evaluate(()=>prototype.changeKey(2));await ready();
   const visible=await page.evaluate(async()=>{
    const {parseChordSymbol}=await import('./chord-symbol.js');const doc=new DOMParser().parseFromString(prototype.xml,'application/xml');
    const texts=[...doc.querySelectorAll('direction-type > words')].map(w=>w.textContent).filter(t=>parseChordSymbol(t));
    const score=document.querySelector('#score');return {texts,missing:texts.filter(t=>!score.textContent.includes(t)),overflow:document.documentElement.scrollWidth>innerWidth};
   });
   assert.deepEqual(visible.missing,[],`${id} visible chord text`);assert(!visible.overflow);
   if(width===390&&id==='cs-16')await page.screenshot({path:'test-results/chord-harmony-phone.png',fullPage:true});
   await page.evaluate(()=>prototype.preparePrint());
   for(const t of visible.texts)assert((await page.locator('#print-pages').textContent()).includes(t),`${id} printed chord ${t}`);
   await page.locator('#reset').click();await ready();assert(await page.evaluate(()=>prototype.xml===prototype.original));
  }
  console.log('PASS rendered/printed real chords, transposition/reset',width);
 }
 await page.evaluate(()=>navigator.serviceWorker.ready);await page.waitForFunction(()=>navigator.serviceWorker.controller);
 await context.setOffline(true);await page.reload();await ready();
 await page.evaluate(()=>prototype.loadSong('cs-16'));await ready();await page.evaluate(()=>prototype.changeKey(-2));await ready();
 assert((await page.locator('#score').textContent()).includes('(Em)'),'offline optional chord transposition');
 assert.equal(await page.evaluate(()=>prototype.current),-2);
 assert.deepEqual(errors,[]);console.log('PASS all chord/harmony checks, including offline reload/transposition');
}finally{await browser.close();}
