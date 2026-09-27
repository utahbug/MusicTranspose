import assert from 'node:assert/strict';
import {laserOrigin,missEndpoint,chooseFunTarget} from '../lyrics-fun.js';
import {phaseNames} from '../lyrics-fun-ambient.js';
assert.deepEqual(phaseNames,['notes','variation','notes-return']);
for(const [w,h] of [[320,200],[390,700],[820,950],[1440,800]])for(let i=0;i<1000;i++){
 const p=laserOrigin(w,h);assert(['left','right'].includes(p.edge));assert.equal(p.x,p.edge==='left'?0:w);assert(p.y>=h*.55&&p.y<=h*.9);
 const end=missEndpoint(p,w,h);assert.equal(end.x,p.edge==='left'?w:0);assert.equal(end.y,p.y);
 const diverted=missEndpoint(p,w,h,{x:w/2,y:-1000});assert(diverted.y>=8&&diverted.y<=h-8);
}
assert.equal(chooseFunTarget([]),null);assert.equal(chooseFunTarget(['a','b'],()=>.9),'b');console.log('PASS side-only origins, bounded lower launch region, full-width miss paths, note-only phases');
