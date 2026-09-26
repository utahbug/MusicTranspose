# Library cleanup — 2026-09-26

Repository: `utahbug/MusicTranspose`, existing `codex/pages` branch. Root, remote, and clean working tree were verified before editing.

## Interface

- Library rows are **Song / Score | Lyrics | Favorite**. The title opens Score. Score and Lead buttons and their reserved column widths are removed; Favorites remain 44px touch targets at the far right.
- Search, Clear, and More form the first sticky row. Source, Lists, and Sort form the second. Source/List controls size to their selected labels within responsive limits.
- Sort uses a native accessible select, with **A–Z** or **#** as its compact closed label and **Title** / **Song number** options. Active Lists also offer **Manual order** (closed label: **Order**). Temporary sorting never writes the saved List sequence.
- Wider layouts retain **Song / Score | Lyrics** headings. Phone portrait and short phone landscape layouts hide this noninteractive heading row. List editing actions and status messages sit below the sticky block, keeping it at two rows even with an active List.
- More is an anchored, content-sized dropdown containing **Files / My Music**, **Import music**, and the preserved **Favorites first** ordering option. It closes on selection, outside pointer interaction, Escape, or Tab. Arrow keys/Home/End move through its items; Escape returns focus to More. Position updates on scroll/resize and stays inside the viewport.

## Lead

The existing conservative extractor checks the current source when loading a score, including imports. Only a supported song exposes Lead in its View menu. Unsupported saved/requested Lead state resolves to Normal before rendering and updates the saved preference. A Lead engraving failure also resolves to Normal. No Lead-unavailable banner or warning is rendered. PDF fallback remains available under its existing conditions.

Extraction, engraving, and musical source data were not changed. The full catalog audit still finds **34 supported scores out of 679 structured scores**. Internal extractor diagnostics remain available.

## State and Lists

Favorites, source/search/sort preferences, active List contexts, manual order, history, return scroll position, and existing List storage retain their previous model. Add Songs, drag and button reorder, rename/delete/create, and missing-song handling use the existing Priority #6 paths. Returning to Library does not focus Search.

## Responsive verification

Automated Chromium/Edge browser tests use touch input for phone/tablet sizes and mouse/keyboard for desktop. Screenshots were inspected at phone and tablet/desktop sizes. These are browser-emulated layouts, not physical iOS/Safari device tests.

| Viewport | Sticky height | Title column | Result |
| --- | ---: | ---: | --- |
| 320 × 568 | 94px | 216px | Passed |
| 390 × 844 | 94px | 286px | Passed |
| 430 × 932 | 94px | 326px | Passed |
| 844 × 390 | 94px | 708px | Passed |
| 820 × 1180 | 136px | 684px | Passed |
| 1440 × 1000 | 136px | 944px | Passed |

No horizontal overflow, overlapping controls, header wrapping, or off-screen More menus were found. Phone title width gains 88px by removing two action columns. Safe-area padding remains in place.

## Files

Production: `app.js`, `index.html`, `library.js`, `styles.css`, `sw.js` (cache version v95).

New regression: `tests/library-cleanup.mjs`.

Existing regressions adapted to the requested controls: `tests/library-priority5.mjs`, `tests/library-search-focus.mjs`, `tests/lists-workspace.mjs`, `tests/lists-workspace-context.mjs`, `tests/lead-view.mjs`, `tests/lead-state.mjs`, `tests/measure-sync.mjs`, `tests/score-reliability.mjs`. Assertions for the removed controls were replaced by title opening, the sort select, More-menu access, conditional Lead, and quiet legacy fallback. Lyric synchronization retains its legacy-request coverage.

The repository is a static production app with no compilation/package build step. Tests run the actual app through its existing HTTP server, including service-worker installation, reload, and offline behavior. GitHub Pages uses `codex/pages` at `/` through its existing normal deployment.

## Automated checks

- `library-cleanup.mjs`: six viewports; removed columns, far-right Favorite targets, compact sort, two-row phone headers, anchored More geometry/keyboard/outside dismissal, conditional Lead, explicit legacy request and saved-state repair, supported/unsupported local imports.
- `library-priority5.mjs`: six viewports; source/filter/sort/Favorite state, Search/Clear/More, Lists, title/Score/Lyrics/Lead access, local import management, return context, sticky scroll, offline reload.
- `lists-workspace.mjs`: six viewports; create/rename/delete, counts, persistent picker action, add/remove, touch and mouse drag, keyboard/button reorder, saved manual order, temporary sorts, Score/Lyrics/Lead return, reload/fresh tab/history/offline.
- `lists-workspace-context.mjs`: four viewports; 70-song List scrolling, non-drag native touch scroll, return/fresh-tab scroll restoration, source/search/sort isolation, Add cancel and edit-order behavior.
- `library-search-focus.mjs`: four viewports; explicit-only Search focus, Home/Back/Forward, Lyrics, Favorites, Lists, Files, BFCache cleanup, return scroll, offline.
- `lead-view.mjs`: all 679 structured scores audited; all 34 supported Leads rendered; real score/transposition/Normal/Lead/print/quiet-fallback checks at six viewports.
- `lead-state.mjs`: conservative voice/staff selection, stacked/optional/slash chords, active List/Favorite/key preservation, playback during view changes, Lead/PDF/Normal, print source, touch navigation, offline Lead transposition.
- `measure-sync.mjs`: 162 cases; all 19 affected scores plus eight controls, five layouts, normal/legacy-Lead fallback/auto/print/transposition and synthetic ownership checks.
- `chord-harmony.mjs`: 7,288 grammar/key/punctuation/root/bass checks; catalog audit of 7,300 structured harmonies, 635 slash chords, 145 optional text chords, 156 total parsed text chords; real-song screen/print/reset checks at four layouts plus offline transposition.
- `score-reliability.mjs`: all six viewports; mouse/touch navigation, rejected stale/duplicate/control taps, metadata/key behavior, overlays, Lyrics, playback, Lead, PDF, and offline.

All listed local suites passed. `git diff --check` passed. No subsequent backlog work was started.
