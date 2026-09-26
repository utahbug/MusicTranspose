import {createRequire} from 'node:module';
import assert from 'node:assert/strict';
const {chromium}=createRequire(process.env.PLAYWRIGHT_PACKAGE)('playwright');
const browser=await chromium.launch({channel:'msedge',headless:true});
async function capture(disabled){
 const context=await browser.newContext({serviceWorkers:'block'}),page=await context.newPage();
 if(disabled)await page.route('**/lyric-placement.js',r=>r.fulfill({contentType:'text/javascript',body:'export function installLyricPlacement(){}'}));
 await page.goto(process.env.TEST_URL||'http://127.0.0.1:8768/');
 await page.locator('.library-row').first().waitFor();
 const out=[];
 for(const width of [390,1180]){
  await page.setViewportSize({width,height:820});await page.waitForTimeout(220);
  for(const id of ['nativity','shepherd','faithful','silent-night','cs-2','cs-110','cs-236','hhc-1010']){
   await page.evaluate(id=>prototype.loadSong(id),id);await page.waitForFunction(()=>prototype.ready&&!prototype.busy);
   out.push(await page.locator('#score').evaluate(e=>({zoom:e.dataset.zoom,systems:e.dataset.systems,
    geometry:[...e.querySelectorAll('path,text,line,rect')].map(n=>({tag:n.tagName,text:n.tagName==='text'?n.textContent:'',
     attrs:[...n.attributes].filter(a=>!['id','class'].includes(a.name)).map(a=>[a.name,a.value])}))})));
  }
 }
 await context.close();return out;
}
try{
 const before=await capture(true),after=await capture(false);
 assert.deepEqual(after,before);
 console.log('PASS exact SVG geometry/text comparison: 8 unaffected songs, phone/tablet');
}finally{await browser.close();}
