import {localRecord} from './local-music-store.js';
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
 let exporting=false,shareState=null,shareFile=null,shareReason='Preparing file for sharing…';
 const same=(a,b)=>a&&b&&['songId','local','title','view','key','xml','pdfUrl'].every(key=>a[key]===b[key]);
 async function artifact(format,s){
  const blob=format==='xml'?musicXmlBlob(s.xml):new Blob([await originalPdfData(s.pdfUrl)],{type:'application/pdf'});
  return {blob,name:exportFilename(s.title,s.view,s.key,format==='xml'?'musicxml':'pdf')};
 }
 // Prepare before the click, so native sharing keeps the user's transient activation.
 function prepareShare(s){
  if(!s.available||same(s,shareState))return;
  const snapshot=shareState={...s};shareFile=null;shareReason='Preparing file for sharing…';
  (async()=>{
   let file;
   if(s.local){
    const record=await localRecord(s.songId);if(!record?.file)throw Error('Original imported file unavailable. Use Export / Save.');
    const name=record.metadata.originalFilename||record.file.name||exportFilename(s.title,'original','',record.metadata.fileType||record.metadata.scoreType||'pdf');
    const type=record.file.type||({pdf:'application/pdf',mxl:'application/vnd.recordare.musicxml',xml:'application/vnd.recordare.musicxml+xml',musicxml:'application/vnd.recordare.musicxml+xml'}[name.split('.').at(-1).toLowerCase()]||'application/octet-stream');
    file=new File([record.file],name,{type});
   }else{
    const format=s.view==='original'&&s.pdfUrl?'pdf':s.xml?'xml':null;
    if(!format)throw Error('No shareable file is available. Use Export / Save to print this view.');
    const result=await artifact(format,s);file=new File([result.blob],result.name,{type:result.blob.type});
   }
   if(shareState===snapshot){shareFile=file;shareReason='';}
  })().catch(error=>{if(shareState===snapshot)shareReason=error.message||'File unavailable. Use Export / Save.';}).finally(()=>{if(shareState===snapshot)sync();});
 }
 async function share(){
  const s=getState();if(exporting||!s.available||!shareFile||!same(s,shareState))return;
  const file=shareFile;exporting=true;sync();
  try{
   if(typeof navigator.share==='function'&&typeof navigator.canShare==='function'&&navigator.canShare({files:[file]})){
    await navigator.share({files:[file],title:s.title});
    $('status').textContent='Share sheet opened.';
   }else{download(file,file.name);$('status').textContent='Native file sharing is unavailable. The file was downloaded instead.';}
  }catch(error){
   if(error.name==='AbortError')$('status').textContent='Sharing canceled.';
   else{download(file,file.name);$('status').textContent='Sharing was unavailable. The file was downloaded instead.';}
  }finally{exporting=false;sync();}
 }
 $('score-share').addEventListener('click',share);
 const explain=(button,reason)=>{button.disabled=!!reason;button.title=reason;reason?button.setAttribute('aria-description',reason):button.removeAttribute('aria-description');};
 function sync(){
  const s=getState(),pending=exporting?'Preparing export. Please wait.':!s.available?'Wait for the score to finish loading.':'';
  prepareShare(s);explain($('score-share'),pending||shareReason);if(shareFile&&!pending){$('score-share').title=s.local?'Send the original imported file. Downloads a copy if native sharing is unavailable.':'Send the current file. Downloads a copy if native sharing is unavailable.';}
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
   if(format==='xml'||s.view==='original'){const result=await artifact(format,s);download(result.blob,result.name);}
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
