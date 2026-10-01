import assert from 'node:assert/strict';import {fitPhoneLayout} from '../auto-layout.js';
const run=(base,target,pages,safe=()=>true)=>{const calls=[];const entry=fitPhoneLayout(zoom=>{calls.push(zoom);return {zoom};},e=>({pages:pages(e.zoom),readable:safe(e.zoom),collisions:0,visibleMeasures:8,visibleSystems:2}),base,target);return {entry,calls};};
let r=run(.88,1,()=>1);assert.equal(r.entry.zoom,.88);assert.equal(r.calls.length,1,'Already fitting scores are not shrunk');
r=run(.88,2,z=>z>.8?3:2);assert.equal(r.entry.zoom,.8,'Authored two-page target stops unnecessary shrinking');
r=run(.78,1,z=>z>.67?2:1);assert.equal(r.entry.zoom,.67,'Fine pass retains largest fitting notation');
r=run(.78,1,z=>z>.6?2:1,z=>z>=.65);assert.equal(r.entry.autoReport.pages,2,'Readability wins over target');assert.equal(r.entry.zoom,.78);assert(r.calls.every(z=>z>=.55));
r=run(.88,1,()=>2,()=>false);assert.equal(r.entry.zoom,.88,'Unsafe fitting retains baseline');
console.log('PASS phone adaptive target, readable floor, largest-size refinement, no blanket shrinking');
