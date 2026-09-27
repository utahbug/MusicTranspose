# PDF tap reliability

## Findings

Both bundled and local PDFs already use `renderPdf`, `installScoreTaps` and the same page navigation. No separate local-PDF hit path was found. Import testing uses the exact five-page Choose to Serve the Lord PDF through the upload UI, so page content is identical.

The old universal 10 CSS-pixel radius rejects deliberate simulated finger drift at 12/16px. Releasing across any zone boundary also rejects a tap, even with only a few pixels of movement. PDF used 50/50 vertical zones, making taps between 25% and 50% jump rather than step. These are reproduced rejection/behavior problems; no physical-iPad event trace was provided, so the exact cause of the user's individual missed taps cannot be proven from simulation alone.

## Change and limits

- PDF and MXL both use upper 25% First/Last and lower 75% Previous/Next; equal left/right halves. The help overlay reads the same geometry.
- Only PDF touch pointers gain a 16px radial drift allowance. Mouse, pen and MXL stay at 10px. Movement beyond the radius cancels immediately, even if the finger subsequently returns.
- PDF touch retains the pointerdown zone for a small boundary crossing. Release must remain inside score bounds. Scroll, resize and replacement invalidate the gesture.
- Duration remains at most 600ms; tested 550ms accepted and 650ms rejected.
- Selection, pointercancel, lost capture, controls/dialogs, non-primary input and score replacement safeguards remain. Compatibility clicks never navigate.
- PDF taps remain Page Turns-only. No render/trim, MXL pagination or layout changes.

## Targeted results

Baseline, both bundled/imported: 0/8/10px accepted; 12/16/18/24/40px rejected.
Final, PDF touch: 0/8/10/12/16px accepted; 18/24/40px rejected. These are synthetic pointer drift tests, not measured physical finger traces; 16px is a bounded tested tolerance, not a claim of a universally optimal threshold. Real browser touch taps/mouse clicks also tested.

Chromium/Edge: bundled and UI-imported copies at 820x1180, 1180x820, 390x844 and 1440x1000. First/middle/last, repeated turns, old 35% boundary, quarter-boundary drift, long press, drag out-and-back, selection, compatibility clicks, pointercancel/lostcapture, scroll/resize, score reset/DOM replacement, modal exclusion, overlay 25% and Continuous-mode rejection pass. Imported PDF offline reload/page turning passes on tablet.

WebKit: bundled PDF passes at all four sizes. UI import in this Windows WebKit runner fails to save with the existing browser-storage error before navigation can begin; imported WebKit/offline parity is therefore unverified. No import or storage workaround was added to production.

Existing score-reliability smoke passes for MXL navigation, metadata, controls, overlay, PDF and Lyrics. No full chord or music-engine suite run. Static production assets served directly; no bundler build step exists. Physical iPad validation remains the user's final device check.

## Files

`score-taps.js`, service-worker cache v123 in `sw.js`, `tests/pdf-taps.mjs`, the updated PDF overlay expectation in `tests/score-reliability.mjs`, and this report.
