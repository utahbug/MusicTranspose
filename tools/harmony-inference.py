"""Development-time, conservative SATB accompaniment reduction. No runtime analysis.
Run: python tools/harmony-inference.py [--check]. Approved pilots/Christmas plus the explicitly listed Phase 3A batch.
"""
import collections, hashlib, html, json, math, pathlib, re, runpy, subprocess, sys, zipfile
import xml.etree.ElementTree as ET
ROOT=pathlib.Path(__file__).resolve().parents[1]
PRIORITY=[2,7,30,62,100,108,193,246,270,292,301,307,202,203,204,206,207,208,209,212,213]
PILOTS=[204,202,2,193,30]
CHRISTMAS=[203,206,207,208,209,212,213]
BATCH_3A=[3,6,19,21,26,27,29,34,35,36,58,60,68,85,89,92,94,96,97,98,103,104,105,111,125,131,134,136,140,141]
NAT={'C':0,'D':2,'E':4,'F':5,'G':7,'A':9,'B':11}
VOCAB={'major':(0,4,7),'minor':(0,3,7),'dominant':(0,4,7,10),'major-seventh':(0,4,7,11),'diminished':(0,3,6),'augmented':(0,4,8)}
SUFFIX={'major':'','minor':'m','dominant':'7','major-seventh':'maj7','diminished':'dim','augmented':'aug'}
def text(n,path,default=''): return n.findtext(path,default)
def source(song):
 with zipfile.ZipFile(ROOT/song['asset']) as z:
  container=ET.fromstring(z.read('META-INF/container.xml'))
  entry=next(e.attrib['full-path'] for e in container.iter() if e.tag.endswith('rootfile') and e.attrib.get('media-type')=='application/vnd.recordare.musicxml+xml')
  return z.read(entry).decode('utf-8')
def spelling(pc,fifths):
 names=['C','Db','D','Eb','E','F','Gb','G','Ab','A','Bb','B'] if fifths<0 else ['C','C#','D','D#','E','F','F#','G','G#','A','A#','B']
 return names[pc%12]
def spec(name): return {'step':name[0],'alter':name.count('#')-name.count('b')}
def extract(xml):
 doc=ET.fromstring(xml);out=[]
 for pi,part in enumerate(doc.findall('part')):
  divisions=1;fifths=0;mode='major';beats=4;unit=4
  for mi,m in enumerate(part.findall('measure')):
   at=last=0
   if mi>=len(out):out.append({'measure':mi,'number':m.get('number'), 'notes':[], 'duration':0})
   row=out[mi]
   for n in m:
    if n.tag=='attributes':
     divisions=float(text(n,'divisions',divisions));fifths=int(text(n,'key/fifths',fifths));mode=text(n,'key/mode',mode);beats=int(text(n,'time/beats',beats));unit=int(text(n,'time/beat-type',unit))
    duration=float(text(n,'duration',0))/divisions
    if n.tag=='backup':at-=duration
    if n.tag=='forward':at+=duration
    if n.tag=='note' and n.find('grace') is None:
     start=last if n.find('chord') is not None else at
     pitch=n.find('pitch')
     if pitch is not None:
      name=text(pitch,'step');alter=int(text(pitch,'alter',0));midi=(int(text(pitch,'octave'))+1)*12+NAT[name]+alter
      row['notes'].append({'at':start,'end':start+duration,'duration':duration,'midi':midi,'part':pi})
     if n.find('chord') is None:last=at;at+=duration
     row['duration']=max(row['duration'],start+duration)
   if pi==0:row.update(fifths=fifths,mode=mode,beats=beats,unit=unit)
 return out

def infer(xml):
 measures=extract(xml);windows=[]
 for m in measures:
  beat=4/m['unit'];step=beat*(3 if m['beats'] in [3,6,9,12] else 2)
  boundaries={0,m['duration'],*[i*step for i in range(1,math.ceil(m['duration']/step))]}
  onsets=sorted({0,m['duration'],*[n['at'] for n in m['notes']]})
  bass_segments=[]
  for a,b in zip(onsets,onsets[1:]):
   sounding=[n['midi'] for n in m['notes'] if n['at']<=a and n['end']>a]
   bass=min(sounding) if sounding else None
   if bass_segments and bass_segments[-1][2]==bass:bass_segments[-1][1]=b
   else:bass_segments.append([a,b,bass])
  for a,b,bass in bass_segments:
   if a and b-a>=.75:boundaries.add(a)
  # Preserve a supported dominant seventh even over a held cadential bass.
  for a,b in zip(onsets,onsets[1:]):
   pcs={n['midi']%12 for n in m['notes'] if n['at']<=a and n['end']>a}
   sounding=[n['midi'] for n in m['notes'] if n['at']<=a and n['end']>a]
   bass=min(sounding)%12 if sounding else None
   dominant=any({r,(r+4)%12,(r+10)%12}<=pcs for r in pcs)
   rooted_triad=bass==(7*m['fifths']+7)%12 and any({bass,(bass+third)%12,(bass+7)%12}<=pcs for third in [3,4])
   if b-a>=.5 and dominant or b-a>=1 and rooted_triad:boundaries.add(a)
  for t,end in zip(sorted(boundaries),sorted(boundaries)[1:]):
   weights=collections.defaultdict(float);bassweights=collections.defaultdict(float)
   active=[n for n in m['notes'] if n['at']<end and n['end']>t]
   for n in active:
    overlap=min(n['end'],end)-max(n['at'],t)
    # Short moving voices contribute, but do not overturn sustained structural tones.
    w=overlap*(.4 if n['duration']<(end-t)*.6 else 1)
    weights[n['midi']%12]+=w
   for a,b in zip(sorted({t,end,*[max(t,n['at']) for n in active],*[min(end,n['end']) for n in active]})[:-1],sorted({t,end,*[max(t,n['at']) for n in active],*[min(end,n['end']) for n in active]})[1:]):
    sounding=[n['midi'] for n in active if n['at']<=a+1e-6 and n['end']>a+1e-6]
    if sounding:bassweights[min(sounding)%12]+=b-a
   bass=max(bassweights,key=bassweights.get) if bassweights else None;total=sum(weights.values()) or 1
   tonic=(7*m['fifths']+(9 if m['mode']=='minor' else 0))%12;scale={(tonic+i)%12 for i in ([0,2,3,5,7,8,10] if m['mode']=='minor' else [0,2,4,5,7,9,11])}
   choices=[]
   for root in range(12):
    for kind,intervals in VOCAB.items():
     tones={(root+i)%12 for i in intervals};third=(root+intervals[1])%12
     if weights[root]<=0 or weights[third]<=0:continue
     if (kind in ['diminished','augmented'] or bass!=root) and weights[(root+intervals[2])%12]<=0:continue
     if len(intervals)==4 and weights[(root+intervals[3])%12]/total<.13:continue
     coverage=sum(weights[p] for p in tones)/total
     score=coverage*3+(0.45 if bass==root else .16 if bass in tones else -.5)+(len(tones&scale)/len(tones))*.15
     # Prefer the simpler triad unless the seventh has substantial duration.
     if len(intervals)==4:score-=.08
     choices.append({'root':root,'kind':kind,'coverage':coverage,'score':score,'bass':bass,'tones':tones})
   windows.append({'m':m,'at':t,'end':end,'choices':sorted(choices,key=lambda c:(-c['score'],c['root'],c['kind'])),'weights':dict(weights),'bass':bass})
 # Context rewards stable harmony, weak-beat continuity, and supported V -> I cadences.
 local_best=[w['choices'][0] if w['choices'] else None for w in windows]
 for i,w in enumerate(windows):
  for c in w['choices']:
   for n in [local_best[i-1] if i else None,local_best[i+1] if i+1<len(windows) else None]:
    if n:
     if (c['root'],c['kind'])==(n['root'],n['kind']):c['score']+=.12
   if i+1<len(windows) and windows[i+1]['choices']:
    n=local_best[i+1]
    if (c['root']-n['root'])%12==7 and c['kind'] in ['major','dominant']:c['score']+=.08
  w['choices'].sort(key=lambda c:(-c['score'],c['root'],c['kind']))
 events=[];reviews=[];previous=None
 for i,w in enumerate(windows):
  m=w['m'];cs=w['choices'];best=cs[0] if cs else None
  margin=best['score']-cs[1]['score'] if len(cs)>1 else 1
  tonic=(7*m['fifths']+(9 if m['mode']=='minor' else 0))%12
  incomplete=len([v for v in w['weights'].values() if v>0])<3
  cadence=previous and previous['kind'] in ['major','dominant'] and best and (previous['rootPC']-best['root'])%12==7 and best['bass']==best['root']
  supported_dyad=best and best['root']==tonic and best['bass']==tonic or cadence
  if not best or best['coverage']<.76 or margin<.12 or (incomplete and not supported_dyad):
   reviews.append({'measure':m['number'],'offset':w['at'],'reason':'Omitted: incomplete/ambiguous structural harmony','candidate':spelling(best['root'],m['fifths'])+SUFFIX[best['kind']] if best else None,'coverage':round(best['coverage'],3) if best else 0});continue
  key=(best['root'],best['kind']);prevkey=previous and (previous['rootPC'],previous['kind'])
  # Keep a prior dominant seventh through a passing seventh omission.
  if previous and previous['measure']==m['measure'] and previous['rootPC']==best['root'] and previous['kind']=='dominant' and best['kind']=='major':continue
  if key==prevkey and (not previous['bass'] or best['bass']!=best['root']):continue
  # A one-beat excursion on a weak beat returning to the preceding chord is ornamental.
  nextbest=windows[i+1]['choices'][0] if i+1<len(windows) and windows[i+1]['choices'] else None
  if w['at']%2 and previous and nextbest and best['kind']!='dominant' and best['bass']==nextbest['bass'] and (nextbest['root'],nextbest['kind'])==prevkey and best['coverage']<.98:
   reviews.append({'measure':m['number'],'offset':w['at'],'reason':'Retained previous harmony through short weak-beat motion'});continue
  root=spelling(best['root'],m['fifths']);bass=best['bass'];bassname=spelling(bass,m['fifths']) if bass is not None else None
  inversion=bass in best['tones'] and bass!=best['root'] and w['end']-w['at']>=1
  event={'measure':m['measure'],'sourceMeasure':m['number'],'offset':w['at'],'root':spec(root),'rootPC':best['root'],'kind':best['kind'],'bass':spec(bassname) if inversion else None,'label':root+SUFFIX[best['kind']]+('/'+bassname if inversion else ''),'bassNote':bassname,'keyFifths':m['fifths'],'pitchCoverage':round(min(1,best['coverage']),3),'review':'Heuristic accompaniment, not authoritative; pitch coverage is not a confidence probability'+(' (inversion)' if inversion else '')}
  events.append(event);previous=event
 return {'events':events,'review':reviews}

def main():
 if '--analyze' in sys.argv:
  path=pathlib.Path(sys.argv[sys.argv.index('--analyze')+1])
  xml=source({'asset':str(path.resolve())}) if path.suffix.lower()=='.mxl' else path.read_text(encoding='utf8')
  print(json.dumps(infer(xml),ensure_ascii=False,indent=2));return
 songs=json.loads(subprocess.check_output(['node','--input-type=module','-e',"import {songs} from './songs.js';console.log(JSON.stringify(songs))"],cwd=ROOT))
 inventory=[];overlays={};reports=[];display_reports=[]
 display_tools=runpy.run_path(str(ROOT/'tools/harmony-display.py'));simplify=display_tools['simplify']
 # Explicit rollout scope; the reusable policy itself has no song-specific rules.
 display_ids={'song-a13c43da-0243-4019-ad08-d7be530074f5','faithful'}
 for number in PRIORITY:
  song=next(s for s in songs if s['collection']=='Hymns (1985)' and s['page']==str(number));xml=source(song);d=ET.fromstring(xml)
  harmonies=d.findall('.//harmony');words=[n.text or '' for n in d.findall('.//direction-type/words')];chords=[w for w in words if re.fullmatch(r'\s*[A-G][#b♭♯]?(?:m|maj7|7|dim|aug)?(?:/[A-G][#b♭♯]?)?\s*',w)]
  inventory.append({'number':number,'id':song['id'],'title':song['title'],'asset':song['asset'],'harmonyCount':len(harmonies),'chordText':chords,'status':'source' if harmonies or chords else 'none','sourceSha256':hashlib.sha256((ROOT/song['asset']).read_bytes()).hexdigest()})
  if number in PILOTS and not harmonies and not chords:
   result=infer(xml);display=simplify(result['events'],extract(xml)) if song['id'] in display_ids else {'events':result['events'],'decisions':[],'suppressionCounts':{}}
   display_reports.append({'number':number,'id':song['id'],'analysisCount':len(result['events']),'displayCount':len(display['events']),'review':result['review'],**display})
   overlays[song['id']]={'provenance':'generated','version':1,'xmlSha256':hashlib.sha256(xml.encode()).hexdigest(),'events':[{k:e[k] for k in ['measure','offset','root','kind','bass']} for e in display['events']]};reports.append({'number':number,'id':song['id'],'title':song['title'],**result})
 for song_id,expected in {'song-9260b8f2-70a4-4755-9ab9-cf51a16c9cb6': '8dbb3b8f45c21cb0a6536b7cda485372d204d26404d519673a97f421cc95547e', 'song-a66f2976-c2a3-4edd-9651-fa5e829b053a': '6cd906193f2fc108e5172ebc75a26d72c7ef0985383591ba0f66da74cda29cc1', 'silent-night': '9bab4c0630f76e8e9cde12db50ebff7442cd478f4ba544857f8a417b37820957'}.items():
  actual=hashlib.sha256(json.dumps(overlays[song_id],sort_keys=True,separators=(',',':')).encode()).hexdigest()
  if actual!=expected:raise RuntimeError('STOP: approved harmony overlay changed: '+song_id)
 root_reports=[]
 for r in display_reports:
  xml=source(next(s for s in songs if s['id']==r['id']))
  root=display_tools['root_only_display'](r['events'],extract(xml),local_density=r['id'] in display_ids)
  positions={m['number']:m['measure'] for m in extract(xml)}
  outcomes=[]
  for w in r['review']:
   position=(positions[w['measure']],w['offset'])
   prior=[e for e in r['events'] if (e['measure'],e['offset'])<=position];after=[e for e in root['events'] if (e['measure'],e['offset'])<=position]
   a=prior[-1]['label'] if prior else None;b=after[-1]['label'] if after else None
   outcomes.append({'measure':w['measure'],'offset':w['offset'],'previousDisplay':a,'display':b,'rootQualityChanged':(a.split('/')[0] if a else None)!=b})
  root_reports.append({'number':r['number'],'id':r['id'],'review':r['review'],'reviewDisplayOutcomes':outcomes,**root})
  overlays[r['id']]['events']=[{k:e[k] for k in ['measure','offset','root','kind','bass']} for e in root['events']]
 # Lock all five physically approved Phase 1C overlays before adding this batch.
 for song_id,expected in {'song-a13c43da-0243-4019-ad08-d7be530074f5': '82173c9413ee72a9aa1262b33a57713d07113f6382a51a31861d4f1555978659', 'song-9260b8f2-70a4-4755-9ab9-cf51a16c9cb6': 'ddf6363e7ec2b3ed8c1ffa15540336b20afd19e3fe92bc46a14b01c14467d46b', 'song-a66f2976-c2a3-4edd-9651-fa5e829b053a': 'bd344a71be2850f9d2da7930986579e2819062e78ff0b248290b456938816d7d', 'faithful': '29cffe55e2962bb7a6fdd6cb4425fd534d0577468357ad52fb6f7627af73b415', 'silent-night': '9bab4c0630f76e8e9cde12db50ebff7442cd478f4ba544857f8a417b37820957'}.items():
  actual=hashlib.sha256(json.dumps(overlays[song_id],sort_keys=True,separators=(',',':')).encode()).hexdigest()
  if actual!=expected:raise RuntimeError('STOP: approved Phase 1C overlay changed: '+song_id)
 christmas=[]
 for number in CHRISTMAS:
  item=next(i for i in inventory if i['number']==number)
  if item['status']=='source':
   christmas.append({**item,'skipped':'Authoritative source harmony takes precedence'});continue
  song=next(s for s in songs if s['id']==item['id']);xml=source(song);measures=extract(xml)
  analysis=infer(xml);display=simplify(analysis['events'],measures)
  root=display_tools['root_only_display'](display['events'],measures,local_density=True)
  overlays[song['id']]={'provenance':'generated','version':1,'xmlSha256':hashlib.sha256(xml.encode()).hexdigest(),'events':[{k:e[k] for k in ['measure','offset','root','kind','bass']} for e in root['events']]}
  christmas.append({**item,'analysis':analysis,'displaySimplification':display,'rootDisplay':root})
 christmas_html=['<!doctype html><meta charset="utf-8"><title>Christmas harmony Phase 2</title><style>body{font:16px system-ui;max-width:1100px;margin:30px auto;padding:16px}td,th{padding:5px 10px;text-align:left;border-bottom:1px solid #ddd}table{border-collapse:collapse}code{font-size:12px}</style><h1>Phase 2: seven Christmas hymns</h1><p>Existing analysis and display policies reused unchanged. Five approved pilot overlays are fingerprint-locked. Source assets, rendering and runtime injection are unchanged. These are inferred accompaniment suggestions, not authoritative harmony. All offsets below are quarter-note units and source measure labels are preserved.</p>']
 for r in christmas:
  christmas_html.append(f'<h2>{r["number"]} — {html.escape(r["title"])}</h2><p><code>{r["id"]}</code>; native harmony: {r["harmonyCount"]}; source chord text: {len(r["chordText"])}.</p>')
  if 'skipped' in r:christmas_html.append('<p>'+r['skipped']+'</p>');continue
  a=r['analysis'];d=r['displaySimplification'];out=r['rootDisplay']
  christmas_html.append(f'<p>Analysis: {len(a["events"])}; displayed: {out["displayCount"]}; first-stage suppression: {len(a["events"])-len(d["events"])}; root-only deduplication: {out["slashDuplicates"]}; local-density suppression: {out["localSuppressed"]}; displayed slashes: 0; review windows: {len(a["review"])}.</p><table><tr><th>Measure</th><th>Offset</th><th>Displayed chord</th><th>Internal bass</th></tr>')
  for e in out['events']:christmas_html.append(f'<tr><td>{e["sourceMeasure"]}</td><td>{e["offset"]}</td><td>{e["label"]}</td><td>{e["bassNote"]}</td></tr>')
  christmas_html.append('</table><h3>Dense passages retained for musical review</h3><ul>')
  for e in out['remainingDense']:christmas_html.append('<li>'+e['measure']+': '+html.escape(' → '.join(x['chord'] for x in e['events']))+'. '+e['reason']+'</li>')
  christmas_html.append('</ul><h3>Uncertainty windows</h3><ul>')
  for e in a['review']:christmas_html.append('<li>'+html.escape(str(e))+'</li>')
  christmas_html.append('</ul>')
 christmas_html='\n'.join(christmas_html)+'\n'
 # The complete twelve-song accepted baseline must remain event-equivalent.
 if hashlib.sha256(json.dumps(overlays,sort_keys=True,separators=(',',':')).encode()).hexdigest()!='f7628e168f2140c51415ea105285296d96cf0b7205e74a29a94abbc7ae3b7cfe':raise RuntimeError('STOP: approved twelve-song baseline changed')
 batch=[]
 for number in BATCH_3A:
  matches=[s for s in songs if s['collection']=='Hymns (1985)' and s['page']==str(number)]
  assert len(matches)==1,('ambiguous catalog number',number)
  song=matches[0];xml=source(song);doc=ET.fromstring(xml)
  harmonies=doc.findall('.//harmony');chords=[n.text or '' for n in doc.findall('.//direction-type/words') if re.fullmatch(r'\s*[A-G][#b♭♯]?(?:m|maj7|7|dim|aug)?(?:/[A-G][#b♭♯]?)?\s*',n.text or '')]
  item={'number':number,'id':song['id'],'title':song['title'],'asset':song['asset'],'harmonyCount':len(harmonies),'chordText':chords,'sourceSha256':hashlib.sha256((ROOT/song['asset']).read_bytes()).hexdigest()}
  if harmonies or chords:batch.append({**item,'skipped':'Authoritative source harmony'});continue
  measures=extract(xml);analysis=infer(xml);display=simplify(analysis['events'],measures);out=display_tools['root_only_display'](display['events'],measures,local_density=True)
  tonic=(7*measures[0]['fifths']+(9 if measures[0]['mode']=='minor' else 0))%12
  flags=[]
  if any(len(e['events'])>=4 for e in out['remainingDense']):flags.append('4+ symbols in a measure')
  if out['denseAfter']>=3:flags.append('Several measures with 3+ symbols')
  if len(analysis['review'])>=10:flags.append('10+ uncertainty/review windows')
  if any(e['kind'] in ['augmented','major-seventh'] for e in out['events']):flags.append('Augmented/major-seventh interpretation')
  if out['events'][0]['rootPC']!=tonic or out['events'][-1]['rootPC']!=tonic:flags.append('Non-tonic opening or ending')
  # Secondary/chromatic roots/thirds and diminished chords warrant alternate-key inspection.
  scale={(tonic+x)%12 for x in [0,2,4,5,7,9,11]}
  chromatic=any(e['rootPC'] not in scale or (e['rootPC']+(3 if e['kind'] in ['minor','diminished'] else 4))%12 not in scale or e['kind'] in ['diminished','augmented','major-seventh'] for e in out['events'])
  alternate=bool(flags or chromatic or number in [3,6,19,29,125])
  batch.append({**item,'originalKey':spelling(tonic,measures[0]['fifths'])+' '+measures[0]['mode'],'analysis':analysis,'displaySimplification':display,'rootDisplay':out,'reviewFlags':flags,'alternateRender':alternate})
  overlays[song['id']]={'provenance':'generated','version':1,'xmlSha256':hashlib.sha256(xml.encode()).hexdigest(),'events':[{k:e[k] for k in ['measure','offset','root','kind','bass']} for e in out['events']]}
 batch_html=['<!doctype html><meta charset="utf-8"><title>Harmony Phase 3A</title><style>body{font:15px system-ui;max-width:1200px;margin:30px auto;padding:16px}td,th{padding:6px;border-bottom:1px solid #ddd;text-align:left}table{border-collapse:collapse}code{font-size:12px}</style><h1>Phase 3A: 30 priority hymns</h1><p>Frozen calibrated analysis/display policy. Twelve accepted overlays locked. Generated accompaniment is inferred, not authoritative; physical review remains necessary. All offsets are quarter-note units. Source MXL and PDFs are unchanged. See <a href="harmony-batch3a-validation.html">render validation and review priorities</a>.</p>']
 for r in batch:
  batch_html.append(f'<h2>{r["number"]} — {html.escape(r["title"])}</h2><p><code>{r["id"]}</code>; native harmony {r["harmonyCount"]}; chord text {len(r["chordText"])}.</p>')
  if 'skipped' in r:batch_html.append('<p>'+r['skipped']+'</p>');continue
  a=r['analysis'];d=r['displaySimplification'];o=r['rootDisplay']
  batch_html.append(f'<p>{r["originalKey"]}. Analysis {len(a["events"])} → display {o["displayCount"]}; first-stage removals {len(a["events"])-len(d["events"])}; root dedup {o["slashDuplicates"]}; local removals {o["localSuppressed"]}; review windows {len(a["review"])}; 3+ measures {o["denseAfter"]}; generated slashes 0.</p><p>'+html.escape('; '.join(r['reviewFlags']) or 'No initial automated outlier flag')+'</p><table><tr><th>Measure</th><th>Offset</th><th>Chord</th><th>Internal bass</th></tr>')
  for e in o['events']:batch_html.append(f'<tr><td>{e["sourceMeasure"]}</td><td>{e["offset"]}</td><td>{e["label"]}</td><td>{e["bassNote"]}</td></tr>')
  batch_html.append('</table><h3>Dense passages</h3><ul>')
  for e in o['remainingDense']:batch_html.append('<li>'+e['measure']+': '+html.escape(' → '.join(x['chord'] for x in e['events']))+'. '+e['reason']+'</li>')
  batch_html.append('</ul><h3>Uncertainty/review windows</h3><ul>')
  for e in a['review']:batch_html.append('<li>'+html.escape(str(e))+'</li>')
  batch_html.append('</ul>')
 batch_html='\n'.join(batch_html)+'\n'
 refinement=runpy.run_path(str(ROOT/'tools/harmony-refine.py'))['refine'](overlays,batch)
 batch3b_tools=runpy.run_path(str(ROOT/'tools/harmony-batch3b.py'));batch3b=batch3b_tools['extend'](overlays)
 batch3c_tools=runpy.run_path(str(ROOT/'tools/harmony-batch3c.py'));batch3c=batch3c_tools['extend'](overlays)
 nine_tools=runpy.run_path(str(ROOT/'tools/harmony-priority-nine.py'));nine_tools['extend'](overlays)
 batch2_tools=runpy.run_path(str(ROOT/'tools/harmony-expansion-batch2.py'));batch2_tools['extend'](overlays)
 batch3_tools=runpy.run_path(str(ROOT/'tools/harmony-expansion-batch3.py'));batch3_tools['extend'](overlays)
 batch4_tools=runpy.run_path(str(ROOT/'tools/harmony-expansion-batch4.py'));batch4_tools['extend'](overlays)
 batch5_tools=runpy.run_path(str(ROOT/'tools/harmony-expansion-batch5.py'));batch5_tools['extend'](overlays)
 batch6_tools=runpy.run_path(str(ROOT/'tools/harmony-expansion-batch6.py'));batch6_tools['extend'](overlays)
 modulation_tools=runpy.run_path(str(ROOT/'tools/harmony-280.py'));modulation_tools['extend'](overlays)
 batch7_tools=runpy.run_path(str(ROOT/'tools/harmony-expansion-batch7.py'));batch7_tools['extend'](overlays)
 batch8_tools=runpy.run_path(str(ROOT/'tools/harmony-expansion-batch8.py'));batch8_tools['extend'](overlays)
 data=batch8_tools['HEADER']+'export const generatedHarmony = '+json.dumps(overlays,ensure_ascii=False,indent=2)+';\n'
 report=json.dumps({'inventory':inventory,'pilots':reports},ensure_ascii=False,indent=2)+'\n'
 sections=['<!doctype html><meta charset="utf-8"><title>1985 hymn harmony pilot</title><style>body{font:16px system-ui;max-width:1100px;margin:32px auto;padding:0 20px;color:#223}table{border-collapse:collapse;width:100%;font-size:14px}td,th{text-align:left;padding:6px;border-bottom:1px solid #ddd}code{font-size:12px}h2{margin-top:40px}</style><h1>1985 hymnal: five-hymn harmony pilot</h1><p>All 21 sources: zero native harmony elements and zero chord-like direction texts. Five requested pilots, no substitutions. Source MXL assets remain unchanged. These are inferred accompaniment suggestions requiring human musical review before expansion.</p><h2>Architecture and interpretation</h2><p>Development-time SATB analysis uses duration-weighted pitches, lowest sounding bass, key, meter, neighboring harmony and dominant-to-tonic motion. Metrical windows split at sustained bass changes and supported cadential dominants. Short notes are downweighted; unsupported/ambiguous windows are omitted. Repeated harmony is suppressed; a root-position resolution after an inversion is retained. Dense cadential passages can have more than two symbols per measure. Vocabulary supports major, minor, dominant seventh, major seventh, diminished and augmented; the pilot output uses major, minor, dominant seventh and diminished.</p><p>Runtime uses only five precomputed overlays, keyed by stable catalog ID and SHA-256 of unpacked source XML. Any source harmony or chord text takes precedence. A changed source fingerprint disables its old overlay. Injection changes a working copy before the existing transposition and Melody projection pipelines. Generated harmony IDs begin mt-generated-. No extraction, playback, pagination or PDF code changes.</p><p>Regenerate: python tools/harmony-inference.py. Verify: append --check. Analyze another file without adding it: --analyze path/to/score.mxl. Measure index is zero-based; source measure numbers are reproduced verbatim (including pickup 0 and X prefixes). Offsets are quarter-note units from measure start, not printed beat numbers. Pitch coverage is weighted chord-tone agreement, NOT a probability of correctness. Omitted windows are listed separately; a preceding symbol must not be taken as proof of harmony through an uncertain passage.</p><h2>21-source inventory</h2><table><tr><th>Hymn</th><th>Stable ID</th><th>Native / text</th></tr>']
 for r in inventory:sections.append(f'<tr><td>{r["number"]} — {html.escape(r["title"])}</td><td><code>{r["id"]}</code></td><td>{r["harmonyCount"]} / {len(r["chordText"])}</td></tr>')
 sections.append('</table>')
 for r in reports:
  key=spelling((7*r['events'][0]['keyFifths'])%12,r['events'][0]['keyFifths'])+' major'
  sections.append(f'<h2>{r["number"]} — {html.escape(r["title"])}</h2><p>{key}; {len(r["events"])} symbols; {len(r["review"])} omitted/review windows. Opening labelled chord: {r["events"][0]["label"]}; final retained chord: {r["events"][-1]["label"]}.</p><table><tr><th>Index / source measure</th><th>Quarter offset</th><th>Chord</th><th>Bass</th><th>Pitch coverage</th></tr>')
  for e in r['events']:sections.append(f'<tr><td>{e["measure"]} / {e["sourceMeasure"]}</td><td>{e["offset"]}</td><td>{e["label"]}</td><td>{e["bassNote"]}</td><td>{e["pitchCoverage"]}</td></tr>')
  sections.append('</table><h3>Review before expansion</h3><ul>')
  for e in r['review']:sections.append(f'<li>Source measure {e["measure"]}, quarter offset {e["offset"]}: {html.escape(e["reason"])}'+(f'; rejected candidate {e["candidate"]}, coverage {e["coverage"]}' if 'candidate' in e else '')+'.</li>')
  sections.append('</ul>')
 review_html='\n'.join(sections)+'\n'
 display_html=['<!doctype html><meta charset="utf-8"><title>Harmony display simplification</title><style>body{font:16px system-ui;max-width:1050px;margin:30px auto;padding:16px}td,th{padding:5px 12px;text-align:left;border-bottom:1px solid #ddd}table{border-collapse:collapse}</style><h1>Phase 1B: display-only simplification</h1><p>Detailed analysis and review windows are unchanged. The reusable display policy is enabled only for #2 and #202; approved #30/#193/#204 overlays are fingerprint-locked. No runtime, placement, notation-size, or pagination algorithm change. Duration means time to the next analysed harmony, capped at the measure boundary; this is a display heuristic, not proof of every intervening sonority.</p><p>Suppress short returning major sonorities, neighboring bass inversions, and brief dominant excursions returning to a short tonic within an ongoing phrase. Protect chromatic/secondary dominants, other chord qualities, sustained resolutions and cadential slash bass. Remove nonstructural slash bass and then deduplicate identical display chords. No fixed symbol quota.</p>']
 for r in display_reports:
  analysis=next(p for p in reports if p['id']==r['id'])
  r['slashBefore']=sum(bool(e['bass']) for e in analysis['events']);r['slashAfter']=sum(bool(e['bass']) for e in r['events'])
  display_html.append(f'<h2>{r["number"]} — {html.escape(analysis["title"])}</h2><p>Detailed: {r["analysisCount"]}; displayed: {r["displayCount"]}. Slash symbols: {r["slashBefore"]} → {r["slashAfter"]}. Review windows unchanged: {len(r["review"])}.</p><p>{html.escape(str(r["suppressionCounts"]))}</p><table><tr><th>Source measure</th><th>Quarter offset</th><th>Before</th><th>After</th><th>Decision</th></tr>')
  for d in r['decisions']:
   note=d['suppressed'] or ('simplified slash bass' if d['slashRemoved'] else 'retained short important event' if d['shortProtected'] else 'retained')
   display_html.append(f'<tr><td>{d["measure"]}</td><td>{d["offset"]}</td><td>{d["before"]}</td><td>{d["after"] or "—"}</td><td>{note}</td></tr>')
  display_html.append('</table>')
 display_html='\n'.join(display_html)+'\n'
 root_html=['<!doctype html><meta charset="utf-8"><title>Generated harmony Phase 1C</title><style>body{font:16px system-ui;max-width:1100px;margin:30px auto;padding:16px}td,th{padding:5px 10px;text-align:left;border-bottom:1px solid #ddd}table{border-collapse:collapse}</style><h1>Phase 1C: root-only generated accompaniment</h1><p>Only generated display changes. Detailed analysis, bass/inversions, source fingerprints and all 31 uncertainty windows remain unchanged. Authoritative and imported source harmony retain slash bass. Approved #30/#193/#204 receive only slash removal and resulting deduplication. Local-density decisions apply only to #2/#202. Source measure numbers are verbatim; offsets are quarter-note units.</p><p>Dense measures are reviewed for short weak-beat neighbors, intermediate tonic over a cadential bass between predominant and dominant, and short diatonic intermediates. Opening/final changes and chromatic/dominant-seventh/diminished functions are protected; there is no fixed chord-count cap. Placement, scaling, and pagination code are unchanged.</p>']
 for r in root_reports:
  root_html.append(f'<h2>Hymn {r["number"]}</h2><p>Display {r["previousCount"]} → {r["displayCount"]}; slash {r["slashBefore"]} → 0; slash-only duplicates removed {r["slashDuplicates"]}; local-density removals {r["localSuppressed"]}. Measures with 3+ labels: {r["denseBefore"]} → {r["denseAfter"]}.</p><table><tr><th>Measure</th><th>Quarter offset</th><th>Before</th><th>After</th><th>Decision</th></tr>')
  for d in r['decisions']:root_html.append(f'<tr><td>{d["measure"]}</td><td>{d["offset"]}</td><td>{d["before"]}</td><td>{d["after"] or "—"}</td><td>{d["suppressed"] or "retained root/quality"}</td></tr>')
  root_html.append('</table><h3>Remaining dense measures</h3><ul>')
  for d in r['remainingDense']:root_html.append(f'<li>{d["measure"]}: '+html.escape(' → '.join(e['chord'] for e in d['events']))+'. '+d['reason']+'</li>')
  root_html.append('</ul><h3>Existing review windows: displayed context</h3><ul>')
  for d in r['reviewDisplayOutcomes']:root_html.append(f'<li>{d["measure"]}, offset {d["offset"]}: {d["previousDisplay"] or "unlabelled"} → {d["display"] or "unlabelled"}; root/quality changed: {d["rootQualityChanged"]}.</li>')
  root_html.append('</ul>')
 root_html='\n'.join(root_html)+'\n'
 for name,content in [('reports/harmony-batch3c.json',json.dumps(batch3c,ensure_ascii=False,indent=2)+'\n'),('reports/harmony-batch3b.json',json.dumps(batch3b,ensure_ascii=False,indent=2)+'\n'),('reports/harmony-dense-refinement.json',json.dumps(refinement,ensure_ascii=False,indent=2)+'\n'),('reports/harmony-batch3a.json',json.dumps(batch,ensure_ascii=False,indent=2)+'\n'),('reports/harmony-batch3a.html',batch_html),('reports/harmony-christmas.json',json.dumps(christmas,ensure_ascii=False,indent=2)+'\n'),('reports/harmony-christmas.html',christmas_html),('reports/harmony-root-display.html',root_html),('reports/harmony-root-display.json',json.dumps(root_reports,ensure_ascii=False,indent=2)+'\n'),('generated-harmony-data.js',data),('reports/harmony-pilot.json',report),('reports/harmony-pilot.html',review_html),('reports/harmony-display.html',display_html),('reports/harmony-display.json',json.dumps(display_reports,ensure_ascii=False,indent=2)+'\n')]:
  p=ROOT/name
  if '--check' in sys.argv:assert p.read_text(encoding='utf8')==content,name+' is not reproducible'
  else:p.write_text(content,encoding='utf8')
 for r in reports:print(r['number'],len(r['events']),'chords',len(r['review']),'review windows',', '.join(f"{e['sourceMeasure']}:{e['offset']} {e['label']}" for e in r['events']))
if __name__=='__main__':main()
