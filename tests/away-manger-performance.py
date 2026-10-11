from pathlib import Path
import subprocess,importlib.util
import pypdfium2 as pdf,numpy as np
from pypdf import PdfReader
spec=importlib.util.spec_from_file_location('layout','scripts/away-manger-performance.py');m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m)
assert m.SOURCE.read_bytes()==subprocess.check_output(['git','show','44223bc:assets/pdfs/fallback/song-d165ef87-2efa-4a0c-a4b1-e07a742ea654.pdf'])
a=pdf.PdfDocument(m.SOURCE);b=pdf.PdfDocument(m.OUTPUT);assert len(a)==len(b)==2
src=[np.array(p.render(scale=2).to_pil().convert('L')) for p in a];dst=[np.array(p.render(scale=2).to_pil().convert('L')) for p in b]
srcmask=[np.zeros(x.shape,dtype=bool) for x in src];dstmask=[np.zeros(x.shape,dtype=bool) for x in dst]
for number,top,bottom,target,destination in m.REGIONS:
 s=src[number][top*2:bottom*2,120:1104];d=dst[target][destination*2:(destination+bottom-top)*2,120:1104]
 assert np.mean(np.abs(s.astype(float)-d.astype(float)))<.2,'Moved region must retain source pixels at 100%'
 srcmask[number][top*2:bottom*2,120:1104]=True;dstmask[target][destination*2:(destination+bottom-top)*2,120:1104]=True
for im,mask in zip(src,srcmask):assert not np.any((im<245)&~mask),'Source ink omitted'
for im,mask in zip(dst,dstmask):assert not np.any((im<245)&~mask),'Unexpected/duplicated destination ink'
print('PASS exact source bytes, two pages, every source ink pixel retained once, original-scale raster regions match')
