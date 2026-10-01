# Rest-only accompaniment systems

Screen-only structured layout cleanup. No song IDs or title exceptions.

## Rule

Candidate accompaniment staves are in multistaff parts or parts identified as piano, keyboard, organ, or accompaniment. The first score staff and every lyric-bearing staff remain protected; Melody rendering is excluded entirely. Unknown standalone parts remain visible conservatively.

For each rendered system, hide an eligible staff only when its source measures contain rests/structural scaffolding and no meaningful content. Pitched/unpitched notes, lyrics, harmony, directions (including dynamics and tempo), notation/ties, repeat/endings, and other nonstructural content prevent removal. Staff-owned spans protect their intervening measures as well. Additional graphical-expression/link guards are conservative.

Remove only the system's graphical staff line, graphical measure references and bounding box before OSMD optimizes vertical spacing. Do not modify source notes, measures, global staff visibility, XML, timing, or extraction. Subsequent systems are evaluated independently and regain accompaniment when notes return. Only the screen engraver receives a policy; print/export engravers do not.

## Focused verification

True to the Faith, Transpose/Auto:

| Viewport | Virtual pages before / after | Opening staves before / after | Engraved height before / after (OSMD units) |
|---|---|---|---|
| 820 x 1180 | 3 / 3 | 4 / 2 for first 3 systems | 307.25 / 264.95 |
| 1440 x 1000 | 4 / 3 | 4 / 2 for first 2 systems | 260.26 / 231.36 |
| 390 x 844 | 16 / 11 | 4 / 2 for first 9 systems | 801.06 / 665.36 |

Both accompaniment staves return in later populated systems. All source measure ranges remain covered once. Musical XML is exact against baseline 048dd2a. No horizontal overflow or new lyric clipping/collisions. Preexisting full-score lyric edge/spacing findings are unchanged and outside this cleanup.

At 820px, unchanged staff layouts/page counts for Where Love Is (2), I'll Go Where You Want Me to Go (3), The Time Is Far Spent (2), We Thank Thee, O God, for a Prophet (2), and As I Keep the Sabbath Day (2). Praise God, from Whom All Blessings Flow remains one page with exact engraving/XML. True to the Faith's Melody SVG/XML and Original PDF pixels match baseline; repeated view switching is stable.

Tests passed:

- `STAFF_BASELINE=1 node tests/accompaniment-staves-ui.mjs` (baseline capture from Git; no checkout replacement)
- `node tests/accompaniment-staves-ui.mjs` (final committed-render snapshots, not the last Auto trial)
- `node tests/accompaniment-layout.mjs` (content/primary/span/restoration/Melody/print guards)
- `node tests/accompaniment-view-isolation.mjs` (Original, Melody, repeat switching, short score)
- `git diff --check`

Screenshots are local ignored artifacts under test-results/accompaniment-staves-*.png. Viewport checks use Edge/Chromium simulation, not physical iPad testing. No broad music, catalog, playback or export suite was run. Offline shell cache advanced to v171 and includes the new module.
