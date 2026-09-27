import {createRequire} from 'node:module';import assert from 'node:assert/strict';
const {chromium}=createRequire(process.env.PLAYWRIGHT_PACKAGE)('playwright'),b=await chromium.launch({channel:'msedge',headless:true}),p=await b.newPage();
try{await p.clock.install();await p.goto(process.env.TEST_URL||'http://127.0.0.1:8771/');await p.locator('.library-row').first().waitFor();await p.evaluate(async()=>{const {attachLyricsTaps}=await import('./lyrics-taps.js');const box=document.createElement('div');box.id='tap-test';box.innerHTML='<p>Lyrics</p><button>Control</button><a href="#">Link</a>';document.body.append(box);window.activations=0;window.disposeTap=attachLyricsTaps(box,()=>activations++);window.ev=(type,props={},selector='p')=>box.querySelector(selector).dispatchEvent(new PointerEvent(type,{bubbles:true,isPrimary:true,button:0,pointerId:7,clientX:50,clientY:50,...props}));});
const ev=(type,props={},selector='p')=>p.evaluate(({type,props,selector})=>window.ev(type,props,selector),{type,props,selector}),tap=async selector=>{await ev('pointerdown',{},selector);await ev('pointerup',{},selector);},count=()=>p.evaluate(()=>activations);
for(let i=0;i<3;i++){await tap();assert.equal(await count(),0);}await tap();assert.equal(await count(),1);
for(const cancel of ['scroll','resize','blur','pointercancel','lostpointercapture','move','long','button','a','second-pointer']){
 for(let i=0;i<3;i++)await tap();
 if(['button','a'].includes(cancel))await tap(cancel);
 else if(['scroll','resize','blur'].includes(cancel))await p.evaluate(t=>window.dispatchEvent(new Event(t)),cancel);
 else{await ev('pointerdown');if(cancel==='move')await ev('pointermove',{clientX:75});else if(cancel==='long')await p.clock.runFor(500);else if(cancel==='second-pointer')await ev('pointerdown',{pointerId:8,isPrimary:false});else await ev(cancel);await ev('pointerup');}
 await tap();assert.equal(await count(),1,cancel);await p.clock.runFor(1600);
}
await tap();await p.clock.runFor(1600);for(let i=0;i<3;i++)await tap();assert.equal(await count(),1,'old tap expired');await tap();assert.equal(await count(),2);await p.evaluate(()=>disposeTap());for(let i=0;i<4;i++)await tap();assert.equal(await count(),2);console.log('PASS four-tap window, long press, controls, drift, multi-pointer, cancellation and disposal');}finally{await b.close();}
