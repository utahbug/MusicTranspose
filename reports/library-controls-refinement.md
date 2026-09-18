# Library controls refinement

Starting commit: 46621a271d377c46be6b2006ec5021f6b1be18c5.

The row immediately beneath Search now contains A–Z / 123, a native Source select,
Favorites, Recent, and the compact result count. Text buttons expose aria-pressed,
have 44px minimum touch targets, and retain keyboard focus outlines. The funnel
and separate sort icon/select were removed. Personal-list UI and actions are unchanged.

## Ordering and saved lists

A–Z sorts titles; 123 compares numeric songNumber/page values, including a/b
subdivisions, and places unnumbered songs last in alphabetical order. IDs are never
regenerated. Existing exact-number search prioritization remains intact.

Favorites and custom lists still open in saved order. Choosing A–Z or 123 there
changes the display only. Reorder restores saved order before editing. Filtered
reorders continue updating only the visible slots in the existing saved array.
Leaving that list context restores the global sort. No saved-order migration was added.

## Sources

- All Sources: all 121 records.
- Hymnal: active hymnal collections, currently Hymns (1985): 2 records.
- Children’s Songbook: matching factual collection/membership: 37 records.
- Hymns for Home and Church: matching factual collection/membership: 81 records.
- Legacy: explicit song.status === 'legacy': 0 records. No assignments invented.
- Other: records outside the three principal book categories: 2 records,
  Scripture Power (Music from the Friend) and Choose to Serve the Lord (Primary-use music).

library-query.js owns these mappings. Future authoritative hymnal editions can
update activeHymnalCollections or use a collection membership with role: 'hymnal'
and status: 'active'. Legacy status does not replace historical collection/edition
metadata. Stable song IDs, assets, titles and numbers were not changed.

Favorites and Recent are mutually exclusive optional views, independent of Source.
Search combines with both. Primary/Christmas tags and their searchable text remain
unchanged; they are not presented as Sources.

## Persistence and offline

music-transpose-library-preferences-v1 stores only global order and source.
Existing music-transpose-library-v1 Favorites, groups, recent IDs and orderingVersion
are preserved. The new query module is bundled in the service-worker cache (v51).

## Verification

The dedicated source-control test covers every source, A–Z/123, numeric edge cases,
explicit Legacy status, future membership metadata, source/view/search combinations,
preference reloads, unchanged saved lists, and 320/390/820/1180/1440px viewports.
Controls occupy one row on tested iPads/desktops and wrap on narrow phones without
page overflow. Automated viewport checks use Chromium/Edge, not physical iOS devices.
The current regression suite also covers rendering, playback, Lyrics, transposition,
ensemble guidance, pages/scrolling, PDF/print, Favorites/lists/reordering and offline use.

Local result: all 35 current regression suites passed, including the new source-control matrix.
