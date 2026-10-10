"""Reflow only the two verified Nativity source regions; preserve vector artwork at 100%."""
from pathlib import Path
from copy import deepcopy
import hashlib
from pypdf import PdfReader, PdfWriter, Transformation
from pypdf.generic import RectangleObject
root=Path(__file__).resolve().parents[1]
source=root/'assets/pdfs/fallback/nativity.pdf'
assert hashlib.sha256(source.read_bytes()).hexdigest() == '71b28f9ee4242d8ddc431b954f1effb4c333665e584aff86dd4eece9ac79e9f7'
r=PdfReader(source);assert len(r.pages)==2
w=PdfWriter();page=w.add_blank_page(595.28,841.89)
# Top-origin points in the letter-size source. Both rectangles include all ink.
# Keeping page 2 together preserves long final stems and the adjacent verses/credits.
for number,top,bottom,destination in [(0,25,327,24),(1,85,556,334)]:
    part=deepcopy(r.pages[number])
    part.cropbox=RectangleObject([60,792-bottom,552,792-top]);part.trimbox=part.cropbox
    page.merge_transformed_page(part,Transformation().translate((595.28-612)/2,841.89-792+top-destination))
w.add_metadata({'/Title':'The Nativity Song - Performance layout','/Subject':'Original notation and supplementary material reflowed at original size; no musical changes.'})
output=root/'assets/pdfs/performance/nativity.pdf'
output.parent.mkdir(parents=True,exist_ok=True)
w.write(output)
print(output)
