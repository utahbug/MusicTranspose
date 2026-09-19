# Lyrics Fun defaults and independent flights

Starting commit: 7854f17. Existing MusicTranspose repository; no other project or score assets changed.

## Defaults and preferences
Previously Fun was off with one note, reset on every fresh view, and had no saved preference implementation. It now defaults to on with four notes only when the corresponding preference field is absent or invalid. Explicit false and counts 1–4 win. Only user changes write localStorage `music-transpose-lyrics-fun-v1` as `{enabled:boolean,count:number}`; opening the app does not overwrite choices. Reload/offline reload restore choices. An old unsaved OFF choice cannot be reconstructed retroactively. Blocked browser storage falls back safely to current-view operation.

## Independent movement
Each flight randomizes its own delay (0.35–5.5 seconds), horizontal origin (edge or interior), direction, resulting travel distance, start/end heights, duration (18–34 seconds), curve and existing six-type note artwork. Bounded rejection sampling separates planned arrival times by about 450ms and rejects near-matching same-direction origins/lane/speed. Nothing is assigned by note index; directions can coincide by chance.

80% of planned paths use the upper 5–39% of the safe visible lyric-body height; 20% use the middle/lower 48–80%. A small independent curve adds vertical drift. Title and controls are excluded by the existing body bounds. There is no per-word collision detection; notes can briefly cross text. Notes retain existing size, theme colors and hit artwork.

The old implementation actually used a shared-speed sinusoid and recurring respawns. To meet the requested one-shot behavior, the new flights move monotonically toward an offscreen edge, without reversal/bounce. Each view/enable launches one finite batch. Hits and misses are not automatically replenished. Changing count adds/removes only the count difference; re-enabling or reopening Lyrics starts a fresh batch. No continuous arcade loop.

## Interaction, accessibility and cleanup
Existing safe-tap movement/time thresholds, scroll cancellation, random accurate target selection, free-fire, single in-flight shot and hit burst remain. Pending/offscreen notes are not selected as visible targets. UI/control placement, playback and navigation unchanged.

Reduced-motion: targets stay stationary during their finite lifetime; existing reduced beam/burst treatment remains. Decorative SVG stays aria-hidden. One shared requestAnimationFrame drives independent plans, stops when the batch is exhausted, pauses in a hidden document, and is canceled on exit. No spawn timers. Existing short effect timers are cleared on teardown. Planning history is bounded to four records; target nodes never exceed four. Repeated enable/disable leaves no duplicate layers.

## Verification
`tests/lyrics-fun.mjs` covers 2,000 four-flight batches, defaults, OFF/non-default count persistence, count changes, finite missed flights/no respawn, hit/burst and free-fire, scroll and control-tap exclusion, repeated cleanup, reduced motion, themes, print exclusion, shared playback across Score/Lyrics, Library return and offline preferences.

Three launches each at 390×844, 820×1180, 1180×820 and 1440×1000; screenshots reviewed. No page overflow or header/control changes. Notes clip naturally only while crossing an exit edge. Browser viewport tests are not physical iPad/Safari validation. Statistical distributions vary each run; accidental crossings/similarities remain possible and intentional.

Existing `tests/lyrics.mjs` covers paired song views, transposition preservation, number/title lookup, theme/font controls, and offline lyrics. No score/catalog/extraction/layout source changes. Service-worker version bumped to deliver the changed modules; offline architecture unchanged.
