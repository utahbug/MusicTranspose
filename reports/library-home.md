# Library Home and session-scoped browsing

Fresh navigation uses library-session.js: a top-level Navigation Timing `navigate` entry starts clean, including a PWA start URL even if session storage survived. A missing session marker also starts clean. `reload` and `back_forward` with the active marker retain history/context. A BFCache or OS resume of the existing document is continuation, not a cold launch. No inactivity timeout or startup delay is used.

Browser/PWA limitation: the web app cannot reliably distinguish an OS-restored running document from an ordinary in-session resume. Physical installed-iPad lifecycle behavior needs confirmation; this implementation deliberately preserves resumed current history rather than resetting on visibility changes.

Browsing workspaces now live in sessionStorage (same workspace key). Legacy localStorage workspace restrictions and saved source preferences are ignored on startup. A fresh session resets Source, active List, Search/scope, Favorites/Lead filters and browsing scroll. Favorites membership, Lists, local files, global Sort and unrelated application preferences remain persistent. A fresh entry replaces the current route with Home; existing history still uses the single view-history controller.

Home is static local app markup: six large single-column rows, shared gradient, no image/fetch/timer required. All Music and collection rows use the existing Library with clean filters and the saved global Sort. Files and Lists use their existing dedicated views, never a Source filter or selected List. The normal Library identity button opens Home; other header/Score title behavior is unchanged. More/Source menus remain available.

Focused verification:
- node tests/library-home.mjs: stale persistent workspace; new session; retained-storage top-level launch; reload; Back/Forward; all sources; Files including both bundled personal songs; All Lists; Score return; unchanged source song-ID snapshot; persistent sort; simulated standalone navigator; 820/1440/390px geometry and screenshots.
- node tests/library-more-navigation.mjs: Lists/Files return context, filters, search, sort, active List and scroll; reload and Back/Forward.
- Existing Lists test entry updated to choose All Music on fresh startup.
- git diff --check.

Single-column rows remain at least 72px high with named buttons, subordinate subtitles, keyboard focus and a noninteractive divider. No Score/lyrics/rendering/Previous-Next algorithm, playback, import or List data-model changes. Offline shell v175 includes the session helper. Physical PWA lifecycle and Score-title hit-area refinement are deferred, not claimed as device-verified.
