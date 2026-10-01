// Screen engraving only. Source XML and shared musical/timing models are read-only.
const policies=new WeakMap();
const direct=(n,name)=>[...n.children].filter(c=>c.localName===name);
export function accompanimentPolicy(xml){
 const doc=new DOMParser().parseFromString(xml,'application/xml'),policy=[];
 for(const part of doc.querySelectorAll('score-partwise > part')){
  const measures=direct(part,'measure'),count=Math.max(1,...[...part.querySelectorAll('staves')].map(n=>Number(n.textContent)),...[...part.querySelectorAll('note > staff')].map(n=>Number(n.textContent)));
  const definition=[...doc.querySelectorAll('score-part')].find(p=>p.id===part.id);
  const accompaniment=count>1||/accompaniment|piano|keyboard|organ/i.test(definition?.textContent||'');
  for(let staff=1;staff<=count;staff++){
   const owns=n=>Number(n.querySelector(':scope > staff')?.textContent||1)===staff;
   const lyrical=[...part.querySelectorAll('note')].some(n=>owns(n)&&n.querySelector('lyric'));
   // The first staff and every lyric-bearing staff remain primary even in silence.
   const eligible=accompaniment&&policy.length>0&&!lyrical;
   const meaningful=measures.map(m=>[...m.children].some(n=>{
    if(n.localName==='note')return owns(n)&&!!n.querySelector('pitch,unpitched,lyric,notations,tie,accidental');
    if(n.localName==='direction'||n.localName==='harmony')return (!n.querySelector(':scope > staff')||owns(n))&&n.getAttribute('print-object')!=='no'&&(n.localName==='harmony'||!!n.querySelector('direction-type > *'));
    if(n.localName==='barline')return !!n.querySelector('ending,repeat');
    if(n.localName==='attributes')return [...n.children].some(c=>!['divisions','key','time','staves','clef','staff-details','part-symbol'].includes(c.localName));
    return !['backup','forward','print','sound'].includes(n.localName);
   }));
   // Keep the interior of staff-owned spans too, even when its local measures
   // contain rests only. Render-time slur/pedal geometry may be built later.
   const open=new Map(),spans='slur,tied,glissando,slide,wavy-line,bracket,dashes,octave-shift,pedal';
   measures.forEach((m,index)=>{
    for(const owner of [...m.children].filter(n=>['note','direction'].includes(n.localName)&&(!n.querySelector(':scope > staff')||owns(n))))for(const mark of owner.querySelectorAll(spans)){
     const key=mark.localName+':'+(mark.getAttribute('number')||'1'),type=mark.getAttribute('type');
     if(['start','up','down','sostenuto'].includes(type))open.set(key,index);
     else if(type==='stop'){const start=open.get(key);if(start!==undefined){for(let i=start;i<=index;i++)meaningful[i]=true;open.delete(key);}}
    }
   });
   for(const start of open.values())for(let i=start;i<meaningful.length;i++)meaningful[i]=true;
   policy.push({eligible,meaningful});
  }
 }
 return policy;
}
export function configureAccompanimentLayout(engraver,xml){policies.set(engraver.EngravingRules,accompanimentPolicy(xml));}
export function installAccompanimentLayout(OSMD){
 const prototype=OSMD.MusicSystemBuilder.prototype;
 if(prototype.musicTransposeAccompaniment)return;
 prototype.musicTransposeAccompaniment=true;
 const optimize=prototype.optimizeDistanceBetweenStaffLines;
 prototype.optimizeDistanceBetweenStaffLines=function(system){
  const policy=policies.get(this.rules);
  if(policy&&!this.rules.musicTransposeLead&&system.StaffLines.length>1){
   const hidden=new Set(system.StaffLines.filter(line=>{
    const staff=policy[line.ParentStaff.idInMusicSheet];if(!staff?.eligible)return false;
    // Source ownership catches signs the renderer may not expose on a note.
    if(line.Measures.some(m=>staff.meaningful[this.graphicalMusicSheet.ParentMusicSheet.SourceMeasures.indexOf(m.parentSourceMeasure)]!==false))return false;
    if(['AbstractExpressions','GraphicalSlurs','GraphicalGlissandi','OctaveShifts','Pedals','WavyLines','LyricLines','LyricsDashes'].some(k=>line[k]?.length))return false;
    return !line.Measures.some(m=>m.staffEntries.some(e=>e.LyricsEntries?.length||e.graphicalChordContainers?.length||e.sourceStaffEntry?.Link));
   }));
   if(hidden.size&&hidden.size<system.StaffLines.length){
    const measures=new Set([...hidden].flatMap(l=>l.Measures));
    system.StaffLines.splice(0,system.StaffLines.length,...system.StaffLines.filter(l=>!hidden.has(l)));
    for(const row of system.GraphicalMeasures)for(let i=row.length-1;i>=0;i--)if(measures.has(row[i]))row.splice(i,1);
    const boxes=system.PositionAndShape.ChildElements;for(let i=boxes.length-1;i>=0;i--)if([...hidden].some(l=>l.PositionAndShape===boxes[i]))boxes.splice(i,1);
    system.StaffLines[0].PositionAndShape.RelativePosition.y=0;
   }
  }
  return optimize.call(this,system);
 };
}
