# Score Tools popover

Adapted from the live PrimarySongs index.html, styles-v528.css and script-v528.js inspected on 2026-09-27. PrimarySongs was read only.

- Reused the sliders SVG, 25px glyph/1.8 stroke, 11px outer/7px item corners, 156px menu minimum, 5px padding, 3px item gap, 9px icon gap, 750-weight text, surface/border/accent colors, shadow, theme swatch, active dot, and 9px above-button gap.
- Right-aligned the popup because MusicTranspose places the control at the right edge. Mobile button is 44px; other widths use the reference 62px minimum. Menu targets are 44px instead of 40px.
- Existing #print button moved into the menu. Its app.js print handler and enabled/busy state are unchanged; no duplicate print implementation.
- No existing annotation implementation found. Annotate is disabled, with an accessible unavailable label and tooltip.
- No score-page theme preference existed. Added music-transpose-score-dark-v1, separate from Lyrics. Display-only inversion affects MXL/PDF score content; chrome stays light and print CSS is unaffected.
- Added Escape, arrow/Home/End focus navigation, natural Tab dismissal, outside-click dismissal and aria-expanded. The existing score tap exclusion now includes the open menu so dismissal cannot also turn a page.
- Cached the new module and advanced the service-worker shell cache to v125.

## Targeted validation

Production static files served locally, with no build step required. tests/score-tools.mjs passed in Chromium/Edge and WebKit at 320x568, 390x844, 844x390, 820x1180 and 1440x1000. Checked anchored placement, overflow, disabled annotation, keyboard focus, outside dismissal, theme state, independent Settings, Page Turns/Continuous switching and unchanged virtual-page count. Actual existing print preparation plus a stubbed native print dialog passed for MXL and bundled PDF; PDF page turns also passed. Print-media theme isolation passed.

Chromium offline reload passed with cached score and persisted theme. WebKit offline reload encountered a browser-internal error, so that particular check is Chromium-only. Desktop simulation does not constitute a physical iOS test. Screenshots are under test-results/score-tools-*.png; phone menu and tablet dark PDF were visually inspected. No music-engine suites run.
