// Source wording only. No catalog metadata, editorial labels, or score-title footer.
export function appendSourceCreditFooter(xml,pages,excludedTitle=''){
 const doc=new DOMParser().parseFromString(xml,'application/xml');
 const key=text=>text.replace(/\s+/g,'');
 const titles=new Set([...doc.querySelectorAll('work > work-title,movement-title')].map(n=>key(n.textContent)));
 // The displayed title is an exclusion only, never a source of footer text.
 if(excludedTitle)titles.add(key(excludedTitle));
 const raw=[];
 for(const credit of doc.querySelectorAll('score-partwise > credit')){
  if([...credit.querySelectorAll('credit-type')].some(n=>['title','subtitle','lyrics'].includes(n.textContent.trim())))continue;
  raw.push([...credit.querySelectorAll('credit-words')].map(n=>n.textContent).join(''));
 }
 // Explicit source identification is allowed; never infer names or add role labels.
 raw.push(...[...doc.querySelectorAll('score-partwise > identification > creator,score-partwise > identification > rights,score-partwise > identification > source')].map(n=>n.textContent));
 const seen=new Set(),lines=raw.flatMap(text=>text.split(/\r?\n/)).filter(text=>{const k=key(text);if(!k||titles.has(k)||seen.has(k)||/^\d+\./.test(text.trim()))return false;seen.add(k);return true;});
 const rendered=key([...pages.querySelectorAll('svg text')].map(n=>n.textContent).join(''));
 const missing=lines.filter(text=>{const k=key(text);return !rendered.includes(k)&&!lines.some(other=>key(other).length>k.length&&key(other).includes(k));});
 if(!missing.length)return;
 const footer=document.createElement('footer');footer.className='print-source-footer';
 for(const text of missing){const line=document.createElement('div');line.textContent=text;footer.append(line);}
 pages.append(footer);
}
