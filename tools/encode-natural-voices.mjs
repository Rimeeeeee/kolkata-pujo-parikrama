import {createRequire} from 'node:module';
import {readFile,writeFile,copyFile,mkdir} from 'node:fs/promises';
import {pathToFileURL} from 'node:url';
const require=createRequire(process.argv[2]);
const entry=pathToFileURL(require.resolve('@breezystack/lamejs'));
const {Mp3Encoder}=await import(new URL('./lamejs.js',entry));
const source=new URL('../source-assets/voices-natural/',import.meta.url);
const output=new URL('../dist/assets/voices-natural/',import.meta.url);
await mkdir(output,{recursive:true});
const manifest=JSON.parse(await readFile(new URL('manifest.json',source),'utf8'));
for(const [id,metadata] of Object.entries(manifest.characters)){
 const wav=await readFile(new URL(`${id}.wav`,source));
 if(wav.toString('ascii',0,4)!=='RIFF'||wav.toString('ascii',8,12)!=='WAVE'||wav.readUInt16LE(22)!==1||wav.readUInt16LE(34)!==16)throw Error(`Unsupported PCM WAV: ${id}`);
 const sampleRate=wav.readUInt32LE(24),dataLength=wav.readUInt32LE(40);
 if(wav.toString('ascii',36,40)!=='data'||dataLength+44!==wav.length)throw Error(`Invalid WAV: ${id}`);
 const samples=new Int16Array(dataLength/2);
 for(let i=0;i<samples.length;i++)samples[i]=wav.readInt16LE(44+i*2);
 const encoder=new Mp3Encoder(1,sampleRate,80),chunks=[];
 for(let i=0;i<samples.length;i+=1152){const chunk=encoder.encodeBuffer(samples.subarray(i,i+1152));if(chunk.length)chunks.push(Buffer.from(chunk));}
 const end=encoder.flush();if(end.length)chunks.push(Buffer.from(end));
 const mp3=Buffer.concat(chunks);
 if(mp3.length<2000||mp3[0]!==255||(mp3[1]&224)!==224)throw Error(`Invalid MP3: ${id}`);
 await writeFile(new URL(`${id}.mp3`,output),mp3);
 metadata.file=`assets/voices-natural/${id}.mp3`;metadata.bytes=mp3.length;
 console.log(`${id}: ${mp3.length} bytes`);
}
manifest.encoding={format:'MP3',bitrateKbps:80,channels:1,sampleRate:22050,encoder:'@breezystack/lamejs 1.2.7'};
await writeFile(new URL('manifest.json',output),JSON.stringify(manifest,null,2)+'\n');
await copyFile(new URL('../LICENSE',entry),new URL('LAMEJS-LICENSE.txt',output));
