from pathlib import Path
import subprocess
from collections import Counter
import pdfplumber,pypdfium2 as pdf,numpy as np
from pypdf import PdfReader
source=Path('assets/pdfs/fallback/nativity.pdf');dest=Path('assets/pdfs/performance/nativity.pdf')
assert source.read_bytes()==subprocess.check_output(['git','show','6058b5a:assets/pdfs/fallback/nativity.pdf'])
assert len(PdfReader(source).pages)==2 and len(PdfReader(dest).pages)==1
with pdfplumber.open(source) as a,pdfplumber.open(dest) as b:
 signature=lambda pages:Counter((c['text'],round(c['size'],3)) for p in pages for c in p.chars)
 assert signature(a.pages)==signature(b.pages),'All original glyphs and font sizes must survive'
for i,top,bottom in [(0,25,327),(1,85,556)]:
 im=np.array(pdf.PdfDocument(source)[i].render(scale=2).to_pil().convert('L'));ys,xs=np.where(im<250)
 assert xs.min()>=120 and xs.max()<1104 and ys.min()>=top*2 and ys.max()<bottom*2,(i,xs.min(),xs.max(),ys.min(),ys.max())
print('PASS two source pages to one, unchanged original bytes, exact original glyph/font-size multiset, every source ink pixel inside retained regions')
