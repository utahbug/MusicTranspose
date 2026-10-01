import {createRequire} from 'node:module';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const {chromium}=createRequire(process.env.PLAYWRIGHT_PACKAGE)('playwright');
const b=await chromium.launch({channel:'msedge',headless:true}),p=await b.newPage({viewport:{width:820,height:1180},serviceWorkers:'block',acceptDownloads:true});
const errors=[];p.on('pageerror',e=>errors.push(e.message));
const cases=['cs-164','song-4dcc79a0-8d67-4ac6-913b-370e8e8c4f9c','song-c8c15b83-e038-4dc7-9901-c015de754fb4','song-9be03820-2e2a-453e-9270-2138bf79d9c2','song-8aaafadd-0290-4b8f-aa76-a7b167782212','song-81729459-26a5-4009-be58-ad263d0a35ad'],checks=[];
try{
 await p.goto(process.env.TEST_URL||'http://127.0.0.1:8780/');await p.locator('.library-row').first().waitFor();
 await p.evaluate(()=>{const proto=opensheetmusicdisplay.OpenSheetMusicDisplay.prototype,render=proto.render;proto.render=function(...args){const result=render.apply(this,args);window.phase4bEngraver=this;return result;};});
 const ready=()=>p.waitForFunction(()=>prototype.ready&&!prototype.busy&&document.querySelector('#score').getAttribute('aria-busy')==='false',{},{timeout:120000});
 for(const [width,height,ids] of [[820,1180,cases],[1440,1000,['cs-164']]]){
  await p.setViewportSize({width,height});
  for(const id of ids.filter(id=>!process.env.PHASE4B_UI_SONG||id===process.env.PHASE4B_UI_SONG)){
   await p.evaluate(id=>prototype.loadSong(id),id);await ready();assert(await p.locator('#score-size-options [data-size=large]').isEnabled(),id+' availability');
   await p.locator('#score-size').click();await p.locator('#score-size-options [data-size=large]').click();await ready();assert.equal(await p.locator('#score-view-label').textContent(),'Melody only');assert(await p.evaluate(()=>prototype.lead.ok));assert(await p.locator('#score svg').count());
   const details=await p.evaluate(()=>({overflow:document.documentElement.scrollWidth>innerWidth,notes:new DOMParser().parseFromString(prototype.viewXML,'application/xml').querySelectorAll('note').length,lyricCollisions:window.phase4bEngraver.GraphicSheet.MusicPages.flatMap(p=>p.MusicSystems).flatMap(s=>s.StaffLines.flatMap(l=>{const entries=l.Measures.flatMap(m=>m.staffEntries.flatMap(e=>e.LyricsEntries)).map(e=>{const b=e.GraphicalLabel.PositionAndShape;return {verse:e.LyricsEntry.VerseNumber,text:e.GraphicalLabel.Label.text,left:b.AbsolutePosition.x+b.BorderLeft,right:b.AbsolutePosition.x+b.BorderRight};});return [...new Set(entries.map(e=>e.verse))].flatMap(v=>{const row=entries.filter(e=>e.verse===v);return row.slice(1).flatMap((e,i)=>e.left<row[i].right-.05?[row[i].text+' / '+e.text]:[]);});}))}));
   await p.locator('#score').screenshot({path:`test-results/phase4b-${id}-${width}.png`,style:'.masthead,.toolbar{visibility:hidden!important}'});
   assert(!details.overflow,id+' overflow');assert.deepEqual(details.lyricCollisions,[],id+' lyric collisions');
   await p.evaluate(()=>prototype.playback.prepare());assert(await p.evaluate(async()=>JSON.stringify(prototype.playback.timeline)===JSON.stringify((await import('./playback.js')).scoreTimeline(prototype.viewXML))));
   if(id==='cs-164'&&width===820){await p.locator('#score-tools').click();await p.locator('#score-export').click();const download=p.waitForEvent('download');await p.locator('#score-export-xml').click();const result=await download;assert.equal(await result.failure(),null);const saved=fs.readFileSync(await result.path(),'utf8');assert.equal(saved,await p.evaluate(()=>prototype.viewXML));fs.writeFileSync('test-results/phase4b-cs-164.musicxml',saved);}
   checks.push({id,width,...details});console.log('PASS Melody menu/render/RH playback source',id,width,details);
  }
 }
 assert.deepEqual(errors,[]);fs.writeFileSync('test-results/phase4b-ui.json',JSON.stringify(checks,null,2));
}finally{await b.close();}
