# PDF-first timing and Melody capabilities

## Root causes

Playback settings and visual metronome availability explicitly required !isPdf(), excluding songs with valid MusicXML whenever Original PDF was displayed. Playback controls also used representation gating and pdfFallback blocked playback. The source callback could reuse a retained transformed/Melody XML when PDF was visible rather than selecting original structured timing.

The Score View menu required leadSource?.ok and its click handler silently substituted Normal when leadSource was absent. This conflated an unprepared source with unsupported Melody. The previous PDF-first path eagerly derived Lead, so that specific false-disabled condition was not reproducible on every opening; the gate itself was preparation-dependent and unsafe.

## Implementation

app.js now shares a hasTiming capability rule: present, non-missing, non-PDF-only song with playbackAvailable not explicitly false. Original PDF plus MusicXML exposes existing playback and tempo/metronome controls. PDF-only songs remain excluded. Original timing always comes from the original structured source; Transpose/Melody timing remains their current musical XML. The existing playback.prepare(), timeline, and metronome clock are reused, without changes to playback synthesis or side-pulse presentation.

Structured source fetches share cached/in-flight loading. The existing initial source load and lightweight metadata parsing remain because Original MusicXML export already relies on that source. Timeline parsing is lazy on Settings/playback/metronome use. No XML engraving occurs for PDF timing, and the PDF DOM remains unchanged.

Melody availability uses prepared extraction results when present; otherwise supportsLead(song), including bundledLeadIds and imported leadAvailable metadata. PDF-first opening defers Lead derivation. Selecting Melody derives it on demand and switches directly; missing structured source uses the shared preparation path. An actual extraction rejection leaves the current PDF visible, disables Melody, and reports an error rather than falling back silently. Existing key/register state is preserved when already prepared. Original to Transpose uses the same prepared source without intermediate Melody.

## Files

- app.js: capability gates, timing source selection, shared source preparation, lazy Melody.
- sw.js: app cache v148.
- tests/pdf-first-capabilities.mjs: new capability regressions.
- tests/metronome.mjs: update Original PDF plus XML timing expectation.
- tests/pdf-first.mjs: update Original playback expectation; correct stale page-label assertion to use the current aria-label.
- reports/pdf-first-capabilities.md: this report.

No changes to metronome.js, playback.js, CSS, extraction algorithms, PDF rendering, pagination, annotation, export implementation, Library, or Lyrics.

## Targeted verification

- HHC 1035, As I Keep the Sabbath Day; The Spirit of God: Library opens Original; Transpose/Melody enabled before Lead derivation; Settings parses timing without engraving or altering PDF DOM; Side pulse and playback work in Original; page turns retain the clock; Lyrics return and Melody/Original roundtrips preserve capability; original timeline replaces retained Melody timing; key/register and adjusted tempo survive transitions.
- The Nativity Song: known unsupported Melody remains disabled, fresh Original to Transpose works.
- Choose to Serve the Lord (PDF only): Transpose/Melody disabled; no playback/metronome controls or pulses.
- Imported HHC 1054 MusicXML-only: local leadAvailable, structured playback settings and Melody continue working.
- Chromium capability matrix: 390x844, 820x1180, 1180x820, 1440x1000. WebKit checks the same PDF cases; XML-only import is Chromium-only because Windows WebKit fails File/Blob persistence in IndexedDB. This storage failure was separately reproduced with the pre-change app (UnknownError preparing Blob/File data).
- Existing metronome test at 820px: meter/pickup/embedded tempo, audio synchronization, tempo/reset/pause/resume/stop, page turns, dark/reduced motion, view hiding.
- Existing PDF-first test at 820px: no engraving flash, Lyrics/page/working-state roundtrips, context resume/reset, PDF tools/print/trim/taps.
- Existing export test at 820px: Original and transformed XML/PDF, annotations/offline, filenames, HHC 1035 56 notes/34 harmonies/no engraving anchors.
- score-tap-contract.mjs and lead-hhc1035.mjs pass. No full music-engine/chord suite.

Viewport/browser testing does not prove physical iPad behavior. Side-pulse geometry and colors are unchanged from the prior release.
