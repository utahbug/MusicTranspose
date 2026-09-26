# Temporary Library Lead filter - 2026-09-26

Verified git root, remote and clean status for the existing utahbug/MusicTranspose repository before edits. No Lead extraction, engraving, Advanced Settings or continuous-navigation work is included.

## Behavior

The last anchored More-menu item is a checkbox-style Lead sheets (N) action. The count is calculated from all current catalog songs with catalog.supportsLead; it is not hard-coded or reduced by the active search/source/List. Bundled songs use the existing generated bundledLeadIds index. Imported MusicXML is checked with the unchanged createLeadXML extractor when the local catalog refreshes. PDF, missing and unsupported sources are excluded. Regenerating the bundled availability index automatically updates the shortcut without replacing its implementation.

Chosen behavior: A, filter within the current Library/List context. Lead-only is an additional predicate before the existing search/source filtering and sorting. Normal Song/Score, Lyrics and Favorite rows are unchanged; Lead is accessed through the existing score View menu. No Lead column, heading, disabled song icons or separate browser was added.

The existing compact heading context displays Lead sheets, or List + Lead while a List is active, including at 320px. More marks the active item with a check. Selecting the item again removes only Lead filtering and preserves search/source/List/sort. The existing Clear (x) clears both search and Lead filtering; its accessible name/title says so while active. Source changes continue to intersect the Lead filter. Switching Lists restores each context's remembered filters, as before.

Lead-only is included in the established workspace/history snapshot and restores on return from Score/Lead/Lyrics, reload and offline use. It never writes List membership/order or Favorites. Edit order and completion of Add Songs clear Lead filtering alongside existing filter resets so the full ordered List and newly added songs remain visible. The menu action is disabled while editing order.

## Files

- catalog.js: common capability predicate; derive imported capability with the existing extractor.
- library.js: filter, count, compact state indication and existing workspace persistence.
- index.html: final More-menu action.
- styles.css: keep the active compact context label visible on narrow screens.
- sw.js: offline shell v98, retaining existing downloaded scores.
- tests/library-lead-filter.mjs: six-size focused regression coverage.
- tests/library-cleanup.mjs: keyboard End now reaches the new last menu item.
- reports/library-lead-filter.md: this report.

## Validation

The app is static production HTML/CSS/JS with no compilation step. Browser tests serve those files using the existing local server at http://127.0.0.1:8771/. Tests use headless Edge/Chromium with touch emulation, not physical iPhone/Safari hardware.

Responsive sizes: 320x568, 390x844, 430x932, 844x390, 820x1180 and 1440x1000. The focused suite verifies anchored on-screen placement, a 44px last item, dynamic count, exact supported IDs, unsupported exclusion, visible compact state/no overflow, search/source/List intersection, Favorites, title/number/manual sorting, unchanged saved List sequence, Score/Lead/Lyrics returns, reload, imported capability and offline access. Screenshots/JSON are in ignored test-results/.

All regression suites passed:

- library-lead-filter: all six sizes; bundled count 34, imported supported score increases count to 35, unsupported imported score excluded, offline count/filter/opening preserved.
- library-priority5 and library-cleanup: six sizes each; existing menu utilities, Favorites, sorting, source/List selection, sticky layout and offline behavior.
- lists-workspace: six sizes; CRUD, Add Songs, manual/drag/button order, persistence, Score/Lyrics/Lead returns and offline.
- lists-workspace-context: four sizes; long-list scrolling, context isolation and reload restoration.
- measure-sync: 162 cases, including all 19 previously affected songs and eight controls.
- chord-harmony: 7,288 checks, catalog audit, real rendered/printed harmony and offline transposition.
- lead-view and lead-state: 679-score audit, all 34 supported renders, six responsive layouts, source fidelity, conservative fallback, playback, print, navigation and offline.
- score-reliability: six sizes; MXL/PDF navigation, gestures/controls, playback, metadata, transposition, Lyrics and offline.
- settings-help: six sizes; metadata digits, key layout/picker, overlay labels/geometry/dismissal.
- lyrics-cleanup: six sizes; shared Library/List state, hidden touch/mouse/keyboard entry, Stop, appearance/session and offline.
- lyrics-hold: exact two-second threshold, gesture cancellation, preference persistence and immediate exit.
- git diff --check: clean.

An initial regression run was interrupted by local HTTP connection exhaustion during repeated catalog warm-up. The same unmodified static server was run with HTTP/1.1 persistent connections for the successful remaining run; no production networking changes were made.

Normal GitHub Pages deployment and live verification are reported with the final commit.
