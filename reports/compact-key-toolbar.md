# Deliberate key-selection toolbar

Starting commit: 1f65967ee62105732796819a6385842d2aebd4f6.

Removed both quick pitch-step buttons from the DOM, along with their click handlers,
disabled-state assignments and .step CSS rules. No empty outlined group remains.
Internal changeKey and all chooser destinations/enharmonic/instrument calculations
remain intact. Current tests use Select a key through a shared test helper instead
of old buttons; historical stress fixtures call the retained internal function.
No runtime arrow-key shortcuts were attached to the removed controls; unrelated
navigation keyboard support is unchanged.

The key button is content-sized, minimum 112px and maximum 144px, height 44px,
with 12px horizontal padding and a stacked key/signature. Its wrapper no longer
stretches or draws a surrounding border. On large screens the grid centers it with
balanced space on either side; on phones it centers in the remaining middle area
between the utility cluster and separate 44px Reset. Existing blue-gray color stays.

At 320, 390, 820, 1180 and 1440px viewports the tested key was 112px wide and the
full toolbar stayed 54px high with no horizontal overflow. iPad landscape centers
the key at the screen midpoint and leaves generous whitespace. Keyboard activation,
visible focus, accessible current key/signature, Reset and Instrument keys remain.
Concert D was checked as D/E/B/A for concert/B-flat/E-flat/F groups.

The existing suite covers playback following chosen key, octave, exact reset,
Score/Lyrics, offline audio/assets, PDFs, print, Library lists/order, navigation and
Lyrics Fun. Screenshots and machine results are in ignored test-results.
