# Slim Score identity banner

Verified repository root and origin; implementation is on codex/pages.

## Presentation

The new .score-identity-header joins the existing Library / Lyrics selector that
owns --app-header-background. The raw gradient remains defined once. The Score
banner uses compact white 17px title text and 11px source text, with 2px vertical
padding. At 820px iPad portrait width its measured height is 48px in Original,
Transpose and Melody only, versus the Lyrics header minimum of 56px.

The existing #score-source node now sits beneath the title. Opening tempo/direction
metadata remains outside the gradient, immediately below it on the paper. In PDF
view that metadata remains hidden as before; the PDF itself already contains it.
The PDF notice no longer reserves a 44px row for the former floating Tap Zones
control. No page-fitting or pagination algorithms changed.

The existing playback attachment uses the right-side .score-actions container,
before the existing #show-tap-zones node. No duplicate playback or Tap Zones controls
were added. Both retain 44x44 targets. Playback availability and all engine/event
handlers are unchanged: Original/PDF-only still has no playback button.
White hover/focus treatment is scoped to the banner's direct controls.

Long titles wrap within the left column; the action column stays separate. The
320px HHC 1035 structured banner grows to about 60.5px; at 390px and larger the
same title fits the 48px banner. Real long-title case: Hymns (1985) 42,
Hail to the Brightness of Zion’s Glad Morning!, plus a synthetic longer title.
Dark page still affects notation/PDF content only. Print receives no gradient.

## Files

- index.html: banner wrapper, existing source node moved below title, opening
  metadata kept below the wrapper.
- app.js: playback attachment container/order only; no engine changes.
- styles.css: shared gradient membership and scoped compact banner styles.
- sw.js: v139 shell cache.
- tests/score-identity-banner.mjs: targeted responsive/interaction coverage.
- reports/score-identity-banner.md: this report.

## Verification

Banner suite in Chromium and WebKit: 320x740, 390x844, 820x1180, 1180x820,
1440x1000. All three views, title/source, white controls, dark-page invariance,
long-title wrapping, no overflow/overlap, Tap Zones open/dismiss and print exclusion.
Final PDF notice spacing also checks PDF clearance above the footer.
Chromium verifies real playback, keyboard activation, pause/resume, and hold-to-stop.
WebKit on this Windows runtime has no AudioContext, so its playback verification
is limited to button availability, placement and focus. No physical-device claim.

Existing targeted regressions: compact-key-toolbar and pdf-first at 820px,
score-view-menu-state at 390px. JavaScript syntax and git diff --check.
No full music-engine suite, PrimarySongs changes, or unrelated diagnostics edits.
Screenshots are under ignored test-results/score-banner-{engine}-{width}-{view}.png.
