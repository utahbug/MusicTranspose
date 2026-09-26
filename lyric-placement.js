// OSMD 2.1.2 reads lyric text but discards MusicXML placement="above".
// Preserve that flag on its original voice entry, then reserve an above-staff
// lyric lane during engraving (before staff/system spacing and dash layout).
// No source notes, timestamps, measures, voices, or XML are changed.
export function installLyricPlacement(OSMD){
 const reader=OSMD.LyricsReader.prototype,calculator=OSMD.MusicSheetCalculator.prototype;
 if(reader.musicTransposePlacement)return;
 reader.musicTransposePlacement=true;
 const read=reader.addLyricEntry,layout=calculator.calculateSingleStaffLineLyricsPosition;
 reader.addLyricEntry=function(nodes,voice){
  read.call(this,nodes,voice);
  for(const node of nodes||[]){
   const entry=voice.LyricsEntries.getValue(node.attribute('number')?.value||'1');
   if(entry)entry.musicTransposePlacement=node.attribute('placement')?.value==='above'?'above':'below';
  }
 };
 calculator.calculateSingleStaffLineLyricsPosition=function(line,verses){
  const entries=line.Measures.flatMap(m=>m.staffEntries),above=[],saved=[];
  for(const entry of entries){
   const lyrics=entry.LyricsEntries,upper=lyrics.filter(l=>l.LyricsEntry.musicTransposePlacement==='above');
   if(upper.length){above.push(...upper);saved.push([entry,lyrics]);entry.LyricsEntries=lyrics.filter(l=>!upper.includes(l));}
  }
  let below;
  try{below=layout.call(this,line,verses);}finally{for(const [entry,lyrics] of saved)entry.LyricsEntries=lyrics;}
  if(!above.length)return below;
  const rules=this.rules,sky=line.SkyBottomLineCalculator;
  const ordered=verses.filter(v=>above.some(l=>l.LyricsEntry.VerseNumber===v));
  const gap=rules.VerticalBetweenLyricsDistance,step=rules.LyricsHeight+gap;
  let bottom=0;
  for(const lyric of above){
   const entry=lyric.StaffEntryParent,box=lyric.GraphicalLabel.PositionAndShape;
   const x=entry.parentMeasure.PositionAndShape.RelativePosition.x+entry.PositionAndShape.RelativePosition.x+box.RelativePosition.x;
   bottom=Math.min(bottom,sky.getSkyLineMinInRange(x+box.BorderMarginLeft,x+box.BorderMarginRight));
  }
  bottom-=rules.LyricsYMarginToBottomLine+gap;
  for(const lyric of above){
   const label=lyric.GraphicalLabel,box=label.PositionAndShape,entry=lyric.StaffEntryParent;
   const row=ordered.indexOf(lyric.LyricsEntry.VerseNumber);
   box.RelativePosition=new OSMD.PointF2D(box.RelativePosition.x,bottom-(ordered.length-1-row)*step-box.BorderMarginBottom);
   label.Label.fontStyle=lyric.LyricsEntry.FontStyle;
   const x=entry.parentMeasure.PositionAndShape.RelativePosition.x+entry.PositionAndShape.RelativePosition.x+box.RelativePosition.x;
   sky.updateSkyLineInRange(x+box.BorderMarginLeft,x+box.BorderMarginRight,box.RelativePosition.y+box.BorderMarginTop-gap);
  }
  // Return the original staff entries so OSMD builds hyphens and melismas from
  // the same owning notes, using the corrected lyric coordinates.
  return entries.filter(entry=>entry.LyricsEntries.length);
 };
}
