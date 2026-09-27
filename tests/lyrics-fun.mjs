import {createRequire} from 'node:module';import assert from 'node:assert/strict';import {planFlight} from '../lyrics-fun.js';
const {chromium}=createRequire(process.env.PLAYWRIGHT_PACKAGE)('playwright');
let upper=0,total=0,mixed=0;const signatures=new Set();
for(let run=0;run<2000;run++){const flights=[];for(let i=0;i<4;i++){const f=planFlight(flights);flights.push(f);upper+=f.upper;total++;assert(f.duration>=18000&&f.duration<=34000);assert(f.delay>=350&&f.delay<=5500);assert(Math.sign(f.endX-f.startX)===f.direction);}if(new Set(flights.map(f=>f.direction)).size===2)mixed++;signatures.add(JSON.stringify(flights));}
assert(upper/total>.75&&upper/total<.85);assert(mixed>1600);assert.equal(signatures.size,2000);console.log('PASS 2000 batches', {upperBias:upper/total,mixedDirections:mixed});
