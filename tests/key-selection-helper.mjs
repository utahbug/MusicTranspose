// Exercise the deliberate chooser; never click obsolete toolbar step controls.
export async function chooseRelativeKey(page,delta){
 const target=await page.evaluate(delta=>Math.max(-6,Math.min(6,prototype.wanted+delta)),delta);
 await page.locator('#key').click();
 await page.locator(`#key-dialog [data-shift="${target}"]`).click();
}
