import pathlib,sys,wave,time,json,hashlib
import subprocess
project=pathlib.Path(__file__).resolve().parents[1]
root=pathlib.Path(sys.argv[1]).resolve()
sys.path.insert(0,str(root/'runtime'))
from piper import PiperVoice,SynthesisConfig
dialogue=json.loads(subprocess.check_output(['node',str(project/'tools/export-dialogue.mjs')],encoding='utf8'))
voice=PiperVoice.load(root/'model.onnx')
output=project/'source-assets/voices-natural'
output.mkdir(exist_ok=True)
manifest={
 'engine':'Piper 1.8.0 / VITS ONNX neural speech',
 'model':'rhasspy/piper-voices: bn/bn_BD/google/medium/bn_BD-google-medium.onnx',
 'modelSha256':hashlib.sha256((root/'model.onnx').read_bytes()).hexdigest(),
 'modelSource':'https://huggingface.co/rhasspy/piper-voices/tree/main/bn/bn_BD/google/medium',
 'trainingData':'Google OpenSLR37 Indian Bengali (bn_IN) source speakers only',
 'trainingDataSource':'https://www.openslr.org/37/',
 'indianSpeakerProvenance':'Source IDs 1010 and 4811 are present as bin_<ID>_*.wav in https://www.openslr.org/resources/37/bn_in.zip; verified by archive central directory on 2026-10-15.',
 'accentVerification':'Indian Bengali training provenance confirmed; Kolkata hometown and Kolkata accent have not been independently certified or reviewed by a native listener.',
 'speakerPresentation':'Lower and higher voices are assigned to male/female characters; upstream metadata does not identify performers gender. No pitch shifting.',
 'generatedAt':'2026-10-15',
 'audioLicense':'CC-BY-SA-4.0',
 'characters':{}
}
for cid,c in dialogue.items():
    sid=12 if c['gender']=='female' else 7
    speaker='4811' if sid==12 else '1010'
    path=output/f'{cid}.wav'
    start=time.time()
    spoken=c.get('speechBn',c['bn'].replace('শুভ','শুভো'))
    with wave.open(str(path),'wb') as wav:
        voice.synthesize_wav(spoken,wav,SynthesisConfig(speaker_id=sid,length_scale=1.0,noise_scale=.667,noise_w_scale=.8))
    with wave.open(str(path),'rb') as wav:duration=wav.getnframes()/wav.getframerate()
    manifest['characters'][cid]={'text':c['bn'],'spokenText':spoken,'pronunciationNote':'Explicit শুভো (Shubho) vowel for Bengali greeting','gender':c['gender'],'voice':f'piper-bn-IN-{speaker}','sourceSpeakerId':speaker,'piperSpeakerId':sid,'duration':round(duration,3),'settings':{'lengthScale':1.0,'noiseScale':.667,'noiseW':.8,'pitchShift':False},'generationSeconds':round(time.time()-start,3),'originalWavBytes':path.stat().st_size}
    print(cid,round(duration,2),flush=True)
(output/'manifest.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n',encoding='utf8')
