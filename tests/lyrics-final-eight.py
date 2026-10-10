"""Final eight audit: six targeted corrections, two unchanged complex records."""
import json,re,sys,subprocess,tempfile,shutil,zipfile,xml.etree.ElementTree as E
from pathlib import Path
root=Path(__file__).resolve().parents[1];baseline='a87a6ca3c3d6d3ea6f193b650f8968fd2f49776b'
old=json.loads(subprocess.check_output(['git','show',baseline+':assets/lyrics.json'],cwd=root));new=json.loads((root/'assets/lyrics.json').read_text(encoding='utf8'));before={r['id']:r for r in old['songs']};after={r['id']:r for r in new['songs']}
items=[r for r in old['songs'] if any(c['label']=='Shared ending' for c in r['refrains'])]
assert [(r['number'],r['title']) for r in items]==[('1053','My Covenants'),('2','The Spirit of God'),('209','Hark! The Herald Angels Sing'),('230','Scatter Sunshine'),('9','Can a Little Child like Me?'),('178','Teacher, Do You Love Me?'),('182','How Will They Know?'),('263','We Are Different')]
corrected=[r['id'] for r in items if r['number'] not in ['178','182']]
assert [r for r in old['songs'] if r['id'] not in corrected]==[r for r in new['songs'] if r['id'] not in corrected]
s=(root/'tools/extract-lyrics.py').read_text(encoding='utf8');ns={'re':re};exec(s[s.index('def clean'):s.index('records=[]')],ns);stitch=ns['stitch']
for oldr in items:
 r=after[oldr['id']];number=r['number'];path=root/r['source'];assert path.read_bytes()==subprocess.check_output(['git','show',baseline+':'+r['source'].removeprefix('./')],cwd=root)
 with zipfile.ZipFile(path) as z:x=E.fromstring(z.read(E.fromstring(z.read('META-INF/container.xml')).find('.//{*}rootfile').get('full-path')))
 def text(part='P1',bars=None,row='1',name=None):return stitch([l for m in x.find("part[@id='"+part+"']").findall('measure') if bars is None or m.get('number') in bars for n in m.findall('note') for l in n.findall('lyric') if l.get('number')==row and (name is None or l.get('name')==name)])
 if number in ['178','182']:
  assert r==oldr and r['available']==False
  directions=[w.text for w in x.findall('.//direction-type/words')]
  if number=='178':assert all(t in directions for t in ['(Child)','(Teacher)','First time child only, second time duet','D.S. al Coda',' Coda'])
  else:assert '(Optional descant 2nd verse only)' in directions and all(t in directions for t in ['Sop 2','Sop 1','Alto']);assert any(l.get('number')=='6' for l in x.findall("part[@id='P1']/measure/note/lyric"))
  continue
 assert r['available'] and not r['notes'] and not any(c['label']=='Shared ending' for c in r['refrains'])
 count={'1053':2,'2':4,'209':2,'230':3,'9':2,'263':3}[number];assert [v['number'] for v in r['verses']]==list(map(str,range(1,count+1)))
 if number in ['209','9','263']:
  assert not r['refrains'];ending=oldr['refrains'][0]['text'];assert r['commonEndingSource']==oldr['refrains'][0]
  assert [v['text'] for v in r['verses']]==[v['text']+' '+ending for v in oldr['verses']];assert r['verses'][0]['text']==text()
  for v in r['verses'][1:]:assert v['text']==text(row=v['number'])+' '+ending
  assert not x.findall('.//barline/repeat') and not x.findall('.//barline/ending')
 elif number=='2':
  assert r['verses']==oldr['verses'] and len(r['refrains'])==1 and r['refrains'][0]['label']=='Chorus';assert r['refrains'][0]['text']==text(name='chorus')==oldr['refrains'][0]['text'];assert 'latter-day' in r['verses'][0]['text']
 elif number=='1053':
  for v in r['verses']:assert v['text']==text(row=v['number'],name='verse')
  main,tag,option=r['refrains'];assert main['verses']==['1','2']
  assert main['text']==text(bars=list(map(str,range(11,20))),name='chorus')
  assert main['principalText']==text(name='chorus');assert text(bars=['19'])==text(bars=['20'])=='day.'
  assert tag['text']==text(bars=['21','22','23','24']);assert option['text']==text(row='2',name='chorus')==r['alternateLyrics'][0]['text']
  assert '*Alternate text for baptism day.' in r['sourceTextBlocks']
  assert not 'day. day.' in main['text']
 else:
  assert r['verses']==[v for v in oldr['verses'] if v['sourcePart']=='P1'];main,lower,instruction=r['refrains'];assert main['verses']==['1','2','3']
  core=[f'X{n}' for n in range(17,23)];first=['X23','X24'];second=['X25','X26']
  assert main['text']==text(bars=core+first)+'\n'+text(bars=core+second)
  assert main['principalText']==oldr['refrains'][0]['text']==text(name='chorus')
  assert lower['text']==text('P2',core+first,'2')+'\n'+text('P2',core+second,'2')
  assert lower['sourceText']==r['alternateLyrics'][0]['text']==next(v['text'] for v in oldr['verses'] if v['sourcePart']=='P2')
  assert 'not sung' in instruction['label'] and 'twice' in instruction['text']
assert sum(any(c['label']=='Shared ending' for c in r['refrains']) for r in new['songs'])==2
with tempfile.TemporaryDirectory() as folder:
 work=Path(folder);(work/'assets/scores').mkdir(parents=True);(work/'assets/lyrics.json').write_text(json.dumps(new),encoding='utf8');catalog=[dict(id=id,title=after[id]['title'],collection=after[id]['collection'],page=after[id]['number'],asset=after[id]['source']) for id in corrected]
 for song in catalog:shutil.copyfile(root/song['asset'],work/song['asset'])
 (work/'catalog.json').write_text(json.dumps(catalog),encoding='utf8');subprocess.run([sys.executable,str(root/'tools/extract-lyrics.py'),'catalog.json',*corrected],cwd=work,check=True);assert json.loads((work/'assets/lyrics.json').read_text(encoding='utf8'))==new
print('PASS eight identities/source audits; six corrections; exact verses, common endings, repeat paths, tag/optional opening and lower streams; deferred/all other records unchanged; targeted replay; 2 remain')
