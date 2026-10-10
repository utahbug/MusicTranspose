"""Batch 8 exact scope, immutable baseline/source assets, frozen policy and reproducibility."""
import ast,hashlib,json,pathlib,runpy,subprocess,unittest
ROOT=pathlib.Path(__file__).resolve().parents[1];BASE='cdb48a2bd268125a7975ab356f41d99041df57e7'
parse=lambda s:json.loads(s.split('export const generatedHarmony = ')[1].strip().rstrip(';'))
old=lambda f:subprocess.check_output(['git','show',BASE+':'+f.removeprefix('./')],cwd=ROOT)
class Batch8(unittest.TestCase):
 def test_exact_scope_and_169_unchanged(self):
  before=parse(old('generated-harmony-data.js').decode());after=parse((ROOT/'generated-harmony-data.js').read_text(encoding='utf8'));rows=json.loads((ROOT/'reports/chord-expansion-batch8.json').read_text(encoding='utf8'))['rows']
  self.assertEqual(len(before),169);self.assertEqual(len(after),182);self.assertEqual({k:after[k] for k in before},before)
  self.assertEqual(set(after)-set(before),{r['id'] for r in rows if r['generatedSymbolCount']});self.assertEqual([r['number'] for r in rows],[176,177,182,183,190,216,235,285,293,338,339,340,341])
  self.assertEqual(sum(r['generatedSymbolCount'] for r in rows),248)
 def test_source_and_generated_evidence(self):
  rows=json.loads((ROOT/'reports/chord-expansion-batch8.json').read_text(encoding='utf8'))['rows'];data=parse((ROOT/'generated-harmony-data.js').read_text(encoding='utf8'));h=runpy.run_path(str(ROOT/'tools/harmony-inference.py'))
  songs=json.loads(subprocess.check_output(['node','--input-type=module','-e',"import {songs} from './songs.js';console.log(JSON.stringify(songs))"],cwd=ROOT))
  for r in rows:
   song=next(s for s in songs if s['id']==r['id'])
   for asset in [song['asset'],song['pdfAsset']]:self.assertEqual((ROOT/asset).read_bytes(),old(asset))
   b=(ROOT/r['asset']).read_bytes();self.assertEqual(hashlib.sha256(b).hexdigest(),r['sourceSha256']);self.assertEqual(r['sourceSha256'],song['sourceIdentity']['sha256'])
   x=h['source'](r);self.assertEqual(h['infer'](x),r['analysis']);events=r['temporalDisplay']['events'];ms=h['extract'](x)
   self.assertEqual(len(events),len({(e['measure'],e['offset']) for e in events}));self.assertTrue(all(e['bass'] is None for e in events))
   for e in events:
    a=next(a for a in r['analysis']['events'] if (a['measure'],a['offset'],a['rootPC'],a['kind'])==(e['measure'],e['offset'],e['rootPC'],e['kind']))
    self.assertGreaterEqual(a['pitchCoverage'],.76);self.assertGreaterEqual(e['offset'],0);self.assertLess(e['offset'],ms[e['measure']]['duration'])
   self.assertEqual(hashlib.sha256(x.encode()).hexdigest(),data[r['id']]['xmlSha256']);self.assertEqual(data[r['id']]['events'],[{k:e[k] for k in ['measure','offset','root','kind','bass']} for e in events])
  native=next(s for s in songs if s['collection']=='Hymns (1985)' and s['page']=='70');self.assertNotIn(native['id'],data);self.assertEqual((ROOT/native['asset']).read_bytes(),old(native['asset']))
 def test_independent_tunes_and_coverage(self):
  rows=json.loads((ROOT/'reports/chord-expansion-batch8.json').read_text(encoding='utf8'))['rows'];data=parse((ROOT/'generated-harmony-data.js').read_text(encoding='utf8'));h=runpy.run_path(str(ROOT/'tools/harmony-inference.py'))
  a,b=rows[:2];self.assertEqual([a['number'],b['number']],[176,177]);self.assertEqual(a['title'],b['title'])
  self.assertNotEqual(a['id'],b['id']);self.assertNotEqual(a['asset'],b['asset']);self.assertNotEqual(a['sourceSha256'],b['sourceSha256']);self.assertNotEqual(a['originalKey'],b['originalKey'])
  self.assertNotEqual(data[a['id']]['events'],data[b['id']]['events']);self.assertNotEqual(h['extract'](h['source'](a)),h['extract'](h['source'](b)))
  self.assertEqual([a['generatedSymbolCount'],b['generatedSymbolCount']],[18,25])
  self.assertTrue(all(len(r['keyChanges'])==1 for r in rows))
  self.assertEqual(sum(r['omittedWindows'] for r in rows),89)
  self.assertEqual(len(next(r for r in rows if r['number']==183)['boundaryRoundoffObservations']),8)
  self.assertTrue(all(0<w['remainingQuarterNotes']<1e-7 for r in rows for w in r['boundaryRoundoffObservations']))
  songs=json.loads(subprocess.check_output(['node','--input-type=module','-e',"import {songs} from './songs.js';console.log(JSON.stringify(songs))"],cwd=ROOT))
  hymns=[s for s in songs if s['collection']=='Hymns (1985)'];self.assertEqual(len({int(s['page']) for s in hymns}),341)
  self.assertEqual(len(data),182);self.assertEqual(len([s for s in hymns if s['id'] in data]),182)
  self.assertEqual({int(s['page']) for s in hymns if s.get('availabilityReason')=='licensing'},{12,54,86,124,219,299})
  for r in rows:self.assertFalse(next(s for s in hymns if s['id']==r['id']).get('availabilityReason'))
 def test_policy_runtime_and_other_features_unchanged(self):
  for f in ['index.html','tools/harmony-expansion-batch7.py','reports/chord-expansion-batch7.json','tools/harmony-display.py','tools/harmony-priority-nine.py','tools/harmony-expansion-batch3.py','tools/harmony-expansion-batch4.py','tools/harmony-expansion-batch5.py','reports/chord-expansion-batch5.json','reports/chord-expansion-batch4.json','reports/chord-expansion-batch3.json','reports/chord-expansion-batch2.json','metronome.js','metronome-sounds.js','reports/chord-priority-nine.json','generated-harmony.js','chord-symbol.js','score-export.js','app.js','lead-view.js','playback.js','styles.css','assets/lyrics.json','offline-bulk.js','offline-manager.js','offline-worker.js']:
   self.assertEqual((ROOT/f).read_bytes().replace(b'\r\n',b'\n'),old(f).replace(b'\r\n',b'\n'),f)
  functions=lambda s:{n.name:ast.dump(n) for n in ast.parse(s).body if isinstance(n,ast.FunctionDef) and n.name!='main'}
  self.assertEqual(functions((ROOT/'tools/harmony-inference.py').read_text(encoding='utf8')),functions(old('tools/harmony-inference.py').decode()))
 def test_prior_review_and_inventory_unchanged(self):
  current=json.loads((ROOT/'reports/chord-review-index.json').read_text(encoding='utf8'));previous=json.loads(old('reports/chord-review-index.json'))
  self.assertEqual([r for r in current['harmonicReview'] if r['number'] not in [176,177,182,183,190,216,235,285,293,338,339,340,341]],previous['harmonicReview'])
  self.assertEqual(current['technicalEngraving'],previous['technicalEngraving']);self.assertEqual(current['sources'][:-1],previous['sources'])
  for ext in ['csv','xlsx','md']:
   normalize=lambda b:b if ext=='xlsx' else b.replace(b'\r\n',b'\n')
   self.assertEqual(normalize((ROOT/('reports/1985-unchorded-hymns.'+ext)).read_bytes()),normalize(old('reports/1985-unchorded-hymns.'+ext)))
  changed=subprocess.check_output(['git','diff','--name-only',BASE],cwd=ROOT).decode().splitlines()
  self.assertFalse(any(f.startswith('assets/') for f in changed))
 def test_targeted_reproducibility(self):
  tool=runpy.run_path(str(ROOT/'tools/harmony-expansion-batch8.py'));data=parse(old('generated-harmony-data.js').decode());rows=tool['extend'](data)
  self.assertEqual(rows,json.loads((ROOT/'reports/chord-expansion-batch8.json').read_text(encoding='utf8'))['rows'])
  current=parse((ROOT/'generated-harmony-data.js').read_text(encoding='utf8'));self.assertEqual(data,{k:current[k] for k in data})
if __name__=='__main__':unittest.main()
