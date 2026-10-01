import assert from 'node:assert/strict';import {planSystemPages} from '../system-pagination.js';
const items=(heights,gap=0)=>heights.map((height,i)=>({height,gap,start:i,end:i,systems:1}));
assert.deepEqual(planSystemPages(items(Array(10).fill(100)),400).map(p=>p.count),[4,3,3]);
assert.deepEqual(planSystemPages(items([190,70,70,190,70]),350).map(p=>p.count),[3,2]);
assert.equal(planSystemPages(items(Array(5).fill(150),60),900).length,1);
const small=planSystemPages(items([100,100],6),500)[0];assert.equal(small.used,206);
assert.deepEqual(planSystemPages(items([600,100]),400).map(p=>p.count),[1,1]);
for(let n=1;n<=45;n++){const input=items(Array.from({length:n},(_,i)=>80+(i*37)%120),36),pages=planSystemPages(input,650);assert.deepEqual(pages.flatMap(p=>p.systems.map(s=>s.start)),input.map(s=>s.start));assert(pages.every(p=>p.used<=650));for(const p of pages)for(let i=1;i<p.systems.length;i++)assert(p.systems[i].y>=p.systems[i-1].y+p.systems[i-1].height);}
console.log('PASS minimum-page, height-balanced complete systems; bounded gaps, oversized system and exact coverage');

// Reduce blank space only when it avoids a page; keep measured system heights.
const pair=items([230,230],24),compact=planSystemPages(pair,476,{minimumGap:12});
assert.equal(planSystemPages(pair,476).length,2);assert.equal(compact.length,1);assert.equal(compact[0].used,476);assert.equal(compact[0].systems[1].appliedGap,16);
assert.equal(planSystemPages(items([240,240],24),476,{minimumGap:12}).length,2);
assert.deepEqual(planSystemPages(pair,600,{minimumGap:12}).map(p=>p.systems.map(s=>s.y)),planSystemPages(pair,600).map(p=>p.systems.map(s=>s.y)));
// Brute-force partitions independently validate minimum page count for varied heights/gaps.
for(let n=1;n<=10;n++)for(const floor of [8,12]){
 const input=items(Array.from({length:n},(_,i)=>130+(i*41)%130),24),limit=510;
 let minimum=n;for(let mask=0;mask<(1<<(n-1));mask++){let count=1,used=input[0].height,valid=true;for(let i=1;i<n;i++){if(mask&(1<<(i-1))){count++;used=input[i].height;}else used+=floor+input[i].height;if(used>limit)valid=false;}if(valid)minimum=Math.min(minimum,count);}
 const actual=planSystemPages(input,limit,{minimumGap:floor});assert.equal(actual.length,minimum);assert.deepEqual(actual.flatMap(p=>p.systems.map(s=>s.start)),input.map(s=>s.start));
 for(const page of actual){assert(page.used<=limit+1e-6);page.systems.forEach((s,i)=>{assert.equal(s.height,input[s.start].height);if(i)assert(s.appliedGap>=floor-1e-6&&s.appliedGap<=24);});}
}
console.log('PASS bounded adaptive gaps, unchanged fitting pages, and exhaustive partition oracle');

// Section preference is opt-in and subordinate to fit/page count/gap clearance.
const section=items([200,200,200,200,200]);section[1].sectionEnd=true;
assert.deepEqual(planSystemPages(section,650).map(p=>p.count),[3,2]);
assert.deepEqual(planSystemPages(section,650,{preferSections:true}).map(p=>p.count),[2,3]);
assert.equal(planSystemPages(section,1200,{preferSections:true}).length,1,'no new page for a section');
const sparse=items([40,200,200,200,200]);sparse[0].sectionEnd=true;
assert.deepEqual(planSystemPages(sparse,650,{preferSections:true}),planSystemPages(sparse,650),'no reward for an almost empty page');
for(const limit of [390,450,650]){
 const normal=planSystemPages(section,limit),preferred=planSystemPages(section,limit,{preferSections:true});
 assert.equal(preferred.length,normal.length);assert(preferred.every(p=>p.used<=limit));
 assert.deepEqual(preferred.flatMap(p=>p.systems.map(s=>s.start)),[0,1,2,3,4]);
}
console.log('PASS opt-in section preference, no extra pages, fit and blank-space guards');
