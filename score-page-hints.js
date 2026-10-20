import {assessLayout} from './auto-layout.js';
// VexFlow adds the rest-dot lane offset on each formatting pass. Narrow
// Full Score fitting formats the same notes repeatedly, accumulating the offset
// until a dot corrupts the skyline used to position chords and complete systems.
// Reset only this derived lane offset before reformatting these arrangements.
const restDotScores=new Set(['hhc-1009','song-d6b88fae-5fc8-4287-b81b-fda387feae71']);
export function withScoreRestDots(engraver,song,phone,render){
 if(!phone||!restDotScores.has(song))return render();
 const prototype=globalThis.opensheetmusicdisplay.VexFlowMeasure.prototype,format=prototype.format;
 const rules=engraver.EngravingRules;
 prototype.format=function(...args){
  if(this.rules===rules)for(const voice of Object.values(this.vfVoices))for(const note of voice.getTickables())
   if(note.isRest?.())for(const dot of note.getModifiers())if(dot.getCategory()==='dots')dot.dot_shiftY=0;
  return format.apply(this,args);
 };
 try{return render();}finally{prototype.format=format;}
}
// CS #5 has negative-x piano instructions; CS #2 has a left-edge piano brace.
// Without an ink inset every Auto candidate fails clipping, forcing the
// largest fallback.
// Reserve measured space before assessment; never change source/export XML.
export function renderScoreInkInset(engraver,host,song,render){
 if(song!=='song-2a184969-eb57-4901-9829-48c3952bfda3'&&song!=='cs-2')return render();
 const rules=engraver.EngravingRules,left=rules.PageLeftMargin;
 try{
  for(let attempt=0;attempt<4;attempt++){
   render();
   if(song==='cs-2')fitDescantInstruction(host);
   const overhang=Math.max(0,...[...host.querySelectorAll('svg')].map(svg=>svg.viewBox.baseVal.x-svg.getBBox().x));
   if(overhang<=.01||attempt===3)break;
   rules.PageLeftMargin+=(overhang+2)/10;
  }
 }finally{rules.PageLeftMargin=left;}
}
// CS #2 only: fit the complete source direction after engraving. At smaller
// Auto scales it already fits. Never shrink below 12 screen pixels; a trial
// that cannot fit legibly still fails the normal clipping assessment.
function fitDescantInstruction(host){
 for(const svg of host.querySelectorAll('svg'))for(const text of svg.querySelectorAll('text')){
  if(text.textContent.trim()!=='Optional descant (with verse 3) for voice or instrument')continue;
  const box=text.getBBox(),view=svg.viewBox.baseVal,available=view.x+view.width-2-box.x;
  if(available<=0||box.width<=available)continue;
  const size=parseFloat(getComputedStyle(text).fontSize),next=size*available/box.width;
  if(next*svg.getBoundingClientRect().width/view.width>=12)text.style.fontSize=next+'px';
 }
}
// Arrangement-specific screen presentation, never musical/export XML.
const hints=new Map([['song-c25734b4-ba49-4c88-ba90-4927ede707c4',{transpose:{breakBefore:10}}]]);
export function applyScorePageHint(engraver,host,song,view,entry,{width,available,render}){
 const hint=hints.get(song)?.[view];if(!hint)return entry;
 const rules=engraver.EngravingRules,source=engraver.Sheet.SourceMeasures;
 if(source.length<=hint.breakBefore)return entry;
 const saved={PageLeftMargin:rules.PageLeftMargin,NewSystemAtXMLNewSystemAttribute:rules.NewSystemAtXMLNewSystemAttribute,SystemRightMargin:rules.SystemRightMargin,VoiceSpacingMultiplierVexflow:rules.VoiceSpacingMultiplierVexflow,VoiceSpacingAddendVexflow:rules.VoiceSpacingAddendVexflow};
 const flags=source.map(m=>m.printNewSystemXml);let best;
 try{
  source.forEach((m,i)=>m.printNewSystemXml=i===hint.breakBefore);rules.NewSystemAtXMLNewSystemAttribute=true;
  for(const [name,multiplier,addend] of [['original',.85,3],['moderate',.75,2],['compact',.65,2]]){
   Object.assign(rules,{PageLeftMargin:saved.PageLeftMargin,SystemRightMargin:0,VoiceSpacingMultiplierVexflow:multiplier,VoiceSpacingAddendVexflow:addend});
   let candidate;
   // The forced reflow must retain measured lyric-edge clearance at this scale.
   for(let attempt=0;attempt<4;attempt++){
    candidate=render(entry.zoom,true);let overhang=0;const svgs=[...host.querySelectorAll('svg')];
    engraver.GraphicSheet.MusicPages.forEach((page,index)=>{
     const right=svgs[index].viewBox.baseVal.width/10-rules.PageRightMargin;
     for(const system of page.MusicSystems)for(const staff of system.StaffLines)for(const measure of staff.Measures)for(const staffEntry of measure.staffEntries)for(const lyric of staffEntry.LyricsEntries){const box=lyric.GraphicalLabel.PositionAndShape;overhang=Math.max(overhang,box.AbsolutePosition.x+box.BorderRight-right);}
    });
    const leftOverhang=Math.max(0,...svgs.map(svg=>-svg.getBBox().x));
    if(overhang<=.01&&leftOverhang<=.01)break;
    if(overhang>.01)rules.SystemRightMargin+=overhang+.2;
    if(leftOverhang>.01)rules.PageLeftMargin+=(leftOverhang+2)/10;
   }
   if(!candidate.systemLayout.some(s=>s.start===hint.breakBefore))continue;
   for(const system of candidate.systemLayout)system.pageBreakBefore=system.start===hint.breakBefore;
   const quality=assessLayout(host,candidate.systemLayout,width,available,entry.zoom);
   if(!quality.clipping&&!quality.collisions&&(!best||quality.pages<best.quality.pages))best={entry:{...entry,...candidate,fullScoreSpacing:name},quality};
  }
 }finally{source.forEach((m,i)=>m.printNewSystemXml=flags[i]);Object.assign(rules,saved);}
 return best?.entry||entry;
}
