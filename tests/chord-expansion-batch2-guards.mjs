import assert from 'node:assert/strict';import {createRequire} from 'node:module';import {songs} from '../songs.js';
const {chromium}=createRequire(process.env.PLAYWRIGHT_PACKAGE||'C:/Users/kenro/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/package.json')('playwright');
const b=await chromium.launch({channel:'msedge'}),c=await b.newContext({serviceWorkers:'block'}),p=await c.newPage();p.setDefaultTimeout(60000);
try{
 await p.goto(process.env.TEST_URL||'http://127.0.0.1:8780/');await p.waitForFunction(()=>window.prototype?.navigation);
 const targets=[70,280].map(n=>songs.find(s=>s.collection==='Hymns (1985)'&&Number(s.page)===n));
 await p.evaluate(async targets=>{
  const {unpackMXL,originalKey,parseXML,transposeXML}=await import('./music.js'),{withGeneratedHarmony}=await import('./generated-harmony.js'),{generatedHarmony}=await import('./generated-harmony-data.js');
  const check=(ok,msg)=>{if(!ok)throw Error(msg);};
  for(const s of targets){const x=unpackMXL(await(await fetch(s.asset)).arrayBuffer());if(s.page==='70'){check(!generatedHarmony[s.id],'no overlay '+s.page);check(await withGeneratedHarmony(x,s.id)===x,'exact untouched XML '+s.page);}
   if(s.page==='280'){check(originalKey(x).name==='C','280 initial key');check(s.transpositionAvailable&&generatedHarmony[s.id],'280 resolved capability');check([...parseXML(x).querySelectorAll('part:first-of-type key fifths')].map(n=>n.textContent).join(',')==='0,1,0','280 source keys');}
   else{const hs=[...parseXML(x).querySelectorAll('harmony')];check(hs.length>0,'70 native harmony');const pc=n=>({C:0,D:2,E:4,F:5,G:7,A:9,B:11}[n.querySelector('root-step').textContent]+Number(n.querySelector('root-alter')?.textContent||0)+120)%12;for(let shift=-6;shift<=6;shift++){const out=transposeXML(x,shift),after=[...parseXML(out).querySelectorAll('harmony')];check(after.length===hs.length,'70 count');check(after.every((n,i)=>pc(n)===(pc(hs[i])+shift+12)%12&&n.querySelector('kind').textContent===hs[i].querySelector('kind').textContent),'70 native root/quality');}check(transposeXML(x,0)===x,'70 exact reset');}
  }
 },targets);
 for(const width of [390,820,1440]){await p.setViewportSize({width,height:1000});await p.evaluate(id=>prototype.loadSong(id),targets[1].id);await p.waitForFunction(()=>prototype.ready&&!prototype.busy&&!prototype.loading&&document.querySelector('#score').getAttribute('aria-busy')==='false');assert(await p.locator('.pdf-page-frame').count()>0);assert(!await p.evaluate(()=>document.documentElement.scrollWidth>innerWidth));await p.locator('#score-size').click();assert(await p.locator('#score-size-options [data-size=auto]').isEnabled());await p.keyboard.press('Escape');}
 console.log('PASS native 70 precedence, 13 native key cases and exact reset; 280 immutable source and resolved modulation and original PDF at 390/820/1440');
}finally{await b.close();}
