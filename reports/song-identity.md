# Song identity and editable metadata

All 121 published song IDs are permanent opaque keys. Some legacy strings resemble
numbers (`cs-236`, `hhc-1010`) or titles (`nativity`, `silent-night`); these are NOT
expressions derived at runtime and must never be renamed to match edited metadata.
No identity migration or browser-storage migration is needed.

Favorites, custom-list membership and saved manual ordering are ID arrays in
`music-transpose-library-v1`. Recently Played uses the same IDs. Opening scores,
Lyrics lookup and active-song state use IDs. Playback uses ID plus current XML as
its cache version; page/title edits do not affect it. Asset-path caching is a file
cache, not a song reference. Key/octave/playback positions are temporary; there is
no saved per-song transpose/playback preference to migrate. Navigation speed/mode
and PDF trim are global session preferences, not page-indexed song settings.

Title, collection, edition, song number and page are metadata. Keep current
collection/page display fields for compatibility (the historical `page` field also
contains hymn/song numbers). `collectionMemberships` supports additional factual
references, for example `{collection: 'Future Hymnal', edition: '...',
songNumber: '...', page: '...', title: '...'}` alongside an original edition.
Only add such memberships from authoritative evidence. No future membership is
invented here, and no visible labels are changed.

The importer formerly regenerated IDs from collection/page. It now matches already
bundled score bytes to their existing published IDs and allocates UUID-based IDs
for new unmatched imports. The existing four original scores retain their explicit
IDs and existing import deduplication. No import was run and no archive was touched.
A changed arrangement/source file cannot safely be identified by hash alone:
reconcile it explicitly to the existing song ID when appropriate. Keep its lyrics
record ID and asset reference aligned; do not infer identity from title or number.
Do not use the historical importer as a general metadata editor or full-catalog
migration tool.

Validation: `tests/song-identity.mjs` changes page, title, collection and catalog
position across a browser reload while preserving IDs and saved data. It checks
Favorites, multiple lists, manual order, Recent, score opening, unchanged XML,
playback pitches and key transposition/reset for both a legacy number-shaped ID
and an original named ID. `tests/test_song_identity.py` tests import ID reuse and
UUID allocation. These tests use only project assets.
