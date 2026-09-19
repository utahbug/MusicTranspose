# Lyrics Fun automatic targeting

Starting commit: 15d977a8b689fcdb8a12de8541310e008b176ed9.

## Interaction correction

The previous geometry fix deliberately required pointer proximity and retained a target from pointer-down. That implemented aiming, contrary to the desired relaxed interaction. Target choice now ignores tap location. The existing safe-playfield tap/drag/control checks are unchanged; one valid tap fires automatically at a current target. No extra listeners, polling or animation loops were added.

Floating notes are chosen uniformly at random from active, unshot, visibly intersecting note rectangles. Pending replacements and offscreen notes are not selected. Each destroyed/expired note keeps its independent 1–2-second replacement through the existing animation clock, with delayed targets counted toward the configured limit.

Worm selection reads the current rendered segment list at firing time. When head and body are eligible, it uses 30% head / 70% body, then uniformly chooses a current body segment. If only the head remains, it is always selected. If the head is outside the visible playfield but body remains visible, a visible body segment is selected. A still-active worm never becomes an empty shot merely because its head is offscreen. No removed segment references are retained.

Targets retain the previous rendered-center geometry: client rectangles convert once into local SVG coordinates. The selected note freezes during impact; the worm briefly holds during its hit beam, then head destruction or one-tail-dot shortening occurs. A head kill retains the four-second respawn gap. Wandering, artwork, scale, phase lengths, color palette and Fun defaults are unchanged.

## Origin and no-target behavior

Origins are six CSS pixels beyond the visible clipped playfield:

- 45% left edge, at 45–85% of playfield height.
- 45% right edge, at 45–85% of playfield height.
- 10% bottom edge, at 20–80% of playfield width.

The overlay clips the outside starting point, so the thin beam visibly enters through the border instead of appearing from a mid-screen cannon. Origins vary independently. Endpoints have no random offset: selected rendered target center, or the exact tap point when no active target exists. No-target shots have no penalty and do not affect a worm awaiting respawn.

## Verification

Tests cover 390x844, 820x1180, 1180x820 and 1440x1000. Repeated shots use one neutral tap position, never target coordinates. They check floating-note hits, exact rendered endpoints, independent replacements, 30 seconds of continuous note activity, body shortening, head kill, no-target shots only during the respawn gap, four-second respawn, both themes and phase/exit cleanup.

A 20,000-shot helper sample verifies approximately 30/70 worm selection and 45/45/10 origins, including head-only and no-target cases. Real-time beam tests inspect visible interpolation and capture both themes at all viewport sizes. Existing regression coverage includes control/scroll exclusion, saved defaults/count, reduced motion, print hiding, playback through Score/Lyrics switching, offline preferences, all tail hits down to head-only and natural worm escape/respawn.

Changed runtime files: lyrics-fun.js and sw.js (cache v83). Tests are updated to the new interaction contract; no other application UI or music code changed.

## Limitations

Responsive testing uses Edge/Chromium viewport and touch simulation, not physical iOS Safari. The existing approximately 300ms beam throttle still prevents overlapping impact actions; it does not impose a long delay between taps. Random choice can occasionally repeat a region or produce consecutive head hits by chance.
