# Temporary Lead discovery filter

Lead sheets remains the last More-menu item with its existing dynamic catalog availability count. leadOnly and the pre-filter scroll position now exist only in memory. The flag is omitted from workspace, history, preferences, and startup snapshots. Saved workspace contexts from older versions have leadOnly removed; restoring any old context ignores it.

The filter applies inside the current Source/List and search context. Opening Score or Lyrics clears it before navigation captures the normal return context. Choosing a Source/List, entering Files, Import, List management or Add Songs, explicitly clearing/toggling it off, restoring history, and reload/restart also clear it. The checkmark appears only while the temporary filtered Library is active. Sort, search, Favorites and manual List membership/order are untouched. The pre-filter scroll position is retained for a normal return where the resulting list permits it.

Production files were served directly at localhost:8771 (static app; no compilation step). tests/library-lead-temporary.mjs passed at 320x568, 390x844, 820x1180 and 1440x1000. Checks cover legacy-state migration, dynamic count, correct capability filtering, temporary checkmark, Source/List changes, Score/Lead and Lyrics entry/return, underlying scroll/sort/search/Favorites preservation, manual sequence, Files and Edit Lists exits, reload, fresh browser-context restart from saved state, offline reload, and unchanged supported/unsupported Lead menu availability. No overflow or browser errors. No full music-engine tests run.

Files: library.js, sw.js (v108 shell refresh), tests/library-lead-temporary.mjs, reports/library-lead-temporary.md.
