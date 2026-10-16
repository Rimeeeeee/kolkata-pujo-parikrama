import {test} from 'node:test';
import assert from 'node:assert/strict';
import {collageLayout,captionLines,drawAlbumCollage} from '../dist/album-collage.js';

test('collages fit one to 24 complete photos in bounded, non-overlapping canvas tiles',()=>{
 for(let count=1;count<=24;count++){
  const layout=collageLayout(count);assert(layout.width*layout.height<11_000_000);assert.equal(layout.tiles.length,count);
  for(const [i,tile] of layout.tiles.entries()){assert(tile.x>=0&&tile.y>=0);assert(tile.x+tile.width<=layout.width);assert(tile.y+tile.height<=layout.height);for(const other of layout.tiles.slice(i+1))assert(tile.x+tile.width<=other.x||other.x+other.width<=tile.x||tile.y+tile.height<=other.y||other.y+other.height<=tile.y);}
 }
 assert.throws(()=>collageLayout(0));assert.throws(()=>collageLayout(25));
});
test('the PNG collage includes day labels and captions while preserving full photo aspect ratios',async()=>{
 const texts=[],images=[];let encoded=0;const context={fillRect(){},strokeRect(){},fillText(text){texts.push(text);},measureText:text=>({width:Array.from(text).length*11}),drawImage(...args){images.push(args);}},canvas={getContext:()=>context,toDataURL:type=>{assert.equal(type,'image/png');encoded++;return 'data:image/png;base64,collage';}};
 const entries=[{mode:'saptami',kind:'portrait',outfit:'sari',image:'sari',caption:'আমার পুজো'},{mode:'ashtami',kind:'postcard',image:'wide',caption:'Flowers for Maa'}];
 const result=await drawAlbumCollage(canvas,entries,{loadImage:async source=>({width:1440,height:source==='wide'?1060:1120})});assert(result.startsWith('data:image/png'));assert.equal(encoded,1);assert(texts.includes('Saptamir sandhya'));assert(texts.includes('Ashtamir anjali'));assert(texts.includes('আমার পুজো'));assert(texts.includes('Flowers for Maa'));
 for(const args of images){assert.equal(args.length,5,'drawing must fit the full image without source cropping');assert(Math.abs(args[3]/args[4]-args[0].width/args[0].height)<1e-10);}
});
test('caption wrapping bounds long text and a failed photo cannot produce a partial export',async()=>{
 const measure={measureText:text=>({width:Array.from(text).length*10})};const lines=captionLines(measure,'A long memory '.repeat(20),160);assert.equal(lines.length,4);assert(lines.at(-1).endsWith('…'));assert(lines.every(line=>measure.measureText(line).width<=160));
 let exported=false;const context={fillRect(){},fillText(){}},canvas={getContext:()=>context,toDataURL:()=>{exported=true;}};
 await assert.rejects(drawAlbumCollage(canvas,[{mode:'saptami'}],{loadImage:async()=>{throw new Error('Photo failed');}}),/Photo failed/);assert(!exported);
});
