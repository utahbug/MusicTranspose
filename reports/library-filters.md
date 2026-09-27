# Library Filter menu

Favorites and Lead sheets now live in an anchored Filter menu at the far right of the Source / Sort row. The 44px funnel control shows an active tint/dot; menuitemcheckbox states and visible checkmarks identify each selection. Supports keyboard activation, arrow/Home/End movement, Escape focus return, Tab/outside dismissal, viewport clamping and resize/scroll repositioning. More contains only Files / My Music and Import music.

Favorites means favorites-only, never favorites-first sorting. Obsolete favorites-first preferences are ignored. Lead uses the existing supportsLead predicate, with the global supported-song count calculated dynamically. Both filters combine by intersection within the selected Source/List and search. Filters live in memory across browsing, utility views and Score/Lyrics round trips; reload starts with neither active. They never overwrite stored source/list state, membership, song IDs, favorites or manual order. Search Clear clears search only; toggle filters off in Filter. During Edit order the complete list is shown and Filter is disabled; ending editing reapplies the selected filters.

Targeted tests:
- tests/library-filters.mjs passed at 320x568, 390x844, 844x390, 820x1180 and 1440x1000: each/combined filter, source/list intersection, dynamic Lead count, favorite toggles, Score/Lyrics return, Lead availability, search, sorting/manual order, utility actions, keyboard states, on-screen menu, no horizontal overflow, same-row controls, stored order and offline reload/filter smoke.
- tests/library-advanced-search.mjs passed: existing search scopes, aliases/lyrics, session scope, list identity, offline and responsive checks.
- tests/library-header.mjs updated for the relocated Lead option and passed six sizes including 430x932.
- 320px menu screenshot visually inspected. Browser viewport tests are not physical-device verification.

Static production app served directly; no build step exists. No music-engine/chord suites run; no score/layout/Lead extraction changes.

Files: index.html, library.js, styles.css, sw.js (cache v118), tests/library-filters.mjs, tests/library-header.mjs, this report. Earlier untracked layout diagnostic artifacts excluded.
