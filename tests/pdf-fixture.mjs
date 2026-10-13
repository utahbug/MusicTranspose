// Original synthetic pages for pagination tests; no withdrawn music is redistributed.
export function testPdf(pageCount=5){
 const objects=['<< /Type /Catalog /Pages 2 0 R >>',''];
 const kids=[];
 for(let i=0;i<pageCount;i++){
  const page=objects.length+1,stream=page+1;kids.push(page+' 0 R');
  objects.push(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << >> /Contents ${stream} 0 R >>`);
  const content=`0 0 0 RG 1 w 20 20 572 752 re S 40 ${700-i*30} m 570 ${700-i*30} l S\n`;
  objects.push(`<< /Length ${content.length} >>\nstream\n${content}endstream`);
 }
 objects[1]=`<< /Type /Pages /Count ${pageCount} /Kids [${kids.join(' ')}] >>`;
 let pdf='%PDF-1.4\n';const offsets=[0];objects.forEach((object,i)=>{offsets.push(pdf.length);pdf+=`${i+1} 0 obj\n${object}\nendobj\n`;});const xref=pdf.length;
 pdf+=`xref\n0 ${offsets.length}\n0000000000 65535 f \n`+offsets.slice(1).map(n=>String(n).padStart(10,'0')+' 00000 n \n').join('')+`trailer\n<< /Size ${offsets.length} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`;
 return Buffer.from(pdf);
}
export async function preparePdfFixture(page,base){
 await page.route('**/__test-five-pages.pdf',route=>route.fulfill({contentType:'application/pdf',body:testPdf()}));
 await page.evaluate(async base=>{const {songs}=await import('./catalog.js');if(!songs.some(s=>s.id==='test-five-pages'))songs.push({id:'test-five-pages',title:'Synthetic pagination fixture',collection:'Test only',scoreType:'pdf',transpositionAvailable:false,asset:base+'__test-five-pages.pdf'});},base);
}
