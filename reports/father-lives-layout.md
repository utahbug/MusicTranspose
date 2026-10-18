# I Know My Father Lives: screen-layout review

Starting commit: a3d674c. Scope: Children’s Songbook #5 only; Hymns (1985) #302 is a separately verified comparison.

## Cause and correction

CS #5 piano directions extend left of the SVG view box. Every automatic-layout candidate failed the clipping check, so the existing selector fell back to its largest candidate. A catalog-specific, measured ink inset now reserves that space before assessment. Existing readability, collision and complete-system pagination policies remain in force. The engraving margin is restored after each trial, including exceptions. No source or export XML is changed by the inset.

Melody preparation removes only reviewed P2 piano directions identified by source measure, staff and exact content, plus the piano hand-crossing brackets in X10/X11. R.H., L.H., Smoothly, with pedal and the accompaniment simile are omitted. Gently, tempo, slower, Duet, lyrics, dynamics, harmonies and repeats/endings remain. Imported arrangements are excluded from this mapping.

## Page counts

Both Chromium and WebKit produced these CS #5 Transpose results:

| Viewport | Before | After |
|---|---:|---:|
| 375 × 812 | 7 | 3 |
| 390 × 844 | 5 | 3 |
| 744 × 1133 | 2 | 1 |
| 820 × 1180 | 2 | 1 |
| 1194 × 834 | 3 | 2 |
| 1440 × 900 | 3 | 1 |

Original PDF and Melody only stay at one page at all six sizes. The landscape two-page result is intentional: available height is insufficient for the larger, readable systems to fit one page. Selected lyric sizes are 12.8–16.2 CSS pixels, with zero reported clipping or lyric collisions.

Hymns #302 remains one page in Original, Transpose and Melody only at all six sizes in both browsers. Its simpler layout is a convenient quick-transposition demonstration candidate, without replacing CS #5. CS #5 has 16 native harmony elements; #302 has 14 generated harmonies. Technical tests do not establish the musical quality of generated harmony choices.

## Validation

- Before/after Chromium and WebKit: two arrangements, three modes, six viewports (144 captured renders).
- Exact full runtime XML preservation; Melody comparison preserves every note, duration, measure, key/time attribute, harmony and repeat/ending barline apart from the explicitly removed directions.
- Source MXL and Original PDF bytes match the starting commit for both songs.
- #302 layout and Melody XML unchanged within each browser.
- Chromium before/after comparisons for #202, #204 and HHC #1008 at 375 and 820px: identical XML, systems, page counts and zoom.
- Chromium/WebKit C → D → B-flat → C reset, harmonies retained, keyboard first/next/last page boundaries.
- System-pagination, full-score policy, measured-inset unit checks, JavaScript syntax and storage-manifest build/check.
- Local screenshots and machine-readable evidence: test-results/father-lives (not published).

No changes to PDF assets, arrangement data, general pagination policy, storage or navigation controls. Physical iPhone/iPad readability, actual rotation and Bluetooth pedal use still require device testing. This review does not claim independent notation-software import validation.
