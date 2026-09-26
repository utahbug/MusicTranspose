import assert from 'node:assert/strict';import {renderFullScoreLayout} from '../full-score-layout.js';
function trial(qualities){const e={EngravingRules:{}},calls=[];const value=renderFullScoreLayout(e,()=>{const profile=e.EngravingRules.VoiceSpacingMultiplierVexflow;calls.push(profile);return {profile};},v=>qualities[v.profile]);return {value,calls,rules:e.EngravingRules};}
const q=(pages,totalSystems,collisions=0,clipping=0)=>({pages,totalSystems,collisions,clipping});
let t=trial({'0.85':q(1,3)});assert.deepEqual(t.calls,[.85]);
t=trial({'0.85':q(3,8),'0.75':q(2,6),'0.65':q(2,5,1)});assert.equal(t.value.profile,.75);assert.equal(t.rules.VoiceSpacingMultiplierVexflow,.75);assert.equal(t.calls.at(-1),.75);
t=trial({'0.85':q(3,8),'0.75':q(2,6),'0.65':q(2,5,0,1)});assert.equal(t.value.profile,.75);
t=trial({'0.85':q(2,4),'0.75':q(2,4),'0.65':q(2,4)});assert.equal(t.value.profile,.85);
t=trial({'0.85':q(2,4),'0.75':q(2,4),'0.65':q(1,3)});assert.equal(t.value.profile,.65);
t=trial({'0.85':q(2,5),'0.75':q(3,4),'0.65':q(3,4)});assert.equal(t.value.profile,.85);
console.log('PASS full-score spacing: preserve good layouts, reject collisions/clipping/page increases, restore selected renderer state');

