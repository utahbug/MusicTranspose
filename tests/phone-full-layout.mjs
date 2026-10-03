import assert from 'node:assert/strict';
import {renderPhoneFullScore} from '../full-score-layout.js';
import {assessLayout} from '../auto-layout.js';
// Only measured lyric overhang expands the margin; reset between trials/keys.
let x=100, calls=0;const rules={PageRightMargin:.6,SystemRightMargin:0},box={AbsolutePosition:{x:0},BorderRight:0};
const engraver={EngravingRules:rules,GraphicSheet:{MusicPages:[{MusicSystems:[{StaffLines:[{Measures:[{staffEntries:[{LyricsEntries:[{GraphicalLabel:{PositionAndShape:box}}]}]}]}]}]}]},render(){calls++;box.BorderRight=x-rules.SystemRightMargin;}};
const host={querySelectorAll:()=>[{viewBox:{baseVal:{width:1000}}}]};
renderPhoneFullScore(engraver,host,0);assert.equal(calls,2);assert(Math.abs(rules.SystemRightMargin-.8)<1e-9);
x=90;renderPhoneFullScore(engraver,host,0);assert.equal(rules.SystemRightMargin,0);assert.equal(calls,3,'Already fitting trial gets no reflow');
// The tolerance admits numerical noise, not a smaller readable-text floor.
let size=10.99999975;globalThis.getComputedStyle=()=>({fontSize:String(size)});
const text={textContent:'word',getBoundingClientRect:()=>({top:0,left:0,right:20})};
const svg={viewBox:{baseVal:{x:0,width:100}},getBBox:()=>({x:0,width:90}),getBoundingClientRect:()=>({width:100,top:0}),querySelectorAll:()=>[text]};
const h={querySelectorAll:()=>[svg]};
assert(!assessLayout(h,[],100,600,.55,{minimumLyric:11}).readable);
assert(assessLayout(h,[],100,600,.55,{minimumLyric:11,lyricTolerance:1e-6}).readable);
size=10.99;assert(!assessLayout(h,[],100,600,.55,{minimumLyric:11,lyricTolerance:1e-6}).readable);
console.log('PASS phone Full measured lyric margin, trial reset, and numerical readability tolerance');
