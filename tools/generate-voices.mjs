// One-time asset tool, not a browser/runtime dependency.
// Install @echogarden/espeak-ng-emscripten into a separate tools directory, then pass
// that directory's package.json as argv[2]. No API key or secret is required.
import {createRequire} from 'node:module';
import {readFile,writeFile,mkdir,copyFile} from 'node:fs/promises';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {CHARACTERS} from '../dist/neighbourhood.js';
const root=fileURLToPath(new URL('../',import.meta.url));
const require=createRequire(process.argv[2]||new URL('./package.json',import.meta.url));
const modulePath=require.resolve('@echogarden/espeak-ng-emscripten');
const {default:initialize}=await import(pathToFileURL(modulePath));
const module=await initialize();
const espeak=new module.eSpeakNGWorker();
espeak.set_rate(1);espeak.set_pitch(1);espeak.set_range(1);
const dialogue=Object.fromEntries(Object.entries(CHARACTERS).map(([id,character])=>[id,character.bn]));
Object.assign(dialogue,{
 game:'শুভ শারদীয়া! বেলুন ফাটাবে? বারোটা সুযোগ আর পঁয়তাল্লিশ সেকেন্ড। দেখি তোমার নিশানা কেমন!',
 mishti:'শুভ শারদীয়া! নলেন গুড়ের সন্দেশ আর রসগোল্লা নেবে? একটু মিষ্টিমুখ করে যাও।',
 flowers:'শুভ শারদীয়া! মায়ের জন্য ফুল আর মালা নেবে? এই নাও, সুন্দর একটা গাঁদার মালা।',
 fuchka:'শুভ শারদীয়া! টক ঝাল ফুচকা হবে? তোমার জন্য একটা পাতা সাজিয়ে দিই।',
 jhalmuri:'শুভ শারদীয়া! ঝালমুড়ি নেবে? বাদাম আর লেবু দিয়ে মেখে দিচ্ছি।',
 rolls:'শুভ শারদীয়া! গরম গরম পনির রোল হবে? একদম এখনই বানিয়ে দিচ্ছি।'
});
const female=new Set(['neighbour','photographer','mishti','flowers']);
const output=new URL('../dist/assets/voices/',import.meta.url);await mkdir(output,{recursive:true});
const originals=new URL('../source-assets/voices/',import.meta.url);await mkdir(originals,{recursive:true});
const selected=process.argv[3];
const manifest=selected?JSON.parse(await readFile(new URL('manifest.json',output),'utf8')):{generated:'2026-10-15',language:'bn',service:'Offline eSpeak NG formant synthesis',tool:'@echogarden/espeak-ng-emscripten 0.3.5',sampleRate:22050,limitations:'These are deliberately distinct synthetic male and female voice variants, not natural human recordings.',sources:['https://github.com/echogarden-project/espeak-ng-emscripten','https://github.com/espeak-ng/espeak-ng'],characters:{}};
function wav(samples){
 const result=Buffer.alloc(44+samples.length*2);result.write('RIFF',0);result.writeUInt32LE(result.length-8,4);result.write('WAVEfmt ',8);result.writeUInt32LE(16,16);result.writeUInt16LE(1,20);result.writeUInt16LE(1,22);result.writeUInt32LE(22050,24);result.writeUInt32LE(44100,28);result.writeUInt16LE(2,32);result.writeUInt16LE(16,34);result.write('data',36);result.writeUInt32LE(samples.length*2,40);for(let i=0;i<samples.length;i++)result.writeInt16LE(samples[i],44+i*2);return result;
}
for(const [id,text] of Object.entries(dialogue)){
 if(selected&&selected!==id)continue;
 const gender=female.has(id)?'Female':'Male',voice=gender==='Female'?'bn+f3':'bn+m3';
 const chunks=[];
 espeak.set_voice(voice);
 espeak.synthesize(text,samples=>{if(samples?.length)chunks.push(Int16Array.from(samples));});
 const sampleCount=chunks.reduce((n,chunk)=>n+chunk.length,0),samples=new Int16Array(sampleCount);let offset=0;for(const chunk of chunks){samples.set(chunk,offset);offset+=chunk.length;}
 const audio=wav(samples);
 if(audio.length<3000)throw new Error(`Audio for ${id} was unexpectedly small`);
 await writeFile(new URL(`${id}.wav`,originals),audio);
 manifest.characters[id]={voice,gender,text,file:`assets/voices/${id}.wav`,bytes:audio.length,duration:sampleCount/22050};
 console.log(`${id}: ${voice}, ${(sampleCount/22050).toFixed(2)} seconds, ${audio.length} bytes`);
}
await writeFile(new URL('manifest.json',output),JSON.stringify(manifest,null,2)+'\n');
await copyFile(new URL('./COPYING',pathToFileURL(modulePath)),new URL('ESPEAK-NG-LICENSE.txt',output));
console.log(`Saved ${Object.keys(dialogue).length} WAV originals under ${root}source-assets/voices/. Run encode-voices.mjs before publishing.`);
