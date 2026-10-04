import fs from 'node:fs';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {filesIcon,listsIcon} from '../icons.js';
const {webkit,chromium}=createRequire(process.env.PLAYWRIGHT_PACKAGE||'C:/Users/kenro/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/package.json')('playwright');
const browsers=[await webkit.launch(),await chromium.launch({channel:'msedge',headless:true})],results=[];
fs.mkdirSync('test-results/workspace-quick-links',{recursive:true});
try{
 for(const width of [390,430,820,1024,1440]){
  const height=width<600?844:1180,c=await browsers[width<600?0:1].newContext({viewport:{width,height},serviceWorkers:'block'}),p=await c.newPage(),errors=[];
  p.on('pageerror',e=>errors.push(e.message));
  await p.addInitScript(()=>localStorage.setItem('music-transpose-library-v1',JSON.stringify({orderingVersion:1,favorites:['cs-138'],groups:Array.from({length:16},(_,i)=>({id:'list'+i,name:'Practice '+i,description:'Preserve this description',songs:['hhc-1035','cs-138'],displayNames:{'hhc-1035':'Sabbath'}}))})));
  await p.goto('http://127.0.0.1:8780/');await p.waitForFunction(()=>window.prototype?.navigation);
  await p.locator('#home-lists').click();await p.locator('[data-list=list0] .list-overview-entry').click();
  await p.evaluate(()=>scrollTo(0,300));await p.waitForTimeout(150);
  const savedScroll=await p.evaluate(()=>scrollY),data=await p.evaluate(()=>localStorage.getItem('music-transpose-library-v1'));
  async function check(view,destination,icon){
   const sibling=p.locator('#'+view+'-quick-'+destination.toLowerCase()),home=p.locator('#'+view+'-library');
   assert.equal(await sibling.getAttribute('aria-label'),destination);assert.equal(await sibling.getAttribute('title'),destination);
   assert.equal(await sibling.textContent(),'');assert.equal(await sibling.evaluate(e=>e.innerHTML),await p.evaluate(icon=>{const e=document.createElement('div');e.innerHTML=icon;return e.innerHTML;},icon));
   assert.equal(await home.getAttribute('aria-label'),'Library Home');
   const a=await home.boundingBox(),b=await sibling.boundingBox();
   assert.equal(b.width,44);assert.equal(b.height,44);assert.equal(b.x-a.x-a.width,8);assert.equal(b.y,a.y);assert(b.y+b.height<=height-8);
   assert.match(await home.evaluate(e=>getComputedStyle(e).backgroundImage),/linear-gradient/);
   await p.keyboard.press('Tab');await sibling.focus();assert.notEqual(await sibling.evaluate(e=>getComputedStyle(e).outlineStyle),'none');
   assert.equal(await p.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
   if([390,820,1440].includes(width))await p.screenshot({path:'test-results/workspace-quick-links/'+view+'-'+width+'.png'});
   return {home:a,sibling:b};
  }
  const lists=await check('lists','Files',filesIcon);await p.evaluate(y=>scrollTo(0,y),savedScroll);await p.waitForTimeout(100);
  await p.locator('#lists-quick-files').press('Enter');await p.locator('#files-view').waitFor({state:'visible'});
  assert.equal(await p.evaluate(()=>document.activeElement.id),'files-heading');assert(await p.locator('#library-home').isHidden());
  const rows=await p.locator('#files-results').innerText(),files=await check('files','Lists',listsIcon);
  await p.locator('#files-quick-lists').press('Space');await p.locator('#lists-view').waitFor({state:'visible'});
  assert.equal(await p.evaluate(()=>document.activeElement.id),'lists-heading');
  assert.equal(await p.locator('[data-list=list0] .list-overview-entry').getAttribute('aria-expanded'),'true');
  assert(Math.abs(await p.evaluate(()=>scrollY)-savedScroll)<2);
  assert.equal(await p.locator('[data-song=hhc-1035] .workspace-song-entry strong').first().textContent(),'Sabbath');
  await p.locator('#lists-quick-files').click();assert.equal(await p.locator('#files-results').innerText(),rows);
  await p.goBack();await p.locator('#lists-view').waitFor({state:'visible'});assert.equal(await p.evaluate(()=>document.activeElement.id),'lists-heading');
  await p.goForward();await p.locator('#files-view').waitFor({state:'visible'});assert.equal(await p.evaluate(()=>document.activeElement.id),'files-heading');
  await p.locator('#files-library').click();await p.locator('#library-home').waitFor({state:'visible'});
  await p.locator('#home-lists').click();await p.locator('#lists-library').click();await p.locator('#library-home').waitFor({state:'visible'});
  await p.locator('#home-lists').click();
  if(width<600){
   await p.addStyleTag({content:'.workspace-return{padding-bottom:34px!important}'});
   const b=await p.locator('#lists-quick-files').boundingBox();assert(b.y+b.height<=height-34);
   await p.evaluate(()=>scrollTo(0,document.documentElement.scrollHeight));await p.waitForTimeout(100);
   const row=await p.locator('.list-workspace-section').last().boundingBox(),footer=await p.locator('#lists-return').boundingBox();assert(row.y+row.height<=footer.y);
  }
  assert.equal(await p.evaluate(()=>localStorage.getItem('music-transpose-library-v1')),data);assert.deepEqual(errors,[]);
  results.push({width,height,lists,files,restoredScroll:savedScroll,fileRowsPreserved:true,listDataUnchanged:true,historyAndFocus:'passed',safeArea:width<600?'34px padding simulation passed':'existing padding'});
  console.log('PASS workspace links, state, history, keyboard, geometry',width);await c.close();
 }
 fs.writeFileSync('test-results/workspace-quick-links/results.json',JSON.stringify(results,null,2)+'\n');
}finally{await Promise.all(browsers.map(b=>b.close()));}
