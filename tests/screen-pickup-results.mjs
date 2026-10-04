import fs from 'node:fs';import assert from 'node:assert/strict';
const before=JSON.parse(fs.readFileSync(process.argv[2]||'test-results/orphan-before-renders.json','utf8')),after=JSON.parse(fs.readFileSync(process.argv[3]||'test-results/orphan-after-renders.json','utf8'));
assert.equal(before.length,after.length);
for(const a of after){const b=before.find(r=>r.width===a.width&&r.number===a.number&&r.mode===a.mode&&r.shift===a.shift);assert(b);if(a.width<600){assert(a.quality.readable);assert.equal(a.quality.collisions,0);assert.equal(a.quality.clipping,0);}
 assert.deepEqual(a.xml,b.xml,'All working XML including notes/lyrics/timing/harmony must remain identical');
 assert.deepEqual(a.trace.source.map(({system,...m})=>m),b.trace.source.map(({system,...m})=>m),'Timing/page state preserved; existing tail balancing may mark different automatic system starts');
 // XML remains identical above. Melody tail balancing may set its temporary system-break rule.
 if(a.number!==223||a.mode==='auto')for(const k of ['trace','zoom','profile','pages'])assert.deepEqual(a[k],b[k],`Unchanged Full/control ${a.number} ${a.width} ${k}`);
 else{assert.equal(b.trace.systems[0].measures.length,1);assert(a.trace.systems[0].measures.length>1);assert.equal(a.zoom,b.zoom,'No notation shrinking');assert(a.pages.length<=b.pages.length);}
}
console.log(`PASS ${after.length} render comparisons: working XML/break state, exact Full/named-control geometry, pickup joins Melody without shrinking`);
