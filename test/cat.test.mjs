import {test} from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from '../dist/assets/three.module.js';
import {BenchCat,CAT_SPOT,canPetCat,CatSound} from '../dist/bench-cat.js';
import fs from 'node:fs/promises';

function fixture(){
 const w={scene:new THREE.Scene(),reduced:false,geometries:{sphere:new THREE.SphereGeometry(1,12,8),cone:new THREE.ConeGeometry(1,1,12),cylinder:new THREE.CylinderGeometry(1,1,1,12)},materials:new Map()};
 w.mesh=(geo,color,pos,scale,parent=w.scene,extra={})=>{const key=color+JSON.stringify(extra);if(!w.materials.has(key))w.materials.set(key,new THREE.MeshStandardMaterial({color,...extra}));const mesh=new THREE.Mesh(typeof geo==='string'?w.geometries[geo]:geo,w.materials.get(key));mesh.position.set(...pos);if(scale)mesh.scale.set(...scale);parent.add(mesh);return mesh;};
 w.ball=(color,pos,scale,parent,extra)=>w.mesh('sphere',color,pos,scale,parent,extra);
 w.cyl=(color,pos,scale,parent,extra)=>w.mesh('cylinder',color,pos,scale,parent,extra);
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
test('petting keeps a soft gaze, shows a stroke, cancels on walking away and respects reduced motion',()=>{
 const {w,cat}=fixture();assert(cat.pet(close,{started:true},0));assert(!cat.pet(close,{started:true},.1));
 cat.update(close,.05,.05,{enabled:true});assert(cat.hand.visible);assert(cat.eyes[0][0].scale.y>.015);
 cat.update({x:0,z:20},.05,.1,{enabled:true});assert(!cat.hand.visible);assert.equal(cat.petLeft,0);
 w.reduced=true;assert(cat.pet(close,{started:true},3));cat.update(close,.05,3.05,{enabled:true});assert(!cat.hand.visible);assert.equal(cat.tail.rotation.y,0);
 cat.update(close,.05,3.1,{enabled:false});assert.equal(cat.petLeft,0);
});

test('the cat smoothly turns toward the visitor from either side and looks up while petted',()=>{
 const {cat}=fixture();
 for(const [x,z] of [[1,0],[-1,0],[0,1],[0,-1]]){
  const viewer=new THREE.Vector3(CAT_SPOT.x+x,1.9,CAT_SPOT.z+z);
  cat.petLeft=0;cat.lastPet=-Infinity;assert(cat.pet(viewer,{started:true},0));
  const before=cat.head.rotation.y;cat.update(viewer,.016,.016,{enabled:true});
  assert(Math.abs(Math.atan2(Math.sin(cat.head.rotation.y-before),Math.cos(cat.head.rotation.y-before)))<.4,'Head should turn without snapping');
  for(let i=1;i<=90;i++)cat.update(viewer,1/60,i/60,{enabled:true});
  cat.head.updateWorldMatrix(true,false);
  const direction=new THREE.Vector3(0,0,1).applyQuaternion(cat.head.getWorldQuaternion(new THREE.Quaternion()));
  const toward=viewer.clone().sub(cat.head.getWorldPosition(new THREE.Vector3())).normalize();
  assert(direction.dot(toward)>.985,'Eyes and muzzle should face the actual visitor');
 }
});

test('hand approaches, contacts the crown behind the eyes, stays attached to the arm and withdraws',()=>{
 const {cat,w}=fixture(),viewer=new THREE.Vector3(CAT_SPOT.x+.9,1.9,CAT_SPOT.z+.65);
 w.camera=new THREE.PerspectiveCamera();w.camera.position.copy(viewer);w.camera.lookAt(CAT_SPOT.x,1,CAT_SPOT.z);
 assert(cat.pet(viewer,{started:true},0));let firstGap,contactGap,lastGap;
 for(let i=1;i<=132;i++){
  cat.update(viewer,1/60,i/60,{enabled:true});
  const gap=cat.palm.position.distanceTo(cat.touchPoint);
  if(i===1)firstGap=gap;if(i===60)contactGap=gap;if(i===130)lastGap=gap;
  if(i>30&&i<105){
   assert(gap<1e-7);const local=cat.head.worldToLocal(cat.palm.position.clone());
   assert(local.z<0&&local.y>.13,'Stroke must stay on the crown, behind the eyes');
  }
  const wrist=cat.forearm.localToWorld(new THREE.Vector3(0,.5,0));assert(wrist.distanceTo(cat.wrist)<1e-7,'Forearm must meet the palm');
 }
 assert(firstGap>.3);assert(contactGap<1e-7);assert(lastGap>.3);
 cat.update(viewer,.02,2.22,{enabled:true});assert(!cat.hand.visible);
});
test('meow is the small licensed original, mute stops it and failed playback is harmless',async()=>{
 const original=globalThis.Audio;let plays=0;
 globalThis.Audio=class{constructor(src){assert.equal(src,'./assets/cat-meow.ogg');this.paused=true;}play(){plays++;this.paused=false;return Promise.resolve();}pause(){this.paused=true;}};
 try{const sound=new CatSound();sound.meow();sound.meow();assert.equal(plays,1);sound.stop();assert(sound.audio.paused);assert.equal(sound.audio.currentTime,0);sound.meow();assert.equal(plays,2);}finally{globalThis.Audio=original;}
 const audio=await fs.readFile('dist/assets/cat-meow.ogg');assert.equal(audio.subarray(0,4).toString(),'OggS');assert(audio.length<20000);
 assert((await fs.readFile('dist/assets/cat-audio-attribution.md','utf8')).includes('Dan Crosby'));
});

test('the petting arm leaves both eyes visible from the visitor throughout contact',()=>{
 for(const [dx,dz] of [[.9,.65],[-.9,.65],[.9,-.65],[-.9,-.65]]){
  const {w,cat}=fixture(),viewer=new THREE.Vector3(CAT_SPOT.x+dx,1.9,CAT_SPOT.z+dz);
  w.camera=new THREE.PerspectiveCamera();w.camera.position.copy(viewer);w.camera.lookAt(CAT_SPOT.x,1,CAT_SPOT.z);
  const ray=new THREE.Raycaster();assert(cat.pet(viewer,{started:true},0));
  for(let i=1;i<=132;i++){
   cat.update(viewer,1/60,i/60,{enabled:true});w.scene.updateMatrixWorld(true);
   if(i<25||i>110)continue;
   for(const [eye] of cat.eyes){const target=eye.getWorldPosition(new THREE.Vector3()),direction=target.clone().sub(viewer),distance=direction.length();ray.set(viewer,direction.normalize());ray.far=distance-.02;
    const hits=ray.intersectObjects(cat.hand.children,true);assert.equal(hits.length,0,`Gaze covered at ${dx},${dz} frame ${i}: ${hits.map(h=>h.object.name||h.object.parent.name).join(',')} wrist=${cat.head.worldToLocal(cat.wrist.clone()).toArray()} elbow=${cat.head.worldToLocal(cat.elbow.clone()).toArray()}`);
   }
  }
 }
});
