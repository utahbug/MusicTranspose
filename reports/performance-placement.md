# Performance UI control placement

Starting commit: 6f7ee76. No musical algorithms, assets or saved preferences changed.

Octave moved out of Settings into a compact native radio fieldset at the top of Select a key: 8vb / Normal / 8va. The existing changeOctave handler remains; Normal changes octave only and keeps the current key. All octave changes leave the dialog open. Reset still restores key and octave. Settings starts with Score navigation.

A quiet original-key reference reads the zero-shift source key, never the current transposed key. It is hidden for PDF/unavailable-key scores and in print. It uses the subtitle's system-font family, 11px (10px phone), normal weight and #677570 metadata color. It does not reserve a Lyrics control when lyrics are unavailable.

Above 600 CSS pixels, the existing Library button moves into the bottom left group before Reset and Current Key. Its original blue background/white icon are preserved, with 8px extra separation from Reset (14px total with group gap). Score Size moves immediately before Print and Settings. Equal flexible outer grid tracks keep page status centered. The existing controls/handlers/IDs are reused, not duplicated. Score Size's existing popover opens upward when needed near the bottom edge.

At 600px and below, Library and Size stay in the phone header with Lyrics; Original key uses a compact secondary line there. Width changes move the same buttons synchronously via matchMedia. Desktop/iPad header contains Original key and optional Lyrics. Toolbar remains 54px in tested continuous-scroll layouts. Phone/tablet classification is viewport width, not user-agent detection; a wide phone in landscape follows the wider layout.

Verification: song-session regression covers octave down/normal/up, key independence, Reset, leaving/reopening songs, automatic-scroll stop and preferences, PDF exclusion, six toolbar widths. performance-placement checks four viewport layouts, true centered page position, all three size states and changed OSMD system counts, bounded size popover, original key invariant, playback stopping on octave change, print exclusion, Lyrics/Score, Library, offline opening, and longest catalog title safety. performance-navigation covers four zones, touch drag, keyboard, defaults/persistence, MXL/PDF paging and offline behavior. Native radio semantics and existing accessible button labels/focus remain intact. Physical iPad/Safari tests are not claimed; these use browser viewport/touch emulation.

The service-worker cache increments to v66 so existing installations receive matching HTML, CSS and scripts. Storage architecture and offline asset strategy are unchanged.
