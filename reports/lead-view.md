# Priority #4 — conservative Lead view

Starting repository: C:/Users/kenro/Documents/Codex/MusicTransposePrototype; origin https://github.com/utahbug/MusicTranspose.git; branch codex/pages; clean starting commit 388538825a76e81599e3460859440ce38182d38e. Repository identity was checked before edits.

## Coverage and melody identification

Lead is now an actual derived single-staff score, not the former Large density setting. The existing saved `large` preference remains the internal alias for the Lead menu item, avoiding a preference migration or broken control.

The complete catalog audit covers 679 structured scores. **34 scores are supported; 645 safely retain the normal structured score.** The two PDF-only catalog entries remain PDF-only. [Per-song diagnostics](lead-catalog.md) lists every structured score, its collection/page and stable ID, grouped by success or fallback reason.

Selection requires exactly one lyric-bearing part/staff/voice lane, a monophonic note sequence and complete rhythmic coverage. Staff order, highest note, voice number and song title are never used to guess melody. A synthetic test puts the melody on staff 2, voice 5 of the second part and verifies that it is selected with its bass clef and above-staff lyrics intact.

The source audit found these limitations:

| Pattern | Scores | Result |
|---|---:|---|
| Unique monophonic lyric lane, fully projectable | 34 | Lead |
| Chordal lyric lane | 551 | Normal fallback |
| Multiple lyric-bearing lanes | 76 | Normal fallback |
| No identifiable lyric-bearing lane | 13 | Normal fallback |
| Cue notes outside the candidate melody | 5 | Normal fallback |

A major source pattern is that lyrics attach to the **lowest note in a multi-pitch chord**, even when the tune may be elsewhere in the chord. Selecting either that note or the highest note without additional evidence would violate the requested conservative policy. These songs need reviewed melody assignments or stronger source metadata before coverage can safely increase. Many files split piano staves into separate generic parts, so part position/name alone is insufficient evidence.

The Morning Breaks falls back because lyrics belong to multiple voices/parts; all its source staves and above-staff lyric relationships remain intact. The Shepherd’s Carol falls back because small cue-size notes occur outside its lyric lane. The algorithm recognizes both explicit cue elements and cue-sized note types. It never deletes these notes to force a successful conversion.

## Architecture

- `lead-view.js` parses immutable source MusicXML into timed events, identifies the unique lyric lane and projects it into one part/staff/voice. It retains the original pitches, rests, durations, grace/cue notes in that lane, ties, beams, tuplets, slurs, articulations and exact lyric elements. Verse numbering, syllabic markers, melisma extensions and placement flags stay attached to the same note/onset. Unsupported or incomplete structures return the exact original XML with a reason.
- Measure identity, pickups, selected-staff clefs, key/time attributes and barlines survive. Repeated hidden/visible copies of the same ending are recognized as the same musical instruction. Conflicting endings/meters and unsupported structures trigger fallback.
- Harmonies, text chord directions and performance directions from accompaniment parts are retained at their original musical positions, with divisions normalized. Piano-page coordinates and piano-only system/staff spacing are removed from the derived copy. MusicXML offsets preserve direction timing; harmony events use explicit cursor positioning because OSMD ignores harmony offsets.
- The Priority #2 transposer runs on the full source for playback and on the derived Lead source for notation, using the same key/mode/register. No new chord spelling or text-chord parser was introduced.
- OSMD reads only the first root/kind group in a stacked harmony. `leadEngravingXML` makes simultaneous, marked copies for engraving, and a narrowly scoped renderer adapter combines their native chord labels into a measured vertical stack. Screen and print share this adapter; original structured harmony data stays intact. Ordinary full-score chords have no marker and are unchanged.
- `app.js` keeps full transposed XML for the existing accompaniment playback/session, and separate active-view XML for screen/print. Thus switching Normal/Lead does not stop playback or replace the song. PDF retains its existing behavior of stopping playback and showing the original PDF; returning to Lead retains key/octave and song context.
- Ambiguous Lead selections display a concise visible reason and the normal score at normal scale. The requested view preference remains Lead, so the next supported song uses Lead. A renderer failure also falls back safely. Source-level fallback reasons are logged and included in the catalog report.
- `sw.js` advances the cache to v92 and includes the Lead module. No Library, Lists, Advanced Settings or unrelated engraving code was redesigned.

The MusicXML timing/ownership model follows the [duration specification](https://www.w3.org/2021/06/musicxml40/musicxml-reference/elements/duration/), [offset specification](https://www.w3.org/2021/06/musicxml40/musicxml-reference/elements/offset/) and [lyric specification](https://www.w3.org/2021/06/musicxml40/musicxml-reference/elements/lyric/).

## Responsive behavior

Lead uses a modest phone enlargement (0.88 zoom versus Normal's 0.78 baseline) and the normal 0.9 desktop scale. Removing accompaniment staves supplies the main space saving. The existing header/footer, tap zones, safe-area handling and source/key metadata remain shared.

Verified at 320x568, 390x844, 430x932, 844x390, 820x1180 and 1440x1000. Successful and fallback songs have no horizontal page overflow. As one measured example, When I Am Baptized occupies about 2,229px in phone Lead versus 3,144px in Normal; at desktop it occupies about 583px versus 1,232px. This is a layout comparison, not a claim that every song has the same reduction.

Browser tests use Edge/Chromium viewport and touch emulation. Physical iPhone/iPad Safari remains unverified.

## Validation

The production app is static and has no compilation step; its actual files were served using the existing serve.py.

- `tests/lead-view.mjs`: all 679 scores audited. Every fallback must be the exact original XML. All 34 supported scores are compared against their source at 0, -2 and +3 semitones for note onset, pitch, duration, exact lyric ownership, cues/ties, harmony/direction timing, repeats/endings and playback duration. All 34 are engraved on phone without a concealed renderer fallback.
- Responsive real-song cases: When I Am Baptized; I Want to Be a Missionary Now; I Hope They Call Me on a Mission; Rain Is Falling All Around (optional chords); The Priesthood Is Restored (chords in the accompaniment part); and full-score fallbacks The Shepherd’s Carol, Oh, Come, All Ye Faithful and The Morning Breaks. These cover multiple verses/voices, pickups, repeats/endings, slash and optional chords, cue activity and the prior lyric-placement regression. Every case switches Lead/Normal and changes key; successful Lead cases print from the derived score.
- `tests/lead-state.mjs`: lower-staff/second-part melody; exact above-staff lyrics and pickups; cue preservation/fallback; stacked and parenthesized slash chords; actual rendered stacked labels share an x anchor without vertical overlap and retain their musical beat; live playback continues across Normal/Lead; Favorite and active List state remain unchanged; Lead/PDF/Lead retains song/key; exact print XML is checked; touch navigation, overlay and offline reload/transposition pass.
- Priority #2 chord suite: 7,288 core checks, full catalog harmony audit, real screen/print/reset and offline checks.
- Priority #1 synchronization smoke: 32 alignment/voice/lyric ownership cases.
- Priority #3 reliability suite: all six sizes, mouse/touch navigation, metadata, overlays, controls, PDF and Lyrics.
- PDF/tempo suite: structured/PDF return, identity, key/octave, tempo, printing/pages, responsive layout, offline reload and audio.
- Playback suite: all 679 source timelines, eight representative playback cases, transposition/register/reset, paired views, responsive/PDF, print exclusion and offline audio. One initial run timed out waiting for Library during concurrent browser work; its isolated rerun passed.

Evidence is in ignored `test-results/lead-*`. Run `tests/lead-audit.mjs` with `WRITE_REPORT=1` to regenerate the per-song diagnostic report. All browser scripts accept TEST_URL and PLAYWRIGHT_PACKAGE.

Priority #5 is deferred until user review.
