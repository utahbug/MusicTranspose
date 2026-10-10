"""Four held records: exact identities, source structure, preservation and replay."""
import sys,json,re,subprocess,tempfile,shutil,zipfile,xml.etree.ElementTree as E
from pathlib import Path
root=Path(__file__).resolve().parents[1];manifest=json.loads((root/'reports/lyrics-held.json').read_text(encoding='utf8'));baseline=manifest['startingCommit'];items=manifest['groups'][0]['songs'];ids=[s['id'] for s in items]
expected=[('334','I Need Thee Every Hour','Hymns (1985)',4),('336','School Thy Feelings','Hymns (1985)',5),('38','When Joseph Went to Bethlehem','Children’s Songbook',3),('76','This Is My Beloved Son','Children’s Songbook',4)]
old=json.loads(subprocess.check_output(['git','show',baseline+':assets/lyrics.json'],cwd=root));new=json.loads((root/'assets/lyrics.json').read_text(encoding='utf8'));before={r['id']:r for r in old['songs']};after={r['id']:r for r in new['songs']}
assert [r for r in old['songs'] if r['id'] not in ids]==[r for r in new['songs'] if r['id'] not in ids], 'Other songs changed'
source=(root/'tools/extract-lyrics.py').read_text(encoding='utf8');ns={'re':re};exec(source[source.index('def clean'):source.index('records=[]')],ns);stitch=ns['stitch']
for item,(number,title,collection,count) in zip(items,expected):
 id=item['id'];r=after[id];assert (r['number'],r['title'],r['collection'])==(number,title,collection);assert len(r['verses'])==count and [v['number'] for v in r['verses']]==list(map(str,range(1,count+1)))
 assert r['available'] and not r['notes'] and not r['alternateLyrics'];assert not any(c['label']=='Shared ending' for c in r['refrains'])
 path=root/r['source'];assert path.read_bytes()==subprocess.check_output(['git','show',baseline+':'+r['source'].removeprefix('./')],cwd=root)
 with zipfile.ZipFile(path) as z:xml=E.fromstring(z.read(E.fromstring(z.read('META-INF/container.xml')).find('.//{*}rootfile').get('full-path')))
 assert title in [c.text for c in xml.findall('.//credit-words')]
 assert {(p.get('id'),n.findtext('voice','1')) for p in xml.findall('part') for n in p.findall('measure/note') if any(l.findall('text') for l in n.findall('lyric'))}=={('P1','1')}
 part=xml.find("part[@id='P1']")
 if number=='38':
  assert r['verses'][:2]==before[id]['verses'] and r['verses'][2]['text']==before[id]['refrains'][0]['text'] and not r['refrains']
  bars=part.findall('measure');i=next(i for i,m in enumerate(bars) if m.get('number')=='X17');assert bars[i].find('note/lyric/text').text=='3.';assert part.find("measure[@number='X16']/barline/repeat[@direction='backward']") is not None
  assert r['verses'][0]['text']==stitch([l for m in bars[:i] for l in m.findall("note/lyric[@number='1']")]);assert r['verses'][1]['text']==stitch(part.findall("measure/note/lyric[@number='2']"));assert r['verses'][2]['text']==stitch([l for m in bars[i:] for l in m.findall("note/lyric[@number='1']")])
 else:
  assert r['verses']==before[id]['verses']
  for v in r['verses']:
   if v['kind']=='numbered-text-block':assert v['text'] in [ns['clean']((c.text or '').split('. ',1)[1]) for c in xml.findall('.//credit-words') if (c.text or '').startswith(v['number']+'. ')]
   else:assert v['text']==stitch(part.findall("measure/note/lyric[@name='verse'][@number='"+v['number']+"']"))
  assert len(r['refrains'])==1 and r['refrains'][0]['label']=='Chorus';chorus=r['refrains'][0];literal=stitch(part.findall("measure/note/lyric[@name='chorus']"));assert literal==before[id]['refrains'][0]['text']
  if number=='76':
   for start,label in [('X8','1, 2, 3'),('X13','4')]:assert part.find("measure[@number='"+start+"']/barline/ending[@type='start']").get('number')==label
   assert part.find("measure[@number='X12']/barline/repeat[@direction='backward']") is not None
   paths=[stitch([l for m in part.findall('measure') if m.get('number') in bars for l in m.findall("note/lyric[@name='chorus']")]) for bars in [['X8','X9','X10','X11','X12'],['X13','X14','X15','X16']]]
   assert paths==[chorus['text']]*2 and chorus['principalText']==literal and literal==' '.join(paths)
  else:assert chorus['text']==literal
assert sum(any(c['label']=='Shared ending' for c in r['refrains']) for r in new['songs'])==14
with tempfile.TemporaryDirectory() as folder:
 work=Path(folder);(work/'assets/scores').mkdir(parents=True);(work/'assets/lyrics.json').write_text(json.dumps(new),encoding='utf8');catalog=[dict(id=id,title=after[id]['title'],collection=after[id]['collection'],page=after[id]['number'],asset=after[id]['source']) for id in ids]
 for song in catalog:shutil.copyfile(root/song['asset'],work/song['asset'])
 (work/'catalog.json').write_text(json.dumps(catalog),encoding='utf8');subprocess.run([sys.executable,str(root/'tools/extract-lyrics.py'),'catalog.json',*ids],cwd=work,check=True);assert json.loads((work/'assets/lyrics.json').read_text(encoding='utf8'))==new
print('PASS four identities, exact source words/punctuation, third-verse boundary, both alternate endings, protected records/source files, targeted replay; 14 remaining')
