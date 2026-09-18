# Score density across phone, iPad and desktop

Starting commit: `1c10d99c0d7a707719ef8cb9856aa176e3f5756b`.

## Cause and correction

The size state and cache key were forced to Normal above the 600px phone
breakpoint. The UI was also hidden above that breakpoint. On phones OSMD Zoom
already participated in real reflow; it was not merely a CSS transform. On wider
screens the user's chosen density could not participate at all.

Inspection of the bundled OSMD 2.1.2 render implementation confirms that it sets
`sheet.pageWidth = container.offsetWidth / zoom / 10`, then recalculates the
GraphicalMusicSheet. Zoom is therefore a pre-layout input, not just a final SVG
magnification. The correction applies selected density at every MXL screen width,
keeping the real staging-container width and automatic system breaking. Explicit
XML system/page breaks remain disabled as before. No original MusicXML changes.

Normal keeps the previous baseline: OSMD Zoom .78 for phone/score containers
under 800px; .9 otherwise. Small multiplies that by .62/.78 (about .795); Large
multiplies it by .94/.78 (about 1.205). Thus phone/narrow baseline values remain
.62/.78/.94; wider baseline values are .7153846/.9/1.0846154. Internal margins
remain .8 OSMD units on phones and 5 on larger screens, unchanged.

At 1180px landscape, the actual score width is 1084px. Logical widths are about
1515 / 1204 / 999 SVG units for Small / Normal / Large (151.5 / 120.4 / 99.9 OSMD
units). At 820px portrait, the 768px score uses logical widths 1239 / 985 / 817
SVG units. OSMD produces new system breaks before outputting the full-width SVG;
there is no CSS transform or post-render density rescaling.

The existing icon, 44px touch target and three-option visual popover remain.
They now appear on all MXL layouts, not PDFs, and remain excluded from print.
No bottom-toolbar change or separate size UI was introduced.

## Measured acceptance case

“Give,” Said the Little Stream, original key. Virtual-page counts include source
credits/extra text pages. The first-system measure count comes from OSMD's actual
MusicSystems model, not pagination groups (which may merge touching systems).

| Viewport | Size | Systems | Measures in first system | Virtual pages |
| --- | --- | ---: | ---: | ---: |
| iPad landscape 1180×820 | Small | 4 | 6 | 3 |
| | Normal | 5 | 5 | 4 |
| | Large | 6 | 4 | 5 |
| iPad portrait 820×1180 | Small | 5 | 5 | 2 |
| | Normal | 6 | 4 | 3 |
| | Large | 9 | 3 | 4 |
| Phone 390×844 | Small | 11 | 2 | 5 |
| | Normal | 13 | 1 | 6 |
| | Large | 19 | 1 | 11 |
| Desktop 1440×1000 | Small | 4 | 6 | 3 |
| | Normal | 5 | 5 | 4 |
| | Large | 6 | 4 | 4 |

Landscape first-verse lyric extent ends at “As it” in Small, the second “said
the” in Normal, and the first complete “give, oh! give” response in Large.
Portrait Small reaches the second “said the”; Normal completes the first response;
Large reaches its first half. Phone Small fits the opening through “little
stream”; Normal and Large each fit one opening measure, while their subsequent
system boundaries and total counts still differ. A measure cannot be split to
force a difference in every individual system.

Additional total system counts (Small / Normal / Large):

| Score | Landscape | Portrait | Phone |
| --- | --- | --- | --- |
| The Nativity Song | 3 / 4 / 5 | 3 / 5 / 6 | 7 / 11 / 14 |
| Follow the Prophet | 5 / 6 / 7 | 6 / 8 / 12 | 14 / 17 / 17 |
| Oh, Come, All Ye Faithful | 3 / 4 / 5 | 4 / 5 / 7 | 8 / 13 / 19 |
| The Shepherd's Carol | 2 / 2 / 3 | 2 / 3 / 4 | 6 / 8 / 8 |
| Come, Thou Fount of Every Blessing | 4 / 5 / 6 | 5 / 6 / 9 | 12 / 15 / 17 |

The complete measurements and screenshots are generated under ignored
`test-results/` by `tests/engraving-density.mjs`. Test-only response instrumentation
captures per-render OSMD model data in cached entries too; reading the current
mutable OSMD instance after a cache hit would report the wrong prior layout.

## State, navigation and safety

Cache identity retains actual container width, key shift, octave and the actual
selected density on every layout. Logical width is derived from these inputs.
The chosen density survives key/octave changes and resizing. Reopening a song
starts Normal; musical Reset preserves the current screen density.

Every new engraving publishes fresh complete-system bounds to virtual pages.
Repagination retains the page containing the prior source-measure anchor. In
Continuous mode, size changes remember the first visible system's source measure
and screen offset, then restore the corresponding new system after engraving.
Near the end of a shortened score, normal browser scroll bounds still apply.
Auto-scroll remains paused by user interaction/rendering as before.

Dedicated A4 print markup/geometry is unchanged across density choices (ignoring
renderer-generated element IDs). PDF behavior and score sources are untouched.
The existing over-height virtual-page safety fit still prevents cropping; this
can constrain apparent size in a very short viewport, but does not replace the
new underlying system reflow.

Tests cover six representative scores × three sizes × four viewports, system
counts/boundaries, source XML invariance, no horizontal overflow, cache round trips,
key/octave/Reset, virtual and Continuous reading position, print, temporary state
and accessible controls. The full current regression suite additionally covers
all 119 structured scores, PDFs, tap/pedal navigation, Library/list storage,
identity/future-edition data, playback, Lyrics/Fun, key guidance and offline use.
Baseline fixtures and repeat builds confirm all 121 original assets and the
119-score frozen fingerprint baseline are unchanged. Physical iPad Safari and
piano-side readability remain user-device acceptance checks.

Changed implementation: app.js, styles.css, virtual-pages.js, sw.js (cache v43).
Tests: engraving-density.mjs, score-density.mjs, size-selector.mjs and suite runner.
Documentation: this report and README.md.

Validation outcome: all 28 current browser suites passed, including isolated
reruns of the density reading-position fixture and a Library row-actions startup
timeout. The initial aggregate run passed 26 suites; the density fixture was
corrected to account for browser end-of-document clamping and additionally tests
an interior location in Follow the Prophet. Seven fingerprint tests and the
complete baseline/source-hash audit passed. No source-score files were changed.
