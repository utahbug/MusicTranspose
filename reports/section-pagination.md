# Melody section-aware screen pagination

Baseline: 9580486. Melody availability remains 660/666. Extraction and all musical XML are untouched.

## True to the Faith

At 820×1180 the old two-page split ended page 1 at X7 (the line ending “have”), leaving the final verse phrase and chorus on page 2. X9 has an encoded terminal fermata and four lyric verse numbers; X10 begins at time zero with one lyric verse number. No “chorus” label or title-specific knowledge is invented.

The new page 1 contains source measure indices 0–9, ending at “No!” / “Yes!”. Page 2 contains 10–19, starting “True to the faith…” and retaining the whole chorus through “stand.” Seven engraved systems and two pages remain. Zoom stays 0.9; lyric size remains 18 display pixels. The trailing-clearance rule from 0d2d74c is retained and measured lyric bounds pass.

At 1440×1000 the new split is also 0–9 / 10–19, still two pages and zoom 0.9. A system break is needed at X10 (six systems rather than five at this width).

## Conservative rule

- Screen Melody only; multi-page baseline only.
- Require a terminal fermata, right-side double/ending barline, or backward repeat, followed by a contraction from multiple lyric verses to one beginning at time zero. Reject an outgoing terminal tied note.
- Consider only a candidate within one measured system group of an existing page split. This first implementation trials one such boundary.
- If necessary, trial a system start at the boundary in OSMD’s disposable model; preserve earlier starts and allow the following section to wrap naturally. Restore model break flags after the trial. Musical/engraving XML is never edited.
- Page planner section scoring is opt-in. Minimum page count and gap preservation precede balance scoring. A section ending discounts balance cost by 0.25 × available-height squared, only when the page uses at least 35% of available height.
- Accept a rendered trial only with the same page count, no overflow or measured lyric collisions, the desired boundary actually used, and every page using at least 35% of available height. Rejected trials restore normal rendering. No global scale reduction.
- A four-verse system beside a short one-verse system exposed a nearest-center measurement ambiguity. Section trials use actual SVG staff-group ownership for ink bounds; otherwise the existing measurement behavior is retained. Genuinely overlapping systems still cannot be separated.

The iPad verse page uses about 749px and the shorter chorus page 391px of 1012px available. The unequal fill intentionally keeps the complete sections together; physical-iPad performance preference remains for user judgment.

## Focused validation

`SECTION_BASELINE=1 node tests/section-pages-ui.mjs` replays the baseline renderer from Git. `node tests/section-pages-ui.mjs` compares the current renderer. No catalog audit or unrelated functional suites were run.

| Score, 820×1180 | Pages before/after | Other change |
|---|---|---|
| True to the Faith | 2 / 2 | Verse/chorus split at X9/X10 |
| I Will Follow God’s Plan | 2 / 2 | Exact same page groups |
| Angels We Have Heard on High | 1 / 1 | Exact same page groups |
| Where Love Is | 3 / 3 | Exact same page groups |
| As I Keep the Sabbath Day | 1 / 1 | Exact same page groups |
| The Time Is Far Spent | 2 / 2 | Exact same page groups |

Also checked True to the Faith at desktop 1440×1000 and its actual iPad page-turn presentation. All musical XML strings compare exactly with baseline; page groups cover every measure once; no horizontal overflow, right-edge lyric clipping, or new lyric collisions. The terminal-fermata detector rejects the same passage when its fermata is removed. Return to Transpose restores the original system margin.

`node tests/system-pagination.mjs` passes existing fit/coverage/adaptive-gap tests plus opt-in section scoring, no-extra-page and sparse-page guards. `git diff --check` passes.

Playback, transposition, MusicXML export, and print rendering consume unchanged musical XML and unchanged pipelines. Full-score and PDF page assignments do not opt into the preference. Service-worker cache v170 includes section-layout.js for offline use.

Files: app.js; section-layout.js; system-pagination.js; virtual-pages.js; sw.js; tests/system-pagination.mjs; tests/section-pages-ui.mjs; this report.
