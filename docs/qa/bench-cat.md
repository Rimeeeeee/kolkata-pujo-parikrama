# Bench cat — isolated addition

A small ginger-and-white domestic shorthair rests at the clear end of the existing bench beside Haru-da. It has white socks, tabby markings, green eyes, a red collar and a brass bell. The existing bench, people, shops, altar, lighting and floor art are retained.

Pet appears only within 1.6 scene metres. The handler rechecks range, queue/dialog state, guided travel, jumping and alternate cameras. A pet closes the eyes and shows a gentle hand stroke; leaving cancels it. Reduced motion keeps the response still. The real 0.8-second meow plays once on approach, has exit hysteresis and a 12-second cooldown, and follows the existing Sound control. Muting or hiding the page stops it.

The cat adds one small collision disc at the occupied bench end. Real-scene checks confirm all 74 people are retained, existing neighbours clear the cat, and a petting position remains reachable. The full 139-check suite passed, followed by the added real-scene placement case and the 39-case app suite with the new stale-pet interaction regression: 141 passing checks in total. All previous queue, ritual, shop, movement, range and portrait cases remain passing.

[Geometry model preview](bench-cat-model.png) is a software projection of the actual Three.js cat and unchanged bench geometry, inspected for paws/plank placement, model proportions and bell visibility. It is not a browser screenshot. Fresh browser QA remains unavailable because the browser tool fails during startup. No physical-device frame-rate or listening-review claim is made.

Real cat recording: Dan Crosby, Meow.ogg, CC BY-SA 3.0, unchanged (14,306 bytes). In-game credit links to the full source and license in assets/cat-audio-attribution.md.


## Face and petting refinement

Only the cat model/animation module and its pet response copy changed. The cat retains its bench position, collar bell, meow, proximity gates and collision boundary. The rest of the neighbourhood is unchanged.

Cat-only smooth sphere geometry, rounded ear profiles, finer surface-following tabby stripes, rounder pupils and small eye highlights soften the model. The head turns smoothly toward the actual visitor and tilts up, with a brief slow blink while petting. A connected arm approaches from the side, follows the curved crown behind the ears, and withdraws. The model preview exposed an arm crossing the face; the reach was corrected and a ray-intersection regression now checks that both eyes remain unobstructed from four visitor directions during contact.

The final suite passes 144 checks. Added checks cover head direction and smooth turning, approach/contact/withdrawal, wrist attachment, crown placement, and eye visibility. Resting, petting and visitor-perspective geometry previews were inspected. [Visitor-perspective petting preview](bench-cat-petting.png). These are software projections of the actual meshes, not browser screenshots. Browser QA is still unavailable because the browser tool fails during startup.
