# Score View selected-state clarity

CSS-only menu presentation change in styles.css. No application logic changed.
The existing menuitemradio / aria-checked semantics identify the current view.
Selected options stay enabled, with dark text, a subtle tint and a border-drawn
1.7px checkmark. Every row reserves the same right padding; no text shifts.
Available rows use dark text, plain backgrounds and hover/focus feedback.
Unavailable rows retain native disabled behavior, muted text, explanation and
no checkmark or hover treatment. Focus has a separate blue outline.

Files: styles.css, sw.js (shell cache v138), tests/score-view-menu-state.mjs,
and this report.

Verification:
- Focused menu test: Chromium and WebKit at 320x740, 390x844, 820x1180,
  1180x820 and 1440x1000. Original/Transpose/Melody selection, disabled Melody,
  keyboard navigation, focus return, aligned rows and no overflow all pass.
- Existing size-selector regression at 820px passes, including view availability,
  switching, key/octave state, Lyrics returns and annotation gating.
- Screenshots inspected at phone and tablet sizes. Browser simulations only.
- Syntax and git diff --check pass. No full engine suite.

Separate pre-existing finding: the broad size-selector test at 390px fails its
PDF-to-Transpose round-trip comparison: page status changes from 1 / 7 to 1 / 6
after transposition and octave change. Reproduced with the unchanged test AND
prior committed stylesheet supplied to the browser. No pagination changes made;
this is outside the menu-only task. The broad test remains unchanged.
