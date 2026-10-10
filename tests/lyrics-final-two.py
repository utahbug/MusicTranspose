"""Source-preserving role paths, optional descant and PDF-corrected parallel text."""
import json,re,sys,subprocess,tempfile,shutil,zipfile,hashlib,xml.etree.ElementTree as E
from pathlib import Path
from collections import defaultdict
from pypdf import PdfReader
root=Path(__file__).resolve().parents[1];baseline='9674c33072a96fd2a3f4159c4b23dcf95581cf05'
ids=['song-97b815d1-3074-402d-87dc-054a26201437','song-be95cf4e-2b13-4a09-a71b-52ef90125517']
old=json.loads(subprocess.check_output(['git','show',baseline+':assets/lyrics.json'],cwd=root));new=json.loads((root/'assets/lyrics.json').read_text(encoding='utf8'));after={r['id']:r for r in new['songs']}
assert [r for r in old['songs'] if r['id'] not in ids]==[r for r in new['songs'] if r['id'] not in ids]
s=(root/'tools/extract-lyrics.py').read_text(encoding='utf8');ns={'re':re};exec(s[s.index('def clean'):s.index('records=[]')],ns);stitch=ns['stitch']
for id,number,title in zip(ids,['178','182'],['Teacher, Do You Love Me?','How Will They Know?']):
 r=after[id];assert (r['number'],r['title'],r['collection'])==(number,title,'Children’s Songbook');assert r['available'] and not r['verses'] and not r['notes'];assert not any(c['label']=='Shared ending' for c in r['refrains'])
 pdf='assets/pdfs/fallback/'+id+'.pdf'
 for file in [r['source'].removeprefix('./'),pdf]:assert (root/file).read_bytes()==subprocess.check_output(['git','show',baseline+':'+file],cwd=root)
 with zipfile.ZipFile(root/r['source']) as z:x=E.fromstring(z.read(E.fromstring(z.read('META-INF/container.xml')).find('.//{*}rootfile').get('full-path')))
 literal=defaultdict(list)
 for p in x.findall('part'):
  for n in p.findall('measure/note'):
   for l in n.findall('lyric'):
    if l.findall('text'):literal[p.get('id'),n.findtext('voice','1'),l.get('number','1')].append(l)
 assert r['sourceLyricStreams']==[dict(part=p,voice=v,row=n,text=stitch(nodes)) for (p,v,n),nodes in literal.items()]
 def nodes(part,bars,row='1',voice='1'):return [l for m in x.find("part[@id='"+part+"']").findall('measure') if m.get('number') in bars for n in m.findall('note') if n.findtext('voice','1')==voice for l in n.findall('lyric') if l.get('number')==row and l.findall('text')]
 def text(part,bars,row='1',voice='1'):return stitch(nodes(part,bars,row,voice))
 def seq(start,end,prefix=''):return [prefix+str(n) for n in range(start,end+1)]
 sections=r['refrains'];content=[c['text'] for c in sections]
 if number=='178':
  assert r['principalStanzaCounts']=={'Child':2,'Teacher':2} and len(sections)==8
  assert content[0]==text('P1',seq(5,14))
  assert content[1]==text('P1',seq(5,12),'2')+' '+text('P1',seq(15,17))
  assert content[2]==stitch(nodes('P1',seq(18,26))[:-1])
  assert content[3]==stitch(nodes('P1',['26'])[-1:]+nodes('P1',seq(27,36))[:-1])
  assert content[4]==stitch(nodes('P1',['36'])[-1:]+nodes('P1',seq(27,34),'2')+nodes('P1',seq(37,39)))
  assert content[5]==stitch(nodes('P1',['40'])+nodes('P1',seq(19,24))) and content[6]==text('P1',seq(41,43))
  assert content[2].endswith('To lead me safely home.') and (content[5]+' '+content[6]).endswith('To lead us safely home.')
  assert not 'lead me' in content[5] and 'I lead us' not in content[5]+' '+content[6]
  assert [i for i,c in enumerate(sections) if c.get('disclosure')]==[2,5]
  assert content[7]=='*Alternate words: Mother, Father'
  p=x.find("part[@id='P1']");assert p.find("measure[@number='40']//sound").get('dalsegno')=='19';assert p.find("measure[@number='24']//sound").get('tocoda')=='41'
 else:
  assert r['principalStanzaCounts']=={'Initial stanzas':2} and len(sections)==7
  assert content[0]==text('P2',seq(3,18,'X'))
  assert content[1]==text('P2',['X19'])+' '+text('P2',seq(4,14,'X'),'2').removeprefix('(2.) ')+' '+text('P2',['X15','X16','X20','X21'])
  assert content[2]==text('P1',seq(4,21,'X'),'5') and sections[2]['disclosure'] and 'stanza 2 only' in sections[2]['label']
  assert content[3]==text('P1',seq(22,49,'X'),'5').replace('grow un wisdom','grow in wisdom')
  assert content[4]=='How will they know, as on through life they go?'
  assert content[5]=='How will they know, as on they go?'
  assert content[6]=='How will they know unless we strive to teach them so?'
  assert 'That God is' not in content[4] and 'Verse 5' not in str(sections)
  assert hashlib.sha256((root/pdf).read_bytes()).hexdigest()==r['sourcePdfSha256']
  pages=PdfReader(root/pdf).pages
  # Independent PDF text evidence plus visual audit: these words differ from XML.
  p2=pages[1].extract_text();p4=pages[3].extract_text()
  assert re.search(r'grow\s+in\b',p2) and re.search(r'as\s+on\s+through',p4) and re.search(r'life\s+they',p4)
  assert len([c for c in sections if c.get('disclosure')])==1
assert len(after)==len(new['songs'])
for record in new['songs']:
 assert isinstance(record['verses'],list) and isinstance(record['refrains'],list)
 for verse in record['verses']:assert verse['text'].strip() and str(verse.get('number','')).strip()
 for section in record['refrains']:assert section['text'].strip() and section.get('label')
 if record.get('available'):assert record['verses'] or record['refrains']
assert not any(c['label']=='Shared ending' for r in new['songs'] for c in r['refrains'])
historic=json.loads(subprocess.check_output(['git','show','57328ea:assets/lyrics.json'],cwd=root))['songs'];original=[r['id'] for r in historic if any(c['label']=='Shared ending' for c in r['refrains'])];assert len(original)==91 and all(after[id]['available'] for id in original)
with tempfile.TemporaryDirectory() as folder:
 work=Path(folder);(work/'assets/scores').mkdir(parents=True);(work/'assets/pdfs/fallback').mkdir(parents=True);(work/'assets/lyrics.json').write_text(json.dumps(new),encoding='utf8');catalog=[dict(id=id,title=after[id]['title'],collection=after[id]['collection'],page=after[id]['number'],asset=after[id]['source']) for id in ids]
 for song in catalog:
  shutil.copyfile(root/song['asset'],work/song['asset']);pdf='assets/pdfs/fallback/'+song['id']+'.pdf';shutil.copyfile(root/pdf,work/pdf)
 (work/'catalog.json').write_text(json.dumps(catalog),encoding='utf8');subprocess.run([sys.executable,str(root/'tools/extract-lyrics.py'),'catalog.json',*ids],cwd=work,check=True);assert json.loads((work/'assets/lyrics.json').read_text(encoding='utf8'))==new
print('PASS both identities, role/ending/duet/coda paths, optional descant, independent PDF evidence, raw streams, exact protected records/assets, targeted replay; all 91 accounted for, zero Shared ending records')
