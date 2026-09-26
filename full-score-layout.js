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
