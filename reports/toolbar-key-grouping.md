# Score toolbar grouping and page-status removal

## Placement only

Verified MusicTranspose repository root and origin before changes. Existing control
nodes and behavior are reused; no rendering, transposition, navigation, annotation,
Library, playback or export algorithms changed.

At widths above 600px:

- Left: Library, Reset.
- Right: Score View, Key, Tools, Settings, Lyrics (when available).
- Two toolbar grid tracks replace the three-track layout; there is no center
  placeholder for page position.

`placeKeyControl()` moves the existing `#key` node using DOM `after()`/`append()`.
A matchMedia change listener moves that same node on breakpoint changes. The key
button, its ID, chooser handlers, labels and dialog are never duplicated.

At phone widths <=600px the prior safe layout is retained: Reset/Key centered above
the bottom row, Library bottom-left, Score View/Tools/Settings/Lyrics bottom-right.
No one-row desktop layout is forced onto a phone. Existing label widths, control
colors/icons and safe-area rules remain in use.

Key remains disabled in Original and PDF-only views, and enabled in structured
views when transposition is supported. The existing PDF rule that hides disabled
Key/Reset remains unchanged; this task does not introduce placeholder key text.

## Page state

The existing `#page-position` span moves out of the toolbar into a shared `.sr-only`
container immediately after the toolbar. Its ID, role=status, aria-live=polite and
aria-atomic=true remain intact. Navigation still owns its text, aria-label and
hidden attribute. Page index, total count and turn computation are unchanged.

The visual toolbar wrapper is removed, not left empty. No in-score indicator was
introduced; its final location and appearance are deferred.

## Files

Production: app.js, index.html, styles.css, sw.js (v137 shell cache).
Tests: tests/compact-key-toolbar.mjs and tests/size-selector.mjs.
Report: this file.

## Targeted verification

- Updated compact-key-toolbar.mjs in Chromium and WebKit: 320x740, 390x844,
  820x1180, 1180x820, 1440x1000. Checks one Key node across breakpoint moves,
  DOM and visual order, left Reset, view-specific disabled state, actual key-dialog
  opening/closing/Escape focus, key changes, reset of key and octave/register,
  hidden accessible page status, PDF touch/mouse page turns and structured page
  Home/End updates, paired Score/Lyrics corner position, no clipping/overflow.
- Existing size-selector suite at iPad width: availability, selection, keyboard,
  key/octave state and Lyrics round trips with the updated control-order expectation.
- PDF-first regression at iPad width and annotation regression at phone width.
- JavaScript syntax and git diff --check.

The first geometry assertion compared top edges; Tools already has a 46px target
versus the neighboring 44px buttons. The check now compares vertical centers,
preserving those existing dimensions rather than changing them.

Screenshots: ignored test-results/toolbar-grouping-{chromium,webkit}-{width}.png.
These are browser simulations, not physical iPad tests. No full music-engine suite.

No remaining overlap was found at tested widths. The future in-score page indicator
and any broader toolbar color/icon/metronome polish remain separate tasks.
