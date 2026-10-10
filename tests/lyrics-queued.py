"""Verify the queued audit against source streams, timing and its frozen checkpoint."""
import sys,json,re,subprocess,tempfile,shutil,zipfile,xml.etree.ElementTree as E
from pathlib import Path
root=Path(__file__).resolve().parents[1];manifest=json.loads((root/'reports/lyrics-queued.json').read_text(encoding='utf8'))
new=json.loads((root/'assets/lyrics.json').read_text(encoding='utf8'));after={r['id']:r for r in new['songs']};old=json.loads(subprocess.check_output(['git','show',manifest['startingCommit']+':assets/lyrics.json'],cwd=root));before={r['id']:r for r in old['songs']}
reviewed=[s for g in manifest['groups'] for s in g['songs']];corrected=[s['id'] for s in reviewed if s['status']=='corrected']
assert [r for r in new['songs'] if r['id'] not in corrected]==[r for r in old['songs'] if r['id'] not in corrected], 'Protected/unreviewed records changed'
source=(root/'tools/extract-lyrics.py').read_text(encoding='utf8');ns={'re':re};exec(source[source.index('def clean'):source.index('records=[]')],ns);stitch=ns['stitch'];excluded=set(manifest['excludedPreviouslyAudited'])
for group in manifest['groups']:
 baseline=json.loads(subprocess.check_output(['git','show',group['baseline']+':assets/lyrics.json'],cwd=root))
 assert [r['id'] for r in baseline['songs'] if r['id'] not in excluded and any(x['label']=='Shared ending' for x in r['refrains'])][:10]==[s['id'] for s in group['songs']]
 excluded.update(s['id'] for s in group['songs'])
 for item in group['songs']:
  id=item['id'];r=after[id];number=r['number'];path=root/r['source'];assert path.read_bytes()==subprocess.check_output(['git','show',manifest['startingCommit']+':'+r['source'].removeprefix('./')],cwd=root)
  with zipfile.ZipFile(path) as z:xml=E.fromstring(z.read(E.fromstring(z.read('META-INF/container.xml')).find('.//{*}rootfile').get('full-path')))
  if item['status']=='deferred':assert r==before[id];continue
  assert r['available'] and not r['notes'],id
  secondary=number in ('251','252','276')
  assert r['verses']==[v for v in before[id]['verses'] if not secondary or v.get('sourcePart')=='P1'],id
  assert len(r['verses'])==item['verseCount'] and [v['number'] for v in r['verses']]==list(map(str,range(1,item['verseCount']+1)))
  for v in r['verses']:
   if v['kind']=='numbered-text-block':
    assert v['text'] in [ns['clean']((c.text or '').split('. ',1)[1]) for c in xml.findall('.//credit-words') if (c.text or '').startswith(v['number']+'. ')];continue
   assert v['text']==stitch([l for p in xml.findall('part') if p.get('id')==v['sourcePart'] for n in p.findall('measure/note') if n.findtext('voice','1')==v['sourceVoice'] for l in n.findall('lyric') if l.get('name')=='verse' and l.get('number')==v['number']]),id
  assert len(r['refrains'])==1;chorus=r['refrains'][0];assert chorus['label']=='Chorus'
  nodes=xml.findall("part[@id='P1']/measure/note/lyric[@name='chorus']");literal=stitch(nodes);assert literal==before[id]['refrains'][0]['text']
  if number in ('249','300'):
   part=xml.find("part[@id='P1']")
   first,last,word=('X23','X24','King.') if number=='249' else ('3','4','can.')
   for bar,ending in [(first,'1'),(last,'2')]:
    assert part.find("measure[@number='"+bar+"']/barline/ending[@type='start']").get('number')==ending
    assert stitch(part.findall("measure[@number='"+bar+"']/note/lyric[@name='chorus']"))==word
   assert chorus['principalText']==literal and chorus['text']==literal.removesuffix(' '+word)
   assert chorus['text']==stitch([l for m in part.findall('measure') if m.get('number')!=first for l in m.findall("note/lyric[@name='chorus']")]),'Both performed ending paths must agree'
  elif secondary:
   response=stitch(xml.findall("part[@id='P2']/measure/note/lyric[@name='chorus']"));assert len(r['alternateLyrics'])==1 and r['alternateLyrics'][0]['text']==response;assert chorus['principalText']==literal
   if number=='251':
    assert response=='Thru Christ, our Lord!';assert chorus['text']==literal[:-1]+' (Thru Christ, our Lord)!'
    timing={'P1':{'X31':[2],'X32':[0,2],'X33':[0,3],'X34':[0]},'P2':{'X33':[3],'X34':[0,2],'X35':[0]}}
   elif number=='252':
    assert response=='push along. full of song.';assert chorus['text']==literal.replace('along, Do','along (push along), Do',1).replace('song, We','song (full of song), We',1)
    timing={'P1':{'X12':[0],'X15':[0]},'P2':{'X12':[1,1.75,2],'X15':[1,1.75,2]}}
   else:
    assert response=='Then away, haste away!';assert chorus['text']==literal.replace('Then away, haste away!','Then away (Then away), haste away (haste away)!',1)
    timing={'P1':{'X21':[0,3,3.75],'X22':[0,3,3.75]},'P2':{'X21':[1,1.75,2],'X22':[1,1.75,2]}}
   for part_id,expected in timing.items():
    div=1;observed={}
    for m in xml.find("part[@id='"+part_id+"']").findall('measure'):
     div=int(m.findtext('attributes/divisions',str(div)));at=last=0;onsets=[]
     for n in m:
      d=int(n.findtext('duration','0'))
      if n.tag=='backup':at-=d
      elif n.tag=='forward':at+=d
      elif n.tag=='note':
       onset=last if n.find('chord') is not None else at
       if n.find('chord') is None:last=at;at+=d
       if n.find("lyric[@name='chorus']") is not None:onsets.append(onset/div)
     if m.get('number') in expected:observed[m.get('number')]=onsets
    assert observed==expected
  else:assert chorus['text']==literal and not r['alternateLyrics']
assert sum(any(x['label']=='Shared ending' for x in r['refrains']) for r in new['songs'])==manifest['groups'][-1]['remainingAfter']
with tempfile.TemporaryDirectory() as folder:
 work=Path(folder);(work/'assets/scores').mkdir(parents=True);(work/'assets/lyrics.json').write_text(json.dumps(new),encoding='utf8');catalog=[dict(id=id,title=after[id]['title'],collection=after[id]['collection'],page=after[id]['number'],asset=after[id]['source']) for id in corrected]
 for song in catalog:shutil.copyfile(root/song['asset'],work/song['asset'])
 (work/'catalog.json').write_text(json.dumps(catalog),encoding='utf8');subprocess.run([sys.executable,str(root/'tools/extract-lyrics.py'),'catalog.json',*corrected],cwd=work,check=True);assert json.loads((work/'assets/lyrics.json').read_text(encoding='utf8'))==new
print('PASS source streams/timing, exact lyric preservation, protected/deferred records and source bytes unchanged, targeted replay:',len(reviewed),'audited',len(corrected),'corrected')
