import {parseXML,originalKey,transposeXML} from './music.js';
import {scoreTimeline} from './playback.js';
const MAX=30*1024*1024,EXPANDED=64*1024*1024;
const fail=message=>{throw Error(message);};
function crc32(bytes){let c=0xffffffff;for(const b of bytes){c^=b;for(let i=0;i<8;i++)c=(c>>>1)^((c&1)?0xedb88320:0);}return (c^0xffffffff)>>>0;}
function unzip(bytes){
 const d=new DataView(bytes.buffer,bytes.byteOffset,bytes.byteLength);let end=-1;
 for(let i=bytes.length-22;i>=Math.max(0,bytes.length-65557);i--)if(d.getUint32(i,true)===0x06054b50){end=i;break;}
 if(end<0)fail('This MXL archive is damaged or incomplete.');
 const count=d.getUint16(end+10,true),entries=[];let pos=d.getUint32(end+16,true),total=0;
 if(count>512||!count||d.getUint16(end+4,true)||d.getUint16(end+6,true))fail('This MXL archive is too complex or unsupported.');
 for(let i=0;i<count;i++){
  if(pos+46>bytes.length||d.getUint32(pos,true)!==0x02014b50)fail('This MXL archive is damaged.');
  const size=d.getUint32(pos+24,true),n=d.getUint16(pos+28,true),extra=d.getUint16(pos+30,true),comment=d.getUint16(pos+32,true),name=new TextDecoder().decode(bytes.subarray(pos+46,pos+46+n));
  total+=size;if(total>EXPANDED||size>EXPANDED||d.getUint16(pos+8,true)&1||! [0,8].includes(d.getUint16(pos+10,true)))fail('This MXL archive is too large, encrypted, or unsupported.');
  if(name.includes('..')||name.startsWith('/')||entries.some(e=>e.name===name))fail('This MXL archive has invalid file paths.');
  entries.push({name,size,crc:d.getUint32(pos+16,true)});pos+=46+n+extra+comment;
 }
 const files=fflate.unzipSync(bytes,{filter:file=>{if(file.originalSize>EXPANDED||!entries.some(e=>e.name===file.name&&e.size===file.originalSize))fail('This MXL archive has inconsistent file sizes.');return true;}});for(const e of entries)if(!files[e.name]||files[e.name].length!==e.size||crc32(files[e.name])!==e.crc)fail('This MXL archive failed its integrity check.');
 const container=files['META-INF/container.xml'];if(!container)fail('This MXL file has no MusicXML container.');
 const doc=parseXML(fflate.strFromU8(container)),root=[...doc.getElementsByTagName('rootfile')].find(e=>e.getAttribute('media-type')==='application/vnd.recordare.musicxml+xml'),file=files[root?.getAttribute('full-path')];
 if(!file)fail('The MXL container does not reference a readable MusicXML score.');return fflate.strFromU8(file);
}
export async function inspectFile(file,host){
 if(!file.size||file.size>MAX)fail('Choose a non-empty file smaller than 30 MB.');
 const type=file.name.split('.').pop().toLowerCase();if(!['pdf','mxl','musicxml','xml'].includes(type))fail('Choose a PDF, MXL, MusicXML, or MusicXML XML file.');
 const bytes=new Uint8Array(await file.arrayBuffer()),hash=[...new Uint8Array(await crypto.subtle.digest('SHA-256',bytes))].map(n=>n.toString(16).padStart(2,'0')).join('');
 const metadata={id:'local-'+crypto.randomUUID(),title:file.name.replace(/\.[^.]+$/,''),collection:'My Music',page:'',originalFilename:file.name,fileType:type,importDate:new Date().toISOString(),hash,local:true,tags:[],aliases:[],collectionMemberships:[],transpositionAvailable:false,playbackAvailable:false,capability:'View only',warnings:[]};
 host.replaceChildren();
 if(type==='pdf'){
  if(!new TextDecoder().decode(bytes.subarray(0,1024)).includes('%PDF-'))fail('This file is not a valid PDF.');
  pdfjsLib.GlobalWorkerOptions.workerSrc=new URL('./vendor/pdf.worker.min.js',import.meta.url).href;
  let doc;try{doc=await pdfjsLib.getDocument({data:bytes.slice(),isEvalSupported:false}).promise;const page=await doc.getPage(1),v=page.getViewport({scale:Math.min(1,600/page.getViewport({scale:1}).width)}),canvas=document.createElement('canvas');canvas.width=v.width;canvas.height=v.height;host.append(canvas);await page.render({canvasContext:canvas.getContext('2d'),viewport:v}).promise;metadata.pages=doc.numPages;}catch{fail('This PDF cannot be opened. It may be damaged or password-protected.');}finally{await doc?.destroy();}
  return {metadata:{...metadata,scoreType:'pdf',capability:'PDF'},file:new Blob([bytes],{type:'application/pdf'})};
 }
 let xml;try{xml=type==='mxl'?unzip(bytes):new TextDecoder('utf-8',{fatal:true}).decode(bytes);}catch(e){fail(e.message.startsWith('This')||e.message.startsWith('The MXL')?e.message:'This score file is damaged or unreadable.');}
 if(/<!ENTITY/i.test(xml))fail('XML entity declarations are not supported.');
 let doc;try{doc=parseXML(xml);}catch{fail('This XML is malformed. Please export the score again.');}
 if(doc.documentElement.nodeName!=='score-partwise'||!doc.querySelector('score-partwise > part > measure > note'))fail('This is not a supported partwise MusicXML score with usable measures.');
 if(doc.querySelectorAll('measure').length>2000||doc.querySelectorAll('note').length>20000)fail('This score is too large for safe preview.');
 // Do not allow imports to fetch remote images/fonts/links or executable data.
 if(doc.querySelector('image,link,opus')||[...doc.querySelectorAll('*')].some(e=>[...e.attributes].some(a=>['href','src'].includes(a.localName))))fail('This score references external content. Export a self-contained MusicXML score.');
 metadata.title=doc.querySelector('work-title,movement-title')?.textContent.trim()||metadata.title;metadata.scoreType='musicxml';
 const warnings=metadata.warnings;let key;
 try{key=originalKey(doc);Object.assign(metadata,{tonic:key.name,mode:key.mode,fifths:key.fifths});}catch{warnings.push('Missing, changing, or non-major/minor key signatures: transposition unavailable.');}
 if(doc.querySelector('transpose,unpitched,staff-tuning,scordatura,key-step'))warnings.push('Instrument transposition, percussion, tablature, or nonstandard key notation needs review.');
 if([...doc.querySelectorAll('pitch')].some(p=>! /^[A-G]$/.test(p.querySelector('step')?.textContent||'')||! /^\d$/.test(p.querySelector('octave')?.textContent||'')||!Number.isInteger(Number(p.querySelector('alter')?.textContent||0))))warnings.push('Nonstandard or microtonal pitches need review.');
 if([...doc.querySelectorAll('score-partwise > part')].some(p=>!p.querySelector('measure:first-of-type > attributes > key > fifths')))warnings.push('A part has no initial key signature; transposition needs review.');
 if(doc.querySelector('notehead')&&[...doc.querySelectorAll('notehead')].some(n=>!['normal',''].includes(n.textContent.trim())))warnings.push('Special notehead notation needs review before transposition.');
 const unsafe=warnings.length>0;
 if(doc.querySelector('repeat,ending,segno,coda'))warnings.push('Playback follows measures in written order; repeats/endings are not expanded.');
 if(doc.querySelector('lyric:not(:has(text)):not(:has(extend)),direction-type > other-direction'))warnings.push('Unusual lyrics or directions should be checked in the preview.');
 metadata.transpositionAvailable=!!key&&!unsafe;metadata.capability=metadata.transpositionAvailable?'Transposable':'View only';
 if(metadata.transpositionAvailable){try{for(const n of [-6,-1,1,6])transposeXML(xml,n);}catch{metadata.transpositionAvailable=false;metadata.capability='View only';warnings.push('This score exceeds supported transposition structure.');}}
 try{const timeline=scoreTimeline(xml);metadata.playbackAvailable=!doc.querySelector('transpose,unpitched')&&timeline.notes.length>0;}catch{warnings.push('Playback unavailable for this structure.');}
 try{const osmd=new opensheetmusicdisplay.OpenSheetMusicDisplay(host,{backend:'svg',autoResize:false,drawTitle:false,newSystemFromXML:false,newPageFromXML:false});await osmd.load(xml);osmd.Zoom=.65;osmd.render();if(!host.querySelector('svg')||!osmd.GraphicSheet.MusicPages.length)throw Error();}catch{fail('Needs review: this score could not be rendered reliably. Nothing was imported.');}
 return {metadata,file:new Blob([bytes],{type:type==='mxl'?'application/vnd.recordare.musicxml': 'application/vnd.recordare.musicxml+xml'}),xml};
}
