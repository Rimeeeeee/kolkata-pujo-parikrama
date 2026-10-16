import sys, pathlib, wave, json, hashlib
project=pathlib.Path(__file__).resolve().parents[1]
root=pathlib.Path(sys.argv[1]).resolve()
sys.path.insert(0,str(root/'runtime'))
import numpy as np
from piper import PiperVoice,SynthesisConfig
voice=PiperVoice.load(root/'model.onnx')
layers=[]
for index,(speaker,length,delay,gain) in enumerate([(7,1.0,0,.30),(12,1.02,.055,.30),(7,1.08,.12,.22),(12,.96,.18,.22)]):
    output=root/f'chorus-{index}.wav'
    with wave.open(str(output),'wb') as wav:
        voice.synthesize_wav('জয় মা দুর্গা!',wav,SynthesisConfig(speaker_id=speaker,length_scale=length,noise_scale=.667,noise_w_scale=.8))
    with wave.open(str(output),'rb') as wav:
        rate=wav.getframerate();samples=np.frombuffer(wav.readframes(wav.getnframes()),dtype=np.int16).astype(np.float64)
    layers.append((int(delay*rate),samples*gain))
mix=np.zeros(max(start+len(samples) for start,samples in layers)+int(rate*.15))
for start,samples in layers:mix[start:start+len(samples)]+=samples
peak=np.max(np.abs(mix));mix*=28000/max(peak,1)
out=project/'dist'/'assets'
with wave.open(str(out/'joy-maa-durga-chorus.wav'),'wb') as wav:
    wav.setnchannels(1);wav.setsampwidth(2);wav.setframerate(rate);wav.writeframes(mix.astype(np.int16).tobytes())
(out/'ritual-audio.json').write_text(json.dumps({'text':'জয় মা দুর্গা!','romanized':'Joy Maa Durga!','engine':'Piper 1.8.0','model':'rhasspy/piper-voices bn_BD-google-medium','modelSha256':hashlib.sha256((root/'model.onnx').read_bytes()).hexdigest(),'sourceSpeakers':['1010','4811'],'layers':4,'processing':'Four original syntheses with staggered entries and different speaking rates; mixed and peak-normalized. No pitch shifting.','sampleRate':rate,'duration':round(len(mix)/rate,3),'license':'CC-BY-SA-4.0','attribution':'See voices-natural/ATTRIBUTION.md and GOOGLE-CC-BY-SA-4.0.txt'},ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
print('Chorus generated:',round(len(mix)/rate,2),'seconds; peak',int(np.max(np.abs(mix))))
