# Melody Phase 3B: remaining HHC failures

Baseline: `0b21c48cb706db764fece28b98cb99e8bbb1ed50`, verified against the deployed extractor before changes. Extractor/tests commit: `9ced4d7243ecbca3e72539362dfde19633c5d59e`.

The fresh baseline audit found exactly 11 HHC failures. Classification was completed and reported before code changes. Nine are now supported; two remain blocked by source tie semantics. No title-specific exceptions, source MXL edits, UI changes, playback parser changes, or work on A Child’s Prayer.

## Coverage

| Collection | Structured | Before supported / fallback | After supported / fallback | After coverage |
|---|---:|---:|---:|---:|
| Hymns for Home and Church | 81 | 70 / 11 | 79 / 2 | 97.53% |
| Children’s Songbook | 250 | 216 / 34 | 216 / 34 | 86.40% |
| Hymns (1985) | 335 | 283 / 52 | 283 / 52 | 84.48% |
| All structured scores | 666 | 569 / 97 | 578 / 88 | 86.79% |

The catalog still contains 668 songs, including two PDF-only songs. No catalog rows were added or removed. Generated metadata gained exactly nine IDs, with no removed IDs or false-positive/missing-success entries.

## Exact starting failures and classification

A = clear RH melody, overly conservative handling. B = special structure with generalized handling. C = genuinely ambiguous melody. D = source/encoding issue. HHC 1021 was initially classified A for the grace-spacer blocker, then refined to D when its independent tie inconsistency became visible; it remains unsupported.

| Page / ID | Title | Initial reason | Exact initial detail | Class | Result |
|---|---|---|---|---|---|
| 1018 / `hhc-1018` | Come, Lord Jesus | `rh-lyrics` | No principal lyric evidence on piano right hand | B | Supported |
| 1021 / `hhc-1021` | I Know That My Savior Loves Me | `rh-notation` | Grace-note rhythmic ownership requires review | A → D | Still unsupported |
| 1030 / `hhc-1030` | Close as a Quiet Prayer | `rh-continuity` | Primary RH rest overlaps another instrumental line at measure 33; handoff needs review | B | Supported |
| 1039 / `hhc-1039` | Because | `rh-ties` | No continuous pitched tie path at measure 2 | D | Still unsupported |
| 1046 / `hhc-1046` | Can You Count the Stars in Heaven? | `rh-annotations` | Unmatched slur 1 at measure 4 | A | Supported |
| 1047 / `hhc-1047` | He Cares for Me | `rh-annotations` | Unmatched slur 1 at measure 18 | A | Supported |
| 1060 / `hhc-1060` | Build an Ark | `rh-annotations` | Unmatched slur 1 at measure 15 | A | Supported |
| 1063 / `hhc-1063` | Peace, Peace, Be Still | `rh-annotations` | Unmatched slur 2 at measure 18 | A | Supported |
| 1065 / `hhc-1065` | Isaiah Said | `rh-annotations` | Unmatched slur 1 at measure 12 | B | Supported |
| 1067 / `hhc-1067` | It’s Joyful to Live the Gospel | `rh-annotations` | Unmatched slur 1 at measure 24 | A | Supported |
| 1206 / `hhc-1206` | Were You There? | `rh-ties` | No continuous pitched tie path at measure 22 | B | Supported |

## Source structure and musical decisions

- **1018 — Come, Lord Jesus:** Separate P1 vocal part and P2 grand-staff piano. All 57 lyric onsets align to a single RH voice by onset and pitch intersection. Piano ornaments are shorter than sustained vocal notes in measures 4, 8 and 12; retain the piano rhythm. Transfer only source lyrics, never vocal notes.
- **1021 — I Know That My Savior Loves Me:** Split treble/bass parts. The initial grace guard sees two invisible zero-time grace REST spacers at measure 33. Once those are ignored, measure 29 exposes an F4 sound tie start followed by a cue F4 with a visual tied stop but no sound tie stop. Verse 1 has a new syllable (Yet) where verse 2 extends the previous word. There is no single unambiguous sound-tie interpretation; leave unsupported rather than synthesize markers or choose a verse.
- **1030 — Close as a Quiet Prayer:** Split treble/bass parts. Principal RH whole-measure rest at measure 33 covers a unique three-note RH instrumental phrase. Complete cue-sized, lyric-anchored RH phrases occur in the repeat ending and closing passage. Only whole source events that fit a principal rest window are used; sustained accompaniment crossing the return of the principal voice is not truncated into a new melody event.
- **1039 — Because:** Split treble/bass parts. In the introduction, principal RH G4 tie starts are followed by C5/D5 in that line; simultaneous secondary RH G4 continuations do not have sound or visual tie-stop markers. A monophonic tie path cannot be established without changing or discarding the indicated sustain. Source review is required.
- **1046 — Can You Count the Stars in Heaven?:** Split treble/bass parts. Below-staff secondary-RH slurs start before a principal-voice endpoint at the next beat (first at measure 4). XML stores the complete first voice before backing up to the second; document-order pairing misses the start. Pair chronologically and remove the complete accompaniment pair.
- **1047 — He Cares for Me:** Split treble/bass parts. A below-staff slur starts on secondary RH Bb3 and ends on the lower G3 anchor of a principal G3/Eb4 chord at ordinal measure 18 (source number 15, following X pickup measures). Keep the selected upper RH tone and discard the complete accompaniment slur.
- **1060 — Build an Ark:** Split treble/bass parts. At measure 15 the lower RH F4-to-E4 slur shares its endpoint chord with the tied G4 melody. Pair and remove only the accompaniment slur; the selected G4 tie remains byte-for-byte equivalent to its source markers.
- **1063 — Peace, Peace, Be Still:** Split treble/bass parts. At measure 18 the lower slur numbered 2 reaches the lower D4 anchor of a D4/A4 chord; the principal over-slur numbered 1 is retained. Chronological whole-pair ownership separates them.
- **1065 — Isaiah Said:** Split treble/bass parts. RH instrumental phrases hand off into and out of the principal voice in measures 10–12. Consecutive source rests define the handoff window; original rest events fill genuine silent tails. Same-number simultaneous upper/lower slurs are paired within their voice, with cross-voice endpoints accepted only when unique. The single-lane projector must check coverage in onset order rather than voice/document order.
- **1067 — It’s Joyful to Live the Gospel:** Split treble/bass parts. A lower RH accompaniment slur begins beneath the sustained sung G4 in measure 23 and ends on the principal A4 in measure 24. Its complete below-staff pair is removed; the sung sustain and principal continuation are retained.
- **1206 — Were You There?:** Split treble/bass parts. Ending 1,2 begins at measure 21; endings 3 and 4 begin at measures 22 and 27. Their Eb4 tie stops refer to the common measure 20 tie start, not the preceding ending in document order. Accept only explicit consecutive ending branches with a forced common-predecessor pitch. Preserve every original tie and ending marker; source slur continuations keep their within-note order.

## Generalized implementation

- Preserve the prior successful path first. The extended refinement runs only after Phase 3 RH extraction rejects a bundled HHC score. Collection membership comes from the bundled catalog; no individual song/title rule exists. Local imports and other collections retain their previous extraction policy.
- Use a single separate vocal lane only for fully verified RH lyric alignment. Every lyric onset must match exactly one RH voice by source time, bounded duration and pitch intersection; melody notes still come exclusively from the piano RH.
- Ignore only unprinted, zero-time grace REST spacers with no pitch, lyrics, ties or annotations. Actual grace notes stay guarded.
- Permit a unique RH instrumental line to tile a consecutive principal-rest window using whole original note/rest events. Competing lines, truncated notes, or fabricated rests are rejected.
- Recognize stepwise, lyric-anchored principal cue phrases with bounded entry/exit, and complete lyrical cue phrases explicitly written in repeat endings.
- Pair RH slurs chronologically, preserve within-note continuation order, and resolve equal slur numbers within their source voice. A cross-voice endpoint requires a unique open pair. Discard complete, proven below-staff accompaniment pairs; retain complete melody pairs and reject uncertain ownership.
- Validate later-ending tie stops against a forced, same-pitch tie start in the explicit common predecessor. Never insert or remove tie markers.
- Check projected single-lane coverage in musical onset order so verified voice handoffs survive XML voice-order storage.

## Remaining unsupported HHC songs

- **1021 / hhc-1021 — I Know That My Savior Loves Me:** `rh-ties`, `No continuous pitched tie path at measure 29`. Visual and playback tie markers disagree at a verse-dependent cue note. Choosing an interpretation would require musical/source review.
- **1039 / hhc-1039 — Because:** `rh-ties`, `No continuous pitched tie path at measure 2`. The introduction’s indicated tie sustain has no fully encoded monophonic continuation. Do not invent a stop, delete a start, or switch to LH to force success.

## Validation

- All 666 structured songs re-audited. All **569 baseline successful musical XML outputs are byte-for-byte identical**, including the original 245 and the 324 added in Phase 3. No pre-existing successful melody pitches changed.
- Every newly supported event independently matches a source RH part/staff/voice/onset/pitch/duration. Every selected tie matches its source. Source lyrics, harmony counts, tempo maps, measure lengths, meters, repeats and endings are checked. HHC 1035 retains 56 events, 20 measures and 34 harmonies.
- All nine new songs rendered at **820×1180, 768×1024 and 1440×1000**: 27 checks, zero lyric collisions and zero document horizontal overflow. All nine 820px images were inspected, plus mini/desktop spot checks. These are browser viewport checks, not physical-device certification.
- Melody pages range from one to three. HHC 1047 at 768px uses three pages versus two in full-score view; its three-verse layout was inspected and remains readable without clipping. No pagination/layout code was changed.
- All nine pass direct Original PDF → Melody, +2 semitone committed key change, playback timeline comparison, actual MusicXML download equality/validity, and Original → Melody key restoration. No engraving-only harmony anchors leak into exports.
- Playback retains its existing **written-order** repeat policy. Source repeat/endings are preserved for rendering/export; this task does not add repeat-aware playback traversal.
- Unresolved 1021/1039 and deferred `cs-12` remain disabled. No application runtime errors in the new UI checks.

| New song | Melody events | Harmony events | Pages: iPad / mini / desktop |
|---|---:|---:|---|
| 1018 — Come, Lord Jesus | 65 | 34 | 2 / 2 / 1 |
| 1030 — Close as a Quiet Prayer | 115 | 58 | 2 / 2 / 2 |
| 1046 — Can You Count the Stars in Heaven? | 70 | 30 | 2 / 2 / 1 |
| 1047 — He Cares for Me | 57 | 33 | 2 / 3 / 1 |
| 1060 — Build an Ark | 130 | 66 | 2 / 3 / 2 |
| 1063 — Peace, Peace, Be Still | 53 | 24 | 1 / 2 / 1 |
| 1065 — Isaiah Said | 54 | 28 | 1 / 1 / 1 |
| 1067 — It’s Joyful to Live the Gospel | 85 | 37 | 2 / 2 / 1 |
| 1206 — Were You There? | 70 | 42 | 2 / 3 / 2 |

## Tests run

All passed:

- `tests/melody-phase3b.mjs` — full baseline/source-provenance audit; `PHASE3B_RENDER=1` for 27 render checks.
- `tests/right-hand-refinements.mjs` — synthetic positive/negative cases for slur ownership, competing handoffs, real grace notes versus spacers, alternate-ending and dangling ties.
- `tests/right-hand-melody.mjs` — existing domain, chord continuity, lyricless notes and ambiguity guards.
- `tests/lead-hhc1035.mjs` and `tests/lead-hhc1035-polish.mjs`.
- `tests/lead-audit.mjs` — fresh baseline, post-change audit, then `WRITE_INDEX=1 WRITE_REPORT=1` only after extractor/visual validation.
- `tests/melody-coverage.mjs` — full index consistency and ten representative old supported songs; `COVERAGE_REPORT=reports/melody-phase3b-final-index.json`.
- `tests/melody-phase3b-ui.mjs` — all nine new songs and three guarded fallback cases.
- `tests/pdf-first-capabilities.mjs`, `tests/score-view-menu-state.mjs`, `tests/score-export.mjs` — targeted 820px checks.

All local browser runs used `TEST_URL=http://127.0.0.1:8780/` and the bundled Playwright runtime. No unrelated full app or music-engine/chord suite was run.

## Changed files and release

- Extractor: `right-hand-melody.js`, `lead-view.js`.
- New tests: `tests/right-hand-refinements.mjs`, `tests/melody-phase3b.mjs`, `tests/melody-phase3b-ui.mjs`.
- Generated availability and cache: `lead-availability.js`, `sw.js` (v152).
- Reports: this file, `reports/melody-phase3b.json`, `reports/melody-phase3b-final-index.json`, regenerated `reports/lead-catalog.md`.

Extractor/tests are committed separately from metadata/reports. The baseline and extractor commit IDs are recorded above; the metadata commit is the commit containing this report. Deployment status is verified and reported in the chat after pushing both commits.

Local screenshots are reproducible with the render test and saved as `test-results/phase3b-hhc-N-WIDTH.png`. Detailed 666-song comparisons and 27 render metrics are in `reports/melody-phase3b.json`; full catalog/index diagnostics are in `reports/melody-phase3b-final-index.json`.
