# Most music: automatic screen engraving

Starting commit: `06ee42716206f89363c697c87054ece09a1a866c`.

## Previous behavior and preferences

The previous Small/Normal/Large selector used fixed multipliers. Normal was restored whenever a song opened or the user returned to Library. There was no score-size storage to migrate. The new default is **Most music**, alongside explicit **Normal** and **Large** text options in the same compact popover and the same toolbar location.

`music-transpose-score-size-v1` in localStorage records the explicit viewing preference (`auto`, `normal`, `large`). Normal and Large survive song changes, Library, and reload. An absent/invalid value defaults to auto; a legacy `compact` value, if supplied, maps to auto without deleting other preferences. Storage failure is harmless: the current in-memory choice still works. Musical Reset does not change size preference. No song IDs, user lists, or score data are migrated.

## Selection and readability

The existing OSMD instance renders up to three candidates from the already parsed MusicXML: Normal zoom × 1.00, 0.90, and 0.82. Baseline remains 0.78 on phone/narrow score containers and 0.90 on wider containers. Zoom participates in OSMD logical page width and actual system breaking; no CSS magnification is used.

Absolute Zoom floors are **0.64 at ≤600px viewport width**, **0.68 otherwise** (approximately 25.6px / 27.2px staff height). Minimum estimated rendered lyric font size is **12.5 CSS px**. Actual tested minima were 12.8px on phone and 13.6px on portrait iPad. The device-wide floor is deliberately bounded; manual Normal/Large remain available.

Candidates reuse existing corrected SVG ink/system bounds. Reject horizontal ink overflow, a system taller than the available complete-system page, and text below the floor. Adjacent lyric bounding boxes in the same text lane are checked for overlap; collision-free candidates are required. Among acceptable candidates choose fewer complete-system pages, then more measures in the first page, then more complete systems, then the larger notation scale. No safe candidate means retaining the Normal-scale candidate rather than shrinking further.

Most music reserves a 2.4-unit left engraving gutter on phone to fit piano braces; the right remains 0.8. This avoids the pre-existing brace clip from the 0.8-unit Normal gutter without scaling the completed score. Normal/Large keep their old margins and typography. Tablet/desktop margins remain 5 units. Source system/page hints remain handled by the existing automatic reflow settings. No musical data, lyrics, key, octave, duration, or print rules change.

## Reflow, cache, transposition and pages

Width/orientation and height changes are debounced 140ms. Auto selection uses actual score width and visible height after header/toolbar clearance. Existing cache keys now include viewport height and phone breakpoint as well as width, key, octave, and size mode. The existing per-song cache stays bounded to 36 entries; parsed source assets are reused and no candidate refetches a score. Explicitly choosing Most music requests fresh evaluation. Opening a different song computes its own result.

Nearby transpositions/octave changes first re-render at the selected automatic scale. If it remains readable and collision-free, retain that scale; otherwise evaluate the bounded candidate set. This avoids unnecessary size jumps. Cached commits update the remembered automatic scale. The existing complete-system virtual-page builder receives only the chosen SVG/system metadata. Tap zones, first/last/previous/next, keyboard/pedal mappings and scroll modes are unchanged.

PDFs retain existing sizing/navigation and hide the structured-score size control. Printing still uses the separate A4 engraver at Zoom 0.8 and the same musical XML; screen auto settings never enter it. The helper is bundled in service-worker cache v77 with no external runtime dependency.

## Comparative measurements

Each cell is **first complete-page systems / approximate measures / total virtual pages**. These are screen-height grouping measurements, not paper pages; a title wrapping differently or page-mode geometry can slightly alter the exact count. Eight songs × four viewports × three modes were evaluated. `Auto Zoom` demonstrates song-specific selection.

| Viewport | Song | Auto Zoom | Most music | Normal | Large |
|---|---|---:|---|---|---|
| 1180×820 | Amazing Grace | 0.9 | 1 / 6 / 2 | 1 / 6 / 2 | 1 / 5 / 3 |
| 1180×820 | Give, Said the Little Stream | 0.81 | 2 / 9 / 2 | 2 / 8 / 3 | 2 / 7 / 3 |
| 1180×820 | The Nativity Song | 0.738 | 2 / 16 / 2 | 1 / 7 / 3 | 1 / 6 / 5 |
| 1180×820 | The Shepherd’s Carol | 0.9 | 2 / 8 / 1 | 2 / 8 / 1 | 2 / 6 / 2 |
| 1180×820 | Oh, Come, All Ye Faithful | 0.738 | 2 / 13 / 2 | 2 / 10 / 2 | 1 / 4 / 4 |
| 1180×820 | Silent Night | 0.738 | 2 / 8 / 2 | 2 / 7 / 2 | 2 / 5 / 3 |
| 1180×820 | I Am a Child of God | 0.738 | 1 / 5 / 2 | 1 / 4 / 4 | 1 / 3 / 5 |
| 1180×820 | Follow the Prophet | 0.738 | 3 / 11 / 2 | 2 / 5 / 3 | 2 / 5 / 4 |
| 820×1180 | Amazing Grace | 0.78 | 4 / 17 / 1 | 4 / 17 / 1 | 3 / 12 / 2 |
| 820×1180 | Give, Said the Little Stream | 0.702 | 5 / 17 / 2 | 4 / 12 / 2 | 3 / 6 / 3 |
| 820×1180 | The Nativity Song | 0.68 | 4 / 20 / 1 | 3 / 14 / 2 | 3 / 12 / 2 |
| 820×1180 | The Shepherd’s Carol | 0.78 | 3 / 8 / 1 | 3 / 8 / 1 | 4 / 8 / 1 |
| 820×1180 | Oh, Come, All Ye Faithful | 0.68 | 4 / 22 / 1 | 3 / 12 / 2 | 3 / 8 / 3 |
| 820×1180 | Silent Night | 0.702 | 4 / 12 / 1 | 4 / 10 / 2 | 3 / 6 / 2 |
| 820×1180 | I Am a Child of God | 0.68 | 3 / 13 / 2 | 3 / 10 / 2 | 2 / 4 / 3 |
| 820×1180 | Follow the Prophet | 0.702 | 5 / 12 / 2 | 5 / 11 / 2 | 4 / 5 / 3 |
| 390×844 | Amazing Grace | 0.64 | 3 / 6 / 2 | 2 / 4 / 4 | 2 / 2 / 6 |
| 390×844 | Give, Said the Little Stream | 0.702 | 3 / 5 / 4 | 2 / 3 / 5 | 2 / 2 / 9 |
| 390×844 | The Nativity Song | 0.64 | 3 / 9 / 3 | 3 / 7 / 5 | 2 / 4 / 7 |
| 390×844 | The Shepherd’s Carol | 0.702 | 3 / 3 / 2 | 3 / 3 / 3 | 2 / 2 / 3 |
| 390×844 | Oh, Come, All Ye Faithful | 0.702 | 3 / 5 / 4 | 3 / 5 / 5 | 2 / 2 / 9 |
| 390×844 | Silent Night | 0.64 | 3 / 4 / 3 | 3 / 3 / 4 | 2 / 2 / 6 |
| 390×844 | I Am a Child of God | 0.64 | 2 / 4 / 5 | 2 / 2 / 6 | 1 / 1 / 10 |
| 390×844 | Follow the Prophet | 0.64 | 4 / 5 / 4 | 3 / 4 / 6 | 3 / 4 / 6 |
| 1440×1000 | Amazing Grace | 0.9 | 2 / 14 / 2 | 2 / 14 / 2 | 2 / 11 / 2 |
| 1440×1000 | Give, Said the Little Stream | 0.738 | 3 / 15 / 2 | 3 / 11 / 2 | 2 / 7 / 3 |
| 1440×1000 | The Nativity Song | 0.738 | 3 / 20 / 1 | 2 / 13 / 2 | 2 / 10 / 3 |
| 1440×1000 | The Shepherd’s Carol | 0.9 | 2 / 8 / 1 | 2 / 8 / 1 | 2 / 6 / 2 |
| 1440×1000 | Oh, Come, All Ye Faithful | 0.738 | 3 / 22 / 1 | 2 / 10 / 2 | 2 / 7 / 3 |
| 1440×1000 | Silent Night | 0.9 | 3 / 12 / 1 | 3 / 12 / 1 | 2 / 5 / 3 |
| 1440×1000 | I Am a Child of God | 0.738 | 2 / 11 / 2 | 2 / 8 / 2 | 1 / 3 / 4 |
| 1440×1000 | Follow the Prophet | 0.738 | 4 / 16 / 2 | 3 / 8 / 2 | 3 / 7 / 3 |

## Verification and limitations

- Screenshot review: phone, iPad portrait, iPad landscape, desktop. No new toolbar/header overflow; readable complete-system layout. Normal and Large geometry preserved.
- Most-music comparative audit: no horizontal ink clipping in selected auto layouts. No lyric overlap detected except the pre-existing Amazing Grace verse-3 “Through / man” overlap at tablet/desktop widths. Every candidate contains it, so auto conservatively retains Normal scale there. This is an explicitly retained renderer limitation, not a claim that all original scores are collision-free. Phone reflow separates that text. Source XML is unchanged.
- Measured three-candidate evaluation: approximately **59–139ms** on the test machine, excluding network/load costs. Physical iPad/Safari performance has not been measured. Repeated renders reuse parsed data and cached selected SVGs; no unbounded search or render loop.
- Complete-system regression covers nine songs and four viewports, including A Child’s Prayer, Follow the Prophet and Come, Thou Fount; major/minor, sharp/flat, sparse/dense and multi-verse material. Checks include page cuts, total systems, bottom clearance, tap/drag separation, keyboard/pedal, offline page turns, orientation, measure retention, key/octave/reset, print invariance, playback, Lyrics and PDF transitions.
- State tests cover default auto; Normal/Large across reload and songs; return to auto; height-only resize; no settled render loop; cache reuse; transposition and octave consistency; musical Reset; uninterrupted playback during size changes; Score/Lyrics; PDF; offline helper/cache and score opening.
- Pure-policy tests cover bounded densities, readability floors, collision rejection, larger-scale tie breaks, fallback and storage failure. Existing selector tests cover touch targets, keyboard, Escape, outside dismissal and all viewport sizes. Lists/Favorites/Library regressions preserve ordering, membership, view navigation and persistence.
- Bounding-box checks are conservative heuristics, not a proof against every engraved-symbol collision. They inspect horizontal lyric lanes, not musical semantics. If all candidates fail, retaining Normal avoids inventing a new rendering fix. Readability still depends on viewing distance, vision and physical display; Normal/Large are explicit overrides.

Changed implementation files: `auto-layout.js`, `app.js`, `index.html`, `styles.css`, `sw.js`. Tests: `auto-layout-policy.mjs`, `most-music.mjs`, `most-music-state.mjs`, plus updated selector and virtual-page expectations.
