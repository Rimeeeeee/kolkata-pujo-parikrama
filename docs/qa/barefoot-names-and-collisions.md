# Barefoot visitors, name tags and crowd clearance

These changes are applied directly to `main`, starting from merged commit `44ea24b`.

- Every shared human rig now has skin-coloured bare feet and toes, including the ritual actors and portrait avatars. Sandal soles and straps are removed. Toe geometry is shared.
- The kurta body extends continuously across the shoulders and into the collar. It joins the sleeve caps without an extra overlaid shoulder pad or gap, including the Ashtami view.
- Passive name tags identify the named neighbours, vendors, volunteer, dhaki, photographer and purohit. Paromita-di is identified while active in Dashami. Tags do not make the purohit interactive, block touch input, duplicate nearby talk buttons or cover the header/footer. They hide during dialogs and portrait/dance cameras.
- Crowd collision footprints include raised phone/prayer arms and performer props. Initial ambient spacing is resolved before homes are cached.
- Queue members walk along collision-checked routes into the courtyard, with replanning if another visitor blocks them. The camera also respects people during admission. Admission and dispersal finish from actual arrival rather than elapsed time alone.
- Changing to a different Puja day removes the carried balloon and its saved session choice, resets the selection and permits a new purchase. Re-selecting the same day keeps the balloon. Food purchases and pandal entry remain available.

## Verification

`npm test`: **134 passing tests across 13 files**, including 49 real-Three.js world cases and 38 app integration cases. `git diff --check` passes.

New regressions inspect skin-coloured feet/toes across the crowd, rituals and avatar rigs; kurta-to-shoulder contact across sizes and arm poses; the complete queue and dispersal sequence with no body/held-phone footprint overlap; passive purohit identification and camera hiding; and balloon/session reset followed by a fresh purchase. Existing ambient walking, all guided destinations, shop collision, jump, three-round Anjali, dance, reciprocal sindoor, performance grips, portraits and range tests remain passing.

Browser replay uses Explore places with sound off. The carried balloon disappears after changing to Ashtami, and the shop accepts a fresh colour selection. Queue admission and the daytime courtyard are replayed with bare feet, the corrected shirts and name tags. Desktop and landscape screenshots are retained with the task's outputs.

The mobile replay also displays Sourav-babu's passive label without a greeting control, plus Paromita-di's active Dashami label. Final browser warning/error logs are empty. Both audio elements remain paused at time zero.

The automated renderer is a stub; browser screenshots verify rendered appearance separately. Physical-phone frame rate is not established by viewport emulation. The idol artwork is unchanged.
