# UI, navigation and Lyrics Fun refinement

Repository: C:/Users/kenro/Documents/Codex/MusicTransposePrototype
Remote: https://github.com/utahbug/MusicTranspose.git
Branch: codex/pages
Starting commit: b66c741f13c6272113dab2c6158026ee5828e283 (clean worktree)

The existing project, catalog, archives and related apps were preserved. No
archive or unrelated repository was accessed. The only closely related unfinished
item found in previous project notes was unavailable Page Turns. PDF.js now
provides actual page frames, so Page Turns was implemented for PDFs. Continuous
OSMD scores still have no reliable printed-page boundaries; they retain continuous,
hybrid and auto-scroll modes. No artificial MXL pages or new engraving were added.

## UI

Collection/page metadata is directly beneath the song title. Playback remains
beside the title. A compact right-hand group contains score size (phone only)
and Lyrics. Long titles wrap beside the 44px playback control instead of putting
that control on a separate line. Measured against the starting commit, score-top
space recovered was 18px at 820/1180/1440px widths and 5–12px at 390px for Nativity,
Give Said the Little Stream, and Oh Come All Ye Faithful. Toolbar height remains
54px at all measured sizes. PDF continuous positioning is unchanged.

Lyrics now uses a local SVG with short text lines and a small beamed note pair,
with accessible name and tooltip Lyrics. Settings uses a conventional toothed
gear SVG. No external icons or fonts were introduced.

The wide musical transpose artwork is replaced by 44px chevrons (40px on phones),
joined visually to the existing key control. The current-key color/signature and
full key chooser are unchanged. Reset remains isolated at the far right.
Octave choices are Settings radio buttons: Normal / Original, Octave Up (8va),
Octave Down (8vb). Score/pitch/playback behavior and exact Reset remain unchanged.

## Navigation

PDF Page Turns shows one real PDF page fitted into available screen space.
Generous invisible left/right score halves turn previous/next. Explicit page
buttons and ArrowLeft/Right, PageUp/Down, Home/End use the same bounded action.
First/last pages never wrap. Real pointer handling ignores controls, links,
interactive objects, drags over 8px, holds over 450ms, scrolling and cancelled
multi-touch gestures. No click handler duplicates a pointer-up page turn.
PDF trim and page proportions remain intact. Print still includes all pages.

Continuous mode shows a separate Return to Start icon after 100px of scrolling.
It jumps immediately to scroll position zero, without changing key or octave.
Hybrid (15% overlap), auto-scroll and session preferences remain operational.
Page mode is unavailable for MXL and says why in Settings. A change from PDF page
mode to MXL falls back to continuous mode.

## Lyrics Fun

The sparkle opens a small keyboard-accessible dialog with a Fun on/off checkbox,
Notes on screen (1–4), and Done; Escape also dismisses it. Default is off/one.
The count changes without reload or restarting Lyrics, and decreases remove
surplus targets immediately. New targets arrive one at a time every 2–4 seconds
until the limit is reached. Hits refill on the same randomized cadence.

A single 300ms travelling pulse is allowed at once; hits then show a 400ms burst
before another shot is accepted. Target shots remain accurate. Free shots travel
past the opposite boundary and are clipped as they leave, with no MISS or scoring
UI. Eighty percent of target paths prefer the upper 45% of visible lyrics, with
some lower variation. Edge clearance favors a visible shot path. The six existing
note designs, text-matched colors, small size, tap/scroll discrimination, reduced
motion, theme/font controls and cleanup are preserved. Leaving Lyrics resets Fun.

## Validation

Passed existing suites (after updating obsolete control/baseline assumptions):
playback; octave-controls; song-session; score-density; lyrics; lyrics-fun;
navigation-settings; catalog-cache; library-discovery; library-theme;
list-management; list-ordering; list-touch; row-actions; library-compact;
release-audit; release-states; pdf-compact; import-validation.

New targeted suite: ui-navigation-fun.mjs. It covers four responsive sizes,
short/long titles, all Settings octave states, actual emulated touch input for
page turns, first/last boundaries, swipes, control isolation, repeated Return to
Start, every target limit, delayed spawning, one-shot limits, offscreen free shots,
theme/control safety, playback and cleanup. header-comparison.mjs measures the
starting-commit comparison. tests/run-current-suite.mjs provides the repeatable
regression runner; PDF comparison baselines are generated against b66c741.

All 119 structured scores rendered and transposed +/-1 with exact reset. Playback
checks cover the eight previously requested songs, shared Score/Lyrics state,
key/octave changes, cached/offline audio, stop/end behavior and PDF exclusion.
PDF baseline checks confirm full-page proportions/pixels, unchanged MXL SVG and
print output against the starting commit. Favorites and list ordering persist.

Historical test corrections: obsolete toolbar octave selectors, pre-Lyrics
three-column row assumptions, older long-name limits, full-word key labels, and
pre-Lyrics PDF snapshots were updated to the actual starting application/current
requirements. No production Library behavior was changed to satisfy those tests.

Physical iPad/Safari, Bluetooth pedals and actual iOS audio output remain device
checks. Browser viewport and emulated-touch tests do not claim physical hardware
verification. No renderer, source score, extraction or playback engine change.

## Files changed

- README.md
- app.js
- index.html
- library.js
- lyrics-fun.js
- lyrics-view.js
- navigation.js
- prototype-findings.md
- styles.css
- sw.js
- tests/catalog-cache.mjs
- tests/import-validation.mjs
- tests/library-theme.mjs
- tests/lyrics-fun.mjs
- tests/navigation-settings.mjs
- tests/octave-controls.mjs
- tests/pdf-compact.mjs
- tests/playback.mjs
- tests/row-actions.mjs
- tests/score-density.mjs
- tests/song-session.mjs
- reports/ui-navigation-refinement.md
- tests/header-comparison.mjs
- tests/run-current-suite.mjs
- tests/ui-navigation-fun.mjs
