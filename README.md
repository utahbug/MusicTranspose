# Music Transpose

A standalone static prototype with The Nativity Song (Children’s Songbook 52, G major) and The Shepherd’s Carol (40b, D minor). All scores and libraries are included locally. **D: is provenance/source storage only; the running prototype has no dependency on D:.**

## Run

Run `Start-Prototype.ps1`, then open http://127.0.0.1:8767. Alternatively run `python serve.py` from this directory. No build or package installation is needed. Open the HTTP URL, not index.html via file://. The default server serves this project only and binds to loopback.

## Use

- The app opens at **Library**. Search or filter compact rows, then open a score. **Library** in the playing toolbar returns here; returning to the current score preserves its key and scroll position, while another song opens in its original key.
- Tap the compact current-key button to deliberately select from thirteen destinations, bounded at −6 and +6. Quick semitone controls have been removed. The larger tonic and repeated accidentals are paired with small signed distances; the hint identifies the mode.
- Minor songs stay minor. Both signed tritones share a pitch class but differ by an octave. Zero preserves the original spelling.
- **↺** restores the exact original MusicXML and original key. **Print score** prepares A4 notation pages and score credits. Actual AirPrint needs testing.

## Song data and source correction

`songs.js` contains title, collection, page, local asset, tonic, mode and fifths. Both songs share the same renderer and transposition function. Add a vetted local MXL, a registry entry, and its service-worker asset entry for another song. Modulating scores and unsupported notation require review first.

The Shepherd’s Carol archive declares `<mode>major</mode>` with one flat, but its D-minor tonic, repeated A7–Dm cadences, C-sharp leading tones and final D establish **D minor**. The registry documents an explicit minor override. The MXL is untouched. Nonzero in-memory transformations use minor mode; exact reset returns the original XML, including its erroneous mode label. The UI and transposition model continue to identify D minor correctly.

## Offline and hosting

Runtime files are `index.html`, `styles.css`, `app.js`, `library.js`, `list-reorder.js`, `navigation.js`, `score-layout.js`, `music.js`, `songs.js`, `sw.js`, `assets/`, and `vendor/`. Paths are relative. OSMD 2.1.2 and fflate 0.8.3 are vendored, with licenses. No remote score/font/library requests occur.

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
4. Tap the current key and choose a destination in Select a key.
5. Use ↺ to reset to the original key.
6. Switch songs; each should start at its own original key.
7. Optionally use Safari Share > Add to Home Screen. The new 180×180 apple-touch icon should appear.

The manifest uses relative start/scope URLs and standalone display. First allow an online visit to finish caching before an offline trial. Physical iPad/Safari, cache eviction, background/resume and AirPrint still require real-device testing. The site is public; noindex/nofollow discourages indexing but does not restrict access. A robots.txt inside a project subdirectory is not an origin-root robots policy; the HTML robots meta tag supplies the per-page directive.


## Four-song Christmas update

The live registry now includes The Nativity Song (Children’s Songbook 52, G major), The Shepherd’s Carol (40b, D minor), Oh, Come, All Ye Faithful (Hymns 1985, 202, G major), and Silent Night (204, B-flat major). The official embedded title of hymn 202 includes “Oh,”. Bundled additions: `assets/faithful.mxl` and `assets/silent-night.mxl`; source archive bytes were read only and hashes are in provenance.json. Both use the unchanged shared transposition pipeline. The service-worker asset cache includes all four.

`tests/four-songs.mjs` covers both new hymns at all thirteen signed positions, chooser selections, rapid internal transposition requests, exact XML/SVG reset, song switching, offline loading of all four, and 1180×820 / 820×1180 layouts. All 237 pitches in Faithful and 179 in Silent Night transpose exactly; key signatures and conventional destination names are checked. Neither MXL contains harmony/chord-symbol events, so no chord labels are invented. All XML outside the permitted pitch/signature/accidental/harmony fields remains unchanged, including lyrics, rhythm, voices/staves, ties/slurs, directions and other notation.

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


## Mixed PDF and structured scores

Scripture Power and Choose to Serve the Lord are bundled PDF entries (121 Library records total, 44 Primary-tagged). Their source Primary app is read-only; provenance hashes and resource investigation are in reports/primary-pdf-addition.md and primary-pdf-provenance.json. No usable structured Scripture Power asset was exposed by the inspected official metadata/application/runtime resources.

PDF entries set scoreType: pdf and transpositionAvailable: false. pdf-score.js renders their original pages with vendored PDF.js in the existing scrollable score container. Pitch/key/reset are hidden and disabled; Library, Print and Settings remain. Continuous scroll, hybrid and auto-scroll use the same document navigation. Page Turns remains unavailable. PDF printing uses image-backed pages; Open original PDF supports native viewer zoom/vector printing. MXL rendering/printing/transposition are unchanged. Phone fixed-layout notation can be enlarged with pinch zoom. Both PDFs and the local PDF.js worker are cached for offline use. Include pdf-score.js plus vendor/pdf.min.js and vendor/pdf.worker.min.js in portable deployments.

The mixed-score test verifies both PDFs at four screen sizes, favorites/list membership/recents, hybrid/auto-scroll and manual pause, bottom clearance, actual 2/5-page print output, cold offline opening, and two structured-score transpose/reset regressions. Physical Safari testing remains outstanding.

## Compact PDF playing view

PDF-only screen headings are hidden; published titles remain in the page itself. The utility row is 11px secondary text: PDF · Transposition unavailable · Original PDF, with a 4px lower gap and an explicit accessible link label. Structured headings and score styles are unchanged.

Generic blank-margin detection runs on a scratch copy of each full 1800px-wide rendered page. Every non-white, nontransparent pixel contributes to bounds, including faint antialiasing. Bounds retain 1.5% of page width as safety padding (27 raster pixels, approximately 9pt on letter paper). Trimming is capped at 15% per edge; blank pages retain full bounds. A CSS overflow frame displays the conservative bounds without changing the underlying canvas or PDF. No per-song exceptions are used.

Trim blank margins defaults on under Settings > PDF display and persists in sessionStorage (music-transpose-pdf-trim-v1). It can restore complete page bounds immediately. PDF-only settings stay hidden for structured scores. Printing uses the original full canvas and native PDF access is unchanged.

Validation: all seven pages retain every detected non-white pixel; original page dimensions remain intact. Toggling trimming produces identical PDF print output from the same full canvases. Separate renderer runs can differ in canvas rasterization, so cross-run encoded image hashes are not treated as a print-content invariant. Structured SVG and print markup match the pre-change baseline for Nativity and Home and Church 1001 at four viewport sizes. First-content position improves 66/72px on phone, 92/104px on iPad portrait, and 108/125–126px on landscape/desktop (Scripture Power / Choose to Serve). Hybrid, auto-scroll/manual pause, final-page clearance, Original PDF access, offline opening and session-setting restoration pass. Physical Safari testing remains outstanding.

Run tests/pdf-compact.mjs first with CAPTURE_BASELINE=1 to record the prior committed viewer via test-only request overrides, then without it for layout/pixel-bound/print comparisons. tests/pdf-scores.mjs exercises the mixed-score controls and offline behavior.


### Manual Favorites and list order

Favorites and each custom list use their existing song-ID arrays as independent
saved sequences under `music-transpose-library-v1`. The one-time `orderingVersion: 1`
migration sorts existing memberships by Title (the previous default visible order),
retaining names, memberships and unknown IDs. New memberships append; removal leaves
the remaining sequence intact. No song record carries a rank.

Selecting Favorites or a custom list defaults to List Order. A selected custom list
owns the order when combined with the Favorites filter. Other sorts are temporary;
returning to List Order restores the saved sequence. Global Library sorting is unchanged.
Reorder enables 44px touch grips plus keyboard-accessible Move up/down buttons.
Pointer capture supports touch/mouse/pen, a marked insertion edge, gentle edge
scrolling, and Escape/pointer-cancel cancellation. Song opening is disabled only
while editing. Filtered reordering permutes visible songs within their existing
slots; hidden songs stay in place. Done restores normal song opening.

Validation: `tests/list-ordering.mjs` covers eight-song Favorites, independent
custom lists, migration, append/remove, drag/buttons, temporary sorts, searches,
four viewport sizes, PDF/MXL opening, transposition, reload and offline persistence.
`tests/list-touch.mjs` checks browser-emulated touch dragging, insertion markers,
auto-scroll, cancellation, filtered slots and reopening in another tab. Physical
iPad/Safari testing is still recommended. The service worker precaches the new module.

### Compact Library utility header

Search, Filter, Sort, List, Reorder and Manage share a wrapping flex toolbar.
Search flexes from a 220px basis to a 420px maximum on larger screens, with
16px text; at 600px and below it occupies the first row, Filter/Sort the second,
and List/Reorder/Manage the third. All controls retain at least 44px height.
Borders are 1px with 4px corners, and keyboard focus uses a 2px blue-gray ring.
The redundant saved-order caption is removed; editing and temporary-sort hints
remain. Song rows, discovery, ordering, rendering and print logic are unchanged.

Measured first-row positions (All / Favorites, before → after):
- iPhone 375×812: 404 / 458 → 242 / 242px.
- iPad portrait 820×1180: 264 / 318 → 199 / 199px.
- iPad landscape 1180×820 and desktop 1440×1000: 264 / 318 → 149 / 149px.

Validation: library-compact, library-discovery, list-ordering, list-touch and
pdf-scores browser checks pass. Viewports are browser simulations, not physical
Safari devices. Cache version advances to distribute the revised UI offline.

### Octave register controls

One note-based Octave button sits immediately left of Reset. It cycles Original
(8) -> Up (8-up arrow) -> Down (8-down arrow) -> Original. Accessible labels and
tooltips report the current state. It is visible on structured scores and hidden
on PDF scores. There are no separate octave buttons or register controls in Settings.

The existing note-only octave transformation is unchanged: lyrics, chord names,
key signatures and other MusicXML content remain intact. The state is temporary.
Reset restores both original key and register. Returning to Library clears the
key/register and rendered-score state; reopening the same or a different song
starts at the top with original key/register. Parsed source assets stay cached.
Library preferences and global navigation preferences remain unchanged.

The toolbar is one 54px-high row at tested widths 375, 390, 650, 768, 820, 1180
and 1440px, excluding safe-area insets and the optional navigation strip. Phone
utility, pitch, octave and Reset buttons are 40px wide and 44px high; iPad pitch
buttons remain 88px wide (72px in intermediate 601-740px windows). Score-frame,
print behavior and safe-area/bottom clearance remain unchanged.

Validation: tests/octave-controls.mjs checks the four original songs, dense key
signatures, note-only register changes, combined key/register operations, exact
Reset, print, no refetch and responsive geometry. tests/song-session.mjs checks
the exact cycle/labels, song exit/reopening, retained preferences and PDF exclusion.
These use desktop Chromium with device-sized viewports; physical Safari testing
remains recommended.

### Plain-text Library dropdowns and restrained color

Native Filter/Sort/List selects keep their options, keyboard and touch behavior,
but have transparent backgrounds, no borders, and a small SVG chevron. A
presentation-only canvas measurement sizes each select to its current text;
CSS caps long names and wraps the utility row. Manage/Reorder are text actions.
Search is the only boxed header input and keeps its 420px maximum and 16px text.
All controls retain 44px height; keyboard focus remains a compact 2px ring.

Library-only palette: blue-gray #536B7A, thin maroon divider #7A3E46, active
Favorite star #8A6419, current-song background #EEF3F6, inactive star #61716F.
The warm #EEEEE8 page background and dark #233331 title/song text remain.
Current-song text and Favorite aria-pressed state supplement the colors.

Relative to the preceding compact header, first rows move from 199 to 140px
on iPad portrait, 149 to 140px on landscape/desktop, and 242 to 181px (All)
or 227px (Favorites) on 375px iPhone. Long labels can require a second utility
row. Search/filters/order semantics, the octave feature and score assets are
unchanged. Verified with library-compact, library-theme, library-discovery,
list-ordering and octave-controls tests; responsive tests simulate device sizes.

### Library header background and side frame

The unified header wrapper uses #EEF2F4 behind the eyebrow, title, controls and
result count. The existing 1px maroon horizontal divider remains. Results reuse
the score frame variables: outer #4B6E88 at 2px, inner #7A3E46 at 1px, with a 3px
gap (1px at <=600px). Only left/right double lines are added; no bottom frame or
new per-row borders. Decorative pseudo-elements use pointer-events:none.

Header height is unchanged: first song remains at 140px on the tested iPad and
desktop sizes, 181px for phone All and 227px for phone Favorites. Side framing
uses 6px per edge on larger screens and 4px per edge on phones. Existing current
row highlighting, transparent selects, touch targets and score-view styling remain.
Library compact/theme/discovery and list ordering/touch tests pass, including
responsive overflow, drag cancellation and offline order persistence.

### Icon utilities and simplified list management

Filter is a funnel SVG and Sort is stacked lines with a down arrow. Each is a
44px native-select touch target with accessible label, keyboard focus, selected
value tooltip and a small maroon dot when not using the context's default.
Search, plain List selector and the compact utility strip share a row when they
fit; phones wrap Search above the utility controls. The count stays at the right.

List begins with Manage lists…, followed by the native Your lists option group
containing All lists and saved lists. The management action restores the active
selection before opening the dialog; it does not alter filter, sort or membership.
No standalone Manage or plus remains in the main Library. Song membership uses
a checklist icon. Creating a list occurs only in Manage; membership dialogs link
to it without implicitly adding a song. Users explicitly check desired memberships.

Create immediately finishes naming and shows plain-text Your lists rows.
Rename alone reveals one input with Save/Cancel (Enter saves, Escape cancels).
Stable IDs, membership arrays, Favorites and per-list ordering are unchanged.
Delete retains its existing list-only behavior. Previously saved data is preserved.

Measured first-row positions: 118px on iPad/desktop (22px recovered); 157px at
375px phone width (24px recovered for All, 70px for Favorites). Long names may
wrap the utilities. Background, palette and double side frame are preserved.
Local tests: list-management, library-compact, library-discovery, list-ordering,
list-touch, pdf-scores and octave-controls pass. Responsive checks simulate device
sizes; physical Safari testing remains recommended.

### Song-row secondary actions

The former plus/checklist control opened custom-list membership directly. It is
now a compact ellipsis opening a concise, keyboard-accessible actions dialog:
Add to list… opens the unchanged membership checkboxes; Remove from this list
appears only when viewing a custom list and removes only that list membership.
The Favorite star remains visible. Reorder handles/buttons are unchanged.

The secondary action's layout footprint shrinks from 46px to 32px, giving the
title/metadata area 14px more width. Its actual touch target remains 44×44px.
No former empty plus slot remains. Tested at 320/375/820/1180/1440px without
horizontal overflow; keyboard Enter/Escape and focus return pass. Existing
ordering, touch-drag, search, PDF/MXL and print regressions pass. No song assets,
transposition or octave logic changed. The actions dialog is excluded from print.

### Final conservative release polish

Confirmed previous deployment 0e56127 complete and audited the actual live UI
before editing. Header background is now #E2E8EC, ending at the results divider;
rows and the 2px #4B6E88 / 1px #7A3E46 side frame (3px/1px gap) are unchanged.
Blue-gray #536B7A header text has 4.53:1 contrast. No extra header height was added.

App dialog headings use compact 20px system typography (song-actions retains its
18px heading). Generic button focus now uses a 2px blue-gray ring instead of the
old 3px orange ring. Engraved score fonts are untouched. Removed only obsolete
.song-lists CSS. No new controls or renderer/storage rewrites.

List deletion now confirms by name and states that songs, Favorites and other
lists are unaffected. Cancel and accept are tested. Startup/asset failure wording
is concise; startup failure is visible in Library. Successful retries clear stale
failure text, and loading announces Loading score. Unsupported Page Turns copy
was simplified without changing its unavailable state.

Release verification covers four responsive layouts, Library/Favorites/custom
ordered lists, Manage/rename/cancel/delete, native menu keyboard access, both PDFs,
Nativity and HHC structured scores, Settings/key panels, transposition and octave
combinations/reset, touch ordering, print, PDF hybrid/auto-scroll/Original PDF,
metadata-only startup, no repeated score fetch on transformations, and no normal
page errors. Error tests deliberately simulate asset/startup failures. Cache v23
retains scoped cleanup/current-cache-only offline behavior; stale cache isolation
and offline score reopening pass. No new cache mechanism was introduced.

Intentionally unchanged: source assets, musical content, score layout, existing
clefs/ledger-line limitations, unavailable page turns, forthcoming transition
chords, storage keys and local-only preferences. Tests use responsive desktop
browser viewports, not physical Safari hardware. tests/release-audit.mjs records
before/after screenshots; tests/release-states.mjs covers failures/retry/contrast.

### Phone responsive engraving

At viewport widths <=600px the existing OSMD 2.1.2 engraver uses the actual
score clientWidth for its staging container, keeps Zoom at 0.78 and sets
EngravingRules.PageLeftMargin/PageRightMargin to 0.8 instead of 5 units.
OSMD derives sheet.pageWidth = container.offsetWidth / Zoom / 10 and calls
GraphicSheet.reCalculate() during render(), so the added usable system width
changes measure packing rather than scaling finished SVGs. At 360px content
width the system budget grows from about 282px to 348px. Amazing Grace changed
from 12 systems to 8 in the same notation size; actual trimmed score height
fell from 3115px to 2165px. Other scores improve according to measure density.

Screen format remains OSMD's undefined/endless page format. Existing automatic
system breaking remains enabled: NewSystemAtXMLNewSystemAttribute,
NewSystemAtXMLNewPageAttribute and NewPageAtXMLNewPageAttribute are false;
RenderXMeasuresPerLineAkaSystem is zero. Printed layout hints do not force
screen systems. Musical measure order, repeats and notation are unchanged, and
original source assets are never edited. Print uses its separate A4 engraver.

The existing 140ms ResizeObserver debounce re-engraves at the new content width.
The already-loaded OSMD model is reused if transformed XML has not changed;
parsed assets and width/key/register render caches remain in use. Width changes
do not refetch scores. Above 600px the original 5-unit engraving margins and
existing notation-size rules are restored. PDFs are unchanged.

The prior pinch transform, gesture interception and fit icon are removed.
Normal scrolling and browser accessibility gestures are available. Navigation
continues to pause auto-scroll when rendering changes. The score-size control
below builds on this responsive engraving.

Validation: tests/phone-reflow.mjs compares against b25d67d for seven scores,
exact source XML and print path geometry, phone and larger widths, key/octave/
Reset, orientation with no refetch, hybrid, auto-scroll and PDFs. At 390px,
height reductions were 30% Amazing Grace, 28% Give Said the Little Stream,
19% Nativity, 2% Shepherd, 28% Faithful, approximately 0% Silent Night and 11%
Come Thou Fount (HHC 1001). Larger-screen dimensions matched the prior release.
Tests emulate viewports in Chromium; physical Safari testing is still advised.

### Phone score-size control

At viewport widths <=600px, a 44x44px page icon below the source metadata cycles
Normal -> Compact -> Large -> Normal. Its N/C/L indicator, accessible label and
tooltip report state. It is hidden for PDFs and on larger layouts.

OSMD Zoom is 0.78 / 0.62 / 0.94 respectively (about 20% smaller/larger notation),
with actual content width and the existing 0.8-unit phone engraving margins.
These values feed OSMD's page-width calculation and render/reCalculate pass;
no CSS transforms or browser zoom are used. Cache keys include engraving density.
The in-memory model and score assets are reused. Wider screens retain prior
engraving settings, while the selected phone density is remembered on rotation.

Size is temporary and resets to Normal when opening/exiting a song. Musical
Reset preserves it. Source XML and the separate print pipeline are unchanged.
At 390px Amazing Grace has 8 Normal, 6 Compact and 11 Large systems. Nativity
has 11/7/14, and Oh Come All Ye Faithful has 13/8/19. Visual captures and
regressions are generated by tests/score-density.mjs, including seven songs,
exact print path/source equality, transpose/octave/Reset, viewport changes and
PDF exclusion. Device-sized Chromium testing does not replace physical Safari.

### Integrated Lyrics view

Each song remains one catalog record. Compact Score and Lyrics actions open its
two views; Lyrics is omitted when extraction is unavailable or structurally
ambiguous. The score header has a Lyrics button beside the phone size control.
Switching to lyrics and back retains the rendered score and musical state.
Direct Library-to-Lyrics opens normalized text without unpacking an MXL.
Leaving for Library resets temporary song state, theme and font size.

lyrics-view.js exports a reusable data loader and DOM renderer. assets/lyrics.json
is schemaVersion 1 with stable id, canonical title, collection, number, verses,
refrains, source path, source text blocks, extraction status, notes and availability.
lyrics-index.js is a small availability index; the JSON is fetched once on first
Lyrics use and cached for offline use by the service worker. No catalog duplicates.

The standalone Python extractor tools/extract-lyrics.py accepts a JSON song catalog
and reads only bundled MXL files. MusicXML syllabic and elision elements are joined,
verse numbers retained, identical streams deduplicated, explicit Chorus/Refrain
markers separated, and numbered credit blocks included. Standalone lyric dashes
used as engraving placeholders are omitted; punctuation within words is retained.
Substantial unlabeled first-row endings are separated as candidates with a visible
review notice. Repeats, rounds and combined vocal parts are not fabricated.

Audit: 119 structured scores contain lyric text. 78 have no detected structural
warnings (not independently proofread). 41 need review: 26 expose usable text with
shared-ending notices; 15 conflicting/multipart extractions are withheld from UI.
104 Lyrics views are available. 105 records contain multiple distinct verse numbers; 11
have explicit refrain markers and 30 others have shared-ending candidates. Two
PDF-only songs have no structured lyrics. Full details: lyrics-extraction-audit.json.
A Child's Prayer is withheld because its combined-part reprise is fragmentary;
I Am a Child of God has conflicting verse-4 streams. Original text remains in the
derived dataset for review, not silently discarded or advertised as verified.

Theme uses Primary's half-disc two-state interaction and dark surface #0B0D0E /
light text #F7FAFB (source app read-only). Lyrics use system font, 19/24/30px body
sizes, Medium default, and a 780px maximum reading column. Theme/font controls
are independent of score controls. Exact numeric page matches are ranked first;
existing title, alias, collection, filter and sort matching remains available.
Lyrics UI never appears in score print output. Existing source/copyright records
and the normal score print pipeline are preserved. Physical Safari remains a
recommended device check; viewport, keyboard, paired-view and offline tests run
in isolated browser profiles without touching the user's saved lists.

Rebuild derived lyrics from the current catalog with `node tools/build-lyrics.mjs`.
Set the PYTHON environment variable to a Python executable if needed. The build
uses only local assets; it is not a runtime or deployment prerequisite.

Lyrics now defaults to near-black (#0B0D0E). Medium body text is 22px on phones
(<=600px), retaining 24px on larger screens. The simple double frame uses 2px
muted blue-gray and 1px warm gold lines (#6F8A9C / #A58A55), and the score palette on
white (#4B6E88 / #7A3E46), separated by a 3px inset. Lyrics controls stay outside
the frame; score styling and print remain unchanged.

Optional Lyrics Fun mode uses the sparkle button (off by default). A view-scoped,
aria-hidden overlay draws one half/quarter/eighth/sixteenth or beamed eighth/sixteenth-pair SVG target, with slow
upper-area drift. Taps under 450ms and within 8px fire an always-hit edge beam and
400ms burst; scrolling, dragging, multi-touch and controls do not fire. The next
note waits 5–10 seconds after a hit. Reduced motion keeps the note stationary
and uses fading sparks. Leaving Lyrics cancels timers/frames/listeners and resets
Fun off. Theme/font changes preserve the target and respawn schedule. No audio,
score data changes, storage or print effects. Offline cache includes the module.

Floating targets inherit the active lyric text color; bursts stay colorful. The Lyrics action uses a custom stroked script-L SVG with the accessible name Open lyrics and tooltip Lyrics. Score icons and interaction behavior are unchanged.

Fun targets now size their SVG box to 1.4 times the active lyric font size; the
visible artwork occupies about 1.05–1.15 times that font size (roughly 24px with
the 22px phone default). Every valid tap fires: targetless shots choose a random
left/right origin and safe visible-content destination, last 280ms, and never
change the target spawn timer. Hits retain the 400ms burst and 5–10 second wait.
At most six short-lived effects coexist; older effects are removed on rapid taps.
All effect timers are explicitly cleared when Fun mode stops.

## Local score playback

Structured-score titles now include a 44px speaker control in Score and Lyrics.
Tap cycles Play / Pause / Resume. Hold for 600ms (or right-click / Shift+F10) to
stop and rewind; the next Play starts at the beginning. Escape on the control
also stops. Returning to Library or changing song stops immediately. Changing
key or octave stops audio; the next Play parses the displayed MusicXML, ensuring
sound follows the current notation. Score/Lyrics switching preserves playback.

The local playback.js module builds a quarter-note timeline across all pitched
parts, staves and voices, including chords, backup/forward, rests, ties and tempo
changes. Durations encode dotted/tuplet timing directly. Every measure is played
once in written order: repeats, endings, D.C./D.S., additional lyric verses,
ornaments, grace notes and expressive fermata/rubato are not performed. Harmony
symbols are not synthesized as extra notes beyond the written accompaniment.
This is a practice reference, not a performance recording.

One lazily-created Web Audio AudioContext uses triangle oscillators with a soft
attack/decay envelope and output compressor. A 25ms scheduler queues 200ms ahead
on the audio clock. Pause stops nodes and retains position; resume includes any
sustained notes at that position. The first user tap creates/resumes audio before
awaiting a score fetch. Backgrounding pauses rather than attempting lock-screen
playback. Source MXL and timelines are reused; no MP3, soundfont or external audio
request is made. playback.js is in the offline cache.

All 119 structured scores parsed successfully (playback-audit.json). All contain
an initial tempo; none currently use the 90-quarter-notes/minute fallback. PDF
songs have no playback control. Browser tests cover the eight requested songs,
major/minor, multi-staff notes, a chord/tie/tempo fixture, actual oscillator
frequencies after key shifts, octave/reset, pause/resume/stop/natural ending,
paired views, offline playback, and 390/820/1180/1440px layouts. Print hides the
control and keeps the existing print renderer. Physical iOS audio output and
listening-quality assessment remain device checks, not claimed by browser tests.

Implementation references: [MusicXML durations](https://www.w3.org/2021/06/musicxml40/musicxml-reference/elements/duration/),
[MusicXML sound tempo](https://www.w3.org/2021/06/musicxml40/musicxml-reference/elements/sound/),
and the [Web Audio specification](https://www.w3.org/TR/webaudio-1.0/).

## Current UI/navigation refinement

The header now stacks collection/page below the title, with score-size/Lyrics
controls at upper right. Lyrics uses a text-and-note SVG; Settings uses a cog.
Octave is in Settings (Original / 8va / 8vb); compact chevrons join the key control.
Return to Start appears after scrolling 100px in Continuous mode. Actual PDF
Page Turns supports left/right taps, buttons and keyboard/pedal keys with no wrap;
MXL retains continuous/hybrid navigation because its engraving has no real pages.
Fun settings now offer 1–4 targets, 2–4 second arrivals and one travelling shot at
a time. Free shots exit the opposite edge. These supersede earlier UI/Fun behavior
notes above. See reports/ui-navigation-refinement.md for measurements and tests.

## Virtual performance page turns

MXL now supports Page Turns using complete OSMD systems, with the same tap zones,
buttons and keyboard/pedal commands as PDFs. Page grouping adapts to viewport,
notation size, key and octave; it preserves the current measure where possible.
Page changes do not re-render or fetch. Supplementary verses remain on final
text pages. Continuous Scroll and Auto-scroll remain; Hybrid is no longer a
visible choice. This supersedes earlier notes saying MXL page turns are unavailable.
See `reports/virtual-page-turns.md` for implementation, tests and device caveats.

## Score density on iPad and desktop

The existing Small / Normal / Large popover now controls real OSMD reflow on all
MXL screen sizes. Normal retains the previous baseline; Small/Large change the
logical page width before automatic system layout. Density persists across key,
octave and viewport changes, and new system bounds rebuild virtual pages. Print
and PDFs are unchanged. See `reports/score-density-reflow.md` for actual system,
first-measure and virtual-page counts, including the Little Stream acceptance case.
