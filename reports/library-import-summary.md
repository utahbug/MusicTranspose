# Library import audit

119 unique songs: 4 preserved originals and 115 new byte-identical archive copies. 81 of the 82 archived Hymns for Home and Church entries are included. This Is the Christ (1017) parses but changes key from three flats to no sharps/flats, which the unchanged single-key transposer rejects; it was excluded rather than exposed as a broken entry.

43 Primary requests: 41 matched, with Choose to Serve the Lord and Scripture Power absent from the local MXL catalog. The Primary filter has 42 songs including the previously tagged Nativity Song. Seven set overlaps are consolidated: six Home and Church/Primary matches and the existing Shepherd’s Carol. Two of these involved identical source/existing asset records. When I Am Baptized uses one asset/record, with Home and Church 1054 plus Children’s Songbook 103 membership.

Canonical corrections: I Belong to the Church of Jesus Christ maps to The Church of Jesus Christ (77); Wise Man and the Foolish Man maps to The Wise Man and the Foolish Man (281); “Give,” Said the Little Stream retains canonical punctuation (236). Canonical a/b pages are preserved, including 275a and 267a. Search aliases retain the requested labels.

Four archive mode declarations say major despite source harmony establishing minor: Gethsemane (D minor, Picardy ending), My Song in the Night (G minor), What Child Is This? (E minor), Follow the Prophet (C minor). Existing metadata overrides carry the evidence; source bytes and transposition code remain untouched. Shepherd’s existing D-minor override remains.

All 119 entries passed parse/key checks, renderer load, correct title/key display, +1/-1 pitch verification and exact reset. No included score failed. The excluded modulating score is distinct from a corrupt-file failure. Source/copy SHA-256 checks passed. Full results are in library-render-validation.json; provenance and requested-title matches are in library-import-audit.json.

Visual spot checks: Come, Thou Fount of Every Blessing; What Child Is This?; A Child’s Prayer; Follow the Prophet. These cover Home and Church/Songbook, major/minor, chords, multiple verses, multi-staff notation and tempo/expression text. Checks confirm rendering, not a complete engraving audit of every imported page. Existing engine spacing can be tight around dense lyrics. Physical Safari/iPad testing remains outstanding.

Library tests cover all requested search/filter/sort categories and scrolling at 375x812, 820x1180, 1180x820 and 1440x1000. Library startup reads metadata only; no score is parsed or rendered before selection. Selected XML is cached in memory to avoid repeat downloads/unpacking. The service worker still precaches bundled bytes in the background for complete offline availability after cache installation; this is not eager score parsing/rendering. All 119 assets were verified cached and offline cold reload/score opening passed. No external runtime sources were introduced.
