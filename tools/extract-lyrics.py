"""Derive portable lyrics JSON from a song catalog and local MusicXML/MXL files.
Run node catalog export, then: python tools/extract-lyrics.py catalog.json
No source score is changed. Score order is retained; repeats are not expanded.
"""
import sys,json,re,zipfile,xml.etree.ElementTree as ET
from pathlib import Path
from collections import defaultdict
catalog=json.loads(Path(sys.argv[1]).read_text(encoding='utf-8-sig'))
def clean(s):return re.sub(r'[ \t\xa0]+',' ',s).strip()
def stitch(nodes):
 out='';joining=False
 for lyric in nodes:
  syllabic='single'
  for e in lyric:
   if e.tag=='syllabic':syllabic=e.text or 'single'
   elif e.tag=='elision':out+=' ';joining=False
   elif e.tag=='text':
    t=clean(e.text or '')
    if not t or re.fullmatch(r'[—–-]+',t):continue
    if out and not joining and not out.endswith((' ','\n')):out+=' '
    out+=t;joining=syllabic in ('begin','middle')
   elif e.tag in ('end-line','end-paragraph') and not joining:out+='\n'
 return re.sub(r'^\s*\d+\.\s*','',clean(out))
records=[]
for song in catalog:
 r={k:song.get(k,'') for k in ['id','title','collection']};r.update(number=song.get('page',''),source=song['asset'],verses=[],refrains=[],notes=[],status='no-lyrics')
 if song.get('scoreType')=='pdf':r['notes']=['PDF: no structured lyrics extraction.'];records.append(r);continue
 path=Path(song['asset']);z=zipfile.ZipFile(path);xml=z.read(ET.fromstring(z.read('META-INF/container.xml')).find('.//{*}rootfile').get('full-path'));root=ET.fromstring(xml)
 streams=defaultdict(list);directions=[]
 descants={p.get('id') for p in root.findall('part-list/score-part') if re.search(r'\bdescant\b',p.findtext('part-name',''),re.I)}
 r['alternateLyrics']=[];r['extractionDecisions']=[]
 for part in root.findall('part'):
  section='verse';note_index=0
  for measure in part.findall('measure'):
   for element in measure:
    if element.tag=='direction':
     for w in element.findall('.//words'):
      text=clean(w.text or '');directions.append(text)
      if re.fullmatch(r'(chorus|refrain)[:.]?',text,re.I):section='refrain'
    if element.tag=='note':
     note_index+=1
     for l in element.findall('lyric'):
      if any(clean(t.text or '') and not re.fullmatch(r'[—–-]+',clean(t.text or '')) for t in l.findall('text')):
       l.set('data-measure',str(note_index))
       streams[(section,l.get('number') or l.get('name') or '1',part.get('id'),element.findtext('voice','1'))].append(l)
 # Isolate a substantial unlabelled tail carried only on the first lyric row.
 # This is retained as a shared ending candidate, never silently called a chorus.
 for key,nodes in list(streams.items()):
  section,number,part,voice=key
  peers=[v for k,v in streams.items() if k[0]=='verse' and k[2:]==key[2:] and k[1]!=number]
  if section=='verse' and number=='1' and peers:
   try:
    end=max(float(n.get('data-measure')) for ns in peers for n in ns)
    tail=[n for n in nodes if float(n.get('data-measure'))>end]
    if len(stitch(tail).split())>=8:
     streams[key]=[n for n in nodes if n not in tail];streams[('shared-ending','1',part,voice)]=tail
     r['notes'].append('Unlabelled ending follows the numbered verses; shown separately. Consult score for repetitions.')
   except ValueError:pass
 seen=set()
 for (section,number,part,voice),nodes in streams.items():
  text=stitch(nodes)
  if not text or (section,number,text) in seen:continue
  if part in descants:
   r['alternateLyrics'].append({'part':part,'voice':voice,'number':number,'label':'Descant','text':text});continue
  seen.add((section,number,text));item={'number':number,'text':text,'sourcePart':part,'sourceVoice':voice,'kind':'note-lyrics'}
  item['label']='Shared ending' if section=='shared-ending' else 'Refrain' if section=='refrain' else 'Verse '+number
  r['refrains' if section!='verse' else 'verses'].append(item)
 if r['alternateLyrics']:r['extractionDecisions'].append('Explicitly named Descant part retained separately from main verses; lyric row numbers in that part are not additional verses.')
 r['sourceTextBlocks']=[clean(''.join(c.itertext())) for c in root.findall('credit')]
 for credit in root.findall('.//credit-words'):
  text=(credit.text or '').replace('\\n','\n')
  if not re.match(r'^\s*\d+\.\s+\S',text):continue
  for m in re.finditer(r'(?:^|\n)\s*(\d+)\.\s+(.+?)(?=\n\s*\d+\.\s|\Z)',text,re.S):
   n,t=m.group(1),clean(m.group(2));existing=[v for v in r['verses'] if v['number']==n]
   if any(clean(v['text'])==clean(t) for v in existing):continue
   if existing:r['notes'].append('Numbered text block conflicts with note lyrics for verse '+n+'.')
   r['verses'].append({'number':n,'text':t,'kind':'numbered-text-block'})
 r['verses'].sort(key=lambda v:(int(v['number']) if v['number'].isdigit() else 999,v['number']))
 for n in sorted(set(v['number'] for v in r['verses'])):
  if sum(v['number']==n for v in r['verses'])>1:r['notes'].append('Alternate vocal streams for verse '+n+' are retained separately; consult the score.')
 if len(r['refrains'])>1 and len(set(v['text'] for v in r['refrains']))>1:r['notes'].append('Multiple refrain streams; consult the score for vocal order.')
 if len(set(v.get('sourcePart') for v in r['verses'] if v.get('sourcePart')))>1:r['notes'].append('Lyrics span multiple vocal parts; sung in score order, not expanded performance order.')
 if any('combined' in d.lower() or 'round' in d.lower() for d in directions):r['notes'].append('Part/round performance directions are retained in the score; no performance-order expansion.')
 if any('\ufffd' in v['text'] for v in r['verses']+r['refrains']):r['notes'].append('Source contains replacement characters.')
 if r['verses'] or r['refrains']:r['status']='needs-review' if r['notes'] else 'extracted'
 r['available']=bool(r['verses'] or r['refrains']) and not any(any(token in note for token in ['Alternate vocal','Multiple refrain','multiple vocal','conflicts']) for note in r['notes'])
 records.append(r)
Path('assets/lyrics.json').write_text(json.dumps({'schemaVersion':1,'policy':'Derived source-order text; not independently proofread. No repeat expansion.','songs':records},ensure_ascii=False,indent=2)+'\n',encoding='utf8')
Path('lyrics-index.js').write_text('export const lyricIds=new Set('+json.dumps([r['id'] for r in records if r.get('available')])+');\n',encoding='utf8')
audit={'published':sum(r.get('available',False) for r in records),'explicitRefrain':sum(any(v.get('label')=='Refrain' for v in r['refrains']) for r in records),'total':len(records),'structured':sum(s.get('scoreType')!='pdf' for s in catalog),'extracted':sum(r['status']=='extracted' for r in records),'needsReview':sum(r['status']=='needs-review' for r in records),'multipleVerses':sum(len(set(v['number'] for v in r['verses']))>1 for r in records),'refrainDetected':sum(bool(r['refrains']) for r in records),'noLyrics':[r['id'] for r in records if r['status']=='no-lyrics'],'review':[{'id':r['id'],'title':r['title'],'notes':r['notes']} for r in records if r['notes'] and r['status']!='no-lyrics']}
Path('lyrics-extraction-audit.json').write_text(json.dumps(audit,ensure_ascii=False,indent=2)+'\n',encoding='utf8');print(json.dumps(audit,ensure_ascii=True))
