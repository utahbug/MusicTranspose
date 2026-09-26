# Lead layout and shared structured-score margins

## Scope and implementation

Existing utahbug/MusicTranspose repository, codex/pages branch. Lead extraction and the 34-song availability index are unchanged. music.js, chord-symbol.js, lead-view.js, playback.js, Lyrics, Library and PDF rendering were not changed.

All screen MXL modes (Most music, Normal, Lead) now share 0.6 engraving-unit horizontal insets, with 10px score-paper inner gutters on larger layouts and 5px on phones. These remain inside the existing responsive frame and safe-area geometry. Staff bounds track the title's first letter and Lyrics control's right edge, leaving roughly 4-5px of internal clearance. PDF margins are excluded explicitly. Existing notation zoom policies are retained; reclaimed width feeds measure reflow.

Lead alone uses minimum system distance 3 instead of 7, skyline-to-bottom clearance 2.5 instead of 5, and moderate note-spacing settings (VexFlow addend 2, multiplier 0.75, minimum note distance 1.7). Font sizes and Lead zoom are unchanged. Native lyric/chord-aware minimum widths still govern wrapping. No fixed measure count is imposed.

The extraction already removed system/staff layout instructions and accompaniment. The remaining wasted space came from general engraving rules, not hidden bass staves. Skyline-based layout still reserves room for lyrics, chords, expressions and endings. The shared engraver restores every Lead-specific rule when returning to Score; normal vertical engraving remains unchanged.

Sparse final Lead systems are balanced using actual lyric/chord-aware measure widths. The last pair is redistributed only when its imbalance improves, and the original wrap is restored if the change would introduce another system. This works in screen and print layouts. It neither edits musical XML nor imposes title-specific rules.

## Measured margins

Representative song: When I Am Baptized. Values are viewport CSS pixels, measured from actual staff-line paths. Normal view:

| Viewport | Staff left/right before | Staff left/right after | Title/Lyrics target after | Usable staff-width gain |
| --- | --- | --- | --- | --- |
| 390x844 phone | 21.2 / 368.8 | 17.7 / 372.3 | 13 / 377 | 7px |
| 820x1180 tablet | 65 / 755 | 28.7 / 791.3 | 24 / 796 | 72.6px |
| 1440x1000 desktop | 219 / 1221 | 167.4 / 1272.6 | 162 / 1278 | 103.2px |

Most music's phone left inset also shrank: at 390px, staff left moved from 30.4px to 16.8px, retaining the selected notation scale. All three modes passed staff/header alignment checks at 320, 390, 844, 820 and 1440px widths.

## Lead density and performance

390x844 portrait, continuous-layout measurements (system totals are for the whole song):

| Song | Full Score systems | Previous Lead systems | New Lead systems | Approximate complete systems visible, Score / Lead |
| --- | --- | --- | --- | --- |
| When I Am Baptized | 14 | 14 | 10 | 3 / 5 |
| I Want to Be a Missionary Now | 11 | 12 | 11 | 3 / 4 |
| The Priesthood Is Restored | 7 | 7 | 6 | 3 / 5 |
| Rain Is Falling All Around | 4 | 5 | 4 | 3 / 4 |

Measured Lead inter-system ink gaps dropped from approximately 36-40px to 15-17px. Melody-only systems also have less ink height than the two-staff score. When I Am Baptized at 390px uses about 1,397px of music height versus about 3,104px for full Score and 2,184px for the previous Lead. New Lead averages 2 measures per system versus about 1.4 previously. Dense three-verse songs do not consistently gain measures per line; their improvement comes primarily from removing excessive vertical gaps.

Actual Page Turns mode (When I Am Baptized):

| Viewport | Normal pages after | Most music pages before / after shared margins | Lead pages after |
| --- | --- | --- | --- |
| 320x568 | 12 | 8 / 8 | 7 |
| 390x844 | 6 | 4 / 4 | 3 |
| 844x390 landscape | 5 | 5 / 4 | 4 |
| 820x1180 tablet | 2 | 2 / 1 | 1 |
| 1440x1000 desktop | 2 | 1 / 1 | 1 |

Repacking the captured pre-change Lead system bounds into the same measured viewport allowance gives approximately 8 to 7 pages at 320px, 4 to 3 at 390px, and 5 to 4 in landscape. Page Turns deliberately reserves more clearance than continuous scrolling; its first 390px Lead page contains four complete systems versus three in Normal. Gains vary with lyrics, signatures and viewport height. We do not squeeze every song merely to lower a page count.

## Printing

Lead print uses the same compact spacing and tail balancing, with 2-unit horizontal and 3-unit vertical engine margins inside the existing A4 print margins. Its notation zoom remains 0.8. A disposable print XML copy gets the catalog title so missing source titles do not print as Untitled Score.

Generated and visually checked actual PDF pages with Poppler:

- When I Am Baptized: full Score 2 music pages; Lead 1 music page.
- I Want to Be a Missionary Now: full Score 2 music pages; Lead 1 music page.

Existing credits pages remain separate and are not counted as music pages. Full Score print rules and PDF-source print margins are unchanged.

## Validation and limits

Passed targeted scripts:

- tests/lead-layout.mjs: four named songs; five responsive layouts; Score/Lead/Score restoration; before/after geometry and screenshots.
- tests/lead-layout-audit.mjs: all 34 existing Leads, with no added clipping/lyric-overlap flags compared with the original profile; targeted key changes, octave, Reset and playback. Includes multiple verses, dense lyrics, optional and slash chords, pickups, repeats/endings and several meters.
- tests/mxl-horizontal.mjs: Most music/Normal/Lead bounds, overflow and actual page counts at all five sizes.
- tests/lead-print-layout.mjs: four print PDFs and music-page counts.
- tests/octave-hands.mjs: independent hands, Lead octave state, key changes, Reset, Lyrics return, PDF fallback and offline restart.
- tests/metronome.mjs: visual timing and layout, navigation, Lead/Lyrics/PDF and offline smoke.
- tests/song-transition.mjs: stale-render protection, repeated selections, key state, tap navigation and Library/List context.

Two parallel browser runs timed out during startup; both passed when rerun sequentially against the same static server. Production files are served directly by serve.py; there is no separate compilation step. No full music-engine or 7,288-case chord suite was run. Responsive checks use browser viewport emulation, not physical devices.

Known pre-existing limits: the lyric bounding-box audit still finds three overlaps in I Want to Be a Missionary Now and four in Book of Mormon Stories, matching the old layout. They were not introduced or increased by this change. Dense multi-verse passages were not compressed further. Some pickup/final measures must remain short when their adjacent dense measure cannot fit safely. Short landscape viewports may fit only one complete system.

## Files changed

- app.js
- lead-layout.js
- styles.css
- sw.js (v110; offline precache includes lead-layout.js)
- tests/lead-layout.mjs
- tests/lead-layout-audit.mjs
- tests/mxl-horizontal.mjs
- tests/lead-print-layout.mjs
- reports/lead-layout-optimization.md
