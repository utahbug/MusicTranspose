# Prototype findings

## Current result

The Nativity Song (52) in **G major** and The Shepherd’s Carol (40b) in **D minor** share one local MXL loading, rendering and transposition pipeline. Both asset copies are byte-identical to the archive; all runtime requests use the prototype origin. D: is not a runtime dependency. No publishing or other-project changes occurred.

## Shepherd source evidence and minor handling

The unique archived file is `Childrens_Songbook/040b - The Shepherd’s Carol.mxl`; its container root is `2002-01-0420-the-shepherds-carol-round-eng.musicxml`. It has two parts, 71 pitched notes and nine harmony entries. Both source key declarations have one flat but say major. D-minor chords, A7–Dm cadences, C-sharp leading tones and the final melodic D corroborate D minor, rather than its relative F major.

The registry's documented mode override corrects interpretation without rewriting the MXL. Nonzero generated XML declares minor. Zero returns the exact source string, retaining its incorrect major declaration, while the registry keeps the displayed tonic/mode correct. The signature remains the published one flat.

Minor destinations above D: E-flat, E, F, F-sharp, G, G-sharp. Below: C-sharp, C, B, B-flat, A, G-sharp. All remain minor. E-flat minor uses six flats rather than six sharps; C-sharp/F-sharp/G-sharp avoid less familiar enharmonic signatures. Harmonic-minor leading tones transpose with their notes rather than being replaced with a natural-minor scale.

## Implementation and navigation

`songs.js` provides local asset, title, collection, page, tonic, mode and fifths. Registry values are checked against the parsed key (including any documented mode override) before loading. A compact Songs button opens a centered native dialog with large two-line song buttons. Selecting either song clears the prior render cache and shift, loads its local asset, updates title/credits/key controls, and scrolls to the start. Song selection is briefly disabled while loading/rendering to prevent overlapping transitions.

Every destination is transformed from immutable original XML. Chromatic displacement plus a diatonic interval updates pitches/octaves, signatures and harmony root/bass spelling together; chord quality is preserved. OSMD 2.1.2 engraves the resulting XML as SVG; fflate 0.8.3 reads MXL containers. No second transposition implementation or cumulative transformation is used.

The chooser retains ±1 through ±6 indicators, repeated accidentals and Original/Current markers. Mode appears in the toolbar and chooser hint. Arrow bursts coalesce; cached SVGs are bounded and keyed by width and shift within the active song.

Additional songs require a vetted local asset, registry entry and offline-cache entry, not duplicate rendering logic. This is intentionally a small fixed catalog, not an arbitrary-score uploader.

## Verification evidence

- Existing major regression suite passed all 46 score checks, including G/C/D originals, every destination, exact XML/SVG reset, rapid inputs, limits, offline reload and printing preparation.
- Minor suite passed the original and all twelve signed nonzero destinations plus offline E-flat minor. All 71 pitches moved by the exact requested semitone count; all nine harmony roots moved by the correct pitch-class interval. Required ±1/±2 chords were also checked for exact letter/accidental spelling (Ebm/Bb7, Em/B7, C#m/G#7, Cm/G7).
- All other XML was compared after removing only pitch/accidental, key fifths/mode and harmony root/bass fields. Lyrics, fingering, durations, meter, voices/staves, notations, ties/slurs, directions, credits, barlines/repeats and backup/forward elements remain unchanged.
- Original reset reproduced exact XML and cached SVG. Switching in both directions after transposition restored G major or D minor respectively; scroll reset was checked.
- Both songs switch and transpose offline. No external-origin requests or browser errors occurred.
- Edge touch-enabled 1180×820 landscape and 820×1180 portrait tests passed: no horizontal overflow; all key and song targets at least 44 pixels; complete key grids fit. Inspected screenshots include the song chooser, minor chooser and E-flat-minor score. This is desktop emulation, not actual iPad Safari.
- Both archive files were read only; source and copied SHA-256 values match the recorded originals. See `test-results/source-integrity.json` and `provenance.json`.

Results: `test-results/acceptance.json`, `test-results/minor-navigation.json`, and associated PNGs.

## Notation and practical limits

No minor-specific pitch or chord failure was found. The main minor-specific issue is incorrect source mode metadata, addressed explicitly rather than silently inferring every one-flat score is minor. E-flat-minor natural leading tones and matching chords are visible in the inspected rendering. OSMD renders flat chord labels using letter b (for example Ebm/Bb7).

Scores are re-engraved, not PDF facsimiles. Responsive system/page breaks and font spacing can differ. Credit blocks are presented below the notation because OSMD does not render them automatically. Fingering numbers are preserved, not recomputed for ergonomic suitability in a new key. Explicit accidental glyphs are regenerated for nonzero transpositions; editorial/courtesy styling needs further coverage.

Exact original reset intentionally preserves the source's incorrect XML mode tag. Any future exported XML feature must decide whether to offer corrected metadata separately; no export is implemented here.

Before more Christmas songs, inspect each source's actual mode and key changes and spot-check its engraving. Modulations, transposing instruments, microtones and complex editorial accidentals are not supported generally. Before a temporary Pages trial, test actual Safari/iPad touch, offline persistence and print/AirPrint, and confirm static-subdirectory/service-worker behavior. Asset/cache update handling deserves a production policy before broader distribution. No publishing was performed.


## Compact accompaniment view

The normal screen header and toolbar now occupy 108 CSS pixels combined (54 + 54), down from 207: **99 pixels saved** at 1180×820, 820×1180 and 1440×1000. The title and collection/page remain readable in a compact header alongside Songs and Print. All main controls remain at least 44×44 pixels; the transpose controls stay in one row. Key mode and signature remain visible.

The decorative eyebrow was removed. Routine key/status announcements remain available to assistive technology without a persistent visual row. Offline status is shown inside Songs. Errors still display visibly. The redundant bottom original-key footnote is hidden on screen; Original/Current remain in the expanded key chooser. Roomy song/key dialogs were retained.

Screen framing measures the first rendered SVG's actual content bounding box and removes only its empty top space using a screen-only negative margin inside an overflow-clipped container. An eight-SVG-unit buffer protects topmost ink. No SVG musical elements are deleted, and no MusicXML, pitches, rendering options or source assets are rewritten. About 35–41 additional CSS pixels of renderer top whitespace are removed. Combined with compact surrounding spacing, first score ink moved upward about **160–168 pixels**, to approximately y=127–128, roughly 20 pixels below the toolbar.

Further trimming would encroach on tempo/expression text above the staff. Space between those musical annotations and the staff, and spacing within systems, is left to the engraver; it is not treated as disposable margin.

`tests/compact-verification.mjs` checks both songs at iPad landscape 1180×820, portrait 820×1180 and desktop 1440×1000, with no horizontal overflow or clipped controls. Both choosers open. Screenshots show more notation before scrolling: all Shepherd notation fits landscape; Nativity portrait shows three complete systems and part of the fourth. Main targets are at least 44 pixels. Real iPad Safari still needs device testing.

Print preparation is unchanged and uses its separate A4 engraver. All six generated print comparisons matched the captured pre-change SVG/credit baseline (ignoring generated IDs); screen crop CSS is inactive in print media. Normal print dimensions, margins and content are preserved. Physical printing/AirPrint remains untested.

Both existing major and minor/navigation acceptance suites passed again, including every destination, exact Reset, immutable musical details, offline operation and switching. Evidence: `test-results/compact-verification.json`, `compact-*.png`, `acceptance.json`, and `minor-navigation.json`. No archives or other projects were changed; no songs or publishing were added.


## Portable / Pages preparation

A copied-directory static-host test under `/music-transpose-prototype/` passed both songs, major/minor shifts, exact reset, both choosers, tablet viewports, offline reload and switching. No missing assets or external requests occurred. Runtime paths are relative and both scores are bundled. Developer tools no longer embed a user-specific runtime path: the launcher uses Python on PATH or PYTHON, and tests resolve Playwright normally or through PLAYWRIGHT_PACKAGE.

See `github-pages-readiness.md` for the exact proposed commit set, exclusions, path audit, likely URL and Safari/offline caveats. `.gitignore` excludes generated evidence; `.nojekyll` is included. No repository was created and nothing was published. Evidence: `test-results/portability.json`. Run `node tests/portability.mjs` with Playwright and a browser available; these are development-only dependencies.


## Four-song Christmas update

The live registry now includes The Nativity Song (Children’s Songbook 52, G major), The Shepherd’s Carol (40b, D minor), Oh, Come, All Ye Faithful (Hymns 1985, 202, G major), and Silent Night (204, B-flat major). The official embedded title of hymn 202 includes “Oh,”. Bundled additions: `assets/faithful.mxl` and `assets/silent-night.mxl`; source archive bytes were read only and hashes are in provenance.json. Both use the unchanged shared transposition pipeline. The service-worker asset cache includes all four.

`tests/four-songs.mjs` covers both new hymns at all thirteen signed positions, quick arrows, rapid input, exact XML/SVG reset, song switching, offline loading of all four, and 1180×820 / 820×1180 layouts. All 237 pitches in Faithful and 179 in Silent Night transpose exactly; key signatures and conventional destination names are checked. Neither MXL contains harmony/chord-symbol events, so no chord labels are invented. All XML outside the permitted pitch/signature/accidental/harmony fields remains unchanged, including lyrics, rhythm, voices/staves, ties/slurs, directions and other notation.

Visual inspection found an existing engraving limitation exposed by these sources: the metronome number and expression word (“Majestically” / “Peacefully”) overlap at the top. Notes, lyrics and arrangements remain intact. No song-specific rendering/transposition workaround was added. Confirm practical readability, especially these initial directions, during physical iPad/piano testing. Desktop rapid-transposition checks passed; this is not a claim of musician or physical-iPad validation.

Run `node tests/four-songs.mjs` against the local server, or set TEST_URL to the live Pages URL (with trailing slash). Test evidence remains excluded under test-results/. Earlier two-song descriptions record prior phases.
