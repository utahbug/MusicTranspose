# Melody Phase 3C: final HHC RH continuity cases

Baseline: `bc72389f265d54be5e43db3bf590f67e280a1629`. Extractor/tests commit: `42f2ae79f4ae1862a6d72b570f76e68258d52e4a`.

**HHC is now 81/81. Overall structured coverage is 580/666. All 578 prior supported musical XML outputs remain byte-for-byte identical.** No title-specific exceptions, LH borrowing, source MXL edits, UI changes, playback-synthesis changes or pagination changes were made. A Child’s Prayer remains deferred and disabled.

## Exact source findings and changes

### HHC 1021 — I Know That My Savior Loves Me

Source: `assets/scores/hhc-1021.mxl`. Melody stays in P1 / staff 1 / voice 1 throughout all 54 measures.

- At measure 29, a half-note F4 at quarter-note offset 0 has both `<tie type="start">` and visible `<tied type="start">`. The following quarter-note cue F4 at offset 2 has a visible `<tied type="stop">` but lacks the playback `<tie type="stop">`. The first verse has “knee,” then “Yet”; the second verse sustains “way,”. The pitches, voice and three-beat rhythmic path are explicit.
- Add exactly **one playback stop marker** to that source-derived cue F4 in the private Melody XML. Keep both actual note events, both original durations, all lyrics and the original visible tie. Playback follows the visible three-beat F4 sustain; no verse-dependent playback branching is introduced.
- Measure 17 also has a single quarter-note cue C4 after the tied G4 and before F4 in the same principal voice. The old stepwise-only cue guard rejected its fifth/fourth motion. Keep this short, unambiguous principal-RH pickup; the rule does not depend on whether that note has a lyric.
- The apparent extra stop at measure 50 is a valid second-ending continuation from measure 48, through the existing common-predecessor logic. It is **not repaired or omitted**. All other valid ties remain intact.
- The existing Phase 3B rule still ignores the two invisible zero-time grace REST spacers at measure 33; they are not pitched musical notes.
- Result: **supported**, 114 source-proven RH events (including any rests), 56 harmonies, 4 events without any `<lyric>` element. Playback has 106 attacks after valid ties are merged.

### HHC 1039 — Because

Source: `assets/scores/hhc-1039.mxl`. Melody stays in P1 / staff 1 / voice 1 throughout all 24 measures.

- The lyricless introduction contains three G4 eighth notes with playback and visible tie starts: measure 1 at quarter-note offset 0.5, measure 2 at offsets 1.5 and 3.5.
- The next principal-RH notes are C5, D5 and E5 respectively. The simultaneous secondary-RH G4 notes do not provide complete encoded tie endpoints for this monophonic path. The source principal-voice pitches and rhythms themselves are clear.
- Keep all three G4 events and all subsequent introduction notes with their original durations. Omit only each unmatched playback start and its corresponding visible start: **three unsafe ties / six marker elements** in the derived Melody XML. Do not extend the notes into another voice, invent a pitch, or copy LH material.
- Preserve the introduction’s slurs as phrasing; they never count as proof of sustain. All valid later tie pairs remain unchanged.
- Result: **supported**, 131 source-proven RH events (including rests), 54 harmonies, 25 events without any `<lyric>` element. Playback has 122 pitched attacks after rests and valid ties are accounted for.

## Generalized precedence and safeguards

The existing successful extraction paths return first. Only a rejected bundled HHC score with `rh-ties` reaches the new continuity fallback. This keeps all 578 existing outputs identical and avoids broadening other collections or local-import policy.

Normalization applies only at a boundary between two unique pitched source events in the same established principal RH part/staff/voice. The complete rhythmic lane has already been verified. A valid alternate-ending predecessor is respected.

1. Actual source events, RH voice and complete rhythm remain authoritative; no pitch, onset or duration is invented or rewritten.
2. A same-pitch pair of visible tie endpoints can supply a missing playback endpoint.
3. An already valid playback pair remains valid; an unmatched visible endpoint can be omitted rather than inventing notation.
4. Where neither endpoint pair is valid, retain both actual RH events and omit only the unsafe boundary tie markers.
5. Ambiguous chord endpoints, voice/staff changes, duplicate markers, and explicit conditional/let-ring/continuation tie forms retain strict guards. Missing RH coverage cannot be repaired from LH.
6. A verified tied cue continuation stays in the RH line. A single short cue pickup may leap within an octave between full-sized pitched events in that same principal voice. Neither rule requires a lyric on the cue note.

Slurs are handled separately by the existing slur-ownership rules. They are never used to infer sustain. Normalization is recorded as `tieAdjustments`, with measure, onset, voice, pitch and action, so every changed marker is auditable.

## Final coverage

| Collection | Structured | Before supported / fallback | After supported / fallback |
|---|---:|---:|---:|
| Hymns for Home and Church | 81 | 79 / 2 | **81 / 0** |
| Children’s Songbook | 250 | 216 / 34 | 216 / 34 |
| Hymns (1985) | 335 | 283 / 52 | 283 / 52 |
| All structured scores | 666 | 578 / 88 | **580 / 86** |

Catalog total remains 668, including two PDF-only songs. The generated index gained exactly `hhc-1021` and `hhc-1039`; IDs were generated, not hand-edited. The complete audit found no missing-success, false-positive or orphan availability entries.

## Musical, visual, playback and export validation

- All 666 structured songs audited against the exact pre-change extractor. **All 578 prior successful XML outputs are byte-for-byte identical.** Every new selected event independently matches source RH part/staff/voice/onset/pitch/duration. Every visual and playback tie difference matches the reported adjustment list.
- Source lyrics, harmony counts, tempo maps, measure lengths, meter, repeats and endings are preserved. An independent written-order performance calculation verifies attack counts, pitches, starts and durations against the playback timeline, including tie merging and the source tempo changes.
- Both songs rendered and visually inspected at **820×1180, 768×1024 and 1440×1000**. Six checks: zero measured lyric collisions and zero document horizontal overflow. Melody page counts: 1021 **2 / 2 / 2**; 1039 **2 / 3 / 2**. No pagination policy changes. These are browser checks, not physical-device certification.
- Full-song Grand Piano offline rendering: 1021 **106/106** voices ended, peak 0.08121, silent tail; 1039 **122/122** voices ended, peak 0.08174, silent tail. No hanging notes. Actual pause/resume/stop and song-switch controls clear voices; a 1.1× tempo adjustment preserves engine behavior.
- Both songs open in Original PDF with Melody immediately enabled, switch directly to Melody, and preserve key state through Original/Melody round trips. A committed +2-semitone change shifts every playback pitch by +2 without changing attacks or durations.
- Both actual Melody MusicXML downloads parse, contain a single RH-derived monophonic part, exactly equal the committed current musical XML, preserve the current transposition and contain no engraving-only harmony anchors. Local exported files: `test-results/phase3c-hhc-1021-melody-transposed.musicxml` and `test-results/phase3c-hhc-1039-melody-transposed.musicxml`.
- Playback’s existing written-order repeat policy remains unchanged. Source alternate endings are preserved for display/export; this task does not add repeat-aware traversal.

Required prior regressions all passed: HHC 1035 (56 events / 20 measures / 34 harmonies), HHC 1054, The Nativity Song, The Shepherd’s Carol, I Am a Child of God (Children’s), Away in a Manger (Children’s), I Love to See the Temple, and We Thank Thee, O God, for a Prophet. The nine Phase 3B additions also pass their direct-switch/transposed-export round trips.

## Tests run

All final runs passed:

- `tests/rh-tie-continuity.mjs`: matched visual/missing playback endpoint; valid-tie identity; lyricless introduction, pickup and tied cue; slurs not sustain; conservative orphan omission; chord/voice/LH/conditional rejection guards.
- `tests/melody-phase3c.mjs`: all 578 outputs identical; all new source-event/marker proofs and independent playback math. `PHASE3C_RENDER=1`: six viewport renders and collision checks.
- `tests/melody-phase3c-ui.mjs`: both new songs, actual export, committed key, playback controls, complete offline voice cleanup and the eight required prior songs.
- `tests/lead-audit.mjs` with `WRITE_INDEX=1 WRITE_REPORT=1`, only after extractor/render validation.
- `tests/melody-coverage.mjs` with `COVERAGE_REPORT=reports/melody-phase3c-final-index.json`: complete index consistency plus representative opens.
- `tests/right-hand-melody.mjs`, `tests/right-hand-refinements.mjs`, `tests/lead-hhc1035.mjs`, `tests/lead-hhc1035-polish.mjs`.
- `tests/melody-phase3b.mjs`, `tests/melody-phase3b-ui.mjs`: the historical nine-song scope is now pinned to the actual Phase 3B release index, so later additions do not inherit that phase’s strict no-normalization expectations. No prior regression assertion was removed from the original nine songs.
- `git diff --check`.

Local runs used `TEST_URL=http://127.0.0.1:8780/` and the bundled Playwright runtime. No unrelated full-app/music-engine/chord suite was run.

## Files and release

- Production extractor: `right-hand-melody.js`, `lead-view.js`.
- New tests: `tests/rh-tie-continuity.mjs`, `tests/melody-phase3c.mjs`, `tests/melody-phase3c-ui.mjs`.
- Historical test scope: `tests/melody-phase3b.mjs`, `tests/melody-phase3b-ui.mjs`.
- Generated metadata/cache: `lead-availability.js`, `sw.js` (v153).
- Reports: `reports/lead-catalog.md`, this file, `reports/melody-phase3c.json`, `reports/melody-phase3c-final-index.json`.

Extractor/tests are committed separately from regenerated availability/reports. The metadata commit is the commit containing this report. Push/Pages deployment and published asset verification are reported in the chat after completion. All unrelated pre-existing untracked files remain untouched.
