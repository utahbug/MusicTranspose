# Lyrics Fun: include the title/header playfield

Starting commit: `8f0f81e1612fbc6934c46ec95eb17ac776ff4dce`. Existing MusicTranspose repository, clean worktree and expected remote verified before editing.

## Cause

The overlay previously started at `.lyrics-body.getBoundingClientRect().top`. Its 80% upper bias therefore meant the upper portion of the lyric body, excluding the title, speaker area, source/page and shared-ending notice above it.

## New bounds and weighting

The overlay starts at `max(8, paper.top + 8)`, inside the Lyrics paper rather than below its header. Its bottom is the smaller of `viewport height - 8` and `paper.bottom - 8`; its horizontal inset remains 8px on each side. Initial note centers account for glyph width so launch positions do not clip at the side. Intentional offscreen exits remain clipped by the overlay.

Each independent flight selects a broad region with nominal probabilities:

- 40% title/header, including metadata and informational text before the lyric body;
- 40% immediately below that region, within the visible upper lyric area;
- 20% remaining middle/lower visible content.

The upper-region boundary is capped at both the content midpoint and the actual viewport midpoint, accounting for note height. The header starts at the paper top regardless of wrapped-title height; a tall title never pushes the entire playfield below itself. When the header has scrolled out of view, its share uses the visible upper content instead.

These are continuous random regions, not fixed lanes. Delay, horizontal start, direction, duration, two independent vertical endpoints and curvature remain independently randomized. The existing anti-procession checks remain. Notes may intentionally cross noninteractive text. No title/text collision-avoidance system was added.

## Controls and mechanics

The decorative, aria-hidden overlay retains `pointer-events: none`. Real controls receive input, and the unchanged gesture safety filter excludes buttons/links/inputs and other controls from firing. Speaker, theme, font, Fun and navigation remain usable even when a note visually crosses them. Beam/hit detection and count/default/preference logic are unchanged.

Fun still defaults ON with four notes for new preferences, preserves saved OFF/count choices, and uses finite one-shot flights. Misses exit without bouncing or immediate respawn. Colors, note artwork, size, shot effects and reduced-motion behavior are unchanged.

## Measurement and cleanup

Bounds and font-size reads are cached. ResizeObserver watches paper/body layout; resize, scrolling and visibility changes invalidate the cache. There are no header measurements every animation frame. The observer disconnects alongside the existing aborted listeners, canceled frame and cleared effect timers on cleanup. No new spawn timer or animation loop was introduced.

## Verification

`tests/lyrics-fun-playfield.mjs` samples 12,000 planned flights and checks header/upper/lower distributions against 35–45% / 35–45% / 15–25% ranges. Browser testing repeats 16 four-note launches per viewport on **The Spirit of God**, including its title, source line and shared-ending notice. It checks actual visible note centers, captures a title-region screenshot at every size, confirms varied regional use and tests playback interaction priority.

Viewports: iPad portrait 820×1180, iPad landscape 1180×820, iPhone 390×844 and desktop 1440×1000. Repeated runs showed notes crossing title, metadata, notice and upper lyrics at all sizes, with occasional lower-area notes. Screenshots were visually inspected. **Hail to the Brightness of Zion’s Glad Morning!** additionally verifies a long title that wraps on phone; the playfield still begins above the title. The test confirms no repeated paper-bound reads during a steady second of animation and no overlay remaining after exit.

`tests/lyrics-fun.mjs` passed its existing 2,000-batch independent-motion checks, defaults/preferences, four-note and count changes, accurate hits, finite misses/free fire, scroll/control protection, both themes, reduced motion, print exclusion, repeated toggle cleanup, Score/Lyrics playback and offline preference checks. Its reload expectation was updated to the existing browser-history behavior: refresh now restores Lyrics rather than forcing Library.

No CSS, Lyrics data, playback, navigation, catalog or storage changes. `sw.js` only advances the existing cache version from v73 to v74 so the changed module reaches offline clients; the offline architecture is unchanged.

## Limitations

Randomness does not guarantee a title note in every four-note launch. Notes intentionally may briefly overlap words or the visual speaker area, while controls retain interaction priority. A scrolled-away header cannot host visible notes. Responsive testing uses Chromium/Edge touch-sized viewports, not physical iOS hardware. Cleanup tests check bounded elements/listeners and idle measurements rather than claiming a formal long-duration heap proof.

Files: `lyrics-fun.js`, `sw.js`, `tests/lyrics-fun.mjs`, new `tests/lyrics-fun-playfield.mjs`, and this report. Deployment uses the existing GitHub Pages branch and workflow; final hash and live verification are recorded in the task summary.
