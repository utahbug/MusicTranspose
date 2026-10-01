# Melody Phase 3: right-hand-first extraction

Extractor commit: `a0a231c8b96811932f00d1de7018da53b0687728`. Baseline: `f9f3934`.

The verified baseline is **245 / 679**, not the request's historical 244. HHC 1035 was already supported and remains byte-for-byte unchanged. This audit was completed before the separately requested 13-song catalog cleanup.

## Architecture and safeguards

- Keep all 245 successful earlier projections unchanged. For previously rejected bundled Hymns, HHC, and Children's scores, identify one G/F piano grand staff or a unique treble/bass pair, preferring explicit piano identity. Part order does not decide the melody. Local imports keep their previous policy.
- Optional parts labeled descant/ossia, including an explicit optional-descant direction, cannot replace piano RH. Their parts/directions are removed from the private intermediate projection. No title or ID-specific melody exceptions.
- Select the principal RH lyric voice; allow unique timed handoffs when that voice is absent. Keep every selected event, including rests and notes with no lyrics. A whole-measure principal rest over another instrumental line requires review rather than silently dropping the line.
- Resolve chords with deterministic dynamic programming across the whole RH line: an upper-tone prior (0.45 per semitone below the top), melodic-motion cost (0.12 per semitone plus 0.35 beyond a seventh), repeated-pitch preference (0.65), voice-change cost (1), and exact pitched tie continuity. Lyrics identify the principal rhythmic lane, not a requirement on every note and not a blind chord-anchor pitch choice. A synthetic C4/B4 chord regression proves the selected pitch can be the lower C4 when surrounding C4 notes support it.
- Concurrent substantial RH lyric lanes with different words, different lyric texts inside one chord, independent non-optional vocal parts, missing RH coverage, invalid timing, incompatible ties, and uncertain slurs fail with an exact diagnostic. No LH notes are borrowed.
- Copy lyrics from the selected chord's lyric owner. Keep selected-note ties/fingering; transfer explicitly upper slurs and shared fermatas/tuplets. Slurs explicitly belonging to discarded lower chord tones are excluded. Unmatched/ambiguous endpoints fail. The existing projector preserves harmony timestamps, key/meter, directions, repeats, barlines, and endings.
- Discard accompaniment cue markers only in the private projection. A selected RH cue requires bounded same-voice neighboring pitches and a duration no longer than a quarter note. Repeat guidance remains. Grace, pitch-changing/condensed notation, tremolo, and ambiguous cues remain guarded.
- Prelude/interlude/postlude events in the principal RH line remain without requiring lyrics. Nativity's introduction and the instrumental openings of HHC 1004/1009 were inspected.

Hymn 19's exact previous failure was `hymn-notation: Upper-staff cue or cue-size notation requires review`: measure 4 has full-size cue-marked RH chord notes; the selected RH continuation now passes the bounded continuity check. No blanket notation bypass was added.

## Coverage before catalog cleanup

| Collection | Structured | Before | After | Remaining | After coverage |
|---|---:|---:|---:|---:|---:|
| Children’s Songbook | 263 | 33 | 216 | 47 | 82.13% |
| Hymns (1985) | 335 | 210 | 283 | 52 | 84.48% |
| Hymns for Home and Church | 81 | 2 | 70 | 11 | 86.42% |
| **Total** | **679** | **245** | **569** | **110** | **83.80%** |

The 13 authorized instrumental removals are all unsupported. After their separate catalog commit, the expected total is **666 structured, 569 supported, 97 fallbacks** (85.44%); Children’s becomes **216/250**, or 86.40%. Two PDF-only catalog entries remain unaffected.

## Failure reasons

Categories change because rejected scores now receive a precise RH diagnostic rather than the old broad gate. Zero old-category results does not mean every formerly rejected song succeeded.

| Reason | Before | After |
|---|---:|---:|
| chordal-melody | 238 | 0 |
| hymn-annotations | 12 | 0 |
| hymn-crossing | 1 | 0 |
| hymn-divisi | 8 | 0 |
| hymn-lyrics | 13 | 0 |
| hymn-notation | 68 | 0 |
| hymn-structure | 20 | 0 |
| hymn-voices | 3 | 0 |
| multiple-lyrics | 54 | 0 |
| no-melody | 13 | 0 |
| outside-cues | 4 | 0 |
| rh-annotations | 0 | 32 |
| rh-competing | 0 | 5 |
| rh-continuity | 0 | 7 |
| rh-cue | 0 | 13 |
| rh-domain | 0 | 22 |
| rh-lyrics | 0 | 23 |
| rh-notation | 0 | 4 |
| rh-ties | 0 | 2 |
| unsupported | 0 | 2 |

## Named regressions

All named successful cases below were rendered at 820×1180, 768×1024, and 1440×1000. Source-pitch/rhythm/lyric/tie provenance was checked independently for every new success. Named screenshots were inspected, with additional tablet/desktop spot checks. Browser viewport simulation is not physical-device proof.

| Song | Page | Result | Melody events / reason |
|---|---|---|---|
| The Nativity Song | 52 | Supported | 52 |
| The Shepherd’s Carol | 40b | Supported | 34 |
| Come, Thou Fount of Every Blessing | 1001 | Supported | 63 |
| I Will Walk with Jesus | 1004 | Supported | 112 |
| Gethsemane | 1009 | Supported | 168 |
| Amazing Grace | 1010 | Supported | 37 |
| As I Keep the Sabbath Day | 1035 | Supported | 56 |
| When I Am Baptized | 1054 | Supported | 55 |
| The Power of the Holy Ghost | 1055 | Supported | 69 |
| When I Survey the Wondrous Cross | 1072 | Supported | 39 |
| Hail the Day That Sees Him Rise | 1201 | Supported | 60 |
| Long Ago, Within a Garden | 1210 | Supported | 63 |
| A Child’s Prayer | 12 | Review required | rh-competing: Multiple non-optional vocal parts; piano accompaniment does not establish a unique sung tune |
| I Love to See the Temple | 95 | Supported | 58 |
| Search, Ponder, and Pray | 109 | Supported | 65 |
| When He Comes Again | 82 | Supported | 85 |
| I Am a Child of God | 2 | Supported | 55 |
| We Thank Thee, O God, for a Prophet | 19 | Supported | 76 |
| Away in a Manger | 42 | Supported | 71 |

A Child’s Prayer remains ambiguous: two non-optional vocal parts. Amazing Grace (`hhc-1010`) succeeds directly. HHC 1035 retains 56 events and 34 harmonies, including its reviewed C4 cadences and Gsus4→G timing. Every previously supported hymn also retains its exact prior projected XML, including The Spirit of God and Silent Night.

## Complete HHC audit

| Song | Page | Old status | New status | Melody result | Remaining failure reason/detail |
|---|---|---|---|---|---|
| Come, Thou Fount of Every Blessing | 1001 | chordal-melody | Supported | 63 RH events |  |
| When the Savior Comes Again | 1002 | chordal-melody | Supported | 145 RH events |  |
| It Is Well with My Soul | 1003 | multiple-lyrics | Supported | 58 RH events |  |
| I Will Walk with Jesus | 1004 | chordal-melody | Supported | 112 RH events |  |
| His Eye Is on the Sparrow | 1005 | chordal-melody | Supported | 110 RH events |  |
| Think a Sacred Song | 1006 | chordal-melody | Supported | 45 RH events |  |
| As Bread Is Broken | 1007 | chordal-melody | Supported | 35 RH events |  |
| Bread of Life, Living Water | 1008 | chordal-melody | Supported | 65 RH events |  |
| Gethsemane | 1009 | chordal-melody | Supported | 168 RH events |  |
| Amazing Grace | 1010 | chordal-melody | Supported | 37 RH events |  |
| Holding Hands Around the World | 1011 | chordal-melody | Supported | 131 RH events |  |
| Anytime, Anywhere | 1012 | chordal-melody | Supported | 31 RH events |  |
| God’s Gracious Love | 1013 | chordal-melody | Supported | 76 RH events |  |
| My Shepherd Will Supply My Need | 1014 | chordal-melody | Supported | 76 RH events |  |
| Oh, the Deep, Deep Love of Jesus | 1015 | chordal-melody | Supported | 64 RH events |  |
| Behold the Wounds in Jesus’ Hands | 1016 | chordal-melody | Supported | 56 RH events |  |
| Come, Lord Jesus | 1018 | chordal-melody | Review | Unchanged source fallback | rh-lyrics: No principal lyric evidence on piano right hand |
| To Love like Thee | 1019 | chordal-melody | Supported | 33 RH events |  |
| Softly and Tenderly Jesus Is Calling | 1020 | multiple-lyrics | Supported | 71 RH events |  |
| I Know That My Savior Loves Me | 1021 | chordal-melody | Review | Unchanged source fallback | rh-notation: Grace-note rhythmic ownership requires review |
| Faith in Every Footstep | 1022 | multiple-lyrics | Supported | 97 RH events |  |
| Standing on the Promises | 1023 | chordal-melody | Supported | 73 RH events |  |
| I Have Faith in the Lord Jesus Christ | 1024 | chordal-melody | Supported | 77 RH events |  |
| Take My Heart and Let It Be Consecrated | 1025 | chordal-melody | Supported | 46 RH events |  |
| Holy Places | 1026 | chordal-melody | Supported | 60 RH events |  |
| Welcome Home | 1027 | chordal-melody | Supported | 65 RH events |  |
| This Little Light of Mine | 1028 | chordal-melody | Supported | 58 RH events |  |
| I Can’t Count Them All | 1029 | chordal-melody | Supported | 57 RH events |  |
| Close as a Quiet Prayer | 1030 | chordal-melody | Review | Unchanged source fallback | rh-continuity: Primary RH rest overlaps another instrumental line at measure 33; handoff needs review |
| Come, Hear the Word the Lord Has Spoken | 1031 | chordal-melody | Supported | 41 RH events |  |
| Look unto Christ | 1032 | chordal-melody | Supported | 46 RH events |  |
| Oh, How Great Is Our Joy | 1033 | multiple-lyrics | Supported | 66 RH events |  |
| I’m a Pioneer Too | 1034 | chordal-melody | Supported | 60 RH events |  |
| As I Keep the Sabbath Day | 1035 | Supported | Supported | 56 RH events |  |
| Read the Book of Mormon and Pray | 1036 | chordal-melody | Supported | 85 RH events |  |
| I’m Gonna Live So God Can Use Me | 1037 | multiple-lyrics | Supported | 41 RH events |  |
| The Lord’s My Shepherd | 1038 | chordal-melody | Supported | 42 RH events |  |
| Because | 1039 | chordal-melody | Review | Unchanged source fallback | rh-ties: No continuous pitched tie path at measure 2 |
| His Voice as the Sound | 1040 | chordal-melody | Supported | 80 RH events |  |
| O Lord, Who Gave Thy Life for Me | 1041 | chordal-melody | Supported | 50 RH events |  |
| Thou Gracious God, Whose Mercy Lends | 1042 | chordal-melody | Supported | 36 RH events |  |
| Help Us Remember | 1043 | chordal-melody | Supported | 44 RH events |  |
| How Did the Savior Minister? | 1044 | chordal-melody | Supported | 58 RH events |  |
| Jesus Is the Way | 1045 | multiple-lyrics | Supported | 57 RH events |  |
| Can You Count the Stars in Heaven? | 1046 | chordal-melody | Review | Unchanged source fallback | rh-annotations: Unmatched slur 1 at measure 4 |
| He Cares for Me | 1047 | chordal-melody | Review | Unchanged source fallback | rh-annotations: Unmatched slur 1 at measure 18 |
| Our Prayer to Thee | 1048 | chordal-melody | Supported | 70 RH events |  |
| Joseph Prayed in Faith | 1049 | chordal-melody | Supported | 112 RH events |  |
| Stand by Me | 1050 | multiple-lyrics | Supported | 47 RH events |  |
| This Day Is a Good Day, Lord | 1051 | chordal-melody | Supported | 48 RH events |  |
| Joyfully Bound | 1052 | chordal-melody | Supported | 140 RH events |  |
| My Covenants | 1053 | chordal-melody | Supported | 112 RH events |  |
| When I Am Baptized | 1054 | Supported | Supported | 55 RH events |  |
| The Power of the Holy Ghost | 1055 | chordal-melody | Supported | 69 RH events |  |
| Elijah and the Still, Small Voice | 1056 | chordal-melody | Supported | 62 RH events |  |
| Jesus Is My Shepherd | 1057 | chordal-melody | Supported | 73 RH events |  |
| My Song in the Night | 1058 | chordal-melody | Supported | 51 RH events |  |
| This Is My Father’s World | 1059 | chordal-melody | Supported | 61 RH events |  |
| Build an Ark | 1060 | chordal-melody | Review | Unchanged source fallback | rh-annotations: Unmatched slur 1 at measure 15 |
| Love Will Bless Our Home | 1061 | chordal-melody | Supported | 67 RH events |  |
| Lord, Accept Our Humble Fast | 1062 | chordal-melody | Supported | 25 RH events |  |
| Peace, Peace, Be Still | 1063 | chordal-melody | Review | Unchanged source fallback | rh-annotations: Unmatched slur 2 at measure 18 |
| Great Is Thy Faithfulness | 1064 | chordal-melody | Supported | 85 RH events |  |
| Isaiah Said | 1065 | chordal-melody | Review | Unchanged source fallback | rh-annotations: Unmatched slur 1 at measure 12 |
| Fight the Good Fight | 1066 | chordal-melody | Supported | 36 RH events |  |
| It’s Joyful to Live the Gospel | 1067 | chordal-melody | Review | Unchanged source fallback | rh-annotations: Unmatched slur 1 at measure 24 |
| To God Be the Glory | 1068 | chordal-melody | Supported | 90 RH events |  |
| Speak to Us, Lord | 1069 | chordal-melody | Supported | 89 RH events |  |
| The Miracle | 1070 | chordal-melody | Supported | 140 RH events |  |
| What God Calls Us To | 1071 | chordal-melody | Supported | 51 RH events |  |
| When I Survey the Wondrous Cross | 1072 | chordal-melody | Supported | 39 RH events |  |
| Hail the Day That Sees Him Rise | 1201 | chordal-melody | Supported | 60 RH events |  |
| He Is Born, the Divine Christ Child | 1202 | chordal-melody | Supported | 68 RH events |  |
| What Child Is This? | 1203 | chordal-melody | Supported | 71 RH events |  |
| Star Bright | 1204 | chordal-melody | Supported | 82 RH events |  |
| Let Easter Anthems Ring | 1205 | chordal-melody | Supported | 53 RH events |  |
| Were You There? | 1206 | multiple-lyrics | Review | Unchanged source fallback | rh-ties: No continuous pitched tie path at measure 22 |
| Still, Still, Still | 1207 | chordal-melody | Supported | 49 RH events |  |
| Go Tell It on the Mountain | 1208 | chordal-melody | Supported | 57 RH events |  |
| Little Baby in a Manger | 1209 | chordal-melody | Supported | 92 RH events |  |
| Long Ago, Within a Garden | 1210 | chordal-melody | Supported | 63 RH events |  |

## Engraving and page-count validation

All 324 newly supported scores rendered successfully at tablet width, without document horizontal overflow. The 18 named successful songs passed all 54 viewport checks: no measured lyric collisions and Melody page counts never exceeded the corresponding full structured score.

Visual inspection exposed an oversized hymn-19 pickup and crowded lyrics in the compact profile. Only the new `rh-melody` projections use a bounded 5× lyric expansion, zero permitted cross-measure lyric overlap, and the existing measured full-score spacing candidates. No glyph-size reduction or pagination algorithm change. Existing 245 Lead profiles are unchanged. The same new-profile choice applies to print engraving; export UI and original PDFs are untouched.

Screenshots and detailed geometry are under ignored `test-results/phase3-*.png`; durable per-song/viewport counts are in `melody-phase3.json`.

## Tests and index generation

- `tests/right-hand-melody.mjs`: lower chord tone by continuity; lyricless note retention; reordered RH/LH parts; optional descant; prohibited LH borrowing; missing coverage; concurrent lyric ambiguity.
- `tests/melody-phase3.mjs`: all 679 source comparisons, all 245 prior XML outputs identical, independent new-note provenance/lyrics/ties, named successes; `PHASE3_RENDER=1` adds 54 viewports, lyric-collision assertions and page-count contract.
- `tests/melody-phase3-render.mjs`: all 324 new results actually engrave.
- `tests/lead-audit.mjs`: all 679 sources; generated index 569. Generator now derives its report denominator from the actual scan, rather than hardcoding 679.
- `tests/lead-hhc1035.mjs` and `tests/lead-hhc1035-polish.mjs`: exact reviewed melody/harmony plus lyric/chord layout. Old blanket fallback expectations were replaced only where Phase 3 intentionally broadens the policy.
- `tests/lead-layout.mjs`: legacy Lead/Transpose geometry restoration across five viewports; updated the retired menu selector and ignored only volatile VexFlow-generated IDs in SVG comparisons.
- `tests/pdf-first-capabilities.mjs` and `tests/score-view-menu-state.mjs`: tablet capability/menu roundtrips; the unsupported fixture is now the genuinely ambiguous A Child’s Prayer rather than newly supported Nativity.
- Final index-consistency audit and representative direct Melody opens are recorded separately in `melody-phase3-final-index.json` after catalog cleanup.

No unrelated music-engine/chord suite was run. No title-specific algorithm exceptions, source MXL edits, playback synthesis changes, toolbar changes, or PrimarySongs changes.

## Files / commit separation

Extractor and validation: `right-hand-melody.js`, `lead-view.js`, narrowly scoped `lead-layout.js` / `app.js` engraving integration, offline module registration in `sw.js`, and focused tests.

Generated metadata/diagnostics: `lead-availability.js`, this report, and `melody-phase3.json`.

Separate catalog cleanup: `imported-songs.js`; removes precisely the 13 requested pages 288–299 from the user-facing catalog, keeping source assets.

## Remaining human review

The 110 pre-cleanup fallbacks (97 after cleanup) retain exact reasons in the JSON; HHC details are all listed above. Prioritize slur ownership, single-vocal-to-piano lyric alignment (HHC 1018), grace-note timing (1021), cue ownership (1030), editorial ties (1039/1206), and independent duet lines. No unsafe automatic LH continuation or fabricated notes were used to increase coverage.

The deterministic chord model has source-provenance and visual checks, but physical iPad performance and a musician's judgment of editorial melody choices remain valuable, especially the newly supported arrangements with chordal introductions and verse handoffs.
