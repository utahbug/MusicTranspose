# Score View and bottom toolbar

## Scope and mapping

Repository root/origin verified before editing. The existing selector and rendering paths are reused.

| Visible view | Internal selection | Availability |
| --- | --- | --- |
| Original | `pdf` / existing PDF presentation | Authored PDF or imported PDF |
| Transpose | `auto` full-score layout | Structured MusicXML |
| Melody only | `large` / existing Lead extraction | Existing `leadSource.ok` guard |

PDF+XML still opens Original by default. XML-only opens structured; PDF-only and local PDFs expose Original alone. Unsupported menu entries are hidden. The button always displays the current view with a simple outline chevron; its accessible name is `Score View: <view>`.

Most music and Normal are removed from the menu, not from renderer code. Choosing Transpose selects the existing `auto` algorithm. Persisted/resumed `normal` full-score states remain valid and display Transpose; choosing Transpose explicitly selects `auto`. Lead extraction, availability, playback XML, key/octave transformation, pagination and tap algorithms are unchanged.

## Controls and accessibility

Order: **Score View / Tools / Settings / Lyrics**. Existing Tools and Settings buttons are moved as DOM nodes, preserving handlers. Library remains bottom-left; Lyrics stays far-right when the song has lyrics. Tools still contains Print, Annotate and Dark page; no export action was added.

The existing fixed popover is a vertical menu of 44px choices with selected radio state. Enter/Space opens through the native button; arrows, Home/End navigate visible choices without turning score pages. Escape returns focus; outside click, focus exit, resize and Library navigation dismiss it. Asynchronous view rendering temporarily disables the trigger, so focus is restored after rendering only if focus fell to the document body, not if the user moved to another control.

Tablet/desktop keep one row. On phone widths <=600px the existing narrow-screen centered key/reset arrangement is extended: key/reset above, Library bottom-left, view/Tools/Settings/Lyrics bottom-right. Targets, safe-area offsets and existing page-position slot are retained. No page-position redesign or new pagination algorithm.

## Preservation

- Switching Original/Transpose/Melody only preserves current key and octave/register state.
- All three Lyrics round trips retain view, key, octave, XML and page state.
- Same-song/context Library resumes and different-song/context defaults use existing logic.
- Annotation is enabled only for Original PDF, including local PDFs; disabled in both structured views. Switching out of active annotation still exits it.
- Annotation storage, drawing, print/export handling, Tools, Settings, Library and search implementations are unchanged.

## Files

Production: `app.js`, `index.html`, `styles.css`, `sw.js` (v135 shell cache).
Tests: updated `tests/size-selector.mjs`, `tests/pdf-first.mjs`, `tests/pdf-annotations.mjs`.
Report: this file.

The existing selector test now checks the three-view model rather than the superseded size labels. PDF-first coverage now reaches Melody only from the song view because Library Lead shortcuts were removed in the preceding task.

## Verification

Bundled Playwright against local port 8780; no full music-engine suite.

- `tests/size-selector.mjs`: Chromium and WebKit phone 390x844, iPad 820x1180/1180x820, desktop 1440x1000, narrow phone 320x740. Availability, PDF-only and dual formats, Melody-capable/non-capable songs, switching, key/octave, three Lyrics round trips, annotation gating, keyboard selection/focus/dismissal, viewport bounds and control order. Chromium iPad also imports actual MusicXML-only and PDF files through My Music.
- `tests/pdf-first.mjs`: all four main sizes, opening defaults, working-session resumes, Lyrics/page restoration, imported XML-only, Tools/print/trim/taps.
- `tests/score-tools.mjs`: existing menu/keyboard/theme/Settings/navigation/print/offline behavior.
- `tests/pdf-annotations.mjs`: all four main sizes, annotation persistence, drawing/undo/clear, page/song isolation, dark mode, resize/trim, clean print and structured-view gating.
- JavaScript syntax and `git diff --check`.

Concurrent test attempts hit Library startup timeouts; final verification uses sequential runs. A test caught lost focus after asynchronous rendering; that was corrected before the final run. Diff review also caught and corrected an editing-time text encoding issue before commit.

Screenshots in ignored `test-results/score-view-{chromium,webkit}-{width}.png`.
These checks are browser simulations, not physical iPad acceptance.

## Deferred

Export, page-position relocation, metronome redesign, playback sounds, Settings styling,
and the broader Library/List/Files redesign remain deferred. No known toolbar overlap remains at tested widths.
