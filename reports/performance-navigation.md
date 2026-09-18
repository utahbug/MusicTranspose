# Live-accompaniment navigation refinement

Starting commit: `4eb536b41c20320cefaca9a909a18c2a52a50285`.
Existing project: MusicTransposePrototype; existing remote utahbug/MusicTranspose.

## Performance controls

Settings now calls the existing `pages` mode **Tap to flip pages**. Its associated
accessible description explains four invisible zones inside the score content:

| Zone | Action |
| --- | --- |
| Upper left | First page |
| Upper right | Last musical MXL page / last actual PDF page |
| Lower left | Previous page |
| Lower right | Next page |

Both axes divide at the midpoint of the score interaction rectangle. One primary
pointer sequence produces one action. Existing movement (8px), duration (450ms),
scroll, selection, canceled-pointer, interactive-control and open-dialog/popover
exclusions remain. Explicit buttons and keyboard navigation remain accessible.
No instructional overlay is placed on the score; concise help lives in Settings
and is linked to the radio choice with aria-describedby.

PageDown/ArrowRight still mean Next, PageUp/ArrowLeft still mean Previous.
Home/End retain First/Last. Held-key repeat remains ignored. All commands clamp
at the ends, including one-page scores, and use prepared pages with no animation,
network request or score re-engraving.

## Musical pages and credits

MXL virtual pages now come exclusively from captured OSMD system bounds. The
separate source-credits section is no longer cloned into text-only virtual pages.
Thus the last frame always contains the last musical system. Whole-system packing,
ink clearance and source-measure anchors remain unchanged.

All original post-score credits, additional verse/source text, attribution and
copyright remain in Continuous Scroll (and existing printing). No source content
is deleted. PDFs retain their complete actual page sequence, including any credits
printed on those pages. No PDF page-content filtering was added.

Normal-density examples, now counting only music:

| Song | iPad landscape 1180×820 | iPad portrait 820×1180 |
| --- | ---: | ---: |
| The Nativity Song | 4 | 2 |
| Follow the Prophet | 3 | 2 |
| Choose to Serve the Lord (PDF) | 5 | 5 |

Earlier reports that included final MXL text-only pages describe the earlier
version and are superseded by this behavior.

## Initial default and explicit preference

Without a valid stored choice, touch capability (`maxTouchPoints > 0` or a coarse
pointer) together with a viewport short edge of at least 600 CSS pixels selects
Tap to flip pages. Other layouts select Continuous Scroll. Short-edge detection
keeps landscape phones in Continuous mode; no user-agent sniffing is used.
Desktop-style iPad Safari still exposes touch capability. Convertible touch PCs
can qualify as tablet-class layouts; an explicit preference always takes priority.
The device decision is initial only, not forcibly reapplied on orientation changes.

Explicit choices use localStorage under `music-transpose-navigation-v1`. Existing
valid preferences from that local key take precedence; otherwise a valid legacy
sessionStorage mode is migrated without being replaced. Session auto-scroll speed
is preserved separately. An automatic device default is not stored as an explicit
choice. If storage is unavailable, the current in-memory choice still works.

When entering Tap to flip pages from midway through a score, MXL uses the first
visible system's source-measure anchor and PDF uses the first visible actual page.
The navigation strip is shown before page capacity is measured: otherwise its
height change could move the target measure onto another page. New song sessions
still begin on page one. Re-engraving for density, key, octave and viewport changes
continues to rebuild pages and preserve approximate musical position.

## Verification

The focused `tests/performance-navigation.mjs` tests fresh defaults on tablet
landscape/portrait, phone portrait/landscape, and desktop (including a narrow desktop
window). It changes every default and verifies the explicit choice across reload
and a new browser context with only persistent storage carried forward. A legacy
session Continuous choice migrates correctly on a tablet.

At both iPad sizes, real browser touch events exercise all four zones repeatedly
on Nativity, Follow the Prophet and a five-page PDF. First/last bounds, single
page behavior, drag rejection, controls, keyboard/pedal equivalents and offline
operation are checked. MXL last pages contain SVG notation; there are no separate
credit frames. Continuous credits remain visible. Page turns make no new fetches
or engraving calls. Mode entry from mid-score retains the source measure or PDF
page. Screenshots include the final musical page rather than a metadata-only page.

The broader suite covers density reflow, virtual-page bounds and preservation,
all 119 MXL scores, the two PDFs, print, Library/Favorites/lists/order, stable IDs,
ensemble/instrument guidance, Reset/octave, playback, Lyrics/Fun and offline use.
Seven baseline fixtures and repeat baseline builds verify unchanged 121 bundled
source hashes and the frozen 119-score fingerprint dataset.

Local concurrent browser startup exposed intermittent timeouts on the prior
static server. Verification was moved to a quiet project-local static server with
a larger connection backlog; this is test infrastructure only, not an application
dependency. Physical iPad Safari, browser-chrome/safe-area transitions, real pedal
hardware and piano-side comfort still require on-device acceptance testing.

Implementation files: navigation.js, virtual-pages.js, index.html, styles.css,
sw.js (cache v44). Tests: performance-navigation.mjs, virtual-pages.mjs,
ui-navigation-fun.mjs, run-current-suite.mjs. Documentation: this report and README.

Final local verification: all 29 current browser suites passed in the full rerun
on the quiet static server, including the focused device-default/four-zone tests
and all 119 MXL original/up/down/reset checks. Seven fingerprint fixtures and
the complete frozen-baseline/source-hash verification also passed.
