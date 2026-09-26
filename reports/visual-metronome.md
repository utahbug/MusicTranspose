# Visual metronome

## Design and operation

Score Settings > Tempo / metronome now offers Visual metronome: Off / Beat dots, next to the existing tempo controls. Default is Off; an explicit choice lasts for the browser tab session. The feature is visual-only and creates no audio context or click sound.

Two matching rows use 6px muted blue-gray dots with 9px spacing. Inactive dots have low opacity; the active beat is clearer and beat one is only slightly stronger. There is no scaling, flashing animation, glow, or bounce. Reduced-motion users receive the same clear static beat-state changes. Controls retain native select labeling/keyboard access; duplicated visual rows are aria-hidden rather than announcing every beat.

Rows follow the visible score viewport. Narrow 14px lanes and pointer-events:none keep dots out of notation and pass navigation taps through. The top lane follows the score/header boundary and safe-area inset; the bottom sits above the footer and between Continuous Back-to-Top controls. View-only clipping and a small presentation inset protect the lanes. Virtual pagination accounts for that inset without changing engraving or source music. Lyrics, Library, PDFs, loading, hidden tabs, and print suppress score dots. Returning from Lyrics resumes the explicit preference.

## Architecture and PrimarySongs reference

Inspected existing PrimarySongs read-only at C:/Users/kenro/Documents/MUSIC APP/script-v528.js (renderMetronomeDots and scheduleMetronome) and styles-v528.css (.metronome-dot). Adapted its inactive/active/first-beat visual pattern. Its separate AudioContext/scheduler and sound presets were not imported: MusicTranspose already has the authoritative performance clock.

playback.js adds measure start/meter metadata to the existing timeline. Note timing, pitch, tempo-map interpretation, and audio scheduling are unchanged. metronome.js derives both rows from one requestAnimationFrame callback. While playing, beat state is computed directly from playback.position, which reads the audio clock; pause freezes it. While stopped, an independent performance.now-based visual phase runs at the session tempo, cycling through the existing written-order timeline. Tempo edits immediately use the existing playback rate and do not modify printed markings or XML.

2/4, 3/4, 4/4 use 2, 3, 4 dots. 6/8, 9/8, 12/8 use 2, 3, 4 dotted-quarter main beats. First-measure pickups align to the final beats of the meter. Meter and encoded tempo changes follow measure/timeline position. As with existing playback, this follows written order rather than expanding repeats; the first part supplies the common meter. No separate PDF meter inference was added.

Version checks discard obsolete preparation results during score changes. Score replacement resets preparation; prepared visual timing is keyed to the current rendered XML. Navigation refresh is deferred until the synchronous score replacement has finished, preventing stale virtual-page geometry.

## Targeted validation

Production is the static app, served directly at localhost:8771; there is no compile step.

- tests/metronome.mjs passed 320x568, 390x844, 844x390, 820x1180, 1440x1000. Covers all requested meters plus 9/8 and 12/8, pickup, meter/tempo changes, Off/on, independent operation without audio, row synchronization, playback position, immediate tempo-change synchronization, pause, Continuous/Page Turns, touch-compatible navigation, actual notation hit-test clearance, Back-to-Top visibility, Lead, transposition, Lyrics return, PDF suppression, Library return, rapid switching while enabled, session restoration and offline reload. No horizontal overflow or browser errors. 320px context used reduced motion.
- tests/playback-tempo-clock.mjs passed the deterministic audio-clock/tempo scaling, pause, session rate and cleanup checks.
- tests/song-transition.mjs passed four layouts, including held renders/fetches/Lyrics/PDF, queued selections, stale-error rejection, Lead, key preservation, List context, playback, touch taps, history cancellation and offline navigation.
- Visual review: 320px Continuous/Page Turns and desktop Page Turns screenshots in ignored test-results/metronome-*.png. Dots are small, synchronized, and separated from notation and controls.
- No exhaustive catalog or chord suite was necessary or run. git diff --check passed.

Files: metronome.js, app.js, playback.js, index.html, styles.css, navigation.js, virtual-pages.js, sw.js, tests/metronome.mjs, reports/visual-metronome.md. Service-worker cache v106 includes the new module for offline use.
