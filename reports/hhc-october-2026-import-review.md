# HH&C import correction — 2026-10-29

Starting HEAD: af49ac7. No new protected music assets or lyrics are included.

## #1017: documented technical exclusion

`reports/library-import-audit.json`, `reports/library-import-summary.md`, and original import commit `57b0f8e` identify This Is the Christ as deliberately excluded because the old single-key importer rejected key declarations -3 and 0 (major). It was neither missing from the archive nor rejected as corrupt. The September 16 download manifest records HTTP 200, successful ZIP/container/XML checks, 12,140 bytes, two parts, and 25 measures per part. SHA-256: `5710ad8f211ff8c4c16939d0bec6733c138211e8bd4d875a7abc2874c7ca1340`.

Official source: https://www.churchofjesuschrist.org/media/music/songs/this-is-the-christ?lang=eng

Later commit `424010c` added aligned internal-key-change support. The archive importer still has its original single-key guard; rerunning it would rewrite the complete generated catalog and is not an appropriate incremental/private test.

## Original method and rights evidence

The original HH&C import copied official Church MXL downloads byte-for-byte from the local September 16 archive. No OCR, PDF conversion, or replacement arrangement was used. `scripts/import-library.py` verifies SHA-256, ZIP integrity, container root, XML and key metadata; the import audit records notes, harmonies, lyric and direction counts. Historical browser checks covered rendering, +/-1 transposition, reset, search and offline use. Archive fidelity notes identify Finale encoding in representative official source files; MusicSlate did not create those encodings.

The inspected repository reports and archive manifests document provenance and technical availability, not a copyright-holder grant for MusicSlate public redistribution. The historical project-owner publishing instruction is not such a grant. No applicable grant was located for #1017 or the eight October additions. Older authorship for #1073/#1211 does not by itself settle rights in these exact editions. None is newly approved for public score inclusion by this review. The eight verified official links remain available without bundled scores/lyrics.

## Existing private workflow

Use Files > Add music with a lawfully obtained PDF, MXL, MusicXML or XML file. Existing validation previews the score and determines capabilities. Files are stored locally in IndexedDB under separate local IDs; importing does not replace the public linked entry, publish an asset, or create structured Lyrics. PDF imports do not provide MusicXML transposition/playback. Keep original files separately.

The focused test supports `HHC_PRIVATE_MXL` pointing to a locally supplied MXL. Run `node tests/hhc-october-2026.mjs` from the checkout with Playwright installed at the established runtime path. It uses disposable browser contexts and sends no source files to a remote service. No private score fixture is committed.

#1017 results: both Chromium and WebKit render the existing private MXL, recognize transposition and playback eligibility, preserve two parts/50 measure elements, and pass every-pitch +/-1 checks. Chromium storage/reload preserves exact bytes. Windows WebKit reports `UnknownError: Error preparing Blob/File data to be stored in object store`; WebKit persistence is not verified. The test reports that limitation explicitly, without weakening other assertions. Actual sound quality, engraving fidelity, and physical Safari storage require manual review. Playback follows written measure order; repeats/endings are not expanded.

## Public separation and next steps

Browse/search results place the eight official links after catalog scores under `Official Church links — no bundled scores`. Personal List ordering is untouched; entries retain their individual official-source labels and explanatory dialog. Existing source filters, favorites and score navigation remain intact.

Obtain a grant covering the exact editions and intended distribution before bundling any of these nine scores. Supply the eight new official MXL files privately to exercise the existing importer; they have not been converted or fabricated. #1017 is technically suitable for further private review, but that is not publication clearance. A future authorized catalog import must use incremental identity-preserving additions and validate complete rendering, transposition/export and offline indexes.
