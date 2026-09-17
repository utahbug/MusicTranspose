// The same score container, document scrolling and print-pages output serve both score types.
const documents=new Map();
export async function renderPdf(asset,host,title){
 pdfjsLib.GlobalWorkerOptions.workerSrc=new URL('./vendor/pdf.worker.min.js',import.meta.url).href;
 if(!documents.has(asset)){const job=pdfjsLib.getDocument({url:asset,isEvalSupported:false}).promise;documents.set(asset,job);job.catch(()=>documents.delete(asset));}
 const doc=await documents.get(asset);host.replaceChildren();
 for(let n=1;n<=doc.numPages;n++){
  const page=await doc.getPage(n),base=page.getViewport({scale:1}),viewport=page.getViewport({scale:1800/base.width});
  const canvas=document.createElement('canvas');canvas.width=Math.ceil(viewport.width);canvas.height=Math.ceil(viewport.height);canvas.className='pdf-page';canvas.setAttribute('role','img');canvas.setAttribute('aria-label',`${title}, page ${n} of ${doc.numPages}`);host.append(canvas);
  await page.render({canvasContext:canvas.getContext('2d'),viewport}).promise;
 }
 return doc.numPages;
}
export function preparePdfPrint(host,pages){
 pages.replaceChildren();for(const canvas of host.querySelectorAll('canvas.pdf-page')){const section=document.createElement('section');section.className='print-page pdf-print-page';const image=document.createElement('img');image.src=canvas.toDataURL('image/png');image.alt=canvas.getAttribute('aria-label');section.append(image);pages.append(section);}document.body.classList.add('prepared-print');return pages.children.length;
}
