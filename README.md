# Music Transpose

A standalone static prototype with The Nativity Song (Children’s Songbook 52, G major) and The Shepherd’s Carol (40b, D minor). All scores and libraries are included locally. **D: is provenance/source storage only; the running prototype has no dependency on D:.**

## Run

Run `Start-Prototype.ps1`, then open http://127.0.0.1:8767. Alternatively run `python serve.py` from this directory. No build or package installation is needed. Open the HTTP URL, not index.html via file://. The default server serves this project only and binds to loopback.

## Use

- The app opens at **Library**. Search or filter compact rows, then open a score. **Library** in the playing toolbar returns here; returning to the current score preserves its key and scroll position, while another song opens in its original key.
- Arrows move one semitone, bounded at −6 and +6. Tap the current key for thirteen choices. The larger tonic and repeated accidentals are paired with small signed distances; the hint identifies the mode.
- Minor songs stay minor. Both signed tritones share a pitch class but differ by an octave. Zero preserves the original spelling.
- **↺** restores the exact original MusicXML and original key. **Print score** prepares A4 notation pages and score credits. Actual AirPrint needs testing.

## Song data and source correction

`songs.js` contains title, collection, page, local asset, tonic, mode and fifths. Both songs share the same renderer and transposition function. Add a vetted local MXL, a registry entry, and its service-worker asset entry for another song. Modulating scores and unsupported notation require review first.

The Shepherd’s Carol archive declares `<mode>major</mode>` with one flat, but its D-minor tonic, repeated A7–Dm cadences, C-sharp leading tones and final D establish **D minor**. The registry documents an explicit minor override. The MXL is untouched. Nonzero in-memory transformations use minor mode; exact reset returns the original XML, including its erroneous mode label. The UI and transposition model continue to identify D minor correctly.

## Offline and hosting

Runtime files are `index.html`, `styles.css`, `app.js`, `library.js`, `navigation.js`, `score-layout.js`, `music.js`, `songs.js`, `sw.js`, `assets/`, and `vendor/`. Paths are relative. OSMD 2.1.2 and fflate 0.8.3 are vendored, with licenses. No remote score/font/library requests occur.

The service worker caches both scores after installation. Offline reload and switching/transposition of both songs passed. Cache eviction may require revisiting. HTTPS or localhost is required for service workers. No publishing was performed. Real iPad Safari, offline persistence and AirPrint remain to be tested before a broader trial.

## Verification

`tests/acceptance.mjs` tests major behavior from G, C and D originals. `tests/minor-navigation.mjs` tests all D-minor destinations, chord spellings, immutable score details, exact reset, navigation, offline use, print preparation and 1180×820 / 820×1180 touch-sized layouts. These use the existing bundled Playwright and installed Edge.

With the server running:

```powershell
node tests/acceptance.mjs
node tests/minor-navigation.mjs
```

Results and screenshots are under `test-results/`. `provenance.json` records original paths and hashes for audit only. `test-results/source-integrity.json` verifies both local copies match the unchanged archive sources. No archives or other projects were modified.


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


## iPad / Safari testing

Published test URL: https://utahbug.github.io/MusicTranspose/

1. Open the URL in Safari.
2. Test portrait and landscape.
3. Test both The Nativity Song and The Shepherd’s Carol.
4. Change keys with ↑ / ↓, then open the full key selector.
5. Use ↺ to reset to the original key.
6. Switch songs; each should start at its own original key.
7. Optionally use Safari Share > Add to Home Screen. The new 180×180 apple-touch icon should appear.

The manifest uses relative start/scope URLs and standalone display. First allow an online visit to finish caching before an offline trial. Physical iPad/Safari, cache eviction, background/resume and AirPrint still require real-device testing. The site is public; noindex/nofollow discourages indexing but does not restrict access. A robots.txt inside a project subdirectory is not an origin-root robots policy; the HTML robots meta tag supplies the per-page directive.


## Four-song Christmas update

The live registry now includes The Nativity Song (Children’s Songbook 52, G major), The Shepherd’s Carol (40b, D minor), Oh, Come, All Ye Faithful (Hymns 1985, 202, G major), and Silent Night (204, B-flat major). The official embedded title of hymn 202 includes “Oh,”. Bundled additions: `assets/faithful.mxl` and `assets/silent-night.mxl`; source archive bytes were read only and hashes are in provenance.json. Both use the unchanged shared transposition pipeline. The service-worker asset cache includes all four.

`tests/four-songs.mjs` covers both new hymns at all thirteen signed positions, quick arrows, rapid input, exact XML/SVG reset, song switching, offline loading of all four, and 1180×820 / 820×1180 layouts. All 237 pitches in Faithful and 179 in Silent Night transpose exactly; key signatures and conventional destination names are checked. Neither MXL contains harmony/chord-symbol events, so no chord labels are invented. All XML outside the permitted pitch/signature/accidental/harmony fields remains unchanged, including lyrics, rhythm, voices/staves, ties/slurs, directions and other notation.

Visual inspection found an existing engraving limitation exposed by these sources: the metronome number and expression word (“Majestically” / “Peacefully”) overlap at the top. Notes, lyrics and arrangements remain intact. No song-specific rendering/transposition workaround was added. Confirm practical readability, especially these initial directions, during physical iPad/piano testing. Desktop rapid-transposition checks passed; this is not a claim of musician or physical-iPad validation.

Run `node tests/four-songs.mjs` against the local server, or set TEST_URL to the live Pages URL (with trailing slash). Test evidence remains excluded under test-results/. Earlier two-song descriptions record prior phases.


## Permanent name

The existing repository is now named MusicTranspose, preserving its history and codex/pages branch. Repository: https://github.com/utahbug/MusicTranspose. Permanent site: https://utahbug.github.io/MusicTranspose/. Use this URL for bookmarks and new home-screen installations. Manifest start_url and scope remain relative; short_name remains Transpose. Earlier prototype-named references in historical notes describe the prior publishing phase.


## Navigation settings and mobile refinements

Settings (gear next to Print) opens a centered touch-friendly panel with a mutually exclusive navigation selector and a Key Changes section. Continuous Scroll is the default. Page Turns is disabled: screen rendering produces one continuous SVG for each current song and does not preserve dependable published page breaks. A4 print pages belong to a separate print renderer and are not repurposed as screen pages.

Auto-scroll has explicit Start/Pause controls and 1–60 px/s speed in 1 px/s steps, default 12. It uses animation-frame elapsed time, with capped frame deltas. Manual pointer/touch interaction, wheel/keyboard scrolling, dialogs, rendering changes, resize, loss of focus, visibility changes and printing pause movement. Nothing resumes automatically. A separate control row appears only in Auto-scroll or Hybrid modes. Manual scrolling remains available.

Hybrid advances 85% of the viewport height remaining above the actual toolbar, preserving 15% overlap. Next screen, PageDown and ArrowRight provide the same action when a settings/selection dialog or text/range input is not active. This supports pedals that emit those keys without introducing a general pedal mapper. The mode and speed are stored via sessionStorage under a namespaced key; navigation preference storage is isolated from score data for future per-song extension. Storage failure falls back to in-memory behavior. Reload restores the selected mode/speed but never starts scrolling.

Transition-chord suggestions are honestly disabled and marked forthcoming. No harmonic generation or fake suggestions were added.

At widths of 600 CSS pixels or less the current-key label displays Maj/Min; full major/minor labels remain elsewhere and in accessible key labels. The score header uses a collision-safe two-column grid: title left, secondary source/page right, with wrapping for long text. Phone utilities/reset occupy one row and 76px pitch targets flank the key on a second row; tablet/desktop pitch targets remain 88px wide. The original key color and border colors are unchanged. Toolbar height is measured with ResizeObserver so safe-area and bottom score clearance remain correct for each row configuration.

`tests/navigation-settings.mjs` checks all four scores across 820×1180, 1180×820, 375×812 and 1440×1000: header separation, compact labels, controls, print comparisons, real scroll movement at 20 and 60 px/s, start/pause/resume, manual pause, session reload, screenful distance and final-score clearance. Print output is compared to local pre-change print baselines; toolbar/settings/navigation controls are excluded. Measured 20 px/s movement passed a 1.2-second timing window. Physical iPad/Safari performance and foot-pedal hardware still need user testing. Include navigation.js in any portable/static deployment; the service worker caches it.


## Library home

The default screen is MusicTranspose Library, with no automatic score opening. A compact searchable list shows title, source collection/page, original key and favorite state. All, Favorites, Recently Played, Primary, Christmas and the three source-collection filters combine with search, personal-list selection and Title / Number-Page / Collection / Recently Played sorting. Phone filters scroll horizontally; tablet filters wrap. The playing toolbar's Songs control is now Library. Returning to the open score preserves key and scroll; selecting a different score resets to its published key. Search/filter/sort choices remain in memory while switching views.

`songs.js` owns stable IDs, title, factual source collection/page, tonic/mode/fifths, bundled asset, built-in tags, aliases and optional additional collection memberships. First-line/composer/lyricist fields can join the precomputed case/accent-insensitive search index later. No future hymnal membership is predicted. Personal lists are entirely separate from catalog metadata.

`library.js` stores versioned data in localStorage under `music-transpose-library-v1`: favorite song IDs, user groups `{id,name,songs}` and an ordered recent-ID list capped at 30. A song can belong to multiple groups. The plus button edits membership; Manage lists creates, renames and deletes lists without deleting songs. Browser storage is local to this origin/profile, with no account or synchronization. Clearing browser data removes preferences. Storage failure falls back to memory and displays a notice. All UI text is inserted through DOM textContent, not user-provided HTML.

The Library and list dialog are excluded from print. Score rendering, score assets, transposition and print generation are unchanged. Navigation settings retain their behavior in the playing view; score-only keyboard shortcuts and auto-scroll do not run in Library. The service worker includes library.js.

Validation: `tests/library.mjs` covers four viewports, all four scores, search/filter/sort, favorite and multiple-list persistence, rename/delete, recents, transpose/key/reset/settings/print and offline reload. `tests/library-scale.mjs` injects 500 synthetic metadata rows only in the browser (504 total); search measured 27ms including automation overhead. No new score assets were imported. Four-song, 48-case tempo/print and copied-directory portability regression suites passed. Physical iPad/Safari testing remains separate from desktop browser viewport emulation. Older historical UI tests that assume the removed Songs modal are superseded by the Library test.


## Expanded bundled catalog

The current catalog contains 119 songs: 81 supported Hymns for Home and Church scores, the available requested Primary-use songs, and the original four. The Primary filter includes 42 entries. No additional general Hymnal/Songbook bulk import was performed. `imported-songs.js` contains generated archive metadata and is included by songs.js; assets/scores contains 115 exact archived MXL copies. Include imported-songs.js in portable deployments.

See reports/library-import-summary.md for unavailable requests, the excluded modulating score, mode-declaration corrections and consolidation details. scripts/import-library.py is a manual read-only archive import tool, not runtime code. The browser loads only metadata at Home; selected XML is unpacked once per asset/session. Service-worker background byte caching retains complete offline availability after installation without parsing all scores. Tests/import-validation.mjs covers every current entry; tests/import-library.mjs covers expanded Library behavior. Earlier four-entry count assertions in historical tests describe their original catalog and are superseded for scale/filter counts by the expanded Library test.
