# PDF annotation port

## Scope and source

MusicTranspose only, on `codex/pages`. Repository and origin verified as
`C:/Users/kenro/Documents/Codex/MusicTransposePrototype` and
`https://github.com/utahbug/MusicTranspose.git`.

Adapted the current PrimarySongs implementation at `610a1eb02cd3b68941919c2e30c0c2de07461827`
(local checkout matched remote HEAD): `script-v528.js`, `index.html`, and `styles-v528.css`.
PrimarySongs was not modified. Reused its tool/action glyphs, exact four colors,
rounded selected controls, Done gradient, normalized strokes, pencil/highlighter
opacity and width rules, whole-stroke eraser, per-page undo (20 changes), and
page-clear confirmation. Pointer cancellation discards the incomplete gesture;
erasing also checks between sampled points for predictable sparse-stroke removal.

## Files

- `pdf-annotations.js`: isolated overlay, tools, persistence, pointer lifecycle and UI state.
- `app.js`: initialize and synchronize annotation availability.
- `pdf-score.js`: attach page number and PDF fingerprint to existing frames.
- `navigation.js`: annotation-only tap/auto gating and toolbar page-turn bridge.
- `index.html`: enable existing Annotate menu item and add the Primary-style toolbar/notice.
- `styles.css`: overlays, responsive 44px controls, focused Done contrast, PDF-specific dark treatment and print exclusions.
- `sw.js`: v132 shell cache; precache the new module.
- `tests/pdf-annotations.mjs`, `tests/pdf-annotations-offline.mjs`: focused coverage.
- `tests/score-tools.mjs`: explicitly open XML for the existing disabled-Annotate assertion.
- `tests/pdf-first.mjs`: check dark inversion on the PDF raster rather than the parent.
- This report.

## Availability, navigation and input

The existing Tools > Annotate item is enabled only for a ready visible PDF:
bundled PDF-only songs, dual-format Original PDF views, and imported PDFs.
XML, transposed XML, Lead and Lyrics disable it with an explanatory label/title.
Entry closes Tools, retains the current page, focuses the selected drawing tool,
and displays a notice. Done restores Tools focus and normal tap navigation.
Switching away automatically exits annotation mode.

The existing `score-taps.js` implementation is unchanged. Its caller gates input
while annotating and cancels any pending tap. Auto scrolling pauses; toolbar
Previous/Next use existing PDF pages and preserve the selected navigation mode.
Pointer Events handle finger, mouse and pen, capture, coalesced moves and safe
cancel/lost-capture/blur/resize handling. Only the active drawing canvas disables
browser touch gestures. Controls remain keyboard operable with pressed states
and visible focus treatment.

## Storage and isolation

Local storage key: `music-transpose-pdf-annotations-v1`.

```json
{
  "version": 1,
  "documents": {
    "JSON.stringify([songId, sourceIdentity])": {
      "songId": "catalog or local song ID",
      "source": "source identity",
      "pages": {
        "1": [{"tool":"pencil","color":"#245A9A","points":[{"x":0.25,"y":0.4}]}]
      }
    }
  },
  "preferences": {"tool":"pencil","color":"#245A9A"}
}
```

Bundled source identity combines the PDF asset path and PDF.js document fingerprint.
Imported identity uses the existing content SHA-256 hash, not a temporary blob URL.
Song ID plus source identity plus page number prevents cross-song/page/file reuse.
Deleting imported music removes its annotation documents and undo history; reimport
receives its own ID. Undo history is per page, in memory for the current app session.
Storage errors preserve session marks and show a warning instead of claiming persistence.

## Coordinates, theme and clean output

Points are normalized against the full untrimmed PDF canvas. Each overlay has the
same raster dimensions, CSS width, and crop offsets as that source canvas. Resize,
rotation and margin-trim changes redraw the same points in the same page space.
No PDF raster pixels or XML are changed.

Dark page keeps the existing PDF inversion, applied to the PDF raster separately
from the overlay. Overlay brightness increases on dark pages; saved colors and
points remain unchanged, and toolbar colors remain neutral. XML dark styling is unchanged.

Print preparation continues to use clean PDF canvases; tests compare print image
data with the unmarked source byte-for-byte. Print CSS also excludes annotation
layers and controls. Save as PDF through printing remains clean. No export or
MusicXML path receives annotation data. There is no annotation export or sync feature.

## Verification

Commands use the bundled Playwright package and local `TEST_URL=http://127.0.0.1:8775/`.

- `node tests/pdf-annotations.mjs`: Chromium 820x1180, 1180x820, 390x844, 1440x1000.
- Same with `ANNOTATION_ENGINE=webkit`: all four sizes; final focus/exit checks repeated at 820x1180.
- `node tests/pdf-annotations-offline.mjs`: genuine cached offline reload/draw/restore for bundled and imported PDFs; deletion/reimport isolation; Continuous/Auto page controls and pause.
- `node tests/score-tools.mjs`: existing menu, keyboard, theme, print and offline coverage.
- `node tests/pdf-first.mjs`: all four sizes, defaults, Lyrics returns, structured working-state restoration, trim, tools and clean print.
- `TAP_BUNDLED_ONLY=1 node tests/pdf-taps.mjs`: existing PDF tap regression checks. The unrestricted run stalled without completing; imported/offline behavior is covered separately by the annotation offline suite.
- `TAP_CYCLES=10 node tests/score-tap-parity.mjs`: repeated PDF/XML/Lead navigation at four sizes.
- `node tests/score-tap-contract.mjs`: shared gesture contract checks.
- JavaScript syntax checks and `git diff --check`.

The PDF-first suite initially timed out waiting for Library startup during concurrent
browser runs; a subsequent run passed all four sizes without application changes.
No full music-engine/chord suite was run.

Screenshots: ignored `test-results/annotations-{chromium,webkit}-{width}.png`.
Verified 44px controls, wrapping within phone width, no horizontal overflow, layer
alignment, visible dark-page marks and focused Done contrast. Chromium touch tests
use browser-generated touch events; WebKit drawing and pen checks include synthetic
Pointer Events. These are browser simulations, not physical-device acceptance.

## Physical-device follow-up and limitations

User will verify physical iPad finger/Apple Pencil drawing, palm/cancel behavior,
rotation, scroll/trim alignment, page controls and installed-PWA persistence.
Browser storage is local to this app origin/profile; clearing it removes marks.
Annotations are not synced or included in print/export. Undo history does not survive reload.
