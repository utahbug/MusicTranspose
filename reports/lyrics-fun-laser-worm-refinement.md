# Lyrics Fun laser and worm refinement

Starting commit: 86b4c50d642dbcf75168894fd91cd6e25cc43d69.

## Desktop laser diagnosis

The SVG had a valid on-screen rectangle, opaque contrasting stroke and a visible fixed parent. The failing path was the dash animation: in a real-time Edge probe, 100 ms after firing its computed dash offset remained 38px (the fully hidden initial pulse), despite the independent 300ms hit timer still completing. The keyframe endpoint used a calc expression derived from unitless custom properties. This was a rendering/animation issue, not a hit-detection failure. No desktop-only hiding rule was found.

The replacement uses an explicit pixel-valued path length for dash array/offset and interpolates to zero. The 2px beam reveals from origin to destination over 90ms, stays visible through 240ms, and fades/clears at 300ms. A repeated real-time probe now reports offset 0px and opacity 1 at 110ms, with visible captured pixels in both themes. Reduced motion retains a stationary, fading line. Existing palette and hit/burst timers remain.

## Layering and origin

The fixed, clipped, pointer-transparent Fun overlay remains at layer 6 above lyrics/title/metadata. Notes/worm use internal layer 1; beams/bursts use layer 2. Lyrics controls/playback use layer 7 and remain interactive. No extreme stacking values, new animation loop, per-segment timer or layout measurement per shot-frame was added.

Every hit and empty-space shot independently samples x=20–80% and y=55–75% of the currently visible Lyrics playfield. The same formula applies to phone, tablet and desktop. Empty shots still end at the tapped point. No corner/edge origin branch remains.

## Worm

Dot height and spacing are exactly half the previous values: 0.15 and 0.275 times lyric font size. Segment count is preserved (24 on the tested phone, 47 on larger layouts); the chain remains long enough to follow. At 22px lyric size, body height is 3.3px, head height 3.96px, spacing 6.05px. Elliptical notehead proportions are retained.

The head is filled currentColor at full opacity and only 20% larger than body. Body dots are transparent with a 1px currentColor outline and 65% opacity. Themes inherit existing light/dark lyric ink. Hit tolerance remains unchanged for practical tapping. Existing waypoint movement, head kill, one-tail-segment body shortening, four-second respawn, phase durations, reduced motion and preferences are unchanged.

## Validation

- Real-time tests at 1440x1000, 1180x820, 820x1180 and 390x844 verify visible beam interpolation, both themes, effect layering, repeated varied origins within bounds and cleanup on Score switching.
- Worm regression checks at the same viewports cover half-size geometry, solid/hollow styles in both themes, body shortening down to head-only, head kill, empty-shot endpoint, palette variation, four-second respawn, reduced motion, restart and cleanup.
- Motion model: 160 independent waypoint paths, escape behavior, timing, segment-count bounds and responsive resizing.
- Existing Fun suite covers note flights, tap/scroll safety, controls, preferences, playback/view changes, print exclusion and offline preferences.
- Screenshots reviewed on phone and larger layouts in both themes. No text reflow or surrounding UI redesign.

Service-worker cache version advances to v79 to distribute changed bundled scripts/styles. No storage or offline architecture changes.

Limitations: viewport/touch tests run in Edge/Chromium, not physical iOS Safari. Motion is intentionally subtle; no scoring or sound was added.
