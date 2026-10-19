import assert from 'node:assert/strict';
import {applyLeadLayout} from '../lead-layout.js';
const song='song-d6b88fae-5fc8-4287-b81b-fda387feae71';
for(const enabled of [true,false])for(const phone of [true,false])for(const print of [true,false])for(const rightHand of [true,false])for(const id of [song,'hhc-1009']){
 const engraver={EngravingRules:{LyricOverlapAllowedIntoNextMeasure:3.4,PageLeftMargin:5,PageRightMargin:5}};
 applyLeadLayout(engraver,enabled,{song:id,phone,print,rightHand});
 const scoped=enabled&&rightHand&&phone&&!print&&id===song;
 assert.equal(engraver.EngravingRules.LyricOverlapAllowedIntoNextMeasure,enabled&&rightHand&&!scoped?0:3.4);
 applyLeadLayout(engraver,false);assert.equal(engraver.EngravingRules.LyricOverlapAllowedIntoNextMeasure,3.4);
 applyLeadLayout(engraver,true,{rightHand:true,song:'hhc-1009',phone:true});assert.equal(engraver.EngravingRules.LyricOverlapAllowedIntoNextMeasure,0);
}
console.log('PASS CS87 phone Melody scope, print/wide/Full isolation and song-switch rule restoration');
