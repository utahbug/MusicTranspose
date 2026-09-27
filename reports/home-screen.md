# Add to Home Screen utility

Existing PWA readiness: one valid manifest, name Music Transpose, short name Transpose, display standalone, relative scope/start_url ./ resolving to the existing /MusicTranspose/ app. Theme #173e3b and background #eeeee8 match existing UI metadata. PNG headers confirm manifest icons at 192x192 and 512x512, Apple touch icon at 180x180, favicon at 32x32. Existing manifest link, apple-mobile-web-app-capable/title and theme metadata retained. No second manifest, changed app identity or app created.

More now includes Add to Home Screen… after Files / My Music and Import music. Filters remain separate. Compact native dialog supports close button, Escape, outside dismissal, focus containment and return to More. Guidance is invoked only by the user; no automatic install popup.

On iPhone/iPad, including desktop-user-agent iPad detection, guidance says to use Safari: Share (possibly inside the page menu), Add to Home Screen, Add. On Android/desktop, a captured beforeinstallprompt event enables an Install MusicTranspose button. It invokes the native browser prompt once per event, handles cancellation/errors, and otherwise provides menu-based fallback guidance; Mac Safari fallback mentions File → Add to Dock. Installation acceptance alone is not represented as confirmed installation. appinstalled or detected standalone mode hides the utility. No storage marker pretends to detect installation in a separate browser session.

Explicit note: adding the icon does not save all songs for offline use. No download/cache management added; only the new app module is added to the existing shell cache (v119).

Targeted tests passed:
- tests/home-screen.mjs: manifest parsed by browser with no errors, icon sizes, correct start URL, guide for iPhone portrait/landscape, iPad desktop UA, Android and desktop; dialog bounds/focus/dismissal, simulated native prompt acceptance/cancellation/error, navigator.standalone and display-mode detection, launch to Library, hidden item keyboard skipping, offline Library/guidance reload.
- Viewports: 320x568, 390x844, 844x390, 820x1180, 412x915, 1440x1000. No overflow. 320px screenshot visually inspected.
- tests/library-filters.mjs: Favorites/Lead, Source/List context, Score/Lyrics return, sorting/manual order, utilities, keyboard, responsiveness and offline smoke passed unchanged in behavior. Utility expectation updated; tests/library-header.mjs expectation likewise updated.
- Static production files run directly; repository has no bundler/build step. No music-engine/chord suites. Actual operating-system install/native prompt and physical Home Screen launch remain device-dependent and were not claimed as physically tested; native event paths and standalone startup were simulated.

Files: home-screen.js, index.html, library.js, styles.css, sw.js, tests/home-screen.mjs, tests/library-filters.mjs, tests/library-header.mjs, this report.

Guidance/API references:
- https://support.apple.com/guide/iphone/open-as-web-app-iphea86e5236/ios
- https://support.apple.com/en-gb/104996
- https://developer.mozilla.org/en-US/docs/Web/API/Window/beforeinstallprompt_event
