# HHC 1035 Lead engraving polish

## Lyric spacing

Pickup measure 1 has separate C4/G4 eighth-note events. Verse 3 attaches `3. Through` to C4 and `this` to G4; verses 1 and 2 share those onsets. No lyric reassignment or source changes were needed. OSMD calculates demand for every verse but caps measure elongation at 2.5x. The long pickup label hits that cap. At 820px the measured verse-3 label gap was only 0.073 engraving units, visually almost touching. Lead now honors the calculated maximum without that cap; the gap is 2.688 units. This uses existing per-verse measured widths rather than song-specific text or fixed offsets. Other size/spacing rules and full-score settings are restored unchanged.

## Harmony

Divisions=8; positions below are quarter-note beats, numbered from 1:

| Measure | Chord | XML cursor | Offset | Musical position |
|---|---|---:|---:|---|
| 5 | Gsus4 | 0 | 0 | beat 1 |
| 5 | G | 8 | 0 | beat 2 |
| 6 | G | 0 | 0 | beat 1 |

All three are legitimate separate events, not duplicate metadata. The same Gsus4-to-G sequence occurs in measure 10. Measure 14 has Gsus4 at beat 2 and G at beat 3 (cursor 20 plus offset -4 ticks). The generated Lead already preserves these timestamps. OSMD creates harmony-only staff entries for changes during held notes, but gives them x=0 without a timed note/rest anchor. At measure 5, the G entry was left of Gsus4 despite its later timestamp, and collision handling displaced it vertically.

The disposable engraving XML now supplies invisible rest anchors in a separate spacing voice only where a harmony onset has no note onset. These are not part of Lead musical XML, extraction, playback or source files. OSMD positions and spaces the legitimate chord events rhythmically. At 820px the measure-5 staff-entry x positions changed from 30.651 / 28.350 to 33.674 / 42.959 engraving units (Gsus4 / G). No harmony was suppressed.

## Paired corner marks

The source has two pairs, not a single pair. All are above-staff `direction/direction-type/words` using DingPI McKay ldsDpi and Unicode U+231C/U+231D:

- Opening: measure 1 at time 0, source default-x=81.
- Closing: measure 3 cursor 16 minus offset 8 = time 8 ticks, beat 2; default-x=113, halign=right.
- Later opening: measure 18 at time 16 ticks, beat 3; default-x=136.
- Final closing: measure 20 at time 16 ticks, the end of its two-beat partial measure; halign=right.

The general projection removes obsolete source-page coordinates but preserves these musical times. The opening's additional defect was OSMD merging simultaneous unknown text into one expression group regardless of placement: above-staff corner and below-staff Unison. The Lead-only reader adapter keeps these source corner glyphs in their own expression group. Their timestamps and placement are unchanged. No arbitrary offsets, glyph deletion, or extraction changes. The closing marks retain their original timing/placement logic.

## Validation

- Targeted HHC 1035 measure-by-measure extraction tests pass: unchanged 56 events, all three verses, 34 harmony events/onsets, transposition and octave behavior. Existing positive/negative samples remain unchanged.
- All-verse collision checks and sequential harmony x-order checks pass at 320, 820 and 1440px.
- Both pairs render separately above the staff at those widths, in original and transposed keys; print confirms all four glyphs and above-staff opening placement.
- Lead UI, print generation, Reset, playback and offline restore pass. At 820x1180, Lead remains five systems / one page; no extra tablet page introduced.
- Targeted Lead-layout suite passes across five viewport sizes and representative songs, including exact restoration of Normal engraving. No full engine/chord suites run.
- Source and output screenshots visually inspected. Production is static; locally served production files were tested.

The rules generalize to Lead scores with long lyrics, harmony changes during sustained melody notes, or these simultaneous corner/prose directions. Lead extraction is unchanged, and no source MXL, full-score layout policy, pagination algorithm or Library behavior changed.

Files: lead-layout.js, lead-view.js (engraving adapters only), lead-spacing.js, sw.js, tests/lead-hhc1035-polish.mjs, tests/lead-hhc1035-marks.mjs, this report.
