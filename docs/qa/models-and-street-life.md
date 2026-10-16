# Models and street-life branch QA

Branch: `improve-pujo-models-and-street-life`, from `95f6e1607761eba48becfdd7173248f47e9a85f7` on `improve-pujo-mobile-and-rituals`. No changes to PR #1, its branch, or deployment.

## Automated verification

`npm test`: 107 checks in 13 suites. Real Three.js scene tests retain the existing three-round Anjali, Navami dance, reciprocal sindoor contact, priest orientation, queue, navigation, portrait and reduced-motion regressions. Additional checks cover all menu servings and transfer contact, bounded model reuse, remote/invalid purchases, put-away, floor-texture replacement, complete floor-art camera bounds, hidden instance compaction and distant detail, sandal clearance, art input validation/capacity, guided editor/undo/completion, PNG and album save.

The renderer in these tests is a stub; browser rendering is checked separately below.

## Muted browser replay

The local preview was entered through Explore places. Begin, Sound and Hear greeting were never activated. Both audio elements were observed paused. The following were checked in the in-app browser:

- Tea menu, vendor extending the clay cup, cup carried in the foreground, and Put away.
- Six motif choices, four paint colours, keyboard placement and touch stamping; completion enables the photograph.
- Full alpona plus pandal in the resulting PNG; the first camera crop was corrected and all four floor corners now have a framing regression.
- Add to album confirms persistent browser save.
- Sari namaskar and dhoti-kurta wave PNGs retain the pandal background.
- Landscape 844x390 and 667x375: editor scrolls vertically, controls remain reachable, and there is no horizontal dialog overflow. A sticky close control remains available while scrolling.

## Limits

The models remain stylised procedural art. Browser viewport checks do not establish frame rate on a physical phone. PNG contents and download links were inspected; native operating-system download completion was not instrumented. No production deployment was performed.
