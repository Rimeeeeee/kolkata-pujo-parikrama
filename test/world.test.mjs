import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {pathToFileURL} from 'node:url';
import path from 'node:path';
import {PujaRituals} from '../dist/puja-rituals.js';
import * as THREE from '../dist/assets/three.module.js';

const canvasContext=new Proxy({},{get:(o,k)=>o[k]??(()=>{}),set:(o,k,v)=>(o[k]=v,true)});
globalThis.document={createElement:()=>({width:1024,height:256,getContext:()=>canvasContext}),createElementNS:()=>{const events={};return {width:1536,height:1024,addEventListener:(key,cb)=>events[key]=cb,removeEventListener(){},set src(v){queueMicrotask(()=>events.load?.());}};},fonts:{ready:Promise.resolve()}};
Object.assign(globalThis,{innerWidth:1440,innerHeight:900,devicePixelRatio:1,matchMedia:()=>({matches:false}),addEventListener(){},requestAnimationFrame(){}});
globalThis.MockRenderer=class{setPixelRatio(){}setSize(){}render(scene,camera){scene.updateMatrixWorld(true);camera.updateMatrixWorld(true);assert(scene.children.length>100);assert(camera.isPerspectiveCamera);} };
const source=(await fs.readFile(new URL('../dist/world.js',import.meta.url),'utf8'))
 .replace("'./assets/three.module.js'",JSON.stringify(pathToFileURL(path.resolve('dist/assets/three.module.js')).href))
 .replace("'./game-state.js'",JSON.stringify(pathToFileURL(path.resolve('dist/game-state.js')).href))
 .replace("'./movement.js'",JSON.stringify(pathToFileURL(path.resolve('dist/movement.js')).href))
 .replace("'./scene-life.js'",JSON.stringify(pathToFileURL(path.resolve('dist/scene-life.js')).href))
 .replace("'./pujo-additions.js'",JSON.stringify(pathToFileURL(path.resolve('dist/pujo-additions.js')).href))
 .replace("'./photo-booth.js'",JSON.stringify(pathToFileURL(path.resolve('dist/photo-booth.js')).href))
 .replace("'./alpona.js'",JSON.stringify(pathToFileURL(path.resolve('dist/alpona.js')).href))
 .replace('new THREE.WebGLRenderer(','new globalThis.MockRenderer(');
 const {PujoWorld}=await import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'));
let world,puja,chantCount=0;
test('entire scene builds with real Three.js geometry and all crowd roles',async()=>{
 let ready=false;const canvas={addEventListener(){},setPointerCapture(){}};
 world=new PujoWorld(canvas,{onReady:()=>ready=true,onFail:()=>assert.fail('Scene initialization failed')});
 await new Promise(resolve=>setImmediate(resolve));assert(ready);assert(world.people.length>=60);assert.equal(world.queuePeople.length,9);assert(world.people.some(p=>p.pose==='dhak'));assert(world.people.some(p=>p.pose==='arati'));assert(world.people.filter(p=>p.pose==='photo').length>=2);
 world.scene.traverse(object=>{if(object.geometry){const attribute=object.geometry.attributes.position;for(let i=0;i<attribute.array.length;i++)assert(Number.isFinite(attribute.array[i]),'Mesh geometry must be finite');}assert(object.position.toArray().every(Number.isFinite));});
});
function ritualUntil(phase){for(let i=0;i<500&&puja.state.phase!==phase;i++)world.frame(world.last+50);assert.equal(puja.state.phase,phase);}
test('ritual scene uses a fixed instanced pool and restores the original night lighting',()=>{const count=world.people.length;puja=world.rituals=new PujaRituals(world,{onChant:()=>chantCount++});assert.equal(world.people.length,count);assert.equal(puja.actors.length,12);assert(puja.batches.every(m=>m.isInstancedMesh));assert(puja.actors.every(p=>!p.active));world.startFireworks();puja.setMode('ashtami');assert(!world.fireworks.active);assert(puja.lights.filter(x=>x.o.isPointLight).every(x=>x.o.intensity===0));assert(puja.glows.every(x=>x.o.emissiveIntensity===0));assert(!world.priestLamp.visible);puja.setMode('saptami');assert(world.priestLamp.visible);for(const x of puja.lights)assert.equal(x.o.intensity,x.intensity);for(const x of puja.glows){assert.equal(x.o.emissiveIntensity,x.intensity);assert.equal(x.o.color.getHex(),x.color.getHex());}});
test('daylight keeps ordinary skin and cloth colours, and moving crowd batches remain renderable',()=>{const skin=world.mat('#a77b57'),cloth=world.mat('#b95448'),before=[skin.color.getHex(),cloth.color.getHex()];puja.setMode('ashtami');assert.deepEqual([skin.color.getHex(),cloth.color.getHex()],before);assert(puja.batches.every(m=>!m.frustumCulled));puja.setMode('saptami');});
test('switching away while the priest gives flowers restores arati facing Maa',()=>{world.hasEntered=true;world.camera.position.set(0,2.1,-15.1);puja.setMode('ashtami');puja.action('start',true);ritualUntil('receiving');world.frame(world.last+50);assert(Math.cos(world.priest.g.rotation.y)>0);puja.setMode('saptami');assert.equal(world.priest.g.rotation.y,puja.priestYaw);assert(Math.cos(world.priest.g.rotation.y)<0);});
test('real scene gives three flower bundles, chants three times and lands flowers near Maa',()=>{world.stop();world.hasEntered=true;world.camera.position.set(0,2.1,-15.1);world.yaw=world.pitch=0;puja.setMode('ashtami');assert(puja.action('start',true));assert.equal(puja.actors.filter(p=>p.active).length,5);for(let round=1;round<=3;round++){ritualUntil('ready');assert.equal(puja.state.round,round);assert(puja.handFlowers.visible);assert(puja.action('perform',true));assert(!puja.action('perform',true));ritualUntil(round===3?'complete':'receiving');}assert.equal(chantCount,3);assert.equal(puja.offerings.filter(g=>g.visible).length,3);assert(puja.offerings.every(g=>g.position.z<-21&&g.position.y>3.3&&g.position.y<3.7));assert(!puja.handRig.visible);puja.setMode('saptami');assert.equal(puja.hidden.size,0);assert(!world.people.some(p=>p.ritualHidden));});
test('Navami dance proximity, third-person avatar, movement lock and leave all work',()=>{world.camera.position.set(-4.8,2.1,-6.2);puja.setMode('navami');assert(puja.action('start',true));assert.equal(puja.actors.filter(p=>p.active&&p.role==='dancer').length,5);world.camera.position.set(0,2,20);assert(!puja.action('perform',true));world.camera.position.set(0,2.1,-2.9);assert(puja.action('perform',true));assert.equal(world.renderCamera,puja.camera);assert(world.ritualLocked);world.setMoveInput(1,1);assert.deepEqual(world.moveInput,{right:0,forward:0});const player=puja.actors[11],before=player.body.rotation.z;for(let i=0;i<20;i++)world.frame(world.last+50);assert.notEqual(player.body.rotation.z,before);assert(player.bowls.every(b=>b.visible));puja.leave();assert(!world.ritualLocked);assert.equal(world.renderCamera,null);assert.equal(puja.state.phase,'dancing');});
test('Dashami host, paired women, reciprocal colour and repeated mode cleanup are bounded',()=>{world.camera.position.set(-1.8,2.1,-14.9);puja.setMode('dashami');assert(puja.idolSindoor.visible);assert.equal(puja.actors.filter(p=>p.active).length,1);assert(puja.action('start',true));assert.equal(puja.actors.filter(p=>p.active).length,6);assert(puja.action('perform',true));ritualUntil('playing');assert.equal(puja.state.applied,1);assert(puja.actors.filter(p=>p.active).every(p=>p.marks.visible));world.camera.position.set(0,2,20);assert(!puja.action('perform',true));const people=world.people.length,children=world.scene.children.length;for(let i=0;i<4;i++)for(const mode of ['ashtami','navami','dashami','saptami'])puja.setMode(mode);assert.equal(world.people.length,people);assert.equal(world.scene.children.length,children);assert.equal(puja.hidden.size,0);assert.equal(world.renderCamera,null);assert(!puja.idolSindoor.visible);world.stop();});

test('inactive ritual pools submit zero instances and active pools omit hidden props',()=>{
 puja.setMode('saptami');assert(puja.batches.every(m=>m.count===0&&!m.visible));
 puja.setMode('ashtami');assert(puja.batches.every(m=>m.count===0&&!m.visible));
 world.camera.position.set(-4.8,2.1,-6.2);puja.setMode('navami');puja.action('start',true);puja.update(.05,1);puja.flush();
 const submitted=puja.batches.reduce((n,m)=>n+m.count,0),capacity=puja.batches.reduce((n,m)=>n+m.instanceMatrix.count,0);
 assert(submitted>0&&submitted<capacity);assert(puja.batches.some(m=>!m.visible));
 puja.setMode('saptami');assert(puja.batches.every(m=>m.count===0&&!m.visible));
});
test('each woman can touch her paired neighbour at cheek height',()=>{
 world.camera.position.set(-1.8,2.1,-14.9);puja.setMode('dashami');puja.action('start',true);
 const pairs=[[0,5],[1,2],[3,4]],minimum=Array(6).fill(Infinity);let sample=0;
 for(let t=0;t<12;t+=.05){puja.update(.05,t);sample=0;for(const pair of pairs)for(const [member,index] of pair.entries()){
  const palm=puja.actors[index].armPose.arms[0].palm.getWorldPosition(new THREE.Vector3());
  const cheek=puja.actors[pair[1-member]].marks.children[1].getWorldPosition(new THREE.Vector3());
  minimum[sample]=Math.min(minimum[sample],palm.distanceTo(cheek));sample++;
 }}
 assert(minimum.every(distance=>distance<.04),JSON.stringify(minimum));
 const actor=puja.actors[0];puja.setMode('saptami');for(const arm of actor.armPose.arms)for(const rest of arm.rest){assert(rest.object.position.equals(rest.position));assert(rest.object.quaternion.equals(rest.quaternion));assert(rest.object.scale.equals(rest.scale));}
});
test('reciprocal sindoor reaches the viewer and her cheek, and walking cancels contact',()=>{
 world.camera.position.set(-1.8,2.1,-14.9);world.camera.rotation.set(0,0,0);puja.setMode('dashami');puja.action('start',true);puja.action('perform',true);
 const visitor=puja.sindoorVisitor;for(let i=0;i<18;i++)puja.update(.05,i*.05);
 assert.equal(puja.state.phase,'applying');assert(Math.abs(visitor.g.position.distanceTo(new THREE.Vector3(world.camera.position.x,.4,world.camera.position.z))-.70)<.01);
 const palm=visitor.armPose.arms[0].palm.getWorldPosition(new THREE.Vector3());assert(Math.abs(palm.y-(world.camera.position.y-.04))<.01);assert(palm.distanceTo(world.camera.position)<.15);
 const yourPalm=puja.hands[1].children[0].getWorldPosition(new THREE.Vector3()),cheek=visitor.marks.children[1].getWorldPosition(new THREE.Vector3());assert(yourPalm.distanceTo(cheek)<.01);
 world.camera.position.x+=.2;puja.update(.05,1);assert.equal(puja.state.phase,'playing');assert.equal(puja.state.applied,0);assert(visitor.g.position.equals(visitor.home));puja.setMode('saptami');
});
test('sindoor approach and return keep neighbouring skirts clear without losing cheek contact',()=>{
 const positions=[[-3,-15.2],[-3.05,-15.1],[-1.45,-16.4],[-4.4,-16],[2,-14.2],[3.4,-15],[0,-15.5],[-1.8,-14.9]];
 for(const [x,z] of positions){
  puja.setMode('dashami');world.camera.position.set(...puja.target().position);assert(puja.action('start',true));puja.update(0,0);
  world.camera.position.set(x,2.1,z);world.camera.rotation.set(.4,.25,0,'YXZ');assert(puja.action('perform',true),`${x},${z} must have a safe approach`);
  const visitor=puja.sindoorVisitor,women=puja.actors.filter(p=>p.active);
  for(let frame=0;frame<40;frame++){
   puja.update(.05,frame*.05);
   for(let i=0;i<women.length;i++)for(let j=0;j<i;j++)assert(Math.hypot(women[i].g.position.x-women[j].g.position.x,women[i].g.position.z-women[j].g.position.z)>=.68-1e-8,`${x},${z}: approach must clear skirts`);
   if(frame===17){
    assert.equal(puja.state.phase,'applying');
    const palm=visitor.armPose.arms[0].palm.getWorldPosition(new THREE.Vector3());assert(palm.distanceTo(world.camera.position)<.15);
    const yourPalm=puja.hands[1].children[0].getWorldPosition(new THREE.Vector3()),cheek=visitor.marks.children[1].getWorldPosition(new THREE.Vector3());assert(yourPalm.distanceTo(cheek)<.01);
   }
  }
  assert.equal(puja.state.applied,1);assert(visitor.g.position.equals(visitor.home));
  assert(puja.action('perform',true));puja.update(.05,3);world.camera.position.x+=.06;puja.update(.05,3.05);assert.equal(puja.state.phase,'playing');assert.equal(puja.state.applied,1);assert(visitor.g.position.equals(visitor.home));
 }
 puja.setMode('saptami');
});
test('receiving flowers start at the priest palm after his receiving pose is applied',()=>{
 world.camera.position.set(0,2.1,-15.1);puja.setMode('ashtami');puja.action('start',true);ritualUntil('receiving');
 const palm=puja.priestPalm.getWorldPosition(new THREE.Vector3());assert(palm.distanceTo(puja.flightStart)<.05);assert(puja.flight.position.distanceTo(puja.flightStart)<.01);puja.setMode('saptami');
});
test('reduced-motion dance arms, smoke and paired sindoor poses remain static',()=>{
 const snapshot=()=>puja.actors.filter(p=>p.active).flatMap(p=>[...p.g.position.toArray(),...p.body.position.toArray(),...p.body.rotation.toArray(),...p.arms.flatMap(a=>[...a.rotation.toArray(),...a.children.flatMap(c=>[...c.position.toArray(),...c.quaternion.toArray()])]),...p.bowls.flatMap(b=>b.smoke.flatMap(p=>[...p.position.toArray(),...p.scale.toArray()]))]);
 world.reduced=true;try{for(const mode of ['navami','dashami']){puja.setMode(mode);world.camera.position.set(...puja.target().position);puja.action('start',true);puja.update(.05,1);const before=snapshot();puja.update(.05,9);assert.deepEqual(snapshot(),before);}}finally{world.reduced=false;puja.setMode('saptami');}
});

test('camera tour arrives at destination and cancellation releases pending navigation',async()=>{
 world.hasEntered=true;const movement=world.go([0,2,-6],[0,3,-20]);let now=world.last;for(let i=0;i<180;i++){now+=50;world.frame(now);}await movement;assert(world.camera.position.distanceTo({x:0,y:2,z:-6})<.03);
 let resolved=false;const cancel=world.go([0,2,20],[0,3,-1]).then(()=>resolved=true);world.cancelMove();await cancel;assert(resolved);assert.equal(world.target,null);
});
test('queue lock prevents pointer/walk cancellation until the entry journey finishes',()=>{world.locked=true;world.setKey('w',true);assert.equal(world.keys.size,0);world.locked=false;world.setKey('w',true);assert.equal(world.keys.size,1);world.stop();assert.equal(world.keys.size,0);});

test('joystick walks at 4.2 metres per second, retains analog speed and stops cleanly',()=>{
 world.started=true;world.hasEntered=true;world.target=null;world.yaw=0;
 const run=strength=>{world.stop();world.camera.position.set(0,1.9,25);world.setMoveInput(0,strength);let now=world.last;for(let i=0;i<20;i++){now+=50;world.frame(now);}return 25-world.camera.position.z;};
 assert(Math.abs(run(1)-4.2)<.001);assert(Math.abs(run(.5)-2.1)<.001);
 world.setMoveInput(1,1);assert(Math.abs(Math.hypot(world.moveInput.right,world.moveInput.forward)-1)<1e-10);
 world.stop();const position=world.camera.position.clone();world.frame(world.last+50);assert(world.camera.position.equals(position));
 world.locked=true;world.setMoveInput(0,1);assert.deepEqual(world.moveInput,{right:0,forward:0});world.locked=false;
 world.suspended=true;world.setMoveInput(1,0);assert.deepEqual(world.moveInput,{right:0,forward:0});world.suspended=false;world.started=false;
});
test('bundled audio and altar image have real media file signatures',async()=>{const audio=await fs.readFile('dist/assets/dhak.ogg');assert.equal(audio.subarray(0,4).toString(),'OggS');const png=await fs.readFile('dist/assets/idol.png');assert.equal(png.subarray(1,4).toString(),'PNG');assert(audio.length>400000);assert(png.length>1000000);});
test('six distinct physical stalls include all the requested Kolkata market corners',()=>{const kinds=world.stalls.map(s=>s.userData.kind);assert.equal(kinds.length,6);for(const kind of ['tea','game','fuchka','jhalmuri','mishti','flowers'])assert(kinds.includes(kind));});
test('the overhead jharbati stays above Maa’s face and the central sight line',async()=>{const THREE=await import('../dist/assets/three.module.js');const box=new THREE.Box3().setFromObject(world.chandelier);assert(box.min.y>7.3);assert.equal(world.chandelier.name,'overhead-jharbati');for(const z of [20,2,-7,-16]){const origin=new THREE.Vector3(0,2,z),face=new THREE.Vector3(0,6.45,-21.25),ray=new THREE.Ray(origin,face.clone().sub(origin).normalize());assert.equal(ray.intersectBox(box,new THREE.Vector3()),null);}});
test('the chosen balloon follows the camera, changes colour, fits on phones, and releases',async()=>{const THREE=await import('../dist/assets/three.module.js');world.setCompanionBalloon('#1267bd');const first=world.companionBalloon;assert.equal(first.parent,world.camera);assert.equal(first.children[0].material.color.getHexString(),'1267bd');world.setCompanionBalloon('#edba48');assert.equal(first.parent,null);assert.equal(world.camera.children.filter(c=>c.name==='your-balloon').length,1);world.camera.aspect=.5;world.camera.updateProjectionMatrix();world.frame(performance.now());const p=world.companionBalloon.getWorldPosition(new THREE.Vector3()).project(world.camera);assert(Math.abs(p.x)<.9);world.setCompanionBalloon(null);assert.equal(world.companionBalloon,null);});

test('queue figures advance ahead of the player and entry finishes behind the same neighbour',async()=>{world.camera.position.set(4.7,1.9,15.65);world.hasEntered=false;const first=world.queuePeople.at(-1);let count=9;const pending=world.joinQueue(s=>{assert(s.ahead<=count);count=s.ahead;assert.equal(first,world.queuePeople.at(-1));assert(first.g.position.distanceTo(world.camera.position)>.65);});let now=performance.now();for(let i=0;i<650;i++){now+=50;world.frame(now);}await pending;assert(world.hasEntered);assert(!world.locked);assert.equal(count,0);});
test('stall vendors are raised above lowered counters and decoration detail uses reusable textures',()=>{assert.equal(world.vendorPeople.size,6);for(const p of world.vendorPeople.values())assert(p.g.position.y+1.87>2);assert.equal(world.alponas[0].geometry.parameters.width,6.4);const windows=[];world.scene.traverse(o=>{if(o.name==='khorkhori-window')windows.push(o);});assert.equal(windows.length,8);assert(world.people.filter(p=>p.batched).length>=35);});
test('all guided destinations remain reachable around the expanded crowd',async()=>{const {PLACES}=await import('../dist/game-state.js');world.queueRun=null;world.hasEntered=true;world.camera.position.set(0,2,-5);for(const p of PLACES){const pending=world.go(p.position,p.look);assert(world.target,`${p.id} must have a safe route`);let now=world.last;for(let i=0;i<800&&world.target;i++){now+=50;world.frame(now);for(const o of world.obstacles())assert(Math.hypot(world.camera.position.x-o.x,world.camera.position.z-o.z)>=.32+o.radius+.014,'guided movement must not overlap people');}assert(!world.target,`${p.id} must arrive`);await pending;assert(Math.hypot(world.camera.position.x-p.position[0],world.camera.position.z-p.position[2])<1.9);const id=p.id==='balloons'?'game':p.id,a=world.characterPosition(id);if(a)assert(Math.hypot(world.camera.position.x-a[0],world.camera.position.z-a[2])<=2.65,`${id} seller must be within reach after guided arrival`);}});

test('greeting joins both palms, bows the head and releases the gesture afterwards',()=>{const p=world.characters.get('neighbour');world.greet('neighbour');let now=world.last;for(let i=0;i<20;i++){now+=50;world.frame(now);}assert(p.gesture.visible);assert(p.head.rotation.x>.08);assert(p.palms[0].position.distanceTo(p.palms[1].position)<.07);assert(p.arms.every(a=>!a.visible));for(let i=0;i<100;i++){now+=50;world.frame(now);}assert(!p.gesture.visible);assert(p.arms.every(a=>a.visible));world.conversationId=null;});
test('crowd rigs breathe, look around and walk without overlapping the player',()=>{world.started=true;world.camera.position.set(0,2,20);const p=world.people.find(p=>p.walkPoints);p.walkWait=0;p.walkIndex=1;const before=p.g.position.clone(),head=p.head.rotation.y;let now=world.last;for(let i=0;i<40;i++){now+=50;world.frame(now);}assert(p.g.position.distanceTo(before)>.05);assert.notEqual(p.head.rotation.y,head);assert(p.instances.length>5);assert(Math.hypot(p.g.position.x-world.camera.position.x,p.g.position.z-world.camera.position.z)>.65);});
test('game seller clears the target board and interaction anchors follow actual sellers',async()=>{const THREE=await import('../dist/assets/three.module.js');const board=new THREE.Box3().setFromObject(world.balloonBoard),seller=world.vendorPeople.get('game'),body=new THREE.Box3().setFromObject(seller.g);assert(!body.intersectsBox(board));for(const [id,p] of world.vendorPeople){const a=world.characterPosition(id);assert.equal(a[0],p.g.position.x);assert.equal(a[2],p.g.position.z);}assert.equal(world.taxi.name,'kolkata-ambassador-taxi');assert.equal(world.streetLamps.length,8);});
test('full altar image fits beneath the canopy and fireworks use one fixed particle pool',()=>{assert(world.altar);assert.equal(world.altar.geometry.parameters.width,12);assert.equal(world.altar.position.y+world.altar.geometry.parameters.height/2,8.25);const pool=world.fireworks.positions;world.startFireworks();let now=world.last;for(let i=0;i<100;i++){now+=50;world.frame(now);}assert.equal(world.fireworks.positions,pool);assert(pool.every(Number.isFinite));assert(pool.some((v,i)=>i%3===1&&v>12));world.stopFireworks();assert(!world.fireworks.points.visible);});

test('the priest never greets or turns away from Maa; Arjun stays ahead of the line',()=>{assert(world.volunteer.g.position.z<world.queuePeople[0].home.z);world.conversationId=null;world.greet('priest');assert.equal(world.conversationId,null);let now=world.last;for(let i=0;i<120;i++){now+=50;world.frame(now);}const p=world.priest,dx=-p.g.position.x,dz=-21.25-p.g.position.z;assert((Math.sin(p.g.rotation.y)*dx+Math.cos(p.g.rotation.y)*dz)/Math.hypot(dx,dz)>.99);assert(p.nonInteractable);assert(!p.gesture);});
test('additions reuse floor art and keep non-interactive performers separate',()=>{assert.equal(world.extraDhakis.length,2);assert(world.extraDhakis.every(p=>p.nonInteractable&&p.pose==='dhak'));assert(world.conchPerson.nonInteractable);assert(world.addedAlponas.length>=60);assert.equal(world.alponaBatches.length,6);assert.equal(world.alponaBatches.reduce((n,m)=>n+m.count,0),world.alponas.length+world.addedAlponas.length);assert.equal(new Set(world.addedAlponas.map(m=>m.material)).size,6);assert(world.addedAlponas.some(m=>m.position.z<0));for(const m of world.addedAlponas){assert.equal(m.geometry,world.alponas[0].geometry);assert(world.alponaPalette.includes(m.material));assert.equal(m.material.toneMapped,false);assert.equal(m.position.y,m.position.z<0?.408:.035);}for(const p of [...world.extraDhakis,world.conchPerson])for(const other of world.people.filter(o=>o!==p))assert(Math.hypot(p.g.position.x-other.g.position.x,p.g.position.z-other.g.position.z)>p.radius+other.radius);});
test('portrait framing keeps the pandal and avatar; wave points away from the face',async()=>{const THREE=await import('../dist/assets/three.module.js');const {setPortrait}=await import('../dist/photo-booth.js');world.scene.updateMatrixWorld(true);for(const x of [-10.8,10.8])for(const y of [.2,11.9]){const p=new THREE.Vector3(x,y,0).project(world.portraitCamera);assert(Math.abs(p.x)<.96&&Math.abs(p.y)<.96);}const count=world.people.length;for(const outfit of ['sari','dhoti'])for(const pose of ['namaskar','wave','relaxed']){const p=setPortrait(world,{outfit,pose});assert.equal(world.people.length,count);assert(!p.g.visible);if(pose==='wave'){p.g.updateMatrixWorld(true);const hand=p.arms[1].children.at(-1).getWorldPosition(new THREE.Vector3());assert(hand.x>.32);}}});
