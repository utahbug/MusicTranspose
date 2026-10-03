// Full scores retain glyph sizes, lyric/staff clearances and margins. Only the
// renderer's rhythmic spacing changes; every trial uses its lyric-aware widths.
const profiles=[{name:'original',multiplier:.85,addend:3},{name:'moderate',multiplier:.75,addend:2},{name:'compact',multiplier:.65,addend:2}];
export function renderFullScoreLayout(engraver,render,assess){
 const apply=p=>Object.assign(engraver.EngravingRules,{VoiceSpacingMultiplierVexflow:p.multiplier,VoiceSpacingAddendVexflow:p.addend});
 let best,last;
 for(const profile of profiles){
  apply(profile);const value=render(),quality=assess(value),candidate={profile,value,quality};last=candidate;
  if(!best)best=candidate;
  else if(!quality.clipping&&!quality.collisions&&(quality.pages<best.quality.pages||quality.pages===best.quality.pages&&quality.totalSystems<best.quality.totalSystems))best=candidate;
  // Already-good single-page scores keep their roomier spacing.
  if(best.quality.pages===1)break;
 }
 if(best!==last){apply(best.profile);best.value=render();}
 best.value.fullScoreSpacing=best.profile.name;return best.value;
}

// Phone Full only: reserve measured end-lyric overhang before judging a trial.
// This is the same margin strategy as Lead, without Lead's tail redistribution.
// Restore the starting margin on every trial; never accumulate across zooms/keys.
export function renderPhoneFullScore(engraver,host,baseRightMargin){
 const rules=engraver.EngravingRules;
 rules.SystemRightMargin=baseRightMargin;
 const safeMargin=rules.PageRightMargin+baseRightMargin;
 engraver.render();
 for(let attempt=0;attempt<3;attempt++){
  const svgs=[...host.querySelectorAll('svg')];let overhang=0;
  for(const [i,page] of engraver.GraphicSheet.MusicPages.entries()){
   const width=svgs[i]?.viewBox.baseVal.width/10;
   if(!Number.isFinite(width)||width<=0)continue;
   const right=width-safeMargin;
   for(const system of page.MusicSystems)for(const staff of system.StaffLines)
    for(const measure of staff.Measures)for(const entry of measure.staffEntries)
     for(const lyric of entry.LyricsEntries){const box=lyric.GraphicalLabel.PositionAndShape;overhang=Math.max(overhang,box.AbsolutePosition.x+box.BorderRight-right);}
  }
  if(overhang<=.01)break;
  rules.SystemRightMargin+=overhang+.2;
  engraver.render();
 }
}
