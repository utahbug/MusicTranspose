# Opening tempo/expression in the score subtitle

Starting commit: 4942bdf4b1fb9805eec64003d346f917d74cf2c2.

opening-metadata.js reads the first measure of each structured part, stopping at the first note/rest or cursor movement. Only zero-offset, visible, above/default directions qualify. Simple metronomes retain their beat unit, dots and full numeric/range text. Short word directions qualify; symbol-font markers, long/complex instructions, unsupported metronomes and conflicting simultaneous values remain in the score. Identical opening metadata across parts is displayed once. Tempo-only, expression-only and absent metadata have no dangling separators.

The score subtitle retains its existing muted typography and optical title alignment. A wrapping span adds the tempo and expression with a centered dot. No Lyrics/PDF header changes. All text is real DOM text, accessible to assistive technology.

Only the matching opening words/metronome elements are removed from a parsed screen engraving copy. The original bundled MXL files, original XML and transposed/octave-shifted playback/print XML remain unchanged. Sound tempo, later directions, dynamics, staff assignment and other score data remain intact. The existing independent print engraver still receives the original musical XML, including the opening markings. Playback still uses encoded sound tempo, not a newly inferred value from the displayed range.

Examples verified:
- Give, Said the Little Stream: Children’s Songbook · 236, followed by ♩ = 63–84 · Cheerfully. The source contains a range, not just 63; encoded playback tempo remains 84.
- Amazing Grace: ♩ = 76–92, tempo only; playback tempo remains 92.
- The Nativity Song: ♩ = 100–108 · Tenderly; playback tempo remains 108.
- Oh, Come, All Ye Faithful: ♩ = 88–104 · Majestically.
- Silent Night: ♩ = 80–100 · Peacefully.
- The Handcart Song: dotted-quarter = 80–88 · Merrily; separate conducting instruction remains in the score, encoded quarter tempo remains 132.
- I Will Follow God’s Plan: later rit. and a tempo remain rendered.
- No available score is entirely without opening metadata across all parts. A derived test fixture covers this case; expression-only, complex/conflicting and later-tempo cases are also tested without altering assets.

Baseline comparison at 390, 820, 1180 and 1440px: first staff moves upward approximately 44–73px for Give and 20–23px for Amazing Grace; Nativity gains approximately 9–26px depending on existing chord/fingering content. Existing subtitle heights stay 13px on phone and about 14.3px on larger screens for these examples. No compensating margins. Header wraps naturally when needed and remains clear of controls. Viewport screenshots inspected; physical iOS hardware was not available.

Focused browser checks cover source ranges, exact unmodified playback XML, later visible markings, conservative partial metadata, transpose, all three score densities, four viewport widths and printed opening markings. The existing full regression suite covers virtual pagination, page tap zones, continuous scrolling, playback, Lyrics, PDF, Library/lists, optical alignment and offline behavior. The new module is in the service-worker asset cache (v46).

Print regression investigation: output from the starting commit and new implementation is byte-identical after normalizing only VexFlow's generated vf-auto numeric IDs. Removing screen markings changes that global ID counter, so the print hash test now ignores those nonsemantic IDs. PDF pixel dimensions/bounds and print output pass at all four widths. The catalog test now checks the collection/page text separately from the intentionally added metadata.

Final local result: 27 existing suites passed on the first run; the two updated assertions then passed on rerun, and the new opening-metadata suite passed (30 suites covered in total). All 119 structured scores passed rendering, plus/minus semitone, exact Reset and offline cache/reload validation.
