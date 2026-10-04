"""Phase 3C exact scope, immutable baseline, frozen policy and revised priority-list completion (89 processed, two excluded)."""
import ast,hashlib,json,pathlib,runpy,subprocess,unittest
ROOT=pathlib.Path(__file__).resolve().parents[1]
BASE='9ae1b6b'
NUMBERS=[228,229,230,232,237,239,241,243,244,249,250,251,252,254,255,256,259,260,264,266,272,273,274,277,294,303,304,308,317]
parse=lambda s:json.loads(s.split('export const generatedHarmony = ')[1].strip().rstrip(';'))
old=lambda f:subprocess.check_output(['git','show',BASE+':'+f],cwd=ROOT)
class Batch(unittest.TestCase):
 def test_exact_sources_events_and_ids(self):
  rows=json.loads((ROOT/'reports/harmony-batch3c.json').read_text(encoding='utf8'));data=parse((ROOT/'generated-harmony-data.js').read_text(encoding='utf8'))
  self.assertEqual([r['number'] for r in rows],NUMBERS);self.assertEqual(len({r['id'] for r in rows}),29)
  for r in rows:
   self.assertEqual(r['harmonyCount'],0);self.assertEqual(r['chordText'],[])
   source=(ROOT/r['asset']).read_bytes();self.assertEqual(source,old(r['asset']));self.assertEqual(hashlib.sha256(source).hexdigest(),r['sourceSha256'])
   es=r['temporalDisplay']['events'];self.assertTrue(es);self.assertTrue(all(e['bass'] is None for e in es));self.assertEqual(len(es),len({(e['measure'],e['offset']) for e in es}))
   self.assertTrue(all((a['rootPC'],a['kind'])!=(b['rootPC'],b['kind']) for a,b in zip(es,es[1:])))
   self.assertEqual(data[r['id']]['events'],[{k:e[k] for k in ['measure','offset','root','kind','bass']} for e in es])
   self.assertTrue(all('bassNote' in e for e in r['analysis']['events']))
 def test_72_locked(self):
  before=parse(old('generated-harmony-data.js').decode());after=parse((ROOT/'generated-harmony-data.js').read_text(encoding='utf8'))
  self.assertEqual(len(before),72);self.assertEqual(before,{k:after[k] for k in before});self.assertEqual(len(after),101)
 def test_frozen_policy_runtime_and_ui(self):
  for f in ['tools/harmony-display.py','generated-harmony.js','app.js','navigation.js','styles.css','footer-viewport.js','virtual-pages.js','lead-view.js','screen-secondary-lyrics.js','auto-layout.js']:
   self.assertEqual((ROOT/f).read_bytes().replace(b'\r\n',b'\n'),old(f).replace(b'\r\n',b'\n'),f)
  functions=lambda s:{n.name:ast.dump(n) for n in ast.parse(s).body if isinstance(n,ast.FunctionDef) and n.name!='main'}
  self.assertEqual(functions((ROOT/'tools/harmony-inference.py').read_text(encoding='utf8')),functions(old('tools/harmony-inference.py').decode()))
 def test_priority_91_and_earlier_12(self):
  a=runpy.run_path(str(ROOT/'tools/harmony-inference.py'));b=runpy.run_path(str(ROOT/'tools/harmony-batch3b.py'))
  numbers=a['BATCH_3A']+b['NUMBERS']+NUMBERS;self.assertEqual([len(a['BATCH_3A']),len(b['NUMBERS']),len(NUMBERS)],[30,30,29]);self.assertEqual(len(set(numbers)),89)
  earlier=a['PILOTS']+a['CHRISTMAS'];self.assertEqual(len(set(earlier)),12);self.assertFalse(set(earlier)&set(numbers))
  songs=json.loads(subprocess.check_output(['node','--input-type=module','-e',"import {songs} from './songs.js';console.log(JSON.stringify(songs))"],cwd=ROOT));resolved=[]
  for n in numbers+earlier:
   matches=[s for s in songs if s['collection']=='Hymns (1985)' and s['page']==str(n)];self.assertEqual(len(matches),1);resolved.append(matches[0]['id'])
  data=parse((ROOT/'generated-harmony-data.js').read_text(encoding='utf8'));self.assertEqual(set(resolved),set(data));self.assertEqual(len(resolved),101)
  bynumber={s['page']:s['id'] for s in songs if s['collection']=='Hymns (1985)'}
  self.assertNotIn(bynumber['314'],data);self.assertNotIn(bynumber['315'],data);self.assertIn(bynumber['125'],data);self.assertIn(bynumber['141'],data)
if __name__=='__main__':unittest.main()
