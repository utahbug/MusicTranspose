# Opening-content regression: diagnosis and correction

Starting commit: 82382a43e9fc916f3f9f952f34e90c28ea731763.

## Cause and stage

Original MXL data is intact. The regression was introduced by opening-metadata promotion: removing the words/metronome and their direction-type wrappers could leave a direction containing only sound/staff. MusicXML requires a direction-type in a direction. The bundled OSMD InstrumentReader takes the first direction-type and passes it to its repetition/expression reader; the empty wrapper interrupts reading subsequent opening events. This occurs during raw OSMD loading/engraving, before MusicTranspose framing, trimming or virtual pagination. Merely checking that source measure 0 belongs to the first graphical system did not detect that its contents were missing.

The repeatable catalog audit renders original source, the broken implementation from 82382a4, and the corrected display copy at the same width/density. It records first source measure index/number, implicit flag, first pitch/rest event, first lyric/verse, first harmony, rendered note-group counts, first-measure note groups, systems, first-measure mapping and first-lyric presence. 93 of 119 scores exhibited loss under the broken implementation: 34 flagged implicit by their XML and 59 not flagged implicit. This is not a pickup-only bug. The implicit flag is recorded as source metadata, not treated as proof that every such measure is an anacrusis.

## Small systemic fix

Track only directions changed by metadata promotion. If promotion empties all direction-type children, move any sound child into its legal measure-level position and remove that invalid direction wrapper from the display copy. Partially populated directions remain. No missing words or notes are inserted. No source MXL, transposition, octave, playback, print, OSMD vendor or cropping code changed. The compact opening metadata subtitle remains.

Original and transposed XML used by playback/printing remain intact; the correction applies only to screen engraving XML. The service worker advances to v48.

## Stage comparison

A: Original XML contains the opening notes, rests, lyrics/verse numbering and harmonies.
B: Original-source raw OSMD shows them. Broken display-copy raw OSMD loses content. Corrected display-copy raw OSMD restores it, matching original-source counts.
C: Continuous view preserves the restored opening note and lyric bounds after screen trim.
D: Virtual pages preserve the restored content; the first lyric is checked on its actual page when an instrumental opening spans the first page at Large density.
E/F/G: Small, Normal and Large preserve the opening content, with expected line/page redistribution.
H/I: Original and +1-semitone layout cases pass; the full catalog import regression additionally covers +1/-1 semitone and exact musical Reset.

## Representative raw note-group counts

| Song | Original source | Broken display | Corrected display |
|---|---:|---:|---:|
| Give, Said the Little Stream | 136 | 133 | 136 |
| Amazing Grace | 103 | 101 | 103 |
| The Nativity Song | 131 | 126 | 131 |
| Oh, Come, All Ye Faithful | 157 | 156 | 157 |
| Follow the Prophet | 144 | 142 | 144 |
| The Shepherd's Carol (unaffected control) | 70 | 70 | 70 |
| A Child's Prayer (unaffected control) | 308 | 308 | 308 |

Give now visibly begins with the proper opening chord, fingering, D harmony and all three Give lyric lines. Amazing Grace regains A / The / Through. Nativity's opening accompaniment and harmony are restored. The catalog audit finds zero remaining count/mapping/first-lyric discrepancies versus original-source rendering across all 119 scores.

## Framing audit and visual checks

trimScreenMargin still uses the rendered ink bounding box and the existing 8-unit safety inset. The SVG negative top margin and overflow-hidden container do not cause this regression: loss was reproduced with neither applied. The 336 layout checks explicitly confirm the first note and first lyric lie within the visible SVG/container boundaries, including left/right edges, under Continuous and page views. Virtual capture already expands system bounds using paths, text and other visible primitives; no change to its viewBox construction or safety margins is needed for this defect. No large blank margin was restored.

Seven representative songs were checked at 390x844, 820x1180, 1180x820 and 1440x1000, in three densities, two keys and two modes. Screenshots were inspected for phone, iPad portrait/landscape and desktop. Physical iOS hardware was not used. Full data: opening-content-audit.json and opening-content-layout-checks.json.

## Print and separate issues

The separate print engraver remains unchanged. PDF/structured print regression passes with the existing generated-ID normalization. Printed opening markings remain correct. The previously reported Throughmany lyric-spacing collision is still visible in Amazing Grace and is explicitly outside this correction; it is not the same missing-content cause.

The virtual-page test previously assumed Nativity always produced three pages at one viewport. Restored content changes legitimate pagination, so its expectations now use the actual count while retaining next/previous, drag and no-wrap checks.

Final local regressions: 30 of the 31 existing suites passed initially; the actual-page-count correction then passed its rerun. Both new opening-content suites passed, for 33 suites covered. All 119 structured scores render and pass transposition/reset/offline reload. The 336-case layout report has no failed bounds checks. Key chooser, instrument/ensemble guidance, octave, Auto-scroll, playback, Lyrics, Library, PDF and print checks passed.
