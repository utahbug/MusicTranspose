"""Batch 1 source/record preservation and targeted extraction; no catalog rebuild."""
import json,sys,subprocess,tempfile,shutil,zipfile,xml.etree.ElementTree as E
from pathlib import Path
root=Path(__file__).resolve().parents[1]
baseline='3383910a1814a7a6399436ff45bc43165cf734c5'
old=json.loads(subprocess.check_output(['git','show',baseline+':assets/lyrics.json'],cwd=root))
new=json.loads((root/'assets/lyrics.json').read_text(encoding='utf8'))
selected=['hhc-1021','hhc-1022','hhc-1023','hhc-1026','hhc-1027'];spelling='song-a13c43da-0243-4019-ad08-d7be530074f5';authorized=set(selected+[spelling])
assert [r['id'] for r in old['songs'] if any(x['label']=='Shared ending' for x in r['refrains'])][:5]==selected
before={r['id']:r for r in old['songs']};after={r['id']:r for r in new['songs']}
assert [r for r in new['songs'] if r['id'] not in authorized]==[r for r in old['songs'] if r['id'] not in authorized]
expected=json.loads(json.dumps(before[spelling]));expected['verses'][0]['text']=expected['verses'][0]['text'].replace('latterday','latter-day');assert after[spelling]==expected
for id,count in zip(selected,[2,3,4,3,3]):
 r=after[id];assert len(r['verses'])==count and r['available']
 assert r['verses']==[v for v in before[id]['verses'] if v['sourcePart']=='P1']
 assert all(x['label']=='Chorus' for x in r['refrains'])
 assert r['refrains'][-1]['text']==before[id]['refrains'][0]['text']
 assert all(v['number']==str(i+1) for i,v in enumerate(r['verses']))
assert after['hhc-1021']['refrains'][0]['verses']==['1'];assert after['hhc-1021']['refrains'][1]['verses']==['2']
assert after['hhc-1021']['refrains'][0]['text']+' I know that my Savior loves me.'==after['hhc-1021']['refrains'][1]['text']
assert after['hhc-1022']['alternateLyrics']==[{'part':'P2','voice':'1','number':'2','label':'Alternate chorus','text':'footstep,'}]
assert sum(any(x['label']=='Shared ending' for x in r['refrains']) for r in new['songs'])==80
# Source evidence: named Chorus streams and unchanged original score bytes.
for id in authorized:
 r=after[id];path=root/r['source'];assert path.read_bytes()==subprocess.check_output(['git','show',baseline+':'+r['source'].removeprefix('./')],cwd=root)
 with zipfile.ZipFile(path) as z:xml=E.fromstring(z.read(E.fromstring(z.read('META-INF/container.xml')).find('.//{*}rootfile').get('full-path')))
 if id in selected:assert xml.findall(".//lyric[@name='chorus']")
 if id=='hhc-1022':
  events=[]
  for part in xml.findall('part'):
   divisions=1
   for m in part.findall('measure'):
    divisions=int(m.findtext('attributes/divisions',str(divisions)));at=0;last=0
    for n in m:
     if n.tag=='backup':at-=int(n.findtext('duration'));continue
     if n.tag=='forward':at+=int(n.findtext('duration'));continue
     if n.tag!='note':continue
     onset=last if n.find('chord') is not None else at
     if m.get('number')=='19':
      for l in n.findall('lyric'):
       if l.get('name')=='chorus':events.append((part.get('id'),onset/divisions,l.findtext('text')))
     if n.find('chord') is None:last=at;at+=int(n.findtext('duration','0'))
  assert events==[('P1',0,'foot'),('P1',1,'step,'),('P1',3,'We'),('P2',0,'foot'),('P2',2,'step,')]
 if id=='hhc-1021':
  assert xml.find("part[@id='P1']/measure[@number='49']/barline/ending[@type='start']").get('number')=='1'
  assert xml.find("part[@id='P1']/measure[@number='50']/barline/ending[@type='start']").get('number')=='2'
with tempfile.TemporaryDirectory() as folder:
 work=Path(folder);(work/'assets/scores').mkdir(parents=True)
 (work/'assets/lyrics.json').write_text(json.dumps(new),encoding='utf8')
 catalog=[dict(id=id,title=after[id]['title'],collection=after[id]['collection'],page=after[id]['number'],asset=after[id]['source']) for id in selected+[spelling]]
 for song in catalog:shutil.copyfile(root/song['asset'],work/song['asset'])
 (work/'catalog.json').write_text(json.dumps(catalog),encoding='utf8')
 subprocess.run([sys.executable,str(root/'tools/extract-lyrics.py'),'catalog.json',*selected,spelling],cwd=work,check=True)
 extracted={r['id']:r for r in json.loads((work/'assets/lyrics.json').read_text(encoding='utf8'))['songs']}
 for id in selected:assert extracted[id]==after[id],id
 # Only spelling was published for #2; its older section metadata is out of scope.
 assert extracted[spelling]['verses']==after[spelling]['verses']
 assert extracted[spelling]['refrains'][0]['text']==after[spelling]['refrains'][0]['text']
print('PASS exactly five audited records; source timings/endings; six-record scope; words preserved; five records and hymn 2 spelling reproducible; 80 Shared ending records remain')
