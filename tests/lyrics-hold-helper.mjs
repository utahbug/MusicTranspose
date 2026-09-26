// Fast entry for activity regressions; lyrics-cleanup.mjs separately exercises
// real two-second touch/mouse holds and cancellation on every responsive layout.
export async function holdLyrics(page){
 await page.locator('.lyrics-hold-target').evaluate(e=>e.dispatchEvent(new PointerEvent('pointerdown',{bubbles:true,isPrimary:true,button:0,pointerId:81,clientX:50,clientY:120})));
 await page.clock.runFor(2001);
 await page.locator('.lyrics-hold-target').evaluate(e=>e.dispatchEvent(new PointerEvent('pointerup',{bubbles:true,isPrimary:true,button:0,pointerId:81,clientX:50,clientY:120})));
}
