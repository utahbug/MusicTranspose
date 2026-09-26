# Lead Phase 2C: structured right-hand continuity audit

## Outcome and scope

One existing structured score justifies a narrow new rule: **Hymns 122, Though Deepening Trials**, measure **X11**. Its small A-sharp 4 is a short, non-lyric right-hand connector between sung A4 and B4 in the same upper-staff voice. Full-score and Lead visual comparison confirms the path. The source's cue-size formatting remains present; no note or lyric is invented.

Coverage was held at 243 while auditing. After source validation and targeted tests, coverage is **244 / 679 structured scores**, including **210 Hymns**. Structured fallbacks are **435**, of which **167** have cue markings. Exactly one formerly cue-bearing fallback is resolved. All previous 243 successful extraction outputs remain byte-identical, and all other previously unsupported songs remain unsupported.

The two PDF-only examples were excluded. No PDF-to-MusicXML inference, transcription or asset replacement was performed. No general prelude/interlude/postlude or voice-switching rule was enabled.

## Re-audit

The reproducible audit uses production extraction from baseline commit `997bd3f`, with unchanged catalog MXL sources. It checked all 679 structured songs and all **168 cue-bearing fallbacks**. Initial reasons within this group: notation 69, chordal melody 62, multiple lyric voices 17, annotation ambiguity 5, structure 5, outside cues 4, lyric ownership 3, divisi 2 and no melody 1.

Mechanical timing flags identified 8 scores with pitched material before the first upper lyric, 12 after the last upper lyric, and 11 with a cue-marked non-lyric note in an upper lyric-owning voice. These sets overlap: **27 distinct candidates**. Flags are not musical classifications: a tied final sung note is not a postlude, and a lyricless measure is not automatically an interlude.

The [per-song audit](lead-phase2c-audit.json) records all 168 scores, source voice/measure positions, candidate notes and diagnostic blockers. A separate cue-removal diagnostic reveals later structural guards only; that modified copy is never used as production extraction.

## Representative findings

| Existing MXL | Evidence | Decision |
|---|---|---|
| Hymns 122, Though Deepening Trials | X11: small A-sharp 4 between sung A4 and B4, upper voice 1, one quarter-note beat, no lyric on connector | Enable only this demonstrated structural pattern |
| HHC 1030, Close as a Quiet Prayer | Ten non-lyric cue notes in the upper lyric voice; lyricless measures 22, 23, 25, 41, 48, 49 | Keep fallback: another upper voice crosses above the proposed soprano; do not follow the highest note across voices |
| HHC 1060, Build an Ark | Twelve upper-voice notes before singing, measures 1-3 | Keep fallback: unmatched slur endpoint in proposed melody |
| HHC 1065, Isaiah Said | Six upper notes before singing, seven after; lyricless measures 1, 12-14 | Keep fallback: selected voice has gaps/overlaps; no safe handoff established |
| HHC 1004, I Will Walk with Jesus | Eleven upper notes before lyrics, plus lyricless measure 20 | Keep fallback: more than two concurrent staff pitches |
| CS 34, He Sent His Son | Twelve introductory upper notes; non-lyric cue notes at X28 | Keep fallback: conflicting chord/divisi structure and multiple lyric owners |
| CS 70, Jesus Has Risen; CS 78, I'm Trying to Be like Jesus | Upper introductory material | Keep fallback: concurrent-pitch ambiguity |
| Hymns 78, God of Our Fathers, Whose Almighty Hand | Eight introductory cue-marked notes in measures 0/X1 | Keep fallback: mixed/chordal divisi structure |
| Hymns 146, Gently Raise the Sacred Strain | Two non-lyric cue-sized chord groups at X18 | Keep fallback: also contains cue-marked sung chord material; not a single bounded connector |
| HHC 1010, Amazing Grace; HHC 1014, My Shepherd Will Supply My Need; HHC 1052, Joyfully Bound; Hymns 207, It Came upon the Midnight Clear | Apparent final non-lyric notes | Source inspection identifies tie continuations of the last sung note, not a new postlude pattern; no expansion |

These exclusions do not claim that a human musician cannot determine a playable line. They mean this audit did not establish a sufficiently narrow structural rule to automate it safely.

## Implemented rule

Within the existing bundled-Hymns strategy, admit a cue-size note only when:

1. It is pitched and has no lyric or actual `<cue/>` marker.
2. It is the sole note in its group on the identified upper lyric-bearing staff/voice.
3. Its immediate preceding and following groups carry lyrics in that same voice.
4. Duration is at most one quarter-note beat.
5. Pitch motion is stepwise in one direction through the connector, with each interval at most two semitones.
6. Every existing timing, staff, voice, crossing, divisi, lyric, tie/slur and notation check still succeeds.

Staff and voice select the line first; pitch is an additional continuity check, never a cross-voice highest-note selector. Soprano rests are never filled from another voice or the left hand. Small lower cues, ambiguous upper cues, unbounded instrumental passages, leaps and voice changes stay on fallback.

The connector remains in its original measure and retains its duration, pitch spelling and small-note format. The established projector still handles all lyrics, melody rests, ties/slurs, harmonies, directions, keys/meters, barlines and repeats/endings. Diagnostics identify the accepted pattern as `same-voice sung connector`.

## Targeted validation

- Baseline comparison across the complete catalog: prior 243 outputs identical; only Hymn 122 newly succeeds; other fallbacks return exact original XML.
- Independent source-note, lyric, rest, timing, tie/slur, beam, harmony/direction, repeat/ending and playback-duration checks passed for all 210 supported Hymns. All rendered successfully; original 34 Leads remain unchanged.
- Hymn 122: exact A-sharp 4 in X11, exactly one small connector, no invented lyric, monophonic output. Transposition -3/+2 and octave playback -1/+1 passed.
- Synthetic cases preserve a bounded stepwise connector and reject a leap, voice switch, actual cue marker and missing sung boundary. Existing cue/lyrics/divisi/crossing/rest/voice-handoff/tie/slur safety fixtures passed.
- Application checks: key +2, octave -1, Reset, prepared playback matching the displayed XML; responsive viewports 320x568, 390x844, 844x390, 820x1180 and 1440x1000; no horizontal document overflow; offline reload and playback preparation passed.
- Visual full-score/Lead comparison verified the X11 connector, sung line, three attached verses, rests and slurs. Actual PDF print was rendered and inspected: one music page plus the existing extra-verse/credits page. Small A-sharp and all displayed music remain present.
- Existing compact Lead-layout tests passed. No full music-engine or 7,288-case chord suite ran. Tests use browser viewport emulation, not physical devices.
- Static production app was served locally; no compilation step exists. Runtime modules for margins, Library, metronome, playback and transposition are untouched.

Scripts: `lead-continuity-audit.mjs`, `lead-continuity.mjs`, `lead-continuity-ui.mjs`, `lead-hymn-safety.mjs`, `lead-hymn-audit.mjs` (index generation), `lead-hymns.mjs`, `lead-layout.mjs`.

## Files

Runtime: `hymn-melody.js`, generated `lead-availability.js`, `sw.js` (cache v113).
Tests: three new continuity scripts plus connector cases in `lead-hymn-safety.mjs`.
Reports: this report, the 168-score baseline audit JSON and updated full catalog inventory.

## Candidate inventory (27, overlapping flags)

| Song | Collection / number | Before-first-lyric notes | After-last-lyric notes | Non-lyric cue notes | Cue-removal diagnostic |
|---|---|---:|---:|---:|---|
| I Will Walk with Jesus | Hymns for Home and Church / 1004 | 11 | 0 | 0 | hymn-divisi |
| Amazing Grace | Hymns for Home and Church / 1010 | 0 | 1 | 0 | passes |
| My Shepherd Will Supply My Need | Hymns for Home and Church / 1014 | 0 | 1 | 0 | passes |
| Close as a Quiet Prayer | Hymns for Home and Church / 1030 | 0 | 2 | 10 | hymn-crossing |
| I’m Gonna Live So God Can Use Me | Hymns for Home and Church / 1037 | 0 | 0 | 1 | hymn-voices |
| Joyfully Bound | Hymns for Home and Church / 1052 | 0 | 1 | 0 | passes |
| Build an Ark | Hymns for Home and Church / 1060 | 12 | 0 | 0 | hymn-annotations |
| Isaiah Said | Hymns for Home and Church / 1065 | 6 | 7 | 0 | hymn-voices |
| He Sent His Son | Children’s Songbook / 34 | 12 | 0 | 2 | hymn-divisi |
| Jesus Has Risen | Children’s Songbook / 70 | 5 | 0 | 0 | hymn-divisi |
| I’m Trying to Be like Jesus | Children’s Songbook / 78 | 18 | 0 | 0 | hymn-divisi |
| When He Comes Again | Children’s Songbook / 82 | 0 | 0 | 1 | hymn-divisi |
| Children All Over the World | Children’s Songbook / 16 | 0 | 5 | 0 | hymn-divisi |
| Hello Song | Children’s Songbook / 260 | 0 | 1 | 0 | hymn-divisi |
| God of Our Fathers, Whose Almighty Hand | Hymns (1985) / 78 | 8 | 0 | 8 | hymn-divisi |
| For All the Saints | Hymns (1985) / 82 | 0 | 0 | 1 | hymn-annotations |
| Lead, Kindly Light | Hymns (1985) / 97 | 0 | 1 | 0 | hymn-annotations |
| Though Deepening Trials | Hymns (1985) / 122 | 0 | 0 | 1 | passes |
| Gently Raise the Sacred Strain | Hymns (1985) / 146 | 0 | 0 | 2 | passes |
| It Came upon the Midnight Clear | Hymns (1985) / 207 | 0 | 1 | 0 | passes |
| Behold! A Royal Army | Hymns (1985) / 251 | 0 | 1 | 0 | hymn-divisi |
| Who’s on the Lord’s Side? | Hymns (1985) / 260 | 0 | 1 | 0 | hymn-annotations |
| I’m Thankful to Be Me | Children’s Songbook / 11 | 0 | 0 | 1 | hymn-divisi |
| Faith | Children’s Songbook / 96 | 0 | 0 | 4 | hymn-voices |
| I’ll Walk with You | Children’s Songbook / 140 | 0 | 1 | 0 | hymn-divisi |
| Sing Your Way Home | Children’s Songbook / 193 | 4 | 0 | 0 | hymn-divisi |
| Family Night | Children’s Songbook / 195 | 0 | 0 | 1 | hymn-voices |
