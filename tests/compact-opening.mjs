import {createRequire} from 'node:module';
import {execFileSync} from 'node:child_process';
import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
const require=createRequire(process.env.PLAYWRIGHT_PACKAGE||import.meta.url),{chromium}=require('playwright');
const old=execFileSync('git',['show','6cdccb9:score-layout.js'],{encoding:'utf8'});
const browser=await chromium.launch({channel:'msedge',headless:true}),page=await browser.newPage();
const results=[];
try{
 for(const width of [375,820,1180,1440]){
  await page.setViewportSize({width,height:1000});await page.goto(process.env.TEST_URL||'http://127.0.0.1:8767/');await page.locator('[data-song="nativity"] .song-entry').click();
  await page.waitForFunction(()=>window.prototype?.ready&&!prototype.busy);
  for(const song of ['nativity','shepherd','faithful','silent-night']){
   await page.evaluate(id=>prototype.loadSong(id),song);
   const result=await page.evaluate(async old=>{
    const score=document.querySelector('#score'),svg=score.querySelector('svg'),group=svg.querySelector('[data-compact-tempo]');
    const rect=group.getBoundingClientRect(),sr=svg.getBoundingClientRect();
    const text=[...group.querySelectorAll('text')].map(t=>({text:t.textContent,rect:t.getBoundingClientRect().toJSON()}));
    const overlaps=[];for(let i=0;i<text.length;i++)for(let j=i+1;j<text.length;j++){const a=text[i].rect,b=text[j].rect;if(a.left<b.right-.2&&a.right>b.left+.2&&a.top<b.bottom-.2&&a.bottom>b.top+.2)overlaps.push([text[i].text,text[j].text]);}
    const host=document.createElement('div');host.style.cssText=`position:absolute;left:-10000px;width:${score.clientWidth}px`;document.body.append(host);
    const engraver=new opensheetmusicdisplay.OpenSheetMusicDisplay(host,{backend:'svg',autoResize:false,drawTitle:false,drawSubtitle:false,drawComposer:false,drawLyricist:false,drawPartNames:false,drawFingerings:true,drawLyrics:true,drawMeasureNumbers:false,drawMetronomeMarks:true,newSystemFromXML:false,newPageFromXML:false});
    await engraver.load(prototype.xml);engraver.Zoom=score.clientWidth<800?.78:.9;engraver.render();
    new Function(old.replace('export function','function')+';return avoidTempoCollisions;')()(host);
    const before=host.querySelector('svg').getBBox().y,after=svg.getBBox().y;
    const recovered=(after-before)*sr.width/svg.viewBox.baseVal.width;
    host.remove();return {wrapped:group.dataset.wrapped,text:text.map(t=>t.text),overlaps,fits:rect.left>=sr.left-.5&&rect.right<=sr.right+.5,recovered};
   },old);
   assert.deepEqual(result.overlaps,[]);assert(result.fits);assert(result.text.includes(','));assert(result.recovered>=-6, "Compact line must not add excessive opening space");
   results.push({width,song,...result});
  }
 }
 await fs.writeFile('test-results/compact-opening.json',JSON.stringify(results,null,2));console.log(JSON.stringify(results.map(({width,song,wrapped,recovered})=>({width,song,wrapped,recovered:Math.round(recovered)})),null,2));
}finally{await browser.close();}


