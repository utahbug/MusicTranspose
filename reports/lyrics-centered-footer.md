# Centered Lyrics footer

Verified repository/root/remote and `codex/pages`; no applicable AGENTS.md found. Existing untracked diagnostics are excluded.

## Change

- `styles.css`: `.lyrics-footer` uses `minmax(0,1fr) auto minmax(0,1fr)` grid columns. The existing `.lyrics-tools` stays a single group in column 2, with both inline margins zero. The shared `#songs` node stays left in column 1. Library width therefore cannot shift the centered group's visual midpoint.
- Existing Theme / Text size / Score order, 6px gaps, artwork, button nodes/handlers, fixed footer positioning and safe-area padding are preserved.
- Removed the old <=360px Library width reduction so Library retains the requested 44x44 target; the group fits in one row at 320px without overlap.
- `sw.js`: shell v146 delivers the CSS update offline.
- No application JavaScript changes. Font popup anchoring, return-view state, theme, preferences, playback, Score toolbar, page feedback and export logic remain unchanged.

## Checks

- New `tests/lyrics-centered-footer.mjs` passes Chromium and WebKit at 320x740, 390x844, 768x1024 (iPad mini), 820x1180, 1180x820 and 1440x1000.
- Original, Transpose and Melody-only round trips preserve key, register, musical XML, view and page status. Score/Music has identical physical coordinates across all three modes at each width.
- Group midpoint equals viewport midpoint; existing 6px gaps and all four 44x44 targets verified. Library stays at left, footer at bottom, no overlaps or horizontal overflow.
- Shared Library node identity, accessible Back to list label, and rehearsal-list context/order preserved.
- Theme works; Large preference survives returning/reopening. Font popup is 8px above its button, within viewport, and preserves selected state, Escape/outside dismissal and focus return. Keyboard order is Library, Theme, Text size, Score with visible focus.
- Final Chromium 820 run additionally verifies playback remains playing through Lyrics and Score return. Windows WebKit playback is not claimed.
- Existing `tests/lyrics-font-menu.mjs` verifies all four sizes, Small default, legacy saved preferences, theme and popup keyboard behavior at 320/390/820/1180/1440. Its obsolete Library-row Lyrics selector was replaced with the current `prototype.openLyrics` entry point; assertions unchanged.
- `git diff --check` passes. No full music-engine suite run.

Screenshots: `test-results/lyrics-centered-{chromium,webkit}-{width}-{pdf,auto,large}.png` (ignored). Visually reviewed iPad-mini and 320px phone with popup open. These are browser simulations; physical device verification remains pending.
