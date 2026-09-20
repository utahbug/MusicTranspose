# Library search focus and mobile keyboard

Starting commit: `8c31e32008da50829626cf9fa5f3088320b727fd`.
Verified existing repository: `C:\Users\kenro\Documents\Codex\MusicTransposePrototype`.
Remote: `https://github.com/utahbug/MusicTranspose.git`; branch `codex/pages`; clean starting worktree.

## Root cause and audit

`library.js` explicitly focused `library-search` in both `showLibrary()` and history `restore()`. The `preventScroll` option prevented a scroll jump but did not prevent text-entry focus or the iOS keyboard. Removing the last visible Favorite also fell back to Search as a focus target.
No Search `autofocus` attribute, delayed requestAnimationFrame/setTimeout focus restoration, or explicit desktop Search shortcut was present. The history module stores query/filter/scroll state, not focused-element state. Native retained DOM/BFCache focus and native dialog focus restoration were also considered.

## Focus-only changes

- Library/Home and history return focus the existing Library heading using `tabIndex=-1` and `preventScroll:true`. The heading is a non-editable accessible destination, not an added Tab stop.
- Favorite removal returns to the replacement star, or to the heading when the row is gone.
- A narrowly scoped helper blurs only `library-search` if it is currently active. It runs when leaving Library for Score/Lyrics, Lists, Files, or local-file editing; after dialogs close during history restoration; at initialization; on pagehide; and on persisted pageshow/BFCache restoration.
- Explicit Search clicks/taps, keyboard Tab activation, text entry and clearing remain native. No focus-blocking handler, readonly attribute, timer or global blur was added.
- Files still returns focus to its navigation button. List controls and intentional New List/file-edit text-entry focus remain unchanged.
- No layout, data model, history routing, query normalization, filtering, saved state, score or playback change.
- Service-worker shell version v85 deploys the revised module without deleting local user storage or previously cached scores/PDFs.

## Verification

`tests/library-search-focus.mjs` passes at 390x844 touch/mobile, 820x1180 touch, 1180x820 touch and 1440x1000 desktop:

1. Initial Library has no text input focused and zero automatic Search focus events.
2. Explicit Search tap/click focuses normally; typing `Come Thou` filters results.
3. Song -> Library/Home preserves query, source, A-Z/123, result count and IDs with no new Search focus event.
4. Browser Back/Forward preserves the same state and URL without a static-host 404.
5. Score -> Lyrics -> Library returns without text-entry focus.
6. Favorites -> song -> return preserves Favorites; removing its last visible row does not focus Search.
7. Lists -> song -> Back to list preserves the originating list, then Library retains the query.
8. Files -> Library retains context and its existing non-text focus target.
9. Scrolled Library returns within 3px of the captured position; heading focus introduces no jump.
10. Synthetic persisted pageshow/pagehide verifies narrowly scoped retained-Search cleanup.
11. Offline reload and offline song -> Back preserve the query and neutral browsing focus.

Existing `browser-history.mjs` regression covers Library/Favorites/List/Score/Lyrics/PDF routes, refresh, rapid navigation, missing IDs, external Back/Forward, private imports and offline history. `my-music.mjs` covers private import/edit/delete dialogs, Favorites/Lists references and offline persistence. Both passed.

## Device results and limitations

- iPhone-sized viewport: all focus/state assertions passed; explicit touch input remained usable.
- iPad portrait/landscape: same neutral navigation and explicit Search behavior passed.
- Desktop: same results; keyboard focus targets remain accessible. No explicit Search shortcut existed to remove.
- Tests use Edge/Chromium with touch/mobile viewport emulation. Physical iOS Safari / installed-PWA keyboard visibility and real-device BFCache behavior are not claimed as directly tested. WebKit is not installed in this environment. The app no longer has any automatic Search-focus call; only the text-input focus that summons the keyboard is removed on navigation.

## Deployment

Deploy through the existing `codex/pages` GitHub Pages workflow. The live focus matrix is rerun after deployment; final commit/deployment outcome is reported in the task result.

Files: `library.js`, `sw.js`, `tests/library-search-focus.mjs`, this report.
