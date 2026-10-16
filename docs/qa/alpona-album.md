# Brighter alpona and the Pujo memory album

This update stays on `improve-pujo-mobile-and-rituals` and PR #1. It adds the requested floor art and memory album. Other proposed character and interaction additions remain outside this change.

## Result

- 63 floor placements: the three central designs plus 60 lane/courtyard placements, up from 32 added placements. Six bright designs share six 512 × 512 canvas textures, with white linework and gold, vermilion or green accents. All floor art renders in six fixed instance batches with single-pass materials. The floor layout and collision boundaries are unchanged.
- An opt-in album stores postcards and dress-up portraits by captured Puja day. It retains outfit/pose metadata and Bengali or English captions. Saving the same picture twice keeps one record.
- Download each full-size PNG separately, or generate a collage PNG from the currently visible day filter. Collages include day labels and captions and fit each complete source picture without cropping. No archive export is offered.
- The browser-local album has a 24-picture count limit and a 32-million-character image budget. It never silently evicts an existing record. Storage failures do not mutate the saved list. A temporary fallback is clearly labelled if IndexedDB cannot open. Removal supports undo during the page visit.
- Gallery thumbnails and lazy loading reduce preview decoding. Collages load one source image at a time and use fewer than 11 million canvas pixels even at 24 pictures. Closed dialogs discard previews. These are bounded-resource design choices, not physical-device FPS measurements.

## Automated verification

`npm test`: **99 passed, zero failures**, across twelve suites. The additions cover serialized duplicate saves, caption preservation and Unicode, removal/undo, unavailable/full storage, count/image budgets, failed-transaction atomicity, bounded/non-overlapping collage tiles for 1–24 images, complete source-image aspect ratios, caption wrapping, and failure before partial export. App integration covers explicit saving, captured day and outfit metadata, album pause/queue guards, PNG preparation and edits during an in-flight save. Existing queue, route, ritual, range, movement and media checks continue passing.

The real Three.js world suite also passes after the final texture filtering adjustment. It verifies 60 added floor placements, six materials/batches, shared geometry and correct lane/courtyard heights, alongside all existing scene checks.

## Muted browser replay

The browser entered through Explore places or Album; Sound stayed off.

- Saved a Saptami sari portrait. Saving it again showed “already in your album” and kept the count at one.
- Added a Bengali/English caption, generated and inspected a single-memory PNG collage, then saved an Ashtami dhoti/wave portrait with a second caption.
- Reloaded the page and verified both saved images and captions remained in the actual browser database.
- Visited Haru-da, stepped back with the landscape joystick and inspected the brighter shop-side alpona. Saved a Navami postcard of the shop and its floor decoration.
- Removed and restored the Saptami portrait using Undo; its caption and original chronological position returned. The empty Dashami filter correctly disabled collage creation.
- Added a Dashami sari/wave portrait and caption, reaching **4 of 4 Puja days**. Created the full four-memory collage and inspected the exact PNG linked by the UI: **1800 × 2058**, containing complete source photos, all four labels and captions, including Bengali text. [Actual collage PNG](alpona-album/four-day-collage.png).
- A selected Ashtami filter generated a single-memory collage, with one visible image and the correct caption. Individual download links retained their original full-size PNGs.
- Checked 844 × 390 and 667 × 375 landscape layouts: no horizontal page overflow; the modal and gallery scroll, caption inputs remain usable, and the sticky Close control stays reachable at the bottom of the gallery. [Smaller landscape gallery](alpona-album/album-gallery-667.jpg).
- Reloaded once more and confirmed all four saved records and captions survived. Queue entry disables Album along with the other navigation controls.
- Completed queue entry on the final source and inspected the bright central lotus and the other courtyard designs. Walking and dragging still work around the decorated floor. [Courtyard alpona](alpona-album/courtyard-alpona-667.jpg).
- Reopened the album after the queue: all four records remained. Portrait orientation covered the open album with the rotation prompt, and returning to desktop restored it. [Desktop album](alpona-album/album-desktop.jpg). The final browser log contained no warnings or errors; dhak and chorus elements were both paused.

## Limits

PNG content is verified through the exact generated download links. Native operating-system download completion and physical-phone frame rate are not claimed. Browser storage may be unavailable, evicted or cleared; the UI recommends keeping downloaded copies. User names, pictures and captions stay on the visitor's device. Existing stylised models and the flat altar artwork remain as before. This updates source and the same PR, without changing the hosted deployment.
