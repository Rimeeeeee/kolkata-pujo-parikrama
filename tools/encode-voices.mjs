// One-time encoder. Install @breezystack/lamejs@1.2.7 in a separate directory,
// then pass that directory's package.json as argv[2]. No browser dependency.
import {createRequire} from 'node:module';
import {readFile,writeFile,copyFile,access} from 'node:fs/promises';
import {pathToFileURL} from 'node:url';
const require=createRequire(process.argv[2]||new URL('./package.json',import.meta.url));
const entry=pathToFileURL(require.resolve('@breezystack/lamejs'));
const {Mp3Encoder}=await import(new URL('./lamejs.js',entry));
const output=new URL('../dist/assets/voices/',import.meta.url);
const source=new URL('../source-assets/voices/',import.meta.url);
const manifest=JSON.parse(await readFile(new URL('manifest.json',output),'utf8'));
let total=0,original=0;
for(const [id,metadata] of Object.entries(manifest.characters)){
 let input=new URL(`${id}.wav`,source);
 try{await access(input);}catch{input=new URL(`${id}.wav`,output);}
 const wav=await readFile(input);
 if(wav.toString('ascii',0,4)!=='RIFF'||wav.toString('ascii',8,12)!=='WAVE'||wav.readUInt16LE(22)!==1||wav.readUInt16LE(34)!==16)throw Error(`Unsupported PCM WAV: ${id}`);
 const sampleRate=wav.readUInt32LE(24),dataLength=wav.readUInt32LE(40);
 if(wav.toString('ascii',36,40)!=='data'||dataLength+44!==wav.length)throw Error(`Invalid WAV: ${id}`);
 const samples=new Int16Array(dataLength/2);
 for(let i=0;i<samples.length;i++)samples[i]=wav.readInt16LE(44+i*2);
 const encoder=new Mp3Encoder(1,sampleRate,64),chunks=[];
 for(let i=0;i<samples.length;i+=1152){const chunk=encoder.encodeBuffer(samples.subarray(i,i+1152));if(chunk.length)chunks.push(Buffer.from(chunk));}
 const end=encoder.flush();if(end.length)chunks.push(Buffer.from(end));
 const mp3=Buffer.concat(chunks);
 if(mp3.length<2000||mp3[0]!==255||(mp3[1]&224)!==224)throw Error(`Invalid MP3: ${id}`);
 await writeFile(new URL(`${id}.mp3`,output),mp3);
 metadata.originalWavBytes=wav.length;metadata.file=`assets/voices/${id}.mp3`;metadata.bytes=mp3.length;
 total+=mp3.length;original+=wav.length;console.log(`${id}: ${mp3.length} bytes`);
}
manifest.encoding={format:'MP3',bitrateKbps:64,channels:1,sampleRate:22050,encoder:'@breezystack/lamejs 1.2.7'};
await writeFile(new URL('manifest.json',output),JSON.stringify(manifest,null,2)+'\n');
await copyFile(new URL('../LICENSE',entry),new URL('LAMEJS-LICENSE.txt',output));
console.log(`TOTAL: ${total} MP3 bytes; original ${original} WAV bytes; ${(100*(1-total/original)).toFixed(1)}% smaller`);
