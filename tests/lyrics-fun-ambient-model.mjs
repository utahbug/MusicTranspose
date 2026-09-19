import assert from 'node:assert/strict';import {createWorm,stepWorm,wormPoints,wormHit,shortenWorm,resizeWorm,phaseDuration,laserPalette} from '../lyrics-fun-ambient.js';
const paths=new Set();let escapes=0;
for(const [width,height,font] of [[340,650,22],[760,1000,24],[760,650,24],[760,850,24]])for(let run=0;run<40;run++){
 const w=createWorm(width,height,font);assert((w.count-1)*w.spacing/width>.7&&(w.count-1)*w.spacing/width<.9);assert(w.count<=96);assert.equal(wormHit(w,{x:w.x,y:w.y}).index,0);
 const history=[];for(let i=0;i<2400;i++){stepWorm(w,1/60);assert(w.trail.length<=1024);if(i%120===0)history.push([Math.round(w.x),Math.round(w.y),w.speed,w.target]);if(w.escaped){escapes++;break;}}paths.add(JSON.stringify(history));
 for(let i=0;i<100;i++)shortenWorm(w);assert.equal(w.count,1);resizeWorm(w,width*1.4,height,font);assert.equal(w.count,1);
}
assert.equal(paths.size,160);assert(escapes>100);for(let i=0;i<100;i++){assert(phaseDuration(0)>=22000&&phaseDuration(0)<=28000);assert(phaseDuration(1)>=32000&&phaseDuration(1)<=42000);}assert.equal(laserPalette.light.length,6);console.log('PASS 160 independent waypoint paths, responsive 80% lengths, escapes, head-only minimum, timing and palette', {escapes});
