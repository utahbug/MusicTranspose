# Unified score tap recognition (PDF, XML, Lead)

## Confirmed baseline

The published `score-taps.js` matched repository HEAD before edits. PDF touch had a 16 CSS-pixel radial allowance and retained its pointer-down zone. XML/Lead used 10px and required the release zone to match. At 820x1180, both structured views rejected 12px/16px movement and a 4px crossing of the upper-quarter boundary; PDF accepted them.

The score child-list observer and body-wide hidden/open observer also cancelled valid gestures after harmless content insertion or unrelated hidden writes. These failures reproduced in all three forms. Ordinary `displayVirtual()` alone passed; a trusted touch whose hit element was removed also passed in both old and new Chromium code. Those are safeguards covered by tests, not proven causes of the reported physical-device symptom.

The PrimarySongs v528 PDF touch path was read as a behavioral reference; no PrimarySongs code was changed or ported.

## Narrow correction

- One input-type contract: all touch uses the existing PDF 16px allowance and original down-zone. Mouse/pen retain 10px and same-release-zone requirements.
- Trusted touch is captured by the stable playing view rather than replaceable SVG descendants. Release still checks actual hit content, score bounds, controls, selection and eligibility.
- Exactly one pointer-up owns navigation. Gesture state is cleared before navigating; duplicate releases, touchend and compatibility clicks never navigate.
- Meaningful invalidation is retained: busy/render/session changes, blocking controls, scroll/resize, cancellation/lost capture, visibility/focus changes, multitouch, excessive movement and presses over 600ms.
- Harmless DOM maintenance no longer cancels. Briefly opened blockers still cancel; mutation records preceding a new pointer are discarded before that gesture starts.
- `scoreTapGeometry`, navigation.js, virtual-pages.js, pagination, score layout, Lead extraction and all UI are unchanged. Upper area remains 25%. PDF navigation remains Page Turns-only.
- Offline shell cache advanced from v129 to v130.

## Targeted verification

`tests/score-tap-parity.mjs` uses bundled Choose to Serve the Lord PDF and The Spirit of God in Normal and Lead. Default is 50 repeated cycles per form/viewport. Each cycle asserts every first/last/previous/next transition, including 1 -> 2 -> 3 where the score has three pages. The four cases are 820x1180 and 1180x820 touch tablets, 390x844 touch phone, and 1440x800 mouse desktop.

Chromium/Edge: 50 cycles per form/viewport (600 cycles total). A final 10-cycle touch rerun checks the refined cancellation guards and browser-generated 8px/12px drift. Desktop runs 50 cycles on the final code. WebKit: 10 cycles per form/viewport. Synthetic PointerEvents additionally test 12px/16px drift, zone crossing, excessive movement, duplicate releases/clicks and mouse/pen rejection. Actual browser touch exercises virtual hit-target replacement. The initial 1440x1000 Lead fixture correctly fit on one page; desktop testing uses 1440x800 to ensure real transitions, without altering layout or pagination.

`tests/score-tap-contract.mjs` directly counts callback invocations, including both sides of zone boundaries, first/last actions, duplicate pointer/touch/click events, harmless DOM updates, transient blockers, busy transitions, session events, selection, controls and multitouch.

`tests/pdf-taps.mjs` covers bundled and imported PDF copies at all four original viewports, offline imported reload, drift, cancellation, guide proportions and Continuous-mode rejection. The old harmless-child-insertion cancellation assertion now expects one turn. Its guide opener follows the current toolbar location.

`tests/navigation-settings.mjs` checks navigation preferences, auto-scroll, pause, speed, manual interruption, clearance and return-to-start. Syntax and diff checks also run. No full music-engine suite.

These are browser simulations, not physical iPad tests. Final confirmation of the user's symptom requires the user's post-deployment iPad check.

## Reproduction commands

Set PLAYWRIGHT_PACKAGE to the installed Playwright package.json and TEST_URL to the local server, then run:

```
node tests/score-tap-contract.mjs
node tests/score-tap-parity.mjs
node tests/pdf-taps.mjs
node tests/navigation-settings.mjs
```

Parity options: TAP_ENGINE=webkit, TAP_CYCLES=10, TAP_WIDTH=1440 (target a viewport), TAP_BASELINE=1 (log before-behavior at tablet portrait). Baseline mode describes the code being served; use the pre-fix revision when reproducing the recorded baseline.
