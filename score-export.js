const $=id=>document.getElementById(id);

// Ordinary, uncompressed MusicXML: never serialize disposable engraving state.
export function musicXmlBlob(xml){
 const doc=new DOMParser().parseFromString(xml,'application/xml');
 if(doc.querySelector('parsererror')||doc.documentElement.localName!=='score-partwise'||!doc.querySelector('part-list > score-part')||!doc.querySelector('part > measure'))throw Error('This score cannot be exported as MusicXML.');
 return new Blob([xml],{type:'application/vnd.recordare.musicxml+xml;charset=utf-8'});
}
export function exportFilename(title,view,key,extension){
 const suffix=[view!=='original'&&key,view==='melody'&&'Melody only'].filter(Boolean).join(' - ');
 const clean=value=>value.normalize('NFC').replace(/[<>:"/\\|?*\x00-\x1f\x7f]/g,' ').replace(/\s+/g,' ').trim();
 const ending=suffix?' - '+clean(suffix):'';
 let name=(clean(title||'Score').slice(0,140-ending.length)+ending).replace(/[. ]+$/,'');
 if(!name)name='Score';if(/^(con|prn|aux|nul|com[1-9]|lpt[1-9])(?:\.|$)/i.test(name))name='Score - '+name;
 return name+'.'+extension;
}
function download(blob,name){
 const url=URL.createObjectURL(blob),link=document.createElement('a');link.href=url;link.download=name;document.body.append(link);link.click();link.remove();
 // Allow mobile browsers time to consume the URL before releasing it.
 setTimeout(()=>URL.revokeObjectURL(url),60000);
}
export function createScoreExport({getState,originalPdfData,preparePrint}){
 let exporting=false;
 const explain=(button,reason)=>{button.disabled=!!reason;button.title=reason;reason?button.setAttribute('aria-description',reason):button.removeAttribute('aria-description');};
 function sync(){
  const s=getState(),pending=exporting?'Preparing export. Please wait.':!s.available?'Wait for the score to finish loading.':'';
  explain($('score-export'),pending);
  explain($('score-export-pdf'),pending||(s.view==='original'&&!s.pdfUrl?'Original PDF is not available for this song.':''));
  explain($('score-export-xml'),pending||(!s.xml?'MusicXML is not available for this score.':''));
  $('score-export-pdf-label').textContent=s.view==='original'?'PDF':'Save / Print PDF';
  $('score-export-pdf-help').textContent=s.view==='original'?'Save original · Share or print':'Choose Save as PDF in Print';
  if(s.xml&&!pending)$('score-export-xml').title=s.view==='original'?'Exports the original structured score.':'Exports the current key, register and score view.';
 }
 async function run(format){
  const s=getState();if(exporting||!s.available||(format==='xml'&&!s.xml)||(format==='pdf'&&s.view==='original'&&!s.pdfUrl))return;
  exporting=true;sync();
  try{
   const name=exportFilename(s.title,s.view,s.key,format==='xml'?'musicxml':'pdf');
   if(format==='xml')download(musicXmlBlob(s.xml),name);
   else if(s.view==='original')download(new Blob([await originalPdfData(s.pdfUrl)],{type:'application/pdf'}),name);
   else{
    await preparePrint();const now=getState();
    if(!now.available||now.songId!==s.songId||now.view!==s.view||now.xml!==s.xml){document.body.classList.remove('prepared-print');$('print-pages').replaceChildren();throw Error('The score changed. Please try Export / Save again.');}
    window.print();
   }
  }catch(error){console.error(error);$('status').textContent='Unable to export. '+(error.message||'Please try again.');}
  finally{exporting=false;sync();}
 }
 $('score-export-pdf').addEventListener('click',()=>run('pdf'));
 $('score-export-xml').addEventListener('click',()=>run('xml'));
 return {sync};
}
