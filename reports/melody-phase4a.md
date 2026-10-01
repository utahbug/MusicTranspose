# Melody Phase 4A: practical RH cue-note inclusion

Baseline: `a35535b1a2504a119b3d55324571483a4678943b`. Extractor/tests commit: `330c4c64523e6e1ea62a05b17ca9910456e6cd55`.

**All 13 former `rh-cue` cases now succeed. Overall support rises from 580/666 to 593/666. All 580 previous supported musical XML outputs are byte-for-byte identical.** The remaining 73 failures retain their previous classifications. A Child’s Prayer remains `rh-competing` and unavailable. No source MXL files or title-specific extraction exceptions were added or changed.

## Coverage

| Collection | Structured | Before | After | Gain |
|---|---:|---:|---:|---:|
| Hymns (1985) | 335 | 283 | 289 | 6 |
| Children’s Songbook | 250 | 216 | 223 | 7 |
| Hymns for Home and Church | 81 | 81 | 81 | 0 |
| Total | 666 | 580 | 593 | 13 |

## Findings and generalized rules

- The rejected scores already passed the original RH-domain, primary lyric-voice, rhythmic-continuity and pitched tie-path checks. They stopped at the later size/connector restriction. Cue size itself is not a musical-importance criterion.
- The new path runs only after a bundled piano score returns `rh-cue`. Earlier successful paths are untouched; unrelated failure types are not widened.
- Re-establish a unique piano treble/bass domain and retain the independent-lyric and unsupported-notation guards. Preserve all source notes/rests in that piano treble staff, including secondary voices, overlapping durations, dyads/chords and notes without lyrics. No highest-note selection is performed on this new path.
- The projector retains source voice IDs and chord membership, normalizes the retained staff to staff 1, and checks continuous coverage using the union of RH intervals. Chord followers do not advance the XML cursor. Every output event has source part/staff/voice/onset/duration/pitch/chord-index proof.
- Keep every verse’s source lyrics and every small note, including verse-specific alternatives. Do not collapse the alternatives into a single verse or infer playback repeat/verse branches. The reduction remains a written-order practical RH texture.
- Preserve cue-sized notation. Eighteen source `<cue>` elements across the newly supported set are converted to `type size="cue"` in derived XML so these retained RH notes also sound in playback. Existing `type size="cue"` is retained. Source files and playback parsing code are unchanged.
- Preserve RH ties, slurs, articulations, fingerings, stems and beams; only existing projection coordinate cleanup/staff normalization and cue playback conversion apply. No new tie repair is introduced.
- Exclude bass-staff notes and separate optional parts. Hosanna uses P2/staff 1 for piano RH; its P1 descant contributes no notes. The score’s sole tempo mark is on that descant part, so only its global tempo direction is retained at its original timestamp. Other optional-part directions and harmonies are excluded.

### Patterns in the regression set

Oh, Come, All Ye Faithful includes six small RH notes among its verse material. My Heavenly Father Loves Me, God of Our Fathers, Carry On, Sleep, Little Jesus, Hosanna and I’ll Walk with You include cues in secondary RH voices. God of Our Fathers has 67 cue-sized RH notes, so a short-connector-only policy cannot represent it. Hello Song has visible echo cue phrases. I’ll Walk with You retains three RH voices. The full treble texture preserves these without guessing which individual upper note is important.

## All 13 outcomes

Event counts include rests; chord tones are additional notes bearing `<chord>`. Cue counts include original cue-size notes and converted `<cue>` notes.

| Song | Collection/page | RH events | Cues retained | Chord tones retained | Source cue elements converted |
|---|---|---:|---:|---:|---:|
| Oh, Come, All Ye Faithful | Hymns (1985) / 202 | 128 | 6 | 50 | 2 |
| He Sent His Son | Children’s Songbook / 34 | 239 | 10 | 16 | 5 |
| My Heavenly Father Loves Me | Children’s Songbook / 228 | 110 | 8 | 13 | 4 |
| Hello Song | Children’s Songbook / 260 | 89 | 15 | 14 | 0 |
| Rejoice, the Lord Is King! | Hymns (1985) / 66 | 114 | 2 | 33 | 2 |
| God of Our Fathers, Whose Almighty Hand | Hymns (1985) / 78 | 149 | 67 | 70 | 0 |
| Gently Raise the Sacred Strain | Hymns (1985) / 146 | 115 | 6 | 39 | 2 |
| Carry On | Hymns (1985) / 255 | 253 | 14 | 82 | 0 |
| Turn Your Hearts | Hymns (1985) / 291 | 83 | 2 | 22 | 2 |
| Sleep, Little Jesus | Children’s Songbook / 47 | 70 | 2 | 10 | 0 |
| Jesus Once Was a Little Child | Children’s Songbook / 55 | 119 | 2 | 58 | 0 |
| Hosanna | Children’s Songbook / 66 | 73 | 15 | 4 | 1 |
| I’ll Walk with You | Children’s Songbook / 140 | 165 | 4 | 16 | 0 |

No `rh-cue` cases remain unsupported.

### Steering clarification: normal and cue notes stay together

The latest inclusion rule requires no extractor change: the fallback already keeps both normal and small RH notes at simultaneous positions, without a highest-pitch choice. A focused `PHASE4A_SONG=cs-34 node tests/melody-phase4a.mjs` regression passed for “Live like his Son.” At source measures X39/X40 (zero-based indices 39/40), normal G4–F4–E4–F4 remain the lyric-bearing, non-cue chord anchors; small B♭4–B♭4–B♭4–A4 remain their upper chord followers with the same onset/duration. Every retained event remains P1/staff 1. The normal line is neither replaced nor relabeled as cue material. Song-specific assertions exist only in the regression test, not in extraction logic. No full audit or viewport checks were repeated for this test-only clarification.


## Validation

- `tests/melody-phase4a.mjs`: all 13 targeted scores plus protected A Child’s Prayer. Independently compared every retained note/rest against source RH notes, including voice, pitch, chord membership, onset, duration, lyrics and notation.
- `PHASE4A_FULL=1 node tests/melody-phase4a.mjs`: one full 666-score audit and exact XML comparison against the pinned baseline; all previous 580 outputs identical, exactly 13 newly supported, all other failures unchanged.
- All 13 new timelines match the source piano-RH events after intentional cue playback inclusion. Tempo maps and measure lengths match. Transposed MusicXML (+2 semitones) preserves all event timing and sounds at the new pitches. These checks cover multi-voice/chord scheduling affected by this change; no synthesis or full export suite was run.
- `tests/melody-phase4a-ui.mjs`: iPad portrait 820×1180 for Oh, Come, All Ye Faithful; He Sent His Son; My Heavenly Father Loves Me; Rejoice, the Lord Is King!; and Hello Song. One desktop 1440×1000 check for Oh, Come, All Ye Faithful. All opened directly through the enabled Melody option, rendered successfully, and used the displayed XML as playback source. No horizontal overflow, measured lyric-to-lyric collisions or page runtime errors. Six score screenshots visually reviewed; these are browser viewport checks, not physical-device certification.
- One actual MusicXML download for Oh, Come, All Ye Faithful matches `prototype.viewXML` exactly, including its retained RH texture.
- Generated `bundledLeadIds` and `supportsLead` match all 593 successful audit rows in catalog order, including all 13 additions. No IDs hand-edited. Reused the completed full audit for metadata and reports rather than running another catalog extraction.
- `git diff --check` passed. No unrelated annotation, Library, playback synthesis, pagination or broad viewport suites run.

Screenshots and the downloaded MusicXML are in ignored `test-results/phase4a-*`. Durable full audit and UI metrics: `reports/melody-phase4a.json`.

## Changed files / commit separation

Commit A: `lead-view.js`, `right-hand-melody.js`, `tests/melody-phase4a.mjs`, `tests/melody-phase4a-ui.mjs`.

Commit B: generated `lead-availability.js`, `reports/lead-catalog.md`, this report, `reports/melody-phase4a.json`, and `sw.js` (cache v156).

HHC behavior, A Child’s Prayer, toolbar, Settings, metronome, Lyrics UI, Library, annotation, tap zones, navigation and pagination code are unchanged. No title-specific exceptions were added.
