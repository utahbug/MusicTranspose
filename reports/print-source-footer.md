# Source-only structured print footer

Removed preparePrint()'s appended `.print-credits` section, its `<song title> · Score credits` heading, and the clone of the screen `#source-credits` block. Removed the obsolete .print-credits CSS, including its forced-page rule. The existing last-score-page break-after:auto remains unchanged.

Per the user's clarification, retain only source-authored credit wording omitted by the structured print renderer. print-source-credits.js reads original MusicXML credit-words and explicit identification creator/rights/source text. It never enriches from catalog metadata or adds role labels. Source title/subtitle/lyrics types, source title matches, and verse-numbered text are excluded. The displayed song title is used only as an exclusion for untyped title credits (HHC 1054 has one), never as footer content.

Whitespace-normalized comparisons identify duplicates and text already rendered in score SVGs; the actual displayed strings retain source wording. Redundant shorter entries already contained in a fuller source line (for example a bare © or a creator name repeated within an attribution) are omitted. No footer is created when nothing is missing. Existing rendered source text is untouched.

The footer is two compact columns in 8pt Georgia, normal black text, with 4pt top spacing and no forced page break. No heading, song title, Library data, or inferred attribution. Notation, musical page grouping, margins, source MusicXML, Original PDF, and MusicXML export logic are unchanged. No on-screen credits changes.

## Verification

`tests/print-no-app-credits.mjs` compares the previous implementation at 34a44f7 against the current implementation for HHC 1035 and HHC 1054, Transpose and Melody only, each with key +1 and register +1. All rendered musical SVG attributes/text and musical state are identical. Fixtures cover duplicate source lines, attribution/name overlap, already rendered source credits, and untyped title exclusion. The old .print-credits is absent.

Actual Chromium A4 PDFs were extracted with pypdf and rendered with Poppler for visual review. Attribution, copyright, and scripture/source lines occur exactly once, with no blank final pages:

| Song | View | Before PDF pages | After PDF pages |
|---|---|---:|---:|
| As I Keep the Sabbath Day (HHC 1035) | Transpose | 2 | 2 |
| As I Keep the Sabbath Day (HHC 1035) | Melody only | 2 | 1 |
| When I Am Baptized (HHC 1054) | Transpose | 2 | 2 |
| When I Am Baptized (HHC 1054) | Melody only | 1 | 1 |

All four HHC 1035 lines (Text, Music, scripture references, copyright) and all four HHC 1054 lines are retained verbatim, aside from visual whitespace wrapping. Musical page counts remain 2/1 respectively; the removed page was the app-generated credits-only page.

`tests/score-export.mjs` at 820px passes: Original PDF byte equality, annotation/offline behavior, source/current MusicXML, transformed key/register, HHC 1035 56 notes/34 harmonies/no engraving anchors, Save/Print, filenames, menu/focus and availability. `git diff --check` passes. Existing full-score-print and page-balance-print assertions now expect the retired section to be absent; those historical layout suites were not rerun because the dedicated before/after comparison verifies unchanged musical geometry.

Files: app.js, print-source-credits.js, styles.css, sw.js (v150, caches helper), tests/print-no-app-credits.mjs, tests/full-score-print.mjs, tests/page-balance-print.mjs, reports/print-source-footer.md. Generated comparison PDFs/PNGs remain ignored under test-results; no source PDFs or MXL files changed.
