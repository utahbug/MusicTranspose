# Ensemble-key guidance

Starting commit: f61ad4665a94e935cc06c00c47ca2f58836b8c70.

Select a key shows Original/Current, Playing with, Instrument keys, up to three
recommendations, then all 13 manual destinations in their higher/original/lower
organization. The step buttons remain removed. On tablet/desktop each six-key
section is one row; phone sections use three columns. No score data or internal
transposition behavior changed.

Playing with opens an in-dialog overlay of 13 actual instrument-name checkboxes.
Piano is always included. Violin/Viola/Cello/Flute/Oboe/Bassoon/Trombone map to
concert pitch; Clarinet/Trumpet/Tenor Sax to B-flat; Alto/Baritone Sax to E-flat;
French Horn to F. Done, outside pointer/focus, or Escape dismisses the overlay.
Clear removes accompanying instruments. Valid selected names persist under
localStorage key music-transpose-ensemble-v1, independent of songs and musical
state. Storage failure leaves a session-only selection. No ensemble means no
recommendation section; normal manual selection remains fully available.

## Exact ranking

Use the existing chooser's 13 candidates and mode, and existing instrumentKeys
pitch-class calculation/spelling. For each candidate count absolute key-signature
fifths for piano and EACH selected instrument (including concert-pitch players).

score = 4 * maximum accidental count
      + total accidental count
      + 1.5 * absolute semitone distance from ORIGINAL
      + sum(20 * (count - 5)^2 for every player with count >= 6)

Lower is better. Six accidentals adds 20 per affected player; seven adds 80.
Tie-breaks: smaller original-key distance, lower maximum, lower total, then signed
shift ascending. Enharmonic pitch-class duplicates (the +/-6 destinations) are
shown only once in suggestions, keeping the first ranked option. Conventional
major/minor spellings are inherited from the unchanged key chooser; theoretical
double-accidental keys are never introduced. Minor stays minor. This is signature
and distance guidance, not instrumental range/fingering or vocal tessitura analysis.
Original-key distance is always used even after the current key changes. No
suggestion applies automatically. Any supported manual key remains selectable.

F major + Viola + Clarinet: F/F/G has burdens 1/1/1, score 7 at original F and
ranks first. F + Clarinet + Alto Sax gives F/G/D and also ranks original F first.
Original G-flat + Violin + Clarinet: G-flat/G-flat/A-flat burdens 6/6/4, score 80;
nearby F/F/G at -1 has score 8.5, a substantial improvement. Concert D gives
D/E for piano/clarinet. Concert C gives C/D/A/G for piano/clarinet/alto/F horn.

## Details and accessibility

Instrument keys now opens an overlay near the top. Selected instrument rows take
priority; Show all groups provides the original four-group details. With no
selection it shows all four. It describes the CURRENT rendered concert key.
Real buttons, labeled checkboxes, aria-expanded, pressed recommendation state,
visible focus, keyboard activation, Done and Escape remain available. No hover is
required; tooltips merely supplement signature and semitone information. The
recommendations do not restrict key selection or change the full key grid.

## Fit and tests

With Viola + Clarinet and recommendations visible, main dialog height is 536px.
No scrolling at 1180x820, 1024x768, 820x1180 or 768x1024 iPad-sized viewports,
or 1440x1000 desktop. At 390x844 the main dialog is 714px tall and fits; smaller
phone heights may scroll. Overlays have bounded height and internal scrolling
when needed; they do not enlarge the main dialog. Instrument targets are 44px
high; key cards remain at least 66px and Original at least 44px. No horizontal
overflow. No physical Safari/device testing was available.

Automated ensemble matrix covers required F, G-flat, D, C, minor and no-selection
cases; persistence across reload/new song, clearing, selected-only/all-group
details, Escape, suggestion selection, exact Reset, 13 manual keys and iPad fit.
The maintained full regression suite covers remaining app behavior. The data
baseline/fingerprint tooling and catalog are unchanged. sw.js cache v41 includes
the updated existing module; no new external/runtime dependency is introduced.
