import {createRequire} from 'node:module';import fs from 'node:fs';import {execFileSync} from 'node:child_process';import assert from 'node:assert/strict';
const {chromium}=createRequire(process.env.PLAYWRIGHT_PACKAGE||'C:/Users/kenro/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/package.json')('playwright');
const b=await chromium.launch({channel:'msedge',headless:true}),p=await b.newPage({viewport:{width:820,height:1180},serviceWorkers:'block'}),baseline=process.env.LYRIC_EDGE_BASELINE==='1',rows=[],errors=[];p.on('pageerror',e=>errors.push(e.message));
try{
// Reproduce the verified pre-fix renderer without changing the checkout.
if(baseline)for(const file of ['app.js','lead-layout.js'])await p.route('**/'+file,r=>r.fulfill({contentType:'text/javascript',body:execFileSync('git',['show','fac3a1c:'+file],{encoding:'utf8'})}));
await p.goto(process.env.TEST_URL||'http://127.0.0.1:8780/');await p.locator('.library-row').first().waitFor();
await p.evaluate(()=>{const proto=opensheetmusicdisplay.OpenSheetMusicDisplay.prototype,f=proto.render;proto.render=function(...a){const r=f.apply(this,a);window.edgeEngraver=this;return r;};});
const cases=await p.evaluate(async()=>{const {songs}=await import('./catalog.js');return ['True to the Faith','I Will Follow God’s Plan','Angels We Have Heard on High','Where Love Is','As I Keep the Sabbath Day'].map(title=>{const s=songs.find(s=>s.title===title);if(!s)throw Error(title);return {id:s.id,title};});});
const ready=()=>p.waitForFunction(()=>prototype.ready&&!prototype.busy&&document.querySelector('#score svg')&&document.querySelector('#score').getAttribute('aria-busy')==='false');
for(const [width,height] of [[820,1180],[1440,1000],[390,844]]){
await p.setViewportSize({width,height});
for(const song of width===390?cases.slice(0,1):cases){
await p.evaluate(id=>prototype.loadSong(id,'large'),song.id);await ready();
const data=await p.evaluate(async()=>{const e=edgeEngraver,systems=e.GraphicSheet.MusicPages.flatMap(p=>p.MusicSystems),svg=document.querySelector('#score svg'),safe=svg.viewBox.baseVal.width/10-e.EngravingRules.PageRightMargin,clipped=[],collisions=[];
for(const [i,s] of systems.entries())for(const l of s.StaffLines){const lyrics=l.Measures.flatMap(m=>m.staffEntries.flatMap(e=>e.LyricsEntries.map(e=>{const b=e.GraphicalLabel.PositionAndShape;return {verse:e.LyricsEntry.VerseNumber,text:e.GraphicalLabel.Label.text,left:b.AbsolutePosition.x+b.BorderLeft,right:b.AbsolutePosition.x+b.BorderRight};})));
for(const a of lyrics)if(a.right>safe+.05)clipped.push({system:i+1,...a,safe});
for(const verse of new Set(lyrics.map(l=>l.verse))){const row=lyrics.filter(l=>l.verse===verse).sort((a,b)=>a.left-b.left);for(let j=1;j<row.length;j++)if(row[j].left<row[j-1].right-.05)collisions.push([row[j-1].text,row[j].text]);}}
return {xml:prototype.viewXML,zoom:e.Zoom,pages:(await import('./auto-layout.js')).assessLayout(document.querySelector('#score'),(await import('./virtual-pages.js')).captureSystems(e,document.querySelector('#score')),document.querySelector('#score').clientWidth,(await import('./virtual-pages.js')).availableScoreHeight(document.querySelector('#score')),e.Zoom).pages,systems:systems.length,clipped,collisions,margin:e.EngravingRules.SystemRightMargin,overflow:document.documentElement.scrollWidth>innerWidth};});
rows.push({...song,width,...data});console.log(song.title,width,JSON.stringify({...data,xml:undefined}));
await p.screenshot({path:`test-results/lyric-edge-${baseline?'before':'after'}-${song.id}-${width}.png`});
if(!baseline){const before=JSON.parse(fs.readFileSync('test-results/lyric-edge-before.json','utf8')).find(r=>r.id===song.id&&r.width===width);assert.equal(data.xml,before.xml,'musical XML unchanged');assert.equal(data.pages,before.pages,'page count unchanged');assert.equal(data.zoom,before.zoom,'notation scale unchanged');assert.equal(data.systems,before.systems,'system count unchanged');assert(!data.overflow);assert.deepEqual(data.clipped,[],'right edge lyrics');assert(data.collisions.length<=before.collisions.length,'no new lyric collisions');}
}
}
if(!baseline){
 // The shared engraver must restore full-score spacing after corrected Melody.
 await p.locator('#score-size').click();await p.locator('#score-size-options [data-size=auto]').click();await ready();
 assert.equal(await p.evaluate(()=>edgeEngraver.EngravingRules.SystemRightMargin),0,'padding restored for Transpose');
}
assert.deepEqual(errors,[]);fs.writeFileSync(`test-results/lyric-edge-${baseline?'before':'after'}.json`,JSON.stringify(rows,null,2));
}finally{await b.close();}
