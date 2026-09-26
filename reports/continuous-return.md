# Continuous-mode paired Back to top - 2026-09-26

Verified the existing utahbug/MusicTranspose repository, origin and clean working tree before edits. No other backlog item was started.

## Controls and behavior

The existing right button remains. A left sibling uses the identical SVG, quiet-button class, 44x44 target and Back to top accessible name/title. Both use one returnToStart handler: pause automatic scrolling, scroll instantly to document top, then synchronously hide both. Native buttons support keyboard Enter/Space and the existing visible focus outline. Neither is draggable.

For structured scores, the pair appears in Continuous mode at the existing scrollY >= 100 threshold and disappears together below it. Scroll-driven updates are coalesced to animation frames. Page Turns, Auto-scroll, Lyrics and Library do not show the pair. PDF preserves its existing Continuous-mode right button only; the new left button and clearance are not applied to PDF.

Both buttons sit 8px above the footer with at least 12px side inset, using the respective safe-area inset when larger. Their style and vertical position are shared. Footer dimensions, controls, octave behavior and score engraving are unchanged.

## Preventing notation overlap

A full-width 44px score-side gutter is unavailable at 320px. While the MXL pair is visible, a 60px viewport clearance above the footer keeps notation outside the buttons: 44px target plus 8px above/below. Only notation, credits and the passive Original-key label are clipped at that boundary; the existing View popup is outside those clipped elements. Matching end-scroll padding lets all notation, credits and Original-key metadata scroll fully above it. The actual score paper, SVG widths, engraving and source XML are unchanged. If controls first appear at the document end, the end position is retained after adding clearance.

The safe clearance disappears with the pair. Score tap geometry and screen-advance distance share the same visible-bottom calculation, so blank control space is not a score navigation target and the help overlay matches active score zones. Button pointer streams are outside the score host and already excluded by the interactive-control guard; no duplicate touchend/click navigation handler was added.

## Files

Production: index.html, navigation.js, score-taps.js, styles.css, sw.js (offline shell v100).
Test: tests/continuous-return.mjs.
Report: reports/continuous-return.md.

## Validation

Static production HTML/CSS/JS, with no compilation step, served at http://127.0.0.1:8771/ using persistent local HTTP connections. Tests use headless Edge/Chromium and touch emulation, not physical iPhone/Safari hardware.

Viewports: 320x568, 390x844, 430x932, 844x390, 820x1180 and 1440x1000. Focused assertions cover matching icon/name/geometry, 44px targets, side insets, simultaneous 100px visibility, one scroll action per tap/click, keyboard Enter/Space/focus, unchanged footer/XML, actual hit-test separation from score content, ignored safe-lane taps, Original-key visibility at document end, Page Turns, Lyrics/Library, preserved PDF behavior and offline reload. Screenshots/JSON are in ignored test-results/.

All local regression suites passed:

- continuous-return: six sizes, matching geometry/name/icon, exact threshold, one action per click/tap, keyboard focus/Enter/Space, actual score/control hit-test separation, unchanged footer/XML, end annotation, Page Turns, PDF, Lyrics/Library and offline.
- original-key-placement: six sizes, all score views, paged/continuous switching, safe notation/credits, level footer, transpose/Reset and offline. This also covers opening and using View from the scrolled score; an initial broad-container clipping issue was fixed by restricting clipping to score content.
- score-reliability and settings-help: six sizes each, page/continuous navigation, controls, MXL/PDF, metadata, overlay, key picker and offline.
- measure-sync: 162 cases, including 19 previously affected scores and eight controls.
- chord-harmony: 7,288 checks, catalog audit, real screen/print chords and offline transposition.
- lead-view and lead-state: 679-score audit, all 34 supported renders, six responsive sizes, conservative fallback, source/state/playback/print and offline.
- library-priority5, library-cleanup and library-lead-filter: six sizes each, existing Library controls/state, sticky layout, dynamic Lead count/filter and offline.
- lists-workspace and lists-workspace-context: six/four sizes, CRUD, Add, manual/drag/button order, reload/history/offline and long-list return positions.
- lyrics-cleanup: six sizes; shared Library/List navigation, hidden touch/mouse/keyboard entry, Stop, appearance and offline.
- lyrics-hold: exact activation threshold/cancellation, note-count persistence and immediate exit.
- score-lyrics-toggle: five sizes; repeated touch, focus, playback/key/page state and resizing.
- git diff --check: clean.

Commit, normal GitHub Pages deployment and live verification are reported in the completion response.
