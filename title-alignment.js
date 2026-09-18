// Presentation only: align source text with the first substantive title character.
export function alignTitleSubtitles(){
 for(const [heading,subtitle] of [[document.querySelector('.score-heading h1'),document.querySelector('.score-heading .subtitle')],[document.querySelector('#lyrics-view h1'),document.querySelector('.lyrics-source')]]){
  const text=heading?.firstChild;if(!subtitle||text?.nodeType!==Node.TEXT_NODE||!heading.getClientRects().length)continue;
  const skip=(text.textContent.match(/^[\s“‘"'([\{«‹]+/u)||[''])[0].length;
  if(skip>=text.length)continue;
  const range=document.createRange();range.setStart(text,skip);range.setEnd(text,skip+1);
  const offset=Math.max(0,range.getBoundingClientRect().left-subtitle.getBoundingClientRect().left);
  subtitle.style.setProperty('--title-text-inset',offset+'px');
 }
}
