# Inline performance-page position

Starting commit: 8f3bd1c0765b5061a28372a65bdd44e63df78936.

The Previous/Next buttons and page-controls wrapper are removed from the DOM. Page mode no longer displays or reserves its dedicated navigation row. Auto-scroll retains its existing control strip.

The existing live page-position status is now in a small flex cluster immediately after Reset. It has plain tabular-number text, no border or background, and an accessible Page/Virtual page N of M label. It is hidden outside page mode and for zero/one page. PDF retains its existing hidden musical Reset and places the position at the toolbar's right edge.

The shared turn function, four safe tap zones, no-wrap bounds and keyboard/pedal command mapping are unchanged. Settings explicitly documents Previous (Page Up/Left), Next (Page Down/Right), First (Home), and Last (End). No Bluetooth hardware was available; compatible pedals are covered through their keyboard events.

At 320, 390, 820, 1180 and 1440px widths the toolbar is 54px high before any device safe-area inset, with no overflow. Current key remains 112px for the tested G-major song; Reset remains 44x44px. iPad/desktop preserve the centered key and whitespace. Only page-mode narrow screens tighten horizontal gaps/padding. Page status is 12px on iPad/desktop, 11px on phone, and 10px at widths up to 360px. Existing bottom clearance and pagination adapt automatically to the smaller bar.

The focused test checks MXL and real PDF pages, previous/next keyboard commands, indicator location, absent arrows/row, single-page hiding, continuous-mode hiding and print invisibility. Existing navigation tests now use keyboard commands in place of removed button clicks, with explicit no-wrap assertions retained. Screenshots inspected for phone, iPad portrait/landscape and desktop; physical iOS/pedal testing remains a hardware follow-up.

Runtime files: index.html, navigation.js, styles.css, sw.js (cache v47). No score/source assets or transposition/playback logic changed.

Validation result: all 30 existing regression suites passed, including all 119 structured scores and offline reload. The new inline-page-position suite also passed (31 suites covered). Four-zone touch, no-wrap bounds, keyboard/pedal events, PDF pages, MXL complete-system pages, Auto-scroll, Continuous Scroll, key selection, Reset, playback, Lyrics, Library/lists and print regressions passed.
