import assert from 'node:assert/strict';import fs from 'node:fs';import {createRequire} from 'node:module';import {songs} from '../songs.js';
const {chromium}=createRequire(process.env.PLAYWRIGHT_PACKAGE||'C:/Users/kenro/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/package.json')('playwright');
const b=await chromium.launch({channel:'msedge'}),c=await b.newContext({serviceWorkers:'block'}),p=await c.newPage(),rows=[];p.setDefaultTimeout(60000);
try{await p.goto(process.env.TEST_URL||'http://127.0.0.1:8780/');await p.waitForFunction(()=>window.prototype?.navigation);
for(const width of [390,820,1440])for(const number of [176,177,182,183,190,216,235,285,293,338,339,340,341])for(const mode of ['auto','large']){
 await p.setViewportSize({width,height:1000});await p.evaluate(({id,mode})=>prototype.loadSong(id,mode),{id:songs.find(s=>s.collection==='Hymns (1985)'&&Number(s.page)===number).id,mode:mode==='auto'?'normal':mode});await p.waitForFunction(()=>prototype.ready&&!prototype.busy&&!prototype.loading&&document.querySelector('#score').getAttribute('aria-busy')==='false');
 await p.locator('#score-size').click();await p.locator('#score-size-options [data-size='+mode+']').click();await p.waitForFunction(()=>prototype.ready&&!prototype.busy&&!prototype.loading&&document.querySelectorAll('#score .mxl-page-frame svg[data-system-start]').length>0);
 const check=await p.evaluate(async()=>{const {parseChordSymbol}=await import('./chord-symbol.js');let chords=0;const collisions=[],tight=[];
  // Expand SVG <use> only in this isolated test DOM: referenced <defs> text has zero
  // screen bounds. The identical cloned group is clipped by the same system slice.
  // This tests text collisions, not every engraved staff/beam glyph or hidden page.
  const expanded=[];
  for(const use of document.querySelectorAll('#score .mxl-page-frame svg[data-system-start] > use')){const source=document.querySelector(use.getAttribute('href')),clone=source.cloneNode(true);clone.removeAttribute('id');use.replaceWith(clone);expanded.push([clone,use]);}
  for(const svg of document.querySelectorAll('#score .mxl-page-frame svg[data-system-start]')){const clip=svg.getBoundingClientRect();if(!clip.width)continue;const texts=[...svg.querySelectorAll('text')].map(n=>({text:n.textContent,lyric:!!n.closest('.lyrics'),box:n.getBoundingClientRect()})).filter(n=>n.box.width>0&&n.box.height>0&&(n.box.top+n.box.bottom)/2>=clip.top&&(n.box.top+n.box.bottom)/2<=clip.bottom);const cs=texts.filter(n=>!n.lyric&&parseChordSymbol(n.text));chords+=cs.length;
   for(let i=0;i<cs.length;i++){const a=cs[i];for(const o of [...cs.slice(i+1),...texts.filter(n=>n.lyric)]){const x=Math.min(a.box.right,o.box.right)-Math.max(a.box.left,o.box.left),y=Math.min(a.box.bottom,o.box.bottom)-Math.max(a.box.top,o.box.top);if(y>2&&x>1)collisions.push([a.text,o.text,+x.toFixed(2)]);else if(y>2&&x>=-2)tight.push([a.text,o.text,+(-x).toFixed(2)]);}}
  }for(const [clone,use] of expanded)clone.replaceWith(use);return {chords,collisions,tight};});assert(check.chords>0,JSON.stringify({number,width,mode,check,texts:await p.locator('#score svg text').allTextContents()}));rows.push({number,width,mode,...check});assert.deepEqual(check.collisions,[],`${number} ${width} ${mode} visible chord text collision`);
}
fs.writeFileSync('test-results/chord-batch8-spacing.json',JSON.stringify(rows,null,2)+'\n');console.log('PASS visible chord/chord and chord/lyric bounds, 78 Full/Melody viewport cases; tight pairs:',JSON.stringify(rows.filter(r=>r.tight.length)));
}finally{await b.close();}
