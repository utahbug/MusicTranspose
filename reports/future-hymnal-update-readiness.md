# Future hymnal update readiness

## Frozen 2026 baseline

- Snapshot: **2026-09-18 bundled snapshot**, made from repository assets at starting
  commit `af9f5476b9430433d623b2d7fbaf3c6f71052899` (archive provenance is 2026-09-16).
- Manifest: `data/score-baseline-2026.json`.
- Actual catalog: **119 structured MXL scores**, plus two PDF-only records explicitly
  excluded by stable ID. No hard-coded expected score count in the generator.
- No runtime files, song assets or archive files changed. D: archives were not read.
- This is a historical snapshot, not a prediction of publication dates or contents.

## Stored fields

Each stableSongId owns an `editions` map keyed by the explicit snapshot label.
Each edition stores title, collection, known edition, song number, page number,
legacy catalog locator, and additional collection memberships; relative asset
reference, source format, internal MXL rootfile and SHA-256; catalog original key,
mode and review evidence; all encoded key declarations, time signatures and tempo
markings with zero-based part/measure positions; measure count and per-part counts;
part/staff counts; harmony count; lyric-event count and distinct encoded verse IDs.

The old catalog `page` field also holds hymn numbers. For Hymns (1985) and Hymns
for Home and Church it is recorded as songNumber, not a guessed printed page.
For Children's Songbook it is pageNumber. Explicit songNumber/pageNumber metadata
is supported. Unknown values are null; only Hymns (1985) gets the documented
`1985 English` edition label. No future values are populated.

Encoded source mode and catalog mode are deliberately separate. Existing review
evidence occurs for Follow the Prophet, Gethsemane, My Song in the Night,
What Child Is This?, and The Shepherd's Carol. No musical corrections are made.
All current scores contain encoded tempo and numbered lyric identifiers. All
parts of each current score agree on measure count. Staff counts use maximum
explicit staves/staff values per part; unstaffed ordinary notes imply staff 1.
Verse count means distinct encoded lyric-number identifiers, not verified complete
singable verses or expanded performance order. Tempo values are encoded values,
not a synthesized performance tempo.

## Hashes and conservative structural fingerprints

Raw SHA-256 covers the exact bundled file bytes (including MXL ZIP packaging).
`musicxml-structure-v1` SHA-256 covers deterministic UTF-8 JSON of part, measure and
musical-event sequences. XML attribute ordering is sorted; indentation is ignored;
text whitespace is collapsed. Duration/offset values are normalized to rational
quarter-note units using current divisions. Pitches, rests, voices, staff references,
keys, meter, harmony, lyric syllables/text, ties/slurs, other note notations,
directions, tempo and barline/repeat structures are retained.

Separate component hashes identify notes/rhythm, keys, time signatures, harmony,
lyrics, directions, and per-part measure sequence/count. These support a future
comparison report without implementing one now. Full fingerprint catches additional
encoded changes outside those categories. Structural components preserve positions,
so inserting a measure can change later components too; they are signals, not an
exact edit diagnosis.

Excluded: print/page/system layout, drawing coordinates, font/color/style/placement,
editorial measure labels, IDs, lyric line/paragraph layout hints. Work titles,
credits, identification, defaults and part-list metadata are outside the musical
part sequence. Title comparison uses edition metadata. Original files retain all
excluded information and their raw hashes cover it.

Limitations requiring review:

- This is NOT a universal MusicXML canonicalizer or proof of musical equivalence.
  Musical child/event order is retained deliberately (backup/forward/voice order
  matters). Equivalent voice serialization, redundant attributes, alternate
  enharmonic spellings and different notation encodings may yield different hashes.
- Part/instrument metadata outside musical parts is not structurally fingerprinted;
  use raw-file comparison and human review for instrumentation/copyright changes.
- Repeats are encoded, not unfolded; arrangement equivalence, D.C./D.S. performance,
  editorial text meaning and completeness of lyrics require human review.
- Only score-partwise MXL/MusicXML is accepted. Unsupported or malformed sources
  fail the build rather than silently disappearing. No PDF/OCR fingerprinting.
- Compare structural hashes only with the same fingerprint algorithm version.
  Retain old manifests/tool versions if the extraction algorithm changes.

## Identity and future editions

Stable IDs remain authoritative and unchanged. Legacy IDs that look like page
numbers or titles are opaque permanent keys. Do not match automatically by number,
page, title, catalog position or source hash alone. A hash proves bytes, not hymn
identity. Collection/title/number/page/key/arrangement changes do not rename IDs.

For an authoritatively matched existing hymn, add another entry to its `editions`
map using a new snapshot label and preserve the 2026 entry. The matching process
must supply that same explicit ID to the future input catalog. A truly new hymn
gets a new UUID-based stable ID. An absent/removed hymn keeps its historical 2026
edition record; absence does not delete it or saved user references. Different
arrangements may belong to the same underlying hymn only when identity is clear.
No retired-song UI or new identities were added in this task.

## Reproduction and recommended future workflow

Requires Node.js plus Python 3.9+ (standard library only). Set `PYTHON` to the Python
executable if it is not named `python` on PATH. Run from the project root:

```text
node tools/build-score-baseline.mjs --output test-results/baseline-check.json
python tests/score-baseline.py
node tests/score-baseline.mjs
```

The Node wrapper exports the actual `songs.js` catalog, avoiding a duplicated catalog.
It normally writes the 2026 path; use an explicit different output for future work.
Do not overwrite the committed historical baseline after catalog changes.

When an authoritative future edition is available:

1. Preserve new source bytes in a separate collection folder; never overwrite 2026
   assets. No downloader is provided here.
2. Reconcile identities using authoritative evidence and review ambiguous cases.
   Prepare a JSON catalog array with explicit `id`, `title`, `collection`, `edition`,
   `songNumber`, `pageNumber`, `asset` and available key/source metadata. Assets must
   be relative paths inside the selected root. Reuse IDs for confirmed existing
   hymns, allocate new IDs only for genuinely new hymns.
3. Generate a separate manifest (example paths are illustrative):

```text
python tools/score-baseline.py --catalog reviewed-future-catalog.json --root future-scores --label "future published edition" --output data/score-baseline-future.json
```

4. Join records by stableSongId. Compare title/collection/edition/songNumber/pageNumber
   separately from raw SHA-256 and structural/component hashes. A raw change with
   unchanged structural hash is a candidate packaging/layout/metadata-only change,
   not an automatic assurance that every meaningful aspect is identical.
5. Review changed components in the preserved score sources. Confirm arrangement,
   key, rhythm, harmony, lyrics, directions and measure changes before updating the
   active app edition. Missing IDs remain historical; do not delete them.
6. Attach reviewed edition records to the same identity, then decide which edition
   the app displays in a later task. No comparison UI is implemented now.

## Validation

Seven Python tests with subcases use only temporary fixtures under test-results:
page-number, song-number and title-only edits; key, note pitch, duration, lyric,
chord, tempo, expression, slur and time-signature changes; measure addition/removal;
XML indentation/layout/work-title changes; equivalent divisions; MXL recompression;
and duplicate-ID rejection. The full-catalog Node check generates the manifest
twice, compares both byte-for-byte to the committed baseline, verifies every current
structured ID exactly once and rehashes all 121 bundled assets before/after.

All tests passed. These baseline checks intentionally detect later catalog changes;
when future editions are added, preserve the old baseline and adapt coverage tests
to compare each edition's own explicit catalog rather than rewriting history.
