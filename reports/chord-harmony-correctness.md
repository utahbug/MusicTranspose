# Optional and text chord transposition

Starting commit: ac3c4e7993e3deec03340d18f6342ead2197b36f on codex/pages. Root and origin verified as the existing MusicTranspose repository; starting worktree clean.

## Root cause and pipeline

Bundled MXL is unpacked by music.js into the original MusicXML string. The original stays immutable; each key change generates an in-memory transposed copy. Previously transposeXML changed pitched notes and the first root/bass pair of each harmony element. It did not examine direction/words.

Many source exporters encode optional symbols such as `(G)`, `(Dm)` and `(F#m)` as ordinary words directions, not semantic harmony. Some more complex unparenthesized chords use the same representation. Consequently OSMD rendered the unchanged original-key words beside correctly transposed notes and ordinary harmony symbols. The parentheses themselves were not the reason a symbol was skipped; the XML representation was.

OSMD receives the transposed display copy and engraves harmony and text directions. Structured printing uses the same transposed musical XML through a separate engraver. scoreTimeline/playback reads written note pitches from that same transposed XML; it does not generate accompaniment from harmony labels. The sound engine and note transposition are unchanged. Direct Lyrics playback without an active transposed score still uses the original source, as before.

Reference: [MusicXML harmony](https://www.w3.org/2021/06/musicxml40/musicxml-reference/elements/harmony/) permits multiple harmony-chord groups in one element. The old first-root/first-bass query also skipped later groups. The shared structured traversal now handles every direct root/bass child. No stacked-root examples occur in the bundled catalog; a synthetic fixture protects this supported case.

## Implementation

- chord-symbol.js contains a lossless chord model with typed root/bass pitch spans and the untouched original text. A recursive-descent grammar recognizes A-G roots, accidentals, quality/extension/degree tokens, nested alteration/add-tone groups, optional parentheses/brackets, slash bass, 6/9-type suffixes, and repeated symbols. It is not a global letter-replacement regex.
- Only pitch spans are replaced. Parentheses, punctuation, spaces, quality, extensions, alterations, added tones and other recognized suffix spelling remain verbatim. Root and bass both use the existing destination key's diatonic interval, preserving altered-scale-degree spelling consistently with note transposition. Unicode accidental style is retained across the complete symbol.
- Ordinary harmony uses the same pitch transformation. Existing kind text, degree data, parentheses flags, offsets, staff assignment and other attributes are preserved. Empty root-step display text in the catalog remains untouched.
- Text directions are parsed conservatively. Musical prose such as A tempo, Chorus, D.C. al Fine, (Child), (Piano), and conducting instructions is unchanged. Explicit labels such as `Optional: (G7/B)` and qualifiers such as `G (optional)` are supported; arbitrary prose is not mined for possible chord letters. Unrecognized text remains unchanged.
- Multiple styled words within a direction-type can form one symbol. The adapter edits the original pitch spans while retaining words nodes and their style/location attributes. Chords are not relocated or converted into duplicate visible harmonies.
- opening-metadata.js excludes recognized chords from opening expression promotion. An imported bare `G` at the opening remains at its musical position instead of becoming header metadata. Existing expression/tempo behavior is retained; no header/footer placement was redesigned.
- sw.js advances the shell cache to v90 and caches the chord module for offline transposition.

No score assets, PDF handling, playback synthesis, Library design or Lead view changed. Zero shift and Reset return the exact original source XML.

## Catalog audit

Scanned all 679 structured catalog scores:

- 7,300 structured harmony elements; 635 bass/slash entries.
- 156 recognized text chord annotations across 73 scores: 145 parenthesized, 11 unparenthesized.
- 69 Children's Songbook records and four Hymns for Home and Church records contain these text chords.
- 3,237 other words annotations retained as nonchord text.
- The Commandments (112) and We Welcome You (256) remain view-only under the existing modulation policy; no new transposition capability is claimed for them. All other affected records are tested at -2, +1 and +3 semitones.

The unparenthesized cases include Csus4(add9) in Thou Gracious God, Whose Mercy Lends (1042), Dsus4(add2) in Elijah and the Still, Small Voice (1056), Fadd9#11/Gsus4(add9)/Dsus4(add9) in Great Is Thy Faithfulness (1064), and Gsus4(add9) in Isaiah Said (1065). These are the same skipped-words defect and are corrected by the same parser.

## Validation

tests/chord-harmony.mjs covers 25 chord forms through every semitone shift from -6 to +6 in four source keys/modes. It checks root and bass pitch, suffix/punctuation invariance, formatting attributes, exact original reset, playback pitch/duration, split styled symbols, Unicode, stacked structured harmony, and rejection of musical prose. Explicit independent expected spellings include:

| Source | +2 (C to D) | -2 (C to B-flat) | +1 (C to D-flat) | -1 (C to B) |
|---|---|---|---|---|
| (G) | (A) | (F) | (Ab) | (F#) |
| (Dm) | (Em) | (Cm) | (Ebm) | (C#m) |
| (G/B) | (A/C#) | (F/A) | (Ab/C) | (F#/A#) |

The full-catalog audit checks structured root/bass transposition at -2/+1/+3 for every transposable score, with harmony suffix/degree/format invariance, and checks every recognized text chord while proving unrelated words are unchanged.

Real screen and print cases: Children All over the World, I Am a Child of God, I Will Follow God's Plan, Called to Serve, HHC 1042, 1056 and 1064. Phone portrait 390x844, phone landscape 844x390, tablet 820x1180 and desktop 1440x1000 pass visible transposed text, printing, Reset and overflow checks. Offline reload and optional-chord transposition are covered.

Existing opening-metadata.mjs and playback.mjs pass, including all 679 playback timelines, key/octave/reset, paired views, PDF behavior and offline audio. Priority #1 measure-sync smoke passes 32 cases. Browser tests use installed Edge/Chromium viewport emulation, not physical iOS/Safari. The production app is static and was served directly; there is no build step.

Evidence: test-results/chord-harmony-audit.json and chord-harmony-phone.png. Run the new test with PLAYWRIGHT_PACKAGE pointing to the Playwright package.json and TEST_URL optionally set to the deployed site.

Priority #3 has not started.
