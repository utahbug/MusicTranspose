"""Focused temporal-display calibration; no corpus rendering."""
import copy,json,pathlib,runpy,subprocess,unittest
ROOT=pathlib.Path(__file__).resolve().parents[1]
d=runpy.run_path(str(ROOT/'tools/harmony-display.py'))
policy=d['temporal_display']
def measure(number='1',duration=8,beats=4,unit=4):return dict(number=number,duration=duration,beats=beats,unit=unit,fifths=2,mode='major')
def event(root,kind,at,mi=0):
 return dict(rootPC=d['pc'](dict(step=root[0],alter=root.count('#')-root.count('b'))),root=dict(step=root[0],alter=root.count('#')-root.count('b')),kind=kind,label=root+d['SUFFIX'][kind],offset=at,measure=mi,sourceMeasure=str(mi+1),bass=None)
def sequence(items):return [event(*x) for x in items]
class Temporal(unittest.TestCase):
 def test_close_minor_and_dominant_clutter(self):
  e=sequence([('A','major',0),('F#','minor',.5),('B','minor',1),('E','dominant',1.5),('E','major',2),('A','major',2.5)])
  out=policy(e,[measure()])
  self.assertEqual([x['label'] for x in out['events']],['A','Bm','E7','A'])
 def test_same_count_spread_over_time_is_untouched(self):
  e=sequence([('A','major',0),('F#','minor',2),('B','minor',4),('E','dominant',6)])
  self.assertEqual(policy(e,[measure()])['events'],e)
 def test_functional_three_chord_progression(self):
  e=sequence([('D','major',0),('E','minor',.5),('A','dominant',1),('D','major',1.5)])
  out=policy(e,[measure()]);self.assertEqual(out['events'],e);self.assertTrue(out['remainingClusters'])
 def test_secondary_dominant_and_diminished_approach(self):
  e=sequence([('D','major',0),('E','dominant',.5),('A','major',1),('C#','diminished',1.5),('D','major',2)])
  self.assertEqual(policy(e,[measure()])['events'],e)
 def test_cross_barline_density(self):
  e=sequence([('A','major',2),('F#','minor',3)])+[event('B','minor',0,1),event('E','major',1,1),event('E','dominant',1.5,1),event('A','major',2,1)]
  out=policy(e,[measure(duration=4),measure('2',duration=4)])
  self.assertEqual([x['label'] for x in out['events']],['A','Bm','E7','A'])
 def test_compound_meter_and_input_immutability(self):
  e=sequence([('D','major',0),('A','major',1.5),('A','dominant',2),('D','major',2.5)]);saved=copy.deepcopy(e)
  out=policy(e,[measure(duration=3,beats=6,unit=8)])
  self.assertEqual(e,saved);self.assertEqual([x['label'] for x in out['events']],['D','A7','D'])
 def test_rollout_scope_and_immutable_analysis(self):
  parse=lambda s:json.loads(s.split('export const generatedHarmony = ')[1].strip().rstrip(';'))
  before=parse(subprocess.check_output(['git','show','2df4662:generated-harmony-data.js'],cwd=ROOT).decode());after=parse((ROOT/'generated-harmony-data.js').read_text(encoding='utf8'))
  batch=json.loads((ROOT/'reports/harmony-batch3a.json').read_text(encoding='utf8'));r=next(x for x in batch if x['number']==68);id=r['id']
  self.assertEqual({k:v for k,v in before.items() if k!=id},{k:after[k] for k in before if k!=id})
  self.assertEqual(len(before[id]['events']),54);self.assertEqual(len(after[id]['events']),40)
  oldBatch=subprocess.check_output(['git','show','2df4662:reports/harmony-batch3a.json'],cwd=ROOT)
  self.assertEqual(json.loads(oldBatch),batch)
  report=json.loads((ROOT/'reports/harmony-dense-refinement.json').read_text());self.assertEqual(report['analysisCount'],59);self.assertEqual(report['analysisReviewWindows'],4)
  self.assertEqual(report['after']['measures4Plus'],0)
  es=r['rootDisplay']['events'];retained=report['events']
  self.assertTrue(all(e in es for e in retained))
  self.assertEqual([e for e in es if e['kind'] in ['dominant','diminished','major-seventh']],[e for e in retained if e['kind'] in ['dominant','diminished','major-seventh']])
  self.assertTrue(all(e['bass'] is None for e in retained))
if __name__=='__main__':unittest.main()
