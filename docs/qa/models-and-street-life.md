# Models and street-life branch QA

Branch: `improve-pujo-models-and-street-life`, created from `95f6e1607761eba48becfdd7173248f47e9a85f7` on `improve-pujo-mobile-and-rituals`. This work updates only the new branch. No changes to PR #1, its branch, or production deployment were made.

## Eight audit fixes

1. Carried servings and their Put away control yield to visible Anjali/sindoor hands, then return after the sequence.
2. All three dhakis use one calibrated arm-and-stick rig. Palms and forearms remain outside the drum; fixed-length sticks remain gripped and tap the skins.
3. The purohit's palm supports the horizontal arati dish throughout its circle. Other Puja modes restore the arm geometry before ritual posing.
4. Basket size scales the contents, keeping the supporting hand the same size.
5. Greeting a vendor during a handoff releases that pose and smoothly transfers the serving toward the visitor. One system owns the arm pose at a time.
6. Rotating a phone to portrait pauses the range timer, cork flight, cooldown and input. Landscape resumes the same round.
7. Projected interaction buttons reserve the actual header and footer bounds, including small landscape screens.
8. Clear canvas now creates an explicit Remove floor design action. Applying it erases the placed art, reopening stays empty, and photography requires a new completed design.

## Jump, shop collisions and navigation

Space and a landscape mobile Jump button use the same guarded jump action. The roughly 0.76-unit arc returns to walking eye height. Holding Space does not repeat; buttons, links and editable controls keep native Space handling. Queue, modal, portrait and ritual-contact states block jumping. Beginning contact settles an active jump before hand targets are captured.

All six shop counters have rotated rectangular footprints matching the 4.1 x 1.8 countertops. Walking, jumping and guided routing use the same padded player footprint. Jumping does not bypass a counter. Interactions remain within reach.

The rendered tour exposed a guided route stopping against a newly blocking visitor. Guided movement now replans after 0.8 seconds without useful progress, preserving its destination, final look and pending promise. Retries are bounded; a permanently blocked route stops without teleporting.

## Idol artwork

The retained artwork has exactly ten central Durga hands, five per side, and the requested dark moustache on Kartick. The user explicitly chose to keep the earlier hand version and cancel the later hand/weapon redraw. The new redraw candidates were not integrated. Detailed hand and weapon anatomy is therefore deferred, not certified as corrected.

Real Bagbazar photographs were inspected during the cancelled redraw research. That review identified a distinct front sword grip and lower outer trident arm in the photographed idol; weapon arrangements vary between pratimas. The source is [the 2018 Bagbazar photograph](https://commons.wikimedia.org/wiki/File:বাগবাজার_সার্বজনীন_দুর্গোৎসব_২০১৮.jpg). No raw photograph replaces the illustrated altar.

## Automated and independent verification

`npm test`: **127 passing checks across 13 files**, including 44 real-Three.js world cases. `git diff --check` passes. Coverage includes three-round Anjali, dance and reciprocal sindoor contact, serving ownership, hand scale, vendor handoff release, all-three-dhaki drum clearance, arati support, jump interruption, counter routing, dynamic route replanning, rotation pause and applied-art removal.

Three agents independently re-audited models, mobile/input and ritual state. Additional drum penetration and airborne sindoor contact defects discovered during that pass were repaired and rechecked. No remaining functional defect was confirmed in those reviewed areas. This conclusion excludes the explicitly deferred idol hand redraw.

Independent geometry probes sampled all three dhakis for 500 frames with no palm/finger/forearm or stick-tip penetration into the solid drum. Eight jump cycles landed without meaningful eye-height drift. All 15 guided destinations remained reachable; 2,400 counter-corner walking samples stayed clear. Another replay completed 49 routes across active ritual crowds and 60 mode switches with bounded resources and finite matrices.

The automated renderer is a stub. Actual browser rendering is checked separately.

## Muted browser replay

The local preview was entered through Explore places. Begin, Sound and Hear greeting were never activated. Sound stayed off throughout.

- All shop categories, balloon selection, both neighbour greetings and translation were replayed. Tea-counter walking and jump attempts stopped outside the counter.
- A greeting during a tea handoff retained smooth serving ownership.
- The alpona marker is clickable below the header at 667x375. Painting, undo, completion, floor removal, empty reopening and repainting work.
- The range retained its 45-second timer and 11 corks through a portrait rotation pause, then resumed on landscape.
- Space and touch jumping animate, disable while airborne and become available on landing. Queue admission blocks jumping and completes normally.
- Six fresh native sari/dhoti portrait PNGs, covering namaskar, wave and relaxed poses, were inspected. Faces, limbs, garments, planted feet and pandal framing remain complete. No definite new portrait clipping was found.

- The final 844x390 replay completed all three Ashtami offerings, with fireworks disabled in daylight. Navami start/join/leave and Dashami reciprocal contact completed. A jump immediately before sindoor application settled correctly, and controls returned afterward. The previously stalled Anirban-da-to-flower-stall route reached Bela-di without retrying the destination. Final browser warning/error logs were empty; both audio elements were paused at time zero.

## Limits

Models remain stylised procedural art. Viewport emulation does not establish frame rate on a physical phone. PNG contents and download links were inspected; operating-system download completion was not instrumented. No production deployment was performed. The more detailed idol grip/weapon redraw remains deferred at the user's request.
