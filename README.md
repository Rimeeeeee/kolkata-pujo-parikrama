# Pujo Parikrama — A Kolkata Evening

**[Play the public experience](https://kolkata-pujo-parikrama.spiffy-zebra-6109.chatgpt.site)**

An original browser-based, stylised 3D North Kolkata Durga Puja evening. Built with vendored Three.js and buildless HTML, CSS and JavaScript. No accounts, payments or backend are needed for gameplay.

Run `node serve.mjs` and open http://127.0.0.1:4173. Run `npm test` for game-state, entrance, scene-construction and interaction checks. Scene tests use the real Three.js scene graph with a renderer stub; they do not validate rendered appearance or device performance.

On Windows, `Start-Pujo.ps1` starts the local Node server in a hidden window and opens the browser. `Stop-Pujo.ps1` stops the process it started. Node.js 18 or newer is required. No dependency installation is needed. Opening `dist/index.html` directly as a file does not work because browser module security requires HTTP.

## Included

Free walking and drag-to-look; mobile arrows; eleven guided places; a moving nine-person queue with preserved order, collision avoidance and no shopping while waiting; traditional pandal/courtyard and altar art; an overhead brass jharbati with a clear central view of Maa; animated dhaki and arati priest; visitors taking pictures/praying; six detailed physical stalls and a balloon seller; separate cha, fuchka, jhalmuri, mishti and three sizes of phuler jhuri with virtual purchases; any-colour balloons that follow the camera, fixed after purchase for the browser visit; a true 3D cork-shooting range with moving targets, gravity, swept collision, misses, 12 corks, a 45-second clock starting on the first shot, accuracy/combo scoring and a local best score; Bengali conversations with English translation and bundled male/female speech; real looped dhak audio with mute; personalised downloadable postcards in Bengali or English; keyboard navigation and reduced-motion support.

This is an original fictional para inspired by North Kolkata, not a scan of a real neighbourhood. Characters and architecture are procedural stylised models. Altar artwork is an AI-generated image on a flat plane. Bengali dialogue uses bundled Piper neural speech with two Indian Bengali source speakers for separate male/female character voices. Exact Kolkata accent has not been independently certified; see docs/voice-research.md. No TTS account, model download or API key is needed by visitors. Dhak starts after the visitor clicks Begin or Sound because browser autoplay policies require user interaction. Names entered for postcards are drawn locally into the PNG and are not sent to a server. Balloon colours persist through reloads using sessionStorage for the browser visit; other purchases last for the current page session; best game score uses browser local storage.

## Validation

Run `npm test`: navigation, projectile hit/miss and timer/scoring tests; actual Three.js scene and range simulations with a renderer stub; jharbati sight-line regression; companion balloon geometry and phone framing; non-silent male/female WAV and dialogue consistency; menu, colour purchase, translation and signed-postcard integration. These checks do not replace a visual browser or physical-device performance review.

## Reference and asset credits

- First-person experience reference: https://frontiers.azfuller.com/ . Inspected page source and original preview image; no code or artwork copied.
- UNESCO: https://ich.unesco.org/en/RL/durga-puja-in-kolkata-00703
- UNESCO photographic references: https://ich.unesco.org/en/8b-representative-list-01191?call=slideshow&id=00703&include=slideshow_inc.php&mode=scroll&width=620
- West Bengal Tourism: https://www.wbtourism.gov.in/durgapuja
- `dist/assets/dhak.ogg`: Tito Dutta, *Puja dhak*, 3 October 2011. Original recording from https://commons.wikimedia.org/wiki/File:Puja_dhak.ogg . CC BY-SA 3.0: https://creativecommons.org/licenses/by-sa/3.0/ . Audio is unchanged and played in a loop; this attribution applies to the recording. Original download included in credits.
- `dist/assets/three.module.js`: Three.js r160, MIT license: https://github.com/mrdoob/three.js/blob/r160/LICENSE
- `dist/assets/idol.png`: generated with built-in OpenAI ImageGen. Prompt: “Front-facing traditional Bengali sabeki ekchala Durga idol ensemble in a warmly lit red and cream thakur dalan altar. Central ten-armed Durga in red sari with ornate white shola daker saaj; lion and Mahishasura below; Lakshmi and Ganesha left, Saraswati and Kartik right. Complete symmetrical ensemble, marigold garlands, altar steps, detailed sculptural clay and textiles, reverent hand-crafted rendering. Landscape 3:2. No people, text, UI, watermark, perspective skew, or low-poly style.”
- Fonts: Cormorant Garamond, DM Sans and Noto Serif Bengali, Google Fonts; system fallbacks work if external fonts are blocked.
- Voice assets: original dialogue synthesised offline using Piper and Indian Bengali Google recordings (CC BY-SA 4.0). See [voice notes](docs/voice-assets.md), the bundled manifest and synthesizer license in `dist/assets/voices-natural/`.

## October 2026 refinement

More than 60 visitors and stallkeepers, with static visitors and street components instanced to reduce draw calls. Pixel ratio is capped at 1.25 on narrow screens and 1.5 otherwise. Khorkhori shutters now face into the courtyard, with louver textures, handles, layered frames, arched fanlights and iron spokes. Alpona reaches 6.4 metres across, using one transparent texture per design. Shop counters are lower and vendors stand on raised platforms. The roll counter is removed.

Courtyard and alpona study: [Orange Wayfarer's own Kolkata Bonedi Bari photo walk](https://www.orangewayfarer.com/bonedi-barir-durga-puja-of-kolkata-photo-walk/). Reference photographs are not redistributed. This remains stylised procedural art, not a photorealistic reconstruction. No browser/GPU was available for this revision; device frame rate and rendered appearance remain unverified. Automated checks use real Three.js geometry, navigation, crowd clearance, queue order, transactions, audio content and game simulation with a renderer stub.

## Nearby conversations and a living street

Conversation markers attach to the actual character, not to the shop banner, and appear only within 2.65 scene metres. Conversation, menu, purchase, voice and shooting-range entry handlers also check proximity. Guided shop visits stop beside the seller. Purchases are rechecked even if a previously opened menu button is activated after leaving. The companion balloon remains visible in 3D without a bottom-of-screen colour label.

Characters breathe, turn their heads, shift weight and move their arms; three neighbours take short collision-aware walks. Walkers pause during guided navigation and conversations. Male walking rigs swing the legs as they step. Greeting characters face the visitor, bow slightly and press both palms together for a namaskar. Instanced visitors update at 24 Hz to keep draw calls low. Reduced motion disables idle/walking animation and makes the fireworks a still display.

The fairground attendant stands alongside the target board with no bounding-box overlap. The taxi has an original rounded Ambassador-inspired body, yellow paint, blue side stripe, round headlights, chrome grille and a fictional West Bengal plate. Design reference: [original Kolkata taxi photograph on Wikimedia Commons](https://commons.wikimedia.org/wiki/File:Hindustan_Ambassador_taxi_(Ambassador_Taxis_in_Kolkata).JPG); the photograph itself is not redistributed.

The reverse street view includes buildings, eight two-headed street lamps and more festive strings. The Fireworks control takes the visitor to a street view; Back to Puja restores the previous view. Fireworks use a fixed pool of 576 particles in a single Points object and stop when returning. The altar image is smaller, keeps its original aspect ratio and sits entirely below the canopy, with painted side surrounds and a gold top border bridging it to the architecture.

Verification includes distance boundaries, stale purchase buttons, live seller anchors, all guided routes, human rig/instance updates, namaskar palms, attendant/board clearance, altar bounds and fixed fireworks memory. Browser rendering and real-device frame rate remain unverified because no browser surface was available.

## Targeted additions, 16 October 2026

The restored layout, original character proportions, materials, rigging and crowd batching are retained. New floor decorations reuse the original alpona artwork. Two non-interactive dhakis and a woman holding/blowing a shankha stand along the courtyard sides; the existing male neighbour now also has a greeting. Small face/hand details apply inside the pandal only. Arjun remains ahead of the line, and the entrance place stops near him; joining walks to the true tail. The priest continues facing Maa when interacted with.

Dress up & pose is available from Explore places or the existing Postcard dialog, without adding another footer control. A tripod marks the photo location and has a collision boundary. The isolated photo dialog offers sari/dhoti kurta, three poses and an optional name. A dedicated camera renders a complete avatar with the full pandal behind it into a downloadable PNG. The export keeps the full landscape composition without cropping. It uses a virtual avatar; no personal photo or upload is required.

The regenerated speech uses an explicit Shubho vowel; the on-screen spelling is unchanged. The speech URL includes a pronunciation revision so cached audio is refreshed.

Visual QA was performed in the in-app browser at the normal viewport and a 390 × 844 phone viewport. Exported sari and dhoti PNGs were inspected; this caught and corrected an inward wave arm and low-contrast dialog text. Native download-event reporting timed out in the in-app browser, so validation extracted and inspected the exact PNG linked by the download control instead. See [sari portrait](docs/qa/portrait-sari.png), [dhoti portrait](docs/qa/portrait-dhoti.png) and [phone dialog](docs/qa/photo-mobile.jpg). Automated checks also cover separation, queue order, proximity, guided navigation and ritual orientation.
