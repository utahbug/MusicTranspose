"""Two source-aligned pronunciation guides must not become sung verses."""
import sys,json,re,subprocess,tempfile,shutil,zipfile,xml.etree.ElementTree as E
from pathlib import Path
root=Path(__file__).resolve().parents[1]
baseline='113f89f19ecd4686aaeca56dbcf59347bf5e1c62'
ids=['cs-16','song-708c0414-b2e0-4f70-b178-88aca2228fa7']
expected=[('16','Children All Over the World',6),('116','The Books in the New Testament',1)]
guide_texts=['Non-English words for thank you:\nSpanish: gracias — (grah-see–ahs)\nTongan: mālō — (mah-loh)\nGerman: wir danken dir — (veer don-ken deer)\nDanish: tak — (tahk)\nFrench: merci — (mare-see)\nJapanese: kansha shimasu — (kahn-shah shee-mah-sue)','Philemon — (fie-lee-mawn)']
old=json.loads(subprocess.check_output(['git','show',baseline+':assets/lyrics.json'],cwd=root));new=json.loads((root/'assets/lyrics.json').read_text(encoding='utf8'));before={r['id']:r for r in old['songs']};after={r['id']:r for r in new['songs']}
assert [r for r in old['songs'] if r['id'] not in ids]==[r for r in new['songs'] if r['id'] not in ids]
assert (root/'lyrics-index.js').read_text(encoding='utf8')==subprocess.check_output(['git','show',baseline+':lyrics-index.js'],cwd=root).decode('utf8').replace('\r\n','\n')
source=(root/'tools/extract-lyrics.py').read_text(encoding='utf8');ns={'re':re};exec(source[source.index('def clean'):source.index('records=[]')],ns);stitch=ns['stitch']
for id,(number,title,count),guide_text in zip(ids,expected,guide_texts):
 r=after[id];assert (r['number'],r['title'],r['collection'])==(number,title,'Children’s Songbook')
 assert r['available'] and r['status']=='extracted' and not r['notes'] and not r['verses'] and not r['alternateLyrics']
 assert [s['label'] for s in r['refrains']]==['Lyrics','Pronunciation guide (not sung)']
 main,guide=r['refrains'];assert guide['kind']=='pronunciation-guide' and guide['text']==guide_text
 assert main['text']==before[id]['verses'][0]['text']+' '+before[id]['refrains'][0]['text']
 assert guide['sourceText']==before[id]['verses'][1]['text']
 path=root/r['source'];assert path.read_bytes()==subprocess.check_output(['git','show',baseline+':'+r['source'].removeprefix('./')],cwd=root)
 with zipfile.ZipFile(path) as z:xml=E.fromstring(z.read(E.fromstring(z.read('META-INF/container.xml')).find('.//{*}rootfile').get('full-path')))
 assert not xml.findall('.//barline/repeat') and not xml.findall('.//barline/ending')
 part=xml.find("part[@id='P1']");assert main['text']==stitch(part.findall("measure/note/lyric[@number='1']"))
 assert guide['sourceText']==stitch(part.findall("measure/note/lyric[@number='2']"))
 assert len(r['pronunciationGuides'])==count
 chunks=[];words=[];measures=[];entries=[]
 for m in part.findall('measure'):
  for n in m.findall('note'):
   g=n.find("lyric[@number='2']")
   if g is None:continue
   w=n.find("lyric[@number='1']");assert w is not None and n.findtext('voice','1')=='1'
   assert all('Italic' in t.get('font-family','') for t in g.findall('text'))
   chunks.append(g);words.append(w);measures.append(m.get('number'))
   if g.findtext('text').endswith(')'):
    entry=r['pronunciationGuides'][len(entries)]
    assert entry['word']==stitch(words) and entry['sourceText']==stitch(chunks) and entry['sourceMeasures']==list(dict.fromkeys(measures))
    # Removing only inserted syllable hyphens gives the exact literal stream.
    assert entry['text'].replace('-','')==entry['sourceText']
    assert entry['text'].count('-')==sum(g.findtext('syllabic') in ('begin','middle') for g in chunks)
    entries.append(entry);chunks=[];words=[];measures=[]
 assert not chunks and len(entries)==count
 if number=='16':
  credits=[ns['clean'](c.text or '') for c in xml.findall('.//credit-words')]
  assert 'Non-English words for' in credits and 'thank you:' in credits
  for entry in entries:assert entry['language']+':' in credits and entry['translation'] in credits
 else:assert entries[0]['sourceMeasures']==['X18','X19'] and entries[0]['word']=='Philemon,'
assert sum(any(c['label']=='Shared ending' for c in r['refrains']) for r in old['songs'])==14
assert sum(any(c['label']=='Shared ending' for c in r['refrains']) for r in new['songs'])==12
with tempfile.TemporaryDirectory() as folder:
 work=Path(folder);(work/'assets/scores').mkdir(parents=True);(work/'assets/lyrics.json').write_text(json.dumps(new),encoding='utf8');catalog=[dict(id=id,title=after[id]['title'],collection=after[id]['collection'],page=after[id]['number'],asset=after[id]['source']) for id in ids]
 for song in catalog:shutil.copyfile(root/song['asset'],work/song['asset'])
 (work/'catalog.json').write_text(json.dumps(catalog),encoding='utf8');subprocess.run([sys.executable,str(root/'tools/extract-lyrics.py'),'catalog.json',*ids],cwd=work,check=True);assert json.loads((work/'assets/lyrics.json').read_text(encoding='utf8'))==new
print('PASS two identities, continuous sung text, pronunciation words/measure alignment/syllable divisions, source translations, availability, protected records/source bytes, targeted replay; 12 remaining')
