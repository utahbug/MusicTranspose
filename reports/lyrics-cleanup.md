# Lyrics cleanup and hidden Fun — 2026-09-26

Verified the existing `utahbug/MusicTranspose` repository, its `codex/pages` branch, remote, and clean working tree before edits. No other repository or backlog item was changed.

## Navigation

Lyrics relocates the actual Score Library button (`#songs`) into its bottom-left footer. It retains the same SVG, primary-button styling, navigation handler, and Library/Back to list accessible name. Closing Lyrics restores that same node to Score's toolbar. The redundant text Library button is removed.

This uses the established Library history and workspace state, including active List, manual order, source/search/sort context, and existing scroll restoration. It does not introduce a separate Lyrics return path.

## Hidden Fun and exit

Hold the **song title in Lyrics for two seconds** to start Fun. Touch and mouse work; focusing the title and holding Space or Enter is the keyboard equivalent. A normal tap of the Lyrics/Score toggle keeps its existing behavior.

Short presses, movement beyond 8px, scrolling, pointer cancellation, extra pointers, blur, resize, visibility changes, and leaving the view cancel pending activation. Playback and other nested controls do not start the hold. There is no visible normal-mode Fun entry or Game label.

A fixed **Stop** button, at least 120 × 44px, appears while Fun is active. One tap stops immediately without confirmation, retains appearance and song/session context, and returns focus to the title without scrolling. The footer and final-verse padding respect bottom/side safe areas. The decorative playfield ends above the footer.

Holding the title again while Fun is active opens the existing note-count setting. Counts 1–4 remain supported and persisted. That dialog also has Stop, so exiting never requires finding a hidden gesture.

Fun activation now belongs to the current Lyrics visit: leaving or reloading ends it, and an old saved enabled flag does not silently activate it. The stored note count is retained. The activity's flights, phases, targeting, effects, worm behavior, palettes, reduced-motion behavior, and timing algorithms are unchanged.

## Lyrics appearance

The existing white/dark backgrounds, type sizes, framing, verses, song identity, and Score/Lyrics toggle are preserved. Background and font-size choices now save under `music-transpose-lyrics-appearance-v1`; previously these values reset in memory on a new visit. Missing/invalid preferences retain the existing dark/medium defaults.

## Production files

- `app.js`: passes the shared Library control to Lyrics; removes the obsolete fresh-visit appearance reset argument.
- `library.js`: retains one shared Library/Back to list label path.
- `lyrics-view.js`: footer navigation, hidden entry/visible exit, retained note-count setting, and persisted appearance.
- `lyrics-hold.js`: cancellable two-second gesture lifecycle.
- `lyrics-fun.js`: bounds the existing decorative playfield above the footer.
- `styles.css`: safe-area footer, touch targets, title hold handling, and removal of the visible Fun-entry styling.
- `sw.js`: cache version v96 and the new hold module for offline use.

## Responsive verification

Passed browser-emulated layouts at 320 × 568, 390 × 844, 430 × 932, 844 × 390, 820 × 1180, and 1440 × 1000. Native browser touch events were used on phone/tablet sizes, and mouse input on desktop. All six also exercised keyboard activation.

Checks covered visible bottom Library/Stop controls, unchanged lyric content, final-verse clearance above the footer, no horizontal overflow, short/drag/cancel rejection, saved appearance, shared button identity, List context, transposed Score session, and offline reload/activation/exit. Screenshots were inspected. These are browser tests, not physical iPhone/iPad Safari tests.

The app remains a static production application with no compilation step; validation runs the actual HTTP-served app and its service worker. Normal GitHub Pages deployment remains sourced from `codex/pages` at `/`.

## Automated verification

Lyrics-specific checks:

- `tests/lyrics-cleanup.mjs`: six sizes, real touch/mouse and keyboard holds, cancellation, shared Library node/context, visible Stop and final-verse clearance, theme/font persistence, transposed Score round trips, offline activation/exit.
- `tests/lyrics-hold.mjs`: exact 2,000ms threshold; single activation; release, movement, scroll, focus, resize, visibility, multi-touch, nested playback, and disposal cancellation; note-count retention and one-tap Stop from hidden settings.
- `tests/score-lyrics-toggle.mjs`: repeated same-coordinate touch toggling, keyboard focus, playback and key/octave/session preservation, responsive control geometry.
- `tests/score-lyrics-long-title.mjs`: longest catalog title, appearance changes, paired toggle position, and overflow at four sizes.
- `tests/lyrics.mjs`: seven representative songs, paired Score/Lyrics, verses, search, background/font cycle, print exclusion, offline Lyrics.
- `tests/lyrics-fun-ambient-model.mjs`: independent motion paths, scaling, timing and palettes.
- `tests/lyrics-fun-ambient.mjs`: four sizes, phase transitions, head/body interactions, colors, reduced motion, restart and cleanup.
- `tests/lyrics-fun-respawn.mjs`: four sizes, targeting, exact endpoints, hit/free behavior, respawn timing, bounded replenishment and exit cleanup. Its transition check now waits for an actual visible note during intentional randomized gaps before asserting a hit.
- `tests/lyrics-fun-playfield.mjs`: title/metadata/verse regions, long title, both control and playback isolation, bounded layout reads and cleanup at four sizes.

Test files were adapted only where the requested UI changed; the existing activity assertions remain. New helper `tests/lyrics-hold-helper.mjs` provides clock-driven entry for activity checks; real input/hold behavior is tested separately.


Prior-priority regressions also passed:

- Priority #1: `tests/measure-sync.mjs`, 162 cases over 19 affected songs and eight controls.
- Priority #2: `tests/chord-harmony.mjs`, 7,288 checks; full harmony catalog audit; real-song screen/print/reset and offline transposition.
- Priority #3: `tests/score-reliability.mjs`, six sizes including touch/mouse, overlays, metadata, playback, PDF and Lyrics.
- Priority #4: `tests/lead-view.mjs` and `tests/lead-state.mjs`, 679-score audit, all 34 supported Leads rendered, responsive/print/playback/PDF/session/offline checks.
- Priority #5: `tests/library-priority5.mjs` at six sizes and `tests/library-search-focus.mjs` at four sizes, including Lyrics return, filters/sorts/Favorites, history, and offline state.
- Priority #6: `tests/lists-workspace.mjs` at six sizes and `tests/lists-workspace-context.mjs` at four sizes, including CRUD, drag/button ordering, persistent Add, contexts, reload, offline, and explicit long-list Lyrics return-scroll checks.
- Recent cleanup: `tests/library-cleanup.mjs`, all six sizes, compact Library controls, hidden unavailable Lead, and safe saved-state fallback.

Existing test files changed: `library-priority5.mjs`, `library-search-focus.mjs`, `lists-workspace-context.mjs`, `lyrics.mjs`, `score-lyrics-toggle.mjs`, `lyrics-fun-ambient.mjs`, `lyrics-fun-respawn.mjs`, `lyrics-fun-playfield.mjs` (all under `tests/`). New tests/helpers: `tests/lyrics-cleanup.mjs`, `tests/lyrics-hold.mjs`, `tests/lyrics-hold-helper.mjs`.

All listed local suites and `git diff --check` passed. No subsequent backlog work was started.
