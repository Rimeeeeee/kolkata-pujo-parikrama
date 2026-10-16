# Eight audit fixes — 16 October 2026

This follow-up resolves the eight findings recorded against commit `6b8898f`. The three specialist agents repeated their behavior, model/contact and mobile/rendering audits after implementation. All work and browser replay used Sound off. Audio cancellation was checked with mocks, without audible playback.

## Fixes and regression evidence

| Finding | Result |
| --- | --- |
| Navami shopping resets the running event | Leaving preserves the started circle, both before joining and after leaving a dance. App tests cover shop → circle → join → leave → shop → rejoin. |
| Range shortcuts consume button Enter/Space | Interactive descendants keep their native keyboard behavior. Canvas Enter/Space still fire once; held Enter does not repeat fire. |
| Sindoor hands miss cheeks | Existing shoulder, elbow, forearm and palm meshes now pose to actual cheek targets. Paired women take turns; the nearby player and selected neighbour exchange colour. A fixed, collision-safe approach returns home and cancels on player movement. |
| Inactive ritual meshes still submit work | Instance batches are packed with active, visible meshes only. Saptami submits zero ritual instances and zero ritual batches; hidden flowers, bowls and marks are omitted in other modes. |
| Flowers begin above the purohit's hand | Receiving applies the priest's pose first and starts the flowers at the transformed palm surface, measured 0.035 scene units from the palm centre. |
| Reduced motion still moves arms and smoke | Dance arms, body, smoke and paired sindoor poses remain static across time with reduced motion enabled. Explicit user-triggered ritual transitions remain available. |
| Cancelled chorus leaves dhak quiet | Stopping the chorus pauses/resets it and restores dhak volume to 0.48, without enabling sound. |
| Phone conversation card covers greetings | In landscape, the scrollable card docks to the right, keeps 44-pixel controls and accounts for safe-area insets. The central character view remains visible. |

`npm test` passes **87/87 checks** across ten suites, with zero failures. Scene tests use real Three.js geometry and a renderer stub. The new regressions cover contact geometry, approach clearance/cancellation, handoff ordering, inactive submissions, reduced motion, native range keys, Navami navigation and chorus cancellation.

## Independent re-audit

- Model audit: all six automatic palm-to-cheek contacts reach their targets. Across 291 eligible player positions, both reciprocal contacts succeed with numerical error below 0.000001 scene units; minimum woman-to-woman centre spacing is 0.68060 (collision radius sum 0.68). Thirty cancellation timings and 90 mode-switch/restoration cases pass. No new meshes are allocated while posing.
- Behavior audit: all 42 guided routes (fourteen destinations with each alternate ritual crowd active) complete. Sixty mode changes keep instance matrices finite, actor/scene counts bounded, and camera/input teardown clean.
- Rendering audit: Saptami drops from 39 submitted ritual batches / 1,353 instances / 195,536 triangles to zero. Active counts are 461 for Anjali, 422 for the Navami circle (480 when joined), and 270 for the started Dashami group. Four hundred mode changes preserve the fixed 1,353-instance capacity and restore zero Saptami submissions. These are scene submission measurements, not physical-phone FPS measurements.
- A final independent clearance sweep covered 909 physically clear, walkable visitor positions near the Dashami group, with zero rejected approaches and zero staged-path collisions with visible base characters, including the priest. The bounded candidate search runs once per Play and creates no render resources.

## Muted browser replay

The tour used 844 × 390 and 667 × 375 landscape viewports, plus a portrait rotation check. It entered through Explore places, keeping sound off.

- Greeting cards: both neighbours were visited. At 667 × 375, the translated card remained within the viewport (x 380.58, right 647.67), scrolled vertically and left the face visible. The 844-wide card likewise stayed beside the central character. [Phone greeting](fixes-greeting-667.jpg).
- Shooting range: canvas Enter consumed one cork; New round with Enter and Space restored twelve corks without an extra shot; Enter on Leave closed the game. The smaller landscape modal scrolled to its controls. [Keyboard replay](fixes-range-keyboard-667.jpg).
- Queue: met Arjun at the front and followed the line to completed entry, including a second replay after reloading the final source.
- Ashtami: received three bundles, used three separate Throw buttons, and reached “Three offerings complete.” Morning lighting, disabled fireworks and the unlit decoration were checked. [Completed Anjali](fixes-anjali-complete-844.jpg). The palm origin is verified geometrically; the screenshot shows the completed offering view.
- Navami: started the circle beside Bimal-da, visited Haru-da, took a virtual ginger tea, returned to the existing circle and joined successfully. Leaving restored walking while Dance remained available nearby. [Joined after shopping](fixes-navami-rejoin-after-shop-844.jpg).
- Dashami on the final reloaded source: gathered the six women, inspected paired cheek contact, faced the selected neighbour and exchanged colour. Starting another application and walking away with the joystick cancelled it and disabled Play out of range. [Group and reciprocal approach](fixes-sindoor-player-contact-844.jpg), [disabled away from the group](fixes-sindoor-away-disabled-844.jpg).
- Photos: generated a named postcard, a sari/namaskar portrait and a dhoti-kurta/wave portrait. The actual download-link PNGs were decoded and inspected: distinct 1440 × 1120 images, full avatar and pandal visible, with Dashami cheek colour. Native download completion is not claimed. [Sari export](fixes-portrait-sari-final.png), [dhoti-kurta export](fixes-portrait-dhoti-final.png).
- Orientation: portrait covered the game with the rotation prompt; landscape restored the same open day selector and selected Dashami state. Saptami was then restored with night lighting, available fireworks and hidden ritual controls.
- Final desktop view: arati faces Maa, the original crowd and lighting are restored, and Sound off remains visible. No console warnings or errors were captured during the final replay. [Restored Saptami](fixes-saptami-restored-desktop.jpg).

## Limits

Procedural human models remain stylised and Maa's altar is flat artwork. No physical-phone frame-rate claim is made. Browser-native download-event completion was previously unavailable; exported PNG content is inspected through the actual generated image/link. The chorus is structurally checked and its volume lifecycle mocked, without a listening review. Updating this PR does not update the existing hosted deployment.
