# Visual score-size selector and title alignment

Starting commit: 3907712f50147b12febcd06e79c866357206c84e.

One neutral page SVG replaces N/C/L. The existing phone-only breakpoint (600px)
and OSMD density settings are unchanged: Small maps to compact .62, Normal .78,
Large .94. The 44px trigger opens an approximately 186x70px panel with three 52px
buttons using the same SVG at increasing sizes. Current state has aria-pressed
and a visible highlight. Labels are Score size, Small score, Normal score, Large
score; no persistent letters or words. Tab/Enter/Space work, Escape returns focus,
selection closes and returns focus, outside pointer/focus dismisses. Resize and
leaving for Library/Lyrics close the selector. It is excluded from print and PDFs.

Reusable title-alignment.js skips opening punctuation, measures the first letter
with DOM Range and canvas font ink bearings, then applies a screen-only inline
margin to the source subtitle. Subtitle ink is rounded rightward (less than 1px)
so it never begins left of the title letter. This also handles unquoted letters
whose ink extends beyond their nominal box. Titles/catalog text are never edited.
Updates occur with view changes, font readiness and resize. Lyrics vertical gaps
remain 6px/16px; score/header height is unchanged.

Validation: size-selector, score-density, header-polish, playback,
ui-navigation-fun and instrument-keys browser suites. Seven scores reflowed;
Amazing Grace retained Normal/Small/Large system counts 8/6/11 at 390px.
Source XML and separately engraved print output remain invariant during sizing.
Keyboard dismissal, outside dismissal, selected state, target size, viewport bounds,
quoted/unquoted/apostrophe/parenthesis/bracket/brace/wrapping titles were checked.
Phone widths 375/390/600; larger sizes include iPad portrait/landscape and desktop.
Existing playback tests cover 119 score timelines, key/octave, paired views, PDFs
and offline audio. No physical iPhone/iPad Safari test was available.
