"""Four overlapping chorus records: source identity, exact streams, timing and replay."""
import sys,json,re,subprocess,tempfile,shutil,zipfile,xml.etree.ElementTree as E
from fractions import Fraction
from pathlib import Path
root=Path(__file__).resolve().parents[1];baseline='f759a01fcaf9f5e34a518cdf7aded94e7c373fef'
expected={'52':'The Day Dawn Is Breaking','144':'Secret Prayer','241':'Count Your Blessings','246':'Onward, Christian Soldiers'}
old=json.loads(subprocess.check_output(['git','show',baseline+':assets/lyrics.json'],cwd=root));new=json.loads((root/'assets/lyrics.json').read_text(encoding='utf8'));before={r['id']:r for r in old['songs']}
items=[r for r in new['songs'] if r['collection']=='Hymns (1985)' and r['number'] in expected];ids=[r['id'] for r in items];assert len(items)==4
assert [r for r in old['songs'] if r['id'] not in ids]==[r for r in new['songs'] if r['id'] not in ids]
source=(root/'tools/extract-lyrics.py').read_text(encoding='utf8');ns={'re':re};exec(source[source.index('def clean'):source.index('records=[]')],ns);stitch=ns['stitch']
for r in items:
 assert r['title']==expected[r['number']] and r['available'] and r['status']=='extracted' and not r['notes']
 assert [v['number'] for v in r['verses']]==['1','2','3','4']
 assert r['verses']==[v for v in before[r['id']]['verses'] if v['sourcePart']=='P1']
 assert [c['label'] for c in r['refrains']]==['Chorus','Overlapping chorus part (sung with Chorus)']
 main,lower=r['refrains'];assert main['verses']==['1','2','3','4']
 assert main['text']==before[r['id']]['refrains'][0]['text']
 assert lower['text']==next(v['text'] for v in before[r['id']]['verses'] if v['sourcePart']=='P2')
 assert len(r['alternateLyrics'])==1 and r['alternateLyrics'][0]['text']==lower['text']
 path=root/r['source'];assert path.read_bytes()==subprocess.check_output(['git','show',baseline+':'+r['source'].removeprefix('./')],cwd=root)
 with zipfile.ZipFile(path) as z:xml=E.fromstring(z.read(E.fromstring(z.read('META-INF/container.xml')).find('.//{*}rootfile').get('full-path')))
 assert r['title'] in [c.text for c in xml.findall('.//credit-words')]
 for v in r['verses']:assert v['text']==stitch(xml.findall("part[@id='P1']/measure/note/lyric[@name='verse'][@number='"+v['number']+"']"))
 for section,part in [(main,'P1'),(lower,'P2')]:assert section['text']==stitch(xml.findall("part[@id='"+part+"']/measure/note/lyric[@name='chorus']"))
 assert not xml.findall('.//barline/ending') and not xml.findall('.//barline/repeat')
 events={}
 for part in xml.findall('part'):
  divisions=1
  for m in part.findall('measure'):
   divisions=int(m.findtext('attributes/divisions',divisions));cursor=0;last=0
   for e in m:
    duration=int(e.findtext('duration',0))
    if e.tag=='backup':cursor-=duration
    elif e.tag=='forward':cursor+=duration
    elif e.tag=='note':
     onset=last if e.find('chord') is not None else cursor
     for l in e.findall("lyric[@name='chorus']"):
      assert e.findtext('voice','1')=='1'
      events[part.get('id'),m.get('number'),str(Fraction(onset,divisions))]=''.join(t.text or '' for t in l.findall('text'))
     if e.find('chord') is None:last=cursor;cursor+=duration
 checks={'52':[('P1','X17','0','Beau'),('P2','X18','0','Beau'),('P1','X18','0','day'),('P1','X25','0','day.'),('P2','X25','0','day.')], '144':[('P1','X10','0','May'),('P2','X11','0','May'),('P1','X11','0','heart'),('P1','X17','0','giv’n'),('P2','X17','2','giv’n')], '241':[('P1','X16','0','Count'),('P2','X16','0','Count'),('P1','X16','3/2','your'),('P2','X16','1','man'),('P2','X16','3/2','y'),('P1','X19','0','one.'),('P2','X19','0','one.')], '246':[('P1','X19','0','war,'),('P2','X19','0','war,'),('P2','X19','2','With'),('P1','X20','0','With'),('P1','X21','0','Je'),('P2','X21','0','Je')]}
 for part,measure,onset,text in checks[r['number']]:assert events[part,measure,onset]==text
assert sum(any(c['label']=='Shared ending' for c in r['refrains']) for r in new['songs'])==8
old_index=json.loads(subprocess.check_output(['git','show',baseline+':lyrics-index.js'],cwd=root).decode().split('new Set(')[1].split(');')[0]);new_index=json.loads((root/'lyrics-index.js').read_text().split('new Set(')[1].split(');')[0]);assert set(new_index)-set(old_index)==set(ids) and not set(old_index)-set(new_index)
with tempfile.TemporaryDirectory() as folder:
 work=Path(folder);(work/'assets/scores').mkdir(parents=True);(work/'assets/lyrics.json').write_text(json.dumps(new),encoding='utf8');catalog=[dict(id=r['id'],title=r['title'],collection=r['collection'],page=r['number'],asset=r['source']) for r in items]
 for song in catalog:shutil.copyfile(root/song['asset'],work/song['asset'])
 (work/'catalog.json').write_text(json.dumps(catalog),encoding='utf8');subprocess.run([sys.executable,str(root/'tools/extract-lyrics.py'),'catalog.json',*ids],cwd=work,check=True);assert json.loads((work/'assets/lyrics.json').read_text(encoding='utf8'))==new
print('PASS four identities, four verses each, explicit Chorus, exact principal/lower source words, staggered/converging onsets, protected records/source assets, availability and targeted replay; 8 remaining')
