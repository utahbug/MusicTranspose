# Centered score controls and page feedback

## Scope

Verified repository `C:/Users/kenro/Documents/Codex/MusicTransposePrototype`, remote `https://github.com/utahbug/MusicTranspose.git`, branch `codex/pages`. PrimarySongs was read only. Existing diagnostic files remain untracked and excluded.

- Tablet/desktop: Library and Reset left; Score View, Key, Tools, Settings and Lyrics genuinely centered using equal side grid tracks; passive `Page N` right. Existing PDF Key/Reset gating is preserved.
- Phone: existing Key node remains with Library/Reset on the upper row, page label at its right; the other controls are centered on the lower row. No duplicate controls or changed handlers.
- Persistent status is 14px (13px phone), italic, normal weight, with `role=status`, polite live updates and `aria-label="Page N of Total"`. It is outside score content and cannot intercept input.
- Transient `N / Total` appears only at the end of a successful `turn()`: 1,200ms then a 180ms opacity fade. Reduced-motion removes the transition. It is aria-hidden to avoid duplicate announcements and pointer-events:none.
- Both hide for one-page scores, Continuous/Auto, Library, Lyrics and print. Print generation cannot copy them because they are outside the score tree. Session reset/navigation cancels the feedback timer.
- Removed the score-overlay counter placement and its unused PDF ink-clearance helper. No pagination, gesture geometry, score content, playback, annotation or view availability logic changes.

## PrimarySongs reference

Read `script-v528.js` `renderPdfPageNumbering()` (around line 6004) and `styles-v528.css` `.pdf-page-marker` / `.pdf-page-notice` (1074–1076). Reused the restrained italic marker and 1,200ms confirmation timing, adapted visible wording to `Page N` and `N / Total` as requested. No PrimarySongs files modified.

## Verification

- `tests/performance-page-position.mjs`: Chromium and WebKit, 390x844, 820x1180, 1180x820, 1440x800; PDF, Transpose and Melody. Verifies centering, no overlaps/overflow, status/accessibility, Next/Previous/First/Last, keyboard, cancelled/no-op inputs, dismissal, annotation turns, dark pages, one-page hiding, navigation modes, Lyrics/Library and print exclusion.
- `tests/compact-key-toolbar.mjs`: Chromium, 320/390/820/1180/1440 widths; original node identity, control order, Key dialog/focus, transposition/reset and Lyrics return state.
- `tests/pdf-counter-clearance.mjs`: Chromium 820; dense PDF footer clearance, trim, dark, keyboard and annotation.
- `tests/pdf-annotations.mjs`: Chromium 820; drawing, undo/clear, persistence/isolation, resize/trim, dark and clean print.
- `tests/score-tap-contract.mjs`: unchanged gesture-contract assertions pass.
- `tests/score-tap-parity.mjs`: Chromium 820, 10 cycles per PDF/XML/Lead. Its obsolete `normal` menu selector was updated to the existing `auto`/Transpose option; its page parser now reads the accessible label.
- `git diff --check` passes. No full music-engine/chord suite run.

Screenshots are in ignored `test-results/page-position-{chromium,webkit}-{width}-{PDF,XML,Melody}.png`, plus dark/annotation variants and toolbar-grouping captures. Visually inspected iPad Transpose and phone PDF captures.

These are browser viewport simulations. Physical iPad playing-distance verification remains pending.
