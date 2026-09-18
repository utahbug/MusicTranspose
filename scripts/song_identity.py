"""Import-time identity preservation. No archive access or runtime dependency."""
import hashlib
import json
import uuid


def existing_score_ids(root):
    # Existing published IDs are permanent, even when their spelling resembles metadata.
    text = (root / 'imported-songs.js').read_text(encoding='utf-8')
    songs = json.loads(text.split('export const importedSongs=', 1)[1].strip().removesuffix(';'))
    return {hashlib.sha256((root / song['asset']).read_bytes()).hexdigest(): song['id']
            for song in songs}


def resolve_song_id(source_hash, known_ids):
    # Hash is an import matching aid, NOT the song's identity. A revised score needs
    # explicit reconciliation to its existing ID, not a guessed title/page match.
    if source_hash not in known_ids:
        known_ids[source_hash] = 'song-' + str(uuid.uuid4())
    return known_ids[source_hash]
