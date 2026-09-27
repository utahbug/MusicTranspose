# HHC 1035 targeted Lead extraction

## Diagnosis

The original createLeadXML result was `ok:false`, `reason:chordal-melody`, message: **The sung line is written as chords, so a single melody cannot be identified safely.** Selection was P1 / staff 1 / voice 1. The generic projector rejects any chord note in that lane before inspecting outside cues.

The source has 20 measures and two separately encoded single-staff parts: upper G clef P1 and lower F clef P2. All lyric-bearing events belong to P1 voice 1, consistently stem-up and rhythmically continuous. That voice has 59 source noteheads at 56 onsets. Measures 15 and 20 contain, respectively, F3/G3/C4 and E3/C4 chords with the lyric on the first (lowest) note. Both immediately follow a standalone C4 in the same voice. The C4 chord members have no lyrics themselves and must survive. The other upper voice is stem-down accompaniment; measure 4 contains a full-size C4 cue beneath the concurrent G4/E4 melody. No cross-staff motion or grace notes. The source's 42 slur endpoints and two tie markers are outside the selected voice.

## Narrow rule

Added a separate repeated-cadence projection, attempted only after the unchanged general extractor rejects a non-Hymns score for chordal melody. Previously successful results return immediately without this rule. Hymns (1985) retain their existing projection.

The rule requires two single-staff G/F parts, exactly one upper lyric-bearing voice, continuous complete rhythm, upward stems, and no upper-voice crossing. A chord is accepted only as a whole-measure event at the next measure's start after a singleton, with a unique pitch matching that singleton, no higher chord member, at most three distinct pitches, one lyric owner, and no competing upper voice. It rejects ambiguous ties/slurs/ornaments/articulations on those chords. This is repeated-pitch structural evidence, not a global highest-note selector. Chord fingerings on discarded accompaniment are not transferred.

The full-size cue exemption requires a separate downward-stem upper voice, no lyrics, and strictly lower pitch throughout its overlap with the complete selected melody. Small or crossing cues remain rejected. Only a private intermediate XML copy is changed; the original MXL is untouched. The existing projector still enforces its timing/structure checks and performs the final projection.

Every selected voice event survives, including rests and notes without lyrics. For these two chord endings, C4 survives with the source anchor's lyrics. Nothing is synthesized.

## Validation

- Independent comparison of all 20 measures: 56 melody events, exact rhythm/pitches/lyrics, no accompaniment notes. All 34 harmony symbols and their onsets preserved.
- Non-lyric passing-note, same-voice tie, slur, and rest variants remain complete.
- Six adversarial variants reject unchanged: different cadence pitch, crossing cue, small cue, ambiguous chord slur, second lyrical voice, and rhythm gap.
- Existing positive samples: Silent Night, cs-168, hhc-1054, Redeemer of Israel. Existing negative samples: nativity (multiple lyrics), shepherd (outside cues), song-8fa768c2-7402-4551-800a-2bdf30049be5 (no melody), hhc-1001 (chordal melody). Results compared against pre-change extractor.
- Eligibility-only audit of all 679 structured sources: 244 -> 245 supported. **Only hhc-1035, As I Keep the Sabbath Day, changed eligibility.** No other fallback was enabled.
- Lead UI, key transposition, octave -1, Reset, playback and overflow checks passed at 320x568, 820x1180 and 1440x1000. Existing Lead playback uses viewXML (melody), rather than full-score playback; unchanged.
- At 820x1180: Normal two pages, Lead one page. Both full-score pages and Lead screenshot visually reviewed. Print generation produced one music page. Offline Lead restart passed.
- Targeted tests only; no full music-engine/chord suite. Production uses static files, served locally without a build step.

## Files

cadence-melody.js; lead-view.js; lead-availability.js (adds only hhc-1035); sw.js (new module/cache v126); tests/lead-hhc1035.mjs; tests/lead-hhc1035-ui.mjs; this report.

Screenshots and generated PDF are in test-results/hhc1035-*. Source score, pagination, layout, playback architecture, navigation and Library code are unchanged.
