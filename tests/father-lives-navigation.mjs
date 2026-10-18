import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import fs from 'node:fs/promises';
const pw=createRequire(process.env.PLAYWRIGHT_PACKAGE||'C:/Users/kenro/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/package.json')('playwright');
for(const engine of ['chromium','webkit']){
 const b=await pw[engine].launch(engine==='chromium'?{channel:'msedge'}:{});
 try{
 const p=await b.newPage({viewport:{width:375,height:812},serviceWorkers:'block'});p.setDefaultTimeout(90000);
 await p.addInitScript(()=>localStorage.setItem('music-transpose-navigation-v2',JSON.stringify({mode:'pages',explicit:true})));
 await p.goto('http://127.0.0.1:8781/');await p.waitForFunction(()=>window.prototype?.navigation);
 const ready=()=>p.waitForFunction(()=>prototype.ready&&!prototype.busy&&!prototype.loading&&document.querySelector('#score').getAttribute('aria-busy')==='false');
 for(const id of ['song-2a184969-eb57-4901-9829-48c3952bfda3','song-094d3a6c-43e1-497f-80c3-24cb36f444de']){
 await p.evaluate(id=>prototype.loadSong(id),id);await ready();await p.evaluate(()=>prototype.changeKey(0));await ready();
 const original=await p.evaluate(()=>prototype.xml);
 for(const shift of [2,-2,0]){
 await p.evaluate(n=>prototype.changeKey(n),shift);await ready();
 const result=await p.evaluate(()=>{const d=new DOMParser().parseFromString(prototype.xml,'application/xml');return {shift:prototype.current,notes:d.querySelectorAll('note').length,measures:d.querySelectorAll('measure').length,harmonies:d.querySelectorAll('harmony').length,keys:[...d.querySelectorAll('key > fifths')].map(e=>+e.textContent),xml:prototype.xml};});
 assert.equal(result.shift,shift);assert(result.keys.every(n=>n===shift));assert(result.harmonies>0);
 if(shift===0)assert.equal(result.xml,original);
 }
 const frames=p.locator('.mxl-page-frame'),count=await frames.count();
 await p.locator('#score').click({position:{x:10,y:10}});await p.keyboard.press('Home');
 for(let i=0;i<count;i++){await p.waitForFunction(i=>document.querySelectorAll('.mxl-page-frame')[i].classList.contains('current-page'),i);if(i<count-1)await p.keyboard.press('PageDown');}
 await p.keyboard.press('End');assert(await frames.last().evaluate(e=>e.classList.contains('current-page')));
 await fs.mkdir('test-results/father-lives/navigation',{recursive:true});await p.screenshot({path:`test-results/father-lives/navigation/${engine}-${id}-last.png`});
 await p.keyboard.press('Home');await p.waitForFunction(()=>document.querySelector('.mxl-page-frame').classList.contains('current-page'));
 console.log('PASS',engine,id,'C/D/B-flat/reset; native/generated harmony retained; all page boundaries');
 }
 }finally{await b.close();}
}
