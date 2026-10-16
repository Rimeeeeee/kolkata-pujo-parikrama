import {test} from 'node:test';
import assert from 'node:assert/strict';
import {addMotif,ART_LIMIT} from '../dist/alpona-corner.js';
test('motifs reject invalid input, stay on the canvas and cap memory use',()=>{const s=[];assert(!addMotif(s,{design:'wrong'}));assert(!addMotif(s,{colour:'wrong'}));assert(!addMotif(s,{x:NaN}));assert(!addMotif(s,{x:-.1}));assert(!addMotif(s,{size:100}));assert(addMotif(s,{size:.3,x:1,y:0}));assert.equal(s[0].x,.85);assert.equal(s[0].y,.15);while(s.length<ART_LIMIT)assert(addMotif(s));assert(!addMotif(s));s.pop();assert(addMotif(s,{design:'conch',colour:'gold'}));assert.equal(s.length,ART_LIMIT);});
