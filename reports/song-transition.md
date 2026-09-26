# Song selection reliability

## Root cause

Library/List clicks entered loadSong, which exposed the score view before committing activeSong/title/metadata. MXL fetch/unpack and OSMD.load were asynchronous; old DOM and metadata could survive until commit. PDF rendering cleared its host only after awaiting the document. Lyrics switched identity only after awaiting its shared data. Busy guards dropped newer requests, rather than identifying which async operation owned the destination. Caches themselves were not returning the wrong asset.

## Fix

- beginSelection commits destination identity/title immediately, clears prior notation/credits/key metadata for a different session, hides prior Lyrics, and displays a small neutral loading message. Same-song Score/Lyrics toggles retain key, octave, reading state, and playback.
- A monotonically increasing selection version guards async source loads, errors, Lyrics completion, MXL commits, PDF publication, and completion cleanup. Superseded failures cannot return the current destination to Library.
- Shared OSMD work is serialized; old rendering can finish privately but cannot commit or populate the new song's render cache. Newest requests are accepted rather than discarded by a busy guard.
- PDFs rasterize into detached frames and publish atomically only while current.
- History travel invalidates pending selection work. Queued row clicks retain the original Library/List scroll snapshot.
- No changes to Library layout, score engraving rules, Lead extraction, chords, transposition, or service-worker asset-selection logic. Shell cache advanced to v103 for deployment.

## Targeted production validation

The app is static, with no compilation step. Tests ran against production files served at localhost:8771.

- tests/song-transition.mjs: passed at 320x568, 844x390, 820x1180, 1440x1000. Deterministically held real OSMD loading, source fetch failures, Lyrics responses, and PDF documents. Verified immediate destination identity/empty previous score, only the final render commits, stale failure suppression, repeated row activations, Score/Lead/PDF/Lyrics transitions, same-song key preservation, full/filtered/search/Favorites/List entry and return. Includes playback, touch page navigation, Back during a pending fetch, cached/offline navigation, and overflow checks.
- tests/score-lyrics-toggle.mjs: passed five layouts, repeated touch toggles, key/octave/XML/page preservation, playback continuity, focus, and resize.
- tests/library-search-focus.mjs: passed four layouts, Home/Back/Forward, Library/List/filter/search/sort/scroll restoration, Files, Favorites, and offline reload.
- SYNC_SMOKE=1 tests/measure-sync.mjs: passed 32 targeted real-score/synthetic cases, including above-staff lyric placement, measure/voice ownership, and transposed rendering.
- Loading message uses absolute positioning at its natural position beneath the heading; an automated geometry check confirms that showing/hiding it does not affect the score bounds or engraving space.
- Reviewed loading-state screenshot at 320px: only destination title/source and loading message; old key/score hidden, footer placement retained.
- git diff --check passed. No full chord or music-engine regression suite was necessary or run.

Files: app.js, library.js, pdf-score.js, styles.css, sw.js, tests/song-transition.mjs, this report.

