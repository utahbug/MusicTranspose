# Score Tools Export / Save

## Scope and files

Repository and origin verified: `C:/Users/kenro/Documents/Codex/MusicTransposePrototype`, `https://github.com/utahbug/MusicTranspose.git`, branch `codex/pages`. No applicable AGENTS.md found. Existing untracked diagnostics remain excluded.

Runtime files: `app.js`, `index.html`, `pdf-score.js`, `score-tools.js`, new `score-export.js`, `styles.css`, `sw.js` (shell v145). Added `tests/score-export.mjs`, `tests/score-export-offline.mjs`, and this report. No source score, rendering, pagination, annotation, playback, Library, toolbar-order or page-feedback changes.

## Workflow

Tools remains Print / Annotate / Export / Save / Dark page. Export / Save replaces the menu list in the same anchored surface with a Back row, PDF, and MusicXML. It does not add toolbar controls. SVG icons use the existing outline weight. The surface clamps to the viewport and can scroll on short screens.

Arrow/Home/End navigation skips disabled items; Right opens Export, Left returns; Escape returns to Tools then closes; actions return focus to Tools; outside click and focus departure dismiss. Existing open-Tools tap suppression protects submenu dismissal without changing gesture rules. Both trigger levels expose aria-haspopup/expanded. MusicXML stays visible but disabled with title and aria-description when unavailable.

## Output mapping

| Current view | PDF | MusicXML |
| --- | --- | --- |
| Original | Downloads the original PDF bytes already held by PDF.js through `getData()`; no rerender or new network dependency | Original source `original`, if present, regardless of retained transformed state |
| Transpose | Existing `preparePrint()` then `window.print()` | Committed `lastXML` |
| Melody only | Existing Melody print preparation then `window.print()` | Committed `lastViewXML` |

Structured PDF is explicitly labeled **Save / Print PDF — Choose Save as PDF in Print**. The app does not claim to generate/download a standalone PDF Blob for structured scores. The operating system/browser supplies Save as PDF and its filename UI. Existing Print is unchanged.

MusicXML is an uncompressed `.musicxml` Blob, never displayXML/engravedXML. Before download it is parsed again, checked for parser errors, a partwise root, part-list and measures. This is well-formedness/basic structure validation, not external XSD validation. Tests independently verify pitches, key, note/harmony counts and absence of engraving anchors.

Export is disabled during loading, busy rendering, aria-busy, or uncommitted key/register changes. Structured print checks song/view/XML state again after asynchronous preparation and refuses a stale result.

Filenames use a sanitized title, a key suffix for structured exports, and `Melody only` when applicable. Invalid/control characters and trailing dots/spaces are removed, reserved Windows device names protected, and the base capped at 140 characters while retaining suffixes. Original PDF/XML use the song title. Blob URLs are released after 60 seconds to allow download handoff.

In-app annotations never enter source PDF bytes or committed MusicXML; existing prepared print remains clean. Page indicators stay outside print output. No remote dependencies added.

## Verification

- `tests/score-export.mjs`: Chromium and WebKit at 320x740, 390x844, 820x1180, 1180x820, 1440x1000. Final strengthened print-input and filename checks additionally rerun in Chromium at 820.
- PDF-only: Choose to Serve the Lord; disabled MusicXML, exact downloaded PDF bytes, keyboard/escape/outside/focus and no unintended page turn.
- PDF + XML: HHC 1035 cold Original exports original XML; switching back from transformed work still exports the original source in Original view.
- Transpose: +2 semitones, then +1 octave; parsed pitches match source +2 / +14, key changes, harmony count preserved, bytes equal committed musical XML.
- HHC 1035 Melody: current key/register, 1 part / 20 measures / 56 melody events / 34 harmonies; no `lead-harmony-spacing` anchors. PDF print input preserves the displayed musical pitches/harmonies.
- XML-only: stored local MusicXML fixture based on HHC 1035; both formats enabled and work offline. Windows WebKit rejects storage of the unused source-file Blob in the test harness, so this fixture stores only the musical XML string used by this path. Import/storage implementation was not changed.
- Annotation: a real pen stroke saved in browser storage; exported Original PDF remains byte-for-byte identical to source; no annotation or page-feedback nodes in prepared print.
- `tests/score-export-offline.mjs`: Chromium service-worker-controlled offline reload; cached Original PDF and XML, transformed XML and Save/Print, plus a local imported PDF Blob URL, all pass.
- Existing `tests/score-tools.mjs`: passes Chromium at 320x568, 390x844, 844x390, 820x1180, 1440x1000, including existing Print/theme/Settings/navigation/offline behavior.
- `git diff --check`: passes. No full music-engine/chord suite run.

Screenshots: ignored `test-results/export-{chromium,webkit}-{width}-{pdf-only,transpose}.png`; tablet Original and Transpose menus visually inspected.

## Limits

Browser tests capture actual downloads and inspect actual prepared print content, but stub the native print dialog. Structured Save as PDF destination controls and physical iPad/iPhone download/share UI still require device verification. No annotation-export or direct structured-PDF generator added.
