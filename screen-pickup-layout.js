// Screen-only defense against OSMD 2.1.2's near-zero lyric-width denominator.
// A short opening measure can be expanded far beyond its already positioned ink.
// Keep source breaks and musical data intact; do not cap ordinary lyric spacing.
const screenRules=new WeakSet();
export function enableScreenPickupLayout(engraver){screenRules.add(engraver.EngravingRules);}
export function pickupContentWidth(measures,rules){
 let width=0,hasLyrics=false;
 for(const measure of measures){
  if(!measure?.isVisible())continue;
  const previous=new Map();let extra=0;
  for(const entry of measure.staffEntries){
   const x=entry.PositionAndShape.RelativePosition.x;
   const labels=entry.LyricsEntries.map(l=>({key:'lyric:'+l.LyricsEntry.VerseNumber,box:l.GraphicalLabel.PositionAndShape,gap:Math.max(rules.HorizontalBetweenLyricsDistance,rules.BetweenSyllableMinimumDistance)}));
   hasLyrics ||= labels.length>0;
   labels.push(...entry.graphicalChordContainers.map((c,i)=>({key:'chord:'+i,box:c.PositionAndShape,gap:rules.ChordSymbolXSpacing})));
   // Preserve every verse/chord lane and its measured clearance, not just the
   // width of the longest word. Additional room propagates to following notes.
   for(const l of labels)extra=Math.max(extra,(previous.get(l.key)??-Infinity)+l.gap-x-l.box.BorderLeft);
   width=Math.max(width,x+extra+1.7);
   for(const l of labels){const right=x+extra+l.box.BorderRight;previous.set(l.key,right);width=Math.max(width,right+l.gap);}
  }
 }
 return hasLyrics&&Number.isFinite(width)?width:null;
}
export function installScreenPickupLayout(OSMD){
 const calculator=OSMD.VexFlowMusicSheetCalculator.prototype;
 if(calculator.musicTransposePickupWidth)return;
 calculator.musicTransposePickupWidth=true;
 const measureWidth=calculator.calculateMeasureWidthFromStaffEntries;
 calculator.calculateMeasureWidthFromStaffEntries=function(measures,base){
  const result=measureWidth.call(this,measures,base),source=measures.find(Boolean)?.parentSourceMeasure;
  if(!screenRules.has(this.rules)||source?.measureListIndex!==0||!this.rules.RenderLyrics
   ||!(source.Duration.RealValue>0&&source.Duration.RealValue<source.ActiveTimeSignature.RealValue))return result;
  const content=pickupContentWidth(measures,this.rules);
  // Conservative outlier guard: ordinary expansion remains engine-owned.
  // Only replace a width exceeding FOUR complete measured content footprints.
  // Fully enclosing the labels also leaves the engine's zero carry-over valid.
  return content!==null&&result>content*4?Math.max(base,content):result;
 };
}
