"""Hymns #296: exact credit exclusion, source fidelity and isolated regeneration."""
import json,re,subprocess,sys,tempfile,shutil,zipfile,xml.etree.ElementTree as E
from pathlib import Path
from pypdf import PdfReader
root=Path(__file__).resolve().parents[1];id='song-8aafccd0-12a9-4d8a-a2a2-15810fabb0a4';baseline='45c286a'
old=json.loads(subprocess.check_output(['git','show',baseline+':assets/lyrics.json'],cwd=root));new=json.loads((root/'assets/lyrics.json').read_text(encoding='utf8'))
assert [r for r in old['songs'] if r['id']!=id]==[r for r in new['songs'] if r['id']!=id]
a=next(r for r in old['songs'] if r['id']==id);b=next(r for r in new['songs'] if r['id']==id)
assert (b['title'],b['number'],b['collection'])==('Our Father, by Whose Name','296','Hymns (1985)')
assert b['verses']==a['verses'][:3] and [v['number'] for v in b['verses']]==['1','2','3']
assert b['sourceTextBlocks']==a['sourceTextBlocks'] and b['status']==a['status'] and b['available']==a['available']
s=(root/'tools/extract-lyrics.py').read_text(encoding='utf8');ns={'re':re};exec(s[s.index('def clean'):s.index('records=[]')],ns)
notice=next(t for t in b['sourceTextBlocks'] if 'The Church Pension Fund' in t)
assert all(t in notice for t in ['F. Bland Tucker','John David Edwards','The Hymnal','1982','without written permission'])
fragment='1982. '+a['verses'][3]['text'];assert ns['reviewed_credit_fragment'](id,fragment)
assert not ns['reviewed_credit_fragment']('other-song',fragment)
assert not ns['reviewed_credit_fragment'](id,'1982. A legitimate numbered stanza')
assert not ns['reviewed_credit_fragment'](id,fragment+' Additional sung words')
assert ns['stitch']([E.fromstring('<lyric><text>Sing 1982 praises and 40 songs.</text></lyric>')])=='Sing 1982 praises and 40 songs.'
with zipfile.ZipFile(root/b['source']) as z:x=E.fromstring(z.read(E.fromstring(z.read('META-INF/container.xml')).find('.//{*}rootfile').get('full-path')))
for v in b['verses']:assert v['text']==ns['stitch'](x.findall("part[@id='P1']/measure/note/lyric[@number='"+v['number']+"']"))
pdf='assets/pdfs/fallback/'+id+'.pdf';text=' '.join(PdfReader(root/pdf).pages[0].extract_text().split());assert 'From The Hymnal, 1982. Text © The Church Pension Fund.' in text
for file in [b['source'].removeprefix('./'),pdf]:assert (root/file).read_bytes()==subprocess.check_output(['git','show',baseline+':'+file],cwd=root)
with tempfile.TemporaryDirectory() as d:
 w=Path(d);(w/'assets/scores').mkdir(parents=True);shutil.copy(root/b['source'],w/b['source']);(w/'assets/lyrics.json').write_text(json.dumps(new),encoding='utf8');(w/'catalog.json').write_text(json.dumps([dict(id=id,title=b['title'],collection=b['collection'],page=b['number'],asset=b['source'])]),encoding='utf8')
 subprocess.run([sys.executable,str(root/'tools/extract-lyrics.py'),'catalog.json',id],cwd=w,check=True)
 assert json.loads((w/'assets/lyrics.json').read_text(encoding='utf8'))==new
print('PASS #296 exact verses/credits/source bytes, numerical lyrics, isolated reproducibility; ALL other records/review and restriction flags unchanged')
