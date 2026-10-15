# Pujo Parikrama — A Kolkata Evening

**[Play the public experience](https://kolkata-pujo-parikrama.spiffy-zebra-6109.chatgpt.site)**

Explore a fictional North Kolkata neighbourhood during Durga Puja. Walk into the pandal, meet Bengali-speaking neighbours, visit the street stalls, carry a balloon, and play a 3D cork-shooting game.

An original browser-based, stylised 3D North Kolkata Durga Puja evening. Built with vendored Three.js and buildless HTML, CSS and JavaScript. No accounts, payments or backend are needed for gameplay.

Run `node serve.mjs` and open http://127.0.0.1:4173. Run `npm test` for game-state, entrance, scene-construction and interaction checks. Scene tests use the real Three.js scene graph with a renderer stub; they do not validate rendered appearance or device performance.

On Windows, `Start-Pujo.ps1` starts the local Node server in a hidden window and opens the browser. `Stop-Pujo.ps1` stops the process it started. Node.js 18 or newer is required. No dependency installation is needed. Opening `dist/index.html` directly as a file does not work because browser module security requires HTTP.

## Included

Free walking and drag-to-look; mobile arrows; twelve guided places; a short queue-to-entry journey; traditional pandal/courtyard and altar art; an overhead brass jharbati with a clear central view of Maa; animated dhaki and arati priest; visitors taking pictures/praying; seven detailed physical stalls and a balloon seller; separate cha, fuchka, jhalmuri, roll, mishti and flower menus with virtual purchases; any-colour balloons that follow the camera; a true 3D cork-shooting range with moving targets, gravity, swept collision, misses, 12 corks, a 45-second clock starting on the first shot, accuracy/combo scoring and a local best score; Bengali conversations with English translation and bundled male/female speech; real looped dhak audio with mute; personalised downloadable postcards in Bengali or English; keyboard navigation and reduced-motion support.

This is an original fictional para inspired by North Kolkata, not a scan of a real neighbourhood. Characters and architecture are procedural stylised models. Altar artwork is an AI-generated image on a flat plane. Bengali dialogue uses bundled eSpeak NG `bn+m3` male and `bn+f3` female voice variants; these are synthetic/robotic voices, and do not require installed Bengali device voices. Dhak starts after the visitor clicks Begin or Sound because browser autoplay policies require user interaction. Names entered for postcards are drawn locally into the PNG and are not sent to a server. Balloon colours and purchases last for the current page session; best game score uses browser local storage.

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
- Voice assets: original dialogue synthesised offline with eSpeak NG. See [voice notes](docs/voice-assets.md), the bundled manifest and synthesizer license in `dist/assets/voices/`.
