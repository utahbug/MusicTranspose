# Lead Phase 2B: unusual-notation Hymns audit

## Result

40 additional Hymns enabled. Total supported structured scores: **203 -> 243** of 679. Supported Hymns: **169 -> 209** of 335. Of the original 124 unusual-notation fallbacks, **40 resolved and 84 remain**. Total Hymns on fallback: **166 -> 126**.

The 42 Hymns originally in the other fallback categories are untouched. Every one of the prior 203 successful extraction outputs remains byte-identical. No non-Hymn expansion, title-specific melody assignments or layout changes.

## Classification of all 124

All 124 have cue or cue-size markings. No member is rejected by the initial notation guard solely for fermatas, caesuras, pickups, meter changes, repeated sections or introductions. Those features can coexist, but are not the cause of this category.

| Pattern | Songs | Examples (Hymns number / title) | Solvability / confidence | Decision and reason |
|---|---:|---|---|---|
| Full-size cue-marked notes confined to lower accompaniment | 53 | 22 We Listen to a Prophet's Voice; 134 I Believe in Christ; 206 Away in a Manger | High, conditional on every other structural guard | 40 enabled; 13 fail later guards. Cues cannot enter the continuous upper lyric voice. |
| Lower-staff small/mixed cues or cue rests | 39 | 9 Come, Rejoice; 13 An Angel from on High; 14 Sweet Is the Peace the Gospel Brings | Insufficient confidence for expansion | All retained. Diagnostic removal exposes divisi in 36, lower lyric ownership in 2 and unclear structure in 1. |
| Upper-staff cues only | 13 | 17 Awake, Ye Saints of God, Awake!; 21 Come, Listen to a Prophet's Voice; 56 Softly Beams the Sacred Dawning | Low confidence without interpreting cue function | All retained. Upper cue material can affect which melody is intended. |
| Cues on both upper and lower staves | 18 | 202 Oh, Come, All Ye Faithful; 19 We Thank Thee, O God, for a Prophet; 66 Rejoice, the Lord Is King! | Low confidence without interpreting upper cues | All retained; accompaniment isolation is insufficient. |
| Linked parts and octave-transposing clef, plus cues | 1 | 70 Sing Praise to Him | Low confidence | Retained; structure/transposition needs a separate review. |

Counts are mutually exclusive and sum to 124. For ambiguous multi-part sources, upper/lower in the inventory describes source-order positions, not an approved piano-hand assignment; the structural guard still rejects those scores. Overlapping XML trigger counts are 89 with `<cue/>` and 48 with `<type size="cue">`; 13 have both. The linked-part score also has cue markings and a nonzero clef-octave-change.

The audit records every marked note's part, staff, voice, measure, chord/rest/lyric status and original XML in [lead-phase2b-audit.json](lead-phase2b-audit.json). [The frozen baseline](lead-phase2b-baseline.json) records original membership and all catalog outcomes at commit 8166f44. `tests/lead-unusual-audit.mjs` reproduces the inspection. Its cue-removal diagnostic runs only on a temporary copy to reveal later blockers; it is never used as production extraction or as sufficient evidence of safety. In particular, 18 upper-cue scores pass that diagnostic but remain excluded.

## Narrow implemented rule

For bundled Hymns (1985) only, the new exception requires every cue-marked note to be pitched, explicitly `type size="full"`, and on the structurally identified lower accompaniment staff. Small cue notes, cue rests, upper cues and unclassified cues remain excluded. No claim is made that every cue marker is an exporter mistake.

The upper lyric-bearing voice still has to cover the entire timeline. Existing tests for staff/part layout, lyrics, voice continuity, rests, divisi, crossings, tie/slur ownership and unusual notation all remain active. Selection remains voice-first, not highest-note selection across the score. All 182 cue-marked notes in the 40 accepted sources are full-size pitched lower-staff notes.

Only after these checks succeed does the established Lead projector receive permission to discard cues from that specific accompaniment staff. Source XML is not modified. Cue markings are not globally stripped, and generic/non-Hymn extraction retains its prior rejection behavior. Melody, harmonies, words, tempo, key/time changes, repeats/endings and playback timing retain the established projection path.

## Remaining patterns and intentional exclusions

84 original targets remain: 39 small/mixed lower-cue scores, 31 upper-cue scores, 1 linked-part/octave-clef score, and 13 full-size lower-cue scores with additional blockers.

Those 13 are:

- Divisi: 46 Glorious Things of Thee Are Spoken; 136 I Know That My Redeemer Lives.
- Lyric ownership: 59 Come, O Thou King of Kings; 152 God Be with You Till We Meet Again; 246 Onward, Christian Soldiers.
- Slur ambiguity: 172 In Humility, Our Savior; 200 Christ the Lord Is Risen Today; 203 Angels We Have Heard on High; 213 The First Noel; 260 Who's on the Lord's Side?
- Structure: 315 Jesus, the Very Thought of Thee; 316 The Lord Is My Shepherd; 333 High on the Mountain Top.

Some targets now report the next structural guard rather than the original catch-all notation guard. This reclassification does not enable any of them or change the original 42 out-of-scope fallbacks. Within the 84 targets, final engine reasons are notation 69, structure 5, annotations 5, lyrics 3 and divisi 2.

Hymn 280, Welcome, Welcome, Sabbath Morning, is newly Lead-capable but retains its existing source-modulation/view-only restriction. This task does not add transposition support for modulating scores.

## Musical and visual verification

- All 40 new hymns: independent source soprano pitch/rest/onset/duration, exact lyric attachment, chosen-tone ties, beams, slurs, harmonies/directions/sounds, repeats/endings and playback-duration checks passed. No accompaniment cue enters Lead.
- All 209 supported Hymns rendered successfully at 390px. All 203 previous outputs are byte-identical to commit 8166f44. All original 42 other Hymn fallbacks and other collections are unchanged.
- Transposition at -3/+2 semitones passed for the 39 transposable new hymns; source and Lead both retain the existing modulation restriction for Hymn 280. Octave playback at -1/+1 passed for all 40 at the XML/timeline level.
- Manual visual full-score/Lead comparison: 22 We Listen to a Prophet's Voice (three verses, accidentals, tie/slur and fermata), 134 I Believe in Christ (four verses and moving inner voices), 206 Away in a Manger (three verses, pickup and beamed motion). The Lead follows the upper tune; the lower cue-marked material is omitted. Structural checks cover every measure beyond the visible screenshots.
- Actual browser printing for all three: one music page each plus the unchanged credits page. Rendered PDFs were visually inspected, including all credits pages. Compact engraving remained intact.
- All three passed key +2, Lead octave -1, Reset, application playback-timeline equality and viewport checks at 320x568, 390x844, 844x390, 820x1180 and 1440x1000. No horizontal document overflow. These are browser tests, not physical iPhone/iPad tests.
- Offline reload of a newly enabled Lead and playback preparation passed. Existing compact Lead-layout checks passed, including samples from the original 34. Synthetic guard cases passed for lower full-size cues, upper/mixed cues, small cues, lower lyrics and divisi.
- Production is static: tested with the production files served locally; no separate compile step. No full music-engine or 7,288-case chord suite ran.

Scripts run: `lead-unusual-audit.mjs`, `lead-unusual.mjs`, `lead-hymn-safety.mjs`, `lead-hymn-audit.mjs` (availability generation), `lead-hymns.mjs`, `lead-unusual-ui.mjs`, and `lead-layout.mjs`.

## Files changed

- `hymn-melody.js`: precise lower full-size cue eligibility; existing guards unchanged.
- `lead-view.js`: scoped permission for the validated accompaniment staff.
- `lead-availability.js`: generated 243-song availability index; no Library UI edits.
- `sw.js`: cache v112 for updated extraction/index.
- `tests/lead-hymn-safety.mjs`: cue isolation and rejection fixtures.
- `tests/lead-unusual-audit.mjs`, `tests/lead-unusual.mjs`, `tests/lead-unusual-ui.mjs`: repeatable classification, baseline/musical checks, responsive/print/offline checks.
- Reports: this report, baseline JSON, detailed audit JSON and refreshed full catalog inventory.

Most Music/Normal margins, Lead layout rules, Library, Fun, metronome, playback and transposition engines are unchanged.

## Complete 124-song inventory

| Hymn | Title | Pattern | Result | Next guard in cue-removal diagnostic |
|---|---|---|---|---|
| 9 | Come, Rejoice | Small/mixed lower cues or cue rests | hymn-notation | hymn-divisi |
| 13 | An Angel from on High | Small/mixed lower cues or cue rests | hymn-notation | hymn-divisi |
| 14 | Sweet Is the Peace the Gospel Brings | Small/mixed lower cues or cue rests | hymn-notation | hymn-divisi |
| 17 | Awake, Ye Saints of God, Awake! | Upper-staff cues only | hymn-notation | hymn-voices |
| 19 | We Thank Thee, O God, for a Prophet | Upper and lower cues | hymn-notation | eligible-after-cue-removal |
| 21 | Come, Listen to a Prophet’s Voice | Upper-staff cues only | hymn-notation | eligible-after-cue-removal |
| 22 | We Listen to a Prophet’s Voice | Full-size cue-marked lower accompaniment | Supported | eligible-after-cue-removal |
| 23 | We Ever Pray for Thee | Full-size cue-marked lower accompaniment | Supported | eligible-after-cue-removal |
| 28 | Saints, Behold How Great Jehovah | Small/mixed lower cues or cue rests | hymn-notation | hymn-divisi |
| 30 | Come, Come, Ye Saints | Small/mixed lower cues or cue rests | hymn-notation | hymn-divisi |
| 37 | The Wintry Day, Descending to Its Close | Small/mixed lower cues or cue rests | hymn-notation | hymn-divisi |
| 40 | Arise, O Glorious Zion | Full-size cue-marked lower accompaniment | Supported | eligible-after-cue-removal |
| 43 | Zion Stands with Hills Surrounded | Full-size cue-marked lower accompaniment | Supported | eligible-after-cue-removal |
| 46 | Glorious Things of Thee Are Spoken | Full-size cue-marked lower accompaniment | hymn-divisi | hymn-divisi |
| 55 | Lo, the Mighty God Appearing! | Small/mixed lower cues or cue rests | hymn-notation | hymn-divisi |
| 56 | Softly Beams the Sacred Dawning | Upper-staff cues only | hymn-notation | eligible-after-cue-removal |
| 59 | Come, O Thou King of Kings | Full-size cue-marked lower accompaniment | hymn-lyrics | hymn-lyrics |
| 62 | All Creatures of Our God and King | Full-size cue-marked lower accompaniment | Supported | eligible-after-cue-removal |
| 64 | On This Day of Joy and Gladness | Small/mixed lower cues or cue rests | hymn-notation | hymn-divisi |
| 66 | Rejoice, the Lord Is King! | Upper and lower cues | hymn-notation | eligible-after-cue-removal |
| 67 | Glory to God on High | Small/mixed lower cues or cue rests | hymn-notation | hymn-divisi |
| 68 | A Mighty Fortress Is Our God | Upper and lower cues | hymn-notation | eligible-after-cue-removal |
| 69 | All Glory, Laud, and Honor | Full-size cue-marked lower accompaniment | Supported | eligible-after-cue-removal |
| 70 | Sing Praise to Him | Linked parts and octave clef, plus cues | hymn-notation | hymn-notation |
| 78 | God of Our Fathers, Whose Almighty Hand | Upper and lower cues | hymn-notation | hymn-divisi |
| 80 | God of Our Fathers, Known of Old | Small/mixed lower cues or cue rests | hymn-notation | hymn-divisi |
| 81 | Press Forward, Saints | Small/mixed lower cues or cue rests | hymn-notation | hymn-divisi |
| 82 | For All the Saints | Upper and lower cues | hymn-notation | hymn-annotations |
| 83 | Guide Us, O Thou Great Jehovah | Small/mixed lower cues or cue rests | hymn-notation | hymn-divisi |
| 85 | How Firm a Foundation | Upper and lower cues | hymn-notation | eligible-after-cue-removal |
| 89 | The Lord Is My Light | Small/mixed lower cues or cue rests | hymn-notation | hymn-divisi |
| 97 | Lead, Kindly Light | Upper and lower cues | hymn-notation | hymn-annotations |
| 105 | Master, the Tempest Is Raging | Upper and lower cues | hymn-notation | hymn-lyrics |
| 108 | The Lord Is My Shepherd | Small/mixed lower cues or cue rests | hymn-notation | hymn-divisi |
| 110 | Cast Thy Burden upon the Lord | Full-size cue-marked lower accompaniment | Supported | eligible-after-cue-removal |
| 113 | Our Savior’s Love | Small/mixed lower cues or cue rests | hymn-notation | hymn-divisi |
| 115 | Come, Ye Disconsolate | Full-size cue-marked lower accompaniment | Supported | eligible-after-cue-removal |
| 119 | Come, We That Love the Lord | Small/mixed lower cues or cue rests | hymn-notation | hymn-divisi |
| 122 | Though Deepening Trials | Upper-staff cues only | hymn-notation | eligible-after-cue-removal |
| 125 | How Gentle God’s Commands | Small/mixed lower cues or cue rests | hymn-notation | hymn-divisi |
| 128 | When Faith Endures | Full-size cue-marked lower accompaniment | Supported | eligible-after-cue-removal |
| 129 | Where Can I Turn for Peace? | Small/mixed lower cues or cue rests | hymn-notation | hymn-divisi |
| 131 | More Holiness Give Me | Full-size cue-marked lower accompaniment | Supported | eligible-after-cue-removal |
| 133 | Father in Heaven | Small/mixed lower cues or cue rests | hymn-notation | hymn-divisi |
| 134 | I Believe in Christ | Full-size cue-marked lower accompaniment | Supported | eligible-after-cue-removal |
| 135 | My Redeemer Lives | Full-size cue-marked lower accompaniment | Supported | eligible-after-cue-removal |
| 136 | I Know That My Redeemer Lives | Full-size cue-marked lower accompaniment | hymn-divisi | hymn-divisi |
| 142 | Sweet Hour of Prayer | Full-size cue-marked lower accompaniment | Supported | eligible-after-cue-removal |
| 146 | Gently Raise the Sacred Strain | Upper-staff cues only | hymn-notation | eligible-after-cue-removal |
| 147 | Sweet Is the Work | Full-size cue-marked lower accompaniment | Supported | eligible-after-cue-removal |
| 149 | As the Dew from Heaven Distilling | Upper and lower cues | hymn-notation | eligible-after-cue-removal |
| 152 | God Be with You Till We Meet Again | Full-size cue-marked lower accompaniment | hymn-lyrics | hymn-lyrics |
| 153 | Lord, We Ask Thee Ere We Part | Small/mixed lower cues or cue rests | hymn-notation | hymn-divisi |
| 156 | Sing We Now at Parting | Full-size cue-marked lower accompaniment | Supported | eligible-after-cue-removal |
| 160 | Softly Now the Light of Day | Full-size cue-marked lower accompaniment | Supported | eligible-after-cue-removal |
| 162 | Lord, We Come before Thee Now | Small/mixed lower cues or cue rests | hymn-notation | hymn-divisi |
| 163 | Lord, Dismiss Us with Thy Blessing | Upper-staff cues only | hymn-notation | eligible-after-cue-removal |
| 166 | Abide with Me! | Full-size cue-marked lower accompaniment | Supported | eligible-after-cue-removal |
| 172 | In Humility, Our Savior | Full-size cue-marked lower accompaniment | hymn-annotations | hymn-annotations |
| 176 | ’Tis Sweet to Sing the Matchless Love | Small/mixed lower cues or cue rests | hymn-notation | hymn-divisi |
| 183 | In Remembrance of Thy Suffering | Upper-staff cues only | hymn-notation | eligible-after-cue-removal |
| 184 | Upon the Cross of Calvary | Small/mixed lower cues or cue rests | hymn-notation | hymn-divisi |
| 186 | Again We Meet around the Board | Small/mixed lower cues or cue rests | hymn-notation | hymn-divisi |
| 187 | God Loved Us, So He Sent His Son | Full-size cue-marked lower accompaniment | Supported | eligible-after-cue-removal |
| 193 | I Stand All Amazed | Upper-staff cues only | hymn-notation | eligible-after-cue-removal |
| 194 | There Is a Green Hill Far Away | Full-size cue-marked lower accompaniment | Supported | eligible-after-cue-removal |
| 195 | How Great the Wisdom and the Love | Small/mixed lower cues or cue rests | hymn-notation | hymn-divisi |
| 197 | O Savior, Thou Who Wearest a Crown | Small/mixed lower cues or cue rests | hymn-notation | hymn-divisi |
| 199 | He Is Risen! | Full-size cue-marked lower accompaniment | Supported | eligible-after-cue-removal |
| 200 | Christ the Lord Is Risen Today | Full-size cue-marked lower accompaniment | hymn-annotations | hymn-annotations |
| 201 | Joy to the World | Small/mixed lower cues or cue rests | hymn-notation | hymn-lyrics |
| 202 | Oh, Come, All Ye Faithful | Upper and lower cues | hymn-notation | eligible-after-cue-removal |
| 203 | Angels We Have Heard on High | Full-size cue-marked lower accompaniment | hymn-annotations | hymn-annotations |
| 206 | Away in a Manger | Full-size cue-marked lower accompaniment | Supported | eligible-after-cue-removal |
| 207 | It Came upon the Midnight Clear | Upper and lower cues | hymn-notation | eligible-after-cue-removal |
| 209 | Hark! The Herald Angels Sing | Small/mixed lower cues or cue rests | hymn-notation | hymn-divisi |
| 210 | With Wondering Awe | Small/mixed lower cues or cue rests | hymn-notation | hymn-divisi |
| 211 | While Shepherds Watched Their Flocks | Full-size cue-marked lower accompaniment | Supported | eligible-after-cue-removal |
| 212 | Far, Far Away on Judea’s Plains | Small/mixed lower cues or cue rests | hymn-notation | hymn-lyrics |
| 213 | The First Noel | Full-size cue-marked lower accompaniment | hymn-annotations | hymn-annotations |
| 216 | We Are Sowing | Full-size cue-marked lower accompaniment | Supported | eligible-after-cue-removal |
| 220 | Lord, I Would Follow Thee | Small/mixed lower cues or cue rests | hymn-notation | hymn-divisi |
| 221 | Dear to the Heart of the Shepherd | Full-size cue-marked lower accompaniment | Supported | eligible-after-cue-removal |
| 223 | Have I Done Any Good? | Full-size cue-marked lower accompaniment | Supported | eligible-after-cue-removal |
| 225 | We Are Marching On to Glory | Small/mixed lower cues or cue rests | hymn-notation | hymn-divisi |
| 232 | Let Us Oft Speak Kind Words | Upper and lower cues | hymn-notation | hymn-divisi |
| 233 | Nay, Speak No Ill | Small/mixed lower cues or cue rests | hymn-notation | hymn-divisi |
| 243 | Let Us All Press On | Upper-staff cues only | hymn-notation | hymn-lyrics |
| 246 | Onward, Christian Soldiers | Full-size cue-marked lower accompaniment | hymn-lyrics | hymn-lyrics |
| 251 | Behold! A Royal Army | Upper and lower cues | hymn-notation | hymn-divisi |
| 254 | True to the Faith | Small/mixed lower cues or cue rests | hymn-notation | hymn-structure |
| 255 | Carry On | Upper and lower cues | hymn-notation | hymn-divisi |
| 259 | Hope of Israel | Full-size cue-marked lower accompaniment | Supported | eligible-after-cue-removal |
| 260 | Who’s on the Lord’s Side? | Full-size cue-marked lower accompaniment | hymn-annotations | hymn-annotations |
| 261 | Thy Servants Are Prepared | Small/mixed lower cues or cue rests | hymn-notation | hymn-divisi |
| 263 | Go Forth with Faith | Full-size cue-marked lower accompaniment | Supported | eligible-after-cue-removal |
| 268 | Come, All Whose Souls Are Lighted | Full-size cue-marked lower accompaniment | Supported | eligible-after-cue-removal |
| 273 | Truth Reflects upon Our Senses | Small/mixed lower cues or cue rests | hymn-notation | hymn-divisi |
| 274 | The Iron Rod | Full-size cue-marked lower accompaniment | Supported | eligible-after-cue-removal |
| 280 | Welcome, Welcome, Sabbath Morning | Full-size cue-marked lower accompaniment | Supported | eligible-after-cue-removal |
| 283 | The Glorious Gospel Light Has Shone | Full-size cue-marked lower accompaniment | Supported | eligible-after-cue-removal |
| 284 | If You Could Hie to Kolob | Upper-staff cues only | hymn-notation | eligible-after-cue-removal |
| 287 | Rise, Ye Saints, and Temples Enter | Full-size cue-marked lower accompaniment | Supported | eligible-after-cue-removal |
| 291 | Turn Your Hearts | Upper and lower cues | hymn-notation | eligible-after-cue-removal |
| 294 | Love at Home | Small/mixed lower cues or cue rests | hymn-notation | hymn-divisi |
| 295 | O Love That Glorifies the Son | Full-size cue-marked lower accompaniment | Supported | eligible-after-cue-removal |
| 296 | Our Father, by Whose Name | Full-size cue-marked lower accompaniment | Supported | eligible-after-cue-removal |
| 297 | From Homes of Saints Glad Songs Arise | Full-size cue-marked lower accompaniment | Supported | eligible-after-cue-removal |
| 298 | Home Can Be a Heaven on Earth | Full-size cue-marked lower accompaniment | Supported | eligible-after-cue-removal |
| 302 | I Know My Father Lives | Upper-staff cues only | hymn-notation | eligible-after-cue-removal |
| 305 | The Light Divine | Full-size cue-marked lower accompaniment | Supported | eligible-after-cue-removal |
| 307 | In Our Lovely Deseret | Full-size cue-marked lower accompaniment | Supported | eligible-after-cue-removal |
| 310 | A Key Was Turned in Latter Days | Full-size cue-marked lower accompaniment | Supported | eligible-after-cue-removal |
| 315 | Jesus, the Very Thought of Thee | Full-size cue-marked lower accompaniment | hymn-structure | hymn-structure |
| 316 | The Lord Is My Shepherd | Full-size cue-marked lower accompaniment | hymn-structure | hymn-structure |
| 318 | Love at Home | Upper and lower cues | hymn-structure | hymn-structure |
| 320 | The Priesthood of Our Lord | Upper-staff cues only | hymn-notation | eligible-after-cue-removal |
| 322 | Come, All Ye Sons of God | Full-size cue-marked lower accompaniment | Supported | eligible-after-cue-removal |
| 323 | Rise Up, O Men of God | Upper and lower cues | hymn-notation | hymn-structure |
| 329 | Thy Servants Are Prepared | Upper-staff cues only | hymn-structure | hymn-structure |
| 333 | High on the Mountain Top | Full-size cue-marked lower accompaniment | hymn-structure | hymn-structure |
| 339 | My Country, ’Tis of Thee | Small/mixed lower cues or cue rests | hymn-notation | hymn-divisi |
| 340 | The Star-Spangled Banner | Upper and lower cues | hymn-notation | hymn-divisi |
| 341 | God Save the King | Small/mixed lower cues or cue rests | hymn-notation | hymn-divisi |
