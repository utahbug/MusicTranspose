"""Source fidelity and targeted replay for the reviewed continuation manifest."""
import sys,json,re,subprocess,tempfile,shutil,zipfile,xml.etree.ElementTree as E
from pathlib import Path
root=Path(__file__).resolve().parents[1]
manifest=json.loads((root/'reports/lyrics-continuation.json').read_text(encoding='utf8'))
new=json.loads((root/'assets/lyrics.json').read_text(encoding='utf8'));after={r['id']:r for r in new['songs']}
old=json.loads(subprocess.check_output(['git','show',manifest['startingCommit']+':assets/lyrics.json'],cwd=root));before={r['id']:r for r in old['songs']}
reviewed=[s for g in manifest['groups'] for s in g['songs']];corrected=[s['id'] for s in reviewed if s['status']=='corrected']
assert [r for r in new['songs'] if r['id'] not in corrected]==[r for r in old['songs'] if r['id'] not in corrected], 'Unreviewed records changed'
# Use the established syllable stitcher, but independently select source streams and performed ending paths.
source=(root/'tools/extract-lyrics.py').read_text(encoding='utf8');ns={'re':re};exec(source[source.index('def clean'):source.index('records=[]')],ns);stitch=ns['stitch']
excluded=set(manifest['excludedPreviouslyAudited'])
for group in manifest['groups']:
 baseline=json.loads(subprocess.check_output(['git','show',group['baseline']+':assets/lyrics.json'],cwd=root))
 assert [r['id'] for r in baseline['songs'] if r['id'] not in excluded and any(x['label']=='Shared ending' for x in r['refrains'])][:10]==[s['id'] for s in group['songs']]
 excluded.update(s['id'] for s in group['songs'])
 for item in group['songs']:
  id=item['id'];r=after[id];path=root/r['source']
  assert path.read_bytes()==subprocess.check_output(['git','show',manifest['startingCommit']+':'+r['source'].removeprefix('./')],cwd=root)
  with zipfile.ZipFile(path) as z:xml=E.fromstring(z.read(E.fromstring(z.read('META-INF/container.xml')).find('.//{*}rootfile').get('full-path')))
  if item['status']=='deferred':assert r==before[id];continue
  assert r['available'] and not r['notes'],id
  if r['number']!='105':assert not r['alternateLyrics'],id
  original_verses=[v for v in before[id]['verses'] if r['number']!='105' or v.get('sourcePart')=='P1']
  assert r['verses']==original_verses and len(r['verses'])==item['verseCount'],id
  assert [v['number'] for v in r['verses']]==list(map(str,range(1,item['verseCount']+1)))
  for verse in r['verses']:
   if verse['kind']=='numbered-text-block':
    texts=[ns['clean']((c.text or '').split('. ',1)[1]) for c in xml.findall('.//credit-words') if (c.text or '').startswith(verse['number']+'. ')]
    assert texts==[verse['text']];continue
   nodes=[l for p in xml.findall('part') if p.get('id')==verse['sourcePart'] for n in p.findall('measure/note') if n.findtext('voice','1')==verse['sourceVoice'] for l in n.findall('lyric') if l.get('name')=='verse' and l.get('number')==verse['number']]
   assert stitch(nodes)==verse['text'],id
  chorus=r['refrains'][0];part=xml.find("part[@id='"+chorus['sourcePart']+"']")
  nodes=[(m.get('number'),l) for m in part.findall('measure') for n in m.findall('note') for l in n.findall('lyric') if l.get('name')=='chorus']
  assert stitch([l for _,l in nodes])==before[id]['refrains'][0]['text'],id
  assert all(c['label']=='Chorus' for c in r['refrains'])
  if id in ('hhc-1070','hhc-1209'):
   first,last=('25','26') if id=='hhc-1070' else ('17','18')
   assert part.find("measure[@number='"+first+"']/barline/ending[@type='start']").get('number')=='1, 2'
   assert part.find("measure[@number='"+last+"']/barline/ending[@type='start']").get('number')=='3'
   assert len(r['refrains'])==2 and [c['verses'] for c in r['refrains']]==[['1','2'],['3']]
   assert r['refrains'][0]['text']==stitch([l for m,l in nodes if int(m)<=int(first)])
   assert r['refrains'][1]['text']==stitch([l for m,l in nodes if m!=first])
   assert chorus['principalText']==before[id]['refrains'][0]['text']
   assert all('me. me.' not in c['text'] and 'ia! ia!' not in c['text'] for c in r['refrains'])
  elif r['number']=='105':
   literal=before[id]['refrains'][0]['text'];response=stitch(xml.findall("part[@id='P2']/measure/note/lyric[@name='chorus']"))
   assert response=='Peace, be still, peace, be still.'
   assert len(r['refrains'])==1 and chorus['principalText']==literal
   assert chorus['text']==literal.replace('Peace, be still. Whether','Peace, be still (Peace, be still, peace, be still). Whether',1)
   assert len(r['alternateLyrics'])==1 and r['alternateLyrics'][0]['text']==response
   # Independently reconstruct source onset relationships for the insertion boundary.
   for part_id,expected in [('P1',{'X21':[0,2.5],'X22':[0]}),('P2',{'X21':[0,1,1.5],'X22':[0,1,1.5]})]:
    div=1;observed={}
    for measure in xml.find("part[@id='"+part_id+"']").findall('measure'):
     div=int(measure.findtext('attributes/divisions',str(div)));at=last=0;onsets=[]
     for note in measure:
      duration=int(note.findtext('duration','0'))
      if note.tag=='backup':at-=duration
      elif note.tag=='forward':at+=duration
      elif note.tag=='note':
       onset=last if note.find('chord') is not None else at
       if note.find('chord') is None:last=at;at+=duration
       if note.find("lyric[@name='chorus']") is not None:onsets.append(onset/div)
     if measure.get('number') in expected:observed[measure.get('number')]=onsets
    assert observed==expected
  else:
   assert len(r['refrains'])==1 and chorus['text']==before[id]['refrains'][0]['text']
   if r['number']=='100':assert chorus['verses']==['1','2','3'] and len(r['verses'])==5
assert sum(any(x['label']=='Shared ending' for x in r['refrains']) for r in new['songs'])==manifest['groups'][-1]['remainingAfter']
with tempfile.TemporaryDirectory() as folder:
 work=Path(folder);(work/'assets/scores').mkdir(parents=True);(work/'assets/lyrics.json').write_text(json.dumps(new),encoding='utf8')
 catalog=[dict(id=id,title=after[id]['title'],collection=after[id]['collection'],page=after[id]['number'],asset=after[id]['source']) for id in corrected]
 for song in catalog:shutil.copyfile(root/song['asset'],work/song['asset'])
 (work/'catalog.json').write_text(json.dumps(catalog),encoding='utf8');subprocess.run([sys.executable,str(root/'tools/extract-lyrics.py'),'catalog.json',*corrected],cwd=work,check=True)
 assert json.loads((work/'assets/lyrics.json').read_text(encoding='utf8'))==new
print('PASS deterministic selection, source streams/endings, exact verse preservation, unchanged deferred/other records and notation, targeted extraction replay:',len(reviewed),'audited',len(corrected),'corrected')
