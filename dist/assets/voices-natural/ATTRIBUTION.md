# Bengali neural dialogue

Original dialogue written for Kolkata Pujo Parikrama, synthesised offline using Piper 1.8.0 and the rhasspy/piper-voices Bengali Google medium VITS model. These are generated recordings, not recordings of the performers saying this dialogue.

Model: https://huggingface.co/rhasspy/piper-voices/tree/main/bn/bn_BD/google/medium

The model includes Indian and Bangladesh Bengali speakers. Only source speakers 1010 (Piper ID 7) and 4811 (ID 12), verified in the Indian Bengali archive, were used here. Lower and higher voices represent male and female characters respectively; performer gender and an exact Kolkata accent are not certified by upstream metadata. No pitch shifting was applied.

Google collected the Bengali training recordings, published as OpenSLR 37 under Creative Commons Attribution-ShareAlike 4.0. Source: https://www.openslr.org/37/ . Dataset authors: Keshan Sodimana, Knot Pipatsrisawat, Linne Ha, Martin Jansche, Oddur Kjartansson, Pasindu De Silva and Supheakmungkol Sarin (2018).

The resulting voice assets are offered under CC BY-SA 4.0. See GOOGLE-CC-BY-SA-4.0.txt. The upstream model card, including its additional Carnegie Mellon University notice, is preserved in MODEL_CARD.txt. Original WAVs are available in the public repository under source-assets/voices-natural. MP3 conversion uses @breezystack/lamejs 1.2.7; its LGPL notice is included. No model or synthesizer runs in the browser.

This attribution also covers `../joy-maa-durga-chorus.wav`: four original syntheses of “জয় মা দুর্গা!” using the same source speakers, mixed with staggered starts and varied speaking rates. No pitch shifting was applied. Processing, model hash and duration are recorded in `../ritual-audio.json`; reproduction is provided in `tools/generate-ritual-chorus.py` in the public repository.
