import copy
import importlib.util
import json
import tempfile
import unittest
import zipfile
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location('baseline', ROOT / 'tools/score-baseline.py')
baseline = importlib.util.module_from_spec(spec)
spec.loader.exec_module(baseline)
XML = '''<score-partwise version="4.0"><work><work-title>Fixture</work-title></work><part-list><score-part id="P1"><part-name>Piano</part-name></score-part></part-list><part id="P1"><measure number="1"><attributes><divisions>2</divisions><key><fifths>0</fifths><mode>major</mode></key><time><beats>4</beats><beat-type>4</beat-type></time><staves>1</staves></attributes><direction><direction-type><words>Gently</words><metronome><beat-unit>quarter</beat-unit><per-minute>80</per-minute></metronome></direction-type><sound tempo="80"/></direction><harmony><root><root-step>C</root-step></root><kind>major</kind></harmony><note default-x="25"><pitch><step>C</step><octave>4</octave></pitch><duration>2</duration><voice>1</voice><type>quarter</type><notations><slur type="start" number="1"/></notations><lyric number="1"><syllabic>single</syllabic><text>Sing</text></lyric></note></measure></part></score-partwise>'''

class BaselineTest(unittest.TestCase):
    def setUp(self):
        (ROOT / 'test-results').mkdir(exist_ok=True)
        self.temp = tempfile.TemporaryDirectory(dir=ROOT / 'test-results')
        self.root = Path(self.temp.name)
        self.song = {'id': 'immutable-fixture-id', 'title': 'Fixture', 'collection': 'Hymns (1985)', 'page': '9', 'asset': 'fixture.musicxml', 'tonic': 'C', 'mode': 'major', 'fifths': 0}
        self.base = self.inspect(XML)
    def tearDown(self):
        self.temp.cleanup()
    def inspect(self, xml, song=None):
        (self.root / 'fixture.musicxml').write_text(xml, encoding='utf-8')
        return baseline.analyze(song or self.song, self.root, 'test')['editions']['test']
    def test_metadata_only(self):
        for field, value, expected in [('pageNumber', '50', 'pageNumber'), ('songNumber', '27', 'songNumber'), ('title', 'New title', 'title')]:
            with self.subTest(field=field):
                song = {**self.song, field: value}
                changed = self.inspect(XML, song)
                self.assertNotEqual(changed[expected], self.base[expected])
                self.assertEqual(changed['source']['sha256'], self.base['source']['sha256'])
                self.assertEqual(changed['structuralFingerprint'], self.base['structuralFingerprint'])
                self.assertEqual(song['id'], self.song['id'])
    def test_musical_changes(self):
        cases = [
            ('key', '<fifths>0', '<fifths>2', 'keys'),
            ('pitch', '<step>C', '<step>D', 'notesRhythm'),
            ('duration', '<duration>2', '<duration>3', 'notesRhythm'),
            ('lyric', '<text>Sing', '<text>Rejoice', 'lyrics'),
            ('chord', '<kind>major', '<kind>minor', 'harmony'),
            ('tempo', 'tempo="80"', 'tempo="90"', 'directions'),
            ('expression', '<words>Gently', '<words>Joyfully', 'directions'),
            ('slur', 'type="start"', 'type="stop"', 'notesRhythm'),
            ('time', '<beats>4', '<beats>3', 'times'),
        ]
        for label, old, new, component in cases:
            with self.subTest(change=label):
                changed = self.inspect(XML.replace(old, new))
                self.assertNotEqual(changed['structuralFingerprint']['sha256'], self.base['structuralFingerprint']['sha256'])
                self.assertNotEqual(changed['structuralFingerprint']['components'][component], self.base['structuralFingerprint']['components'][component])
    def test_measure_added_and_removed(self):
        two = self.inspect(XML.replace('</part>', '<measure number="2"><note><rest/><duration>2</duration></note></measure></part>'))
        self.assertEqual(two['measureCount'], 2)
        self.assertEqual(self.base['measureCount'], 1)
        self.assertNotEqual(two['structuralFingerprint']['components']['measureSequence'], self.base['structuralFingerprint']['components']['measureSequence'])
        self.assertEqual(self.inspect(XML)['structuralFingerprint'], self.base['structuralFingerprint'])
    def test_byte_only_changes(self):
        for modified in [XML.replace('><', '>\n  <'), XML.replace('type="start" number="1"', 'number="1" type="start"'), XML.replace('default-x="25"', 'default-y="0" default-x="42"'), XML.replace('<work-title>Fixture', '<work-title>Retitled export'), XML.replace('<measure number="1">', '<measure number="900"><print new-system="yes"/>')]:
            changed = self.inspect(modified)
            self.assertNotEqual(changed['source']['sha256'], self.base['source']['sha256'])
            self.assertEqual(changed['structuralFingerprint'], self.base['structuralFingerprint'])
    def test_equivalent_divisions(self):
        changed = self.inspect(XML.replace('<divisions>2', '<divisions>4').replace('<duration>2', '<duration>4'))
        self.assertEqual(changed['structuralFingerprint'], self.base['structuralFingerprint'])
    def test_mxl_repack(self):
        path = self.root / 'fixture.mxl'
        for compression in [zipfile.ZIP_STORED, zipfile.ZIP_DEFLATED]:
            with zipfile.ZipFile(path, 'w', compression=compression) as z:
                z.writestr('META-INF/container.xml', '<container><rootfiles><rootfile full-path="score.xml" media-type="application/vnd.recordare.musicxml+xml"/></rootfiles></container>')
                z.writestr('score.xml', XML)
            result = baseline.analyze({**self.song, 'asset': 'fixture.mxl'}, self.root, 'test')['editions']['test']
            self.assertEqual(result['structuralFingerprint'], self.base['structuralFingerprint'])
    def test_unique_ids(self):
        with self.assertRaises(ValueError):
            baseline.generate([self.song, self.song], self.root, 'test')

if __name__ == '__main__': unittest.main()
