import assert from 'node:assert/strict';import {execFileSync} from 'node:child_process';import {createRequire} from 'node:module';
const {chromium}=createRequire('C:/Users/kenro/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/package.json')('playwright');
const oldCss=execFileSync('git',['show','67f8f73:icon-system.css'],{encoding:'utf8'});
for(const classic of [true,false]){const b=await chromium.launch({channel:'msedge',...(classic?{ignoreDefaultArgs:['--hide-scrollbars'],args:['--disable-features=OverlayScrollbar,OverlayScrollbars']}:{})});try{
 for(const width of classic?[1440,900]:[1440,820,744,390]){
  const mobile=!classic&&width<1000,c=await b.newContext({viewport:{width,height:900},hasTouch:mobile,isMobile:mobile,...(width===390?{userAgent:'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 Version/18.0 Mobile/15E148 Safari/604.1'}:{})});const p=await c.newPage();await p.goto(process.env.APP_URL||'http://127.0.0.1:8780/');await p.waitForFunction(()=>window.prototype?.navigation);await p.evaluate(()=>prototype.loadSong('nativity'));await p.waitForFunction(()=>prototype.ready&&!prototype.busy);
  const pair=()=>p.locator('body:not(.lyrics-open) .masthead .footer-view-pair,body.lyrics-open .lyrics-footer .footer-view-pair').evaluate(e=>[...e.querySelectorAll(':scope>button,:scope>.pdf-footer-tools-wrap>button,:scope>.display-settings>button')].map(e=>{const r=e.getBoundingClientRect();return {x:r.x,y:r.y,w:r.width,h:r.height};}));
  const geometry=()=>p.evaluate(()=>({paper:{w:document.querySelector('.score-paper').getBoundingClientRect().width,h:document.querySelector('.score-paper').getBoundingClientRect().height},viewBoxes:[...document.querySelectorAll('#score svg')].map(e=>e.getAttribute('viewBox')),footer:document.querySelector('.masthead').getBoundingClientRect().height}));
  const stable=[],gutters=[];
  for(const mode of ['pages','continuous']){
   await p.locator('#score-navigation-button').click();await p.locator(`[data-navigation="${mode}"]`).click();await p.waitForTimeout(100);
   if(mode==='continuous'&&width>600)assert(await p.evaluate(()=>document.documentElement.scrollHeight>innerHeight),'actual Score Scroll mode requires scrolling');
   const scoreGeometry=await geometry();await p.evaluate(css=>{document.querySelector('link[href="icon-system.css"]').disabled=true;const e=document.createElement('style');e.id='anchor-baseline';e.textContent=css;document.head.append(e);},oldCss);assert.deepEqual(await geometry(),scoreGeometry,'score dimensions and footer height unchanged from deployed CSS');await p.evaluate(()=>{document.getElementById('anchor-baseline').remove();document.querySelector('link[href="icon-system.css"]').disabled=false;});
   const expected=await pair();assert.equal(expected.length,2);assert(expected.every(r=>r.w===44&&r.h===44));assert.equal(expected[1].x-expected[0].x-44,6);stable.push(expected);
   for(const long of [false,true,false]){
    await p.locator('#show-lyrics').click();await p.locator('#lyrics-settings').waitFor({state:'visible'});
    // Isolate scrollbar presence from catalog content, without changing Lyrics data.
    await p.evaluate(long=>{const host=document.getElementById('lyrics-view');for(const e of host.children)if(!e.matches('.lyrics-footer,.lyrics-identity-header'))e.style.display='none';const fixture=document.createElement('p');fixture.textContent=long?'Long Lyrics viewport fixture':'Short Lyrics viewport fixture';fixture.style.height=long?'3000px':'50px';host.append(fixture);scrollTo(0,0);},long);
    assert.equal(await p.evaluate(()=>document.documentElement.scrollHeight>innerHeight),long,'short/long Lyrics exercises both scroll states');gutters.push(await p.evaluate(()=>innerWidth-document.documentElement.clientWidth));assert.deepEqual(await pair(),expected,'Score and Lyrics right controls stay stationary');
    await p.locator('#lyrics-settings').click();assert(await p.locator('#lyrics-settings-panel').isVisible());await p.keyboard.press('Escape');await p.locator('.lyrics-score-toggle').click();await p.locator('#score-tools').waitFor({state:'visible'});assert.deepEqual(await pair(),expected,'return to Score retains the anchor');assert.deepEqual(await geometry(),scoreGeometry,'switching does not change Score geometry');
   }
   if(width===390)assert(await p.locator('#score-hide-controls').isHidden());else{const f=await p.locator('#score-hide-controls').boundingBox(),bar=await p.locator('.masthead').boundingBox();assert.equal(f.x+22,bar.x+bar.width/2);}
  }
  assert.deepEqual(stable[0],stable[1],'Page Turns/Scroll use one right anchor');if(classic){assert(gutters.includes(0)&&gutters.some(w=>w>0),'classic scrollbar really appears/disappears');assert(await p.evaluate(()=>parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--score-lyrics-scrollbar'))>0));}else assert(await p.evaluate(()=>parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--score-lyrics-scrollbar'))===0),'no forced mobile/overlay gutter');
  await p.screenshot({path:`test-results/footer-anchor-${classic?'classic':'overlay'}-${width}.png`});console.log('PASS stationary pair across repeated Score/Lyrics, short/long content, Page Turns/Scroll; unchanged geometry',classic?'classic':'overlay',width);await c.close();
 }
}finally{await b.close();}}
