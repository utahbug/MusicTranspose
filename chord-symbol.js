// Lossless chord-text model for MusicXML exporters that put chord symbols in
// direction/words instead of harmony. Only pitch spans are rewritten; all
// punctuation, whitespace, quality and degree spelling stays in the source text.
const qualities=['major','minor','Major','Minor','omit','maj','Maj','min','Min','dim','aug','dom','sus','add','alt','no','Δ','△','ø','°','o','M','m','+','−','-'];
const alterations=new Map([['#',1],['♯',1],['b',-1],['♭',-1],['x',2],['𝄪',2],['𝄫',-2],['♮',0]]);
const space=c=>c!==undefined&&/\s/u.test(c);
function pitchAt(text,start){
 if(!'ABCDEFG'.includes(text[start]||'!'))return null;
 let end=start+1,alter=0,accidental='';
 for(const c of text.slice(end)){
  if(!alterations.has(c))break;
  accidental+=c;alter+=alterations.get(c);end+=c.length;
 }
 return {step:text[start],alter,start,end,accidental};
}
// A small recursive-descent grammar, not a search-and-replace over note letters.
// Requiring complete chord syntax prevents changes to "Chorus", "D.C.",
// "A tempo", "(Child)", rehearsal labels inside prose, and lyric text.
export function parseChordSymbol(text){
 let pos=0;const pitches=[];
 const skip=()=>{while(space(text[pos]))pos++;};
 const degree=()=>{
  const start=pos;
  for(const c of text.slice(pos)){if(!alterations.has(c))break;pos+=c.length;}
  const digits=pos;while(text[pos]>='0'&&text[pos]<='9')pos++;
  if(pos===digits){pos=start;return false;}return true;
 };
 const suffix=(group=false)=>{
  let tokens=0;
  while(pos<text.length){
   skip();
   if(text[pos]===')'||text[pos]===']')break;
   if(text[pos]==='/'&&/[A-G]/.test(text.slice(pos+1).trimStart()[0]||'!'))break;
   if(/^\((?:optional|opt\.|alternate|alt\.|courtesy)\)/i.test(text.slice(pos)))break;
   if(text[pos]==='('){pos++;if(!suffix(true)||text[pos]!==')')return false;pos++;tokens++;continue;}
   if(text[pos]===','&&group){pos++;continue;}
   if(text[pos]==='/'&&/[0-9]/.test(text[pos+1]||'!')){pos++;if(!degree())return false;tokens++;continue;}
   const quality=qualities.find(q=>text.startsWith(q,pos));
   if(quality){pos+=quality.length;tokens++;continue;}
   if(degree()){tokens++;continue;}
   break;
  }
  return !group||tokens>0;
 };
 const chord=()=>{
  skip();const opening=text[pos];
  if(opening==='('||opening==='['){pos++;if(!chord())return false;skip();if(text[pos]!==({'(':')','[':']'}[opening]))return false;pos++;return true;}
  const root=pitchAt(text,pos);if(!root)return false;pitches.push({...root,role:'root'});pos=root.end;
  if(!suffix())return false;
  skip();if(text[pos]==='/'){pos++;skip();const bass=pitchAt(text,pos);if(!bass)return false;pitches.push({...bass,role:'bass'});pos=bass.end;}
  return true;
 };
 // Explicit chord labels are retained verbatim; free-form prose is never guessed.
 const label=/^\s*(?:optional\s+chord|optional|chord|alternate\s+chord|alt\.)\s*:\s*/i.exec(text);
 if(label)pos=label[0].length;
 if(!chord())return null;skip();
 while(pos<text.length){
  // Repeated/courtesy symbols may share one direction. Require every item to
  // parse, never transpose isolated letter matches inside arbitrary prose.
  const qualifier=/^(?:\((?:optional|opt\.|alternate|alt\.|courtesy)\))\s*$/i.exec(text.slice(pos));
  if(qualifier){pos=text.length;break;}
  if([',',';','|'].includes(text[pos])){pos++;skip();}
  else if(!space(text[pos-1]))return null;
  if(!chord())return null;skip();
 }
 if(pos!==text.length)return null;
 return {text,pitches};
}
function pitchText(pitch,next,text){
 const unicode=/[♭♯♮𝄪𝄫]/u.test(pitch.accidental)||/[♭♯𝄪𝄫]/u.test(text);
 const sign=next.alter>0?(unicode?'♯':'#'):(unicode?'♭':'b');
 const accidental=next.alter===0?(pitch.accidental==='♮'?'♮':''):sign.repeat(Math.abs(next.alter));
 return next.step+accidental;
}
export function transposeChordSymbol(text,transposePitch){
 const chord=parseChordSymbol(text);if(!chord)return text;
 let result=text;
 for(const pitch of [...chord.pitches].reverse()){
  result=result.slice(0,pitch.start)+pitchText(pitch,transposePitch(pitch.step,pitch.alter),text)+result.slice(pitch.end);
 }
 return result;
}
export function transposeChordDirections(doc,transposePitch){
 for(const type of doc.querySelectorAll('direction > direction-type')){
  const words=[...type.children].filter(e=>e.localName==='words');
  // MusicXML may split a single displayed symbol into separately styled words.
  // Parse the combined run, then edit only pitch characters in their original nodes.
  if(!words.length||words.some(w=>w.children.length))continue;
  const text=words.map(w=>w.textContent).join(''),chord=parseChordSymbol(text);
  if(!chord)continue;
  const nodes=[];let at=0;
  for(const word of words){nodes.push({word,start:at,end:at+word.textContent.length});at+=word.textContent.length;}
  for(const pitch of [...chord.pitches].reverse()){
   const replacement=pitchText(pitch,transposePitch(pitch.step,pitch.alter),text);
   for(const node of [...nodes].reverse()){
    const start=Math.max(pitch.start,node.start),end=Math.min(pitch.end,node.end);
    if(start>=end)continue;
    const old=node.word.textContent;
    node.word.textContent=old.slice(0,start-node.start)+(start===pitch.start?replacement:'')+old.slice(end-node.start);
   }
  }
 }
}
