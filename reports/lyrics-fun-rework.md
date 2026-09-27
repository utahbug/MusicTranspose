# Lyrics Fun rework

## Entry and exit

Four primary pointer taps/clicks inside the lyrics paper within 1500ms activate Fun. Each tap must finish within 450ms and stay within 10 CSS pixels. One, two or three taps do not activate. Controls, links, multi-touch, dragging, scrolling, interrupted pointers, window blur, resize and visibility changes reset the sequence. Ordinary implicit capture release after a completed touch and heading focus loss do not erase valid taps. There is no heading long-press entry or visible entry control.

Lyrics content uses `pan-y pinch-zoom`, disabled text selection/callout and passive pointer listeners; scrolling and pinch zoom remain available. The existing bottom Stop button exits immediately and clears the animation frame, targets, shots, effects and listeners. Fun and tap state are memory-only; reload returns to normal Lyrics. Existing appearance and note-count preferences remain readable.

## Activity and geometry

Worm helpers, phase, DOM, motion, hit/respawn state and CSS are deleted. Existing note targets and hit sparks remain, with note-only phases. Old hidden hold-settings markup and obsolete tests were removed/replaced.

The shot layer spans the visible viewport horizontally and remains `pointer-events:none`. Its vertical bounds intersect the lyrics paper, visual viewport and actual footer. The bottom is the minimum of the visible viewport bottom, paper bottom and footer top, minus an 8px safety margin. Footer measurement includes safe-area padding. ResizeObserver and visualViewport resize/scroll update the bounds; each shot measures again immediately before firing.

Each shot randomly starts at the left or right edge, at 55–90% of this usable area's height. There is no bottom launch. A crisp 1.8px tracer with an 18px tail travels for approximately 650ms; only one shot flies at a time.

A valid visible note is selected independently of tap position and frozen until contact, retaining the existing hit effect. With no target, the tracer travels horizontally to the opposite edge with no sparks. If the selected target disappears, the tracer continues from its current position to the opposite edge, clamping the endpoint within the visible area; it does not restart or produce a hit effect.

## Verification

- Chromium and WebKit touch/mouse checks: 320x568, 390x844, 844x390, 820x1180, 1440x1000.
- Four taps, one/two/three taps, expiry, controls/links, long press, drag, scroll, pointer cancellation, multi-touch and disposal.
- Both launch edges, source above measured footer including a simulated 34px bottom safe area, no horizontal overflow, layer pointer transparency.
- Hit effect, no-target miss, disappearing-target miss, full-edge travel, single layer, Stop/Library cleanup, reload default-off.
- Chromium offline Lyrics/Fun smoke check; normal Lyrics Library/List context, scroll, theme and Favorites checks.
- Four-minute simulated note-only lifecycle with bounded targets, replenishment and cleanup.
- Static production app served directly; no build bundler is used. No full music-engine/chord suite run.

These are browser-engine and viewport tests, not a claim of physical iPhone/iPad hardware verification. Safe-area behavior was also exercised with an explicit 34px reservation.

## Files

Production: `lyrics-taps.js` replaces `lyrics-hold.js`; `lyrics-view.js`, `lyrics-fun.js`, `lyrics-fun-ambient.js`, `styles.css`, `sw.js` (v124). Related obsolete worm/hold tests are replaced by `lyrics-cleanup.mjs`, `lyrics-taps.mjs`, the entry helper, model and note-respawn tests; existing playfield helper references are updated.
