# Primary PDF addition and Scripture Power investigation

Verified MusicTranspose root: C:/Users/kenro/Documents/Codex/MusicTransposePrototype; remote https://github.com/utahbug/MusicTranspose.git; initial worktree clean. Primary source root C:/Users/kenro/Documents/MUSIC APP is verified by its https://github.com/utahbug/PrimarySongs.git remote and library.json file references. It was read only. No source archive/app bytes were changed.

Exact source/destination names, sizes and SHA-256 values are in primary-pdf-provenance.json. Scripture Power is 114,903 bytes / 2 pages; Choose to Serve the Lord is 105,599 bytes / 5 pages. Copied PDFs match their originals byte-for-byte. The Primary Scripture Power PDF carries a 2004 copyright notice; the investigated official page is indexed as the 1987 version. We preserved the exact Primary-app PDF requested, without substituting the official-page PDF or changing notices.

Investigation on 2026-09-16: the official Scripture Power page's window.renderData songData.assets exposes PDF and MOBILE_PDF only. Both have empty pianoMarvelUrl/fileName fields. No MXL, MusicXML, MIDI or notation JSON resource is exposed. The reference Nativity page exposes MIDI and MXL, with a pianoMarvelUrl pointing at notation JSON beside the MXL. Full source metadata snapshots are stored alongside this report.

Relevant Scripture Power URLs:
- https://www.churchofjesuschrist.org/media/music/songs/scripture-power-1987?lang=eng
- https://assets.churchofjesuschrist.org/70/fb/70fb1e007d072accc27adcef4e50dec5273dae00/scripture_power_1987_eng.pdf
- https://assets.churchofjesuschrist.org/a3/f4/a3f4f83c01f211ecb3a9eeeeac1e6802ecf66799/scripture_power_1987_eng.pdf
- https://www.churchofjesuschrist.org/media/music/proxyldscdn/a3/f4/a3f4f83c01f211ecb3a9eeeeac1e6802ecf66799/scripture_power_1987_eng.pdf (observed loaded response: 200 application/pdf)

Reference assets:
- https://assets.churchofjesuschrist.org/7d/78/7d7874cf7d8f35b639ca251a59a192c5c8718afb/the_nativity_song.mxl
- https://assets.churchofjesuschrist.org/7d/78/7d7874cf7d8f35b639ca251a59a192c5c8718afb/the_nativity_song.json
- https://assets.churchofjesuschrist.org/db/dc/dbdcb03dd18e6512b4ea74ab85a93a6eaec58e42/the_nativity_song.midi

The linked application bundle /media/music/statics/build/lambda-react/6d2be3072f/client.js reads MXL JSON through pianoMarvelUrl and interactive MIDI through its asset fileName. Runtime network inspection after hydration observed the PDF proxy request and no structured score request; unrelated feature-flag/banner JSON is not musical notation. Relevant bundle excerpts and request observations are retained. There is no evidenced structured asset hash from which a reliable URL can be derived; no fabricated filename swaps were accepted. Conclusion: no publicly exposed usable structured asset found in the inspected sources, not proof that no private/unlinked asset exists anywhere.

Final score types: both PDF, transpositionAvailable=false. Library total 121, Primary tag total 44. Existing unavailable audit records are historical reports, not duplicate catalog placeholders. Choose to Serve the Lord is labeled Primary-use music rather than inventing an official book membership or number.

PDF.js copied from the same Primary project, with original license headers and full Apache 2.0 license retained; isEvalSupported=false. Both PDF files, the viewer module and its local worker are precached. No external runtime dependency. PDF pages render into the existing score container at 1800 pixels wide, use normal document scrolling and bottom clearance, and share the existing navigation settings. Pitch/key/reset controls are hidden and disabled; a PDF/transposition-unavailable notice and original-PDF link remain. Continuous, hybrid and auto-scroll operate on document scroll; Page Turns retains its existing unavailable state. On phones, pinch zoom or Open original PDF helps read dense fixed-layout notation.

PDF print preparation makes one image-backed print page per source page; score notices/toolbars are excluded. This is raster printing at roughly 200+ dpi on letter-width output, not vector-native printing. The original-PDF link retains access to vector/native printing where the source supports it. Existing structured-score print preparation is unchanged.

Local verification passed both PDFs at phone, iPad portrait/landscape and desktop sizes, safe bottom clearance, print action/page counts, hybrid navigation, cold offline reload and structured Nativity/Home and Church transpose/reset regressions. No physical Safari device test was performed.
