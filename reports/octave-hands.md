# Independent staff octave controls

## Behavior

The key dialog now keeps the required order: Select a key; Original/Current; destination mode; Octave. Both/RH/LH selects which stored hand setting the 8vb/Normal/8va controls replace. Both sets both hands to the same absolute offset; it does not add another octave to a previous shift. When hands differ, Both has no selected octave value. A compact RH +1 / LH 0 summary remains in the dialog. Controls are at least 44px tall. The dialog is fixed within the viewport and opens at the top.

Hand identification uses MusicXML part IDs, staff numbers, staff counts, instrument metadata, and initial G/F clefs. A single grand-staff part with no conflicting instrument identity qualifies. Two split parts qualify only with explicit piano identity and a shared MIDI channel. Upper staff/part is RH, lower is LH. Note pitches and voice numbers never determine ownership, including crossing registers and multiple voices. Single-staff, conflicting-instrument, and ambiguous ensemble structures retain Both-only controls with a brief reason.

Only pitched-note octave fields change. Chords, key signatures, rests, voice/staff ownership, and attached notation remain untouched. Key transposition runs first through the existing engine. The new staff transformation is in octave.js; music.js and chord transposition code are unchanged.

Score playback consumes the same transformed XML as notation. Lead uses its displayed single-melody XML for playback and has an independent melody octave setting; no hand selector appears. The metronome source follows the same active XML without changing timing or metronome controls. Score/Lead switching stops prior playback so a previous view's pitches cannot continue underneath the new view.

Octave state is memory-only for the current score session. Score/Lead and same-song Lyrics switches preserve their respective offsets. PDF fallback cannot transpose but retains the structured-score offsets on return. Reset clears every offset and restores the original key; another song or reload starts at Normal.

## Files

- octave.js: conservative staff mapping and per-staff transformation.
- app.js: session state, rendering/cache, controls and matching playback sources.
- index.html: compact scope/control markup and key information order.
- styles.css: selected states, touch targets and viewport-contained dialog.
- sw.js: cache v109 and offline precache for octave.js.
- tests/octave-hands.mjs: targeted music, interaction, state, responsive and offline coverage.
- reports/octave-hands.md: this record.

## Validation

Production static files served directly with serve.py; no compilation step exists.

Passed tests/octave-hands.mjs: The Nativity Song, Oh Come All Ye Faithful, Silent Night, ambiguous The Shepherd's Carol, supported Lead hhc-1054, a single-staff Lead-derived score, and crossing-register/multiple-voice fixtures. Checked both directions, independent Normal restoration, XML invariants, playback MIDI pitches, key changes, Reset, Score/Lead/Lyrics retention, PDF fallback, new-song/reload reset, and offline operation.

Passed tests/metronome.mjs and tests/song-transition.mjs for requested metronome, navigation, stale-song, Lyrics, PDF and offline smoke coverage. No full music-engine/chord suite was run.

Browser viewport checks passed at 320x568, 390x844, 844x390, 820x1180 and 1440x1000. No horizontal dialog overflow; hand and octave targets remain 44px tall. Short screens scroll within the dialog to reach all destination keys. Narrow portrait/landscape screenshots were inspected. These are browser-emulated layouts, not physical-device tests.
