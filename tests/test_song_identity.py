import sys, unittest, uuid
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parents[1] / 'scripts'))
from song_identity import existing_score_ids, resolve_song_id
class IdentityTest(unittest.TestCase):
    def test_existing_and_new(self):
        known = existing_score_ids(Path(__file__).resolve().parents[1])
        before = dict(known)
        for digest, identity in before.items():
            self.assertEqual(resolve_song_id(digest, known), identity)
        first = resolve_song_id('new-source', known)
        uuid.UUID(first.removeprefix('song-'))
        self.assertEqual(first, resolve_song_id('new-source', known))
        self.assertNotEqual(first, resolve_song_id('other-source', known))
        self.assertTrue(set(before.values()).issubset(known.values()))
if __name__ == '__main__': unittest.main()
