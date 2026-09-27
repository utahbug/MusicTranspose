// A continuous upper voice may end a phrase with a harmonized repetition.
// Select by the preceding voice pitch, never by highest-note search alone.
const children=(e,n)=>[...e.children].filter(c=>c.localName===n);
const child=(e,n)=>children(e,n)[0];
const text=(e,n,d='')=>child(e,n)?.textContent.trim()??d;
const pitch=n=>{const p=child(n,'pitch');return p?12*(Number(text(p,'octave'))+1)+{C:0,D:2,E:4,F:5,G:7,A:9,B:11}[text(p,'step')]+Number(text(p,'alter','0')):null;};
const eps=1e-7;
export function repeatedCadenceMelody(source){
 const doc=new DOMParser().parseFromString(source,'application/xml'),parts=[...doc.querySelectorAll('score-partwise > part')];
 const fail=()=>null;
 if(doc.querySelector('parsererror,grace,unpitched,transpose,staff-tuning,ossia,part-link,measure-style,octave-shift,clef-octave-change'))return fail();
 // Restrict this rule to two separately encoded, single-staff G/F parts.
 if(parts.length!==2||parts.some(p=>[...p.querySelectorAll('staves')].some(n=>n.textContent.trim()!=='1'))||parts.some((p,i)=>![...p.querySelectorAll('clef')].length||[...p.querySelectorAll('clef')].some(c=>text(c,'sign')!==(i?'F':'G'))))return fail();
 const upper=parts[0],lyrical=[...doc.querySelectorAll('note > lyric')].map(l=>l.parentElement);
 const voices=new Set(lyrical.map(n=>text(n,'voice','1')));
 if(!lyrical.length||lyrical.some(n=>n.closest('part')!==upper)||voices.size!==1||[...doc.querySelectorAll('note')].some(n=>text(n,'staff','1')!=='1'))return fail();
 const voice=[...voices][0],groups=[],lengths=[];let divisions=1;
 for(const [mi,m] of children(upper,'measure').entries()){let at=0,last=null,end=0;
  for(const n of m.children){
   if(n.localName==='attributes')divisions=Number(text(n,'divisions',String(divisions)));
   const duration=Number(text(n,'duration','0'))/divisions;
   if(n.localName==='backup')at-=duration;
   if(n.localName==='forward')at+=duration;
   if(n.localName==='note'){
    const v=text(n,'voice','1');if(!(duration>0)||at< -eps)return fail();
    if(child(n,'chord')){if(!last||last.voice!==v||Math.abs(last.duration-duration)>eps)return fail();last.nodes.push(n);}
    else{last={mi,at,duration,voice:v,nodes:[n]};groups.push(last);at+=duration;}
   }
   end=Math.max(end,at);
  }lengths.push(end);
 }
 const line=groups.filter(g=>g.voice===voice),chords=line.filter(g=>g.nodes.length>1);if(!chords.length)return fail();
 // Require complete rhythmic coverage, including rests and notes without lyrics.
 for(const [mi,length] of lengths.entries()){let end=0;for(const g of line.filter(g=>g.mi===mi)){if(Math.abs(g.at-end)>eps)return fail();end+=g.duration;}if(Math.abs(end-length)>eps)return fail();}
 const proof=[];
 for(const [i,g] of line.entries()){
  if(g.nodes.some(n=>child(n,'cue')||child(n,'type')?.getAttribute('size')==='cue'||child(n,'pitch')&&text(n,'stem')!=='up'))return fail();
  let chosen=g.nodes[0];
  if(g.nodes.length>1){
   const previous=line[i-1],p=previous?.nodes.length===1?pitch(previous.nodes[0]):null;
   if(p===null||g.nodes.length>3||g.at!==0||Math.abs(g.at+g.duration-lengths[g.mi])>eps||!previous||previous.mi!==g.mi-1||g.duration<previous.duration||g.nodes.filter(n=>child(n,'lyric')).length!==1)return fail();
   const matching=g.nodes.filter(n=>pitch(n)===p);
   if(matching.length!==1||g.nodes.some(n=>pitch(n)===null||pitch(n)>p)||new Set(g.nodes.map(pitch)).size!==g.nodes.length)return fail();
   // Do not reinterpret ties, slurs, ornaments or articulation ownership in chords.
   if(g.nodes.some(n=>child(n,'tie')||[...n.querySelectorAll('notations > *')].some(e=>e.localName!=='technical'||[...e.children].some(c=>c.localName!=='fingering'))))return fail();
   if(groups.some(o=>o!==g&&o.mi===g.mi&&o.at<g.at+g.duration-eps&&o.at+o.duration>g.at+eps))return fail();
   chosen=matching[0];
  }
  g.chosen=chosen;
  proof.push({measure:g.mi,at:g.at,duration:g.duration,pitch:pitch(chosen),sourceChordIndex:g.nodes.indexOf(chosen)});
 }
 // Another upper voice must not cross above the selected complete voice.
 for(const g of line)for(const o of groups.filter(o=>o.voice!==voice&&o.mi===g.mi&&o.at<g.at+g.duration-eps&&o.at+o.duration>g.at+eps))if(o.nodes.some(n=>pitch(n)!==null&&(pitch(g.chosen)===null||pitch(n)>pitch(g.chosen))))return fail();
 const cues=[...doc.querySelectorAll('note')].filter(n=>child(n,'cue')||child(n,'type')?.getAttribute('size')==='cue');
 for(const n of cues){
  const g=groups.find(g=>g.nodes.includes(n));
  if(!g||g.voice===voice||!child(n,'cue')||child(n,'type')?.getAttribute('size')!=='full'||text(n,'stem')!=='down'||pitch(n)===null||child(n,'lyric'))return fail();
  const overlaps=line.filter(o=>o.mi===g.mi&&o.at<g.at+g.duration-eps&&o.at+o.duration>g.at+eps);
  if(!overlaps.length||overlaps.some(o=>pitch(o.chosen)===null||pitch(n)>=pitch(o.chosen)))return fail();
 }
 for(const g of chords){const copy=g.chosen.cloneNode(true),owner=g.nodes.find(n=>child(n,'lyric'));child(copy,'chord')?.remove();if(owner!==g.chosen)for(const lyric of children(owner,'lyric'))copy.append(lyric.cloneNode(true));g.nodes[0].replaceWith(copy);for(const n of g.nodes.slice(1))n.remove();}
 // Verified cues belong to discarded accompaniment. Remove markers only in this
 // private projection so the unchanged general extractor can enforce its checks.
 for(const n of cues)child(n,'cue')?.remove();
 return {xml:new XMLSerializer().serializeToString(doc),proof,evidence:'Complete upper lyric voice with structurally repeated-pitch cadence chords',cadences:chords.length,accompanimentCues:cues.length};
}
