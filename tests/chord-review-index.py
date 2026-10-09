"""Lossless consolidation from prior reports; no fresh score analysis."""
import hashlib,json,pathlib,runpy,subprocess,sys,unittest
ROOT=pathlib.Path(__file__).resolve().parents[1]
class ReviewIndex(unittest.TestCase):
 def test_every_source_observation_preserved(self):
  index=json.loads((ROOT/'reports/chord-review-index.json').read_text(encoding='utf8'));entries=index['harmonicReview']+index['deferred'];self.assertEqual(len(entries),59);self.assertEqual(len({r['number'] for r in entries}),59);self.assertEqual(len(index['harmonicReview']),58);self.assertEqual([r['number'] for r in index['deferred']],[280]);self.assertEqual({r['number'] for r in index['technicalEngraving']},{81,113,198,307})
  for source in index['sources']:
   raw=(ROOT/'reports'/source['file']).read_text(encoding='utf8');self.assertEqual(hashlib.sha256(raw.encode()).hexdigest(),source['sha256']);report=json.loads(raw);self.assertEqual(report.get('limitations',[]),source['limitations'])
   for observation in report.get('technicalObservations',[]):
    actual=next(t for t in index['technicalEngraving'] if t['number']==observation['number']);self.assertEqual({k:actual[k] for k in observation},observation)
   for row in report['rows']:
    entry=next(e for e in entries if e['number']==row['number']);self.assertEqual(entry['summaryFlags'],row['reviewFlags']);self.assertEqual(entry['recordedOutcome'],row['outcome']);self.assertEqual(entry['sourceKey'],row['originalKey']);self.assertEqual(entry['sourceReport'],source['file'])
    warnings=entry['warnings'];reviews=[p for w in warnings if w['type'] in ['Omitted/ambiguous inference','Other inference observations'] for p in w['passages']]
    canonical=lambda xs:sorted(json.dumps(x,sort_keys=True) for x in xs)
    self.assertEqual(canonical(reviews),canonical(row['analysis']['review']))
    self.assertEqual([p for w in warnings if w['type']=='Dense retained changes' for p in w['passages']],row['temporalDisplay']['remainingClusters'])
    unusual=[dict(measure=e['sourceMeasure'],offset=e['offset'],chord=e['label'],kind=e['kind']) for e in row['temporalDisplay']['events'] if e['kind'] in ['major-seventh','augmented','diminished']]
    self.assertEqual([p for w in warnings if w['type']=='Unusual retained qualities' for p in w['passages']],unusual)
    self.assertEqual([w['explanation'] for w in warnings if w['type']=='Recorded summary flag'],row['reviewFlags'])
  supplement=json.loads((ROOT/'reports'/index['technicalSupplement']).read_text(encoding='utf8'))
  for item in supplement['observations']:self.assertIn(item,index['technicalEngraving'])
  self.assertEqual(supplement['recordedRows'][0]['number'],198);self.assertEqual(supplement['recordedRows'][0]['collisions'],[])
  self.assertNotEqual(next(e for e in entries if e['number']==13)['sourceKey'],next(e for e in entries if e['number']==328)['sourceKey']);self.assertIn('Men',next(e for e in entries if e['number']==328)['arrangementNote'])
 def test_reproducible_and_read_only_inputs(self):
  files=[ROOT/'generated-harmony-data.js']+list((ROOT/'reports').glob('chord-expansion-batch*.json'))+[ROOT/'reports/chord-priority-nine.json'];before={p:p.read_bytes() for p in files}
  subprocess.run([sys.executable,str(ROOT/'tools/build-chord-review-index.py'),'--check'],check=True,cwd=ROOT)
  self.assertEqual(before,{p:p.read_bytes() for p in files})
if __name__=='__main__':unittest.main()
