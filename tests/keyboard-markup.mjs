import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {mkdirSync} from 'node:fs';
const {chromium,webkit}=createRequire('C:/Users/kenro/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/package.json')('playwright');
const base=process.env.TEST_URL||'http://127.0.0.1:8786/';
mkdirSync('test-results/keyboard-markup',{recursive:true});
for(const [engine,type] of Object.entries({chromium,webkit})){
 if(process.env.ENGINE&&engine!==process.env.ENGINE)continue;
 const browser=await type.launch(engine==='chromium'?{channel:'msedge'}:{});
 try{for(const width of (process.env.WIDTHS?process.env.WIDTHS.split(',').map(Number):[320,390,600,744,820,1024,1194,1440])){
 const height=Number(process.env.HEIGHT)||(width>=1024?820:1000);
 const context=await browser.newContext({viewport:{width,height},hasTouch:!process.env.DESKTOP&&width<1440,isMobile:!process.env.DESKTOP&&width<1440,userAgent:process.env.DESKTOP?'Desktop':(process.env.PHONE||width<600)?'iPhone':width<1440?'iPad':'Desktop',serviceWorkers:'block'});
 const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));console.log("START",engine,width);
 await page.goto(base);await page.waitForFunction(()=>window.prototype?.navigation);
 await page.locator('#home-keyboard').click();
 assert.equal(await page.locator('#keyboard-view').getAttribute('data-keyboard-view'),'guides');
 await page.locator('#scaleGuideTab').click();
 await page.evaluate(()=>window.savedKey=document.querySelector('[data-midi="60"]'));
 // Windows WebKit omits Web Audio; Chromium additionally checks held-note continuity.
 const audio=await page.evaluate(()=>!!(window.AudioContext||window.webkitAudioContext));const held=page.locator('[data-midi="60"]');if(audio){await held.focus();await page.keyboard.down('Space');await page.waitForFunction(()=>document.querySelector('[data-midi="60"]').classList.contains('is-playing'));}
 await page.locator('[data-keyboard-view="only"]').evaluate(e=>e.click());
 if(audio)assert(await held.evaluate(e=>e.classList.contains('is-playing')));
 assert(await page.locator('#scaleGuide').isHidden());assert(await page.locator('.keyboard-guide-tabs').isHidden());
 for(const id of ['keyboardSound','keyboardVolume','keyboardTransposeUp'])assert(await page.locator('#'+id).isVisible());
 assert.equal(await page.locator('.keyboard-white').count(),15);assert.equal(await page.locator('.keyboard-black').count(),10);
 const piano=await page.locator('#realKeyboard').boundingBox();assert(piano.width>=660&&piano.width<=1280);
 if(width>=1024)assert(piano.width>width*.84,`${width}: piano ${piano.width}`);
 await page.setViewportSize({width:height,height:width});
 assert(await page.evaluate(()=>savedKey===document.querySelector('[data-midi="60"]')));if(audio)assert(await held.evaluate(e=>e.classList.contains('is-playing')));await page.keyboard.up('Space');assert(!(await held.evaluate(e=>e.classList.contains('is-playing'))));
 await page.setViewportSize({width,height});
 await page.locator('[data-keyboard-view="guides"]').click();assert(await page.locator('#scaleGuide').isVisible());
 await page.locator('[data-keyboard-view="only"]').click();
 assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
 if(width===1194)await page.screenshot({path:`test-results/keyboard-markup/${engine}-keyboard-landscape.png`});
 await page.reload();await page.waitForFunction(()=>window.prototype?.navigation);if(await page.locator('#home-keyboard').isVisible())await page.locator('#home-keyboard').click();
 assert.equal(await page.locator('#keyboard-view').getAttribute('data-keyboard-view'),'only');
 await page.evaluate(()=>prototype.loadSong('faithful','normal'));
 const ready=()=>page.waitForFunction(()=>prototype.ready&&!prototype.loading&&!prototype.busy&&document.querySelector('#score').getAttribute('aria-busy')==='false');
 await ready();await page.locator('#score-size').click();await page.locator('#score-size-options [data-size="pdf"]').click();await ready();
 const shortcut=page.locator('#score-markup');assert.equal(await shortcut.isVisible(),width>=600);
 const scoreSwitch=await page.locator('#show-lyrics').boundingBox();
 const settings=await page.locator('#score-tools').boundingBox();
 for(const id of ['songs','show-lyrics','score-tools'])assert(await page.locator('#'+id).evaluate(e=>{const r=e.getBoundingClientRect();return r.width>=44&&r.height>=44&&r.left>=0&&r.right<=innerWidth&&e.contains(document.elementFromPoint(r.x+r.width/2,r.y+r.height/2));}),id+' accessible');
 if(width>=600){const mark=await shortcut.boundingBox();assert(mark.width>=44&&mark.height>=44);assert(scoreSwitch.x+scoreSwitch.width<=mark.x);assert(mark.x+mark.width<=settings.x);await shortcut.click();}
 else{await page.locator('#score-tools').click();await page.locator('#score-annotate').click();}
 assert(await page.locator('#pdf-annotation-panel').isVisible());assert.equal(await shortcut.getAttribute('aria-pressed'),'true');
 await page.locator('#pdf-annotation-done').click();assert(await page.locator('#pdf-annotation-panel').isHidden());
 if(width===1194)await page.screenshot({path:`test-results/keyboard-markup/${engine}-score-footer.png`});
 await page.locator('#show-lyrics').click();
 const lyricsSwitch=await page.locator('.lyrics-score-toggle').boundingBox();
 assert(Math.abs(lyricsSwitch.x-scoreSwitch.x)<1,`${engine} ${width} switches ${scoreSwitch.x} / ${lyricsSwitch.x}`);
 if(width===1194)await page.screenshot({path:`test-results/keyboard-markup/${engine}-lyrics-footer.png`});
 await page.locator('.lyrics-score-toggle').click();await ready();
 if(await page.locator('#score-hide-controls').isVisible()){await page.locator('#score-hide-controls').click();assert(await page.locator('#score-show-controls').isVisible());await page.locator('#score-show-controls').click();assert(await page.locator('#score-tools').isVisible());}
 await page.locator('#score-tools').click();await page.locator('#score-page-theme').click();assert(await page.locator('#show-lyrics').isVisible());
 await page.locator('#score-size').click();await page.locator('#score-size-options [data-size="auto"]').click();await ready();assert(await shortcut.isDisabled());assert.match(await shortcut.getAttribute('aria-label'),/Original PDFs only/);
 assert(await page.locator('#show-lyrics').isVisible());assert(await page.locator('#score-tools').isVisible());assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
 // Existing WebKit deferred-layout warning is also present on the unchanged base.
 assert.deepEqual(errors.filter(e=>e!=='ResizeObserver loop completed with undelivered notifications.'),[]);console.log('PASS',engine,width,process.env.DESKTOP?'desktop':'touch');await context.close();
 }}finally{await browser.close();}
}
