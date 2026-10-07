"""Derive portable lyrics JSON from a song catalog and local MusicXML/MXL files.
Run node catalog export, then: python tools/extract-lyrics.py catalog.json
No source score is changed. Score order is retained; repeats are not expanded.
"""
import sys,json,re,zipfile,xml.etree.ElementTree as ET
from pathlib import Path
from collections import defaultdict
catalog=json.loads(Path(sys.argv[1]).read_text(encoding='utf-8-sig'))
# Optional IDs refresh only reviewed cases, preserving all other published records.
selected=set(sys.argv[2:])
if selected:catalog=[song for song in catalog if song['id'] in selected]
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
  previous_double=False
  for measure_index,measure in enumerate(part.findall('measure')):
   for element in measure:
    if element.tag=='direction':
     for w in element.findall('.//words'):
      text=clean(w.text or '');directions.append(text)
      if re.fullmatch(r'(chorus|refrain)[:.]?',text,re.I):section=text.rstrip(':.').lower()
    if element.tag=='note':
     note_index+=1
     for l in element.findall('lyric'):
      if any(clean(t.text or '') and not re.fullmatch(r'[—–-]+',clean(t.text or '')) for t in l.findall('text')):
       l.set('data-measure',str(note_index))
       l.set('data-bar',str(measure_index))
       l.set('data-after-double',str(previous_double))
       # A named chorus is structural metadata, even when number=1/2 is present.
       name=(l.get('name') or '').strip().lower()
       lyric_section=name if name in ('verse','chorus','refrain') else section
       number=l.get('number') or (name if name.isdigit() else '1')
       streams[(lyric_section,number,part.get('id'),element.findtext('voice','1'))].append(l)
   previous_double=measure.findtext('barline/bar-style')=='light-light'
 # Conservative unlabelled chorus: simultaneous printed numbered verses end
 # together, then a new unnumbered lyric row starts beyond a double bar.
 # A continuing row or a printed new verse number is not enough evidence.
 for key,nodes in list(streams.items()):
  if key[0]!='verse' or key[2] in descants:continue
  # Syllabic metadata precedes text in XML; inspect only the printed text.
  numbered=[(k,ns) for k,ns in streams.items() if k[0]=='verse' and k[2:]==key[2:] and re.match(r'^\s*\d+\.', ''.join(t.text or '' for t in ns[0].findall('text')))]
  if len(numbered)<2 or any(k==key for k,ns in numbered):continue
  starts={ns[0].get('data-bar') for k,ns in numbered};ends={ns[-1].get('data-bar') for k,ns in numbered}
  start=int(nodes[0].get('data-bar'))
  if len(starts)!=1 or len(ends)!=1 or start!=int(next(iter(ends)))+1 or nodes[0].get('data-after-double')!='True' or len(stitch(nodes).split())<8:continue
  for candidate,lyrics in list(streams.items()):
   if candidate[0]=='verse' and int(lyrics[0].get('data-bar'))==start and not re.match(r'^\s*\d+\.', ''.join(t.text or '' for t in lyrics[0].findall('text'))):
    streams[('chorus',*candidate[1:])]=streams.pop(candidate)
  r['extractionDecisions'].append('Unnumbered section after a double bar follows coextensive printed verses; principal chorus and alternate vocal streams separated.')
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
 # Principal repeated text follows the principal verse voice. Short secondary rows
 # (including verse-specific substitutions) are alternate text, not extra verses.
 repeated_primary={}
 for section in ('chorus','refrain'):
  candidates=[key for key in streams if key[0]==section and key[2] not in descants]
  if candidates:
   repeated_primary[section]=max(candidates,key=lambda key:(sum(len(nodes) for k,nodes in streams.items() if k[0]=='verse' and k[2:]==key[2:]),len(stitch(streams[key]))))
 seen=set()
 for (section,number,part,voice),nodes in streams.items():
  text=stitch(nodes)
  if not text or (section,number,text) in seen:continue
  if part in descants:
   r['alternateLyrics'].append({'part':part,'voice':voice,'number':number,'label':'Descant','text':text});continue
  principal=repeated_primary.get(section)
  if principal and ((part,voice)!=principal[2:] or (number!=principal[1] and len(text)<len(stitch(streams[principal]))/2)):
   r['alternateLyrics'].append({'part':part,'voice':voice,'number':number,'label':'Alternate '+section,'text':text})
   continue
  seen.add((section,number,text));item={'number':number,'text':text,'sourcePart':part,'sourceVoice':voice,'kind':'note-lyrics'}
  item['label']='Shared ending' if section=='shared-ending' else section.title() if section in ('chorus','refrain') else 'Verse '+number
  r['refrains' if section!='verse' else 'verses'].append(item)
 if any(v['label']=='Descant' for v in r['alternateLyrics']):r['extractionDecisions'].append('Explicitly named Descant part retained separately from main verses; lyric row numbers in that part are not additional verses.')
 if any(v['label'].startswith('Alternate ') for v in r['alternateLyrics']):r['extractionDecisions'].append('Secondary repeated-section lyrics retained separately; they do not define principal verses or chorus text.')
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
if selected:
 existing=json.loads(Path('assets/lyrics.json').read_text(encoding='utf8'))
 replacements={r['id']:r for r in records}
 existing['songs']=[replacements.pop(r['id'],r) for r in existing['songs']]
 existing['songs'].extend(replacements.values())
 Path('assets/lyrics.json').write_text(json.dumps(existing,ensure_ascii=False,indent=2)+'\n',encoding='utf8')
 Path('lyrics-index.js').write_text('export const lyricIds=new Set('+json.dumps([r['id'] for r in existing['songs'] if r.get('available')])+');\n',encoding='utf8')
 print(json.dumps({'refreshed':[r['id'] for r in records]}));sys.exit(0)
Path('assets/lyrics.json').write_text(json.dumps({'schemaVersion':1,'policy':'Derived source-order text; not independently proofread. No repeat expansion.','songs':records},ensure_ascii=False,indent=2)+'\n',encoding='utf8')
Path('lyrics-index.js').write_text('export const lyricIds=new Set('+json.dumps([r['id'] for r in records if r.get('available')])+');\n',encoding='utf8')
audit={'published':sum(r.get('available',False) for r in records),'explicitRefrain':sum(any(v.get('label')=='Refrain' for v in r['refrains']) for r in records),'total':len(records),'structured':sum(s.get('scoreType')!='pdf' for s in catalog),'extracted':sum(r['status']=='extracted' for r in records),'needsReview':sum(r['status']=='needs-review' for r in records),'multipleVerses':sum(len(set(v['number'] for v in r['verses']))>1 for r in records),'refrainDetected':sum(bool(r['refrains']) for r in records),'noLyrics':[r['id'] for r in records if r['status']=='no-lyrics'],'review':[{'id':r['id'],'title':r['title'],'notes':r['notes']} for r in records if r['notes'] and r['status']!='no-lyrics']}
Path('lyrics-extraction-audit.json').write_text(json.dumps(audit,ensure_ascii=False,indent=2)+'\n',encoding='utf8');print(json.dumps(audit,ensure_ascii=True))
