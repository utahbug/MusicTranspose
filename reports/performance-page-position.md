# In-frame performance page position

Repository root and origin verified; branch codex/pages.

## Display and ownership

The existing #page-position status node moves from its hidden masthead container
into the current .pdf-page-frame or .mxl-page-frame. navigation.js retains a
reference so it can reattach the same node when virtual frames are regenerated.
There is one counter, no toolbar placeholder, and no second source of page state.
Page index/count and all page-turn/pagination algorithms remain unchanged.

The label uses 26px, weight 600 tabular numerals, 1.2 line height, an 8px bottom/right
inset, and a restrained near-opaque backing. No border, button styling, animation,
or transition. It has pointer-events:none and user-select:none. PDF dark-page
colors are explicit; XML/Melody inherit the existing whole-score dark inversion.

Absolute positioning within the current frame reserves no score-layout space.
When annotation tools intersect the counter in landscape, only the counter lifts
above those tools, remaining inside the current PDF frame. Resize/scroll observers
update this display-only clearance; pages and annotation controls do not move.

## Visibility and accessibility

Shown only in page-turn mode with more than one page and the score view open.
Hidden for one page, Continuous Scroll, Auto-scroll, Library, Lyrics, and print.
Auto-scroll retains its existing no-page-number semantics. Existing role=status,
aria-live=polite and aria-atomic=true remain; aria-label is Page N of M in all views.
Text updates synchronously in the successful page-turn path. Cancelled gestures
do not update it. No animation means reduced-motion settings need no exception.

## Annotation and export

Annotation Previous/Next uses the same page state and moves the counter with it.
The node is a passive DOM sibling, never part of either PDF or annotation canvas.
Print CSS hides it. PDF output copies the original PDF canvas; XML printing engraves
musical XML separately. The indicator does not enter musical XML or exported assets.

## Files and checks

Files: index.html, navigation.js, styles.css, sw.js (v140 shell cache),
tests/performance-page-position.mjs, tests/compact-key-toolbar.mjs (update the old
hidden-status expectation), and this report.

Targeted counter suite: Chromium and WebKit at 390x844, 820x1180, 1180x820,
1440x800. Multi-page PDF (The Nativity Song), Transpose and Melody only
(The Spirit of God), single-page PDF (HHC 1035), next/previous/first/last,
actual browser tap through the counter, cancelled gesture, annotation navigation,
mode changes, Library/Lyrics return, dark page and print exclusion.
Desktop height 800 exercises multiple Melody pages; at 1440x1000 that song fits
one Melody page and the indicator correctly hides.

Targeted existing regressions: compact-key-toolbar at 820px; PDF annotations at
1180px including drawing, cancellation, undo, persistence, resize and clean print.
JavaScript syntax and git diff --check. No full music-engine suite.
Screenshots: ignored test-results/page-position-{engine}-{width}-{view}.png.

Physical iPad verification at actual playing distance remains important; these
checks are browser simulations and do not establish physical-device readability.
