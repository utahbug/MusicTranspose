# Melody Phase 4B: preserve RH music through annotation reductions

Baseline: `080bc457c1810ea428d92bc79a7c9d68f38dd6ac`. Extractor/tests commit: `15898df9fef5dcd3bc0625dfd9bd5a7a69c70ef3`.

**All 26 former `rh-annotations` cases now succeed. Support rises from 593/666 to 619/666. All previous 593 musical XML AND engraving XML outputs remain byte-for-byte identical.** The other 47 failures retain their classifications. A Child’s Prayer remains `rh-competing` and unavailable. No source MXL changes or title-specific extraction exceptions.

## Coverage

| Collection | Structured | Before | After | Gain |
|---|---:|---:|---:|---:|
| Children’s Songbook | 250 | 223 | 229 | 6 |
| Hymns (1985) | 335 | 289 | 309 | 20 |
| Hymns for Home and Church | 81 | 81 | 81 | 0 |
| Overall | 666 | 593 | 619 | 26 |

Remaining `rh-annotations`: **26 → 0**.

## Source findings

Every rejection in this class came from slur bookkeeping after single-note reduction, not from fingering numbers or unsafe actual RH pitches/rhythm. Baseline failure patterns:

- unmatched endpoint: 15 songs.
- unclosed selected slur: 3 songs.
- overlapping number: 8 songs.

The reduction was losing endpoints on inner/chord RH notes or conflating slur numbers used in different voices. Retaining the complete piano treble texture preserves almost every slur naturally. All source RH ties in these 26 scores remain intact; none needed repair or removal.

## Generalized behavior

- Extend the Phase 4A full-RH fallback only when the existing extractor returns `rh-annotations`. Earlier successes remain first; other failure classes are not broadened. Existing unique-domain, independent-lyric and structural guards remain.
- Keep every source event in the established piano RH staff: principal notes, normal/cue alternatives, introductions/interludes, connecting runs, overlapping voices, rests and chord tones. Do not select a highest pitch or force monophony. Preserve original lyrics, pitch, onset, duration, voice and chord membership; record source proof for every retained event.
- Pair slurs in musical time. Prefer a unique open chain in the same RH voice; allow a unique cross-voice endpoint. Same-number slurs in different voices can coexist. Drop orphan or ambiguous slur metadata without changing notes. Source system-break continuation anchors are disposable layout metadata; keep their valid start/end pairs for reflow.
- Preserve note accidentals, ties, fermatas, articulations and other useful RH notation. Fingerings are copied with retained notes; they were not the failure cause and require no special preservation logic or rejection gate. Nonessential position coordinates continue to receive the existing projection cleanup.
- Keep semantic direction/harmony/sound events at their exact source timestamps, including rit., a tempo, dynamics and other passage markings placed near the bass staff. Vertical placement is not used to discard them. Repeats/endings are preserved.
- Exclude LH notes and separate optional-descant notes. As in Phase 4A, retain global tempo from an optional part when needed, while excluding its part-specific directions. The Hearts of the Children keeps the piano P2/staff 1 texture and global tempo, not the optional P1 obbligato.

### Exact annotation changes

Across the 26 new scores, **476 RH slur elements → 470 retained**:

- Angels We Have Heard on High: omit four source line-break `continue` anchors (two each at zero-based measure indices 14 and 17). Keep all actual slur start/end pairs and the full Gloria figure.
- The Hearts of the Children: omit two RH slur stops at zero-based measure indices 0 and 20. Their starts belong to the removed bass staff, so retaining the stops would leave orphan slurs. All RH notes remain.
- The other 24 scores retain every RH slur element.

No tie markers are changed by Phase 4B. All original RH fingerings, fermatas and articulations survive. Cue-sized material uses the previously established Phase 4A sound/size handling.

## Scoped engraving support

Visual checks exposed two issues specific to the new fuller textures. I Will Follow God’s Plan needed the existing RH rhythmic-spacing profile to avoid a lyric boundary collision. Lead, Kindly Light contains sparse secondary voices whose time gaps were not given visible-voice entries by OSMD, causing wrong horizontal placement despite correct musical timestamps.

For these new annotation-fallback scores, projection preserves source voice order and explicit voice-owned forward gaps. `leadEngravingXML` converts those gaps to invisible rest anchors **only in disposable engraving XML**. They never enter committed musical XML, downloads or playback. Source note timing and resulting playable timelines are independently checked. `app.js` routes only the newly flagged RH texture through the existing RH screen/print spacing profile. No spacing-profile constants, page planning, tap zones, navigation or existing score behavior were changed.

The final full audit also confirms all 593 previously supported engraving XML outputs remain identical, protecting Phase 4A cue reductions and HHC.

## All 26 outcomes

Counts include source rests; chord tones count notes carrying `<chord>`. All rows below are supported.

| Song | Collection/page | RH events | Chord tones | RH slurs before/after |
|---|---|---:|---:|---:|
| I Will Follow God’s Plan | Children’s Songbook / 164 | 158 | 12 | 8 / 8 |
| Come, Sing to the Lord | Hymns (1985) / 10 | 90 | 20 | 20 / 20 |
| Now We’ll Sing with One Accord | Hymns (1985) / 25 | 120 | 39 | 4 / 4 |
| Joseph Smith’s First Prayer | Hymns (1985) / 26 | 128 | 47 | 6 / 6 |
| The Happy Day at Last Has Come | Hymns (1985) / 32 | 91 | 32 | 40 / 40 |
| Beautiful Zion, Built Above | Hymns (1985) / 44 | 153 | 63 | 32 / 32 |
| Glorious Things Are Sung of Zion | Hymns (1985) / 48 | 143 | 36 | 4 / 4 |
| On This Day of Joy and Gladness | Hymns (1985) / 64 | 160 | 55 | 74 / 74 |
| Glory to God on High | Hymns (1985) / 67 | 81 | 35 | 8 / 8 |
| For All the Saints | Hymns (1985) / 82 | 93 | 29 | 16 / 16 |
| The Lord Is My Light | Hymns (1985) / 89 | 164 | 57 | 10 / 10 |
| Lead, Kindly Light | Hymns (1985) / 97 | 112 | 43 | 28 / 28 |
| How Long, O Lord Most Holy and True | Hymns (1985) / 126 | 81 | 27 | 24 / 24 |
| In Humility, Our Savior | Hymns (1985) / 172 | 148 | 53 | 52 / 52 |
| Christ the Lord Is Risen Today | Hymns (1985) / 200 | 136 | 33 | 34 / 34 |
| Joy to the World | Hymns (1985) / 201 | 116 | 54 | 10 / 10 |
| Angels We Have Heard on High | Hymns (1985) / 203 | 149 | 33 | 16 / 12 |
| Far, Far Away on Judea’s Plains | Hymns (1985) / 212 | 111 | 42 | 8 / 8 |
| The First Noel | Hymns (1985) / 213 | 131 | 40 | 32 / 32 |
| Who’s on the Lord’s Side? | Hymns (1985) / 260 | 168 | 65 | 8 / 8 |
| Ye Elders of Israel | Hymns (1985) / 319 | 144 | 48 | 16 / 16 |
| He Died That We Might Live Again | Children’s Songbook / 65 | 131 | 14 | 14 / 14 |
| The Hearts of the Children | Children’s Songbook / 92 | 83 | 23 | 2 / 0 |
| The Thirteenth Article of Faith | Children’s Songbook / 132 | 128 | 12 | 2 / 2 |
| I Will Be Valiant | Children’s Songbook / 162 | 174 | 78 | 4 / 4 |
| Pioneer Children Sang As They Walked | Children’s Songbook / 214 | 90 | 3 | 4 / 4 |

## Validation

- `node tests/melody-phase4b.mjs`: all 26 targeted scores plus protected A Child’s Prayer; independent source-event and annotation comparisons, global expression/harmony timestamps, repeats/endings, complete RH playback timing and +2-semitone transformed XML. RH cue/chord/voice material remains intact and no LH pitches are introduced.
- `PHASE4B_FULL=1 node tests/melody-phase4b.mjs`: final full 666-score audit; exactly 26 additions and all 593 prior musical/engraving outputs identical. An earlier full audit was repeated only after the visual checks required a meaningful projection/engraving fix. No further catalog scans were used for report or metadata generation.
- `node tests/rh-annotations.mjs`: five small synthetic cases covering same-number slurs in different voices, unique cross-voice endpoints, orphan stops/starts, ambiguous duplicate starts and source layout continuations. All confirm annotation cleanup leaves note proof, musical events and fingerings unchanged.
- `node tests/melody-phase4b-ui.mjs`: iPad portrait 820×1180 for I Will Follow God’s Plan, Joseph Smith’s First Prayer, Angels We Have Heard on High, Far, Far Away on Judea’s Plains, The First Noel and Lead, Kindly Light. Desktop 1440×1000 for I Will Follow God’s Plan. All open directly through enabled Melody, render, use the displayed XML as playback source, and show no measured lyric-to-lyric overlap, horizontal overflow or page runtime errors. All seven final screenshots visually reviewed. These are browser viewport checks, not physical-device certification.
- One actual MusicXML download for I Will Follow God’s Plan matches `prototype.viewXML` exactly. One print-preparation check produces two pages and retains rit./a tempo; no disposable RH gap anchors leak into musical XML.
- Generated `bundledLeadIds` and `supportsLead` exactly match all 619 current successful audit rows in catalog order. No IDs hand-edited; reports and availability reuse the completed final audit.
- `git diff --check` passed. No unrelated Library, annotation UI, full playback synthesis/export, pagination or broad viewport suites.

Durable results: `reports/melody-phase4b.json`. Screenshots and the representative XML download are in ignored `test-results/phase4b-*`.

## Files and commits

Commit A: `app.js` (new RH layout flag only), `lead-view.js`, `right-hand-melody.js`, `lead-spacing.js`, `tests/melody-phase4b.mjs`, `tests/melody-phase4b-ui.mjs`, `tests/rh-annotations.mjs`.

Commit B: generated `lead-availability.js`, `reports/lead-catalog.md`, this report, `reports/melody-phase4b.json`, `sw.js` (cache v157).

A Child’s Prayer, toolbar, Settings, metronome, Lyrics UI, Library, annotation UI, tap zones, page navigation and pagination logic are unchanged. No title-specific exceptions were added.
