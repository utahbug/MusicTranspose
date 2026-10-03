import unittest,runpy,pathlib,copy,json,subprocess
ROOT=pathlib.Path(__file__).resolve().parents[1]
simplify=runpy.run_path(str(ROOT/'tools/harmony-display.py'))['simplify']
def e(root,kind,offset,bass=None):
 names={0:'C',2:'D',4:'E',7:'G',11:'B'}
 return dict(rootPC=root,root={'step':names[root],'alter':0},kind=kind,measure=0,sourceMeasure='1',offset=offset,bass={'step':names[bass],'alter':0} if bass is not None else None,bassNote=names[bass if bass is not None else root],label=names[root],keyFifths=0)
M=[dict(unit=4,beats=4,duration=4,fifths=0,mode='major')]
class Display(unittest.TestCase):
 def test_passing_inversion_return(self):
  a=[e(0,'major',0),e(7,'major',1,11),e(0,'major',2)];before=copy.deepcopy(a)
  r=simplify(a,M);self.assertEqual(len(r['events']),1);self.assertEqual(a,before)
 def test_secondary_dominant(self):
  r=simplify([e(0,'major',0),e(2,'dominant',1),e(7,'major',2)],M)
  self.assertEqual([x['rootPC'] for x in r['events']],[0,2,7])
 def test_cadence(self):
  r=simplify([e(0,'major',0,7),e(7,'dominant',1),e(0,'major',2)],M)
  self.assertEqual(len(r['events']),3);self.assertIsNotNone(r['events'][0]['bass'])
 def test_inverted_tonic_resolution(self):
  r=simplify([e(7,'dominant',0),e(0,'major',1,4),e(2,'minor',2)],M)
  self.assertEqual([x['rootPC'] for x in r['events']],[7,0,2])
 def test_shortened_measure_keeps_meter(self):
  m=[dict(M[0],duration=3)]
  r=simplify([e(0,'major',0),e(7,'major',2)],m)
  self.assertTrue(r['decisions'][1]['strongBeat'])
 def test_compound_meter(self):
  m=[dict(unit=8,beats=9,duration=4.5,fifths=0,mode='major')]
  r=simplify([e(0,'major',0),e(7,'major',1.5)],m)
  self.assertTrue(r['decisions'][1]['strongBeat'])
 def test_minor_and_diminished(self):
  r=simplify([e(0,'major',0),e(2,'minor',1),e(11,'diminished',2),e(0,'major',3)],M)
  self.assertEqual(len(r['events']),4)
 def test_analysis_and_locked_overlays(self):
  # Phase 1 is the approved musical baseline, not a new handwritten chord table.
  prior=json.loads(subprocess.check_output(['git','show','3cd1468:reports/harmony-pilot.json'],cwd=ROOT))
  now=json.loads((ROOT/'reports/harmony-pilot.json').read_text(encoding='utf8'));self.assertEqual(now,prior)
  old=json.loads(subprocess.check_output(['git','show','3cd1468:generated-harmony-data.js'],cwd=ROOT).decode().split('export const generatedHarmony = ')[1].strip().rstrip(';'))
  new=json.loads((ROOT/'generated-harmony-data.js').read_text().split('export const generatedHarmony = ')[1].strip().rstrip(';'))
  for p in prior['pilots']:
   if p['number'] in [30,193,204]:self.assertEqual(old[p['id']],new[p['id']])
  self.assertEqual(set(old),set(new))
if __name__=='__main__':unittest.main()
