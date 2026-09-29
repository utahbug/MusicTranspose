# Lyrics polish and paired corner controls

Starting commit: 78a97f7. Existing MusicTranspose repository and codex/pages remote verified. Primary app reference was read only.

## Behavior

- Lyrics identity and Library share the single MusicDocs gradient declaration/token and border/shadow rule. The song title/source header measures 56px for The Nativity Song at 320, 390, 820, 1180 and 1440px; long titles wrap naturally with a reserved playback-button slot.
- New appearance state defaults to Small (19px) and a light reading surface. Existing saved dark/light and numeric sizes 0/1/2 retain their meaning. Extra Large adds index 3; no storage rewrite or migration is needed. Missing/invalid size falls back to Small. Medium remains 24px (22px on phones), Large 30px, Extra Large 36px.
- The Aa/chevron button opens a viewport-clamped fixed popover above the button. Four explicit menuitemradio choices apply immediately. Selected state, arrow/Home/End navigation, Escape, outside-pointer/focus dismissal, resize/scroll dismissal and focus return are supported. Listeners are aborted when the view is disposed.
- The same Library node/handler stays at the bottom-left. Theme, text size and Score form the bottom-right Lyrics group. The existing Score Lyrics node is moved into the end of utility-controls. Both view switches use 44px targets and matching footer/safe-area spacing; no invisible measurement of the Score heading remains.
- At 380px and below, existing key/reset controls use an upper row when the Lyrics toggle is available, leaving Library and view controls at the lower corners. The auto-scroll auxiliary strip is above the toolbar, with safe-area padding remaining at the bottom. Other control behavior is unchanged.
- The original show-tap-zones button moves from Settings into score-actions and uses the Primary app SVG. Existing geometry, availability handling, overlay and dismissal remain; focus returns to that button. No second overlay or tap handler was introduced.
- Lyrics no longer imports game/tap activation modules, creates a Stop control, stores game state, or installs game listeners. Game-only CSS and text-selection suppression are removed. Old modules remain as historical files but are no longer precached. Legacy game-specific tests describe the retired feature; lyrics-cleanup now verifies that it cannot activate.
- Service-worker shell advances to v129 for coherent offline HTML/JS/CSS updates. Existing score-cache migration is unchanged.

## Scope and verification

Production files: app.js, icons.js, index.html, lyrics-view.js, settings-help.js, styles.css, sw.js. No source scores, extraction, transposition, playback, pagination or Library/list/search/import/export logic changed.

Targeted browser checks: score-lyrics-toggle, lyrics-library-navigation, lyrics-cleanup, lyrics-font-menu, settings-help, score-tools, score-lyrics-long-title. These cover repeated same-coordinate touch and keyboard transitions, preserved key/octave/page/playback state, footer overlap, safe-area spacing, Continuous/Page/Auto modes, appearance persistence and offline reload, all four font options, game activation attempts, and XML/Lead/PDF guides. Viewports include 320x568, 390x844, 430x932, 844x390, 820x1180, 1180x820 and 1440x1000 across the targeted tests. Phone/tablet screenshots were visually inspected. Browser emulation is not physical iPad/iPhone verification.

Some local browser runs hit ERR_ADDRESS_IN_USE / timed out before initial Library readiness. Remaining regressions passed sequentially on fresh local ports. The font-menu-only test blocks service workers to avoid unrelated background catalog warming; offline behavior is covered separately by lyrics-cleanup, lyrics-library-navigation and score-tools. An initial 1px desktop footer mismatch and auto-scroll safe-area mismatch were corrected and covered by the paired-toggle test. No full engine/chord suites run. Existing untracked diagnostic files were not included.
