# Original PDF as the default presentation

## Opening and session rules

A normal Library/List song open now lets `loadSong()` select the representation instead of implicitly requesting Normal XML. Songs with `pdfAsset` open that published PDF; PDF-only songs keep their existing path; XML-only/local structured songs retain structured opening. Explicit Lead actions still open Lead. One song remains one Library entry.

The existing `showPdfFallback()` / `renderPdf()` path is reused. Its legacy helper/flag names are retained to limit risk; they represent the selected PDF presentation, not an error. Structured metadata, key choices and Lead availability are prepared without engraving XML before showing PDF. This retains immediate access through the existing Most music / Normal / Lead / PDF selector. No second viewer, toolbar styling or layout was added. If a PDF cannot be loaded, the existing structured recovery path remains available with an error message.

Lyrics keeps the current score representation in memory. PDF, structured, transposed and Lead round trips retain that view; key/register data are not reloaded. The existing library-open event used by Lyrics now carries `retainScore` so navigation cancels gestures/closes controls without resetting the retained page index. Showing the retained score refreshes navigation display so the page indicator is visible immediately, not only after the next turn. Real Library navigation still resets its page index. Tap recognition, geometry and pagination algorithms are untouched.

On Library return, a single in-memory snapshot records the current structured song, view, key and register with its Library/List context. Reopening that song in the same context restores the snapshot. Opening another song or reopening in another context uses the default again. Choosing PDF before leaving does not retain a structured override. There is no persistent cross-session working-view store. The prior XML-only default also remains: an unrelated prior Lead choice does not force a new XML-only song into Lead.

## Files

- app.js: default selection, optional preparation without engraving, existing PDF helper reuse, retained Lyrics event, bounded working-session snapshot.
- library.js: normal row opening no longer requests XML; exposes the current context for session matching.
- navigation.js: retain the page index for a Lyrics round trip.
- sw.js: cache v131 for the changed application shell.
- tests/pdf-first.mjs: focused end-to-end opening/session/viewport coverage.
- tests/score-lyrics-toggle.mjs: explicitly enter structured view before transposing.
- tests/pdf-fallback-tempo.mjs: explicitly request structured view; use Normal for songs without Lead support.
- This report.

## Verification

Chromium/Edge PDF-first tests pass at 820x1180, 1180x820, 390x844 and 1440x1000. Checks include no XML engraving/flash before default PDF; clean zero-scroll opening; toolbar bounds; PDF/Lyrics page position and the next navigation action; five next/previous tap pairs per viewport; Tap Zones; dark-page; PDF Print; trim; Normal/Lead/transposed Lyrics returns; same-context reopening; different-song/context defaults; explicit Lead; PDF-only opening. All 679 bundled structured songs currently have PDF companions, so XML-only is verified by importing real MusicXML through the normal UI.

Existing targeted suites pass: score-lyrics-toggle (five widths, repeated same-coordinate touch, focus, playback, key/register/page state); pdf-fallback-tempo (four collections, print, tempo, key/register, responsive checks, offline reload and missing-PDF recovery); pdf-taps (bundled/imported PDFs, all four viewports, offline imported reopening, drift, cancellation and single-action protection). Syntax and diff checks pass. No full music-engine suite was run.

WebKit functional checks also pass at these four sizes. Earlier phone PDF/Lyrics runs emitted `ResizeObserver loop completed with undelivered notifications.`; the same warning was reproduced by routing app.js, library.js and navigation.js from pre-change commit 3fbba06 and explicitly selecting PDF. The final complete WebKit run passed all four sizes without the warning. The test reports this exact known WebKit warning separately while continuing to reject other page errors. No production error suppression or unrelated layout correction was added.

These checks simulate browsers; they are not physical iPad/iPhone verification.

## Future toolbar work

The current selector still uses Most music / Normal / Lead / PDF. A future Original / Transpose toolbar can make these concepts clearer, including that the existing PDF notice's transposition restriction applies to the displayed PDF, not to the song's available XML. No terminology redesign, annotation work, export changes or persistent working-view memory is included here.
