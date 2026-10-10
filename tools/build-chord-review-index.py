"""Consolidate saved reports only. No score analysis or chord/data corrections."""
import hashlib,html,json,pathlib,sys
ROOT=pathlib.Path(__file__).resolve().parents[1]
SOURCES=[('Initial nine','chord-priority-nine.json')]+[(f'Batch {n}',f'chord-expansion-batch{n}.json') for n in range(2,7)]+[('Hymn 280 resolution','chord-hymn280.json')]
PRIORITY_POLICY='P1: major-seventh/augmented interpretations, at least 10 omitted windows, or at least 3 overlapping dense-window flags. P2: other retained qualities, dense windows, or summary flags. P3: remaining omissions/review observations. These are session triage rules, not musical-error severity or confidence scores.'
def build():
 harmonic=[];deferred=[];technical=[];sources=[]
 for batch,name in SOURCES:
  raw=(ROOT/'reports'/name).read_text(encoding='utf8');report=json.loads(raw)
  sources.append(dict(batch=batch,file=name,sha256=hashlib.sha256(raw.encode()).hexdigest(),rowCount=len(report['rows']),limitations=report.get('limitations',[])))
  for r in report['rows']:
   events=r['temporalDisplay']['events'];reviews=r['analysis']['review'];omissions=[w for w in reviews if w['reason'].startswith('Omitted:')];other=[w for w in reviews if not w['reason'].startswith('Omitted:')];clusters=r['temporalDisplay']['remainingClusters']
   unusual=[dict(measure=e['sourceMeasure'],offset=e['offset'],chord=e['label'],kind=e['kind']) for e in events if e['kind'] in ['major-seventh','augmented','diminished']]
   warnings=[]
   if omissions:warnings.append(dict(type='Omitted/ambiguous inference',explanation='No chord was assigned to these windows. A preceding label is not evidence of continuing harmony; candidate fields are rejected diagnostics, not suggested corrections.',passages=omissions))
   if other:warnings.append(dict(type='Other inference observations',explanation='Retained verbatim from the saved analysis review.',passages=other))
   if unusual:warnings.append(dict(type='Unusual retained qualities',explanation='Facts derived from saved final display events, including diminished qualities not promoted to a summary flag in some earlier batches. Automated review observations, not confirmed errors.',passages=unusual))
   if clusters:warnings.append(dict(type='Dense retained changes',explanation='Saved temporal-density windows can overlap. Their count is not a count of distinct musical defects or visual collisions.',passages=clusters))
   for flag in r['reviewFlags']:warnings.append(dict(type='Recorded summary flag',explanation=flag,passages=[]))
   high=any(e['kind'] in ['major-seventh','augmented'] for e in unusual) or len(omissions)>=10 or len(clusters)>=3
   priority='P1' if high else 'P2' if unusual or clusters or r['reviewFlags'] else 'P3'
   reasons=[]
   if any(e['kind'] in ['major-seventh','augmented'] for e in unusual):reasons.append('major-seventh/augmented interpretation')
   if len(omissions)>=10:reasons.append('10+ omitted windows')
   if len(clusters)>=3:reasons.append('3+ dense-window flags (may overlap)')
   if not reasons:reasons=['other retained quality/density/summary flag' if priority=='P2' else 'remaining omissions/observations']
   entry=dict(number=r['number'],title=r['title'],batch=batch,sourceReport=name,sourceKey=r['originalKey'],generatedSymbolCount=r.get('generatedSymbolCount',len(events)),omittedWindows=len(omissions),recordedOutcome=r['outcome'],summaryFlags=r['reviewFlags'],reviewPriority=priority,priorityReason='; '.join(reasons),warnings=warnings)
   if r['number']==328:entry['arrangementNote']='Men’s arrangement; independent source and overlay from #13.'
   if r.get('generatedSymbolCount')==0:
    entry.update(reviewPriority='Deferred',priorityReason='Existing runtime modulation restriction; no new analysis performed',diagnosticCandidateCount=len(events),keyChanges=r.get('keyChanges',[]));deferred.append(entry)
   else:
    prior=next((e for e in deferred if e['number']==entry['number']),None)
    if prior:entry['previousDeferral']=prior;deferred.remove(prior)
    harmonic.append(entry)
  for observation in report.get('technicalObservations',[]):technical.append(dict(observation,batch=batch,sourceReport=name))
  for limitation in report.get('limitations',[]):
   if '307 Full-score' in limitation:technical.append(dict(number=307,title=next(r['title'] for r in report['rows'] if r['number']==307),batch=batch,sourceReport=name,passage='Full-score beaming/spacing; precise measure not specified in the original report',observation=limitation,status='Pre-existing source-only control finding; unchanged'))
   if 'lyric crowding in hymn 113' in limitation:technical.append(dict(number=113,title=next(r['title'] for r in report['rows'] if r['number']==113),batch=batch,sourceReport=name,passage='Full view, 820px: rence/awed lyric pair; original report gives no measure',observation=limitation,status='Pre-existing source-only control finding; unchanged'))
 supplement=json.loads((ROOT/'reports/chord-review-supplement.json').read_text(encoding='utf8'));technical.extend(supplement['observations'])
 harmonic.sort(key=lambda r:(r['reviewPriority'],r['number']))
 return dict(title='Consolidated hymn chord review index',scope='Initial nine-hymn priority batch and selected expansion Batches 2-6, plus hymn 280 modulation resolution',status='Automated observations for a later consolidated review session; no chord corrections made during consolidation',priorityPolicy=PRIORITY_POLICY,measureConvention='MusicXML source measure labels are verbatim (including 0, X prefixes and repeat-ending labels). Offsets are quarter-note units from measure start, not printed beat numbers. Pitch coverage is not a confidence probability.',coverage=dict(initialNine=9,selectedTotal=50,selectedCompleted=50,selectedDeferred=0,unexaminedSelected=0,overallGenerated=160,overallNative=1,overallChorded=161,totalHymns=341),sources=sources,technicalSupplement='chord-review-supplement.json',harmonicReview=harmonic,technicalEngraving=technical,deferred=deferred)
def esc(value):return html.escape(str(value),quote=True)
def loc(p):
 if 'start' in p:return f"{p['start']} +{p['startOffset']} to {p['end']} +{p['endOffset']}"
 return f"{p.get('sourceMeasure',p.get('measure','unspecified'))} +{p.get('offset',0)}"
def details(r):
 out=[]
 for w in r['warnings']:
  out.append('<details><summary>'+esc(w['type'])+(' ('+str(len(w['passages']))+')' if w['passages'] else '')+'</summary><p>'+esc(w['explanation'])+'</p>')
  if w['passages']:
   out.append('<ul>')
   for p in w['passages']:
    evidence=p.get('reason') or p.get('chord') or ', '.join(e['chord']+' at '+str(e['measure'])+' +'+str(e['offset']) for e in p.get('events',[]))
    out.append('<li><b>'+esc(loc(p))+'</b>: '+esc(evidence)+'</li>')
   out.append('</ul>')
  out.append('</details>')
 if r.get('previousDeferral'):
  prior=r['previousDeferral'];out.append('<details><summary>Historical deferral — resolved</summary><p>Preserved Batch 2 findings; the runtime restriction described below has now been resolved. Earlier uncertainty observations remain relevant.</p>'+details(prior)+'<a href="'+prior['sourceReport']+'">Original deferral report</a></details>')
 return ''.join(out)
def render(data):
 out=['<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Consolidated hymn chord review</title><style>body{font:16px/1.5 system-ui;color:#20343c;max-width:1400px;margin:auto;padding:24px;background:#f7f8f5}h1{font-size:2rem}table{border-collapse:collapse;width:100%;background:white}th,td{padding:12px;border:1px solid #d0d9dc;vertical-align:top;text-align:left}th{background:#e4eeef}#review tr[hidden]{display:none!important}summary{cursor:pointer;font-weight:600;padding:6px 0}details p{max-width:65ch}a{color:#075b87}nav{display:flex;gap:20px;flex-wrap:wrap}input,select{font:inherit;padding:8px;margin:8px;min-height:44px}label{display:inline-block}.scroll{overflow:auto}td:first-child{min-width:180px}td:last-child{min-width:300px}@media(max-width:900px){#review,#review tbody,#review tr,#review td{display:block}#review thead{display:none}#review tr{border:1px solid #d0d9dc;margin-bottom:16px}#review td{min-width:0;border:0}#review td:first-child{background:#e4eeef}#review td:nth-child(2)::before{content:"Key / counts";display:block;font-weight:600}#review td:nth-child(3)::before{content:"Review priority";display:block;font-weight:600}#review td:last-child::before{content:"Passages and findings";display:block;font-weight:600}}@media print{nav,.filters{display:none}body{padding:0;background:white}table{font-size:11px}details{break-inside:avoid}td{padding:6px}}</style>', '<h1>Consolidated hymn chord review</h1><p>'+esc(data['status'])+'</p><p><strong>50 of the selected 50 completed; #280 modulation resolved. No selected hymns remain unexamined.</strong> The initial nine are also indexed. Overall coverage: 160 generated plus native #70 = 161/341.</p><nav><a href="#harmonic">Harmonic observations</a><a href="#technical">Technical / engraving</a><a href="#deferred">Deferred</a><a href="#sources">Detailed reports</a></nav><p>'+esc(data['measureConvention'])+'</p><p>'+esc(data['priorityPolicy'])+'</p><h2 id="harmonic">Harmonic observations</h2><div class="filters"><label>Find hymn <input id="search" type="search" placeholder="Number, title or batch"></label><label>Priority <select id="priority"><option value="">All</option><option>P1</option><option>P2</option><option>P3</option></select></label><output id="count" aria-live="polite"></output></div><div class="scroll"><table id="review"><thead><tr><th>Hymn / batch</th><th>Key / counts</th><th>Review priority</th><th>Passages and findings</th></tr></thead><tbody>']
 for r in data['harmonicReview']:
  title=str(r['number'])+' — '+r['title']+(' (men’s arrangement)' if r['number']==328 else '');out.append('<tr data-priority="'+r['reviewPriority']+'" data-search="'+esc((title+' '+r['batch']).lower())+'"><td><strong>'+esc(title)+'</strong><br>'+esc(r['batch'])+'<br><a href="'+esc(r['sourceReport'])+'">Detailed JSON</a></td><td>'+esc(r['sourceKey'])+'<br>'+str(r['generatedSymbolCount'])+' symbols<br>'+str(r['omittedWindows'])+' omitted windows</td><td>'+r['reviewPriority']+'<br>'+esc(r['priorityReason'])+'</td><td>'+details(r)+'</td></tr>')
 out.append('</tbody></table></div><h2 id="technical">Technical / engraving findings</h2><p>These are separate from harmonic uncertainties; no engraving changes were made.</p>')
 for r in data['technicalEngraving']:out.append('<article><h3>'+esc(str(r['number'])+' — '+r['title'])+'</h3><p>'+esc(r['passage'])+'</p><p>'+esc(r['observation'])+'</p><p>'+esc(r['status'])+' · '+esc(r['batch'])+' · <a href="'+r['sourceReport']+'">Original report</a></p></article>')
 out.append('<p><a href="chord-review-supplement.json">Preserved historical spacing evidence</a></p><h2 id="deferred">Deferred hymns</h2>')
 if not data['deferred']:out.append('<p>No unresolved hymns remain in the original 59-song priority list. The earlier #280 deferral is preserved under its review entry.</p>')
 for r in data['deferred']:out.append('<article><h3>'+esc(str(r['number'])+' — '+r['title'])+'</h3><p>'+esc(r['batch'])+' · '+esc(r['sourceKey'])+' · 0 published symbols; '+str(r['diagnosticCandidateCount'])+' diagnostic candidates, not deployed.</p>'+details(r)+'<a href="'+r['sourceReport']+'">Original deferral report</a></article>')
 out.append('<h2 id="sources">Detailed source reports</h2><ul>')
 for s in data['sources']:out.append('<li><a href="'+s['file']+'">'+esc(s['batch'])+'</a> — '+str(s['rowCount'])+' hymns</li>')
 out.append('</ul><p><a href="chord-review-index.json">Machine-readable consolidated index</a></p><script>const rows=[...document.querySelectorAll("#review tbody tr")];function filter(){const q=document.querySelector("#search").value.trim().toLowerCase(),priority=document.querySelector("#priority").value;for(const r of rows)r.hidden=!(r.dataset.search.includes(q)&&(!priority||r.dataset.priority===priority));document.querySelector("#count").textContent=rows.filter(r=>!r.hidden).length+" of "+rows.length+" generated hymns";}document.querySelector("#search").addEventListener("input",filter);document.querySelector("#priority").addEventListener("change",filter);filter();addEventListener("beforeprint",()=>document.querySelectorAll("details").forEach(d=>d.open=true));</script></html>')
 return '\n'.join(out)+'\n'
def main():
 data=build()
 for name,content in [('chord-review-index.json',json.dumps(data,ensure_ascii=False,indent=2)+'\n'),('chord-review-index.html',render(data))]:
  path=ROOT/'reports'/name
  if '--check' in sys.argv:assert path.read_text(encoding='utf8')==content,name+' not reproducible'
  else:path.write_text(content,encoding='utf8')
 print('Consolidated',len(data['harmonicReview']),'generated hymns,',len(data['technicalEngraving']),'technical findings,',len(data['deferred']),'deferred hymn')
if __name__=='__main__':main()
