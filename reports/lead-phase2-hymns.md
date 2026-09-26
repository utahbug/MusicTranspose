# Lead Phase 2: conservative Hymns expansion

## Coverage and initial audit

| Measure | Before | After |
|---|---:|---:|
| Structured scores | 679 | 679 |
| Supported Lead scores | 34 | 203 |
| Hymns (1985) supported | 0 | 169 |
| Hymns still on fallback | 335 | 166 |
| All remaining fallbacks | 645 | 476 |

The fresh pre-change audit found 551 chordal-melody, 76 multiple-lyrics, 13 no-melody and 5 outside-cues fallbacks. Within Hymns: 312 chordal-melody, 22 multiple-lyrics and 1 outside-cues. A broad structural screen found 270 Hymns with two G/F staves and no chord larger than two tones. This is a candidate screen, not proof of safe extraction. Another 250 scores outside Hymns meet that broad screen; none receive the new heuristic.

The [complete catalog inventory](lead-catalog.md) lists every score's original and final result.

## Selection and safety

Only bundled catalog IDs belonging to Hymns (1985), never local imports, enter the new strategy. Imported collection text cannot enable it. Other collections retain the old extractor.

Require one two-staff part or two single-staff parts ordered upper G / lower F. Identify the upper lyric-bearing voice first, then select the top tone within that voice's chord. Never choose across the whole score or borrow the lower staff. Contiguous, nonoverlapping voice-number handoffs are allowed; soprano rests remain rests even while an inner voice sounds.

Reject cues, grace notes, transposing clefs, unusual notation, divisi/solo indications, more than two concurrent tones per staff, competing lyrics, voice gaps/overlaps, upper crossings and ambiguous ties/slurs. Shared lyrics/beams transfer to the soprano; alto ties/fingerings do not. Slur ownership is tracked per start/stop span, including reused numbers. The established projector preserves directions, harmonies, signatures, repeats/endings and timing. Failure returns the unchanged original score.

## Remaining limits

| Remaining Hymns category | Count |
|---|---:|
| Unusual notation / cues / grace / divisi or solo indications | 124 |
| Not clearly a two-staff G/F structure | 15 |
| Missing upper lyric ownership / lower-staff lyrics | 10 |
| Ambiguous or unmatched slurs | 7 |
| Divisi / conflicting chord structure | 6 |
| Incomplete or competing voice lanes | 3 |
| Upper-voice crossing | 1 |

Outside Hymns, unchanged fallbacks: chordal-melody 239, multiple-lyrics 54, no-melody 13 and outside-cues 4.

Intentionally excluded examples: Oh, Come, All Ye Faithful; Come, Come, Ye Saints; We Thank Thee, O God, for a Prophet (unusual notation); The Morning Breaks (lower-staff lyrics); Come, Sing to the Lord and Joseph Smith's First Prayer (slur endpoints); Come unto Jesus and I'll Go Where You Want Me to Go (voice continuity); Ye Elders of Israel (upper crossing). These conservative exclusions do not mean a human cannot identify the tune.

## Targeted validation

- Independent source-note checks passed for all 169 new hymns: staff/voice ownership, pitch, onset/duration/rest, exact lyrics, selected-tone ties, shared beams, retained slurs, directions/harmonies/sounds, repeats/endings and playback duration.
- All 169 rendered successfully at 390px. All 34 original Leads remain supported with byte-identical extraction output.
- Examples: Silent Night (verses/ties/slurs), The Spirit of God (four verses/inner voices), High on the Mountain Top (rests), Ring Out, Wild Bells (pickup/accidentals/repeats/endings), O Ye Mountains High (meter changes). No title exceptions.
- Visual source/Lead comparisons and actual browser print checks for Silent Night, The Spirit of God and Ring Out, Wild Bells: each one music page, credits separate.
- Transposition comparisons at -3/+2 semitones, octave/playback consistency, independent Score/Lead octave retention, key changes and Reset passed. Existing octave suite passed, including crossing registers and PDF fallback.
- Browser viewport checks passed at 320x568, 390x844, 844x390, 820x1180 and 1440x1000, without document horizontal overflow. These are not physical-device tests.
- Offline reload, Lead/playback and existing compact Lead-layout checks passed.
- Safety fixtures passed: collection/import isolation, cue/divisi/crossing/lyrics/tie rejection, octave-clef/unison rejection, soprano rests, voice handoffs and reused slur numbers.
- Static production files were served locally; no compilation step exists. No full music-engine or 7,288-case chord suite was run.

Scripts: lead-hymn-audit.mjs, lead-hymns.mjs, lead-hymn-safety.mjs, lead-hymn-print.mjs, lead-layout.mjs and octave-hands.mjs.

## Files and scope

Runtime: hymn-melody.js (new guarded strategy), lead-view.js (catalog gating), app.js (song context), lead-availability.js (203-song generated index), sw.js (new module/cache version).

Tests: four new hymn scripts listed above, plus context-aware lead-audit.mjs and lead-view.mjs updates and the catalog-size assertion in lead-layout-audit.mjs. Reports: this document and complete catalog inventory.

Shared horizontal margins, Most Music/Normal layout, compact Lead rules, Library UI, Fun, chord-transposition and playback engines are unchanged. No further backlog work included.
