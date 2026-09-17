# GitHub Pages readiness

## Result

**Self-contained and technically ready for a new standalone repository and static hosting.** Nothing was committed, pushed, published or enabled. No existing repository was accessed or modified.

Only the two current scores are bundled: `assets/nativity.mxl` and `assets/shepherd.mxl`. Both remain byte-identical copies with recorded SHA-256 provenance. No additional archive copying was needed. The application has no D:, original-archive, absolute Windows path, Church/CDN, API-key or authentication dependency.

MXL decompression, rendering and major/minor transposition run in the browser. OSMD and fflate are local, with their licenses. All runtime URLs are relative. Static HTTP/HTTPS hosting is sufficient; no server-side application or build server is required. `.nojekyll` is included for ordinary static serving. `serve.py` is an optional local development tool, not a Pages requirement. Direct file:// opening is unsupported due to browser module/fetch restrictions.

## Exact proposed commit set

- `.gitignore`, `.nojekyll`
- `index.html`, `styles.css`, `app.js`, `pdf-score.js`, `library.js`, `navigation.js`, `score-layout.js`, `music.js`, `songs.js`, `imported-songs.js`, `sw.js`
- `assets/nativity.mxl`, `assets/shepherd.mxl`
- `vendor/fflate.min.js`, `vendor/fflate-LICENSE.txt`
- `vendor/opensheetmusicdisplay.min.js`, `vendor/opensheetmusicdisplay-LICENSE.txt`, `vendor/osmd-package-metadata.json`
- `README.md`, `prototype-findings.md`, `github-pages-readiness.md`, `provenance.json`
- Development helpers: `serve.py`, `Start-Prototype.ps1`
- `tests/acceptance.mjs`, `tests/minor-navigation.mjs`, `tests/compact-baseline.mjs`, `tests/compact-verification.mjs`, `tests/smoke.mjs`, `tests/portability.mjs`

Only the application files, assets and library bundles are needed by the browser. Preserve score credits and library licenses. Exclude `test-results/`, `node_modules/`, `__pycache__/`, `*.pyc`, `.DS_Store`, and `Thumbs.db` as specified in `.gitignore`. Exclude the temporary test copy and all source archives. No Git repository has been initialized.

## Path audit and classification

The occurrence-by-occurrence local audit is `test-results/path-audit.json`.

| Location | Classification and action |
| --- | --- |
| Application HTML/CSS/JS and registry | No D:, user-directory or loopback runtime dependency; relative URLs only. |
| `provenance.json` | D: source names are audit metadata, never fetched by the app; preserved. |
| `Start-Prototype.ps1` | Removed hard-coded Python location. Uses PYTHON override or python on PATH. Loopback URL is a development launch example. |
| `serve.py` | Configurable loopback development server; unnecessary on Pages. |
| `tests/*.mjs` | Removed hard-coded user-directory Playwright paths. Loopback references are test fixtures, not deployed app dependencies. |
| `vendor/osmd-package-metadata.json` | Localhost occurs in upstream package development-script metadata; nothing executes it in this app. |
| Documentation | Local launch examples and explanations only. README test commands now use node on PATH. |
| Generated test evidence | Local addresses and temporary paths; excluded from commit. |

Development tests need Node, Playwright and a browser (installed Edge by default). Resolve Playwright through normal Node module lookup or set PLAYWRIGHT_PACKAGE to an existing Playwright package.json. The portable test also accepts BROWSER_CHANNEL. The hosted application does not need these tools. Python is only for the optional local launcher/server.

## Copied-directory verification

`tests/portability.mjs` copied only static runtime files into a new OS temporary directory outside the project, checked copied hashes, and served exclusively that copy at `/music-transpose-prototype/` on an ephemeral port. Its server is confined to the copy; there is no fallback to the original project or archives. Requests outside the copied app URL were blocked and recorded.

Passed in Edge:

- Both bundled songs load and render.
- G major → A major and D minor → E minor have correct pitches/signatures.
- Key/song dialogs and exact-original reset work.
- Landscape 1180×820 and portrait 820×1180 have no overflow and retain 44-pixel control targets.
- Service-worker scope matches the repository subdirectory.
- Offline reload, switching both songs and E-flat-minor transposition work.
- No missing assets, external/Church requests or browser errors.

Evidence: `test-results/portability.json` and `portable-*.png`. The temporary copy remains for inspection; its path is in the JSON. The temporary server was stopped. Run `node tests/portability.mjs` from the project with development test dependencies available. Existing musical acceptance suites passed immediately before this portability preparation; musical/runtime code was not changed here.

Compact print comparisons require locally generated baseline files from `tests/compact-baseline.mjs`; generated evidence is intentionally not committed.

## Likely eventual Pages URL

For a hypothetical repository named music-transpose-prototype:

`https://<account>.github.io/music-transpose-prototype/`

A score would resolve to `https://<account>.github.io/music-transpose-prototype/assets/shepherd.mxl`. The repository name is illustrative, not created or reserved. Relative assets and service-worker scope passed the subdirectory test. Actual GitHub Pages hosting has not been configured or tested.

## Offline and iPad/Safari

The existing service worker precaches both scores and runtime files. No major PWA features were added. A first successful visit/cache installation is required; HTTPS on Pages supplies the secure context. Browser eviction, private mode and Safari background/resume behavior can affect offline availability.

Before a broader trial, test real iPad Safari touch navigation in both orientations, offline relaunch, background/resume and AirPrint. Desktop emulation is not a substitute. Stronger later offline use could add a cache-ready/install flow, manifest/icons, storage-persistence handling and a tested version/update/old-cache cleanup policy. These remain future work. No publishing or feature expansion occurred.

## Authorized publication preparation
The subsequent publishing request authorizes a new public utahbug/MusicTransposePrototype repository and GitHub Pages. Add manifest.webmanifest, robots.txt and assets/icons/ (SVG favicon plus 32, 180, 192 and 512 pixel PNGs) to the commit set above. Apple home-screen metadata and noindex,nofollow are present. Source provenance now retains source filenames and hashes without machine-specific drive prefixes. The earlier no-publication statements describe the prior preparation phase. Physical iPad testing remains outstanding.



## Four-song Christmas update

The live registry now includes The Nativity Song (Children’s Songbook 52, G major), The Shepherd’s Carol (40b, D minor), Oh, Come, All Ye Faithful (Hymns 1985, 202, G major), and Silent Night (204, B-flat major). The official embedded title of hymn 202 includes “Oh,”. Bundled additions: `assets/faithful.mxl` and `assets/silent-night.mxl`; source archive bytes were read only and hashes are in provenance.json. Both use the unchanged shared transposition pipeline. The service-worker asset cache includes all four.

`tests/four-songs.mjs` covers both new hymns at all thirteen signed positions, quick arrows, rapid input, exact XML/SVG reset, song switching, offline loading of all four, and 1180×820 / 820×1180 layouts. All 237 pitches in Faithful and 179 in Silent Night transpose exactly; key signatures and conventional destination names are checked. Neither MXL contains harmony/chord-symbol events, so no chord labels are invented. All XML outside the permitted pitch/signature/accidental/harmony fields remains unchanged, including lyrics, rhythm, voices/staves, ties/slurs, directions and other notation.

Visual inspection found an existing engraving limitation exposed by these sources: the metronome number and expression word (“Majestically” / “Peacefully”) overlap at the top. Notes, lyrics and arrangements remain intact. No song-specific rendering/transposition workaround was added. Confirm practical readability, especially these initial directions, during physical iPad/piano testing. Desktop rapid-transposition checks passed; this is not a claim of musician or physical-iPad validation.

Run `node tests/four-songs.mjs` against the local server, or set TEST_URL to the live Pages URL (with trailing slash). Test evidence remains excluded under test-results/. Earlier two-song descriptions record prior phases.


## Permanent name

The existing repository is now named MusicTranspose, preserving its history and codex/pages branch. Repository: https://github.com/utahbug/MusicTranspose. Permanent site: https://utahbug.github.io/MusicTranspose/. Use this URL for bookmarks and new home-screen installations. Manifest start_url and scope remain relative; short_name remains Transpose. Earlier prototype-named references in historical notes describe the prior publishing phase.
