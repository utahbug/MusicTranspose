import {createRequire} from 'node:module';import fs from 'node:fs';import {execFileSync} from 'node:child_process';import assert from 'node:assert/strict';
const {chromium}=createRequire(process.env.PLAYWRIGHT_PACKAGE||'C:/Users/kenro/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/package.json')('playwright');
const b=await chromium.launch({channel:'msedge',headless:true}),p=await b.newPage({viewport:{width:820,height:1180},serviceWorkers:'block'}),baseline=process.env.BREAK_BASELINE==='1',rows=[],errors=[];p.on('pageerror',e=>errors.push(e.message));
try{
// Reproduce the verified pre-fix renderer without changing the checkout.
if(baseline)for(const file of ['app.js','system-pagination.js'])await p.route('**/'+file,r=>r.fulfill({contentType:'text/javascript',body:execFileSync('git',['show','cd8f885:'+file],{encoding:'utf8'})}));

await p.route('**/virtual-pages.js',r=>{let source=fs.readFileSync('virtual-pages.js','utf8').replace('export function captureSystems(', 'function originalCaptureSystems(');source+=`\nexport function captureSystems(osmd,host,options){const out=originalCaptureSystems(osmd,host,options);out.testData=(()=>{const e=osmd,systems=e.GraphicSheet.MusicPages.flatMap(p=>p.MusicSystems),svg=host.querySelector('svg'),safe=svg.viewBox.baseVal.width/10-e.EngravingRules.PageRightMargin,clipped=[],collisions=[];
for(const [i,s] of systems.entries())for(const l of s.StaffLines){const lyrics=l.Measures.flatMap(m=>m.staffEntries.flatMap(e=>e.LyricsEntries.map(e=>{const b=e.GraphicalLabel.PositionAndShape;return {verse:e.LyricsEntry.VerseNumber,text:e.GraphicalLabel.Label.text,left:b.AbsolutePosition.x+b.BorderLeft,right:b.AbsolutePosition.x+b.BorderRight};})));
for(const a of lyrics)if(a.right>safe+.05)clipped.push({system:i+1,...a,safe});
for(const verse of new Set(lyrics.map(l=>l.verse))){const row=lyrics.filter(l=>l.verse===verse).sort((a,b)=>a.left-b.left);for(let j=1;j<row.length;j++)if(row[j].left<row[j-1].right-.05)collisions.push([row[j-1].text,row[j].text]);}}
return {staves:systems.map(s=>s.StaffLines.map(l=>l.parentStaff.idInMusicSheet)),height:systems.at(-1).PositionAndShape.AbsolutePosition.y+systems.at(-1).PositionAndShape.BorderBottom,zoom:e.Zoom,systems:systems.length,clipped,collisions,margin:e.EngravingRules.SystemRightMargin};})();return out;}`;return r.fulfill({contentType:'text/javascript',body:source});});
await p.addInitScript(()=>document.addEventListener('score-engraved',e=>{window.committedTestData=e.detail.systems.testData;}));
await p.goto(process.env.TEST_URL||'http://127.0.0.1:8780/');await p.locator('.library-row').first().waitFor();
await p.evaluate(()=>{const proto=opensheetmusicdisplay.OpenSheetMusicDisplay.prototype,f=proto.render;proto.render=function(...a){const r=f.apply(this,a);window.edgeEngraver=this;return r;};});
const cases=await p.evaluate(async()=>{const {songs}=await import('./catalog.js');return ['True to the Faith','Where Love Is','I Will Follow God’s Plan','Angels We Have Heard on High','As I Keep the Sabbath Day'].map(title=>{const s=songs.find(s=>s.title===title);return {id:s.id,title};});});
const ready=()=>p.waitForFunction(()=>prototype.ready&&!prototype.busy&&document.querySelector('#score svg')&&document.querySelector('#score').getAttribute('aria-busy')==='false');
for(const [width,height] of [[820,1180],[1440,1000]]){
await p.setViewportSize({width,height});
for(const song of width!==820?cases.slice(0,1):cases){
await p.evaluate(id=>prototype.loadSong(id,'auto'),song.id);await ready();
const data=await p.evaluate(async()=>{const v=await import('./virtual-pages.js');v.prepareVirtualPages();const pageGroups=v.virtualFrames().map(f=>({start:Number(f.dataset.start),end:Number(f.dataset.end),used:f._view.used,available:parseFloat(f.style.height)}));return {...window.committedTestData,pageGroups,xml:prototype.viewXML,pages:pageGroups.length,overflow:document.documentElement.scrollWidth>innerWidth};});
for(let i=1;i<data.pageGroups.length;i++)assert.equal(data.pageGroups[i].start,data.pageGroups[i-1].end+1,'all measures retained once');assert.equal(data.pageGroups[0].start,0);rows.push({...song,width,...data});console.log(song.title,width,JSON.stringify({pages:data.pages,staves:data.staves,height:data.height,overflow:data.overflow}));
await p.screenshot({path:`test-results/true-page-turn-${baseline?'before':'after'}-${song.id}-${width}.png`});
if(!baseline){const old=JSON.parse(fs.readFileSync('test-results/true-page-turn-before.json','utf8')).find(r=>r.id===song.id&&r.width===width);assert.equal(data.xml,old.xml,'musical XML unchanged');assert(!data.overflow);assert.equal(data.zoom,old.zoom,'notation scale unchanged');if(song.title==='True to the Faith'){assert.equal(data.pages,3);assert.equal(data.pageGroups[0].start,0);assert.equal(data.pageGroups[0].end,9);assert.equal(data.pageGroups[1].start,10);assert.equal(data.pageGroups.at(-1).end,19);assert.deepEqual(data.clipped,[]);assert.deepEqual(data.collisions,[]);assert.deepEqual(data.staves[0],[0,1]);assert(data.staves.at(-1).includes(2)&&data.staves.at(-1).includes(3));}else{assert.deepEqual(data.pageGroups,old.pageGroups);assert.deepEqual(data.staves,old.staves);}}


}
}
assert.deepEqual(errors,[]);fs.writeFileSync(`test-results/true-page-turn-${baseline?'before':'after'}.json`,JSON.stringify(rows,null,2));
}finally{await b.close();}
