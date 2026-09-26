# Lyrics Library navigation alignment

The existing Lyrics view already moves the actual Score Library button into its footer, retaining the SVG, accessible Library/Back to list label and shared navigation handler. No duplicate button or new navigation implementation was needed. Inspection found a visual mismatch: Lyrics used an 8px left/bottom inset and a 44px width at 320px, while Score uses 4px/12px responsive left insets, a 5px bottom offset, and a 40x44px control at 320px.

Adjusted only Lyrics footer CSS to match Score's safe-area anchoring and narrow-phone size. Shared blue styling, icon, handler and Score layout remain unchanged. Existing lyrics bottom clearance protects the final verse; no redundant text-only Library button exists. Hidden Fun logic, metronome, Lead, Library layout, and engraving are unchanged.

Targeted production-file checks: tests/lyrics-library-navigation.mjs passed at 320x568, 390x844, 844x390, 820x1180, 1440x1000. Computed icon, size, position, background, border, color, corner radius and accessible label match Score. Verified one shared button, full Library and filtered-source returns, search/sort/scroll restoration, same List/manual order, no Search autofocus, Favorites, last-verse clearance, no overflow, background preference, offline reload/return and a rapid Lyrics-selection stale-content smoke check. No browser errors. Screenshots saved under ignored test-results/lyrics-library-*.png; 320px result visually reviewed.

The static production app was served directly at localhost:8771; no compilation step. No music-engine suites run. Service-worker shell version advanced to v107.

Files: styles.css, sw.js, tests/lyrics-library-navigation.mjs, reports/lyrics-library-navigation.md.
