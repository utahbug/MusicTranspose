# Priority #5 — compact Library and headings

Repository verified before edits: `C:/Users/kenro/Documents/Codex/MusicTransposePrototype`, origin `https://github.com/utahbug/MusicTranspose.git`, branch `codex/pages`, clean starting commit `b8f5f21497cd4fc455833c67d390f51b242da4fb`.

## Layout and controls

The Library now has one sticky block containing three aligned rows:

1. Search songs, Clear and More.
2. Sources and Lists dropdowns.
3. Favorite star, Song with ABC/123 sort, Score, Lyrics and Lead.

The small title/count line scrolls away. Keeping the three functional rows in one sticky container avoids independently calculated offsets, overlap and resize jitter. At all six tested sizes the block is 137px high (plus any device safe-area inset). Action targets remain 44px; titles and source details wrap inside their own column. Existing Score and Lyrics artwork is retained, and Lead uses a matching staff-and-notes SVG. Unavailable lyrics keep their column space; unavailable Lead buttons are muted and disabled, with an accessible unavailable label.

More contains **Files / My Music** and **Import music**. These are entry points to existing screens/dialogs. No Export/Backup or About controls existed in this Library to move. Local file management is available in Files; it no longer adds a fourth action to Library rows. No new backup or settings workflow was introduced.

Sources retains all existing collection membership filters and source-specific titles/numbers. Its selected value remains in the dropdown, with the full label as its title. Lists opens an existing saved list directly, or All Lists opens the existing overview. List management, ordering and the active-list return behavior are unchanged; `lists-view.js` was not modified.

The star heading toggles **favorites-first ordering**, preserving all matching songs. ABC/123 applies within favorite/nonfavorite groups. Favorites themselves retain their existing storage and row-star control. The ordering preference persists and participates in history restoration. Older saved Favorites routes migrate to favorites-first instead of leaving users in an invisible favorites-only filter.

Clear resets only the search text/results and keeps focus off text entry. Library returns retain the existing neutral heading focus, query, source, sort, favorites-first state, scroll and List context. More closes with its close button, Escape or a backdrop click.

## Lead availability and scope

`lead-availability.js` contains the 34 bundled song IDs already supported by Priority #4. It is generated from the catalog audit and checked against actual extraction of all 679 structured scores by the Lead regression suite. It avoids fetching/deriving the entire catalog at Library startup. The 645 ambiguous structured scores and two PDF-only scores have disabled Library Lead controls; Score remains available. The existing score View menu still provides its safe fallback.

Local MusicXML is checked asynchronously with the unchanged conservative extractor. PDF-only imports remain unavailable for Lead. Async availability updates modify buttons without replacing the results or taking keyboard focus.

A Library Lead action requests the existing Lead view when opening its song. Score/title actions leave Lead mode for the ordinary score; an existing Most music preference remains available. The extractor, notation renderer and transposition logic were not changed. The service-worker cache advances to v93 and includes the availability module.

To regenerate the bundled index after an intentional catalog/extractor change, run `tests/lead-audit.mjs` with `WRITE_INDEX=1`; use `WRITE_REPORT=1` for the existing per-song report. The generator still uses `createLeadXML` as its authority.

## Files

- `index.html`, `styles.css`: compact rows, sticky headings, More dialog and responsive alignment.
- `library.js`: controls, favorites-first preference/history, dropdown navigation and availability.
- `icons.js`, `lead-availability.js`: Lead artwork and audited availability index.
- `app.js`: optional requested view when opening from Library.
- `sw.js`: cache version/module registration.
- `tests/library-priority5.mjs`: responsive Library, context, utility, availability and offline coverage.
- `tests/library-search-focus.mjs`: adapt existing focus/return checks to dropdown and More entry points.
- `tests/lead-state.mjs`: use the new Lists dropdown; existing assertions retained.
- `tests/lead-view.mjs`: verify the availability index against all actual Lead extraction results.
- `tests/lead-audit.mjs`: optional index generation.
- This report.

## Validation

The production app is static, with no compilation step; tests run its actual files through the existing `serve.py` server. Browser tests use installed Edge/Chromium with mouse and touch emulation. Physical iPhone/iPad Safari remains unverified.

- Library layouts: 320x568, 390x844, 430x932, 844x390, 820x1180 and 1440x1000. No horizontal overflow, sticky overlap or header-height changes while scrolling the full catalog. Screenshots were visually reviewed at phone and desktop sizes.
- Library interactions: Search/Clear, More, sources, Lists overview/direct opening, favorites-first/state, ABC/123, Score/Lyrics/Lead opening, safe unavailable controls, return context and offline reload. All source categories are checked in numeric order, favorites-first persistence and legacy-route migration are verified, and imported Lead availability/file management are exercised.
- Existing focus suite: phone, tablet, landscape tablet and desktop; initial focus, explicit search, return/Back/Forward, Lyrics, Favorites, Lists, Files, scroll, BFCache focus cleanup and offline behavior.
- Priority #2: 7,288 chord core checks, complete harmony audit, real screen/print/key-reset and offline transposition checks.
- Priority #3: all six navigation/metadata/overlay/control/PDF/Lyrics layouts, with mouse and touch navigation.
- Priority #4: synthetic selection/chord/cue cases; playback and List/Favorite session continuity; Lead/PDF/Normal and exact Lead print source; offline; complete 679-score audit and all 34 supported scores engraved; six responsive layouts.
- Priority #1: full measure/voice/lyric synchronization suite — 162 cases, all 19 affected scores and eight controls across five viewport sizes, with no ownership or alignment errors.

Screenshots and machine-readable evidence are in ignored `test-results/library-priority5*`, alongside the existing regression outputs. Priority #6 has not been started.
