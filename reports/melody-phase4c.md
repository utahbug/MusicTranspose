# Melody Phase 4C: upper musical domains with original clefs

Baseline: `1e0210e642989b444116e374e6170468b76f578f`.

All 21 former `rh-domain` scores now succeed. All 619 previously supported musical XML and engraving XML outputs remain byte-for-byte identical. The other 26 failures retain their prior classifications. No source assets, catalog identities, title exceptions, or competing-duet rules were changed.

## Coverage

| Collection | Structured | Before | After | Gain |
|---|---:|---:|---:|---:|
| Children's Songbook | 250 | 229 | 235 | 6 |
| Hymns (1985) | 335 | 309 | 324 | 15 |
| Hymns for Home and Church | 81 | 81 | 81 | 0 |
| Overall | 666 | 619 | 640 | 21 |

`rh-domain`: 21 → 0. Remaining failures: 12 rh-lyrics, 6 rh-continuity, 5 rh-competing, 2 unsupported, 1 rh-notation.

## Findings and implementation

- Fourteen choir scores (Hymns 323 and 325–337) use an upper C clef and lower F clef. Requiring a G/F pair rejected these valid upper staves.
- Where Love Is has a separate lower part beginning in G clef and later using F clef. Its upper part has two voices with overlapping sustained notes. A lower-part mid-measure clef change also triggered the projector's global attribute guard.
- Baptism and When I Go to Church begin with G clefs on both numbered staves; I Am like a Star has two separate G-clef parts. Clef sign alone does not distinguish the hands.
- Beautiful Savior contains multiple two-staff parts plus an optional descant; its principal lyrics identify P3/staff 1. How Will They Know? has multiple two-staff parts and an optional descant; the principal domain is P2/staff 1.
- Sing Praise to Him includes a two-part printed score and separate voice parts with external print-layout links. The unique lyric-bearing upper staff is P1/staff 1. External part links are omitted only from the private reduction; no linked file is loaded.

The new fallback runs only after an existing `rh-domain` rejection. It requires one non-optional, lyric-bearing upper staff (staff 1 with G or C clef), then keeps every note/rest in that staff across all XML voices. Lyrics provide domain evidence; they never filter which upper notes survive. Voice handoffs, overlaps, chords, cue alternatives, and lyricless passages remain intact. Multiple competing candidate domains still fail safely.

The existing full-texture projector preserves source voice/chord membership, timestamps, durations, lyrics, useful notation, harmony, global expressions, repeats/endings, segno and D.S./fine. Lower-staff notes never complete the line. A mid-measure attributes block may be ignored only when every element is a clef for a discarded staff; all other mid-measure attribute guards remain.

## Revised clef requirement

Per the user's steering update, **original upper clefs are preserved**. There is no conversion to treble, no octave normalization, and no sounding-pitch shift. Original C clefs render successfully in the derived scores, including Hymns 326 and 333. Tests compare all retained source clef signs/lines/children, not merely note pitches. Encoded pitches remain authoritative for playback and transposition.

The existing paired-slur cleanup omits one layout-only slur `continue` in How Will They Know? (P2/staff 1/voice 2, zero-based measure 11, onset 0, MIDI 59). Its note and valid slur endpoints remain. No other annotation adjustments were needed in the 21 cases.

## Validation

- `tests/melody-phase4c.mjs`: targeted 21-domain checks plus protected A Child's Prayer.
- `PHASE4C_FULL=1 node tests/melody-phase4c.mjs`: all 666 structured scores; exact prior 619 musical and engraving XML comparisons. Other rejection classes unchanged.
- Each new score: exact upper-staff event provenance, pitches/onsets/durations/voices/chord membership, lyrics/notation, original clefs, no LH notes; expression timestamps and repeat/ending semantics; source RH playback timeline and tempo/measure lengths; +2-semitone transposed timeline; disposable engraving anchors do not alter musical playback.
- `tests/lead-audit.mjs` with `WRITE_INDEX=1 WRITE_REPORT=1`: regenerated availability and lead-catalog diagnostics through the existing generator; 640 successes.
- `tests/melody-phase4c-ui.mjs`: simulated iPad portrait 820×1180 for Where Love Is, Come Come Ye Saints 326, High on the Mountain Top 333, Rise Up O Men of God 323, and Baptism 100. Desktop 1440×1000 check for Where Love Is. Menu availability, source clef, successful rendering, zero measured lyric collisions, no horizontal overflow, playback uses displayed XML. Hymn 326 MusicXML download equals the displayed musical XML.
- Screenshots visually inspected: original C-clef symbols are present and useful upper-staff material remains. Where Love Is retains visible Fine/segno/D.S. al Fine. These are simulations, not physical-iPad verification.
- `git diff --check`.

No broad playback, Library, annotation, metronome, or export matrix was run. No re-cleffing limitation was encountered. A Child's Prayer and all five `rh-competing` cases remain unchanged.
