import ast,json,pathlib,runpy,subprocess,sys,unittest
ROOT=pathlib.Path(__file__).resolve().parents[1];BASE='3946e857f09589feba83879cf28ee1d947595abd';ID='song-00c582e3-baa8-410b-940c-9fd52aa166a9'
old=lambda f:subprocess.check_output(['git','show',BASE+':'+f.removeprefix('./')],cwd=ROOT)
parse=lambda s:json.loads(s.split('export const generatedHarmony = ')[1].strip().rstrip(';'))
class Modulation(unittest.TestCase):
 def test_exact_scope(self):
  before=parse(old('generated-harmony-data.js').decode());after=parse((ROOT/'generated-harmony-data.js').read_text(encoding='utf8'))
  self.assertEqual(len(before),159);self.assertIn(ID,after);self.assertEqual(set(after)&(set(before)|{ID}),set(before)|{ID});self.assertEqual(before,{k:after[k] for k in before})
  registry=lambda s:json.loads(s.split('export const importedSongs=')[1].strip().rstrip(';'))
  a=registry(old('imported-songs.js').decode());b=registry((ROOT/'imported-songs.js').read_text(encoding='utf8'));self.assertEqual([s for s in a if s['id']!=ID],[s for s in b if s['id']!=ID])
  song=next(s for s in b if s['id']==ID);self.assertTrue(song['transpositionAvailable']);self.assertEqual((song['tonic'],song['mode'],song['fifths']),('C','major',0))
  for asset in [song['asset'],'assets/pdfs/fallback/'+ID+'.pdf']:self.assertEqual((ROOT/asset).read_bytes(),old(asset))
  for f in ['generated-harmony.js','chord-symbol.js','hymn-melody.js','lead-view.js','score-export.js','playback.js','app.js','assets/lyrics.json','tools/harmony-display.py']:
   self.assertEqual((ROOT/f).read_bytes().replace(b'\r\n',b'\n'),old(f).replace(b'\r\n',b'\n'),f)
  for p in [ROOT/('reports/chord-expansion-batch'+str(n)+'.json') for n in range(2,7)]+[ROOT/'reports/chord-priority-nine.json']:
   self.assertEqual(p.read_bytes().replace(b'\r\n',b'\n'),old(p.relative_to(ROOT).as_posix()).replace(b'\r\n',b'\n'))
  functions=lambda s:{n.name:ast.dump(n) for n in ast.parse(s).body if isinstance(n,ast.FunctionDef) and n.name!='main'}
  self.assertEqual(functions((ROOT/'tools/harmony-inference.py').read_text(encoding='utf8')),functions(old('tools/harmony-inference.py').decode()))
 def test_local_context_and_reproducibility(self):
  data=parse(old('generated-harmony-data.js').decode());actual=runpy.run_path(str(ROOT/'tools/harmony-280.py'))['extend'](data)
  self.assertEqual(actual,json.loads((ROOT/'reports/chord-hymn280.json').read_text(encoding='utf8')))
  current=parse((ROOT/'generated-harmony-data.js').read_text(encoding='utf8'));self.assertEqual(data,{k:current[k] for k in data})
  r=json.loads((ROOT/'reports/chord-hymn280.json').read_text(encoding='utf8'))['rows'][0];self.assertEqual(r['generatedSymbolCount'],19);self.assertEqual(r['omittedWindows'],17);self.assertEqual(len(r['boundaryRoundoffObservations']),9);self.assertTrue(all(0<w['remainingQuarterNotes']<1e-7 for w in r['boundaryRoundoffObservations']))
  prior=next(r for r in json.loads(old('reports/chord-expansion-batch2.json'))['rows'] if r['number']==280)
  self.assertEqual(r['analysis'],prior['analysis']);self.assertEqual(r['temporalDisplay']['events'],prior['temporalDisplay']['events'])
  h=runpy.run_path(str(ROOT/'tools/harmony-inference.py'));ms=h['extract'](h['source'](r))
  self.assertEqual([(ms[i]['number'],ms[i]['fifths']) for i in [9,10,19,20]],[('X9',0),('X10',1),('X19',1),('X20',0)])
  for e in r['analysis']['events']:self.assertEqual(e['keyFifths'],ms[e['measure']]['fifths'])
  index=json.loads((ROOT/'reports/chord-review-index.json').read_text(encoding='utf8'));previous=json.loads(old('reports/chord-review-index.json'))
  self.assertEqual([r for r in index['harmonicReview'] if r['number']!=280 and r['number'] not in [31,69,102,106,112,115,119,135,171]],previous['harmonicReview']);self.assertEqual(index['technicalEngraving'],previous['technicalEngraving']);self.assertEqual(next(r for r in index['harmonicReview'] if r['number']==280)['previousDeferral'],previous['deferred'][0])
if __name__=='__main__':unittest.main()
