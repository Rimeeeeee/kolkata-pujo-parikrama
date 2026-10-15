import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {pathToFileURL} from 'node:url';
import path from 'node:path';

const canvasContext={clearRect(){},fillRect(){},strokeRect(){},fillText(){}};
globalThis.document={createElement:()=>({width:1024,height:256,getContext:()=>canvasContext}),createElementNS:()=>{const events={};return {width:1536,height:1024,addEventListener:(key,cb)=>events[key]=cb,removeEventListener(){},set src(v){queueMicrotask(()=>events.load?.());}};},fonts:{ready:Promise.resolve()}};
Object.assign(globalThis,{innerWidth:1440,innerHeight:900,devicePixelRatio:1,matchMedia:()=>({matches:false}),addEventListener(){},requestAnimationFrame(){}});
globalThis.MockRenderer=class{setPixelRatio(){}setSize(){}render(scene,camera){scene.updateMatrixWorld(true);camera.updateMatrixWorld(true);assert(scene.children.length>100);assert(camera.isPerspectiveCamera);} };
const source=(await fs.readFile(new URL('../dist/world.js',import.meta.url),'utf8'))
 .replace("'./assets/three.module.js'",JSON.stringify(pathToFileURL(path.resolve('dist/assets/three.module.js')).href))
 .replace("'./game-state.js'",JSON.stringify(pathToFileURL(path.resolve('dist/game-state.js')).href))
 .replace('new THREE.WebGLRenderer(','new globalThis.MockRenderer(');
const {PujoWorld}=await import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'));
let world;
test('entire scene builds with real Three.js geometry and all crowd roles',async()=>{
 let ready=false;const canvas={addEventListener(){},setPointerCapture(){}};
 world=new PujoWorld(canvas,{onReady:()=>ready=true,onFail:()=>assert.fail('Scene initialization failed')});
 await new Promise(resolve=>setImmediate(resolve));assert(ready);assert(world.people.length>=25);assert.equal(world.queuePeople.length,7);assert(world.people.some(p=>p.pose==='dhak'));assert(world.people.some(p=>p.pose==='arati'));assert(world.people.filter(p=>p.pose==='photo').length>=2);
 world.scene.traverse(object=>{if(object.geometry){const attribute=object.geometry.attributes.position;for(let i=0;i<attribute.array.length;i++)assert(Number.isFinite(attribute.array[i]),'Mesh geometry must be finite');}assert(object.position.toArray().every(Number.isFinite));});
});
test('camera tour arrives at destination and cancellation releases pending navigation',async()=>{
 const movement=world.go([0,2,-6],[0,3,-20]);let now=performance.now();for(let i=0;i<180;i++){now+=50;world.frame(now);}await movement;assert(world.camera.position.distanceTo({x:0,y:2,z:-6})<.03);
 let resolved=false;const cancel=world.go([0,2,20],[0,3,-1]).then(()=>resolved=true);world.cancelMove();await cancel;assert(resolved);assert.equal(world.target,null);
});
test('queue lock prevents pointer/walk cancellation until the entry journey finishes',()=>{world.locked=true;world.setKey('w',true);assert.equal(world.keys.size,0);world.locked=false;world.setKey('w',true);assert.equal(world.keys.size,1);world.stop();assert.equal(world.keys.size,0);});
test('bundled audio and altar image have real media file signatures',async()=>{const audio=await fs.readFile('dist/assets/dhak.ogg');assert.equal(audio.subarray(0,4).toString(),'OggS');const png=await fs.readFile('dist/assets/idol.png');assert.equal(png.subarray(1,4).toString(),'PNG');assert(audio.length>400000);assert(png.length>1000000);});
test('seven distinct physical stalls include all the requested Kolkata market corners',()=>{const kinds=world.stalls.map(s=>s.userData.kind);assert.equal(kinds.length,7);for(const kind of ['tea','game','fuchka','jhalmuri','rolls','mishti','flowers'])assert(kinds.includes(kind));});
test('the overhead jharbati stays above Maa’s face and the central sight line',async()=>{const THREE=await import('../dist/assets/three.module.js');const box=new THREE.Box3().setFromObject(world.chandelier);assert(box.min.y>7.3);assert.equal(world.chandelier.name,'overhead-jharbati');for(const z of [20,2,-7,-16]){const origin=new THREE.Vector3(0,2,z),face=new THREE.Vector3(0,7.1,-21.25),ray=new THREE.Ray(origin,face.clone().sub(origin).normalize());assert.equal(ray.intersectBox(box,new THREE.Vector3()),null);}});
test('the chosen balloon follows the camera, changes colour, fits on phones, and releases',async()=>{const THREE=await import('../dist/assets/three.module.js');world.setCompanionBalloon('#1267bd');const first=world.companionBalloon;assert.equal(first.parent,world.camera);assert.equal(first.children[0].material.color.getHexString(),'1267bd');world.setCompanionBalloon('#edba48');assert.equal(first.parent,null);assert.equal(world.camera.children.filter(c=>c.name==='your-balloon').length,1);world.camera.aspect=.5;world.camera.updateProjectionMatrix();world.frame(performance.now());const p=world.companionBalloon.getWorldPosition(new THREE.Vector3()).project(world.camera);assert(Math.abs(p.x)<.9);world.setCompanionBalloon(null);assert.equal(world.companionBalloon,null);});
