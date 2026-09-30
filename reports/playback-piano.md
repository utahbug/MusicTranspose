# PrimarySongs piano synthesis for score playback

## Reference and scope

Inspected the current PrimarySongs repository directly at commit `610a1eb02cd3b68941919c2e30c0c2de07461827`, script-v528.js. Reference: https://github.com/utahbug/PrimarySongs/blob/610a1eb02cd3b68941919c2e30c0c2de07461827/script-v528.js . Reviewed PIANO_SOUND_LABELS, getPianoAudioContext, createPianoVoice, releasePianoVoice, saved sound/volume handling, and master gain/compressor. PrimarySongs was not modified.

Adapted Grand piano's triangle/sine fundamentals, second/third harmonics, detuning, short low-pass hammer noise, and decay envelopes; Electric piano's five detuned/inharmonic sine partials. Only these two Primary sounds are included. Simple tone preserves MusicTranspose's previous triangle oscillator, envelope, master gain, and default compressor parameters.

The MusicXML parser, MIDI calculation, scheduler, source-time clock, tempo map, prepare/tempo functions, pause/resume, stop, hold-to-stop, visibility handling, and button behavior remain intact. Tests compare the parser, scheduling/tempo and button/visibility blocks against the prior commit, ignoring Windows line endings.

## Settings

Native labeled Sound select inside Tempo / metronome: Grand piano (default), Electric piano, Simple tone. Stored as a validated string under `music-transpose-playback-sound-v1` in localStorage. Invalid/unavailable storage falls back to Grand piano. Opening Settings or changing sound while stopped creates no preview audio. A live change uses the existing tempo rescheduling path at the same rate and source position, disposing old voices before scheduling the new timbre. No volume slider or novelty sounds.

Primary's saved keyboard volume defaults to 0.58. MusicTranspose retains its existing fixed 0.35 master gain and scales piano partial levels by 0.22 for score polyphony. Piano compressor: threshold -18dB, knee 16dB, ratio 5, attack 0.004s, release 0.2s. Simple tone restores the previous default compressor settings (-24, 30, 12, 0.003, 0.25).

## Scheduled voices and cleanup

No new timer. The existing scheduler supplies start time and known note duration. Primary's attack/decay recipes are evaluated at note-off so short notes release from the correct envelope level; release uses its exponential target approach (Grand 0.055s; Electric 0.11s) and sources stop after five release time constants. Grand uses Primary's held-chord decay/level profile for written notes longer than 1.35s, holding until scheduled note-off; this is not pedal simulation. Ties remain merged by the existing parser. Repeated pitches own separate voices and release independently.

Grand uses four oscillators plus a short noise buffer source; Electric uses five oscillators; Simple uses one. The 35ms noise buffer is reused per AudioContext. Completed voices disconnect all sources, gains, and filters; forced disposal cancels future/sounding sources immediately. Pause, stop, tempo/sound rescheduling and song changes use that disposal. No remote audio files, samples, soundfonts or new dependencies. The new voice module is in service-worker cache v149 for offline use.

Original PDF+XML uses the existing capability/source rule and retains its PDF while audio plays. PDF-only remains unavailable. Transpose and Melody retain their committed transformed XML source, including key and register changes. No app.js, metronome, PDF, export, pagination, annotation, Library, Lyrics, toolbar or CSS changes.

## Files

- playback-voices.js: reusable scheduled voice recipes/output balance.
- playback.js: voice delegation, disposal, persisted sound property and selection.
- playback-settings.js / index.html: compact labeled selector.
- sw.js: cache v149 and offline module registration.
- tests/playback-sounds.mjs: targeted real audio rendering and integration checks.
- reports/playback-piano.md: this report.

## Verification

- tests/playback-sounds.mjs: first-run Grand; Electric persistence; all three sounds after a real service-worker offline reload; Original PDF retained; PDF-only unavailable; transposed key/register and Melody timeline identity; live sound/tempo changes; pause/resume/stop/song cleanup; no automatic Settings preview; keyboard and 390/820/1180/1440px layout checks.
- OfflineAudioContext fixtures per sound: triad, 20 repeated four-note chords, 12-note dense chord, and long note. All 96 voices completed; every oscillator disconnected; final tail exactly zero. Peaks approximately Grand 0.397, Electric 0.477, Simple 0.326 (below full-scale 1.0).
- Full The Spirit of God SATB offline render: 414 notes over 68.57 seconds, all 414 voices completed, peak approximately 0.251.
- tests/metronome.mjs at 820px: meter/tempo fixtures, real audio-clock synchronization, adjusted/reset tempo, pause/resume/stop, page-turn continuity, PDF timing, reduced motion and view hiding.
- WebKit tests/pdf-first-capabilities.mjs at 820px: module/UI compatibility, Original/Melody/Transpose capability/state behavior. Windows WebKit lacks audio output support, so it is not evidence of Safari/iPad audio performance.
- Syntax and git diff checks pass. No full unrelated suite.

Automated tests establish sampled signal bounds and scheduling/cleanup behavior, not subjective piano quality or physical-device CPU/load. Compare Grand piano, Electric piano and Simple tone on physical iPad/iPhone speakers and headphones after deployment; timbre, loudness and dense-chord performance still need that judgment.
