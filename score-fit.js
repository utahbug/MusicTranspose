// Screen-only scaling of the engraved SVG; no source or print changes.
const button=document.getElementById('score-fit'),score=document.getElementById('score'),viewport=document.getElementById('score-fit-viewport');
const phone=matchMedia('(max-width:600px)');let page=false;
function sync(){
 const active=page&&phone.matches&&!document.body.classList.contains('pdf-score-open');
 viewport.classList.toggle('fit-page',active);
 // Long continuous engravings have no dependable page breaks. A bounded overview
 // preserves legibility rather than shrinking the entire song onto one screen.
 const scale=.72;
 viewport.style.setProperty('--score-fit-scale',String(scale));
 if(active)viewport.style.height=score.offsetHeight*scale+'px';else viewport.style.removeProperty('height');
 const label=active?'Fit score to width':'Fit score to page';button.setAttribute('aria-label',label);button.title=label;button.dataset.fit=active?'page':'width';
}
export function resetScoreFit(){page=false;sync();}
button.onclick=()=>{page=!page;sync();};
new ResizeObserver(sync).observe(score);phone.addEventListener('change',sync);
