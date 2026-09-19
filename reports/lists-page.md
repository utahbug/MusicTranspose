# Dedicated Lists view

Starting commit: d48591c. The old My Lists and song-actions dialogs and their JavaScript are removed. Lists is now a full app section, not a management popup.

## Architecture and data
`lists-view.js` owns overview, opened-list and Add songs presentation. `library.js` retains the existing Library state and supplies shared get/save/open callbacks. There is no second list store or catalog. Data stays in `music-transpose-library-v1`: groups contain existing IDs, names and ordered song-ID arrays. Existing groups keep their creation/array order. Existing orderingVersion migration logic is retained, not replaced; current version-1 data is not migrated or resorted. Unknown song IDs are retained as unavailable rows rather than silently dropped.

## Working with lists
Library > Lists opens the overview. Each row gives name and count. New List opens a compact naming dialog, then the new empty list. An opened list displays saved manual order with Add songs and secondary Manage (Rename/Delete) controls. Empty states explain the next action. List deletion requires native confirmation and deletes only that group. Rename preserves its ID and membership.

Add songs is another view within Lists, not a stack of dialogs. It supports search, factual Source filtering (including My Music), Favorites, and multi-select. Pending selection survives filter/search changes. Already-present songs are checked and disabled. Done appends newly selected IDs in selection order, without duplicates. Back cancels the pending additions. Nothing touches Favorite state or imported file bytes.

Each list row opens its score and offers Lyrics where the existing dataset supports them. Remove affects this list only. A song opened from Lists changes the existing score exit control's accessible label/title to Back to list; Lyrics likewise labels its return action Back to list. Returning restores the same list and scroll position. A separate Library control returns to the regular Library while retaining its query/source/sort state. No large previous-song resume button is added.

## Reordering and accessibility
The existing pointer-capture drag helper supports mouse/pen/touch, insertion feedback, edge auto-scroll and cancellation. Direct 44px Move up/Move down buttons are always available; drag is not required. Focus follows the moved row. Reordering edits the full saved array, including unavailable IDs, without losing hidden items. This pass deliberately omits within-list search, avoiding competing manual-order/filter semantics.

Semantic sections/headings, buttons, native checkboxes/selects, labeled inputs, keyboard focus and status announcements cover creation/addition/removal/reordering. Native confirm protects deletion; naming supports Enter and Escape through a native dialog. Storage denial is reported as temporary in-memory changes rather than falsely claiming persistence. Favorites remains its separate Library quick filter, not an editable normal list.

## My Music and offline
The picker reads the combined runtime catalog, not only public bundled songs. Imported UUID IDs work unchanged in group membership and ordering. Removing membership or deleting a list never deletes an IndexedDB import. Existing import deletion still prunes references. No network service is added; the new module is included in the app shell cache. App updates do not change the localStorage key or wipe data.

## Verification
`tests/lists-page.mjs` seeds an existing list with an unknown ID and checks exact preservation, overview/opening, creation/rename/confirmed deletion, multi-selection across filters, list-only removal, accessible move buttons, touch drag, score and Lyrics return context, persisted order, offline reload/PDF opening and desktop/iPad landscape/iPad portrait/phone layout.

`tests/my-music.mjs` additionally adds an actual locally imported MXL through the new picker, preserves its stable ID, and checks list/Favorite survival through app-shell replacement and offline use. `tests/library-simplified.mjs` uses the new navigation and preserves Library search, A–Z/123, Source, Favorites and offline behavior. Existing song-session and header-Library tests cover transposition/reset/octave, playback stop, PDF opening, toolbar dimensions and print exclusion.

Phone rows place secondary actions below the title to keep 44px targets. Tablet/desktop rows keep actions alongside the title. Preview checks: 390, 820, 1180 and 1440px widths; no horizontal overflow. Physical iPad/Safari drag behavior is still a hardware follow-up; automated touch/viewport emulation is not a device test.

No cloud sharing, sync, folders, templates, or new backup format is introduced. List state remains compatible with the documented future My Music backup plan.
