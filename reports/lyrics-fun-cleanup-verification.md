# Lyrics Fun cleanup verification

Verified 2026-09-26 against the existing MusicTranspose production application.

## Result

The application already implements the requested behavior. No application changes or activity redesign were needed. Updated `tests/lyrics-cleanup.mjs` to use the current combined Source/List menu and the existing narrow-phone Library button dimensions shared with Score mode.

- Normal Lyrics has no visible Game/Fun entry or label.
- Hold the Lyrics song heading for two seconds to start Fun. Touch, mouse, and holding Space on the focused heading work.
- Short presses, movement, scrolling, cancellation, focus loss, and multiple pointers do not accidentally activate it.
- A fixed bottom Stop button (at least 44px tall) exits with one tap, removes activity/overlays immediately, and restores normal Lyrics.
- Active Fun is local to the view, never restored after reload. The existing note-count preference remains available.
- The shared Library control, List return context, background/font preferences, and Score session are preserved.

## Targeted verification

Passed `node tests/lyrics-hold.mjs` and `node tests/lyrics-cleanup.mjs` using Playwright with Microsoft Edge against the production static app served on localhost:8771.

Responsive checks passed at 320x568, 390x844, 430x932, 844x390, 820x1180, and 1440x1000. Covered real touch/mouse holds, keyboard activation, rejected short/moving presses, fixed reachable Stop, final-verse clearance, no horizontal overflow, Library/List restoration, transposition session retention, persisted appearance, and offline reload/activation/exit. Narrow portrait and landscape screenshots were also inspected.

The application is served directly as static files; there is no separate compilation/build step. No full music-engine or chord suites were run. Browser viewport emulation does not substitute for physical-device safe-area testing.
