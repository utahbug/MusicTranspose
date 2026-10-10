"""Batch 6 exact scope, immutable baseline/source assets, frozen policy and reproducibility."""
import ast,hashlib,json,pathlib,runpy,subprocess,unittest
ROOT=pathlib.Path(__file__).resolve().parents[1];BASE='6312e7113c9f0c2dfbe7cbb9dc8f995d5ca7c3d9'
parse=lambda s:json.loads(s.split('export const generatedHarmony = ')[1].strip().rstrip(';'))
old=lambda f:subprocess.check_output(['git','show',BASE+':'+f.removeprefix('./')],cwd=ROOT)
class Batch6(unittest.TestCase):
 def test_exact_scope_and_149_unchanged(self):
  before=parse(old('generated-harmony-data.js').decode());after=parse((ROOT/'generated-harmony-data.js').read_text(encoding='utf8'));rows=json.loads((ROOT/'reports/chord-expansion-batch6.json').read_text(encoding='utf8'))['rows']
  after={k:v for k,v in after.items() if k in before or k in {r['id'] for r in rows}}
  self.assertEqual(len(before),149);self.assertEqual(len(after),159);self.assertEqual({k:after[k] for k in before},before)
  self.assertEqual(set(after)-set(before),{r['id'] for r in rows if r['generatedSymbolCount']});self.assertEqual([r['number'] for r in rows],[147,328,5,10,127,67,81,184,205,221])
  self.assertEqual(sum(r['generatedSymbolCount'] for r in rows),199)
 def test_source_and_generated_evidence(self):
  rows=json.loads((ROOT/'reports/chord-expansion-batch6.json').read_text(encoding='utf8'))['rows'];data=parse((ROOT/'generated-harmony-data.js').read_text(encoding='utf8'));h=runpy.run_path(str(ROOT/'tools/harmony-inference.py'))
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
  arrangements=[next(s for s in songs if s['collection']=='Hymns (1985)' and s['page']==str(n)) for n in [13,328]]
  self.assertNotEqual(arrangements[0]['id'],arrangements[1]['id']);self.assertNotEqual(arrangements[0]['asset'],arrangements[1]['asset']);self.assertNotEqual(data[arrangements[0]['id']]['xmlSha256'],data[arrangements[1]['id']]['xmlSha256']);self.assertEqual([s['tonic'] for s in arrangements],['G','A'])
  native=next(s for s in songs if s['collection']=='Hymns (1985)' and s['page']=='70');self.assertNotIn(native['id'],data);self.assertEqual((ROOT/native['asset']).read_bytes(),old(native['asset']))
 def test_policy_runtime_and_other_features_unchanged(self):
  for f in ['tools/harmony-display.py','tools/harmony-priority-nine.py','tools/harmony-expansion-batch3.py','tools/harmony-expansion-batch4.py','tools/harmony-expansion-batch5.py','reports/chord-expansion-batch5.json','reports/chord-expansion-batch4.json','reports/chord-expansion-batch3.json','reports/chord-expansion-batch2.json','metronome.js','metronome-sounds.js','reports/chord-priority-nine.json','generated-harmony.js','chord-symbol.js','score-export.js','app.js','lead-view.js','playback.js','styles.css','assets/lyrics.json','offline-bulk.js','offline-manager.js','offline-worker.js']:
   self.assertEqual((ROOT/f).read_bytes().replace(b'\r\n',b'\n'),old(f).replace(b'\r\n',b'\n'),f)
  functions=lambda s:{n.name:ast.dump(n) for n in ast.parse(s).body if isinstance(n,ast.FunctionDef) and n.name!='main'}
  self.assertEqual(functions((ROOT/'tools/harmony-inference.py').read_text(encoding='utf8')),functions(old('tools/harmony-inference.py').decode()))
 def test_targeted_reproducibility(self):
  tool=runpy.run_path(str(ROOT/'tools/harmony-expansion-batch6.py'));data=parse(old('generated-harmony-data.js').decode());rows=tool['extend'](data)
  self.assertEqual(rows,json.loads((ROOT/'reports/chord-expansion-batch6.json').read_text(encoding='utf8'))['rows'])
  current=parse((ROOT/'generated-harmony-data.js').read_text(encoding='utf8'));self.assertEqual(data,{k:current[k] for k in data})
if __name__=='__main__':unittest.main()
