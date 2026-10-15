# Bengali character audio

The 13 MP3 files in `dist/assets/voices-natural/` are generated from the current original Bengali dialogue using Piper 1.8.0 and the rhasspy Bengali Google medium VITS model. Natural neural speech replaces the earlier eSpeak recordings. WAV originals are in `source-assets/voices-natural/`.

Male characters use the lower voice, Indian Bengali source speaker 1010 (Piper ID 7). Female characters use the higher voice, Indian Bengali source speaker 4811 (Piper ID 12). No pitch shifting is applied. The source speaker IDs are verified in Google's OpenSLR 37 Indian Bengali archive. Upstream metadata does not certify performer gender or Kolkata hometown. A local listener must judge how closely the accent matches Kolkata.

The manifest records exact text, source provenance, model SHA-256, synthesis settings, duration and MP3 byte size. Playback is mono 22,050 Hz MP3 at 80 kbps. No synthesis library, model or external voice service runs in the browser. A missing audio file leaves readable Bengali and optional English translation available.

Training data: Google OpenSLR 37, CC BY-SA 4.0, https://www.openslr.org/37/ . The generated assets are distributed under CC BY-SA 4.0. Full attribution, upstream model card including CMU notice, dataset license and encoder license are bundled beside the MP3s. See [voice research](voice-research.md).

To reproduce, prepare an isolated directory containing the model as model.onnx, its model.onnx.json configuration and an installed Piper 1.8.0 Python runtime (optionally in its runtime/ subdirectory). Run `python tools/generate-natural-voices.py /absolute/model-directory`. Install @breezystack/lamejs 1.2.7 separately and run `node tools/encode-natural-voices.mjs /absolute/encoder-tools/package.json`. The dialogue is exported from neighbourhood.js, and synthesis writes original WAVs and metadata to source-assets/voices-natural before MP3 encoding. Preserve the included licenses when redistributing.

The spoken greeting uses the explicit vowel spelling `শুভো` (Shubho); on-screen Bengali retains `শুভ`. The manifest preserves both text and spokenText. Anirban-da uses the lower Indian Bengali source voice.
