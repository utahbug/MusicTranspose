# Library header cleanup

- One Source menu replaces separate Source and Lists controls. Sources and My Lists have headings and horizontal separators; Edit Lists opens existing management.
- Choosing a source selects that collection in the full Library; choosing a List restores its browsing context, with no hidden collection filter. Old saved List source filters normalize to All Sources. Membership and saved manual order are unchanged.
- Sort shows Sort: Title / Number / Manual on larger screens and A-Z / Number / Manual on phones. Options are Title (A-Z), Song number, and Manual order for Lists. Temporary sorting never writes the stored sequence.
- Two sticky phone rows remain. Content-sized Source button preserves full desktop labels; long phone names truncate within available space. Menus are viewport-constrained, scrollable, keyboard accessible, and support touch.
- Production is static: served production files at localhost:8771. No compile step. Service-worker shell cache advanced to v101.

## Targeted validation

Passed tests/library-header.mjs at 320x568, 390x844, 430x932, 844x390, 820x1180, 1440x1000. Checked header geometry, two phone rows, full desktop labels, menu sections/dividers, touch/mouse, keyboard Escape, Edit Lists, manual reorder and reload, temporary sorting, search/clear, Favorites, Lead filter, Score/Lead/Lyrics returns, and offline context.

Passed tests/library-search-focus.mjs at 390x844, 820x1180, 1180x820, 1440x1000. Checked source/search/sort restoration, Home/Back/Forward, Lyrics, Favorites, Lists, Files, scroll, BFCache focus cleanup, and offline reopening.

Screenshots and measurements: ignored test-results/header-*.png, source-menu-*.png, library-header.json. Visual review confirmed clean 320px header and desktop combined menu. No horizontal overflow or console errors.

No full music-engine suite was necessary or run: engraving, chords, transposition, and Lead extraction were untouched. The new targeted suite supersedes old header-layout assumptions about separate native Source/Lists selects; the search-focus regression was migrated to the new menu.

Files: index.html, library.js, styles.css, sw.js, tests/library-header.mjs, tests/library-search-focus.mjs, this report.
