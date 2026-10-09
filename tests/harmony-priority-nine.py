"""Append-only nine-hymn rollout, reproducibility, source integrity and frozen policy."""
import ast,hashlib,json,pathlib,runpy,subprocess,unittest
ROOT=pathlib.Path(__file__).resolve().parents[1];BASE='27085ba'
parse=lambda s:json.loads(s.split('export const generatedHarmony = ')[1].strip().rstrip(';'))
old=lambda f:subprocess.check_output(['git','show',BASE+':'+f],cwd=ROOT)
class PriorityNine(unittest.TestCase):
 def test_exact_scope_and_101_unchanged(self):
  before=parse(old('generated-harmony-data.js').decode());after=parse((ROOT/'generated-harmony-data.js').read_text(encoding='utf8'));rows=json.loads((ROOT/'reports/chord-priority-nine.json').read_text(encoding='utf8'))['rows']
  after={k:v for k,v in after.items() if k in before or k in {r['id'] for r in rows}}
  self.assertEqual(len(before),101);self.assertEqual(len(after),110);self.assertEqual({k:after[k] for k in before},before);self.assertEqual(set(after)-set(before),{r['id'] for r in rows});self.assertEqual([r['number'] for r in rows],[7,62,100,108,246,270,292,301,307])
 def test_source_and_generated_evidence(self):
  report=json.loads((ROOT/'reports/chord-priority-nine.json').read_text(encoding='utf8'));data=parse((ROOT/'generated-harmony-data.js').read_text(encoding='utf8'))
  h=runpy.run_path(str(ROOT/'tools/harmony-inference.py'))
  for r in report['rows']:
   b=(ROOT/r['asset']).read_bytes();self.assertEqual(b,old(r['asset']));self.assertEqual(hashlib.sha256(b).hexdigest(),r['sourceSha256'])
   x=h['source'](r);self.assertEqual(hashlib.sha256(x.encode()).hexdigest(),data[r['id']]['xmlSha256']);self.assertEqual(h['infer'](x),r['analysis'])
   events=r['temporalDisplay']['events'];self.assertEqual(len(events),len({(e['measure'],e['offset']) for e in events}));self.assertTrue(all(e['bass'] is None for e in events),'existing root-only display policy')
   for e in events:
    a=next(a for a in r['analysis']['events'] if (a['measure'],a['offset'],a['rootPC'],a['kind'])==(e['measure'],e['offset'],e['rootPC'],e['kind']))
    self.assertGreaterEqual(a['pitchCoverage'],.76)
   self.assertEqual(data[r['id']]['events'],[{k:e[k] for k in ['measure','offset','root','kind','bass']} for e in events])
 def test_policy_and_runtime_unchanged(self):
  for f in ['tools/harmony-display.py','generated-harmony.js','chord-symbol.js','music.js','score-export.js','app.js','lead-view.js','playback.js','styles.css','offline-bulk.js','offline-manager.js','offline-worker.js']:
   self.assertEqual((ROOT/f).read_bytes().replace(b'\r\n',b'\n'),old(f).replace(b'\r\n',b'\n'),f)
  functions=lambda s:{n.name:ast.dump(n) for n in ast.parse(s).body if isinstance(n,ast.FunctionDef) and n.name!='main'}
  self.assertEqual(functions((ROOT/'tools/harmony-inference.py').read_text(encoding='utf8')),functions(old('tools/harmony-inference.py').decode()))
 def test_targeted_regeneration(self):
  tool=runpy.run_path(str(ROOT/'tools/harmony-priority-nine.py'));before=parse(old('generated-harmony-data.js').decode());rows=tool['extend'](before)
  self.assertEqual(rows,json.loads((ROOT/'reports/chord-priority-nine.json').read_text(encoding='utf8'))['rows'])
  current=parse((ROOT/'generated-harmony-data.js').read_text(encoding='utf8'));self.assertEqual(before,{k:current[k] for k in before})
if __name__=='__main__':unittest.main()
