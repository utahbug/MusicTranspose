import {assessLayout} from './auto-layout.js';
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
