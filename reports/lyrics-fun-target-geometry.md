# Lyrics Fun target replenishment and beam geometry

Starting commit: 7280d374187b6a782136612fa2b7bf8d70dc3ceb.

## Scope and root causes

The four-note setting was used to create one finite batch at phase entry. Destroying or expiring a target removed it without filling the vacancy. Each removal now creates one independently delayed flight, using the existing animation clock: 1–2 seconds after destruction/expiry. Pending flights count against the configured cap, so delayed and visible targets combined cannot exceed it. Lowering the count removes excess flights; phase changes, Fun disable and view cleanup remove all pending targets. No new timer or animation loop is used for replacement.

The prior note selection was random even when a tap was elsewhere. Worm hits used mathematical trail positions at pointer-up and a fixed 12px tolerance; they did not retain the target touched at pointer-down. A moving tiny segment could leave the finger before release. In addition, a hit immediately removed/shortened the worm before the 300ms beam finished, making the beam visibly arrive at empty or moving content. Static/reduced-motion tests did not exercise that problem. No evidence of a universal device-pixel-ratio offset was found.

The superseded, uncommitted random-worm-hit experiment was removed in favor of the final command's direct head/body/empty-space rules. No random destination selection remains.

## Geometry

Target selection reads current getBoundingClientRect rectangles in client CSS pixels. Elliptical tolerances use 1.5 times each rendered half-width/half-height, without changing artwork. The closest matching normalized ellipse wins. A genuine tap remembers its touched target at pointer-down, then resolves that same connected target's current rendered center at firing; otherwise it checks current pointer-up geometry. Drag, scroll, pointer cancel and control exclusions remain.

The client center (or exact empty-space client point) is converted once into the actual overlay rectangle's local coordinates. This accounts for viewport/scroll placement and any rendered-to-local size ratio. SVG line endpoints use precisely that conversion. Notes freeze at their selected position. The worm holds its position during the 300ms impact, then head destruction/body shortening occurs; normal unpredictable wandering resumes afterward. Four-second respawn starts at destruction, not at the initial trigger.

Origins remain independently random within x=20–80%, y=55–75% of visible playfield. Color palette, thin beam appearance, worm artwork/scale, phase lengths and navigation are unchanged. Empty taps emit a beam to the tap and affect no target. Hits become available again at beam completion, so old burst cleanup cannot unlock an unrelated newer shot.

## Validation

Automated browser viewport checks: desktop 1440x1000, iPad landscape 1180x820, iPad portrait 820x1180, iPhone 390x844. Tests exercise four rapid note hits, replenishment to four, a further 30 seconds of repeated note activity, moving head/body taps with 100ms press duration, endpoint agreement within 1 CSS pixel, both themes, head kill, tail shortening, four-second respawn and clean phase/view transitions. Empty taps while notes exist preserve their count.

The existing ambient suite checks every tail segment down to head-only, empty tap endpoint, random color variation, reduced motion, escape/respawn and cleanup. The general Fun suite covers default count, saved preferences, scroll/control safety, responsive flights, themes, print hiding, Score/Lyrics playback continuity and offline preferences.

Changed runtime files: lyrics-fun.js and sw.js (cache v81). Motion helper/artwork and other application behaviors remain unchanged. Paused experiment snapshots are local ignored test artifacts, not deployed assets.

## Limitations

Tests use Edge/Chromium with viewport/touch simulation, not physical Safari hardware. The existing first note phase lasts 22–28 seconds; the sustained 30-second test uses the later note phase and transition without changing ambient timing. Worm hit artwork remains intentionally small; the pointer-down lock avoids finger-release drift without introducing automatic/random hits.
