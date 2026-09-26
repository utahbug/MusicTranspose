# Full-score density / iPad pagination

Baseline `e2b6c23`, existing utahbug/MusicTranspose, clean `codex/pages` at start.

## Findings

The primary cause is horizontal rhythmic spacing in the full-score renderer, not hidden vertical containers or inaccurate page bounds. Normal's default multiplier/addend (0.85 / 3) gives many measures more width than their note/lyric content needs, producing extra systems. The existing whole-system pager then balances those extra systems over pages. Larger selected sizes and short viewports also matter; a phone-sized CSS viewport can require many more pages than a printed sheet.

At 820x1180 the pager has 1015.7px: score starts at 78.3px, footer is 54px, and the existing 32px allowance protects the Original-key annotation and footer clearance. Each system includes only 3 SVG units of ink padding per edge, 2.34px at Normal's 0.78 zoom. No duplicated padding, stale pre-reflow bounds, or invisible lyric blocks were found in the measured primary systems. Capture runs after engraving and tempo corrections. Source title/top whitespace is already excluded from virtual-page cuts. Inter-system gaps are already capped at 24px; shrinking them alone is not the main opportunity.

Redeemer before: four systems measuring 258.5 / 246.1 / 223.9 / 272.6px. Their combined ink-safe heights alone total about 1001px, leaving insufficient room for three inter-system gaps within 1015.7px. It therefore needs two pages at that spacing. The balanced 2/2 distribution explains the conspicuous 493/495px lower blanks; the pager is not silently reserving those blank regions. With 5/5/5 measures per system instead of 4/4/3/4, three complete systems fit on one page.

At the same size, Now Let Us Rejoice has eight systems, 189-237px tall, at 4-5 measures per system (two on the final line). Safe reflow reduces this to six systems, 197-237px tall. The heights do not uniformly shrink: the improvement comes from needing fewer systems.

Treble staff height is 31.2px at this tablet Normal setting. Redeemer's first-system treble bounds are y=58.1..89.3px in source coordinates; bass y=234.4..265.6; four-verse lyric ink y=124.1..199.6. Rejoice's first treble is also 58.1..89.3; bass 214.9..246.1; three-verse lyric ink 124.1..180.1. Those spaces contain actual lyrics, ties, stems and ledger notes. Vertical lyric/staff rules were deliberately left unchanged. The detailed JSON contains per-system visible bounds, treble/bass bounds, lyric/other-text bounds, width/minimum-width data, ink vs pager heights, padding, and natural gaps for both primary tablet sizes.

## Change

Full-score engraving now tries a bounded set of horizontal spacing choices at the same zoom: original 0.85/3, moderate 0.75/2, and compact 0.65/2 (the latter uses the engine's compact spacing values). It uses the engine's lyric-aware minimum measure widths. Candidates with lyric collisions or horizontal clipping are rejected. A candidate must reduce page count or, at equal page count, total systems. The wider choice wins ties, already-good one-page layouts keep their original spacing, and the selected renderer state is restored before use. Printing uses the same guard at its existing 0.8 zoom.

Most music still chooses among its existing readable size profiles, but now prefers the larger readable size when page counts tie. It no longer shrinks just to expose more measures on the first page when total page count is unchanged. Lead bypasses the full-score spacing selector entirely. No horizontal margins, font sizes, staff clearances, source scores, PDFs, or musical content are changed.

## Primary tablet comparisons

Pages are music pages. Unused lower space is approximate px per page. Normal's notation scale remains 0.78 throughout these portrait cases.

| Song / viewport | View | Pages before -> after | Systems/page | Measures/system | Unused px | PDF pages |
|---|---|---|---|---|---|---|
| Redeemer of Israel / 820x1180 | Normal | 2 -> 1 | 2/2 -> 3 | 4/4/3/4 -> 5/5/5 | 493/495 -> 201 | 1 |
| Redeemer of Israel / 820x1180 | Most music | 1 -> 1 | 4 -> 3 | 5/4/4/2 -> 5/5/5 | 61 -> 201 | 1 |
| Now Let Us Rejoice / 820x1180 | Normal | 2 -> 2 | 4/4 -> 3/3 | 5/4/4/5/5/4/5/2 -> 6/5/5/7/5/6 | 86/90 -> 272/305 | 2 |
| Now Let Us Rejoice / 820x1180 | Most music | 2 -> 2 | 4/3 -> 3/3 | 5/5/4/6/5/6/3 -> 6/5/5/7/5/6 | 177/372 -> 272/305 | 2 |
| Redeemer of Israel / 768x1024 | Normal | 2 -> 1 | 2/2 -> 3 | 4/4/3/4 -> 5/5/5 | 338/340 -> 46 | 1 |
| Redeemer of Israel / 768x1024 | Most music | 2 -> 1 | 2/2 -> 3 | 5/4/4/2 -> 5/5/5 | 404/412 -> 46 | 1 |
| Now Let Us Rejoice / 768x1024 | Normal | 3 -> 2 | 3/3/2 -> 3/3 | 4/4/4/3/6/4/5/4 -> 6/5/5/7/5/6 | 150/185/375 -> 132/134 | 2 |
| Now Let Us Rejoice / 768x1024 | Most music | 2 -> 2 | 4/3 -> 3/3 | 5/4/4/6/5/5/5 -> 6/5/5/7/5/6 | 19/223 -> 132/134 | 2 |

Published PDF reference: Redeemer has one page, three systems, averaging five measures per system. Rejoice has two pages with 4/2 systems, averaging about 5.7 measures per system. The structured layout is not forced to reproduce those breaks. Its six systems can balance 3/3. The reported 4/5 counts were not reproduced in the main portrait iPad viewports on the current baseline; the exact viewport/selected mode affects the count. All measured viewport results are included rather than replacing the baseline with the reported estimates.

## Other results and notation size

Across 90 main comparisons (six songs x three modes x five viewports), 17 have fewer pages, none have more. All 30 Normal zooms are unchanged. All 30 Lead comparisons have exactly equal captured system and ink geometry, not merely equal page counts. The six-song set includes four verses, dense text, a long hymn, repeats/endings, different meters, recently paginated songs, and Silent Night as an already-good tablet case. Additional narrow-phone/landscape measurements are separate targeted checks.

Examples: When I Am Baptized Normal at 820px goes 2 to 1; I Believe in Christ Normal at 1180px landscape and 1440px desktop goes 3 to 2; Now Let Us Rejoice Normal at 390px goes 8 to 5. Silent Night's already-good one-page 820px and desktop Normal layouts keep their original spacing. Some Normal cases remain multipage because unchanged large glyphs/lyrics cannot safely fit more complete systems.

Most music uses a smaller existing zoom in only two of the 30 comparisons: Redeemer at 1180x820 goes 0.9 to 0.81 while pages drop 2 to 1; I Believe in Christ at 390x844 goes 0.702 to 0.64 while pages drop 6 to 5. Other Most music sizes stay the same or become larger. These two improvements combine spacing with the existing size-profile choice; Normal improvements are entirely reflow/spacing at unchanged scale.

## Print

| Song | Full before -> after | Lead before -> after | Published PDF |
|---|---|---|---|
| Redeemer of Israel | 2 -> 1 | 1 -> 1 | 1 |
| Now Let Us Rejoice | 3 -> 2 | 1 -> 1 | 2 |

Printed notation stays at zoom 0.8. Counts exclude the existing separate credits page (Redeemer's extra verses remain there). Final full-score and Lead PDFs were rendered and visually inspected, including credits, against the original PDFs. Original files were not edited. Before print runs disable only the new selector to reproduce original spacing. Local screenshots and PDFs are under `test-results/density-*`.

## Files and validation

- `full-score-layout.js`: bounded same-size spacing selection and quality fallback.
- `app.js`: full-score screen/print integration and diagnostic spacing state.
- `auto-layout.js`: larger-size tie preference; shared geometry checks remain intact.
- `sw.js`: new module precache and cache version 115.
- `tests/full-score-density.mjs`: actual staff, ink, lyric, measure and pager geometry across viewports.
- `tests/full-score-policy.mjs`: reject collisions/clipping/page increases, preserve good scores, restore selected state.
- `tests/full-score-print.mjs`: primary full/Lead print comparison and system preservation.
- `tests/auto-layout-policy.mjs`: equal-page-count size preference regression.
- `tests/performance-navigation.mjs` and `tests/metronome.mjs`: use cs-12 for multipage testing because cs-110 now fits one page at tablet size.
- This report and [full-score-density-results.json](full-score-density-results.json).

This is a static production app with no compilation step. Tests run the actual production files. Responsive checks use Edge viewport/touch simulation, not physical iPad/iPhone hardware. No full 7,288-case chord suite was run. Lead coverage remains 244; PDF mode, Library, Fun and source musical data are unchanged.


## Additional measurements and completed checks

PDF vector measurement: both primary PDFs use a 17pt staff height on a 432x648pt page. Fitting the whole untrimmed page into 1015.7px yields a 26.6px staff, compared with Normal MXL's 31.2px (about 17% larger). This explains part of the visible size difference; PDF trim settings can change the exact comparison. The fix retains Normal size rather than shrinking it to paper scale.

Additional Normal checks at 320x568: Redeemer 15 to 12 pages, Rejoice 17 to 15; at 844x390: Redeemer 4 to 3, Rejoice 7 to 6. All preserve zoom 0.78 and all systems. Very narrow/short viewports still require many pages at unchanged readable full-score size.

Completed targeted checks:

- 90 main before/after cases plus four additional Normal viewport comparisons; no horizontal overflow or lost systems.
- 30 exact Lead screen geometry comparisons and both exact Lead print geometry comparisons unchanged.
- Full-score policy, auto-layout policy, and shared system pagination unit checks passed.
- Virtual-page regression: 36 real-score/viewports; complete systems, footer clearance, touch/drag, offline turns, key/octave/Reset, retained musical position, print, playback, Lyrics and PDF transitions. Maximum observed keyboard-turn time: 37ms.
- Performance navigation: four zones, first/last bounds, keyboard, preference migration, PDF, continuous-to-page position, offline, and single-page safety passed.
- Stale-song protection and Library/List context passed at four viewport sizes.
- Metronome playback/clock/tempo/navigation and Lead/Lyrics/PDF behavior passed at five sizes.
- Octave hands: register crossing, multiple voices, chord preservation, RH/LH playback, key changes, Reset, Score/Lead state, responsive dialogs, PDF fallback and offline restart passed.
- Eight before/after primary print documents generated; all final music and credits pages visually reviewed. Print system-count preservation passed.
- `git diff --check` passed. Production files were run locally; normal GitHub Pages deployment follows the push.
