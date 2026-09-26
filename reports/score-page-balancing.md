# Structured score page/system balancing

Baseline: `fdfd2eae9b9b915f6f972e85ac5734f8723eee93`. Existing utahbug/MusicTranspose repository, branch `codex/pages`, clean at start.

## Causes and solution

The screen pager greedily retained all original inter-system gaps. Printing retained original OSMD A4 page boundaries. Neither balanced the final page. Most music estimated 14px more height than the actual pager because it omitted the Original-key inset. Lead already used accurate compact bounds; stale bass dimensions were not the cause.

The shared planner minimizes page count first, then squared unused height. It uses actual rendered ink bounds and moves only whole systems in order. Systems with overlapping ink remain indivisible. External gaps are capped at 24 display units for full scores and 14 for Lead; smaller natural gaps stay smaller. Internal staff/lyric spacing and horizontal engraving remain unchanged. Oversized indivisible systems retain the existing fit-to-height behavior.

Screen pages share a prepared SVG source canvas; turns do not engrave or fetch. Refresh/resize preserves the measure anchor while deliberate turns update it. Printing keeps independent A4 engraving at zoom 0.8, then uses the same planner across original SVG boundaries. The print key inset and separate credits page remain.

Most music now uses actual pager height and checks lyric size after existing fit-to-height scaling (minimum 12.5px), preserving collision and horizontal clipping checks. All 60 Normal/Lead cases retain their original zoom. One of 30 Most music cases chooses a smaller existing candidate: Ring Out, Wild Bells at 390px, 0.702 to 0.64, about 9% smaller with 12.8px lyrics.

## Measurements

90 screen cases: six structured songs, three views, five viewports (320x568, 390x844, 844x390, 820x1180, 1440x1000). Eight cases lose a music page; none gain pages. All systems remain present; no horizontal overflow. Browser viewport/touch simulations use Edge, not physical iOS devices.

Representative page counts exclude credits. Unused space is approximate pixels per page. Complete results and zooms are in [score-page-balancing-results.json](score-page-balancing-results.json). Negative unused values there mean an oversized system before the existing fit-to-height adjustment, not cropped notation.

| Song / width | View | Pages before / after | Systems before / after | Unused px before / after | PDF pages |
|---|---|---|---|---|---|
| Silent Night / 320 | Normal | 11 / 10 | 1/1/1/2/1/1/1/1/1/1/1 / 1/1/2/2/1/1/1/1/1/1 | 194/194/210/5/206/201/198/209/179/179/208 / 194/194/5/5/201/198/209/179/179/208 | 1 |
| I Want to Be a Missionary Now / 390 | Normal | 5 / 4 | 3/2/2/3/1 / 3/2/3/3 | 16/182/229/55/477 / 33/191/12/89 | 1 |
| I Want to Be a Missionary Now / 390 | Lead | 4 / 3 | 3/3/4/1 / 4/3/4 | 170/157/104/533 / 3/167/126 | 1 |
| When I Am Baptized / 390 | Normal | 6 / 5 | 3/3/2/2/2/2 / 3/3/3/3/2 | 110/62/250/215/245/181 / 126/70/13/31/190 | 1 |
| Ring Out, Wild Bells / 390 | Most music | 4 / 3 | 3/2/2/2 / 3/3/2 | 40/231/194/275 / 86/52/237 | 1 |
| Though Deepening Trials / 390 | Normal | 6 / 5 | 2/2/2/2/2/1 / 2/2/2/3/2 | 257/220/243/218/219/439 / 262/221/247/4/205 | 2 |
| I Believe in Christ / 820 | Normal | 2 / 2 | 3/3 / 3/3 | 191/167 / 191/169 | 2 |
| I Believe in Christ / 820 | Lead | 2 / 2 | 5/2 / 3/4 | 147/676 / 505/332 | 2 |
| I Want to Be a Missionary Now / 820 | Normal | 2 / 2 | 4/1 / 2/3 | 4/799 / 514/309 | 1 |
| I Want to Be a Missionary Now / 820 | Lead | 1 / 1 | 5 / 5 | 108 / 120 | 1 |
| Though Deepening Trials / 820 | Normal | 2 / 2 | 4/1 / 2/3 | 39/767 / 527/290 | 2 |
| Though Deepening Trials / 820 | Lead | 1 / 1 | 4 / 4 | 382 / 391 | 2 |
| Silent Night / 1440 | Most music | 2 / 1 | 2/1 / 3 | 304/549 / 6 | 1 |
| Silent Night / 1440 | Normal | 2 / 1 | 2/1 / 3 | 304/549 / 6 | 1 |

Equal system counts are not forced when heights differ. Some blank space remains because the next complete system cannot fit. Balancing deliberately leaves more room on earlier pages to avoid an orphan ending.

## Print and original PDF comparison

| Song | Full music pages before / after | Lead music pages before / after | Original PDF pages |
|---|---|---|---|
| Silent Night | 2 / 2 | 1 / 1 | 1 |
| I Believe in Christ | 3 / 2 | 1 / 1 | 2 |
| I Want to Be a Missionary Now | 2 / 2 | 1 / 1 | 1 |
| When I Am Baptized | 2 / 2 | 1 / 1 | 1 |
| Ring Out, Wild Bells | 2 / 2 | 1 / 1 | 1 |
| Though Deepening Trials | 2 / 2 | 1 / 1 | 2 |

Detailed print system distributions:

- I Believe in Christ Normal: 3/3/1 to 3/4; unused height after: 137/12 normalized units.
- I Believe in Christ Lead: 6 to 6; unused height after: 72 normalized units.
- When I Am Baptized Normal: 3/2 to 2/3; unused height after: 562/329 normalized units.
- When I Am Baptized Lead: 4 to 4; unused height after: 508 normalized units.

Printed note size is unchanged. Screen and A4 engraving have different system breaks. All six Lead print examples use one music page. Each document also retains its separate credits page, excluded above. Some full scores still require two music pages where the published PDF uses one; fitting them onto one would require smaller notation or unrelated engraving changes. Original PDFs were density references only and were not modified.

Visual review: phone/tablet/desktop full and Lead screenshots; all printed music and credits pages for I Believe in Christ and When I Am Baptized; original PDF pages for I Believe in Christ and I Want to Be a Missionary Now. Four-verse lyrics, chords, staff groups, repeats/endings, and final barlines remain intact. Local visual artifacts are in `test-results/balance-*` and `test-results/balanced-print-*` and are not shipped with the app.

## Files changed

- `system-pagination.js`: shared planner and whole-system SVG composition.
- `virtual-pages.js`: screen groups, height clearance, retained anchor.
- `auto-layout.js`: planned page metrics and fitted lyric readability.
- `app.js`: Lead metadata, consistent available height, print groups.
- `navigation.js`: distinguish deliberate navigation from refresh.
- `sw.js`: precache module and version update.
- `tests/system-pagination.mjs`, `tests/page-balance-audit.mjs`, `tests/page-balance-print.mjs`: targeted planner, screen, print checks.
- `tests/performance-navigation.mjs`: direct composed-page SVG assertion, current Tap Zones entry, and taps safely inside the upper 25% zone.
- `tests/virtual-pages.mjs`: normalize generated print IDs and use supported cs-168 for Lead tests; Nativity intentionally remains fallback.
- This report and comparison JSON.

Lead coverage remains 244. Source scores/PDFs, horizontal margins, Library, Fun, and metronome logic are unchanged. This is a static production app; tests run production files directly, with no compilation build step.


## Targeted validation

- Shared planner: minimum pages, unequal-height balance, bounded gaps, oversized systems, 45 generated exact-coverage cases.
- Most music policy: existing candidate floors, quality preference, tie-breaking, persistence.
- Real-source audit: 90 screen comparisons and 12 print count comparisons, complete-system preservation and no overflow.
- Virtual pages: 36 real-score/viewports; touch/drag, offline navigation, key/octave/Reset, measure retention, Score/Lead switching, print mode invariance, playback/Lyrics/PDF transitions. Worst measured keyboard turn in final local run: 35ms.
- Song transitions: four viewports, stale engraving/fetch/Lyrics/PDF protection, repeated selection, Lead, Library/List context, offline return.
- Metronome: five viewports; grouping, tempo, clock, stop/start, navigation, Lead/Lyrics/PDF.

The full music-engine and 7,288-case chord suites were not run. No physical iPhone/iPad or printer was available; browser touch/viewport simulations and rendered A4 PDFs provide the verification above.

- Performance navigation: preference migration, four tap zones, bounds, drag rejection, keyboard, offline turns, Continuous-to-pages reading position, PDF position, single-page safety all pass.
- Print: four generated full/Lead documents pass exact system-count preservation, music-page counts, and hidden-toolbar checks; all current music/credits pages visually reviewed.
