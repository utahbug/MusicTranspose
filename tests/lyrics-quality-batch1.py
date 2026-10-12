"""Focused source, availability, preservation and extraction replay regression."""
import json,re,sys,subprocess,tempfile,shutil,zipfile,hashlib,xml.etree.ElementTree as E
from pathlib import Path
root=Path(__file__).resolve().parents[1];sys.path.insert(0,str(root/'tools'))
from lyrics_quality_batch1 import IDS,SOURCE_HASHES
baseline='19f6e3a';old=json.loads(subprocess.check_output(['git','show',baseline+':assets/lyrics.json'],cwd=root));new=json.loads((root/'assets/lyrics.json').read_text(encoding='utf8'));before={s['id']:s for s in old['songs']};after={s['id']:s for s in new['songs']}
# cs-12 has separate unpublished preparation; this batch never stages it.
assert [s for s in old['songs'] if s['id'] not in IDS|{'cs-12'}]==[s for s in new['songs'] if s['id'] not in IDS|{'cs-12'}]
assert len(new['songs'])==len(old['songs'])==681
assert {s['id'] for s in new['songs'] if s.get('available')}=={s['id'] for s in old['songs'] if s.get('available')}
assert (root/'lyrics-index.js').read_text(encoding='utf8')==subprocess.check_output(['git','show',baseline+':lyrics-index.js'],cwd=root).decode().replace('\r\n','\n')
for sid in IDS:
 a=before[sid];b=after[sid];assert b['sourceTextBlocks']==a['sourceTextBlocks'];assert b['status']=='reviewed-withheld' and not b['available'];assert b['sourceLyricStreams']
 assert all(v['label']!='Shared ending' for v in b['verses']+b['refrains'])
 for file,digest in SOURCE_HASHES[sid].items():assert hashlib.sha256((root/file).read_bytes()).hexdigest()==digest
 assert b['sourceTextBlocks'][0] in b['refrains'][-1]['text'] or b['sourceTextBlocks'][0]==b['title']
def bynum(n):return next(s for s in after.values() if s['id'] in IDS and s['number']==n)
a=bynum('78');assert len(a['verses'])==2 and a['verses'][1]['text'].startswith('I’m trying');assert a['refrains'][0]['verses']==['1','2'];assert a['refrains'][0]['text']==before['cs-78']['refrains'][0]['text'];assert a['verses'][0]['text'].endswith('whispers:')
a=bynum('190');assert not a['verses'];assert [s['label'] for s in a['refrains'][:4]]==['Performance instruction','Part 1 — Girls','Part 2 — Boys','Together — third ending'];assert not any('here. here.' in s['text'] for s in a['refrains']);assert not any('(Girls)' in s['text'] or '(Boys)' in s['text'] for s in a['refrains'])
a=bynum('42');assert [v['number'] for v in a['verses']]==['1','2','3'];assert a['verses'][2]['text']==before[a['id']]['verses'][-1]['text'];assert sum(s.get('disclosure',False) for s in a['refrains'])==2;assert a['refrains'][1]['text'].endswith('the Lord, the Lord of all.');assert 'the Savior in a stall!' in a['refrains'][1]['text']
a=bynum('212');assert [v['number'] for v in a['verses']]==['1','2','3','4'];assert a['refrains'][0]['verses']==['1','2','3','4'];assert a['refrains'][2]['text'].count('Glory to God')==2;assert 'God God' not in a['refrains'][2]['text'];assert a['refrains'][1]['text'].count('Glory to God')==2
# Preserve all sung XML tokens, except documented duplicated/relocated endings,
# non-sung labels and PDF-backed capitalization/punctuation corrections.
for sid in IDS:
 b=after[sid];oldtext=' '.join(s['text'] for s in before[sid]['verses']+before[sid]['refrains']);newtext=' '.join(s['text'] for s in b['verses']+b['refrains']);tokens=lambda t:set(re.findall(r"[a-z’]+",t.lower()))
 assert tokens(oldtext)-tokens(newtext)<=({'girls','boys'} if b['number']=='190' else set())
with tempfile.TemporaryDirectory() as d:
 w=Path(d);(w/'assets').mkdir();shutil.copy(root/'assets/lyrics.json',w/'assets/lyrics.json')
 for files in SOURCE_HASHES.values():
  for f in files:(w/f).parent.mkdir(parents=True,exist_ok=True);shutil.copy(root/f,w/f)
 catalog=[dict(id=s['id'],title=s['title'],collection=s['collection'],page=s['number'],asset=s['source']) for s in new['songs'] if s['id'] in IDS];(w/'catalog.json').write_text(json.dumps(catalog),encoding='utf8')
 subprocess.run([sys.executable,str(root/'tools/extract-lyrics.py'),'catalog.json',*sorted(IDS)],cwd=w,check=True)
 assert json.loads((w/'assets/lyrics.json').read_text(encoding='utf8'))==new
print('PASS four identities, source hashes, parts/verse order, chorus routing, words/credits, withheld availability, unchanged unrelated records/index and targeted replay')
