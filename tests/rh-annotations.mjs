import {createRequire} from 'node:module';
import assert from 'node:assert/strict';
const {chromium}=createRequire(process.env.PLAYWRIGHT_PACKAGE)('playwright');
const b=await chromium.launch({channel:'msedge',headless:true}),p=await b.newPage({serviceWorkers:'block'});
try{
 await p.goto(process.env.TEST_URL||'http://127.0.0.1:8780/');
 const checks=await p.evaluate(async()=>{
  const {rightHandMelody}=await import('./right-hand-melody.js');
  const note=(step,voice,staff,lyrics='')=>`<note><pitch><step>${step}</step><octave>4</octave></pitch><duration>1</duration><voice>${voice}</voice><type>quarter</type><staff>${staff}</staff><notations><technical><fingering>2</fingering></technical></notations>${lyrics?'<lyric><text>'+lyrics+'</text></lyric>':''}</note>`;
  const source=`<score-partwise version="4.0"><part-list><score-part id="P1"><part-name>Piano</part-name></score-part></part-list><part id="P1"><measure number="1"><attributes><divisions>1</divisions><time><beats>2</beats><beat-type>4</beat-type></time><staves>2</staves><clef number="1"><sign>G</sign><line>2</line></clef><clef number="2"><sign>F</sign><line>4</line></clef></attributes>${note('C',1,1,'la')}${note('D',1,1)}<backup><duration>2</duration></backup>${note('E',2,1)}${note('F',2,1)}<backup><duration>2</duration></backup>${note('C',3,2)}${note('D',3,2)}</measure></part></score-partwise>`;
  const baseline=rightHandMelody(source,{retainTreble:true,annotations:true}),must=(v,m)=>{if(!v)throw Error(m);};must(baseline.ok,'base');
  const cases=[
   {name:'same number in two RH voices',marks:[[0,'start','1'],[1,'stop','1'],[2,'start','1'],[3,'stop','1']],kept:4,dropped:0},
   {name:'unique cross-voice RH endpoints',marks:[[0,'start','1'],[3,'stop','1']],kept:2,dropped:0},
   {name:'orphan endpoints cannot discard notes',marks:[[0,'stop','9'],[1,'start','8']],kept:0,dropped:2},
   {name:'ambiguous duplicate starts',marks:[[0,'start','1'],[0,'start','1'],[1,'stop','1']],kept:0,dropped:3},
   {name:'discard source layout continuation, retain endpoints',marks:[[0,'start','1'],[0,'continue','1'],[1,'continue','1'],[1,'stop','1']],kept:2,dropped:2}
  ];
  for(const test of cases){
   const d=new DOMParser().parseFromString(source,'application/xml'),notes=[...d.querySelectorAll('note')];
   for(const [index,type,number] of test.marks){const mark=d.createElement('slur');mark.setAttribute('type',type);mark.setAttribute('number',number);notes[index].querySelector('notations').append(mark);}
   const r=rightHandMelody(new XMLSerializer().serializeToString(d),{retainTreble:true,annotations:true});must(r.ok,test.name+' rejected music');must(JSON.stringify(r.proof)===JSON.stringify(baseline.proof),test.name+' changed RH note proof');
   const out=new DOMParser().parseFromString(r.xml,'application/xml');must(out.querySelectorAll('notations > slur').length===test.kept,test.name+' wrong slurs');must((r.annotationAdjustments||[]).length===test.dropped,test.name+' wrong drop count');
   for(const mark of out.querySelectorAll('notations > slur'))mark.remove();must(new XMLSerializer().serializeToString(out)===baseline.xml,test.name+' changed notes/ties/fingerings');
  }
  return cases.map(c=>c.name);
 });
 assert.equal(checks.length,5);console.log('PASS',checks);
}finally{await b.close();}
