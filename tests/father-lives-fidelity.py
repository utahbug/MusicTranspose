"""Compare recorded browser layouts and musical XML, never rewrite assets."""
import json,subprocess,hashlib,xml.etree.ElementTree as E
from pathlib import Path
root=Path(__file__).resolve().parents[1];base=root/'test-results/father-lives'
cs='song-2a184969-eb57-4901-9829-48c3952bfda3';hymn='song-094d3a6c-43e1-497f-80c3-24cb36f444de'
def read(name):return json.loads((base/name/'results.json').read_text(encoding='utf-8'))
def canonical(n):return (n.tag,tuple(sorted(n.attrib.items())),(n.text or '').strip(),tuple(canonical(c) for c in n))
summary=[]
for engine in ['chromium','webkit']:
 before={(r['id'],r['width'],r['mode']):r for r in read('before-'+engine)}
 for r in read('after-'+engine):
  old=before[r['id'],r['width'],r['mode']];assert r['xml']==old['xml'],'Full source XML changed'
  if r['mode']=='pdf':assert r['pdfPages']==old['pdfPages']==1;continue
  if r['id']==hymn:
   for field in ['zoom','systems','pages','viewXML']:assert r[field]==old[field],(engine,r['width'],field)
  elif r['mode']=='auto':
   assert r['viewXML']==old['viewXML'];assert len(r['pages'])<len(old['pages'])
   assert r['report']['readable'] and r['report']['clipping']==r['report']['collisions']==0
   summary.append({'browser':engine,'width':r['width'],'before':len(old['pages']),'after':len(r['pages']),'lyricPixels':r['report']['displayMinLyric']})
  else:
   assert len(r['pages'])==len(old['pages'])==1
   a=E.fromstring(old['viewXML']);b=E.fromstring(r['viewXML'])
   for tag in ['note','attributes','harmony','barline']:
    assert [canonical(x) for x in a.findall('.//'+tag)]==[canonical(x) for x in b.findall('.//'+tag)],tag
   words=[(x.text or '').strip() for x in b.findall('.//direction-type/words')]
   assert not set(words)&{'R.H.','L.H.','Smoothly','with pedal','simile'}
   assert 'Gently' in words and 'slower' in words and 'Duet' in words
   assert len(a.findall('.//metronome'))==len(b.findall('.//metronome'))
  pages=r['pages'];coverage=[i for p in pages for i in range(p['start'],p['end']+1)]
  assert coverage==list(range(12 if r['id']==cs else 11)),coverage
  assert all(p['used']<=p['available']+.01 for p in pages)
for ident in [cs,hymn]:
 for path in [f'assets/scores/{ident}.mxl',f'assets/pdfs/fallback/{ident}.pdf']:
  assert (root/path).read_bytes()==subprocess.check_output(['git','show','a3d674c:'+path],cwd=root),path
for engine in ['chromium','webkit']:
 folder=base/('regression-after-'+engine)
 if not folder.exists():continue
 old={(r['id'],r['width'],r['mode']):r for r in read('regression-before-'+engine)}
 for r in read('regression-after-'+engine):
  prior=old[r['id'],r['width'],r['mode']]
  for key in ['xml','viewXML']+([] if r['mode']=='pdf' else ['zoom','pages','systems']):assert r.get(key)==prior.get(key),(r['id'],key)
(base/'verified-summary.json').write_text(json.dumps(summary,indent=2),encoding='utf-8')
print('PASS all measures, notes, rhythms, repeats/endings, lyrics, chords, source/PDF bytes; scoped piano directions; unchanged #302; recorded other-score regressions')
print(json.dumps(summary))
