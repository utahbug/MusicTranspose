import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createRequire} from 'node:module';
const {chromium,webkit}=createRequire('C:/Users/kenro/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/package.json')('playwright');
const baseline=process.argv.includes('--baseline'),results=[];
const browser=process.env.NOTES_WEBKIT?await webkit.launch():await chromium.launch({channel:'msedge'});
fs.mkdirSync('test-results/notes-layout',{recursive:true});
try {
 for(const width of [320,390,600,744,820,1024,1440]){
  const c=await browser.newContext({viewport:{width,height:900},serviceWorkers:'block'}),p=await c.newPage(),errors=[];
  p.on('pageerror',e=>errors.push(e.message));
  await c.addInitScript(()=>localStorage.setItem('music-transpose-library-v1',JSON.stringify({orderingVersion:1,favorites:[],groups:[{id:'a',name:'Practice',songs:[]}],textItems:Object.fromEntries(Array.from({length:24},(_,i)=>['text:'+i,{type:'text',title:i===23?'Z Long title '+ 'UnbrokenLongNoteTitle'.repeat(8):'Note '+String(i).padStart(2,'0'),html:'<p>Preserve note '+i+'</p>'}]))})));
  await p.goto('http://127.0.0.1:8780/');await p.waitForFunction(()=>window.prototype?.navigation);
  const banner=async id=>p.locator('#'+id+' .workspace-banner').boundingBox();
  await p.locator('#home-lists').click();const lists=await banner('lists-view');
  await p.locator('#lists-library').click();await p.locator('#home-files').click();const files=await banner('files-view');
  await p.locator('#files-view .workspace-return').getByRole('button',{name:'Notes',exact:true}).click();
  const notes=await banner('texts-view'),row=await p.locator('.text-library-row').first().boundingBox();
  const data=await p.evaluate(()=>localStorage.getItem('music-transpose-library-v1'));
  results.push({width,listsMargin:lists.x,filesMargin:files.x,notesMargin:notes.x,notesWidth:notes.width,rowHeight:row.height});
  if(!baseline){
   assert.equal(notes.x,lists.x);assert.equal(notes.width,lists.width);
   const outer=Math.max(0,(width-1080)/2);
   assert.equal(lists.x,outer+(width<700?8:24));
   assert.equal(files.x,outer+(width<=600?14:24));
   assert.equal(await p.locator('.text-library-entry strong').first().evaluate(e=>getComputedStyle(e).fontSize),'16px');
   for(const selector of ['#texts-context','.texts-actions','#texts-items','.texts-purpose'])assert.equal((await p.locator(selector).boundingBox()).x,notes.x);
   if(width<700)assert(row.height<=52);
   for(const theme of ['light','dark']){
    await p.evaluate(t=>document.documentElement.dataset.libraryTheme=t,theme);
    assert(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
    const targets=await p.locator('#texts-new,#texts-search,.text-library-row button').evaluateAll(es=>es.map(e=>{const r=e.getBoundingClientRect();return {w:r.width,h:r.height,x:r.x,right:r.right,overflow:e.scrollWidth>e.clientWidth+1};}));
    assert(targets.every(r=>r.w>=44&&r.h>=44&&r.x>=0&&r.right<=width&&!r.overflow),JSON.stringify(targets));
    const footer=await p.locator('#texts-view footer').boundingBox();await p.evaluate(()=>scrollTo(0,document.body.scrollHeight));
    assert.deepEqual(await p.locator('#texts-view footer').boundingBox(),footer);
    await p.locator('.text-library-row').last().scrollIntoViewIfNeeded();
    const last=await p.locator('.text-library-row').last().boundingBox();assert(last.y+last.height<=footer.y);
    await p.evaluate(()=>scrollTo(0,0));await p.screenshot({path:`test-results/notes-layout/${width}-${theme}.png`});
   }
   await p.locator('#texts-search').fill('Note 07');assert.equal(await p.locator('.text-library-row').count(),1);
   await p.locator('#texts-search').fill('no such note');assert.match(await p.locator('#texts-items').innerText(),/No Notes match/);
   await p.locator('#texts-search').fill('');
   await p.locator('#texts-new').focus();await p.keyboard.press('Enter');assert(await p.locator('#list-text-dialog').isVisible());await p.keyboard.press('Escape');
   assert.equal(await p.evaluate(()=>localStorage.getItem('music-transpose-library-v1')),data);
   assert.deepEqual(errors,[]);
  }
  await c.close();
 }
 if(!baseline){
  const c=await browser.newContext({viewport:{width:320,height:700},serviceWorkers:'block'}),p=await c.newPage();
  await p.goto('http://127.0.0.1:8780/');await p.waitForFunction(()=>window.prototype?.navigation);await p.locator('#home-text').click();
  assert.match(await p.locator('#texts-items').innerText(),/No Notes yet/);assert(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));await c.close();
 }
 fs.writeFileSync(`test-results/notes-layout/${baseline?'before':'after'}.json`,JSON.stringify(results,null,2)+'\n');console.log(JSON.stringify(results));console.log('PASS Notes responsive '+(baseline?'baseline measurements':'alignment, touch targets, long titles, search, keyboard, themes, footer and unchanged data'));
}finally{await browser.close();}
