import {test} from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from '../dist/assets/three.module.js';
import {BenchCat,CAT_SPOT,canPetCat,CatSound} from '../dist/bench-cat.js';
import fs from 'node:fs/promises';

function fixture(){
 const w={scene:new THREE.Scene(),reduced:false,geometries:{sphere:new THREE.SphereGeometry(1,12,8),cone:new THREE.ConeGeometry(1,1,12),cylinder:new THREE.CylinderGeometry(1,1,1,12)},materials:new Map()};
 w.mesh=(geo,color,pos,scale,parent=w.scene,extra={})=>{const key=color+JSON.stringify(extra);if(!w.materials.has(key))w.materials.set(key,new THREE.MeshStandardMaterial({color,...extra}));const mesh=new THREE.Mesh(typeof geo==='string'?w.geometries[geo]:geo,w.materials.get(key));mesh.position.set(...pos);if(scale)mesh.scale.set(...scale);parent.add(mesh);return mesh;};
 w.ball=(color,pos,scale,parent,extra)=>w.mesh('sphere',color,pos,scale,parent,extra);
 w.rod=(a,b,r,color,parent)=>{const p=new THREE.Vector3(...a),q=new THREE.Vector3(...b),d=q.clone().sub(p),m=w.mesh('cylinder',color,p.add(q).multiplyScalar(.5).toArray(),[r,d.length(),r],parent);m.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),d.normalize());return m;};
 return {w,cat:new BenchCat(w)};
}
const close={x:CAT_SPOT.x+1,z:CAT_SPOT.z};
test('pet action requires proximity and rejects queue, modal, camera and travelling states',()=>{
 assert(canPetCat(close,{started:true}));assert(!canPetCat({x:0,z:20},{started:true}));
 for(const flag of ['inputPaused','queuing','renderCamera','travelling'])assert(!canPetCat(close,{started:true,[flag]:true}));
 assert(!canPetCat(close));assert(!canPetCat(null,{started:true}));
});
test('cat rests on the existing plank, has a visible collar bell and keeps bounded geometry',()=>{
 const {w,cat}=fixture(),bounds=new THREE.Box3().setFromObject(cat.group);
 assert(bounds.min.y>=CAT_SPOT.y-.002);assert(bounds.max.y<1.3);
 assert(bounds.min.x>-8.08&&bounds.max.x<-7.52);assert(bounds.min.z>9&&bounds.max.z<9.9);
 assert(cat.group.getObjectByName('cat-collar-bell'));assert.equal(w.scene.children.length,2);
 const objects=[];cat.group.traverse(o=>objects.push(o));assert(objects.length<65);
 for(let i=0;i<500;i++)cat.update(close,.05,i*.05,{enabled:true});assert.equal(w.scene.children.length,2);
});
test('approach meows once, has hysteresis and cooldown, and never triggers while blocked',()=>{
 const {cat}=fixture();assert(!cat.update(close,.05,0,{enabled:false}));
 assert(cat.update(close,.05,1,{enabled:true}));assert(!cat.update(close,.05,2,{enabled:true}));
 cat.update({x:0,z:20},.05,3,{enabled:true});assert(!cat.update(close,.05,4,{enabled:true}));
 cat.update({x:0,z:20},.05,14,{enabled:true});assert(cat.update(close,.05,15,{enabled:true}));
});
test('petting closes the eyes, shows a stroke, cancels on walking away and respects reduced motion',()=>{
 const {w,cat}=fixture();assert(cat.pet(close,{started:true},0));assert(!cat.pet(close,{started:true},.1));
 cat.update(close,.05,.05,{enabled:true});assert(cat.hand.visible);assert(cat.eyes[0][0].scale.y<.01);
 cat.update({x:0,z:20},.05,.1,{enabled:true});assert(!cat.hand.visible);assert.equal(cat.petLeft,0);
 w.reduced=true;assert(cat.pet(close,{started:true},3));cat.update(close,.05,3.05,{enabled:true});assert(!cat.hand.visible);assert.equal(cat.tail.rotation.y,0);
 cat.update(close,.05,3.1,{enabled:false});assert.equal(cat.petLeft,0);
});
test('meow is the small licensed original, mute stops it and failed playback is harmless',async()=>{
 const original=globalThis.Audio;let plays=0;
 globalThis.Audio=class{constructor(src){assert.equal(src,'./assets/cat-meow.ogg');this.paused=true;}play(){plays++;this.paused=false;return Promise.resolve();}pause(){this.paused=true;}};
 try{const sound=new CatSound();sound.meow();sound.meow();assert.equal(plays,1);sound.stop();assert(sound.audio.paused);assert.equal(sound.audio.currentTime,0);sound.meow();assert.equal(plays,2);}finally{globalThis.Audio=original;}
 const audio=await fs.readFile('dist/assets/cat-meow.ogg');assert.equal(audio.subarray(0,4).toString(),'OggS');assert(audio.length<20000);
 assert((await fs.readFile('dist/assets/cat-audio-attribution.md','utf8')).includes('Dan Crosby'));
});
