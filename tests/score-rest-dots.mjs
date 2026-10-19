import assert from 'node:assert/strict';
import {withScoreRestDots} from '../score-page-hints.js';
class Measure{format(){for(const note of this.vfVoices[0].getTickables())if(note.isRest())for(const dot of note.getModifiers())if(dot.getCategory()==='dots')dot.dot_shiftY-=.5;return 'formatted';}}
globalThis.opensheetmusicdisplay={VexFlowMeasure:Measure};
const original=Measure.prototype.format;
for(const phone of [true,false])for(const song of ['hhc-1009','song-d6b88fae-5fc8-4287-b81b-fda387feae71','hhc-1001']){
 const engraver={EngravingRules:{}},measure=new Measure(),dot={getCategory:()=> 'dots',dot_shiftY:0},pitched={...dot,dot_shiftY:3},other={getCategory:()=> 'articulations',dot_shiftY:7};
 measure.rules=engraver.EngravingRules;measure.vfVoices={0:{getTickables:()=>[{isRest:()=>true,getModifiers:()=>[dot,other]},{isRest:()=>false,getModifiers:()=>[pitched]}]}};
 const active=phone&&song!=='hhc-1001';
 withScoreRestDots(engraver,song,phone,()=>{for(let i=0;i<8;i++)assert.equal(measure.format(),'formatted');});
 assert.equal(dot.dot_shiftY,active?-.5:-4,'repeated formatting must not accumulate a rest-dot offset');
 assert.equal(pitched.dot_shiftY,3);assert.equal(other.dot_shiftY,7);assert.equal(Measure.prototype.format,original);
 assert.throws(()=>withScoreRestDots(engraver,song,phone,()=>{throw Error('failed');}),/failed/);assert.equal(Measure.prototype.format,original);
 dot.dot_shiftY=0;measure.rules={};withScoreRestDots(engraver,song,phone,()=>{measure.format();measure.format();});assert.equal(dot.dot_shiftY,-1,'other engravers are untouched');
}
console.log('PASS rest-dot idempotence, song/width/engraver isolation, other modifiers and exception restoration');
