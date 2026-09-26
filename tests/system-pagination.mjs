import assert from 'node:assert/strict';import {planSystemPages} from '../system-pagination.js';
const items=(heights,gap=0)=>heights.map((height,i)=>({height,gap,start:i,end:i,systems:1}));
assert.deepEqual(planSystemPages(items(Array(10).fill(100)),400).map(p=>p.count),[4,3,3]);
assert.deepEqual(planSystemPages(items([190,70,70,190,70]),350).map(p=>p.count),[3,2]);
assert.equal(planSystemPages(items(Array(5).fill(150),60),900).length,1);
const small=planSystemPages(items([100,100],6),500)[0];assert.equal(small.used,206);
assert.deepEqual(planSystemPages(items([600,100]),400).map(p=>p.count),[1,1]);
for(let n=1;n<=45;n++){const input=items(Array.from({length:n},(_,i)=>80+(i*37)%120),36),pages=planSystemPages(input,650);assert.deepEqual(pages.flatMap(p=>p.systems.map(s=>s.start)),input.map(s=>s.start));assert(pages.every(p=>p.used<=650));for(const p of pages)for(let i=1;i<p.systems.length;i++)assert(p.systems[i].y>=p.systems[i-1].y+p.systems[i-1].height);}
console.log('PASS minimum-page, height-balanced complete systems; bounded gaps, oversized system and exact coverage');
