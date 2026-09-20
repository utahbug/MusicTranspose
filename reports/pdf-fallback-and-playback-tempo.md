# Local PDF fallback and playback tempo

Starting commit: `7b591118e58a743f282ce937788f2d80638629bc` on `codex/pages`.
Verified root: `C:\Users\kenro\Documents\Codex\MusicTransposePrototype`.
Remote: `https://github.com/utahbug/MusicTranspose.git`. Starting worktree was clean.

## Size audit before copying

The read-only matching/size audit was completed and reported before any PDF copying.
All sizes below are bytes (decimal MB = bytes / 1,000,000).

| Measure | Bytes / count |
|---|---:|
| Initial working tree, excluding .git, including ignored test artifacts | 101,989,882 |
| Working tree at copy time, after adding the audit script | 101,994,700 |
| Tracked static site before | 15,831,741 |
| Bundled assets + vendor before | 8,878,594 |
| Existing bundled PDFs | 220,502 |
| Catalog songs | 681 |
| Confirmed new fallback PDFs | 679 |
| PDF bytes added | 30,622,145 |
| Largest PDF | 126,972 |
| Projected static site, PDFs plus existing files | 46,453,886 |
| Projected working tree at copy time | 132,616,845 |

Largest: **I Know That My Savior Loves Me**, HHC 1021, two pages.
The final source/site size including code, reports and tests is recorded below.
GitHub Pages documents a 1 GB published-site limit and recommends source repositories below 1 GB: <https://docs.github.com/en/pages/getting-started-with-github-pages/github-pages-limits>.
This addition is about 30.6 MB of new binary history; the resulting site is under 50 MB. No file approaches GitHub's 100 MiB file limit. Future expanded collections should repeat this audit. No Git LFS, new hosting, runtime archive dependency, or Church service dependency was added.

## Matching and local assets

Source: `D:\LDS_Music_PDFs\2026-09-16`, recovered `reports/pdf-download-manifest.csv`.
Only successfully validated **Standard** PDFs with no licensing-placeholder notice were selected; Mobile/Guitar variants were excluded.
Matches require collection, source number/page, and title agreement. Normalization handles punctuation/case; a limited list of explicit archive performance qualifiers (Women, Men, Men's Choir, Round, Appropriate for Parents and Leaders) is ignored only at the end of a title. The collection/number must still match uniquely.

- Hymns (1985): **335**.
- Children's Songbook: **263**.
- Hymns for Home and Church: **81**.
- 643 exact normalized titles; 36 confirmed archive qualifier differences, recorded individually.
- No ambiguous or missing structured-song matches.
- Scripture Power and Choose to Serve the Lord are outside this archive's collection manifest; their two existing bundled primary PDFs are retained, without duplication.

Every copied file's SHA-256 matches the archive manifest. Original recovered files were not changed.
`reports/pdf-fallback-audit.json` records every source, destination, title, collection, number, size, page count, hash and matching rule.
`assets/pdfs/fallback/<existing-stable-song-id>.pdf` contains the 679 new files.
`pdf-fallbacks.js` is a generated ID-to-asset linkage, attached as optional `song.pdfAsset` in the existing central `songs.js` model. It is not a second catalog. Primary `asset`, `scoreType`, IDs and display metadata are unchanged. Local imported songs are not assigned bundled fallbacks.

## Size menu and view state

The existing Score Size menu contains Most music / Normal / Large, plus **PDF** only where `pdfAsset` exists. No new toolbar icon or placement changes.
Selecting PDF stops audio and uses the existing `renderPdf` viewer and actual PDF page navigation. Key/octave/source XML/engraving cache stay in memory. Selecting any structured size returns to that engraving with the prior key and octave. The saved structured-size preference is not overwritten by entering PDF.
Library identity, Favorites, list membership, history route and Lyrics identity remain the same. PDF selection is temporary; a newly opened/reloaded song starts structured. Existing PDF-only songs retain their prior interface.
**Option B**: playback, key and octave controls are unavailable in PDF presentation. Lyrics access remains; when reached from PDF it also hides playback until the structured presentation is restored. No PDF notation is advertised as transposed.
PDF printing reuses `preparePdfPrint`; structured printing reuses its existing separate engraving path.
If an uncached PDF is requested offline, the app restores the structured score and gives a short message to open the PDF online once.

## Offline and performance

Service worker v84 precaches the new small metadata/settings modules. Fallback PDFs are deliberately absent from both install ASSETS and `offline-scores.json` warming. Existing primary-PDF/MXL caching is unchanged.
A fallback is served from this site's own assets on first open and runtime-cached by the existing same-origin PDF cache path. Already cached scores/PDFs migrate across shell updates. No IndexedDB, user files, Favorites, Lists or localStorage data are deleted.
Library startup fetches no fallback PDFs; metadata only. PDF bytes parse on demand in the existing viewer/document cache.
Tested online PDF -> structured -> browser offline -> full reload (clearing in-memory PDF.js documents) -> PDF -> structured -> tempo playback: pass.
Browser storage can be evicted by the browser; a never-opened fallback is not promised offline.

## Playback tempo architecture

`scoreTimeline` parsing, pitches, duration/voice/tie handling and encoded tempo maps are unchanged. `createPlayback` scales the **audio clock** by a per-song speed factor. Source-timeline positions are retained; real scheduled onset offsets and durations divide by that factor. Source XML, tempo markings, metadata, score engraving and printed output do not change.
All 679 structured songs were audited: starting quarter-note tempos **52–168 BPM**, no fallback required. Four contain encoded internal tempo changes: both catalog arrangements of An Angel from on High, The Day Dawn Is Breaking, and Samuel Tells of the Baby Jesus. The factor preserves each change's relative timing. A synthetic 60 -> 120 BPM fixture verifies actual oscillator start/stop scheduling at 2x speed.
Unencoded words such as ritardando/accelerando are still not interpreted; repeat/verse playback remains the existing linear written-order behavior. No new parser or playback engine.

Settings has a compact Playback section: Tempo, minus, BPM, plus, Original BPM, Reset tempo. Controls have 44px-class targets and descriptive accessible labels; BPM changes use a polite live output. They do not autoplay or create an AudioContext just to inspect tempo.
- Increment: **4 BPM** (clamped at bounds).
- Bounds: **0.5x–2x source tempo**, further restricted to **40–240 starting BPM**. An unusual imported source outside that band can still return to its own original tempo. Current bundled repertoire is entirely within the normal band.
- Tempo Reset resets only the speed factor; musical Reset still resets key/octave only.
- Scope: in-memory session Map keyed by stable song ID. Reopening a song in the same app session retains its tempo; other songs get their own source tempo. Reload/app restart resets all rates. No persistent or global rehearsal tempo preference.
- Live change: preserves source-time position, cancels queued voices, immediately reschedules at the new rate. A currently sounding sustained note can gently re-attack at the change; no position restart. Paused position also stays unchanged.
- Existing direct-tap AudioContext resume/iOS handling and local synthesized triangle instrument are retained. No new sound assets/network audio.

## Validation and responsive results

`reports/pdf-fallback-validation.json`: **679 PDFs / 862 pages**, all parsed and produced PDF.js operator lists. Supplementary pypdf decoded-page-stream validation also passed (some original PDFs contain recoverable unused-object xref warnings; bytes were preserved).
Representative full UI checks: Oh, Come, All Ye Faithful; The Nativity Song; Amazing Grace; A Child's Prayer (multi-part, two-page fallback for a more complex engraving).
For each: structured rendering/transposition/octave/playback, PDF switch/real pages/print preparation, return to structured, slower/faster/reset without XML changes.

| Browser viewport | Result |
|---|---|
| iPad landscape 1180x820 | Menu and tempo section fit, no overflow, no toolbar movement |
| iPad portrait 820x1180 | Comfortable Settings and unchanged score layout |
| Desktop 1440x1000 | Menu, PDF, Settings and controls pass |
| iPhone 390x844 | Compact tempo row and menu fit; 44px tempo targets |
| Narrow phone 320x740 | No horizontal overflow or clipped menu |

Screenshots were inspected for iPad landscape/portrait and phone layouts. These are Edge/Chromium browser viewport tests, not physical-device Safari tests. No Safari-specific API was introduced.

Passed regression suites: playback (679-score audit plus eight full playback songs), performance-placement (including phone landscape, 320px, long titles, page center, key/octave/reset, print and offline), browser-history, library-alphabetical, lists-page, my-music, navigation-settings, song-identity; focused pdf-fallback-tempo and playback-tempo-clock; full pdf-fallback-audit.
Legacy test assumptions were brought up to date: Compact -> Most music, reload restores score instead of Library, dedicated Lists instead of the retired Library list selector. Application navigation/Lists behavior was not changed.
The identity regression also verifies PDF references survive changed page/title/collection metadata.
Physical printer output, real-device Safari audio and exhaustive visual proofreading of all 862 PDF pages are not claimed; representative raster views and print preparation were verified.

## Deployment

Use the existing `codex/pages` GitHub Pages deployment. Live verification follows the commit and is reported with its hash in the task's final result. No other project/repository was modified.

Final bundled assets + vendor: **39,500,739 bytes**. Working tree at final audit, including ignored test evidence: **134,334,077 bytes**.
Final tracked/publication file total: **47,130,959 bytes** (about 47.13 MB).
