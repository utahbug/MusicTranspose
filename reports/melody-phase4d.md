# Melody Phase 4D: sole lyric-bearing upper staff

Baseline: `6939fdf38fc3eb1c88367a013b4319b26563628e`.

Support increases from 640/666 to 658/666. All 640 previous musical XML and engraving XML outputs remain byte-for-byte identical. Source score assets and catalog contents are unchanged. No title-specific exception, clef conversion, octave shift, or competing-duet relaxation was added.

## Coverage

| Collection | Structured | Before | After | Gain |
|---|---:|---:|---:|---:|
| Children's Songbook | 250 | 235 | 244 | 9 |
| Hymns (1985) | 335 | 324 | 333 | 9 |
| HHC | 81 | 81 | 81 | 0 |
| Overall | 666 | 640 | 658 | 18 |

Of the 26 prior failures, 20 are domain/continuity/projector candidates with a sole lyric-bearing upper staff: 12 rh-lyrics, 6 rh-continuity, and 2 unsupported mid-measure-attribute cases. Eighteen succeed. Mary's Lullaby also has a principal lyric-bearing upper domain after excluding its optional descant, but remains outside this fallback because of grace-note rhythmic ownership (rh-notation). The other five are competing lyric-bearing duets. Thus 21 match the broad ownership pattern, 20 enter this bounded fallback, and 18 become supported. No rh-domain failures remained after Phase 4C; Where Love Is is retained as the requested prior-domain UI regression.

## General rule

Only after an existing extraction/projection failure, find the unique non-optional upper staff with lyrics. Require every other non-optional staff to be lyricless. This prevents a lower lyrical voice or independent duet from being relabeled accompaniment. The existing source-clef and structural guards remain.

Retain all events in the chosen part/staff across its XML voices, including chords, overlapping notes, lyricless continuations, pickups, endings, and interludes. Lyric ownership selects the staff, not individual notes. The projector never fills the line with lower-staff notes. Original upper clefs, encoded pitches, durations, lyrics, ties, safe slurs, expressions, harmonies, repeats/endings, and navigation survive.

Explicit positive-duration MusicXML forward elements on the selected upper staff now count as encoded silent coverage for this fallback only. They remain silent; no notes or guessed durations are synthesized. This resolves Hum Your Favorite Hymn, We Welcome You, and Your Happy Birthday. Existing projector cursor movement preserves that time, and source-versus-derived playback measure lengths are tested.

A previously rejected projection may retry the same sole-upper-lyrics policy, allowing the Phase 4C rule for discarding lower-staff-only mid-measure clef changes. No key, meter, or selected-staff attribute guard is weakened. This resolves When Joseph Went to Bethlehem and Two Little Eyes.

## True to the Faith, Hymns 254

The earlier RH heuristic selected the lyricless P3 piano grand staff. The new fallback selects P1/staff 1, which owns the lyrics, across verses and chorus. All 156 source upper events are retained, with original voices 1/2, dyads and lyricless continuations. P2 and P3 contribute no notes. Source-to-derived event proof, lyric/notation preservation, tempo, measure durations, playback pitches/timing, +2-semitone transposition, and MusicXML export passed.

## Newly supported songs

- Awake, Ye Saints of God, Awake! — Hymns (1985) 17 (86 upper events).
- True to the Faith — Hymns (1985) 254 (156 upper events).
- We Ever Pray for Thee — Hymns (1985) 312 (106 upper events).
- God Is Love — Hymns (1985) 313 (102 upper events).
- How Gentle God’s Commands — Hymns (1985) 314 (66 upper events).
- Jesus, the Very Thought of Thee — Hymns (1985) 315 (58 upper events).
- The Lord Is My Shepherd — Hymns (1985) 316 (115 upper events).
- Sweet Is the Work — Hymns (1985) 317 (67 upper events).
- Love at Home — Hymns (1985) 318 (198 upper events).
- I Know My Father Lives — Children’s Songbook 5 (73 upper events).
- When Joseph Went to Bethlehem — Children’s Songbook 38 (145 upper events).
- Hum Your Favorite Hymn — Children’s Songbook 152 (82 upper events).
- How Dear to God Are Little Children — Children’s Songbook 180 (164 upper events).
- I Often Go Walking — Children’s Songbook 202 (86 upper events).
- Pioneer Children Were Quick to Obey — Children’s Songbook 215 (78 upper events).
- We Welcome You — Children’s Songbook 256 (170 upper events).
- Two Little Eyes — Children’s Songbook 268 (75 upper events).
- Your Happy Birthday — Children’s Songbook 283 (79 upper events).

## Eight remaining unsupported scores

- The Time Is Far Spent, Hymns 266: incomplete-line at X11. Upper notes end at 3.5 quarter-note units; the lower part's forward extends to 4. No upper forward covers the extra half beat.
- I'll Go Where You Want Me to Go, Hymns 270: incomplete-line at X17. Upper notes end at 2.5; lower forward extends to 3. No upper event declares that extra half beat.
- Mary's Lullaby, CS 44: rh-notation, grace-note rhythmic ownership requires review.
- A Child's Prayer, I Pray in Faith, The Word of Wisdom, Love Is Spoken Here, Mother Tell Me the Story: rh-competing, multiple non-optional lyric-bearing vocal parts. Unchanged.

The two mismatched-measure cases now report the projector's precise incomplete-line reason rather than their earlier rh-continuity failure. No measure is shortened and no lower accompaniment is imported to force support.

We Welcome You retains its existing View only transposition restriction because the source modulates. Melody display/playback works; unsupported key transposition remains blocked.

## Tests and visual validation

- `tests/melody-phase4d.mjs`, targeted: all 20 candidates plus protected A Child's Prayer; 18 successes, two documented timing failures. Checks every retained event against its source staff/voice/onset/duration/pitch/chord identity; original clefs and note/lyric/notation semantics; no LH leakage; all playback tie chains close; expressions and repeat semantics survive. No slur adjustment was required for the 18 new scores.
- `PHASE4D_FULL=1 node tests/melody-phase4d.mjs`: all 666 structured scores, 640 prior musical and engraving XML outputs exactly unchanged, unrelated failure categories protected.
- `tests/lead-audit.mjs`, `WRITE_INDEX=1 WRITE_REPORT=1`: regenerated the index and lead-catalog report, 658 successful extractions.
- `tests/melody-phase4d-ui.mjs`: simulated iPad 820×1180 for True to the Faith, We Ever Pray for Thee, Where Love Is (prior rh-domain), How Dear to God Are Little Children, and We Welcome You; desktop 1440×1000 for True to the Faith. Menu availability, successful rendering, original clef, no page-level horizontal overflow, no measured lyric-to-lyric collisions; prepared playback timeline equals the displayed Melody XML timeline. True to the Faith's downloaded MusicXML exactly equals displayed musical XML. A focused repeat of the primary case checked the full viewport after cropped-score review.
- `git diff --check`.

Visual limitation: at 820px, the last word “have” in one True to the Faith verse line is slightly clipped at the score's right edge. Its full text is preserved in musical XML/export. This is a score-layout/engraving limitation; no layout or pagination change was made, per task scope. Physical-iPad review remains pending. Automated absence of lyric-to-lyric collisions is not a claim that every glyph fits the SVG edge.

No Library, metronome, annotation, broad playback, or full export matrix was run.
