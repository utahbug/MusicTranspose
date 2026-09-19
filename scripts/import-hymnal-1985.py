"""Copy only archived Hymnal assets; preserve published IDs and bytes. Run from repo."""
import csv,json,hashlib,shutil,zipfile,sys,subprocess,xml.etree.ElementTree as E
from pathlib import Path
from song_identity import existing_score_ids,resolve_song_id
root=Path.cwd();mxl=Path('D:/LDS_Music_MXL/2026-09-16');pdf=Path('D:/LDS_Music_PDFs/2026-09-16')
children='--children' in sys.argv
stem='childrens-songbook' if children else 'hymnal-1985'
collection='Children’s Songbook' if children else 'Hymns (1985)'
source_collection="Children's Songbook" if children else '1985 English Hymnal'
edition='English archive 2026-09-16' if children else '1985 English'
number_key=str if children else int
before_file='childrens-before' if children else 'hymnal-before'
def read(p):return list(csv.DictReader(p.open(encoding='utf-8-sig')))
rows={number_key(r['official_number_page']):r for r in read(mxl/'reports/mxl-download-manifest.csv') if r['collection']==source_collection}
missing={number_key(r['official_number_page']):r for r in read(mxl/'reports/mxl-missing-entries.csv') if r['collection']==source_collection}
pdfs={number_key(r['official_number_page']):r for r in read(pdf/'reports/pdf-download-manifest.csv') if (('Children' in r['collection']) if children else r['collection']=='Hymns of The Church of Jesus Christ of Latter-day Saints') and r['variant_type']=='Standard'}
# Full current catalog is exported by Node, avoiding parsing JavaScript as source data.
old=json.loads((root/('test-results/'+before_file+'.json')).read_text(encoding='utf-8'))
known=existing_score_ids(root)
for s in old:known[hashlib.sha256((root/s['asset']).read_bytes()).hexdigest()]=s['id']
registry=json.loads((root/'imported-songs.js').read_text(encoding='utf-8').split('export const importedSongs=',1)[1].strip().removesuffix(';'))
by_number={number_key(s['page']):s for s in old if s['collection']==collection}
for song in old:
 for member in song.get('collectionMemberships',[]):
  if member.get('collection')==collection:by_number.setdefault(number_key(member.get('songNumber') or member.get('page')),song)
matrix=[]
expected=sorted(set(rows)|set(missing)|set(pdfs),key=lambda n:(int(''.join(c for c in str(n) if c.isdigit())),str(n))) if children else list(range(1,342))
for number in expected:
 r=rows.get(number) or missing.get(number);p=pdfs.get(number);assert r or p,number
 title=(r or p)['official_title'];prior=by_number.get(number)
 item={'number':number,'title':title,'beforeId':prior['id'] if prior else '', 'id':'','mxlPresent':number in rows,'pdfPresent':bool(p and Path(p['local_full_path']).exists()),'pdfUsable':bool(p and 'NOTICE' not in p['content_status'] and Path(p['local_full_path']).exists()),'sourcePdf':p['local_full_path'] if p else '', 'notes':[]}
 matrix.append(item)
 if number not in rows:
  item.update(state='C',selectedFormat='none',notes=['No native MXL; archived PDF is a licensing notice, not a score.']);continue
 path=Path(r['local_full_path']);raw=path.read_bytes();sha=hashlib.sha256(raw).hexdigest();assert sha==r['sha256']
 with zipfile.ZipFile(path) as z:
  assert z.testzip() is None
  file=next(e.attrib['full-path'] for e in E.fromstring(z.read('META-INF/container.xml')).iter() if e.tag.endswith('rootfile'))
  doc=E.fromstring(z.read(file));assert doc.tag=='score-partwise' and doc.findall('.//note')
 id=prior['id'] if prior else resolve_song_id(sha,known)
 dest=prior['asset'] if prior else './assets/scores/'+id+'.mxl'
 if not prior and not any(s['id']==id for s in registry):
  shutil.copyfile(path,root/dest)
  registry.append({'id':id,'title':title,'collection':collection,'edition':edition,'page':str(number),'songNumber':str(number),'asset':dest,'tags':[],'aliases':[],'collectionMemberships':[{'collection':collection,'edition':edition,'songNumber':str(number),'page':str(number),'title':title}],'sourceIdentity':{'sha256':sha,'archiveFilename':path.name},'transpositionAvailable':False,'playbackAvailable':False,'capability':'View only'})
 if prior and hashlib.sha256((root/dest).read_bytes()).hexdigest()!=sha:item['notes'].append('Existing tested asset differs from archive; preserved.')
 item.update(id=id,sourceMxl=str(path),sha256=sha,asset=dest,selectedFormat='mxl',state='F' if children and prior else 'A',sourceTitle=doc.findtext('./work/work-title') or doc.findtext('./movement-title') or '',keyDeclarations=sorted(set((k.findtext('fifths',''),k.findtext('mode','major')) for k in doc.findall('.//attributes/key'))),lyricElements=len(doc.findall('.//lyric')))
(root/'imported-songs.js').write_text('// Bundled archive metadata; IDs are immutable. See import reports and scripts.\nexport const importedSongs='+json.dumps(registry,ensure_ascii=False,indent=2)+';\n',encoding='utf-8')
(root/('reports/'+stem+'-inventory.json')).write_text(json.dumps({'startingCommit':subprocess.check_output(['git','rev-parse','HEAD'],text=True).strip(),'before':list(by_number.values()),'expected':len(expected),'rows':matrix},ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
print('Included',sum(r['state'] in ('A','F') for r in matrix),'missing',[(r['number'],r['title']) for r in matrix if r['state'] not in ('A','F')])
