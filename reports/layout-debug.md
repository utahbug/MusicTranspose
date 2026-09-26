# Temporary real-device layout diagnostics

Access: https://utahbug.github.io/MusicTranspose/?layoutdebug=1

Open the affected structured score in its existing problematic view. Tap Layout diagnostics, then Refresh measurements. Wait for Settled measurements captured and tap Copy report. Paste into the conversation. Clipboard failure exposes a selectable read-only report. Close collapses the overlay; removing the query parameter and reloading removes diagnostics entirely.

The module installs no UI, listeners, or measurement work without the exact layoutdebug=1 parameter. In diagnostic mode, its fixed shadow-DOM panel does not participate in document/score layout, does not modify preferences, and cannot trigger underlying score taps. It is hidden for printing. No page balancing, note scale, margins, engraving, or Lead code was edited.

Capture waits for document.fonts.ready, actual app ready/not-busy state, score aria-busy=false, one second of unchanged runtime geometry and no observed score/viewport/footer changes, then two animation frames with a final consistency check. Changes clear the previous report immediately. A bounded wait reports unavailable/unsettled rather than presenting earlier measurements as current. Refresh can be used after device chrome/keyboard/rotation changes.

Report includes inner/client/screen/available-screen dimensions, DPR, visualViewport values, actual screen orientation and CSS orientation separately, media-query state, safe-area probe, measured header/footer/score bounds, insets, effective width, virtual-page capacity, song identity/title, mode, note scale and spacing profile, key/octaves, navigation/page counter, system measure spans/heights, assigned systems and unused space. Inseparable system groups and any existing fit scale are identified. Continuous/PDF views without virtual-page frames report page geometry unavailable rather than inventing it. Browser page zoom is explicitly not inferred.

Targeted checks: tests/layout-debug.mjs, Chromium and Windows WebKit at 512x682 and 390x844, DPR3/touch, with subsequent resize to 768x1024 and Lead switch. Compared debug off/on/open: identical width, page capacity, note scale and page count. Redeemer Normal reproduces 4 pages at 512x682 and returns to 1 page at 768x1024. Verified URL gate, fonts/stability fields, Refresh clearing stale capture, clipboard/fallback, mode update, no overflow and no browser errors. Phone panel screenshots visually inspected. These are browser-engine checks; the forthcoming report will supply actual iPhone values.

Static production app has no build step. Only index.html, sw.js, layout-debug.js, the targeted test and this report belong to this change. Previous local diagnostic files are excluded. No full music-engine/chord suites run.
