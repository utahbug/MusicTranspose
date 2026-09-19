# Browser Back/Forward navigation

Starting commit: `1a8ac614b7c0f85d642741565f280788201f1a46`.
Repository: existing MusicTranspose, `codex/pages`, remote `https://github.com/utahbug/MusicTranspose.git`. Initial worktree clean.

## Root cause and prior behavior

The application used manual hidden/view classes and callbacks. It had no pushState, replaceState, popstate, pathname router, or song query/hash deep-link implementation. Opening a song did not add an app history entry. Browser Back therefore left the app for whatever document preceded it, including a stale/nonexistent GitHub Pages URL. No current application code was found constructing such a path. The exact earlier 404 URL was not supplied, so this audit does not attribute its creation to an unobserved route generator.

## History architecture and URL strategy

`view-history.js` is a small state-only coordinator, not a router framework. History state is namespaced under `musicTransposeNavigation`, version 1. Routes hold a meaningful view (`library`, `lists`, `files`, `score`, `lyrics`), stable song/list identifiers, origin context, Library query/source/filter/order, and approximate scroll position. No song bytes or large catalog data are copied into history.

Initial entry is replaced, never artificially pushed. Meaningful navigation pushes one entry. Repeated opening of the same view/identity is deduplicated. Search, filters, sorting and scroll update the current entry; key, octave, size, playback, page flips, Settings and Lyrics Fun do not create entries. Scroll updates are debounced by 200ms and unchanged state writes are skipped to avoid excessive History API calls on Safari.

Neither pushState nor replaceState supplies a new URL. The existing valid app pathname, query and hash stay unchanged. GitHub Pages only serves the real app URL; no rewrites, fallback 404 page, or invented `/song/...` routes are required. No previous direct-song links existed to preserve. Sharing/bookmarking the URL remains normal app entry; a song route is tab history state, not a new shareable deep-link format.

## Restoration

- Library → Score → Back restores Library; Forward reopens the score.
- Favorites, source/My Music filter, search and A–Z/123 context are restored with the Library entry.
- Lists overview and specific list are separate entries. A list-opened song returns to that list, retaining stable ID, current name/order and approximate scroll. Internal Back to list continues working.
- Score/Lyrics switches are meaningful entries and restore the prior paired view. Same-song playback follows existing shared-view behavior. Leaving the song stops playback immediately, including Back during an in-flight load.
- Files is a real historical view. My Music remains a Library source, not a separate duplicate catalog.
- Refresh restores the current tab’s historical view after local catalog initialization. It uses the real app URL and therefore does not request a nonexistent physical route.
- Deleted/missing local or published song IDs fall back to Library. Deleted lists fall back to Lists overview. A Lyrics route without available lyrics falls back to Score. Failed asset opening uses the existing error message and clean Library/playback fallback.
- Popstate restoration suppresses new history pushes, waits for the current render/load to finish, and coalesces rapid requests so the newest traversal wins. Modal dialogs are closed when restoring another view.
- Back from the initial entry leaves for the previous external page normally. There is no sentinel/trapping entry.

## Tests

`tests/browser-history.mjs` covers the requested A–I paths plus Files, external Back/Forward, real Library scroll restoration, rapid traversal, Back during asset loading, and unavailable-asset fallback. It verifies unchanged pathname, no history growth for musical changes/scrolling, local import/reload/deletion, offline refresh/Back/Forward, and Lyrics switching.

Responsive viewport matrix: iPad landscape 1180×820, iPad portrait 820×1180, iPhone 390×844 and desktop 1440×1000. Tests use Edge/Chromium with touch emulation for tablet/phone sizes. These are Safari-style viewport tests, not physical iOS Safari certification.

Existing Library, Lists, My Music, playback, performance-navigation and Lyrics regressions passed. Four old tests were updated only where their assumption that reload always returns to Library was superseded by deliberate view restoration. Existing assertions for sorting/filtering, ordering/membership, private import persistence, score/PDF rendering, transposition/reset, octave, print exclusion/preparation, playback, page zones, keyboard navigation and offline behavior remain.

Offline support uses the unchanged app-shell cache architecture; the new module is included in shell caching and the worker version is v73. No catalog, score assets, styles, storage schemas or external runtime dependencies changed.

## Limitations

Returning Forward after leaving a song starts its normal temporary musical session; key/octave/score-size are not permanent historical preferences. Approximate pixel scroll may be clamped after an orientation/layout change. An uncached score remains unavailable offline and falls back cleanly; history cannot make unavailable assets available. The app cannot rewrite an invalid URL already elsewhere in a browser’s external history, and must not trap Back to conceal it. Normal app-created entries all retain the valid application path.

## Changed files and deployment

Runtime: `view-history.js`, `library.js`, `lists-view.js`, `app.js`, `sw.js`.
Tests: `tests/browser-history.mjs`, plus reload expectations in `library-simplified.mjs`, `lists-page.mjs`, `performance-navigation.mjs`, `playback.mjs`.
Documentation: this report.

Deploy through the existing `codex/pages` root Pages source. The final deployed hash, workflow result, live acceptance and clean worktree check are recorded in the task completion response.
