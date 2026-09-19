# iPhone performance-toolbar alignment

Starting commit: 1f2e9a1956975b93d9c6a75b684175e91f85b26c.

Previously a max-width:600px JavaScript branch moved Library and Score Size into the phone score header. They now stay in the existing performance groups at every viewport, using the same actual buttons and handlers as desktop/iPad:

- Header upper-right: Original key, Lyrics when available.
- Bottom left: Library, Reset, Current Key.
- Center: page status, with existing visibility logic.
- Bottom right: Score Size, Print, Settings.

The obsolete phone header grid and placement branch are removed. The shared paired Score/Lyrics measurement logic continues to match the moved-free Lyrics button position without changes.

## Phone spacing and narrow fallback

At widths up to 600px, groups use 2px internal gaps and a 4px additional Library separation. Five icon buttons remain 44x44px. Key text is 16px with 14px signature, single-line. At 360px and below, icon targets are 40x44px, key text 14px/signature 12px, with reduced key padding. Existing Library color/shape and all icons remain.

Six usable controls plus key text cannot share a 320–390px line with a separately centered page counter. Controls therefore remain in one unwrapped row, with an approximately 16px centered status line above only when page status is visible. This is the narrow fallback; the counter spans both grid columns and remains at the actual screen center. No blank status row remains when hidden. Wider layouts retain their existing symmetric three-column grid. The existing measured toolbar-height clearance and iOS safe-area handling remain active.

Five- and seven-accidental labels fit at 320, 375 and 390px without overlapping utilities. Long titles wrap without title/subtitle/audio/Original-key collisions. At 320px very long titles necessarily occupy more lines; no smaller title font is introduced.

## Validation

- Layout/control overlap, touch height, screen bounds, page centering and score-size selector: 320x740, 390x844, 844x390, 820x1180, 1180x820, 1440x1000.
- Score/Lyrics same-coordinate repeated taps and resize, playback/key/octave/size/page preservation: desktop, both iPad orientations, 390 and 320px phones.
- Library, Reset, key chooser/transposition, octave, Score Size, Settings/navigation choice, playback, print hiding, PDF behavior and offline reload passed.
- Existing virtual-page suite verifies system clearance, page movement/status and navigation regression.
- Screenshot review includes phone playing view and the longest title at 320px. No horizontal page overflow; controls remain visible and aligned.

Files: app.js, styles.css, sw.js (cache v82), tests/performance-placement.mjs and this report. No score, playback, transposition, navigation algorithm or stored preference changes.

Limitations: tests use Edge/Chromium viewport/touch simulation; physical iPhone/iPad Safari testing remains advisable. The visible status line adds about 16px of phone toolbar height only for multipage navigation, in exchange for readable keys and practical touch targets.
