export async function enterLyricsFun(page){
 await page.locator('.lyrics-body p').first().evaluate(e=>{const r=e.getBoundingClientRect();for(let i=0;i<4;i++)for(const type of ['pointerdown','pointerup'])e.dispatchEvent(new PointerEvent(type,{bubbles:true,isPrimary:true,button:0,pointerId:81,clientX:r.x+10,clientY:r.y+10}));});
}
