# Dense-PDF page indicator clearance

Root/remote verified; branch codex/pages. Builds on the existing in-frame counter.

## Placement

PDF placement now reads the original rendered canvas once per canvas, records
non-white ink in conservative 4-pixel cells, and caches a summed-area map in a
WeakMap. It maps the current visible/trimmed canvas rectangle to screen coordinates;
no PDF rendering, trimming bounds, scaling or page count is changed. This is blank
space detection, not notation recognition.

Try the existing bottom-right 8px inset first. If occupied, search clear rectangles
upward/inward in 2px steps, preferring nearby vertical movement. A 3px guard around
the complete counter rectangle protects antialiased notes, barlines, lyrics and
credits. Annotation tools are excluded from candidate areas, so lifting the counter
cannot accidentally move it onto PDF notation. Resize, scroll, page turns, annotation
mode changes and trim toggles refresh placement.

26px/600 tabular text remains standard on tablets/desktop. Phones use 22px with
less padding. A constrained PDF can also use that 22px treatment if no 26px rectangle
fits. XML/Melody keep their existing frame-relative bottom-right placement; their
pagination and engraving are unchanged. There is no animation.

An entirely occupied page could have no safe rectangle even at 22px. In that case
the same live status becomes screen-reader-only rather than covering source ink.
No tested page needed this last-resort guard; tests require a visible clear position.

## State, interaction and output

The existing single #page-position node, page-index/count owner, successful-turn
update timing, aria-label Page N of M, live status and pointer-events:none remain.
One-page/Continuous/Auto/Library/Lyrics/print visibility rules are retained.
PDF annotation Previous/Next stays synchronized. This DOM overlay never enters
PDF canvases, annotation storage, musical XML or generated print/PDF pages.

## Dense examples and verification

Before the change, the old corner rectangle covered source ink on Choose to Serve
the Lord pages 2-5 and The Spirit of God pages 1-2. Real source PDFs are unmodified.
Independent full-resolution pixel checks now confirm zero non-white pixels beneath
the counter plus a 3px guard across all seven pages, with trim on/off, dark mode,
keyboard First/Last, and annotation Previous/Next. The counter remains inside its
current PDF frame and clear of annotation controls.

Browsers: Chromium and WebKit, 390x844, 820x1180, 1180x820, 1440x800.
Tests: tests/pdf-counter-clearance.mjs; tests/performance-page-position.mjs;
existing PDF annotation regression at landscape tablet width; syntax/diff checks.
No full music-engine suite. Physical iPad playing-distance acceptance remains pending.

Files: pdf-counter-clearance.js, navigation.js (presentation hooks only), styles.css,
sw.js (v143 + offline helper), tests/pdf-counter-clearance.mjs,
tests/performance-page-position.mjs (responsive font expectation), and this report.
Screenshots: ignored test-results/pdf-counter-clearance-{engine}-{width}-{song}-{page}.png.
