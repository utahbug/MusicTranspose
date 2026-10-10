# 1985 Hymnal: unchorded selection inventory

Snapshot: 2026-10-09, source commit `2e85b4f7c426527ae25dc923bcb66158f7dce228`, branch `codex/pages`.

[Excel workbook](1985-unchorded-hymns.xlsx) · [Excel-compatible UTF-8 CSV](1985-unchorded-hymns.csv)

## Verified coverage

| Classification | Count |
|---|---:|
| Unique hymn numbers, 1–341 | 341 |
| Valid generated overlays | 160 |
| Native MusicXML harmony (#70) | 1 |
| Chorded total | 161 |
| Unchorded inventory rows | 180 |
| Usable MusicXML, entire hymnal | 335 |
| Usable MusicXML, unchorded inventory | 174 |
| Restricted official scores / no usable MusicXML | 6 |

Hymn #280 has a valid generated overlay and is excluded from the unchorded inventory. The six restricted entries are #12, #54, #86, #124, #219 and #299. They remain in both the Library and this inventory, with explicit notes that source notation is unavailable and they are not currently eligible for generation. “Restricted” describes the archived official score availability, not a new legal determination.

## How to use

Every selection starts **Undecided**, with blank user notes. In Excel, use the table filters to sort by numeric hymn number, title, category or availability. Change Selection status to **Undecided**, **Add chords**, **Skip**, or **Review later**. Sort the whole table to keep notes with their hymn. Amber columns are editable selection fields. CSV preserves the same twelve columns and all 180 rows; it does not retain Excel dropdowns or formatting. No songs have been selected and no popularity ranking is supplied.

## Evidence and limitations

- The runtime catalog (`songs.js`, `imported-songs.js`, `unavailable-songs.js`) supplies exact current titles, stable identities and collection memberships. Membership duplicates are consolidated only when they refer to the same stable identity and hymn number. Distinct arrangements are never merged.
- Every available MXL was opened through its container rootfile and parsed. All 335 contain pitched notes and score measures. All corresponding repository PDF fallback assets exist. “Available” means the archived official score is available in this repository, not that its external website was rechecked today.
- All 160 records in `generated-harmony-data.js` match the SHA-256 fingerprint of their unpacked MusicXML, contain events, have valid measure indices and have no source harmony override. Native MusicXML harmony occurs only in #70. The existing `parseChordSymbol` parser found no source direction-text chords. No inference or chord generation was run.
- Original key uses the catalog tonic/mode, cross-checked against the opening MusicXML key signature and mode (including any documented catalog mode override). All 174 available inventory entries have a key. The six restricted entries have blank keys. #280's modulation is outside this inventory because it is already chorded.
- No reliable original hymnal section index was found in the catalog or existing hymnal reports. Category cells are intentionally blank for all rows; tags and voice-arrangement labels were not substituted for original sections. Blank means unavailable metadata, not “uncategorized” in the printed hymnal.
- Restriction evidence: `reports/licensing-notices-1985.json` and the current unavailable catalog records. No substitute arrangements or rights assumptions were introduced.
- This checks source presence and current chord coverage, not whether all 174 remaining scores are musically suitable for automatic generation. That requires a later, user-selected review. No coverage classification ambiguities were found.

## Verified related arrangements

Archived source filenames in `reports/hymnal-1985-inventory.json` identify the separate voice arrangements. Each pair also has matching current titles and identical sets of normalized MusicXML lyric tokens. This establishes related text/arrangement identity; it does not assert identical notation or interchangeability.

| Congregational entry | Separate arrangement | Title | Currently unchorded member(s) |
|---|---|---|---|
| #13 | #328, Men's Choir | An Angel from on High | None |
| #87 | #313, Women | God Is Love | #313 |
| #108 | #316, Women | The Lord Is My Shepherd | #316 |
| #147 | #317, Women | Sweet Is the Work | None |
| #59 | #332, Men's Choir | Come, O Thou King of Kings | #332 |
| #5 | #333, Men's Choir | High on the Mountain Top | #333 |

The four unchorded arrangements have explicit cross-references in the selection files, including references to already-chorded counterparts. These six requested examples were verified; blank relationship cells do not prove that no other musical relationship exists.

## Validation

Verified 341 distinct consecutive numbers and stable identities; 160 generated + 1 native + 180 unchorded = 341. All six restricted entries are present; #70 and #280 are correctly excluded. Inventory titles match the runtime catalog exactly. All selections are Undecided and all user notes are blank. CSV uses UTF-8 with BOM for Excel. XLSX uses numeric hymn numbers, a filterable table and a four-option status dropdown. Exported workbook values are checked against every CSV cell, including related-arrangement notes and restrictions. Workbook preview is visually reviewed.

This commit contains reporting files only. No catalog, source score, overlay, extraction/inference pipeline, application interface, user data or offline storage is modified. No chords were generated. Snapshot files do not automatically refresh after future coverage changes.
