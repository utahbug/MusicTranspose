// The same score container, document scrolling and print-pages output serve both score types.
const documents=new Map();
const analysisCanvas=document.createElement('canvas');
const bounds=new WeakMap(),trimKey='music-transpose-pdf-trim-v1';
let trim=true;try{trim=sessionStorage.getItem(trimKey)!=='false';}catch{}
const trimControl=document.getElementById('pdf-trim');trimControl.checked=trim;
// Include every non-white pixel, even faint antialiasing, and retain generous padding.
function contentBounds(canvas){
 const w=canvas.width,h=canvas.height;analysisCanvas.width=w;analysisCanvas.height=h;const ctx=analysisCanvas.getContext('2d',{willReadFrequently:true});ctx.drawImage(canvas,0,0);const data=ctx.getImageData(0,0,w,h).data;
 let left=w,top=h,right=-1,bottom=-1;
 for(let y=0;y<h;y++)for(let x=0;x<w;x++){const i=(y*w+x)*4;if(data[i+3]&&(data[i]<255||data[i+1]<255||data[i+2]<255)){left=Math.min(left,x);right=Math.max(right,x);top=Math.min(top,y);bottom=Math.max(bottom,y);}}
 if(right<0)return {left:0,top:0,right:w,bottom:h};
 const safety=Math.ceil(w*.015); // 27 raster pixels at 1800px, about 9pt on letter paper.
 return {left:Math.max(0,Math.min(left-safety,Math.floor(w*.15))),top:Math.max(0,Math.min(top-safety,Math.floor(h*.15))),right:Math.min(w,Math.max(right+1+safety,Math.ceil(w*.85))),bottom:Math.min(h,Math.max(bottom+1+safety,Math.ceil(h*.85)))};
}
function displayBounds(canvas){
 const b=trim?bounds.get(canvas):{left:0,top:0,right:canvas.width,bottom:canvas.height};if(!b)return;
 const w=b.right-b.left,h=b.bottom-b.top,frame=canvas.parentElement;
 frame.dataset.trim=JSON.stringify(b);frame.style.aspectRatio=`${w} / ${h}`;
 canvas.style.width=(canvas.width/w*100)+'%';canvas.style.left=(-b.left/w*100)+'%';canvas.style.top=(-b.top/h*100)+'%';
}
trimControl.onchange=()=>{trim=trimControl.checked;try{sessionStorage.setItem(trimKey,String(trim));}catch{}document.querySelectorAll('#score canvas.pdf-page').forEach(displayBounds);};
export async function renderPdf(asset,host,title){
 pdfjsLib.GlobalWorkerOptions.workerSrc=new URL('./vendor/pdf.worker.min.js',import.meta.url).href;
 if(!documents.has(asset)){const job=pdfjsLib.getDocument({url:asset,isEvalSupported:false}).promise;documents.set(asset,job);job.catch(()=>documents.delete(asset));}
 const doc=await documents.get(asset);host.replaceChildren();
 for(let n=1;n<=doc.numPages;n++){
  const page=await doc.getPage(n),base=page.getViewport({scale:1}),viewport=page.getViewport({scale:1800/base.width});
  const canvas=document.createElement('canvas');canvas.width=Math.ceil(viewport.width);canvas.height=Math.ceil(viewport.height);canvas.className='pdf-page';canvas.setAttribute('role','img');canvas.setAttribute('aria-label',`${title}, page ${n} of ${doc.numPages}`);const frame=document.createElement('div');frame.className='pdf-page-frame';frame.style.aspectRatio=`${canvas.width} / ${canvas.height}`;frame.append(canvas);host.append(frame);
  await page.render({canvasContext:canvas.getContext('2d'),viewport}).promise;
  bounds.set(canvas,contentBounds(canvas));displayBounds(canvas);
 }
 return doc.numPages;
}
export function preparePdfPrint(host,pages){
 pages.replaceChildren();for(const canvas of host.querySelectorAll('canvas.pdf-page')){const section=document.createElement('section');section.className='print-page pdf-print-page';const image=document.createElement('img');image.src=canvas.toDataURL('image/png');image.alt=canvas.getAttribute('aria-label');section.append(image);pages.append(section);}document.body.classList.add('prepared-print');return pages.children.length;
}
