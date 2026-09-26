# Score / Settings cleanup - 2026-09-26

The existing utahbug/MusicTranspose repository and codex/pages branch were verified with git root, remotes, and clean status before edits. No other backlog work is included.

## Changes

- Removed the header Tap Zones button. Source/page metadata now has 8px additional right margin (10px total gap on phones, 14px on larger layouts) before Lyrics.
- Settings > Score navigation now contains Tap Zones in place of View diagram. Removed the unfinished transition-chord fieldset.
- Consolidated the old separate miniature diagram and score overlay into one real-score overlay, owned by settings-help.js. Opening help closes Settings; dismissing returns focus to the visible Settings button without scrolling. It dismisses by tap/click, outside click, Escape, or the existing eight-second timeout, and on resize, scroll, printing, or leaving the score.
- Help never changes navigation preferences or toggles navigation. Pointer navigation retains all existing control exclusions and stale-gesture cancellation.
- MXL uses the existing PrimarySongs upper 25% / lower 75% geometry. PDF navigation remains unchanged at its existing upper 50% / lower 50%; the overlay uses the same geometry function as actual navigation for both.
- Labels now read Skip to first page, Skip to last page, Previous page, Next page; centered text can wrap on narrow screens.
- Original key is plain, left-aligned text above the Current Key border, with a 2px gap. Current Key retains a 44px touch target. The measured score footer is 68px (14px growth); existing safe-area padding and footer-height tracking continue to reserve score space.
- Updated offline shell cache to v97; existing downloaded score bytes are retained by the established service-worker migration.

## Files

Production: index.html, styles.css, settings-help.js, score-taps.js, navigation.js, sw.js.
Tests: tests/settings-help.mjs, tests/score-reliability.mjs, tests/lead-state.mjs.
Report: reports/score-settings-cleanup.md.

## Validation

Production is the static app; no compilation step is required. Tested through the existing local production server at http://127.0.0.1:8768/ using headless Microsoft Edge/Chromium and emulated touch. These are browser/device emulations, not physical iPhone or Safari tests.

Responsive viewports: 320x568, 390x844, 430x932, 844x390, 820x1180, 1440x1000. Metadata digit fixtures cover 2, 52, 182, 332; real-song metadata is also verified by the navigation suite. Assertions cover no clipping/overflow, 44px controls, Original/Current alignment, overlay labels/geometry/dismissal, and unchanged navigation preference. Screenshots and JSON evidence are written under ignored test-results/.

The tablet navigation fixture now uses the longer cs-110 score because the reclaimed header space allows Nativity to fit one tablet page.

All local regression suites passed:

- settings-help: six viewport sizes, all four page-number fixtures, key-picker interaction, overlay dismissal/focus and unchanged mode.
- score-reliability: six sizes, mouse/touch, repeat taps and rejected gestures, controls/playback, metadata/transposition, Lyrics, Lead, PDF, continuous mode and offline.
- measure-sync: 162 cases, including all 19 previously affected songs and eight controls.
- chord-harmony: 7,288 assertions; catalog audit and real rendered/printed optional/slash harmony across destination keys and offline.
- lead-view and lead-state: 679-score audit, all 34 supported renders, six responsive layouts, conservative fallback, timing/lyrics/harmony, state, print, touch and offline.
- library-priority5 and library-cleanup: six sizes each; sticky layout, search, sorting, sources, Favorites, More, conditional Lead and offline.
- lists-workspace: six sizes; CRUD, Add, manual/drag/button order, persistence and Score/Lyrics/Lead returns.
- lists-workspace-context: four sizes; long-list scroll, touch, context isolation and fresh-tab restoration.
- lyrics-cleanup: six sizes; shared Library/List context, hidden touch/mouse/keyboard entry, Stop, appearance/session and offline.
- lyrics-hold: exact two-second activation, cancellation, note-count preference and exit.
- score-lyrics-toggle: five sizes; same-coordinate repeated touch, keyboard focus, playback/key/page state and resize.
- git diff --check: clean.

The initial long-list run was interrupted by local HTTP connection exhaustion (ERR_ADDRESS_IN_USE), followed by console-output congestion on the replacement server. Remaining tests passed using the same production files on port 8770 with server logs redirected to test-results/score-settings-server.log. No application change was required for that test-infrastructure interruption.

GitHub Pages publishing source confirmed: codex/pages, repository root. Deployment and live verification are reported with the final commit.
