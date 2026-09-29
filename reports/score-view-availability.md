# Score View: visible unavailable options

The menu now always contains Original, Transpose and Melody only. Native disabled
buttons replace hidden options; the view mapping, eligibility guards and switching
paths are unchanged. Disabled actions also have an explicit early return before
playback or view work. The active view label is unchanged, and disabled choices
never receive selected state.

Disabled entries use opaque gray text (#626e78) on a pale gray background (#f3f5f6),
without selected borders/shadows or hover changes. Enabled selected entries retain
the existing blue selection treatment. The existing keyboard navigation skips
native disabled buttons; all entries remain discoverable in the accessibility tree.

Both title and aria-description provide these exact explanations only when disabled:

- Original: Original PDF is not available for this song.
- Transpose: Transpose is not available for this score.
- Melody only: Melody only is not available for this score.

## Representative cases

| Case | Source | Enabled choices |
| --- | --- | --- |
| PDF + XML + Melody | HHC 1035, As I Keep the Sabbath Day | All three |
| PDF + XML without Melody | The Nativity Song | Original, Transpose |
| XML-only + Melody | HHC 1035 XML imported through My Music | Transpose, Melody only |
| PDF-only | Choose to Serve the Lord, bundled and imported | Original |

No apparent Melody eligibility bug was found. The existing projector accepts HHC
1035 (including imported XML); Nativity reports `multiple-lyrics` with multiple
lyric-bearing voices. No eligibility or extraction files were edited.

## Files and verification

Production: app.js, index.html, styles.css, sw.js (cache v136).
Tests: tests/size-selector.mjs and tests/pdf-first.mjs, replacing hidden-option expectations.
Report: this file.

- Existing selector suite in Chromium and WebKit at 390x844, 820x1180, 1180x820,
  1440x1000 and 320x740: three visible options, enabled/disabled matrices, native
  disabled click rejection, explanations, selected state, keyboard skipping,
  menu bounds, toolbar alignment, view switching, key/octave and Lyrics round trips,
  and annotation gating. Chromium iPad includes actual XML/PDF imports.
- PDF-first suite at 820x1180: defaults, working state, Lyrics return, print/trim,
  navigation and XML-only import.
- JavaScript syntax checks and git diff --check.
- Screenshots: ignored test-results/score-view-disabled-{chromium,webkit}-{width}.png.

Browser simulations only; no physical iPad test. No full music-engine suite.
This availability presentation supersedes the hidden-option behavior documented
in score-view-toolbar.md. No toolbar order, Library, annotation, pagination,
playback, Lyrics or view-switching algorithm changes.
