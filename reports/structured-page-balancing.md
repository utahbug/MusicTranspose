# Structured score page balancing

Baseline: b477c73 (existing codex/pages deployment). Measurements: CSS pixels in Chromium/Edge, settled fonts/engraving. These are browser measurements, not a new physical-iPhone validation.

## Diagnosis and implementation

- The existing planner already used dynamic programming, not greedy first-fit. It minimizes page count and balances remaining height, but its fixed inter-system gaps could force another page near a fit threshold.
- Actual rendered ink bounds already include lyrics, directions, chords and all full-score staves. No stale or removed-staff reservation was found in these cases. Lead retains its own compact geometry.
- Screen capacity still deducts actual header/footer plus the existing 32px clearance. At 402x650, Redeemer has about 475.8px available and 376px width. Those reservations and horizontal margins are unchanged.
- The planner now permits only enough blank-gap reduction to remove a page, bounded at 12px for full scores and 8px for Lead (existing smaller gaps stay smaller). Natural gap caps remain 24px/14px. It minimizes pages, then total gap reduction, then squared unused height. Complete systems stay intact and in order. Indivisible oversized-system handling remains unchanged.
- Engraving assessment deliberately retains the fixed-gap default: notation scale, horizontal distribution, system ink bounds, inter-staff spacing and musical XML remain unchanged. Only the final page grouping and blank inter-system gaps change.
- Printing unnecessarily forced all credits to a separate page. Credits now flow after the final score page with 10px clearance and remain together where possible; they move to another page when they do not fit.

## Demonstrated screen improvements

All rows below use identical source XML, notation scale, width and measured system heights before/after. PDF is a fixed paper reference, not a phone page-count target.

| Song | CSS viewport | Mode | PDF pages | MXL pages | Systems/page before -> after | Unused px/page before -> after |
|---|---|---|---:|---|---|---|
| Now Let Us Rejoice | 402x844 | Normal | 2 | 6 -> 5 | [3, 2, 3, 3, 2, 2] -> [3, 3, 3, 3, 3] | [44, 218, 19, 70, 220, 211] -> [44, 7, 14, 27, 0] |
| When I Am Baptized | 402x844 | Normal | 1 | 5 -> 4 | [2, 2, 2, 2, 2] -> [3, 2, 3, 2] | [274, 266, 207, 247, 203] -> [81, 216, 0, 203] |
| Now Let Us Rejoice | 402x700 | Most music | 2 | 6 -> 5 | [2, 1, 2, 2, 2, 2] -> [2, 2, 2, 3, 2] | [185, 336, 171, 175, 166, 150] -> [185, 169, 152, 0, 150] |
| I Want to Be a Missionary Now | 402x568 | Most music | 1 | 5 -> 4 | [2, 1, 1, 2, 2] -> [2, 2, 2, 2] | [45, 227, 189, 35, 24] -> [45, 0, 35, 24] |
| I Want to Be a Missionary Now | 402x650 | Lead | 1 | 5 -> 4 | [2, 2, 2, 2, 2] -> [2, 3, 2, 3] | [128, 171, 135, 173, 210] -> [128, 0, 144, 55] |
| I Believe in Christ | 402x650 | Lead | 2 | 8 -> 7 | [3, 2, 3, 2, 2, 2, 2, 2] -> [3, 2, 3, 3, 2, 3, 2] | [6, 155, 4, 161, 154, 161, 164, 150] -> [6, 155, 4, 0, 161, 0, 150] |

## Primary cases and limits

These rows are unchanged before/after. No claim that the physical-device density issue is eliminated.

| Song | CSS viewport | Most music | Normal | Lead | Original PDF |
|---|---|---:|---:|---:|---:|
| Redeemer of Israel | 402x650 | 3 | 5 | 5 | 1 |
| Redeemer of Israel | 820x1180 | 1 | 1 | 1 | 1 |
| Redeemer of Israel | 1440x1000 | 1 | 2 | 1 | 1 |
| Now Let Us Rejoice | 402x650 | 6 | 8 | 7 | 2 |
| Now Let Us Rejoice | 820x1180 | 2 | 2 | 2 | 2 |
| Now Let Us Rejoice | 1440x1000 | 2 | 2 | 1 | 2 |

At 402x650 Normal, Redeemer systems are approximately 247, 228, 225, 223, 224, 240 and 269px tall. The first pair already occupies about 475px before any safe gap; the final pair needs about 509px before any gap. Five pages therefore remain appropriate under the unchanged size and complete-system constraints. Narrow width and multiple lyric verses are real space costs.

The 78-case matrix covers all six songs at 402x650, 820x1180 and 1440x1000 in all modes, plus full-score modes at 402x844 and 1180x820. No page count increased. All system geometry/size/profile/width comparisons were identical. Four matrix cases improved; two further Most music boundary cases were verified by the six-case direct comparison above. Silent Night and already efficient tablet examples remain unchanged. Detailed counts, heights, measures and unused space are in structured-page-balancing-results.json.

## Print verification

| Song | Mode | Score pages before/after | Exported pages including credits before -> after |
|---|---|---:|---:|
| Redeemer of Israel | Normal | 1 / 1 | 2 -> 2 |
| Redeemer of Israel | Lead | 1 / 1 | 2 -> 2 |
| Now Let Us Rejoice | Normal | 2 / 2 | 3 -> 2 |
| Now Let Us Rejoice | Lead | 1 / 1 | 2 -> 2 |
| When I Am Baptized | Normal | 2 / 2 | 3 -> 2 |
| When I Am Baptized | Lead | 1 / 1 | 2 -> 1 |
| I Believe in Christ | Normal | 2 / 2 | 3 -> 2 |
| I Believe in Christ | Lead | 1 / 1 | 2 -> 2 |

Eight A4 browser exports passed complete-system coverage checks. PDF extraction retained the same non-whitespace character content (reading order changes when credits share a page). Visual inspection included compressed phone full-score/Lead pages, printed full-score/Lead pages with credits, and matching Redeemer/Rejoice reference PDFs. No source PDF was changed.

## Targeted tests

- system-pagination: existing cases and exhaustive small partitions with bounded gaps; minimal page count, system order, geometry and gap floors.
- full-score-policy; 78 density comparisons; adaptive-pages (six direct before/after XML and geometry comparisons).
- full-score-print and page-balance-print: eight real score/Lead exports, complete systems, print flow and hidden app header.
- octave-hands: RH/LH, key/reset, playback, Lead/PDF, responsive and offline.
- metronome: playback/time signatures/tempo/key/modes, responsive and offline.
- score-reliability smoke: all four tap zones, controls, PDF, Lyrics and offline.
- library-filters and home-screen: responsive menus, filtering, List order/return, guidance, installed state and offline.
- song-transition: stale render/fetch/Lyrics/PDF protection and Library/List context at phone portrait/landscape, tablet and desktop. Updated only obsolete test selectors from More/Favorites first to Filter/Favorites.
- No full chord/music-engine suite run. Static production app served directly; no bundler build step exists.

## Files

Production: system-pagination.js, virtual-pages.js, app.js, styles.css, sw.js (cache v120). Tests: system-pagination.mjs, adaptive-pages.mjs, page-balance-print.mjs, full-score-print.mjs, song-transition.mjs. Reports: this file and structured-page-balancing-results.json. Unrelated pre-existing diagnostic files are excluded from the commit.

Lead coverage remains 244; no extraction, Library, Filter, More, install, octave, metronome or Lyrics behavior changes.
