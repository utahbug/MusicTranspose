# Optional Library search scopes

Implemented in the existing utahbug/MusicTranspose repository on codex/pages. No score/layout changes. Earlier untracked pagination diagnostics are excluded from this change.

## Behavior and metadata

- Titles is the default. Preserves existing token matching, including existing tags, credits, first line and filenames, and adds collection-membership titles/numbers. This deliberate compatibility choice means Titles is not a strictly title-only search.
- Titles + lyrics adds normalized contiguous phrase matching across the complete available verses, refrains and alternate lyrics. All text additionally supports topics/keywords when provided. Current catalog has tags but no dedicated topics/keywords fields, so advanced scopes currently overlap substantially.
- Four existing explicit aliases: I Belong to the Church of Jesus Christ; I’m Trying to Be Like Jesus; Give, Said the Little Stream; Wise Man and the Foolish Man. No alias was invented. Collection memberships also provide existing presentation titles/numbers.
- Search always filters existing canonical song objects; aliases never create songs, rows, favorites or list entries. Current source/list filters and saved manual order continue to apply.
- New 44px native scope selector beside Search, using an options icon, keyboard focus ring, advanced-state tint, and scope-specific placeholder. No extra header row. Results may say Matched lyrics or Matched metadata without displaying lyric excerpts.
- Scope lives only in memory: retained across in-app navigation, reset to Titles on reload. No Advanced Settings preference or persistent scope.

## Indexing

681 lyric records in existing assets/lyrics.json (1,288,776 bytes). Loaded and normalized only on first advanced selection; one shared pending request per search index, with retry after failure. Existing service-worker caching already includes the lyric file. New module added to shell cache v116. No PDF/MXL download or extraction for search. Metadata normalization cached by song object. Unicode letter/number normalization reuses existing normalization, including curly/straight apostrophes, punctuation, accents, whitespace and case. Data remains keyed by canonical ID, independent of text/language; no new multilingual dataset or behavior introduced.

## Targeted verification

- tests/library-advanced-search.mjs: exact title, number, collection, all four aliases, existing default-search compatibility, Hymns and Children's Songbook lyric phrases, all alternate-lyric sections, normalization, deferred/coalesced indexing, retry, no duplicate rows, favorites, list order, return context, keyboard focus, offline reload, scope reset, and late-request race.
- Confirmed “by my side” finds My Hands; “our shadow by day” finds Redeemer of Israel. Advanced phrase matching avoids matches from unrelated scattered common words.
- Browser checks passed at 320x568, 390x844, 844x390, 820x1180 and 1440x1000. All search-row controls remain at least 44px tall; no wrapping or horizontal overflow. Screenshots captured; phone/tablet screenshots visually inspected. These are Edge browser viewport tests, not physical iPhone/iPad tests.
- Existing tests/library-header.mjs passed at 320x568, 390x844, 430x932, 844x390, 820x1180 and 1440x1000, including menus, sorting, manual order and persistence.
- No full music-engine or chord suites run. Static production app served directly: this repository has no bundler/build step. git diff --check passed.

## Files

index.html, styles.css, library.js, library-search.js, sw.js, tests/library-advanced-search.mjs, this report.
