"""Focused deterministic inference tests, including five-pilot source invariants."""
import runpy, pathlib, unittest, json, hashlib
h=runpy.run_path(str(pathlib.Path(__file__).resolve().parents[1]/'tools/harmony-inference.py'))
def score(chords):
 parts=[]
 for voice in range(4):
  ms=[]
  for i,chord in enumerate(chords):
   midi=chord[voice];step=['C','C','D','E','E','F','F','G','A','A','B','B'][midi%12];alt=midi%12-h['NAT'][step]
   ms.append(f'<measure number="{i+1}"><attributes><divisions>1</divisions><key><fifths>0</fifths></key><time><beats>4</beats><beat-type>4</beat-type></time></attributes><note><pitch><step>{step}</step><alter>{alt}</alter><octave>{midi//12-1}</octave></pitch><duration>4</duration></note></measure>')
  parts.append('<part>'+''.join(ms)+'</part>')
 return '<score-partwise>'+''.join(parts)+'</score-partwise>'
class Inference(unittest.TestCase):
 def test_cadence_and_repetition(self):
  r=h['infer'](score([[48,55,60,64],[48,55,60,64],[43,59,62,65],[48,55,60,64]]))
  self.assertEqual([e['label'] for e in r['events']],['C','G7','C'])
 def test_short_passing_tone(self):
  xml=score([[48,55,60,64]])
  held='<note><pitch><step>C</step><alter>0</alter><octave>4</octave></pitch><duration>4</duration></note>'
  moving=''.join(f'<note><pitch><step>{step}</step><octave>4</octave></pitch><duration>{duration}</duration></note>' for step,duration in [('C',1),('D',.25),('C',2.75)])
  self.assertEqual([e['label'] for e in h['infer'](xml.replace(held,moving))['events']],['C'])
 def test_slash_bass(self):
  r=h['infer'](score([[40,55,60,64]]));self.assertEqual(r['events'][0]['label'],'C/E')
 def test_incomplete_non_tonic(self):
  r=h['infer'](score([[50,50,53,53]]));self.assertEqual(r['events'],[])
 def test_secondary_dominant(self):
  r=h['infer'](score([[50,54,57,60],[43,55,59,62],[48,55,60,64]]))
  self.assertEqual([e['label'] for e in r['events']],['D7','G','C'])
 def test_pilots_and_source_hashes(self):
  root=h['ROOT'];r=json.loads((root/'reports/harmony-pilot.json').read_text(encoding='utf8'))
  self.assertEqual(len(r['inventory']),21);self.assertEqual({p['number'] for p in r['pilots']},{2,30,193,202,204})
  for s in r['inventory']:self.assertEqual(hashlib.sha256((root/s['asset']).read_bytes()).hexdigest(),s['sourceSha256'])
  for p in r['pilots']:
   self.assertEqual(p['events'][0]['rootPC'],(7*p['events'][0]['keyFifths'])%12)
   self.assertEqual(p['events'][0]['rootPC'],p['events'][-1]['rootPC'])
   self.assertEqual(len({(e['measure'],e['offset']) for e in p['events']}),len(p['events']))
   source=next(s for s in r['inventory'] if s['id']==p['id']);self.assertEqual(h['infer'](h['source'](source)),{k:p[k] for k in ['events','review']})
 def test_pilot_cadences_and_appoggiaturas(self):
  r=json.loads((h['ROOT']/'reports/harmony-pilot.json').read_text(encoding='utf8'));p={x['number']:x for x in r['pilots']}
  self.assertTrue(any(e['label']=='C7' for e in p[2]['events']))
  self.assertTrue(any(e['label']=='A7' for e in p[202]['events']))
  self.assertFalse(any(e['label']=='Fm/Ab' for e in p[193]['events']))
  self.assertEqual([e['label'] for e in p[204]['events']][-2:],['F7','Bb'])
if __name__=='__main__':unittest.main()
