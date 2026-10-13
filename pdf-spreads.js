// Display geometry only: source pages, canvas pixels and annotation identities stay intact.
export const spreadStart=index=>Math.floor(index/2)*2;
export function spreadTurn(index,delta,count){return Math.max(0,Math.min(spreadStart(count-1),spreadStart(index)+delta*2));}
export function ipadLandscape(device,width,height){
 return width>height&&!/iPhone|iPod/i.test(device.userAgent)&&(/iPad/i.test(device.userAgent)||(device.platform==='MacIntel'&&device.maxTouchPoints>1));
}
// Conservative minimum: every paired page must retain at least 400 CSS px of
// trimmed score width. Fit each pair at equal height, with a 16px gutter. Check
// every spread so turning a page cannot silently switch display modes.
export function fitPdfSpreads(ratios,width,height){
 if(ratios.length<2||height<=0||ratios.some(r=>!Number.isFinite(r)||r<=0))return null;
 const widths=[];
 for(let i=0;i<ratios.length;i+=2){
  const pair=ratios.slice(i,i+2),h=Math.min(height,(width-(pair.length-1)*16)/pair.reduce((a,b)=>a+b,0));
  const fitted=pair.map(r=>h*r);if(fitted.some(w=>w<400))return null; widths.push(...fitted);
 }
 return {widths};
}
