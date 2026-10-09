import unittest,runpy,pathlib,copy,json,subprocess
ROOT=pathlib.Path(__file__).resolve().parents[1]
simplify=runpy.run_path(str(ROOT/'tools/harmony-display.py'))['simplify']
def e(root,kind,offset,bass=None):
 names={0:'C',2:'D',4:'E',7:'G',11:'B'}
 return dict(rootPC=root,root={'step':names[root],'alter':0},kind=kind,measure=0,sourceMeasure='1',offset=offset,bass={'step':names[bass],'alter':0} if bass is not None else None,bassNote=names[bass if bass is not None else root],label=names[root],keyFifths=0)
M=[dict(number="1",unit=4,beats=4,duration=4,fifths=0,mode='major')]
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
   if p['number'] in [30,193,204]:
    expected=copy.deepcopy(old[p['id']]);out=[]
    for event in expected['events']:
     event['bass']=None
     if not out or (out[-1]['root'],out[-1]['kind'])!=(event['root'],event['kind']):out.append(event)
    expected['events']=out;self.assertEqual(expected,new[p['id']])
  self.assertTrue(set(old)<=set(new))
  approved=json.loads(subprocess.check_output(['git','show','5d692a5:generated-harmony-data.js'],cwd=ROOT).decode().split('export const generatedHarmony = ')[1].strip().rstrip(';'))
  self.assertEqual(approved,{k:new[k] for k in approved})
  batch=json.loads((ROOT/'reports/harmony-christmas.json').read_text(encoding='utf8'))
  self.assertEqual({r['number'] for r in batch},{203,206,207,208,209,212,213})
  prior12=json.loads(subprocess.check_output(['git','show','666a505:generated-harmony-data.js'],cwd=ROOT).decode().split('export const generatedHarmony = ')[1].strip().rstrip(';'))
  self.assertEqual(prior12,{k:new[k] for k in prior12})
  batch3=json.loads((ROOT/'reports/harmony-batch3a.json').read_text(encoding='utf8'))
  self.assertEqual(len(batch3),30)
  batch3b=json.loads((ROOT/'reports/harmony-batch3b.json').read_text(encoding='utf8'))
  batch3c=json.loads((ROOT/'reports/harmony-batch3c.json').read_text(encoding='utf8'))
  nine=json.loads((ROOT/'reports/chord-priority-nine.json').read_text(encoding='utf8'))['rows']
  batch2=json.loads((ROOT/'reports/chord-expansion-batch2.json').read_text(encoding='utf8'))['rows']
  self.assertEqual(set(new)-set(prior12),{r['id'] for r in batch3+batch3b+batch3c+nine+[r for r in batch2 if r['generatedSymbolCount']] if 'skipped' not in r})
 def test_batch3a_scope_and_events(self):
  batch=json.loads((ROOT/'reports/harmony-batch3a.json').read_text(encoding='utf8'))
  self.assertEqual({r['number'] for r in batch},{3,6,19,21,26,27,29,34,35,36,58,60,68,85,89,92,94,96,97,98,103,104,105,111,125,131,134,136,140,141})
  for r in batch:
   self.assertEqual(r['harmonyCount'],0);self.assertEqual(r['chordText'],[])
   self.assertEqual(__import__('hashlib').sha256((ROOT/r['asset']).read_bytes()).hexdigest(),r['sourceSha256'])
   events=r['rootDisplay']['events'];self.assertTrue(events)
   self.assertTrue(all(e['bass'] is None and '/' not in e['label'] for e in events))
   self.assertEqual(len(events),len({(e['measure'],e['offset']) for e in events}))
   self.assertTrue(all((a['rootPC'],a['kind'])!=(b['rootPC'],b['kind']) for a,b in zip(events,events[1:])))
   self.assertEqual(events[0]['rootPC'],(7*events[0]['keyFifths'])%12)
   self.assertEqual(events[-1]['rootPC'],events[0]['rootPC'])
   self.assertTrue(any(e['kind']=='dominant' for e in events))
class RootDisplay(unittest.TestCase):
 def run_policy(self,events,local=True):
  fn=runpy.run_path(str(ROOT/'tools/harmony-display.py'))['root_only_display'];return fn(events,M,local_density=local)
 def test_slash_dedup_and_quality(self):
  events=[e(0,'major',0),e(0,'major',1,4),e(0,'major',2,7),e(0,'minor',3)]
  before=copy.deepcopy(events);r=self.run_policy(events,False)
  self.assertEqual([x['kind'] for x in r['events']],['major','minor']);self.assertEqual(r['slashDuplicates'],2)
  self.assertTrue(all(x['bass'] is None for x in r['events']));self.assertEqual(events,before)
 def test_local_predominant_cadence(self):
  r=self.run_policy([e(2,'minor',0),e(0,'major',1,7),e(7,'major',2)])
  self.assertEqual([x['rootPC'] for x in r['events']],[2,7]);self.assertEqual(r['denseAfter'],0)
 def test_local_neighbor(self):
  r=self.run_policy([e(0,'major',0),e(2,'minor',1),e(0,'major',2),e(7,'major',3)])
  self.assertEqual([x['rootPC'] for x in r['events']],[0,7])
 def test_secondary_and_diminished_retained(self):
  r=self.run_policy([e(0,'major',0),e(2,'dominant',1),e(7,'major',2),e(11,'diminished',3)])
  self.assertEqual(len(r['events']),4)
 def test_sparse_measures_unchanged(self):
  r=self.run_policy([e(0,'major',0,4),e(7,'dominant',2)])
  self.assertEqual(len(r['events']),2);self.assertEqual(r['localSuppressed'],0)
if __name__=='__main__':unittest.main()
