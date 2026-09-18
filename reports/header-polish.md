# Header polish and optical subtitle alignment

Starting commit: deea609207ba643453da406c9d96eddc1f1678a1.

Lyrics entry icons now contain four simple, variable-length SVG text lines, using
existing stroke styling and the accessible name/title Lyrics. No external asset.
Both title-row playback buttons have no resting border/background. Existing 44x44
hit areas, real button semantics and unchanged handlers remain; hover/press tint
and a keyboard-only focus ring provide feedback.

Lyrics title/source margin measured 14px before, now 6px. Source to first verse
measured 28px before, now 16px. Long titles wrap beside the fixed-size speaker.
Score top position remained 75px at 390px width and 78.3px at the tested larger
widths. Existing score spacing and print renderer remain unchanged.

A presentation-only helper uses a DOM text Range to find the first substantive
title character after opening quotes/parentheses/brackets. It sets a screen-only
subtitle inset in both views, recalculated on view updates, resize and font readiness.
No title string or catalog/source metadata is modified. Printed layout does not
use this inset.

Targeted tests cover quoted/unquoted/wrapping titles, subtitle alignment, spacing,
44px targets, keyboard focus/activation, Play/Pause/Resume, right-click and hold-stop
in both views at 390x844, 820x1180, 1180x820 and 1440x1000. Screenshots are in the
ignored test-results folder. Existing playback, Lyrics, instrument guidance and
navigation/Fun suites also run. Browser viewport checks are not physical iOS tests.
