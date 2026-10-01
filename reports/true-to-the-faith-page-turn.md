# True to the Faith: Transpose verse / chorus page turn

Stable ID: song-c25734b4-ba49-4c88-ba90-4927ede707c4. Baseline cd8f885.

A central screen-layout hint in score-page-hints.js applies only to this ID in Transpose/full structured view. It forces an OSMD system start at source index 10 and marks that system pageBreakBefore. The complete-system page planner cannot combine systems across that marker. Original, Melody, Lyrics and print/export rendering do not opt in.

The override runs after normal scale selection and retains that exact zoom. It trials the existing rhythmic-spacing profiles, using staff-owned ink measurement. Local measured margins protect the left accompaniment brace and right lyrics. No global font/staff-size or vertical staff-gap changes. Disposable OSMD break flags and spacing rules are restored afterward; musical XML is never edited.

At 820 x 1180, page 1 covers indices 0–9 and ends after No! / Yes!; page 2 covers 10–16, beginning True to the faith…, and page 3 covers 17–19. Three pages remain; zoom remains 0.78. At 1440 x 1000, the same section boundary starts page 2, with three pages and unchanged zoom 0.9. No missing/duplicated systems, empty pages, horizontal overflow, measured lyric clipping or collisions. Rest-only accompaniment remains suppressed in verse systems, while populated accompaniment returns in the chorus.

Focused checks passed:
- BREAK_BASELINE=1 node tests/true-page-turn.mjs (baseline served from Git without checkout changes)
- node tests/true-page-turn.mjs (iPad plus desktop; musical XML exact; unchanged page groups for Where Love Is, I Will Follow God's Plan, Angels We Have Heard on High, As I Keep the Sabbath Day)
- node tests/system-pagination.mjs (including forced-break and no-empty-first-page cases)
- node tests/accompaniment-view-isolation.mjs (Original PDF pixels and Melody SVG/XML unchanged, repeated mode switching stable)
- Actual page-mode screenshot/keyboard check: Page 1 of 3 → Page 2 of 3, iPad simulation
- git diff --check

Source assets, transposition, playback, MusicXML export, annotations and availability code are unchanged. Screenshots under test-results/true-page-turn-visible-*.png are ignored local artifacts. Physical iPad appearance remains for user judgment. No broad catalog/extraction/playback suites were run. Offline shell v174 caches the new hint module.
