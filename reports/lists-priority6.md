# Priority #6 — Lists in the Library workspace

Repository confirmed before edits: `C:/Users/kenro/Documents/Codex/MusicTransposePrototype`, origin `https://github.com/utahbug/MusicTranspose.git`, branch `codex/pages`; clean starting commit `3a9b57bd9d90f15948851c584176ee20dd01ec6b`.

## Architecture and state

Active Lists now use the actual Library table and its Favorite, Song, Score, Lyrics and Lead columns. There is no second song-browsing table in the Lists screen. The existing `music-transpose-library-v1` store retains stable List IDs, names and ordered song-ID arrays. Membership and order remain independent of the displayed search, source and sort.

A separate `music-transpose-list-workspace-v1` store holds the active List and per-workspace query, source, sort, favorites-first state and scroll. Full Library has its own browsing context. Browser history captures active List context and recognizes changes between Library Lists; old List routes migrate into the shared Library workspace. A fresh tab/app launch also restores the saved workspace, without requiring a history entry.

The previous one-time migration that alphabetized unversioned Lists has been removed. Existing sequences, including IDs whose source is currently unavailable, retain their exact order. Unavailable songs appear as disabled placeholders and can be removed explicitly in edit mode.

## Active List and ordering

The Lists dropdown shows the active List and provides Full Library and All Lists access. A compact tools row offers Add songs, Edit order and List options. The existing source filter, search, Favorite controls and Score/Lyrics/Lead actions remain available.

Manual order is the default for a newly opened List. The Song heading cycles Order → ABC → 123 → Order. Sorting and favorites-first only affect the presentation; they do not rewrite the saved sequence. Returning to Order also clears favorites-first grouping to show the exact manual sequence.

Edit order exposes handles, move-up/move-down buttons and Remove beneath each Library row. Entering editing explicitly shows the entire List in manual order, clears that List's temporary search/source filters and disables those filters during editing. Full Library browsing settings remain intact. Reorder changes save immediately, and removal affects only the List. Done editing removes all handles, so normal scrolling cannot accidentally reorder songs.

The existing pointer-capture drag helper is reused. Touch handles explicitly own their gesture; ordinary rows retain native touch scrolling. Rendering after a drop waits until the touch sequence finishes before replacing its target row. This fixes a swallowed first tap following a touch drag. Mouse dragging and keyboard activation of the move buttons are also covered.

## Add Songs and management

Add Songs keeps the existing search/source/favorites selection model. Selections survive search/filter changes; songs already in the List are marked and disabled. The destination List remains visible in the sticky picker header. A fixed bottom bar shows `N selected — Add to list` and Cancel; the count updates immediately and is announced politely. The completion bar follows the visual viewport so it stays above a mobile keyboard; a simulated keyboard viewport change is covered in the browser test.

Completion appends selected songs without rearranging existing entries. It returns to the same Library List, displays manual order with filters cleared so additions are visible, and positions the first added song below the sticky controls. Cancel restores the existing List browsing context without adding anything.

All Lists is a lightweight management overview: one row per List, name/count, Rename and Delete, plus New List. Creation and renaming trim surrounding whitespace, reject blank names and reject normalized duplicate names. Renaming retains the ID and ordered contents. Deletion requires a concise confirmation stating that songs remain in the Library; Favorites and source files are unaffected.

## Return behavior and scope

Score, Lyrics and Lead opened from a List return to that same List, including its compatible query/source/sort and scroll. Search is never automatically focused on return. Choosing Full Library explicitly restores the full-catalog browsing context. The List selection, stored order and browsing settings survive reload, fresh-tab startup and offline/online transitions within the existing browser-local persistence model.

No score engraving, chord transposition, playback model or Lead extraction was changed. Lead availability remains the existing 34 supported bundled scores with safe unavailable controls elsewhere. No advanced settings, languages, nested Lists, sharing or collaboration were added. The service-worker shell advances to v94.

## Files

- `library.js`: shared active-List rows, context persistence, ordering/editing and return behavior.
- `lists-view.js`: overview/management and persistent Add Songs selection flow.
- `list-reorder.js`: reused drag behavior with touch gesture/target-lifetime fixes.
- `view-history.js`: distinguish Library List and picker routes.
- `index.html`, `styles.css`: compact List tools, overview and sticky/fixed picker controls.
- `sw.js`: cache version.
- `tests/lists-workspace.mjs`: six-size CRUD, manual order, drag/arrows, Add, return and persistence coverage.
- `tests/lists-page.mjs`: retain the previous test command as an entrypoint to the current workflow suite.
- `tests/lists-workspace-context.mjs`: long-List scrolling/sticky behavior and context isolation.
- `tests/library-priority5.mjs`, `tests/library-search-focus.mjs`, `tests/lead-state.mjs`: adapt their existing return assertions to the shared Library table.
- This report.

## Validation

The app is static, with no compilation step. Tests run the actual production files through the existing `serve.py`. Edge/Chromium mouse/touch emulation is used; physical iPhone/iPad Safari remains unverified.

- List workflow: 320x568, 390x844, 430x932, 844x390, 820x1180 and 1440x1000. Create/rename/delete, counts, blank/duplicate names, missing source IDs, persistent selection across filters, additions visible below sticky controls, remove isolation, keyboard move buttons, mouse/touch dragging, and first tap after drag.
- Context/persistence: manual order after reload, fresh-tab startup and offline/online transition; temporary sort never mutates membership; Score/Lyrics/Lead return to the List; Full Library remains accessible with separate browsing preferences; Back/Forward routes preserve context.
- A 70-song List at 320, 844, 820 and 1440 widths checks native touch scrolling without drag activation, stable sticky rows, preserved return position, fresh-tab scroll restoration and query/source isolation.
- Priority #5 Library suite: all six layouts, search/clear/More, sources/favorites/sort, Score/Lyrics/Lead, imported-file management, return context and offline behavior.
- Existing search-focus suite: four layouts; initial/explicit focus, Back/Forward, Lyrics/Favorites/Lists/Files, scroll, BFCache cleanup and offline.
- Priority #4 Lead suite: full 679-score audit, all 34 supported scores rendered, six layouts, print/playback/session and offline cases.
- Priority #2 chord suite: 7,288 core checks, catalog audit, real rendering/printing and offline transposition.
- Priority #3 navigation suite: six layouts, mouse/touch, metadata, controls, overlays, PDF and Lyrics.
- Priority #1 synchronization suite: 162 cases, all 19 affected scores and eight controls across five sizes.

Final regression completion and deployment are reported in the task. Screenshots and machine-readable results are under ignored `test-results/lists-workspace*` alongside the existing regression evidence. The next backlog item has not been started.
