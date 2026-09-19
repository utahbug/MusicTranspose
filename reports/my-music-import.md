# My Music local imports

Starting commit: f63ef47. This feature layers private runtime records over the unchanged published catalog.

## Use
Choose Source > My Music, then Add music. Choose a PDF, MXL, MusicXML, or MusicXML XML file, inspect the preview/status, adjust title and optional page, then Add to Library. A pencil action on local rows opens metadata editing, existing-list membership checkboxes, and confirmed deletion. Lists themselves still use the existing management dialog. No new Lists page is introduced.

## Storage and identity
IndexedDB `music-transpose-my-music-v1`, schema version 1, contains:
- `songs`: key `metadata.id`, original `file` Blob, and derived uncompressed `xml` for structured scores. A unique SHA-256 hash index rejects exact duplicates atomically.
- `metadata`: key `id`; lightweight metadata for Library startup. Both stores are changed in the same transaction, including synchronous-error aborts and quota failures.

IDs are `local-` plus crypto.randomUUID(), independent of filename/title/page/import order. Metadata includes title, collection My Music, page, originalFilename, fileType, importDate, hash, scoreType, tonic/mode/fifths when supported, capability, warnings, playbackAvailable, and transpositionAvailable. The ID is also the storage reference. Original bytes are never rewritten. Editing cannot alter key/pitch/source XML. Key-label correction is deliberately not exposed because the label must agree with the current transposition engine.

`catalog.js` joins local metadata with the public catalog only in memory. Published IDs/assets/catalog files remain unchanged. Search additionally indexes original filenames. Source My Music matches local records only; Other excludes them. All Sources includes both. Assets/XML are loaded only on selection, not at Library startup.

## Validation and capability
Files must be nonempty and at most 30 MB. MXL validation checks central-directory structure, supported compression, encryption, member sizes/paths/duplicates, a 64 MB expanded limit, up to 512 entries, CRC-32 for every member, META-INF/container.xml, and its MusicXML rootfile reference. ZIP64 and multi-volume archives are unsupported.

XML must parse, have a score-partwise root, and contain usable parts/measures/notes. Entity declarations and external image/link references are rejected; no remote score resources are fetched. Initial safety limits: 2,000 measures and 20,000 notes. Plain XML currently requires UTF-8. Timewise scores need conversion to partwise first.

All structured imports must successfully load/render with the bundled OSMD before Add is enabled. PDF.js validates and renders a first-page preview. Password-protected/damaged PDFs are rejected. Later PDF pages use the established viewer; unusually damaged later pages may still fail there.

Transposable: the existing engine recognizes a consistent explicit major/minor signature, each part has an initial signature, conventional integral pitches and standard noteheads, and sample shifts pass the existing pipeline. Multiple parts/staves/voices are allowed. View only: rendering succeeds but key is absent/modulating/nonstandard, a part transposes, or percussion/tab/scordatura/microtones/special noteheads make transposition uncertain. Key/reset/octave controls are hidden/disabled; sizing, printing and navigation still work. Playback is enabled only when the existing timeline accepts pitched content and no transposing/percussion parts are present.

Needs review/unsupported: malformed, unrelated, external-dependent or unrenderable files are rejected with a concise message; no Library entry or stored record is added. Unusual directions/lyrics are flagged for preview review. Repeats/endings remain linear in playback; no new playback interpretation is claimed. Import does not generate a separate Lyrics dataset.

## Privacy, offline and updates
No import uploads, analytics, external instrument assets or remote validation are added. PDF object URLs use local Blobs; CSP permits blob connections for the bundled PDF viewer. Service-worker HTTP handling ignores blob URLs. Only new application modules enter the static cache, never user files. App-shell cache replacement does not touch IndexedDB. Persistent browser storage is requested after successful import where supported; denial is harmless. Browser-data clearing, private browsing, eviction, or changing browser/origin can still remove/hide local music. Users should retain original files.

Read-only reference inspection: MusicDocs-worktree/script-v138.js uses IndexedDB local-file transactions and exportable blobs. This implementation adopts those concepts, not its title/time-derived identities or project code wholesale. That project was not modified.

## Favorites, Lists, deletion
Existing small Library state remains in `music-transpose-library-v1`. Favorites and group song arrays contain the UUID IDs; ordering is preserved. Imported metadata editing exposes checkboxes for existing groups without redesigning list management. Recent history uses the same IDs. Confirmed deletion removes file, derived XML and metadata atomically, revokes object URLs, then prunes Favorites, group arrays and recent history. Published songs have no local-edit/delete action. There is no new list migration.

## Backup readiness (not implemented)
There is no backup/export/restore UI in this pass. The next step is a versioned user-initiated ZIP with `manifest.json` (schema version, metadata, immutable IDs and SHA-256), `files/<id>.<type>` (original bytes), and `library.json` (Favorites, groups with IDs/order, recent references). Export from IndexedDB plus the small existing Library state. Restore should validate manifest/schema/size/hash and re-run score validation, preserve UUIDs, detect conflicts by ID and hash without silently overwriting different files, then import both IDB stores transactionally before merging references. This explicitly needs restore/conflict/quota tests before being offered. Derived XML can be regenerated from preserved originals.

## Verification
`tests/my-music.mjs` generates synthetic XML/MXL/PDF entirely in memory. Checks valid imports, original XML bytes, key detection, key/reset/score size/playback, view-only handling, unrelated/malformed XML/broken MXL/unsupported extension, exact duplicates, title editing, list membership, Favorites, stable IDs, confirmed deletion, offline PDF/MXL/XML opening, offline transposition/print/page mode, app-shell cache removal/reinstallation, and quota failures with no partial record. Screenshots cover phone/iPad portrait/iPad landscape/desktop dialogs and preview. Existing Library, score-session, header/navigation, PDF, playback-stop and ensemble tests cover built-in regressions.

Physical iPhone/iPad Safari testing remains necessary for the Files picker, storage persistence/eviction policies, memory limits on large scores, and audio permission behavior. Desktop browser viewport emulation is not hardware Safari verification.
