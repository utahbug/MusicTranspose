"""Focused extraction controls; no catalog rebuild or source-score writes."""
import json,sys,tempfile,subprocess,zipfile
from pathlib import Path
from xml.sax.saxutils import escape
root=Path(__file__).resolve().parents[1]
with tempfile.TemporaryDirectory() as folder:
 work=Path(folder);(work/'assets').mkdir()
 def lyric(text,number='1',name='',voice='1'):
  return f'<note><voice>{voice}</voice><lyric number="{number}" name="{name}"><text>{escape(text)}</text></lyric></note>'
 def score(id,body):
  path=work/(id+'.mxl')
  with zipfile.ZipFile(path,'w') as z:
   z.writestr('META-INF/container.xml','<container><rootfiles><rootfile full-path="score.xml"/></rootfiles></container>')
   z.writestr('score.xml','<score-partwise><part id="P1"><measure>'+body+'</measure></part></score-partwise>')
  return dict(id=id,title=id,asset=str(path))
 verse=lyric('First principal verse.')+lyric('Second principal verse.','2')
 catalog=[score('explicit',verse+'<direction><direction-type><words>Refrain:</words></direction-type></direction>'+lyric('The full repeated principal section.')+lyric('Harmony text.',voice='2')+'<direction><direction-type><words>(4th verse)</words></direction-type></direction>'),score('shared',verse+lyric('A genuine unlabelled ending with enough words to retain separately.')),score('named',verse+lyric('Common repeated words without a visible section heading.',name='chorus')+lyric('Alternate words.','2','chorus'))]
 (work/'catalog.json').write_text(json.dumps(catalog),encoding='utf8')
 subprocess.run([sys.executable,str(root/'tools/extract-lyrics.py'),str(work/'catalog.json')],cwd=work,check=True,stdout=subprocess.DEVNULL)
 data={s['id']:s for s in json.loads((work/'assets/lyrics.json').read_text(encoding='utf8'))['songs']}
 assert data['explicit']['refrains'][0]['label']=='Refrain'
 assert len(data['explicit']['verses'])==2 and len(data['explicit']['refrains'])==1
 assert data['explicit']['alternateLyrics'][0]['text']=='Harmony text.'
 assert data['shared']['refrains'][0]['label']=='Shared ending'
 assert data['named']['refrains'][0]['label']=='Chorus'
 assert len(data['named']['verses'])==2 and len(data['named']['refrains'])==1
 assert data['named']['alternateLyrics'][0]['text']=='Alternate words.'
print('PASS source section names, explicit Refrain, harmony/alternate isolation, annotation exclusion and genuine shared ending')
