# Melody-only coverage audit — 2026-09-29

Audited source commit `051720f51d36379291a727a3b3618f59ae8dacb8`. **Conclusion B: extraction genuinely rejects many non-Hymn sources under the current rules; the availability index is exact.** This is an audit, not proof that rejected songs lack a musically valid melody.

## Collection coverage

Counts use each bundled catalog entry’s primary `collection` (not Library aliases, memberships, or title assumptions). No Other/Additional structured collection exists in the current catalog. Instrumental/additional titles such as Impromptu and To a Wild Rose are cataloged under Children’s Songbook. The two other collections contain PDF-only songs.

| Collection | Total | PDF-only | Structured | Metadata Melody | No Melody | Coverage | Live success |
|---|---:|---:|---:|---:|---:|---:|---:|
| Children’s Songbook | 263 | 0 | 263 | 33 | 230 | 12.55% | 33 |
| Hymns (1985) | 335 | 0 | 335 | 210 | 125 | 62.69% | 210 |
| Music from the Friend | 1 | 1 | 0 | 0 | 0 | — | 0 |
| Primary-use music | 1 | 1 | 0 | 0 | 0 | — | 0 |
| Hymns for Home and Church | 81 | 0 | 81 | 2 | 79 | 2.47% | 2 |
| **Total** | **681** | **2** | **679** | **245** | **434** | **36.08%** | **245** |

## Index reconciliation

- A — indexed and extracts successfully: **245**.
- B — not indexed but extracts successfully: **0**.
- C — indexed but fails extraction: **0**.
- D — not indexed and fails extraction: **434**.
- `supportsLead(song)` agrees with `bundledLeadIds` for every catalog entry. No orphan index IDs or duplicate catalog IDs.
- Missing successes by collection: Hymns **0**, HHC **0**, Children’s **0**. Stale positives by collection: **0** each.
- All 679 source fetches/unpacks/extraction calls completed; no fetch/parsing infrastructure errors. No production metadata changes are justified.

## Failure reasons

These are first returned guard failures, not exhaustive diagnoses. `hymn-*` reasons come from hymn-melody.js in addition to the general leadReasons values. Blank detail strings are preserved in the JSON rather than invented.

| Actual reason | Count | Affected collections (count) | Representative song | Representative detail |
|---|---:|---|---|---|
| chordal-melody | 238 | Hymns for Home and Church (71), Children’s Songbook (167) | Come, Thou Fount of Every Blessing — hhc-1001 | (empty string) |
| hymn-notation | 68 | Hymns (1985) (68) | Oh, Come, All Ye Faithful — faithful | Small, rest or unclassified cue notation requires review |
| multiple-lyrics | 54 | Children’s Songbook (46), Hymns for Home and Church (8) | The Nativity Song — nativity | P1:1:1, P1:2:3, P1:1:2 |
| hymn-structure | 20 | Hymns (1985) (20) | We Ever Pray for Thee — song-7e7e0440-5d08-4272-8abc-1a3c04020bc6 | Requires two staves in upper G / lower F order |
| hymn-lyrics | 13 | Hymns (1985) (13) | The Morning Breaks — song-3f9eca82-5b22-4785-8ac8-9e7c8c34070b | Lyrics outside the upper staff or no soprano lyrics |
| no-melody | 13 | Children’s Songbook (13) | Impromptu — song-8fa768c2-7402-4551-800a-2bdf30049be5 | (empty string) |
| hymn-annotations | 12 | Hymns (1985) (12) | Come, Sing to the Lord — song-0062ade2-ac69-44dc-8de7-a487aed78391 | Slur endpoint has no matching start in the selected voice |
| hymn-divisi | 8 | Hymns (1985) (8) | Glorious Things of Thee Are Spoken — song-78c0fc15-9524-4949-bcdc-fdd85578e169 | More than two concurrent pitches on a staff |
| outside-cues | 4 | Children’s Songbook (4) | The Shepherd’s Carol — shepherd | P2:1:1 |
| hymn-voices | 3 | Hymns (1985) (3) | Come unto Jesus — song-6b2e4b0d-14ab-45b8-88f2-2920e489aad8 | Lyric voice has a gap, overlap or competing voice |
| hymn-crossing | 1 | Hymns (1985) (1) | Ye Elders of Israel — song-7f407f0f-8d10-4bc4-9d74-03806c7e0969 | Another upper-staff voice crosses above the identified soprano |

## Specific song checks

| Song | ID | Collection | Indexed | Live extraction | Events | Harmonies | Exact reason / detail |
|---|---|---|---|---|---:|---:|---|
| The Spirit of God | song-a13c43da-0243-4019-ad08-d7be530074f5 | Hymns (1985) | yes | success | 113 | 0 | — |
| Amazing Grace | hhc-1010 | Hymns for Home and Church | no | failure | — | — | chordal-melody / '' |
| As I Keep the Sabbath Day | hhc-1035 | Hymns for Home and Church | yes | success | 56 | 34 | — |
| When I Am Baptized | hhc-1054 | Hymns for Home and Church | yes | success | 55 | 20 | — |
| Come, Thou Fount of Every Blessing | hhc-1001 | Hymns for Home and Church | no | failure | — | — | chordal-melody / '' |
| It Is Well with My Soul | hhc-1003 | Hymns for Home and Church | no | failure | — | — | multiple-lyrics / 'P1:1:1, P1:1:2' |
| I Want to Be a Missionary Now | cs-168 | Children’s Songbook | yes | success | 54 | 16 | — |
| I Hope They Call Me on a Mission | cs-169 | Children’s Songbook | yes | success | 52 | 25 | — |
| Head, Shoulders, Knees, and Toes | cs-275a | Children’s Songbook | yes | success | 23 | 6 | — |
| The Nativity Song | nativity | Children’s Songbook | no | failure | — | — | multiple-lyrics / 'P1:1:1, P1:2:3, P1:1:2' |
| The Shepherd’s Carol | shepherd | Children’s Songbook | no | failure | — | — | outside-cues / 'P2:1:1' |
| Impromptu | song-8fa768c2-7402-4551-800a-2bdf30049be5 | Children’s Songbook | no | failure | — | — | no-melody / '' |
| To a Wild Rose | song-3c854990-9860-47b6-88f2-c395d45ebae5 | Children’s Songbook | no | failure | — | — | no-melody / '' |

Amazing Grace is **hhc-1010**, `assets/scores/hhc-1010.mxl`, HHC 1010. Not indexed; supportsLead false; createLeadXML ok false; exact reason **chordal-melody**; exact detail **empty string (`""`)**. Message: “The sung line is written as chords, so a single melody cannot be identified safely.” Candidate selection is P1 / staff 1 / voice 1. This is not an index omission.

Events count extracted `<note>` elements, including rests and notes without lyrics; harmonies count extracted `<harmony>` elements. Failed extractions have null counts because their returned XML is the unchanged full score, not extracted melody. Full rows, including exact reason/detail/selection for every source, are in [melody-coverage.json](melody-coverage.json).

## Collection concentration and recommendation

Hymns supplies **210/245 = 85.71%** of supported songs while representing **335/679 = 49.34%** of structured sources. Non-Hymns coverage is **35/344 = 10.17%**. This concentration is real.

The algorithms are deliberately asymmetric: createLeadXML routes bundled Hymns (1985) IDs through hymnMelody(), a dedicated upper-voice/soprano projector. Other collections use the conservative lyric-lane projector and, only after chordal-melody rejection, the tightly guarded repeated-cadence rule. No conclusion about broad safety of applying the Hymns projector to other collections follows from these counts.

HHC has only **As I Keep the Sabbath Day (1035)** and **When I Am Baptized (1054)** enabled. Its 79 failures are 71 chordal-melody and 8 multiple-lyrics. Children’s has 33 enabled and 230 failures: 167 chordal-melody, 46 multiple-lyrics, 13 no-melody, 4 outside-cues. Combined HHC/Children’s failures are 238 chordal-melody (77.02% of 309 failures), 54 multiple-lyrics, 13 no-melody, and 4 outside-cues.

Recommend a separate, explicitly scoped extractor investigation of chordal lyric lanes first, then multiple lyrical voices. Use representative source-level pitch/rhythm/lyric/slur evidence and adversarial regressions; preserve non-lyric notes and reject uncertain melody ownership. Amazing Grace is a useful investigation candidate, not an authorized automatic highest-note conversion. No extractor bug was established by this audit, and no extraction logic or index is changed.

## Generator review

tests/lead-audit.mjs imports the complete bundled `songs` array from songs.js (which includes imported-songs.js) and filters only `scoreType !== "pdf"`. It passes the complete song context into current createLeadXML(source, song). It does not filter by collection, naming prefix, legacy/imported origin, or existing index membership. All 81 HHC and 263 Children’s sources are included, along with all 335 Hymns. Local user files are intentionally outside the bundled audit; their runtime leadAvailable calculation remains separate.

WRITE_INDEX writes the successful existing song IDs in catalog order. It does not mint/rename IDs. songs.js declares IDs immutable, and this audit verifies uniqueness and index membership. No newer-song exclusion was found. The optional WRITE_REPORT introductory sentence contains a hard-coded 679 count: accurate today, but it can become stale if the catalog grows. This affects report wording only; the scan and index generation are dynamic. The generator was not modified and WRITE_INDEX/WRITE_REPORT were not enabled.

## Verification and changed files

- tests/lead-audit.mjs: all 679 structured sources; 245 successes, 434 guarded failures.
- tests/melody-coverage.mjs: independent current extraction pass; supportsLead/index comparison, per-song note/harmony counts, collection summaries, duplicate/orphan checks; direct Melody opens for HHC 1035/1054, Children’s cs-168/cs-169/cs-275a, and Hymns The Spirit of God.
- tests/lead-hhc1035.mjs: focused extraction and negative guards.
- tests/score-view-menu-state.mjs: selected/available/disabled semantics and viewport/keyboard behavior at 320, 390, 820, 1180, and 1440px; passed on standalone rerun after an initial Library-loading timeout during concurrent checks.
- No unrelated music-engine/chord or full-app suite.

Changed only tests/melody-coverage.mjs, reports/melody-coverage.json, and reports/melody-coverage.md. Production files, generator, availability index, and extraction algorithms are unchanged. This is an audit/report commit; no application deployment is needed.
