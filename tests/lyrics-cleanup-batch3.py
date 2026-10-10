import sys,json,subprocess,tempfile,shutil,zipfile,xml.etree.ElementTree as E
from pathlib import Path
root=Path(__file__).resolve().parents[1];baseline='fabafef063550889334fdec63a7f161673bdce59'
old=json.loads(subprocess.check_output(['git','show',baseline+':assets/lyrics.json'],cwd=root));new=json.loads((root/'assets/lyrics.json').read_text(encoding='utf8'))
selected=['hhc-1052','hhc-1053','hhc-1054','hhc-1055','hhc-1064'];corrected=[id for id in selected if id!='hhc-1053']
assert [r['id'] for r in old['songs'] if any(x['label']=='Shared ending' for x in r['refrains'])][:5]==selected
before={r['id']:r for r in old['songs']};after={r['id']:r for r in new['songs']}
assert [r for r in new['songs'] if r['id'] not in corrected]==[r for r in old['songs'] if r['id'] not in corrected]
for id,count,bounds in zip(selected,[3,2,2,3,3],[('21','40'),('11','24'),('X2','17'),('11','18'),('17','32')]):
 r=after[id];path=root/r['source'];assert path.read_bytes()==subprocess.check_output(['git','show',baseline+':'+r['source'].removeprefix('./')],cwd=root)
 with zipfile.ZipFile(path) as z:xml=E.fromstring(z.read(E.fromstring(z.read('META-INF/container.xml')).find('.//{*}rootfile').get('full-path')))
 verses=set();streams={}
 for p in xml.findall('part'):
  for m in p.findall('measure'):
   for n in m.findall('note'):
    for l in n.findall('lyric'):
     if not l.findall('text'):continue
     if l.get('name')=='verse':verses.add(l.get('number'))
     else:
      assert l.get('name')=='chorus';streams.setdefault((p.get('id'),n.findtext('voice','1'),l.get('number')),[]).append((m.get('number'),l))
 assert verses==set(map(str,range(1,count+1)))
 principal=streams[('P1','1','1')];assert (principal[0][0],principal[-1][0])==bounds
 if id=='hhc-1053':
  assert r==before[id]
  assert set(streams)=={('P1','1','1'),('P1','1','2')}
  assert any('Alternate text for baptism day' in ''.join(c.itertext()) for c in xml.findall('credit'))
  assert {bar for bar,l in streams[('P1','1','2')]}=={'11','12','13'}
  part=xml.find("part[@id='P1']")
  for bar,num in [('19','1'),('20','2')]:
   assert part.find("measure[@number='"+bar+"']/barline/ending[@type='start']").get('number')==num
   assert [l.findtext('text') for m,l in principal if m==bar]==['day.']
  assert {bar for bar,l in principal if bar in ('21','22','23','24')}=={'21','22','23','24'}
 else:
  assert len(streams)==1 and r['available'] and not r['alternateLyrics']
  assert r['verses']==before[id]['verses'] and len(r['verses'])==count
  assert len(r['refrains'])==1 and r['refrains'][0]['label']=='Chorus'
  assert r['refrains'][0]['text']==before[id]['refrains'][0]['text']
assert sum(any(x['label']=='Shared ending' for x in r['refrains']) for r in new['songs'])==71
with tempfile.TemporaryDirectory() as folder:
 work=Path(folder);(work/'assets/scores').mkdir(parents=True);(work/'assets/lyrics.json').write_text(json.dumps(new),encoding='utf8')
 catalog=[dict(id=id,title=after[id]['title'],collection=after[id]['collection'],page=after[id]['number'],asset=after[id]['source']) for id in corrected]
 for song in catalog:shutil.copyfile(root/song['asset'],work/song['asset'])
 (work/'catalog.json').write_text(json.dumps(catalog),encoding='utf8');subprocess.run([sys.executable,str(root/'tools/extract-lyrics.py'),'catalog.json',*corrected],cwd=work,check=True)
 assert json.loads((work/'assets/lyrics.json').read_text(encoding='utf8'))==new
print('PASS exactly five audited, four source-verified corrections, #1053 optional-text/endings blocker unchanged, all other records preserved, exact targeted replay; 71 remaining')
