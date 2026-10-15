# Bengali character audio

The 13 MP3 files in `dist/assets/voices/` are generated offline from the experience's original Bengali dialogue using **eSpeak NG**, via `@echogarden/espeak-ng-emscripten` version **0.3.5**. Source WAV recordings are retained separately in `source-assets/voices/`.

- Female characters Madhumita-di, Riya, Mitali-di and Bela-di use **`bn+f3`**.
- Male characters use **`bn+m3`**.
- Playback format: mono MP3, 22,050 Hz, 64 kbps, encoded with `@breezystack/lamejs` version **1.2.7**.
- Source format: mono PCM WAV, 22,050 Hz, signed 16-bit samples.
- `manifest.json` records the exact text, voice variant and duration of each file.

These formant voices sound synthetic/robotic. They are bundled recordings, so playback does not require an installed Bengali device voice, a TTS service, a runtime API key, or the generation package.

Reproduce by installing `@echogarden/espeak-ng-emscripten@0.3.5` in an isolated tools directory, then run:

```text
node tools/generate-voices.mjs /absolute/path/to/tools/package.json
```

The generator uses the Bengali character dialogue in `dist/neighbourhood.js`. Existing generated files are overwritten when rerunning it. The package's GPL-3.0 license is preserved in `dist/assets/voices/ESPEAK-NG-LICENSE.txt`. The synthesizer binary is not part of the site's browser runtime.

For MP3 encoding, install `@breezystack/lamejs@1.2.7` into the isolated tools directory and run:

```text
node tools/encode-voices.mjs /absolute/path/to/tools/package.json
```

The encoder prefers source WAVs from `source-assets/voices/`, falling back to `dist/assets/voices/` for the initial conversion. It updates manifest paths and byte sizes while preserving the original text, voice and duration. The MP3s total **1,257,842 bytes**, 81.8% smaller than the WAVs. Its LGPL-3.0 license is preserved in `dist/assets/voices/LAMEJS-LICENSE.txt`. The encoder is not a browser runtime dependency.

Primary sources:

- [eSpeak NG](https://github.com/espeak-ng/espeak-ng)
- [Echogarden's eSpeak NG Emscripten distribution](https://github.com/echogarden-project/espeak-ng-emscripten)
- [Echogarden synthesis API implementation](https://github.com/echogarden-project/echogarden/blob/main/src/synthesis/EspeakTTS.ts)
- [Breezystack lamejs MP3 encoder](https://www.npmjs.com/package/@breezystack/lamejs)

Production note: Microsoft lists natural Bengali India voices `bn-IN-TanishaaNeural` (female) and `bn-IN-BashkarNeural` (male) in its [Speech language support documentation](https://learn.microsoft.com/en-us/azure/ai-services/speech-service/language-support). An attempted offline asset-generation request to the public Edge Read Aloud service returned HTTP 403, so none of those voices are included or claimed here.
