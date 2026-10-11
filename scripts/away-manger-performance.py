"""CS #42: four verse systems on page 1, complete optional Chorus on page 2.
Copy original vector regions at 100% scale; no notation is recreated.
"""
from pathlib import Path
from copy import deepcopy
import hashlib
from pypdf import PdfReader, PdfWriter, Transformation
from pypdf.generic import RectangleObject
ROOT=Path(__file__).resolve().parents[1]
SOURCE=ROOT/'assets/pdfs/fallback/song-d165ef87-2efa-4a0c-a4b1-e07a742ea654.pdf'
OUTPUT=ROOT/'assets/pdfs/performance/away-in-a-manger-cs42.pdf'
# Source page, top, bottom, destination page, destination top (Letter points).
REGIONS=[(0,25,340,0,25),(1,85,342,0,355),(1,345,740,1,50)]
def build():
 assert hashlib.sha256(SOURCE.read_bytes()).hexdigest()=='61648064492a00df22ecfc8725951cc7de4e7da00821952ec2bc5d4b212df0ff'
 r=PdfReader(SOURCE);assert len(r.pages)==2
 w=PdfWriter();pages=[w.add_blank_page(612,792) for _ in range(2)]
 for number,top,bottom,target,destination in REGIONS:
  part=deepcopy(r.pages[number]);part.cropbox=RectangleObject([60,792-bottom,552,792-top]);part.trimbox=part.cropbox
  pages[target].merge_transformed_page(part,Transformation().translate(0,top-destination))
 w.add_metadata({'/Title':'Away in a Manger - Children’s Songbook 42 - Performance layout','/Subject':'Original verse notation together; optional Chorus on page 2. Original vector notation at 100% size.'})
 OUTPUT.parent.mkdir(parents=True,exist_ok=True);w.write(OUTPUT);print(OUTPUT)
if __name__=='__main__':build()
