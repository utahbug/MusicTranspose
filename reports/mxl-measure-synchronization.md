# MXL measure synchronization and above-staff lyrics

Starting commit: 46be488a68841f5239152f09bc5b7c9fbbf5e6f4, branch codex/pages.
Repository and remote verified before editing; starting worktree clean.

## Diagnosis

The reported appearance was reproduced in The Morning Breaks. Direct inspection did **not** find independently reflowed treble/bass bars: OSMD groups every corresponding staff measure into one column with identical horizontal boundaries, even in the affected systems. Normal, Large and the candidate engravings for Most music retain source measure order. Virtual pages crop whole systems; they do not reconstruct staves.

The actual confirmed defect is loss of MusicXML lyric placement. The bundled OSMD 2.1.2 LyricsReader.addLyricEntry discards `placement="above"`. Its calculateSingleStaffLineLyricsPosition then places every lyric below its owning staff. The source has 40 above-staff lyric entries in the bass response, measures 9-13. Those words appeared below the bass instead of between treble and bass, breaking the visual connection between the alternating vocal passages. The original bundled PDF confirms the above-bass placement. No claim is made that a recent app commit introduced the upstream limitation.

The apparent empty passages are real full-measure rests: upper part measures 10-12 and lower part measures 14-16. Removing them or shifting either part would corrupt the music. Width-based system breaks differ from the fixed PDF and can make those passages more noticeable.

Source checks: ZIP CRC passes, XML parses, both parts have the same 21 ordered measure numbers and durations. Pickup is one quarter, measures 2-20 are three quarters, last measure two quarters. Backups never cross the start of a measure. There are 173 note elements and 201 lyrics. SHA-256 remains `0b557e9ff29a5ad874e7d7cc9c8edf1419d34980684fcfe8f88d9182c5a522c6`. These are structural/timing checks, not a claim of complete MusicXML XSD validation or manual proofreading of every note. No source music data was changed.

## Fix

`lyric-placement.js` adds a small compatibility adapter for the bundled renderer:

- Retain explicit above/below placement on the original lyric/voice entry during reading.
- Keep the existing below-staff algorithm unchanged for ordinary lyrics.
- Lay out above-staff verses above their own staff, preserving verse order and horizontal note anchors.
- Reserve skyline space before staff/system spacing, so lyrics do not collide with the owning staff's notation.
- Let OSMD construct syllable dashes and melismas from the original lyric/voice associations and corrected vertical coordinates.

This changes graphical lyric placement only. It does not move source notes, rests, voices, bars, annotations or lyrics to another musical owner. It works for any score with above-staff lyrics, without song IDs or titles. The adapter is installed before both screen and structured-print engraving. PDF rendering and navigation code are untouched. Service-worker v89 caches the new module.

Above and below lyric blocks are given separate collision-safe space when both occur within one system. This does not reproduce the PDF's hand-engraved shared verse baselines or exact line breaks. Existing occasional horizontal lyric crowding, such as the upper-voice pickup into “The dawning,” is separate from the fixed placement defect and has not been hidden by moving lyrics to other notes.

## Audit and regression protection

All 679 bundled structured assets were scanned. Nineteen contain explicit above-staff lyrics: The Morning Breaks; What Was Witnessed in the Heavens?; The Day Dawn Is Breaking; Come, O Thou King of Kings (both settings); The Lord Is My Light; Master, the Tempest Is Raging; Secret Prayer; God Be with You Till We Meet Again; Far, Far Away on Judea's Plains; You Can Make the Pathway Bright; Scatter Sunshine; Count Your Blessings; Let Us All Press On; Onward, Christian Soldiers; Behold! A Royal Army; Put Your Shoulder to the Wheel; Come Away to the Sunday School; How Will They Know?

`tests/measure-sync.mjs` instruments actual OSMD render calls, including every automatic size candidate. It asserts full measure coverage/order, identical per-staff boundaries, original note/voice/measure ownership and onset, lyric ownership, correct placement, finite coordinates and no page overflow. Nonpitch XML structure is compared through transposition, including rhythm, voices, rests, lyrics, repeats, ties/slurs and annotation structure. A synthetic three-part fixture covers pickup, unequal staff activity, full-bar rests, above/below lyrics, harmony, a tie/extension and a repeat without any hymn-specific identity.

The primary hymn is tested in Most music, Normal and Large; at -2 and +3 semitones; after Reset; and in structured print. All 19 affected scores plus eight controls are tested at 390x844, 844x390, 820x1180, 1180x820 and 1440x1000. The controls include multiple verses, voices, pickups and differing staff activity: Nativity, Shepherd's Carol, Faithful, Silent Night, I Am a Child of God, cs-110, cs-236 and hhc-1010.

`tests/measure-sync-baseline.mjs` compares the actual SVG geometry/text with the adapter disabled and enabled. Eight unaffected songs at phone/tablet widths are identical, including chosen density and system count.

Existing `tests/virtual-pages.mjs` and `tests/pdf-fallback-tempo.mjs` passed: system clearance, page turns, keyboard/touch navigation, reading-position retention, size/key/octave, structured print, playback, Lyrics, PDF switching, tempo and offline reload. The app is static; serving and exercising the production files is its production run, with no bundler/build step.

Evidence: test-results/measure-sync.json, measure-sync-smoke.json and measure-sync-{width}.png. Tests use Edge/Chromium responsive emulation, not physical Safari/iOS. The adapter depends on the bundled OSMD 2.1.2 model API; rerun the structural and baseline tests when upgrading OSMD.

## Reproduction

Run serve.py --port 8768, set PLAYWRIGHT_PACKAGE to the installed Playwright package.json, and run the two new Node tests. TEST_URL selects a deployment; SYNC_SMOKE=1 limits the synchronization test to the primary hymn plus the synthetic fixture for live verification. Normal mode audits all above-staff sources.

Priority #2 is not part of this change.
