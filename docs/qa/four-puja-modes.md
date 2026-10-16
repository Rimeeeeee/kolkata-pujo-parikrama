# Four Puja modes — 16 October 2026

The existing evening remains the Saptami default. The new selector switches the ritual cast, lighting and controls without replacing the courtyard, shops, queue or photo system. Selecting another mode resets the current ritual; purchases, the balloon and completed pandal entry are preserved.

## Automated verification

All 77 checks pass with `npm test`. They exercise the pure ritual transitions and the actual Three.js scene with a renderer stub, alongside the existing game/queue/shop/photo tests. Coverage includes exactly three explicit Anjali throws and chorus triggers; priest and host proximity; distant/stale action rejection; pre-entry and queue restrictions; daylight fireworks and lighting restoration; ordinary skin/clothing colour preservation; fixed actor counts and visible moving instances; temporary crowd hiding/restoration; dance camera and input teardown; reciprocal sindoor and cancellation on walking away; current-day captions; and restoring the priest to face Maa when changing modes during a flower handoff. Audio checks validate the bundled chorus format, sample range, non-silence and attribution without playing it.

## Muted browser replay

All replay used Sound off. Entering through Explore places avoided enabling audio.

- Ashtami: completed the real entrance queue, walked to the priest, joined with five neighbours, received and threw three separate flower bundles, and reached “Three offerings complete.” Daylight, unlit decoration and disabled fireworks were inspected. A daylight material bug found visually was corrected so ordinary clothing/skin retains its colour.
- Navami: spoke to Bimal-da and used Ask to start dhunuchi naach. Dance was disabled at the dhaki, became available near the alpona circle, and joined an animated avatar using the dedicated camera. The full pandal remained visible. Leave restored the normal walking view while the circle continued.
- Dashami: met Paromita-di by the priest, started the six-woman group, used Play nearby, saw reciprocal gestures and cheek marks, then walked away with the landscape joystick and verified Play was disabled. Maa's subtle sindoor overlays and the daylight scene were inspected. Opened Dress up & pose afterwards and inspected the exact exported PNG, including the cheek colour and full pandal.
- Landscape: checked the mode chooser, dance and sindoor controls at 844 × 390, plus Anjali at 667 × 375. The chooser scrolls, and the ritual panel leaves the left joystick and bottom navigation reachable. Raised the guided altar aim after a phone replay showed the header obscuring Maa's face. Earlier joystick/orientation checks remain documented in the main replay notes.
- Final source: completed all three Anjali rounds again after the framing refinements, then selected Saptami and verified the original evening lighting, enabled fireworks control, hidden ritual panel and arati facing Maa. No console warnings or errors were captured during the final replay.

Screenshots: [Navami circle](navami-dance.jpg), [landscape dance](navami-landscape.jpg), [landscape selector](puja-modes-landscape.jpg), [Dashami group](dashami-sindoor.jpg), [reciprocal sindoor](dashami-landscape.jpg), [Dashami portrait PNG](dashami-portrait.png), [Anjali](ashtami-anjali-round1.jpg), and [smaller-phone Anjali](ashtami-landscape.jpg).

Final states: [three offerings complete](ashtami-complete.jpg) and [Saptami restored](saptami-restored.jpg).

## Scope and limits

These are short interactive scenes following the requested sequence, with the original stylised human models and flat altar artwork. They are not full ritual instructions. Daytime disables scene light sources and emissive decoration; light painted into the altar image remains part of that artwork. The new chorus was not auditioned because all work was muted. No physical phone performance claim is made. Earlier browser-native download-event reporting timed out; PNG export content was inspected directly instead. This revision updates source and the PR; it does not establish a new hosted deployment.

Reference material is linked in the README and audio provenance in `docs/voice-assets.md`.
