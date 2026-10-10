"""Next five Lyrics records: source evidence, exact scope and extraction replay."""
import json,re,sys,subprocess,tempfile,shutil,zipfile,xml.etree.ElementTree as E
from pathlib import Path
root=Path(__file__).resolve().parents[1];baseline='2628b9299bcb55d5215c7930d6eb66d23ab49eec'
old=json.loads(subprocess.check_output(['git','show',baseline+':assets/lyrics.json'],cwd=root));new=json.loads((root/'assets/lyrics.json').read_text(encoding='utf8'))
ids=['hhc-1034','hhc-1035','hhc-1036','hhc-1044','hhc-1045'];previous={'hhc-1021','hhc-1022','hhc-1023','hhc-1026','hhc-1027'}
assert [r['id'] for r in old['songs'] if r['id'] not in previous and any(x['label']=='Shared ending' for x in r['refrains'])][:5]==ids
before={r['id']:r for r in old['songs']};after={r['id']:r for r in new['songs']}
assert [r for r in new['songs'] if r['id'] not in ids]==[r for r in old['songs'] if r['id'] not in ids]
assert 'The latter-day glory begins' in next(r for r in new['songs'] if r['title']=='The Spirit of God')['verses'][0]['text']
for id,count,bounds in zip(ids,[3,3,2,3,3],[('11','20'),('11','20'),('10','21'),('8','16'),('9','17')]):
 r=after[id];assert r['available'];assert r['verses']==[v for v in before[id]['verses'] if v['sourcePart']=='P1'];assert [v['number'] for v in r['verses']]==list(map(str,range(1,count+1)))
 assert len(r['refrains'])==1 and r['refrains'][0]['label']=='Chorus'
 if id!='hhc-1045':assert r['refrains'][0]['text']==before[id]['refrains'][0]['text'];assert not r['alternateLyrics']
 path=root/r['source'];assert path.read_bytes()==subprocess.check_output(['git','show',baseline+':'+r['source'].removeprefix('./')],cwd=root)
 with zipfile.ZipFile(path) as z:xml=E.fromstring(z.read(E.fromstring(z.read('META-INF/container.xml')).find('.//{*}rootfile').get('full-path')))
 events=[];verseNumbers=set()
 for part in xml.findall('part'):
  div=1
  for m in part.findall('measure'):
   div=int(m.findtext('attributes/divisions',str(div)));at=last=0
   for n in m:
    if n.tag=='backup':at-=int(n.findtext('duration'));continue
    if n.tag=='forward':at+=int(n.findtext('duration'));continue
    if n.tag!='note':continue
    onset=last if n.find('chord') is not None else at
    for l in n.findall('lyric'):
     if not l.findall('text'):continue
     if l.get('name')=='verse':verseNumbers.add(l.get('number'))
     else:
      assert l.get('name')=='chorus';events.append((part.get('id'),n.findtext('voice','1'),m.get('number'),onset/div,' '.join(t.text or '' for t in l.findall('text'))))
    if n.find('chord') is None:last=at;at+=int(n.findtext('duration','0'))
 assert verseNumbers==set(map(str,range(1,count+1)))
 principal=[e for e in events if e[:2]==('P1','1')];assert (principal[0][2],principal[-1][2])==bounds
 secondary=[e for e in events if e[:2]!=('P1','1')]
 if id!='hhc-1045':assert not secondary
 else:
  assert all(e[:2]==('P2','2') for e in secondary)
  assert secondary[0][2:]==('10',.5,'Oh,') and secondary[7][2:]==('11',2,'Him;')
  assert secondary[8][2:]==('12',.5,'Oh,') and secondary[-1][2:]==('13',2,'world.')
  assert ('P1','1','11',3,'In') in principal and ('P1','1','X3',0,'Our') in principal
  chorus=r['refrains'][0];original=before[id]['refrains'][0]['text'];alternate=next(v['text'] for v in before[id]['verses'] if v['sourcePart']=='P2')
  assert chorus['principalText']==original and r['alternateLyrics'][0]['text']==alternate
  words=lambda text:re.findall(r'[\w’]+',text)
  assert words(re.sub(r'\([^)]*\)','',chorus['text']))==words(original)
  assert words(' '.join(re.findall(r'\(([^)]*)\)',chorus['text'])))==words(alternate)
  assert chorus['text']=='Come in through Him (Oh, come ye in, come in through Him); Into the fold of God (Oh, come ye in, all people of the world). Our Savior, Jesus, is the Way— The Savior of the world.'
assert sum(any(x['label']=='Shared ending' for x in r['refrains']) for r in new['songs'])==75
with tempfile.TemporaryDirectory() as folder:
 work=Path(folder);(work/'assets/scores').mkdir(parents=True);(work/'assets/lyrics.json').write_text(json.dumps(new),encoding='utf8')
 catalog=[dict(id=id,title=after[id]['title'],collection=after[id]['collection'],page=after[id]['number'],asset=after[id]['source']) for id in ids]
 for song in catalog:shutil.copyfile(root/song['asset'],work/song['asset'])
 (work/'catalog.json').write_text(json.dumps(catalog),encoding='utf8')
 subprocess.run([sys.executable,str(root/'tools/extract-lyrics.py'),'catalog.json',*ids],cwd=work,check=True)
 assert json.loads((work/'assets/lyrics.json').read_text(encoding='utf8'))==new
print('PASS five exact selections, source chorus/response timing, principal+secondary word preservation, unrelated records unchanged, exact targeted replay; 75 Shared ending records remain')
