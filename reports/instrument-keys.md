# Instrument keys

Select a key now contains a collapsed, keyboard-accessible Instrument keys section.
It reports the current rendered concert key and updates after destination selection,
quick semitone changes, reset and song loading. It is informational only.

Concert pitch uses the same key (including viola/cello regardless of clef).
B-flat instruments use +2 semitones, E-flat instruments +9, and F horn +7.
Pitch classes wrap modulo 12; major/minor mode is retained. The existing buildKeys
spelling policy supplies conventional written signatures, preserving concert spelling
for the nontransposing group. Thus a theoretical sharp-heavy spelling may be shown
as its practical flat equivalent. These are key signatures, not register guidance.

Supported examples: violin, viola, cello, flute, oboe, bassoon, trombone;
B-flat clarinet, trumpet, tenor sax; E-flat alto/baritone sax; F French horn.
Other instruments (including euphonium) are omitted because notation conventions
can depend on instrument variant, clef or ensemble. No score, audio or source data
is transposed by this helper. The module is bundled in the offline shell.
