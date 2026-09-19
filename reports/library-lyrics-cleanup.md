# Lyrics availability and Library/Settings cleanup

Starting commit: 4f58816.

## Source audit
All 119 bundled structured scores contain lyric elements. The two PDF-only scores are excluded. The source-only extractor now publishes 106 Lyrics entries (previously 104). Added: cs-2 (I Am a Child of God), cs-220 (The Handcart Song). Removed: none. No bundled score bytes or public song metadata were changed; no external lyric source was used.

Both restored scores explicitly name a part Descant. Its MusicXML lyric row number is not a main verse number. Previously, the extractor combined descant text with the primary vocal stream. For cs-2, descant row 4 conflicted with the actual numbered fourth verse in credit-words, causing availability to be suppressed. The general fix separates explicitly named descants into `alternateLyrics`, retains their original extracted text/provenance, and records the decision in `extractionDecisions`. The main Lyrics view uses four source-derived verses plus the refrain for cs-2, and two main verses for cs-220. Descants remain in the original score and derived alternate data. Other part names are not guessed to be descants. Verse/refrain text for all other songs is unchanged.

No indexed entry has empty extracted blocks. This is a structural/source audit, not independent proofreading or a claim of perfect performance order. Twenty-six available entries already carry shared-ending cautions. Thirteen are still withheld because independent voices, echoes, rounds or refrain/verse structure cannot safely be flattened by the current reader:
hhc-1003, hhc-1020, hhc-1022, hhc-1033, hhc-1037, hhc-1045, hhc-1050, hhc-1202, hhc-1206, hhc-1208, cs-12, cs-78, cs-266.

Five currently indexed entries retain source-encoded next-verse/repeat pickup cues within their text: hhc-1024, hhc-1039, hhc-1065, hhc-1067, cs-168. They are flagged in `reports/lyrics-availability-audit.json` for reading-order review; their wording and availability remain unchanged. No missing words were invented or pickup fragments silently removed. Detailed per-score source counts, availability, notes and decisions are included in that audit. The existing generated `lyrics-extraction-audit.json` is also refreshed.

## Library and Settings
Score and Lyrics occupy two fixed 44px action columns. An aria-hidden, nonfocusable blank slot replaces unavailable Lyrics, without a fake disabled action. Local-edit actions use a second row in those same columns, keeping Score aligned without a third permanent column.

In 123 mode only, a useful numeric value (`songNumber`, otherwise `page`) prefixes the display title with a middle dot and is omitted from the secondary line. A–Z restores title-first display and page metadata. Digits with a letter suffix, including 40b and 275a, retain that suffix and the existing numeric/suffix sort. Unnumbered or nonnumeric values receive no fake prefix and sort after numbered entries. Stored titles, stable IDs and search semantics are unchanged.

The navigation choices use a shared 28px radio column plus 10px gap. Tap zones uses the same 38px inset. Browser Range measurements confirm the two initial T characters align exactly at all tested widths. No navigation event handling changed.

## Verification
`tests/library-lyrics-cleanup.mjs` checks cs-2's four verses/refrain and separate descant; cs-220 availability; direct Lyrics/Score switching with uninterrupted playback; identical Score-icon X coordinates across the Library; blank PDF Lyrics slots; numeric/A–Z titles; suffixes; and exact Tap zones alignment at 390/820/1180/1440px. Existing lyrics tests cover other songs, unavailable Lyrics, themes, transposition, print exclusion and offline behavior. Library, Lists, My Music and score-session regressions are run separately. Browser viewport emulation is not physical Safari testing.
