import {test} from 'node:test';
import assert from 'node:assert/strict';
import {addMotif,applyAlpona,captureAlpona,ART_LIMIT} from '../dist/alpona-corner.js';
test('motifs reject invalid input, stay on the canvas and cap memory use',()=>{const s=[];assert(!addMotif(s,{design:'wrong'}));assert(!addMotif(s,{colour:'wrong'}));assert(!addMotif(s,{x:NaN}));assert(!addMotif(s,{x:-.1}));assert(!addMotif(s,{size:100}));assert(addMotif(s,{size:.3,x:1,y:0}));assert.equal(s[0].x,.85);assert.equal(s[0].y,.15);while(s.length<ART_LIMIT)assert(addMotif(s));assert(!addMotif(s));s.pop();assert(addMotif(s,{design:'conch',colour:'gold'}));assert.equal(s.length,ART_LIMIT);});

test('committing an empty design removes placed art and clears the reusable texture',()=>{
 let clears=0;const context=new Proxy({clearRect(){clears++;}},{get:(o,k)=>o[k]??(()=>{}),set:(o,k,v)=>(o[k]=v,true)}),canvas={getContext:()=>context},map={image:canvas,needsUpdate:false},world={personalAlpona:{visible:false,material:{map}},artStamps:[]};
 const stamps=[];addMotif(stamps);assert(applyAlpona(world,stamps));assert(world.personalAlpona.visible);assert.equal(world.artStamps.length,1);
 map.needsUpdate=false;const before=clears;assert(applyAlpona(world,[]));assert.deepEqual(world.artStamps,[]);assert(!world.personalAlpona.visible);assert.equal(world.personalAlpona.material.map,map);assert(map.needsUpdate);assert(clears>before);assert.throws(()=>captureAlpona(world),/Complete your alpona first/);assert(!applyAlpona(world,null));assert(!applyAlpona(world,[{design:'invalid'}]));assert(!world.personalAlpona.visible);
});
