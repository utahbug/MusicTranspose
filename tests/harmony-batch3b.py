"""Batch 2 scope, frozen policy and source invariant checks."""
import unittest,json,pathlib,subprocess,hashlib,ast
ROOT=pathlib.Path(__file__).resolve().parents[1]
NUMBERS=[142,144,143,149,152,156,163,165,166,170,172,173,174,175,181,180,187,191,192,194,195,196,199,201,210,220,223,225,226,227]
parse=lambda s:json.loads(s.split('export const generatedHarmony = ')[1].strip().rstrip(';'))
class Batch(unittest.TestCase):
 def test_exact_order_sources_and_events(self):
  rows=json.loads((ROOT/'reports/harmony-batch3b.json').read_text(encoding='utf8'));new=parse((ROOT/'generated-harmony-data.js').read_text())
  self.assertEqual([r['number'] for r in rows],NUMBERS);self.assertEqual(len({r['id'] for r in rows}),30)
  for r in rows:
   self.assertEqual(r['harmonyCount'],0);self.assertEqual(r['chordText'],[])
   self.assertEqual(hashlib.sha256((ROOT/r['asset']).read_bytes()).hexdigest(),r['sourceSha256'])
   es=r['temporalDisplay']['events'];self.assertTrue(es)
   self.assertTrue(all(e['bass'] is None for e in es));self.assertEqual(len(es),len({(e['measure'],e['offset']) for e in es}))
   self.assertTrue(all((a['rootPC'],a['kind'])!=(b['rootPC'],b['kind']) for a,b in zip(es,es[1:])))
   self.assertEqual(new[r['id']]['events'],[{k:e[k] for k in ['measure','offset','root','kind','bass']} for e in es])
 def test_42_accepted_overlays(self):
  old=parse(subprocess.check_output(['git','show','4e554fc:generated-harmony-data.js'],cwd=ROOT).decode());new=parse((ROOT/'generated-harmony-data.js').read_text())
  self.assertEqual(old,{k:new[k] for k in old});self.assertEqual(len(new)-len(old),30)
 def test_frozen_analysis_and_display(self):
  self.assertEqual((ROOT/'tools/harmony-display.py').read_text(),subprocess.check_output(['git','show','4e554fc:tools/harmony-display.py'],cwd=ROOT).decode())
  functions=lambda s:{n.name:ast.dump(n) for n in ast.parse(s).body if isinstance(n,ast.FunctionDef) and n.name!='main'}
  self.assertEqual(functions((ROOT/'tools/harmony-inference.py').read_text()),functions(subprocess.check_output(['git','show','4e554fc:tools/harmony-inference.py'],cwd=ROOT).decode()))
if __name__=='__main__':unittest.main()
