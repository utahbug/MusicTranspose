# Priority #3 — score navigation and metadata

Repository identity was verified before edits: C:/Users/kenro/Documents/Codex/MusicTransposePrototype; origin https://github.com/utahbug/MusicTranspose.git; codex/pages; clean starting commit e3129f801f22344aa5f52452d326bfd58d5245a8.

## Findings

The old pointer handler only ran in Page Turns mode. Phones and desktops default to Continuous Scroll, so score taps in those views did nothing. In page mode, the upper half of the rendered score jumped to First/Last, leaving a much smaller Previous/Next area than the requested PrimarySongs behavior. The handler also held pointer state on the score element, without comprehensive cancellation when other controls, dialogs, score replacement or secondary pointers intervened.

Reference inspected read-only: the existing PrimarySongs application at C:/Users/kenro/Documents/MUSIC APP/index.html, script-v528.js (performPdfTapZoneAction and touch handlers, around lines 6435–6565), and styles-v528.css (.pdf-zone-tips). It uses equal left/right halves, a 25% upper region, a 75% lower region, and movement filtering/duplicate-click suppression. No files in that application were changed.

## Changes

- score-taps.js adapts PrimarySongs' proportions and deliberate-tap model to Pointer Events. MXL geometry uses the visible score area between the score/header and bottom toolbar, rather than hidden/offscreen engraving. One pointer-up produces one action; there is no separate touch-end or click navigation path. The start/end region must match. Drags, long presses, multi-pointer gestures, cancellations, scrolling, resize, blur, score changes, and control/dialog transitions invalidate pending taps. Native controls, links, editable content and common ARIA widgets are excluded.
- navigation.js uses this handler for MXL. Page Turns still uses existing complete-system virtual pages. Continuous and Auto-scroll views retain their selected mode and allow screenful steps with 15% overlap and First/Last scrolling. Touch still pauses running Auto-scroll as described in its existing settings. PDF retains its existing 50% boundary, page-mode requirement, actual PDF pages, keyboard/pedal navigation and rendering; only input lifecycle filtering is shared.
- index.html/app.js move collection/page information beside the Tap Zones and Lyrics controls. Original key moves directly above Current key in the existing bottom-left key control footprint. The key control remains a 44px target. Opening tempo/expression stays beneath the title; opening-metadata.js supports the separate source host without changing its extraction or chord exclusions.
- Tap Zones uses PrimarySongs' tap-hand SVG with the app's existing stroke/icon styling. The modal guide is placed over the actual tap area and shares the same geometry as hit-testing. It dismisses on a tap, Escape, resize/scroll or after eight seconds. The dismissing gesture cannot navigate. It does not change preferences or toggle navigation. Settings' existing diagram also uses the appropriate MXL/PDF proportions.
- Phone source labels use CS / Hymns / HHC plus page number, retaining the full source as accessible text and a tooltip. The source/action row stays unwrapped; both Tap Zones and Lyrics retain 44px targets even at 320px, so no overflow menu is needed. Existing safe-area positioning is retained. No new footer row is added.
- Large is labeled Lead, retaining the existing internal large setting, saved preference and density rendering. Actual lead-sheet extraction/rendering is not implemented.
- sw.js advances to v91 and caches score-taps.js for offline use.

## Validation

The app is static: no compilation/build step exists. The actual production files were served locally with the existing serve.py.

New tests/score-reliability.mjs covers touch at 320x568, 390x844, 430x932, 844x390 and 820x1180; mouse at 1440x1000. All six passed. Tests exercise repeated Next/Previous/First/Last, the 25% boundary (35% must be Next), compatibility clicks, stale/canceled/multi-pointer/long gestures, control/dialog exclusion, correct source changes and original/current keys, overlay geometry/dismissal/timer, target sizes/overflow, Lyrics return, playback control exclusion, PDFs and continuous taps. Additional focused checks cover common interactive widgets, Settings diagram, functional Lead selection and offline navigation/guide after reload.

Representative songs include The Nativity Song, The Shepherd’s Carol, Follow the Prophet, The Morning Breaks (Priority #1), Children All over the World and I Will Follow God's Plan (Priority #2), plus the five-page Choose to Serve the Lord PDF.

Existing regressions passed:

- performance-navigation.mjs: phone/tablet/desktop defaults and saved preferences, four zones, actual touch drag, keyboard/pedal, offline page turns, score-position preservation, PDF entry and one-page bounds. Its restored-session test now waits for attached Library data rather than assuming the Library remains visible when a score is restored.
- navigation-settings.mjs: Auto-scroll speed/pause/manual interaction, persistence, end clearance and return to start.
- opening-metadata.mjs: tempo, expressions and later directions remain correct.
- chord-harmony.mjs: 7,288 checks; all 679 catalog scores audited (7,300 structured harmonies, 635 slash entries, 156 text chords); seven real songs across four viewports, print, reset and offline transposition.
- measure-sync.mjs with SYNC_SMOKE=1: 32 Priority #1 alignment/ownership/lyric cases.
- playback.mjs: all 679 source timelines; eight representative audio cases, key/octave/reset, paired views, PDF behavior, print exclusion and offline audio.

Screenshots and JSON evidence are in ignored test-results/score-reliability*. Device tests use Edge/Chromium viewport/touch emulation; physical iPhone/iPad Safari has not been tested.

No Library redesign, Lists work, source score edits or unrelated engraving changes. Priority #4 is deferred until user review.
