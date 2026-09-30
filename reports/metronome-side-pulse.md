# Peripheral visual metronome

## Scope and architecture

Replaces top/bottom beat dots with left/right overlays. Existing playback scheduling, audio, score interpretation, availability, session preference, and independent silent metronome semantics are retained. The existing animation frame reads playback.position while playing or paused; while stopped it advances the existing independent position at playback.tempo.rate. No new pulse timer or audio scheduling was introduced. Pause blanks the pulse; resume follows playback; Stop resets the independent visual sequence, which continues as before.

pulseState caches visual beat onsets derived from the existing scoreTimeline measures and tempo map. Side alternation counts actual sequential beats across measure boundaries and timeline loops. beatState remains unchanged, including pickup numbering and compound-meter grouping. The persisted internal option value remains dots for compatibility; the visible label is Side pulse.

## Presentation

Two aria-hidden, pointer-events:none fixed overlays, 4px wide with 2px rounded ends and a 2px gap outside the score frame. They span the visible score height, below the score heading/safe top and at least 8px above the footer. The simpler full-visible-height strips were selected; physical comparison against shorter segments at playing distance remains unverified. No score reflow or reserved beat lanes. Existing pagination algorithms and tap recognition remain untouched.

Ordinary beats fade from 65% opacity over 150ms; downbeats fade from 90% over 220ms. Duration is capped at 60% of the current beat interval at the selected tempo. Light-page color is #2d768a; dark-page color is #66c9c4. Reduced motion uses a brief static opacity state with no fade. No beat announcements. Hidden when Off, in Lyrics/Library/Files/Lists, and in print.

Transpose and Melody only retain visual metronome support. Original PDF remains unavailable (including songs with XML alternatives): the existing PDF availability rule does not supply a reliable beat timeline. No fabricated PDF timing.

## Changed files

- metronome.js: beat-onset presentation helper and side overlays using the existing clock.
- styles.css: replace dot/lane styling with fixed side strips; dark and print rules.
- index.html: rename Beat dots to Side pulse.
- sw.js: cache version v147.
- tests/metronome.mjs: targeted timing, presentation, playback, and view checks.
- reports/metronome-side-pulse.md: this report.

## Verification

Targeted metronome checks cover Chromium and WebKit at 390x844, 768x1024, 820x1180, 1180x820, and 1440x1000, both structured views of The Spirit of God. Assertions cover Off/On, alternating sides, no score geometry/page-count changes, alignment, no overlap/overflow, page-turn continuity, continuous scrolling, key changes, dark pages, reduced motion, and hiding in other views/print. Desktop Melody fits one page; the test checks that tapping stays on that page. Screenshots are under ignored test-results/metronome-side-*.

Parser-backed fixtures cover 4/4, 3/4, 2/4, 2/2, 6/8, 9/8, 12/8, pickups, measure-boundary and mid-beat embedded tempo changes, and looping. Chromium at 820px additionally verifies real playback-position synchronization, adjusted/reset tempo, pause/resume/stop. Windows WebKit has no AudioContext, so its coverage is independent ticking and presentation, not audio synchronization.

Unchanged tests/score-tap-contract.mjs passes PDF/XML/Melody tap and duplicate-event protections. git diff --check passes. No full music-engine/chord suite was run.

Browser viewport simulation and screenshots do not establish physical-device behavior. Physical iPad/iPad mini testing while reading and playing remains important for peripheral visibility and distraction assessment.
