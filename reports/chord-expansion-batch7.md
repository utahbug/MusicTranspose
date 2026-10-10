# 1985 Hymnal chord expansion — Batch 7

Date: 2026-10-10. Starting commit: `660f3f82d1d90eb7649372b195441270849ac0cb`.

[Detailed analysis and exact source-measure/quarter-note offsets](chord-expansion-batch7.json) · [Cumulative musical-review index](chord-review-index.html)

All nine requested hymns generated successfully, using the frozen inference, simplification, root-only and temporal-density rules. No thresholds, musical progressions or source notation were changed. Automated observations below are review prompts, not confirmed musical defects.

| Hymn | Title | Original key | Symbols | Omitted windows | Review findings | Outcome |
|---:|---|---|---:|---:|---|---|
| 31 | O God, Our Help in Ages Past | C major | 18 | 1 | Dense changes X6–X8 | Generated |
| 69 | All Glory, Laud, and Honor | C major | 32 | 9 | Omitted windows only; no additional automated outlier flag | Generated |
| 102 | Jesus, Lover of My Soul | C major | 6 | 8 | Omitted windows only; no additional automated outlier flag | Generated |
| 106 | God Speed the Right | C major | 15 | 14 | 14 omissions; first retained chord is non-tonic; dense X11–X13 | Generated |
| 112 | Savior, Redeemer of My Soul | D major | 29 | 4 | Omitted windows only; no additional automated outlier flag | Generated |
| 115 | Come, Ye Disconsolate | C major | 18 | 2 | Omitted windows only; no additional automated outlier flag | Generated |
| 119 | Come, We That Love the Lord | F major | 15 | 1 | Omitted windows only; no additional automated outlier flag | Generated |
| 135 | My Redeemer Lives | G major | 16 | 3 | Dense changes X3–X6 | Generated |
| 171 | With Humble Heart | E♭ major | 20 | 3 | Omitted windows only; no additional automated outlier flag | Generated |

169 chord symbols were added across nine overlays. The 45 omission windows remain uninferred; an earlier chord label must not be treated as evidence of continuing harmony through those gaps. #102 has only six retained symbols and eight omitted windows: this is intentionally sparse, not a complete asserted progression. No augmented, diminished or major-seventh symbols were retained in this batch. No source key-signature changes were found.

## Coverage and preservation

- 341 unique hymns: **169 generated overlays + native #70 = 170 chorded**; 171 remain unchorded (165 with usable MusicXML and six restricted).
- Nine of the new 22-hymn selection are complete; **13 remain unprocessed**, including separate arrangements #176 and #177. No remaining hymn was selected or processed by this batch.
- All previous 160 overlays and all prior cumulative review entries/technical findings remain equivalent. Original MXL/PDF assets, native #70 and the #280 modulation overlay are unchanged.
- The CSV/XLSX/Markdown unchorded inventory is preserved as its original snapshot; it is not silently refreshed to the new totals.
- Runtime injection still uses `withGeneratedHarmony()` before transposition, Melody-only and export. Generated accompaniment retains the established root-only display policy; native slash-bass and optional/stacked harmony handling are unchanged. Playback remains driven by notation.
- The only service-worker change is the normal shell-cache version bump to v312; storage-size metadata was rebuilt for the larger overlay file. No offline storage logic changed.

## Validation

- Exact nine-song scope, source fingerprints, no duplicate events, immutable previous overlays/assets/runtime, preserved inventory/review findings and targeted regeneration: 5 tests passed.
- Frozen inference: 7 tests; display: 14; temporal simplification: 7; #280 data: 2; cumulative review index: 2 — passed. Full pipeline `--check`, targeted Batch 7 `--check` and index reproducibility passed.
- All nine songs: 117 key cases (-6 through +6), exact reset, repeated transposition, root/quality preservation, lyric/direction preservation and note-driven playback passed.
- PDF, Full Score and Melody-only rendering at 390/820/1440 CSS px passed. Full/Melody rendering exercised [0,+2,-2,+2,0] shifts; all harmony counts survived. Footer return button remained in bounds with at least 44px touch dimensions.
- All 18 actual +2-semitone MusicXML downloads (nine songs × Full/Melody) matched working XML and contained real generated harmony elements with unique IDs.
- 54 Full/Melody viewport cases detected no chord/chord or chord/lyric text collisions or tight pairs. This detector covers visible SVG text bounds, not every staff/beam glyph or hidden page. Representative #106 Full Score screenshot was also inspected.
- Chord grammar/quality/extensions/optional labels/enharmonic/root-bass regression: 7,288 checks passed in supported unit-only mode. Native #70: all 13 key cases and exact reset passed.
- #280 modulation rendering passed at all three widths. 840 exact-XML comparisons across all 168 non-modulating overlays matched the pre-modulation transposer.
- Current footer acceptance passed at 390/744/820/1440. Focused Batch 7 Score/Lyrics round-trip, preserved transposed harmony state and Library return passed at 390/820/1440.
- Metronome audio/preferences/geometry passed at 320/390/744/820/844/1440 widths; an initial bootstrap timeout at 744 passed on a bounded isolated retry, and the remaining cases passed individually.
- Offline bulk controller and worker regression passed using isolated cache doubles. Offline catalog reproduction, storage manifest, web manifest JSON, JavaScript syntax and Git whitespace checks passed.

### Broader legacy-test limitations

These suites did not fully pass; unrelated application code was not changed to satisfy obsolete assumptions:

- `tests/harmony-expansion-batch6.py`: historical byte-lock for `styles.css` predates the accepted licensing-notice change at `2e85b4f`. The Batch 7 baseline preservation check confirms current styles are unchanged. Its other three tests passed.
- `tests/chord-harmony.mjs` full-catalog mode: treats all non-PDF entries as MXL, including six restricted entries without an asset, then fails with invalid ZIP data. Its supported unit-only mode passes; actual Batch 7 assets and native #70 were validated independently.
- `tests/score-footer-stability.mjs`: references removed `#page-position`, producing a null-element error. Current footer acceptance and Batch 7 viewport checks pass.
- `tests/score-lyrics-toggle.mjs`: waits on a hidden first Library row. The focused current-control Batch 7 Score/Lyrics test passes.
- `tests/files-lists-navigation.mjs`: waits for missing `#library-filter`. This older suite remains unverified; Files/Lists code and source data were not modified.

Physical iPhone/iPad testing and piano review were not performed. Musical review remains for the later consolidated session; no immediate review is requested.

## Changed-file scope

- Data/reporting: `generated-harmony-data.js`, this report, `chord-expansion-batch7.json`, and cumulative `chord-review-index.json` / `.html`.
- Generation/report integration: `tools/harmony-expansion-batch7.py`, `tools/harmony-inference.py` (orchestration only), `tools/build-chord-review-index.py`.
- Delivery metadata: `sw.js`, `storage-sizes.json`.
- Tests: new Batch 7 Python and browser/render/export/spacing/navigation suites; cumulative review/display and #280 compatibility/data assertions updated to accommodate the added batch.

No UI, Lyrics, playback, metronome, Library, Lists, Files, source scores or inference thresholds changed. Existing untracked diagnostic work was left untouched.
