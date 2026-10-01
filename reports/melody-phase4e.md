# Melody Phase 4E: validated silent tails

Baseline: `0d2d74c`. Support increases from 658 to 660 of 666 structured scores.

## Source evidence and result

| Song | Measure | Upper end | Validated source end | Silent tail | Retained upper events |
|---|---|---:|---:|---:|---:|
| The Time Is Far Spent — Hymns 266 | X11 | 3.5 | 4 | 0.5 | 129 |
| I’ll Go Where You Want Me to Go — Hymns 270 | X17 | 2.5 | 3 | 0.5 | 224 |

Times are quarter-note units. Hymn 266 is in 4/4; the lower second-voice forward spans 2–4. Hymn 270 is in 6/8; its lower forward spans 2.5–3. In both, all sounding material ends at the upper endpoint. The lower source cursor and every part’s inherited time signature agree on the full measure duration. Source divisions differ between parts and are normalized by the existing projector.

## Conservative rule

Only an already selected sole lyric-bearing upper domain can use this fallback. Existing upper notes/rests/explicit upper forwards must cover the measure continuously up to the tail. The remaining gap must be positive and at most half a quarter note; the first measure is excluded. Every inherited meter must match the source maximum cursor extent, and a lower-part forward must span the whole tail and end at that extent. All source note events must end before the tail.

No nominal-meter padding is applied to otherwise short source measures. Interior holes, mismatching meters and malformed lower extents are rejected. No titles or IDs occur in the rule.

The existing projector’s final cursor move emits a standard MusicXML `<forward>` for exactly the missing half quarter. No note/rest is synthesized, no lower notes are imported, and no engraving marker is added to exported XML. Existing engraving-only gap handling remains unchanged.

## Verification

- `PHASE4E_FULL=1 node tests/melody-phase4e.mjs`: all 666 scores; all 658 previous musical AND engraving XML outputs byte-identical; 660 successful; six unrelated failures unchanged.
- Focused mode additionally tests malformed lower extent, conflicting nominal meter, unfilled short source measure, and an unexplained interior upper gap.
- Both new songs: exact source upper notes, chords, voices, lyrics, clefs, ties and annotation checks; no lower material; source-matching playback notes, measure lengths and tempo maps; +2-semitone transposition preserves timing. Engraving anchors add no sounding notes.
- Exact half-quarter final forwards verified in X11/X17. Derived XML parses. Real exported MusicXML downloads equal the displayed musical XML.
- Existing regressions: True to the Faith (156 events) and We Ever Pray for Thee (106 events; six explicit upper forwards).
- `tests/melody-phase4e-ui.mjs`: both new songs and both existing regressions at simulated 820×1180; Hymn 266 at 1440×1000. Rendering succeeds without horizontal overflow or measured lyric collisions. Screenshots reviewed; no artificial visible tail rest.
- Both new songs: play/pause/resume/stop works; pause/stop clear active voice nodes, stop resets position. Timing parser and transport code unchanged.
- `tests/lead-audit.mjs` with WRITE_INDEX/WRITE_REPORT: success 660, rh-competing 5, rh-notation 1. Generated index adds only the two hymns.

Remaining unsupported: A Child’s Prayer; I Pray in Faith; The Word of Wisdom; Love Is Spoken Here; Mother, Tell Me the Story (rh-competing); Mary’s Lullaby (rh-notation).

Production changes: lead-view.js, generated lead-availability.js, sw.js cache v169. Reports: lead-catalog.md, melody-phase4e.md/json. Tests: melody-phase4e.mjs and melody-phase4e-ui.mjs. No source score assets modified. Browser simulation does not establish physical-iPad behavior.
