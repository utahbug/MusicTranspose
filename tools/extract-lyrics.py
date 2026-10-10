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
 # Reviewed HHC #1004: the three printed verses share measures 11–18;
 # measures 19–20 (verses 1/2) and 21 (verse 3) are alternative endings.
 # Both endings sing the same final word, not two consecutive words.
 if song['id']=='hhc-1004':
  part=root.find("part[@id='P1']")
  measures={m.get('number'):m for m in part.findall('measure')}
  first=measures['19'];last=measures['21']
  assert first.find("barline/ending[@type='start']").get('number')=='1, 2'
  assert last.find("barline/ending[@type='start']").get('number')=='3'
  assert measures['3'].find("barline/repeat[@direction='forward']") is not None
  assert measures['20'].find("barline/repeat[@direction='backward']") is not None
  assert stitch(first.findall('.//lyric'))==stitch(last.findall('.//lyric'))=='me.'
  key=('chorus','1','P1','1');nodes=streams[key]
  ending_nodes={id(l) for l in last.findall('.//lyric')}
  chorus=[n for n in nodes if id(n) not in ending_nodes]
  assert stitch(chorus).startswith('As I walk with Jesus') and stitch(chorus).endswith('He will walk with me.')
  assert all(('verse',n,'P1','1') in streams for n in ('1','2','3'))
  streams[key]=chorus
  r['extractionDecisions'].append('Reviewed HHC #1004 repeat structure: verses 1–3 each use the chorus in measures 11–18, with identical final lyric in alternative endings 19–20 (1/2) and 21 (3); final word included once. Notation endings remain unchanged.')
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
 # #1003: voice 2 echoes each opening phrase before voice 1 begins the next.
 # Preserve literal source streams as provenance; only display punctuation is combined.
 if song['id']=='hhc-1003':
  def chorus_phrase(voice,bars):
   return stitch([l for m in root.find("part[@id='P1']").findall('measure') if m.get('number') in bars for n in m.findall('note') if n.findtext('voice','1')==voice for l in n.findall('lyric') if l.get('name')=='chorus'])
  first=chorus_phrase('1',{'16','17'});second=chorus_phrase('1',{'18','19'});last=chorus_phrase('1',{'20','21','22','23'})
  echo1=chorus_phrase('2',{'17','18'});echo2=chorus_phrase('2',{'19','20'})
  assert (first,second,echo1,echo2)==('It is well,','with my soul,','it is well','with my soul;')
  assert len(r['refrains'])==1 and r['refrains'][0]['text']==' '.join([first,second,last])
  assert len(r['alternateLyrics'])==1 and r['alternateLyrics'][0]['text']==echo1+' '+echo2
  chorus=r['refrains'][0];chorus['principalText']=chorus['text']
  chorus['text']=first.rstrip(',')+' ('+echo1+'), '+second.rstrip(',')+' ('+echo2.rstrip(';')+'); '+last
  r['extractionDecisions'].append('Reviewed #1003 onset order: voice 2 echoes in measures 17–18 and 19–20 follow the corresponding main phrases; parenthesized inline. Literal principal and secondary source text retained separately.')
 # #1020 has one echo in measure 12, before the next principal phrase in 13.
 if song['id']=='hhc-1020':
  def response_phrase(voice,bars):
   return stitch([l for m in root.find("part[@id='P1']").findall('measure') if m.get('number') in bars for n in m.findall('note') if n.findtext('voice','1')==voice for l in n.findall('lyric') if l.get('name')=='chorus'])
  opening=response_phrase('1',{'8','9','10','11','12'});ending=response_phrase('1',{'13','14','15','16'});echo=response_phrase('2',{'12'})
  assert opening=='Come home! Come home! Ye who are weary, come home!' and echo=='Come home!'
  assert len(r['refrains'])==1 and r['refrains'][0]['text']==opening+' '+ending
  assert len(r['alternateLyrics'])==1 and r['alternateLyrics'][0]['text']==echo
  chorus=r['refrains'][0];chorus['principalText']=chorus['text'];chorus['text']=opening+' ('+echo+') '+ending
  r['extractionDecisions'].append('Reviewed #1020 onset order: voice 2 responds in measure 12 after the principal home and before Earnestly in measure 13; response parenthesized inline. Literal principal and secondary source text retained separately.')
 # Reviewed #1045: lower-part responses overlap the first two main phrases.
 # Parentheses follow their corresponding phrases, before the unshared final line.
 if song['id']=='hhc-1045':
  def phrase(part,voice,bars):
   return stitch([l for m in root.find("part[@id='"+part+"']").findall('measure') if m.get('number') in bars for n in m.findall('note') if n.findtext('voice','1')==voice for l in n.findall('lyric') if l.get('name')=='chorus'])
  main=r['refrains'][0];first='Come in through Him,';second='Into the fold of God.'
  end=phrase('P1','1',{'X3','14','15','16','17'})
  response1=phrase('P2','2',{'10','11'});response2=phrase('P2','2',{'12','13'})
  assert len(r['refrains'])==1 and main['text']==' '.join([first,second,end])
  assert response1=='Oh, come ye in, come in through Him;' and response2=='Oh, come ye in, all people of the world.'
  assert len(r['alternateLyrics'])==1 and r['alternateLyrics'][0]['text']==response1+' '+response2
  main['principalText']=main['text']
  main['text']=first.rstrip(',')+' ('+response1.rstrip(';')+'); '+second.rstrip('.')+' ('+response2.rstrip('.')+'). '+end
  r['extractionDecisions'].append('Reviewed #1045: P2 voice 2 responds during the principal phrases in measures 10–11 and 12–13; parenthesized at the corresponding phrase boundaries, before Our in X3. These overlapping vocal phrases are not extra verses. Literal principal and secondary streams retained separately.')
 # Reviewed batch 1: explicit chorus metadata is already handled above.
 if song['id']=='song-a13c43da-0243-4019-ad08-d7be530074f5':
  # The source encodes lat/ter/day as begin/middle/end, losing the lexical hyphen.
  nodes=root.findall("part[@id='P1']/measure[@number='X6']/note/lyric[@number='1']")
  assert [n.findtext('text') for n in nodes][:3]==['lat','ter','day']
  verse=next(v for v in r['verses'] if v['number']=='1')
  assert verse['text'].count('latterday')==1
  verse['text']=verse['text'].replace('latterday','latter-day')
 if song['id']=='hhc-1021':
  part=root.find("part[@id='P1']")
  assert part.find("measure[@number='49']/barline/ending[@type='start']").get('number')=='1'
  assert part.find("measure[@number='49']/barline/repeat[@direction='backward']") is not None
  assert part.find("measure[@number='50']/barline/ending[@type='start']").get('number')=='2'
  nodes=[l for m in part.findall('measure') if int(m.get('number'))<50 for n in m.findall('note') for l in n.findall('lyric') if l.get('name')=='chorus']
  first=stitch(nodes);chorus=r['refrains'][0]
  assert len(r['refrains'])==1 and chorus['text']==first+' I know that my Savior loves me.'
  r['refrains']=[{**chorus,'text':first,'verses':['1']},{**chorus,'verses':['2']}]
  r['extractionDecisions'].append('Reviewed #1021: chorus measures 34–48 follows both verses. First ending 49 repeats; second ending 50–54 adds the final phrase only after verse 2. Existing verse-specific chorus disclosures preserve both forms. Optional duet has no additional lyric stream.')
 # These two reviewed scores have identical terminal underlay in alternative
 # endings, followed by an extension only on verse 3. Join each performed path
 # before stitching syllables (especially Allelu-ia across #1209's ending).
 if song['id'] in ('hhc-1070','hhc-1209'):
  part_id,first_bar,final_bar,last_bar=('P1',25,26,28) if song['id']=='hhc-1070' else ('P2',17,18,26)
  part=root.find("part[@id='"+part_id+"']")
  assert part.find("measure[@number='"+str(first_bar)+"']/barline/ending[@type='start']").get('number')=='1, 2'
  assert part.find("measure[@number='"+str(first_bar)+"']/barline/repeat[@direction='backward']") is not None
  assert part.find("measure[@number='"+str(final_bar)+"']/barline/ending[@type='start']").get('number')=='3'
  nodes=[(int(m.get('number')),l) for m in part.findall('measure') for n in m.findall('note') for l in n.findall('lyric') if l.get('name')=='chorus']
  chorus=r['refrains'][0]
  assert len(r['verses'])==3 and len(r['refrains'])==1 and not r['alternateLyrics']
  assert chorus['text']==stitch([l for _,l in nodes])
  terminal='me.' if song['id']=='hhc-1070' else 'ia!'
  assert [l.findtext('text') for bar,l in nodes if bar==first_bar]==[terminal]
  assert next(l.findtext('text') for bar,l in nodes if bar==final_bar)==terminal
  first=stitch([l for bar,l in nodes if bar<=first_bar])
  final=stitch([l for bar,l in nodes if bar!=first_bar])
  r['refrains']=[{**chorus,'text':first,'verses':['1','2'],'principalText':chorus['text']},{**chorus,'text':final,'verses':['3']}]
  r['extractionDecisions'].append('Reviewed '+song['id']+': first ending '+str(first_bar)+' applies to verses 1/2; final ending '+str(final_bar)+' through '+str(last_bar)+' applies only to verse 3. Stitch each source path separately, preserving its terminal word/syllable once and its final extension. Literal unexpanded source stream retained in principalText.')
 if song['id']=='song-00dbf08d-281a-4a99-9a9a-77815f9d9d14':
  # Printed verses 4/5 already include their complete endings (and a distinct
  # comma in verse 5). Preserve those blocks verbatim without a second ending.
  assert len(r['refrains'])==1 and len(r['verses'])==3
  credits=[c.text or '' for c in root.findall('.//credit-words')]
  assert any(t.startswith('4. ') for t in credits) and any(t.startswith('5. ') for t in credits)
  r['refrains'][0]['verses']=['1','2','3']
  r['extractionDecisions'].append('Reviewed Hymns #100: source-marked chorus X10–X15 completes note-lyric verses 1–3. Printed verses 4/5 already contain the entire ending; preserve those complete text blocks exactly and do not repeat the chorus after them.')
 if song['id']=='song-3c0fdae2-06a6-4b1e-af91-18b4b51c9d38':
  main=r['refrains'][0];part=root.find("part[@id='P1']")
  opening=stitch([l for m in part.findall('measure') if m.get('number') in ['X18','X19','X20','X21','X22'] for l in m.findall("note/lyric[@name='chorus']")])
  response=stitch(root.findall("part[@id='P2']/measure/note/lyric[@name='chorus']"))
  assert opening=='The winds and the waves shall obey thy will: Peace, be still.'
  assert response=='Peace, be still, peace, be still.'
  assert len(r['verses'])==3 and len(r['refrains'])==1 and len(r['alternateLyrics'])==1
  assert r['alternateLyrics'][0]['text']==response and main['text'].startswith(opening+' Whether')
  main['principalText']=main['text']
  main['text']=opening.rstrip('.')+' ('+response.rstrip('.')+').'+main['text'][len(opening):]
  r['extractionDecisions'].append('Reviewed Hymns #105: P2 sings Peace, be still twice in X21–X22 during the first sustained P1 Peace, be still. Parenthesize that two-measure secondary stream at its principal phrase boundary, before Whether in X23. Preserve literal principal and secondary streams; no extra Verse 2.')
 if song['id']=='song-54db47df-6f16-441c-ac53-df09cfdb294c':
  main=r['refrains'][0]
  def response_at(bars):
   return stitch([l for m in root.find("part[@id='P2']").findall('measure') if m.get('number') in bars for l in m.findall("note/lyric[@name='chorus']")])
  first=response_at(['X12','X13']);second=response_at(['X16','X17'])
  assert first=='sunshine in your heart,' and second=='will all depart,'
  assert len(r['verses'])==4 and len(r['refrains'])==1 and len(r['alternateLyrics'])==1
  assert r['alternateLyrics'][0]['text']==first+' '+second
  assert main['text'].count('heart, You')==1 and main['text'].count('depart, If')==1
  main['principalText']=main['text']
  main['text']=main['text'].replace('heart, You','heart ('+first.rstrip(',')+'), You',1).replace('depart, If','depart ('+second.rstrip(',')+'), If',1)
  r['extractionDecisions'].append('Reviewed Hymns #228: P2 responses in X12–X13 and X16–X17 finish at beat 3 before the next P1 phrases You and If. Parenthesize each response at its corresponding principal phrase boundary. Literal principal/secondary streams retained; lower lyric row is not an extra Verse 2.')
 if song['id']=='song-d92bb26c-6a08-4beb-a917-b787102678da':
  part=root.find("part[@id='P1']");main=r['refrains'][0]
  for bar,ending in [('X23','1'),('X24','2')]:
   assert part.find("measure[@number='"+bar+"']/barline/ending[@type='start']").get('number')==ending
   assert stitch(part.findall("measure[@number='"+bar+"']/note/lyric[@name='chorus']"))=='King.'
  assert part.find("measure[@number='X23']/barline/repeat[@direction='backward']") is not None
  assert len(r['verses'])==2 and len(r['refrains'])==1 and main['text'].endswith('King. King.')
  main['principalText']=main['text']
  main['text']=stitch([l for m in part.findall('measure') if m.get('number')!='X24' for l in m.findall("note/lyric[@name='chorus']")])
  r['extractionDecisions'].append('Reviewed Hymns #249: alternative endings X23 (first pass) and X24 (second pass) each sing King once. Identical performed chorus text follows both verses; retain literal unexpanded source stream and omit only the duplicate alternative-ending word.')
 if song['id']=='song-630410cd-be22-4d5a-9445-0568b51e397c':
  main=r['refrains'][0];response=stitch(root.findall("part[@id='P2']/measure/note/lyric[@name='chorus']"))
  assert len(r['verses'])==3 and len(r['refrains'])==1 and len(r['alternateLyrics'])==1
  assert response=='Thru Christ, our Lord!' and r['alternateLyrics'][0]['text']==response
  assert main['text'].endswith('Victory, victory, victory, Thru Jesus Christ, our Lord!')
  main['principalText']=main['text'];main['text']=main['text'][:-1]+' ('+response[:-1]+')!'
  r['extractionDecisions'].append('Reviewed Hymns #251: only the final chorus phrase has the delayed P2 response, beginning Thru at X33 beat 3 and finishing Lord in X35 while P1 sustains its final Lord from X34. Parenthesize at that final phrase, not at earlier identical words. Preserve both literal streams; lower lyric row is not Verse 2.')
 if song['id']=='song-ed92d57f-c9cb-402d-852c-f77ae768aa3d':
  main=r['refrains'][0];part=root.find("part[@id='P2']")
  first=stitch(part.findall("measure[@number='X12']/note/lyric[@name='chorus']"));second=stitch(part.findall("measure[@number='X15']/note/lyric[@name='chorus']"))
  assert first=='push along.' and second=='full of song.'
  assert len(r['verses'])==4 and len(r['refrains'])==1 and len(r['alternateLyrics'])==1
  assert r['alternateLyrics'][0]['text']==first+' '+second
  assert main['text'].count('along, Do')==1 and main['text'].count('song, We')==1
  main['principalText']=main['text'];main['text']=main['text'].replace('along, Do','along ('+first[:-1]+'), Do',1).replace('song, We','song ('+second[:-1]+'), We',1)
  r['extractionDecisions'].append('Reviewed Hymns #252: P2 echoes push along in X12 beats 1–3 and full of song in X15 beats 1–3, after each P1 phrase ends at beat 1. Place each response at its own phrase boundary before Do/We; preserve both literal streams, not an extra Verse 2.')
 if song['id']=='hhc-1022':
  assert len(r['verses'])==3 and len(r['alternateLyrics'])==1
  assert r['alternateLyrics'][0]['text']=='footstep,'
  r['extractionDecisions'].append('Reviewed #1022: P2 chorus word footstep in measure 19 begins with the principal word at beat 0, with its second syllable at beat 2 instead of beat 1. This is overlapping underlay, not an echo or extra verse; the word remains in the principal chorus and its literal lower-part stream is retained in alternateLyrics.')
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
 if len(r['refrains'])>1 and len(set(v['text'] for v in r['refrains']))>1 and song['id'] not in ('hhc-1021','hhc-1070','hhc-1209'):r['notes'].append('Multiple refrain streams; consult the score for vocal order.')
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
