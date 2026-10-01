import {createRequire} from 'node:module';
const {chromium}=createRequire(process.env.PLAYWRIGHT_PACKAGE)('playwright'),b=await chromium.launch({channel:'msedge',headless:true}),p=await b.newPage();
try{await p.goto(process.env.TEST_URL||'http://127.0.0.1:8780/');console.log(await p.evaluate(async()=>{
 const {rightHandMelody}=await import('./right-hand-melody.js');
 const must=(v,m)=>{if(!v)throw Error(m);},parse=s=>new DOMParser().parseFromString(s,'application/xml'),serialize=d=>new XMLSerializer().serializeToString(d);
 const note=(step,octave,extra='',lyric='')=>`<note>${extra}<pitch><step>${step}</step><octave>${octave}</octave></pitch><duration>1</duration><voice>1</voice><type>quarter</type>${lyric?`<lyric><text>${lyric}</text></lyric>`:''}</note>`;
 const source=`<score-partwise version="4.0"><part-list><score-part id="R"><part-name>Piano RH</part-name></score-part><score-part id="L"><part-name>Piano LH</part-name></score-part></part-list><part id="L"><measure number="1"><attributes><divisions>1</divisions><clef><sign>F</sign><line>4</line></clef></attributes><note><rest/><duration>3</duration></note></measure></part><part id="R"><measure number="1"><attributes><divisions>1</divisions><clef><sign>G</sign><line>2</line></clef></attributes>${note('C',4,'','one')}${note('C',4)}${note('B',4,'<chord/>')}${note('C',4,'','two')}</measure></part></score-partwise>`;
 const r=rightHandMelody(source);must(r.ok,JSON.stringify(r));must(r.proof.length===3&&r.proof.every(n=>n.pitch===60),'Continuity must choose C4, not the highest B4');must(r.proof.every(n=>n.part==='R'),'Part order must not select bass');
 const d=parse(source),piano=d.querySelector('part[id=R]');
 const desc=d.createElement('score-part');desc.id='D';desc.innerHTML='<part-name>Descant</part-name>';d.querySelector('part-list').prepend(desc);
 const part=piano.cloneNode(true);part.id='D';part.querySelectorAll('octave').forEach(n=>n.textContent='6');d.documentElement.insertBefore(part,d.querySelector('part'));
 const descant=rightHandMelody(serialize(d));must(descant.ok&&descant.proof.every(n=>n.part==='R'),'Optional descant cannot replace piano RH');
 const wrong=parse(source);wrong.querySelectorAll('part[id=R] lyric').forEach(n=>n.remove());wrong.querySelector('part[id=L] note').innerHTML='<pitch><step>C</step><octave>3</octave></pitch><duration>3</duration><lyric><text>Bass melody</text></lyric>';
 must(!rightHandMelody(serialize(wrong)).ok,'LH lyrics cannot supply the melody');
 const missing=parse(source);missing.querySelector('part[id=R] note').remove();must(!rightHandMelody(serialize(missing)).ok,'Missing right-hand coverage must fail');
 const competing=parse(source),measure=competing.querySelector('part[id=R] measure');measure.insertAdjacentHTML('beforeend','<backup><duration>3</duration></backup>'+note('G',4,'','other')+note('A',4,'','sung')+note('G',4,'','line'));[...measure.querySelectorAll('note')].slice(-3).forEach(n=>n.querySelector('voice').textContent='2');
 must(!rightHandMelody(serialize(competing)).ok,'Independent concurrent lyrics must fail');
 return 'PASS non-highest chord continuity, lyricless note retention, reordered piano parts, optional descant, no LH melody, incomplete timing and competing lyrics';
}));}finally{await b.close();}
