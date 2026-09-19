import assert from 'node:assert/strict';import {candidateZooms,chooseLayout,readScoreSize,saveScoreSize,sizePreferenceKey} from '../auto-layout.js';
const item=(zoom,pages,visible,extra={})=>({zoom,autoReport:{baseline:zoom===.9,pages,visibleMeasures:visible,visibleSystems:2,readable:true,collisions:0,...extra}});
assert.equal(chooseLayout([item(.9,2,8),item(.81,1,16),item(.738,1,16)]).zoom,.81);
assert.equal(chooseLayout([item(.9,1,8),item(.81,1,8),item(.738,1,8)]).zoom,.9);
assert.equal(chooseLayout([item(.9,3,5),item(.81,2,10,{collisions:1}),item(.738,1,20,{readable:false})]).zoom,.9);
assert.equal(chooseLayout([item(.9,3,5,{collisions:1}),item(.81,2,10,{collisions:2})]).zoom,.9);
for(const phone of [true,false])for(const base of [.78,.9]){const values=candidateZooms(base,phone);assert(values.length<=3);assert(values.every(n=>n>=(phone?.64:.68)));}
let value;globalThis.localStorage={getItem:()=>value,setItem:(key,v)=>{assert.equal(key,sizePreferenceKey);value=v;}};assert.equal(readScoreSize(),'auto');for(const mode of ['normal','large','auto']){saveScoreSize(mode);assert.equal(readScoreSize(),mode);}value='compact';assert.equal(readScoreSize(),'auto');globalThis.localStorage={getItem(){throw Error();},setItem(){throw Error();}};assert.equal(readScoreSize(),'auto');saveScoreSize('large');console.log('PASS quality-first bounded candidates, larger-scale tie break, fallback, floors, saved choices and unavailable storage');
