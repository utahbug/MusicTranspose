import assert from 'node:assert/strict';import {execFileSync} from 'node:child_process';import {createRequire} from 'node:module';
const baseline=execFileSync('git',['show','3946e85:music.js'],{encoding:'utf8'});
const {chromium}=createRequire('C:/Users/kenro/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/package.json')('playwright');const b=await chromium.launch({channel:'msedge'}),p=await b.newPage({serviceWorkers:'block'});
try{await p.route('**/__hymn280-baseline-music.js',route=>route.fulfill({contentType:'text/javascript',body:baseline}));await p.goto('http://127.0.0.1:8780/');const count=await p.evaluate(async baseline=>{
 const old=await import('/__hymn280-baseline-music.js');
 const now=await import('./music.js'),{generatedHarmony}=await import('./generated-harmony-data.js'),{withGeneratedHarmony}=await import('./generated-harmony.js'),{songs}=await import('./songs.js');let checks=0;
 for(const id of Object.keys(generatedHarmony).filter(id=>id!=='song-00c582e3-baa8-410b-940c-9fd52aa166a9')){
  const song=songs.find(s=>s.id===id),xml=await withGeneratedHarmony(now.unpackMXL(await(await fetch(song.asset)).arrayBuffer()),id);
  for(const shift of [-6,-2,0,1,6]){if(now.transposeXML(xml,shift,song.modeOverride)!==old.transposeXML(xml,shift,song.modeOverride))throw Error('Prior transposition changed: '+song.page+' '+shift);checks++;}
 }return checks;
},baseline);assert.equal(count,905);console.log('PASS 905 exact XML comparisons against prior transposer across all 181 non-modulating overlays');}finally{await b.close();}
