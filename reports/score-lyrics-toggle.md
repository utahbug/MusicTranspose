# Paired Score / Lyrics toggle

Starting commit: 8b00c871b40277ca09a6fe430c406d59cc41c01f.

Previously the Score Lyrics action and the Lyrics Score action belonged to different header layouts, so switching back required moving the finger/cursor. The established Score-side control, icon, CSS, Original key spacing and hit area are unchanged. Lyrics now reuses its existing music-note Score icon in a separate paired slot; the old copy in the theme/font/Fun tools is removed.

The app measures the existing Score action rectangle before switching and gives the Lyrics action the same viewport position and dimensions (44 by 44 CSS pixels). Direct Lyrics opens and resize use a synchronous invisible measurement of the existing Score header, restoring every temporary style/class immediately. Resize accounts for the saved Score reading offset. This avoids duplicating responsive header offsets. Lyrics utilities reserve clearance; at the narrowest widths they may wrap without overlapping the return action or song title. The normal lyric column remains unchanged.

Accessible names and tooltips are View Lyrics and View Score. Real buttons, visible focus and keyboard activation remain. Focus follows the paired action when switching from Score and back; direct Library Lyrics entry keeps its heading focus. Library and browser navigation remain available.

## Validation

- tests/score-lyrics-toggle.mjs: 1180x820, 820x1180, 390x844, 320x740, 1440x1000. Four consecutive round trips using exactly the same touchscreen coordinates; matched x/y/width/height within 1 pixel, one Score return control, keyboard focus/Enter, no horizontal overflow or overlapping utility controls, orientation-width changes.
- Key, octave, rendered XML, score size, page position and ongoing playback remain identical across round trips. Existing Lyrics Fun cleanup runs on leaving Lyrics.
- tests/score-lyrics-long-title.mjs: direct Library Lyrics entry for Hail to the Brightness of Zion’s Glad Morning! at phone, both iPad orientations and desktop. Wrapped title clear of return action, matching button geometry after Score loads, light-theme and font controls working.
- tests/browser-history.mjs: Library/Favorites/List origins, Score/Lyrics/PDF Back/Forward, refresh, rapid traversal, deleted/missing IDs, private imports, offline refresh/navigation, unavailable assets and Back during loading passed.
- Screenshots reviewed for phone, iPad portrait and desktop, plus the wrapped long title. Existing Score layout, playback/rendering code, print rules, catalog, transposition and navigation routing were not redesigned.
- Existing regression tests referencing the former Open score accessible name were updated to View Score. Service worker cache version incremented to distribute the changed application files.

## Limits

Responsive checks use Edge/Chromium viewport and touch emulation, not physical iPad/iPhone Safari hardware. The controls scroll with their views; the match is established on switching and recomputed on resize, not a new sticky header. No changes to print output or offline architecture.
