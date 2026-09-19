# Original-key / Lyrics header separation

Starting commit: 4836c75. Focused screen-only CSS correction.

The existing score-actions flex group reused a 2px icon gap for Original-key metadata and Lyrics, while metadata was forced onto one unbreakable line. This created crowding and lacked a deliberate responsive text/control separation policy. The automated Chromium baseline exposed the tight layout; a literal Safari glyph overlap was not independently reproduced.

The same group now has a 10px horizontal gap, wrapping support and bounded width. Metadata can wrap; each control reserves its full 44px width/height and cannot shrink. Existing title/grid separation remains. At the existing <=600px phone breakpoint, controls stay together and Original key stays on the second grid row with a 4px vertical gap. On tablet/desktop the metadata and Lyrics remain on one line. Hidden Lyrics leaves no reserved button space. No absolute offsets, song-specific rules, changed colors, or JavaScript behavior changes.

Tests: 320, 390, 600, 601, 820, 1180 and 1440px widths; short, quoted and long fixture titles; C Maj, F Maj, D Min, B-flat Maj, E-flat Maj and F-sharp Min labels; both Lyrics availability states. These fixture text changes are test-only, not catalog modifications. Bounding rectangles and actual text ranges confirm separation, 44px targets, no title collision/overflow and unchanged bottom-toolbar height. Screenshots reviewed for phone/iPad portrait/landscape. The existing performance suite also tests the actual longest catalog title on all four primary viewports.

Passed: Original key unchanged after transposition/Reset; Lyrics and Score switching; Score Size; playback and Library; page-mode layout; octave; PDF; print; offline. Physical Safari testing is not claimed. New test: tests/original-key-header.mjs. Existing regression: tests/performance-placement.mjs. Service-worker version increment delivers the stylesheet to existing installations; caching behavior is unchanged.
