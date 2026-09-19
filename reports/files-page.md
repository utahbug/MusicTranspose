# Files page

Starting commit: 4711393. Files is a dedicated section, not a Source filter or a primary modal. The Library controls are A–Z/123, Lists, Favorites, Files, in that order. Source filtering remains unchanged.

## Architecture and workflow
`files-view.js` presents local runtime-catalog metadata only, sorted alphabetically by display title, with original filename as a tie-breaker. It never loads file blobs to build rows. The header shows Files, count, and Library; empty state says No files added yet. Each row shows display title, format/capability/key or PDF page count, original filename, and an accessible pencil management action. Clicking the title opens the existing score viewer; leaving the score returns to Library.

+ Add files opens the existing validation/preview dialog. The dedicated page remains the main management interface. The picker supports one PDF, MXL, MusicXML or XML file per import. A valid preview is required before Add to Library. Manage file allows display-title/page changes and viewing capability/warnings; deleting requires confirmation. The Files management dialog deliberately omits list-membership checkboxes. Existing Library editing remains compatible.

## Storage and identity
No database migration: IndexedDB `music-transpose-my-music-v1`, version 1. Store `songs` is keyed by `metadata.id`, containing `{metadata, file: Blob, xml?: string}`. Its unique `hash` index points to `metadata.hash`. Store `metadata` is keyed by `id` and contains the same metadata without blobs, updated atomically with `songs`. IDs are `local-` plus a random UUID; title, filename and page edits never change IDs. Exact original bytes remain in the Blob, with SHA-256 duplicate detection. Parsed/extracted MusicXML is stored alongside the original.

Metadata includes ID, title, collection My Music, optional page, originalFilename, fileType, importDate, hash, local flag, tags/aliases/memberships, scoreType, capability, warnings, transpositionAvailable/playbackAvailable, key/mode/fifths when known, and PDF pages when known. Public static catalog assets remain separate. No file upload, analytics, CDN, soundfont or external service is added.

## Validation
Existing validation is reused unchanged: 30 MB input limit, bounded MXL expansion, ZIP integrity checks, valid MusicXML container/partwise structure, no external content/entity declarations, rendered preview, and conservative transposition checks. PDF preview validates readability. Exact duplicate bytes are rejected. MusicXML may be Transposable or View only; warning-bearing records show Needs review as an additional status. Unrenderable scores are rejected, not silently published as usable. PDF remains non-transposable.

## Library, Lists and deletion
Imported records join All Sources and Source > My Music through the existing runtime catalog. Favorites, Lists/manual order and Recent reference the same stable IDs. Files does not manage Lists. Confirmed deletion removes both IndexedDB records, revokes any local asset URL, refreshes the catalog, and uses existing cleanup to remove Favorite, list-membership and Recent references. Built-in songs are never listed or deletable here. Rename preserves memberships and file bytes.

## Offline and updates
The new module is included in service-worker shell cache v65. Private blobs stay in IndexedDB, outside the app-shell cache. PDF, MXL and uncompressed MusicXML opened offline in browser tests after reload and app-cache replacement. No large blobs are stored in localStorage. Browser storage permission/quota/eviction remain platform limits; clearing browser/site data removes local files. Persistence requests are best-effort. Keep original files.

## Backup readiness and limitations
Backup/restore is not implemented or claimed. A future versioned package needs `manifest.json` with metadata, immutable IDs and SHA-256; `files/<id>.<type>` with original Blob bytes; and `library.json` from `music-transpose-library-v1` containing Favorites, groups/IDs/ordered song arrays and Recent. Derived XML can be regenerated. Restore must validate schema, size/hash and score structure, resolve ID/hash conflicts explicitly, atomically rebuild both IndexedDB stores, then merge reference arrays. It requires dedicated conflict/quota/round-trip tests. See also my-music-import.md.

## Verification
Tests use synthetic imports in isolated browser storage, not personal files. Expanded `tests/my-music.mjs` covers Files placement, keyboard entry, empty state, all four extensions, invalid XML, duplicate rejection, preview, view-only classification, title edit with stable ID/membership preservation, confirmed/cancelled deletion, Favorite/List/Recent cleanup, offline Files-to-PDF opening, offline MXL/MusicXML, reload/cache-update persistence, storage quota failure, print exclusion, and responsive Files/dialog layouts. `tests/library-simplified.mjs` covers A–Z/123, Lists, Favorites, Sources and unchanged 121 built-ins. Lists regression remains passing.

Phone 390x844, iPad portrait 820x1180, landscape 1180x820 and desktop 1440x1000: Files remains right of Favorites, no overflow, compact rows, 44px management targets. Library also checked at 320px. Native dialog semantics, labeled picker, validation live status, keyboard focus, and confirmation remain in place. These are browser viewport/touch emulations, not a physical Safari test.
