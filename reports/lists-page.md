# Dedicated Lists view

Starting commit: d48591c. The old My Lists and song-actions dialogs and their JavaScript are removed. Lists is now a full app section, not a management popup.

## Architecture and data
`lists-view.js` owns overview, opened-list and Add songs presentation. `library.js` retains the existing Library state and supplies shared get/save/open callbacks. There is no second list store or catalog. Data stays in `music-transpose-library-v1`: groups contain existing IDs, names and ordered song-ID arrays. Existing groups keep their creation/array order. Existing orderingVersion migration logic is retained, not replaced; current version-1 data is not migrated or resorted. Unknown song IDs are retained as unavailable rows rather than silently dropped.

## Working with lists
Library > Lists opens the overview. Each row gives name and count. New List opens a compact naming dialog, then the new empty list. An opened list displays saved manual order with Add songs and icon-only List settings (sliders for Rename/Delete) and Reorder songs controls. Empty states explain the next action. List deletion requires native confirmation and deletes only that group. Rename preserves its ID and membership.

Add songs is another view within Lists, not a stack of dialogs. It supports search, factual Source filtering (including My Music), Favorites, and multi-select. Pending selection survives filter/search changes. Already-present songs are checked and disabled. Done appends newly selected IDs in selection order, without duplicates. Back cancels the pending additions. Nothing touches Favorite state or imported file bytes.

Each list row opens its score and offers Lyrics where the existing dataset supports them. Remove affects this list only. A song opened from Lists changes the existing score exit control's accessible label/title to Back to list; Lyrics likewise labels its return action Back to list. Returning restores the same list and scroll position. A separate Library control returns to the regular Library while retaining its query/source/sort state. No large previous-song resume button is added.

## Reordering and accessibility
The existing pointer-capture drag helper supports mouse/pen/touch, insertion feedback, edge auto-scroll and cancellation. Reorder mode is explicitly toggled by the list-level lines/up-down icon with aria-pressed. In that mode, 44px Move up/Move down buttons and touch drag grips are available; drag is not required. Normal mode hides these controls and shows Lyrics (when available) and a far-right pencil instead. Focus follows the moved row. Reordering edits the full saved array, including unavailable IDs, without losing hidden items. This pass deliberately omits within-list search, avoiding competing manual-order/filter semantics.

Semantic sections/headings, buttons, native checkboxes/selects, labeled inputs, keyboard focus and status announcements cover creation/addition/removal/reordering. Native confirm protects deletion; naming supports Enter and Escape through a native dialog. Storage denial is reported as temporary in-memory changes rather than falsely claiming persistence. Favorites remains its separate Library quick filter, not an editable normal list.

## My Music and offline
The picker reads the combined runtime catalog, not only public bundled songs. Imported UUID IDs work unchanged in group membership and ordering. Removing membership or deleting a list never deletes an IndexedDB import. Existing import deletion still prunes references. No network service is added; the new module is included in the app shell cache. App updates do not change the localStorage key or wipe data.

## Verification
`tests/lists-page.mjs` seeds an existing list with an unknown ID and checks exact preservation, overview/opening, creation/rename/confirmed deletion, multi-selection across filters, list-only removal, accessible move buttons, touch drag, score and Lyrics return context, persisted order, offline reload/PDF opening and desktop/iPad landscape/iPad portrait/phone layout.

`tests/my-music.mjs` additionally adds an actual locally imported MXL through the new picker, preserves its stable ID, and checks list/Favorite survival through app-shell replacement and offline use. `tests/library-simplified.mjs` uses the new navigation and preserves Library search, A–Z/123, Source, Favorites and offline behavior. Existing song-session and header-Library tests cover transposition/reset/octave, playback stop, PDF opening, toolbar dimensions and print exclusion.

All sizes use compact two-line title/source rows with actions alongside. Single-line titles measure 57px tall, including the divider. Longer titles and metadata wrap naturally. Lyrics has a fixed 44px slot, keeping the 44px pencil aligned even when lyrics are unavailable. Reorder mode adds a 44px grip and replaces Lyrics/Edit with up/down; it does not add a third row. Preview checks: 390, 820, 1180 and 1440px widths; no horizontal overflow. Physical iPad/Safari drag behavior is still a hardware follow-up; automated touch/viewport emulation is not a device test.

No cloud sharing, sync, folders, templates, or new backup format is introduced. List state remains compatible with the documented future My Music backup plan.

## Compact Lists refinement
Starting commit: c05f822. Removed visible ordinal prefixes and inline minus/removal buttons. Pencil opens a named native dialog containing Remove from this list and Close; removal changes only this group's membership. Sliders open Rename/Delete, with deletion still confirmed. Dialogs support Escape, outside click, native focus trapping and return to their trigger when it remains in the DOM. Removal moves focus to the next row or heading. There is no data migration.

Validation: 390x844, 820x1180, 1180x820 and 1440x1000 browser viewports, normal/reorder/dialog screenshots, no overflow, 44px targets, first/last disabled states, touch drag, up/down moves, mode toggle, Escape focus return, delete cancellation/confirmation, rename, persistence, Score/Lyrics context, offline PDF, imported-file and Favorite preservation on list removal. Browser-emulated testing does not replace a physical Safari test.

The service-worker shell cache moves from v62 to v63 so existing installations receive the matching styles and module. No new runtime dependency or asset is introduced.
