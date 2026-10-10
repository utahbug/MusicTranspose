# Final selected chord overlays — Batch 8

Date: 2026-10-10. Starting commit: `cdb48a2bd268125a7975ab356f41d99041df57e7` (includes the accepted About update).

[Cumulative piano-review index](chord-review-index.html) · [Machine-readable index](chord-review-index.json) · [Detailed Batch 8 source evidence](chord-expansion-batch8.json)

All thirteen selected hymns were generated using the established inference and display pipeline, with no threshold changes or manually supplied progressions. These remain inferred musical suggestions. Findings below are automated observations, not confirmed musical errors.

| # | Title / arrangement | Original key | Symbols | Recorded omitted windows | Review findings | Outcome |
|---:|---|---|---:|---:|---|---|
| 176 | ’Tis Sweet to Sing the Matchless Love (first tune) | G major | 18 | 4 | F#dim at X9 +2 | Generated |
| 177 | ’Tis Sweet to Sing the Matchless Love (second tune) | E♭ major | 25 | 4 | Dense clusters at X4, X6–X9 and X16–ending 1 | Generated |
| 182 | We’ll Sing All Hail to Jesus’ Name | B♭ major | 21 | 1 | One omitted window | Generated |
| 183 | In Remembrance of Thy Suffering | C major | 16 | 15 | Bdim at X11 +0 and X12 +2; 15 recorded omissions include 8 rounding tails | Generated |
| 190 | In Memory of the Crucified | D major | 21 | 4 | G#dim X3 +0; C#dim X7 +0; dense X4–X5 | Generated |
| 216 | We Are Sowing | E♭ major | 10 | 3 | Three omitted windows | Generated |
| 235 | Should You Feel Inclined to Censure | G major | 19 | 2 | Two omitted windows | Generated |
| 285 | God Moves in a Mysterious Way | E♭ major | 8 | 0 | No automated warning | Generated |
| 293 | Each Life That Touches Ours for Good | E♭ major | 18 | 8 | Abmaj7 X6 +2; Ebmaj7 X12 +1 | Generated |
| 338 | America the Beautiful | C major | 24 | 15 | 15 omissions; Bdim X9 +2; dense X8–X9 | Generated |
| 339 | My Country, ’Tis of Thee | F major | 14 | 5 | Five omitted windows | Generated |
| 340 | The Star-Spangled Banner | A♭ major | 40 | 23 | 23 omissions; dense X27–X29 and X37–X38 | Generated |
| 341 | God Save the King | F major | 14 | 5 | Five omitted windows | Generated |

Measure labels are copied from MusicXML, including X prefixes and ending labels. `+n` denotes quarter-note offset, not a printed beat number. Full exact omissions, qualities and cluster endpoints appear in the JSON and the expandable cumulative index.

248 symbols were added. The 89 recorded omitted windows include eight #183 boundary tails of approximately 4.44e-16 quarter notes (X1, X2, X10–X14, X17, all at +3). These are numerical artifacts rather than meaningful musical gaps, leaving seven substantive omissions for #183 and 81 for this batch. Raw diagnostics, thresholds and chord output are preserved. No omitted passage was force-filled; a preceding symbol does not establish harmony across a gap.

## Completion and source identity

- **182 generated overlays + native #70 = 183/341 chorded hymns.** 158 remain unchorded: 152 with usable XML and six restricted entries.
- **22/22 hymns in the latest selection complete; zero deferred or blocked.** No other hymn was processed.
- #176 and #177 were inferred independently from distinct source files and fingerprints, with different note streams, keys (G / E-flat), lengths (17 / 20 measures) and resulting overlays (18 / 25 symbols). The review index explicitly labels first and second tunes. No tune was merged or copied.
- All thirteen have bundled usable MusicXML and corresponding original PDF assets. None is marked licensing-restricted in the authoritative catalog. The existing six restricted entries remain #12, #54, #86, #124, #219 and #299. This records project source availability, not a new determination of rights ownership or permissions. No restricted music was reconstructed.
- No selected score has an internal key-signature change. Existing #280 internal-modulation support and source data remain intact.
- All preceding 169 overlay records, prior review entries (including #280 historical deferral), technical observations, original MXL/PDF assets and About content are preserved. The prior unchorded CSV/XLSX/Markdown inventory remains its original dated snapshot.

## Validation

- Six focused Python tests passed: exact thirteen-song scope and 248-symbol count; no unrelated overlays; source fingerprints and unchanged assets; independent #176/#177 tunes; 341-hymn/182-overlay coverage; frozen inference/runtime/About; previous review and inventory preservation; targeted regeneration.
- Frozen inference (7), display (14), temporal display (7), #280 data (2) and cumulative review index (2) tests passed. Targeted and full-generation `--check` succeeded.
- All thirteen sources passed the native/text-harmony audit. All 169 key cases (-6 through +6) passed chord root/quality checks, repeated transposition, exact reset, unchanged lyric/direction content and note-driven playback.
- PDF, Full Score and Melody-only rendering tested at 390/820/1440 CSS px. Full/Melody exercised [0,+2,-2,+2,0], retained harmony counts and in-bounds footer return targets.
- All **26 actual +2 MusicXML downloads** (thirteen songs × Full/Melody) matched the working XML, with real generated harmony elements and unique IDs.
- **78 Full/Melody viewport cases** found no visible chord/chord or chord/lyric text-bound collisions or tight pairs. The detector does not cover every staff/beam glyph or hidden page. Representative #176 Full Score and #177 transposed Melody-only screenshots were visually inspected.
- Chord regression unit mode: 7,288 checks passed for qualities, punctuation, optional labels, enharmonic spelling, root/bass, structured harmony and playback. Native #70 passed 13 key cases and exact reset.
- #280 modulation passed rendering/key/reset at all three widths. **905 exact XML comparisons** across all 181 non-modulating overlays matched the prior transposer.
- Current footer acceptance passed at 390/744/820/1440. Batch 8 Score/Lyrics round-trip, preserved transposed harmony state and Library return passed at 390/820/1440.
- Metronome audio/preferences/geometry passed at 390/820/1440. About passed phone/tablet/desktop in both themes. Offline bulk controller/worker tests passed with isolated cache doubles, including List retention and failure recovery.
- The cumulative index passed filtering, keyboard disclosures, responsive layout, report links and separate #176/#177 presentation. Syntax, offline-catalog reproduction, web manifest JSON, storage manifest, generation reproducibility and Git whitespace checks passed.

### Known legacy-test limitations, separate from Batch 8

Five prior failures are retained from the Batch 7 report rather than claimed as new passes. Their test files and related runtime/markup are unchanged from the Batch 8 starting commit; they were not rerun or rewritten here:

1. `tests/harmony-expansion-batch6.py`: historical `styles.css` lock predates the accepted licensing-notice change at `2e85b4f`.
2. `tests/chord-harmony.mjs`, full-catalog mode: includes six unavailable entries without MXL assets and fails ZIP parsing. Supported unit-only mode and targeted source checks passed here.
3. `tests/score-footer-stability.mjs`: removed `#page-position` selector. Current footer acceptance and batch geometry checks passed.
4. `tests/score-lyrics-toggle.mjs`: waits for a hidden first Library row. Current-control Batch 8 round-trip tests passed.
5. `tests/files-lists-navigation.mjs`: missing `#library-filter` selector. This older suite remains unverified; Files/Lists implementation and data are unchanged.

No newly observed Batch 8 application failure is classified as pre-existing. A test-development arithmetic expectation was corrected from 268 to the actual 248 generated symbols before the focused suite passed.

## Files and delivery

- `generated-harmony-data.js`: thirteen appended overlays; earlier records unchanged.
- `tools/harmony-expansion-batch8.py`: scoped generator and source-based diagnostics; `tools/harmony-inference.py`: orchestration hook only.
- `reports/chord-expansion-batch8.json` and this summary; cumulative `chord-review-index.json` / `.html`; `tools/build-chord-review-index.py`.
- New `tests/harmony-expansion-batch8.py` and `tests/chord-expansion-batch8{,-export,-spacing,-navigation}.mjs`.
- Updated cumulative `tests/chord-review-index.py` / `.mjs`, `tests/harmony-display.py`, `tests/hymn280-data.py` and `tests/hymn280-compatibility.mjs`.
- `sw.js`: standard shell-cache version bump to v314; `storage-sizes.json`: rebuilt size metadata. No offline storage behavior changed.

No application UI, score engraving, Lyrics, source notation, About, Lists, Keyboard, Metronome or Files logic changed. Existing unrelated diagnostic work remains untouched.

Physical iPad/iPhone verification and one consolidated piano review remain to be performed. No physical-device or piano testing is claimed, and no immediate musical approval is requested. This completes the selected generation round; no additional batch is started.
