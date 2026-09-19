# Lyrics Fun ambient cycle

Starting commit: `02784d6f671ff7845e9c1a9e9c90a89057454396` (existing MusicTranspose repository, codex/pages).

## Behavior

The existing Lyrics Fun overlay now repeats four phases, without visible phase labels or game UI: ordinary notes (random 22–28 seconds), worm (32–42 seconds), note variation (32–42 seconds), then ordinary notes again (32–42 seconds). Durations are resampled every phase. The first worm therefore waits 22–28 active visible seconds. Fun still defaults ON with four independent notes; saved ON/OFF and count preferences remain intact. Notes remain finite targets and leave the playfield; flights are capped to finish before their phase boundary. Variation uses a slightly wider randomized arc, retaining the existing note artwork and distribution.

The worm uses tilted elliptical noteheads in the Lyrics text color. Dot height is 30% of lyric font size, spacing 55%; the head is 20% larger. Segment count is derived from 80% of the visible playfield width (bounded to 96), giving approximately 70–90% stretched length. Tested layouts produced 24 dots on phone and 47 on tablet/desktop. The full visible paper, including title and metadata, remains eligible. Pointer-transparent graphics preserve controls.

The head curves toward random temporary waypoints, chooses new waypoints every 1.5–3.5 seconds, varies speed from 1.1–1.8 lyric-font units per second, and occasionally turns more sharply. Segments sample bounded head-position history at fixed distance intervals. Randomized prehistory forms a coherent initial chain. Each worm eventually selects a random exit edge after 16–24 seconds; its travel time to that edge varies. Resizing rescales history and preserves the shortened proportion, including a head-only state.

Head taps remove the worm immediately. Body taps remove exactly one tail dot; the head survives any number of body hits. Empty-space shots end at the tap position. Kill or escape starts a four-second active-visible gap; another randomized worm appears only if the worm phase is still active. No-target taps remain available during that gap. Ordinary floating-note hits retain their existing automatic-hit behavior.

Every laser uses a curated muted blue/teal/violet/red/amber/green palette, with separate light/dark contrast variants and no adjacent color-index repeat. The beam remains 3px and 300ms. Ordinary note hits retain the existing brief colorful burst; worm hits have no explosion. Existing pointer movement, duration, scroll and control exclusions remain unchanged. No sounds, scores, HUD, or aiming cursor were added.

## Lifecycle, accessibility and offline

One requestAnimationFrame loop advances phases and motion; no per-segment or respawn timers. Position measurements are invalidated on resize/scroll rather than read every frame. Effects retain their existing short tracked timers. OFF, view exit and navigation abort listeners, disconnect ResizeObserver, cancel the frame, clear effects and remove the overlay. ON restarts ordinary notes. Background visibility pauses the frame loop; elapsed time does not jump on return. Reduced motion freezes note/worm movement while preserving safe interactions and phase changes. Decorative content remains aria-hidden and pointer-transparent.

Service-worker shell cache v75 includes the new local helper module. No external assets or runtime services were added. Lyrics extraction, song data, rendering, playback, navigation, and printing code are unchanged.

## Verification

- Pure-model randomized tests cover 160 worms, phase ranges, 70–90% length, head/body hit targeting, head-only minimum, resize, bounded history and differing paths.
- Browser tests cover 390×844, 820×1180, 1180×820 and 1440×1000: progressive removal of every body segment, surviving head, immediate head kill, four-second gap and randomized respawn, tap endpoints, varied colors, reduced motion, OFF/ON restart, exit cleanup and no horizontal overflow.
- A deterministic browser case covers natural escape and its four-second respawn gap.
- A real four-minute run (no simulated clock) traversed notes → worm → variation → notes-return → notes → worm → variation. It retained one overlay and at most one pending animation-loop frame, with bounded nodes and unchanged lyric text. Exit removed the frame and overlay; no browser errors occurred.
- Existing Lyrics Fun regressions cover defaults, saved preferences/reload, count changes, note hits/misses, tap versus scroll, themes, print exclusion, playback across Score/Lyrics, responsive layouts and offline preferences.
- Header/playfield regression coverage checks title/metadata eligibility, varied trajectories and protected playback controls.
- Screenshots inspected at phone and tablet widths show a thin notehead chain without new layout space or game chrome.

These are Chromium/Edge viewport and automated gesture checks, not physical-device Safari testing. Bounded DOM/frame checks are not a browser heap profiler. Phase timing measures active visible time and pauses while the paper or tab is not visible. Sparse moments after finite notes leave are intentional ambient gaps.
