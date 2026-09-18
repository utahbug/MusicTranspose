# MXL virtual performance pages

Starting revision: `4198615210226fd9ab52f918f546f83b5a5a800d`.
Repository: `MusicTransposePrototype`, existing `utahbug/MusicTranspose` remote.

## Implementation

The bundled OSMD 2.1.2 graphical model supplies
`GraphicSheet.MusicPages[].MusicSystems`, system `PositionAndShape`, and
`GraphicalMeasures[].parentSourceMeasure`. Source-measure array indices are
session navigation anchors; they are not song identities or printed measure/page
numbers. No source MusicXML or engraving parameters change.

After the existing tempo/expression correction, `captureSystems` measures visible
SVG ink in the source SVG coordinate system, expands the model systems to include
notes, lyric text, chords, directions, fingerings, ties/slurs and strokes, and
adds three SVG units of edge clearance. Ink is assigned to the nearest model
system center. Adjacent systems whose ink bounds overlap become an indivisible
group. This is deliberately conservative: a crossing mark cannot be sliced just
to fit an extra system.

Greedy pagination adds the next complete system/group only if the full span fits.
Available height is viewport height minus the score-content top offset, actual
bottom toolbar height (including navigation controls and iOS safe area), and an
18px bottom allowance. Width is the real score container width. Pages are not
stretched to fill the remaining space. A single over-height system/group fits
uniformly inside the viewport rather than being cropped or split; on very short
screens this can reduce readability, so portrait or Small score size may help.

One cloned SVG per original rendered SVG is shared between precomputed page
frames. A turn moves that prepared SVG into the selected frame and changes its
viewBox to the group's complete ink bounds. It does not fetch, parse, transpose,
or re-engrave. Continuous rendering stays intact, and the independent A4 print
renderer is unchanged. Supplementary source verses/credits are retained as final
text pages rather than hidden underneath the toolbar. An unusually tall single
text block is fitted to its page.

The existing PDF controls handle both kinds of page. Left/right score-area taps
and Previous/Next buttons clamp at first/last page. PageDown/ArrowRight advance;
PageUp/ArrowLeft go back; Home/End go to the bounds. Held-key repeat is ignored,
but separate rapid presses are accepted. A tap must finish within 450ms, move no
more than 8px, and have no scroll/selection; controls, dialogs, score-size popovers,
dragging and canceled pointers are excluded. No synthetic click handler follows
the pointer event, avoiding touch/click double turns.

Resize is debounced 180ms; toolbar ResizeObserver also handles safe-area/clearance.
New engraving after width, density, key or octave change publishes fresh system
bounds. The page containing the previous page's first source measure is selected.
A new playing session resets to page one. Score/Lyrics switching retains playback
and the prepared page location. Page status exposes “Virtual page N of M” to
assistive technology, separately from unchanged collection/book page metadata.

Settings offers Continuous Scroll, Page Turns and Auto-scroll. Hybrid is no
longer selectable; an older stored Hybrid preference falls back to Continuous.
The inaccessible legacy advance helper and hidden markup remain to avoid mixing
an unrelated navigation-code removal with this change. Continuous Return to Start
and Auto-scroll retain their existing behavior. Offline cache v42 includes
`virtual-pages.js`.

## Verification

`tests/virtual-pages.mjs` exercises nine scores at 1180×820, 820×1180, 390×844 and
1440×1000: Amazing Grace, “Give,” Said the Little Stream, The Nativity Song,
The Shepherd's Carol, Oh, Come, All Ye Faithful, Silent Night, A Child's Prayer,
Follow the Prophet and Come, Thou Fount of Every Blessing.

Assertions cover all rendered systems exactly once, non-overlapping page ink
bounds, all supplementary text retained, every page above the toolbar, no
horizontal overflow, no scroll adjustment, no fetch/engraving on turns, touch
zones, drag rejection, held-key rejection, rapid separate pedal-equivalent keys,
offline turns, current-measure retention after key/size/orientation/octave changes,
Reset, session exit/reopen, PDF transitions, playback and Lyrics switching.
Print DOM/geometry compares identically across navigation modes after ignoring
renderer-generated element IDs; toolbar/virtual frames remain absent in print.

Representative page totals include final supplementary text pages:

| Song | iPad landscape 1180×820 | iPad portrait 820×1180 |
| --- | ---: | ---: |
| The Nativity Song | 5 | 3 |
| Follow the Prophet | 5 | 3 |
| A Child's Prayer | 7 | 5 |
| Oh, Come, All Ye Faithful | 4 | 3 |

Portrait Follow the Prophet fits four complete systems on its first page.
Landscape Nativity fits one full system per music page; a second does not fit at
the normal readable size. Blank remainder is intentional whole-system packing.
Rapid automated keyboard round-trip measurements were approximately 18ms per
turn on the development machine, including browser automation overhead. These
are not physical iPad latency measurements.

The existing regression suite additionally checks PDF touch/keyboard/bounds,
PDF trim/print, Library/Favorites/lists/order, stable IDs, ensemble/instrument
keys, playback, Lyrics/Fun, original/transpose/octave/density rendering, and
catalog/offline behavior. Frozen baseline tests cover seven fingerprint fixtures
and reproduce the 119-score baseline exactly; all 121 bundled source hashes are
unchanged.

Physical iPad Safari browser-chrome/safe-area transitions, touch comfort and a
real Bluetooth pedal remain device acceptance checks. Keyboard-style pedal
commands and touch events are tested in desktop Edge automation; no physical
iPad/pedal testing is claimed.

Validation run: all 27 current browser suites passed. The initial aggregate run
passed 26; virtual-pages was rerun successfully after correcting its synthetic
held-key fixture to dispatch from an Element rather than Document (the real
keyboard event target). No production fix was needed for that fixture. The
separate seven Python fingerprint tests and full frozen-baseline rebuild passed.
