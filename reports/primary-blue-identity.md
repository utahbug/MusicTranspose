# Primary blue identity refinement

Starting commit: 590b0aff0da07fcb872e17949cdcb3df5f796e61.

The shared --primary-blue value is #365F7D; --primary-blue-text is #FFFFFF. Screen-only CSS applies it to the current-key control, score Library button, and Library heading. Search, filters, list rows, score paper, Lyrics themes, Settings and score borders retain their existing treatment. The optional return-to-song control uses white text and outline inside the blue heading.

Hover mixes the shared blue with 8% black; pressed with 15% black. Disabled mixes 20% #687780 while preserving opaque white text. Keyboard focus uses a 2px blue outline with 2px offset; the return button uses a white outline on blue. White contrast: normal 6.80:1, hover 7.61:1, pressed 8.42:1, disabled 6.30:1.

The heading uses 8px vertical / 10px horizontal padding, extending to the existing panel edges. Its initial height is 65px on phone and 68px on wider screens. Existing return-to-song wrapping remains available on narrow screens. The search/filter panel stays #E2E8EC and search stays white.

Compared against the starting stylesheet at 390x844, 820x1180, 1180x820 and 1440x1000: key, Library button and toolbar widths/heights are identical. Key remains 112x44px for G major, and the continuous toolbar remains 54px high. No horizontal overflow. Screenshots inspected for phone, iPad portrait/landscape and desktop; compact heading and separate light search area remain legible. Browser viewport tests do not replace physical iOS testing.

Only styles.css and the service-worker cache version (v45) affect runtime. Print styling is untouched: all new visual overrides are inside @media screen. The existing toolbar remains hidden in print. No assets, score data or JavaScript behavior changed.

Validation: all 29 current browser regression suites passed, including all 119 structured scores, transposition/reset, PDF, playback, Lyrics, navigation/tap zones, lists, print checks, asset caching and offline reload. Focused checks also passed for hover/pressed/keyboard focus/disabled styles and baseline control geometry.
