# Children’s Songbook full local-archive import

Starting commit: `f325253547c223d0e12ef640f4f6843ad1dc6a05` on `codex/pages` in the existing MusicTranspose repository. No source archive was changed and no music was downloaded.

## Coverage

Sources: `D:\LDS_Music_MXL\2026-09-16` and `D:\LDS_Music_PDFs\2026-09-16`, using their recovered canonical manifests.

| Measure | Count |
|---|---:|
| Expected source entries | 268 |
| Covered before | 37 |
| New records/assets | 227 |
| Covered after, all native MXL | 264 |
| New PDF fallbacks | 0 |
| Missing/unrecoverable | 4 |
| Full Library records | 681 |

Before coverage was 36 primary Children’s Songbook records plus the existing shared page-103 membership on `hhc-1054`. After coverage is 263 primary records plus that shared membership. All 454 preexisting catalog records were deep-compared unchanged. Existing other collections remain 335 Hymnal, 81 Home and Church, and two Other PDF records. Membership totals exceed song totals because a song can belong to multiple collections.

Classification: 227 A (new structured import), 37 F (reconciled existing identity), four C (unrecoverable); zero B, D or E. The complete 268-row inventory and matrix include page, canonical title, stable ID, source path/hash, selected format, validation statuses and exceptions.

Missing entries: 201 **When Grandpa Comes**; 229 **God Is Watching Over All**; 238 **Springtime Is Coming**; 265 **Be Happy!**. Neither native MXL nor usable score PDFs are available. Their archived PDFs are licensing notices, not sheet music; these were not misrepresented as scores. Coverage is therefore all recoverable entries, not all 268 expected entries.

## Identity, metadata and sorting

Existing IDs, assets, evidence and overrides are unchanged. New entries use the current shared `song_identity.py` UUID identity mechanism and `song-UUID.mxl` naming; IDs are persisted and independent of editable titles/pages. Existing `cs-*`, `nativity`, `shepherd` and other historical IDs are retained. All 264 selected bundled MXL files were SHA-256 verified against their archived source bytes.

“When I Am Baptized” (Children’s Songbook 103 / Home and Church 1054) reuses one existing ID and identical asset. The minimal `songForSource` presentation helper displays and sorts its Children’s page 103 in that Source filter without changing the canonical record. All Sources and the score header retain its existing canonical Home and Church 1054 identity/label. Search still indexes all collection relationships.

Numeric ordering uses the existing numeric-first, locale-aware suffix comparator. Explicit tests cover `40, 40a, 40b, 41`, `267, 267a, 268`, and `275, 275a, 276`; actual source suffixes are preserved. A–Z punctuation handling and search semantics remain unchanged. Search tested low/middle/high numbers 2/103/299, suffix 40b, full and partial title. Source-specific rows show the proper collection number without duplicating songs.

## Structured-score validation

All 264 Children’s MXL scores parsed and rendered in OSMD without fatal errors. All 264 passed source-versus-display opening checks: first measure present, source/rendered note counts retained, and first lyric content retained when present. Original archived XML is never edited. These checks protect the opening-direction presentation path; they are not a claim of manual proofreading of every measure.

260 scores passed transposition checks for key signature, pitched notes, harmony symbols and preserved nonpitch content, including lyrics. Four modulating scores remain explicitly **View only** for transposition under the existing safety rules:

- 112 The Commandments
- 142 Every Star Is Different
- 170 The Things I Do
- 256 We Welcome You

All 264 passed playback timeline checks. All have encoded tempo; none requires fallback tempo. Playback remains linear through written measures; repeats/verse performance order is not expanded. Existing grace-note playback omissions were reported on pages 44, 297 and 298. Key/octave/reset and shared Score/Lyrics playback behavior passed existing regressions. No audio dependencies were added.

Original key/mode follows the shared structured-source pipeline. Existing D-minor override for The Shepherd’s Carol and C-minor override for cs-110 remain intact. No speculative new modal/minor overrides were added; source declarations are not independent harmonic verification. Modulating cases are recorded above and in the matrix.

## Lyrics audit

The existing extraction/index pipeline was rerun across the entire catalog, including every previously present Children’s score.

- 240 Children’s entries expose Lyrics: 232 extracted, eight available with existing review notes.
- 11 ambiguous extractions are deliberately withheld rather than presented as reliable: pages 12, 14, 42, 78, 154, 178, 182, 190, 204, 231, 266.
- 13 instrumental scores legitimately have no lyrics: 288, 289, 290, 291, 292a, 292b, 293, 294, 295, 296, 297, 298, 299.
- No previously missing but otherwise valid extraction was found among the preexisting entries. Ambiguous withheld entries were not falsely “repaired.”

`assets/lyrics.json`, `lyrics-index.js` and `lyrics-extraction-audit.json` are regenerated derived data. Source verse ordering and punctuation are handled by the unchanged pipeline. Per-song status/reasons are in `childrens-songbook-validation-matrix.json` and `childrens-songbook-lyrics-exceptions.md`.

## Visual and responsive checks

Manually inspected screenshots for 11 songs: I Am a Child of God (2), A Song of Thanks (20a), The Shepherd’s Carol (40b), Away in a Manger (42), I Feel My Savior’s Love (74), When I Am Baptized (103), The Commandments (112), Love Is Spoken Here (190), It’s Autumntime (246), Head, Shoulders, Knees, and Toes (275a), and Distant Bells (299). These cover low/middle/high pages, suffixes, sharp/flat/minor keys, multi-page scores, accompaniment/chords, multiple verses and instrumental content. No usable new PDF fallback exists to inspect.

Specific exception: page 42 has tight lyric spacing near “Bless all” in the second system at 820px. Recorded without a global renderer change. Ambiguous split-voice lyrics remain visible in their original scores even when the separate Lyrics view is withheld.

Phone 390px, iPad portrait 820px, iPad landscape 1180px and desktop 1440px passed Library overflow/search checks. Existing performance tests on Children’s scores passed at all four widths: score-size reflow, title safety, key selection, octave, Reset, playback, print, and Score/Lyrics navigation. Touch page zones/keyboard/pedal and Continuous navigation tests passed on Nativity/cs-110 and the existing PDF viewer. No app layout or score renderer was redesigned.

## Offline, persistence and performance

The existing shell/runtime cache design remains. Service worker version advances to v72; the score manifest now has 681 unique bundled assets. Scores are not part of the install-blocking shell precache. Existing four-worker background cache warming and on-demand runtime caching are preserved, including retention of older cached score bytes across updates. Complete-cache acceptance checked every manifest asset, then reloaded offline and opened a previously unvisited new score (248 Falling Snow), transposed it, played it and added it to Favorites/Lists. Existing tests also passed offline Lyrics, PDF and navigation.

Catalog startup loads metadata, not 679 parsed scores. Score parsing/rendering remains on demand; cache warming downloads bytes without parsing every score. Measured automated Library search/clear roundtrips were approximately 33–39ms across the four viewports (test-machine results, not a device benchmark).

No IndexedDB or localStorage schema change. My Music import/validation, duplicate detection, stable IDs, reload persistence, offline opening, deletion cleanup and Favorites/Lists compatibility passed. No user files are added to the public catalog. Favorites, list IDs/membership/order and preferences remain stable-ID based.

## Future edition baseline

The existing `data/score-baseline-2026.json` now covers all 679 structured catalog records. New records carry collection membership, edition/archive context, source hash and immutable identity. Future renumbering/retitling/musical comparison can use the existing baseline tools; no future edition was guessed and no Legacy migration or deletion was performed.

## Tests and changed areas

New acceptance: `tests/childrens-songbook.mjs`. Existing import/render/tempo/report scripts accept the Children’s collection mode rather than introducing a second pipeline. Full matrix output: `childrens-songbook-validation.json`, `childrens-songbook-tempo-mode-audit.json`, `childrens-songbook-validation-matrix.json`, plus before/after `childrens-songbook-inventory.json`.

Passed browser regressions: library-simplified, library-alphabetical, lists-page, my-music, playback, lyrics, lyrics-fun, performance-placement and performance-navigation. Sample scores exercised opening, transpose above/below, Reset, playback, Lyrics and print. Existing test catalog-count expectations were updated to 681 records / 679 structured scores.

Changes are the 227 bundled scores, central catalog/derived Lyrics/baseline/cache manifest, two small Library source-presentation changes, reusable audit/import tools, tests and these reports. Rendering, transposition, playback, Lyrics extraction, PDFs, public/noindex posture and UI layout are unchanged.

Deployment uses the existing `codex/pages` root GitHub Pages source. The final commit and live verification are reported in the task completion summary.
