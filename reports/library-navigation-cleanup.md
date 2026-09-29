# Small Library navigation cleanup

## Scope

Repository root/origin verified before editing. Only Library navigation/presentation changed.
Score, Lyrics, annotation, taps, playback, search indexing and import implementations are unchanged.

## Implementation

- `#library-source-label` now has `font-weight:600`. The Source prefix retains its inherited 400 weight; control height, colors and spacing are unchanged. Shared label covers bundled sources, My Music and Lists.
- Removed the Lyrics / Lead heading, row shortcut buttons, blank slots, icon import and obsolete shortcut styles. The shared row grid is now title + 44px Favorite; List editing tools still span the full row. Actual Lyrics/Lead capabilities and routing remain intact.
- Search uses a positioned wrapper with the existing `#library-clear` button inside its right edge. The input keeps an explicit accessible label and 44px right padding. The clear target is 44x44 with a 22px glyph, `aria-label="Clear search"`, and is hidden only when the raw input is empty.
- Clear uses the existing render path, then focuses Search with `preventScroll`. Escape from nonempty Search calls the same action. Source/List/Sort/search-scope state is retained.
- Search row is capped at 588px: 500px input + 44px Scope + 44px More. At <=600px the cap is removed and the input fills the available width beside those controls. Header/control heights are unchanged.
- Service worker cache v133 delivers the updated existing files; no new production module.

## Files

Production: `index.html`, `library.js`, `styles.css`, `sw.js`.
Tests: `tests/library-header.mjs`, `tests/library-search-focus.mjs`, `tests/row-actions.mjs`, `tests/lists-workspace-context.mjs`.
Report: this file.

Older tests targeted obsolete Source/List selects or row menus. Updated them to current Source-menu, Filter-menu and Edit order controls. The header test reaches Lyrics from the song view instead of the removed Library shortcut.

## Verification

Local server: `http://127.0.0.1:8780/`; bundled Playwright, Edge Chromium and WebKit.

- `tests/row-actions.mjs`: Chromium and WebKit at 320x740, 390x844, 820x1180, 1180x820, 1440x1000. Checks emphasis for source/list, My Music selection, absent shortcuts/slots, Favorite alignment/state, clear visibility/focus/Escape/results/state, search widths and target geometry, reorder/persistence, title opening/current song and List return.
- `tests/library-header.mjs`: 320x568, 390x844, 430x932, 844x390, 820x1180, 1440x1000. Source menus, header height/overflow, sorting, Lists, reorder, persistence, retained Lead and Lyrics access through the song view, offline and sticky behavior.
- `tests/library-search-focus.mjs`: 390x844, 820x1180, 1180x820, 1440x1000. Search/context state, explicit versus automatic focus, Back/Forward, Lyrics, Favorites, Lists, Files, scroll, BFCache and offline.
- `tests/lists-workspace-context.mjs`: 320x568, 844x390, 820x1180, 1440x1000. Long-list sticky layout, browser-generated touch scrolling, saved scroll, fresh-tab restoration, separate Library/List query/sort, picker cancellation, editing and membership safety.
- JavaScript syntax checks and `git diff --check`.

Two concurrent test runs timed out at Library startup/reload; both passed sequentially without an application fix. No music-engine suite was run.

Screenshots under ignored `test-results/library-navigation-{chromium,webkit}-{width}.png`; phone and iPad reviewed for clear placement, source emphasis and row alignment. These are simulated browsers, not physical iPad tests.

## Deferred

The full Library/List/Files architecture and visual redesign, search scope redesign,
author/composer/lyric search semantics, filter-chip behavior, and Score-toolbar/view redesign remain outside this change.
