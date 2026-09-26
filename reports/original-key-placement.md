# Original key in score paper - 2026-09-26

Verified the existing utahbug/MusicTranspose repository, origin and clean working tree before changing files. No other backlog work is included.

## Placement and footer

The single original-key-reference span is now the final child of the relatively positioned score-paper container. It is absolutely anchored 12px from the left padding edge and 4px from the bottom padding edge, in the white paper area. The border adds a small additional visible inset. Its 10px/12px muted text has no background, border, button styling or pointer interaction. It contributes no height to either the score paper or footer.

The former key-comparison footer wrapper and Original-specific offsets are removed. Current Key is again a direct member of the existing playing-controls row. Library, Reset, Current Key, View, Settings and Print have aligned 44px control heights. The normal footer is 54px; the existing narrow-phone page-counter row remains where applicable (about 66-67.2px total), without redesign. Original no longer adds its former 14px to the footer.

Paged MXL uses a 14px metadata allowance inside the existing viewport page budget: virtual-page capacity subtracts that allowance and paper bottom padding includes it. Complete system ink is retained and scaled by the established paginator; the label never covers notation and the paper stays above the footer. Existing continuous score/credit bottom whitespace accommodates the label without added padding or page height. In Continuous/Auto scrolling, metadata travels with the paper and appears at its end rather than floating over passing notes.

Most music, Normal and supported Lead share the same paper anchor. PDF retains the established hidden-label behavior; no key is inferred from PDF images and no separate fragile overlay is introduced. The label is temporarily hidden while Tap Zones help is open and remains absent from print/Lyrics. Tap navigation remains unchanged, and the label has pointer-events:none.

Original-key text still comes from the unchanged source-key logic in app.js. Transposition changes Current only; Reset restores Current without changing Original.

## Files

Production: index.html, styles.css, virtual-pages.js, sw.js (offline shell v99).
Tests: tests/original-key-placement.mjs, tests/settings-help.mjs, tests/score-reliability.mjs.
Report: reports/original-key-placement.md.

## Validation

The app is static production HTML/CSS/JS; no compilation step is needed. Tested against the local production server using HTTP/1.1 at http://127.0.0.1:8771/. Browser coverage uses headless Edge/Chromium with touch emulation, not physical iPhone/Safari hardware.

Responsive sizes: 320x568, 390x844, 430x932, 844x390, 820x1180 and 1440x1000. The focused suite measures label/paper/footer rectangles and rendered notation/credit bounds across Most music, Normal and Lead in both pages and continuous modes, plus multi-page/short real songs, transposition/Reset, help overlay, PDF and offline reload. It verifies a single passive label, no horizontal overflow, aligned controls, no score/credit overlap, no page spill below the footer, and unchanged paper/footer height when the label is hidden. Screenshots and measurements are in ignored test-results/.

All local regression suites passed:

- original-key-placement: six sizes, all three structured views in paged/continuous modes, representative songs, exact control alignment, ink/credit separation, no layout-height contribution, source/current transposition and Reset, overlay dismissal, PDF and offline.
- measure-sync: all 162 cases, including 19 previously affected songs and eight controls.
- chord-harmony: 7,288 checks, full catalog audit, real screen/print harmony and offline transposition.
- lead-view and lead-state: 679-score audit, all 34 supported renders, six responsive sizes, conservative fallback, source fidelity, state/playback/print and offline.
- score-reliability and settings-help: six sizes each, MXL/PDF taps, controls, metadata, key picker, overlay geometry/dismissal, Lyrics and offline.
- library-priority5, library-cleanup and library-lead-filter: six sizes each, sticky layout, utilities, source/search/sort/Favorites, supported filtering, imported count, return context and offline.
- lists-workspace and lists-workspace-context: six/four sizes, CRUD, Add, manual/drag/button ordering, persistence, return context and long-list scroll restoration.
- lyrics-cleanup: six sizes, shared Library/List navigation, hidden touch/mouse/keyboard Fun activation, Stop, appearance, score session and offline.
- lyrics-hold: exact activation threshold, cancellation paths, note count and immediate exit.
- score-lyrics-toggle: five sizes, repeated same-coordinate toggles, focus, playback/key/page state and resize.
- git diff --check: clean.

The production app is ready for the normal codex/pages GitHub Pages deployment. Commit, deployment and live verification results are reported in the completion response.
