import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {pathToFileURL} from 'node:url';
import path from 'node:path';
import {PujaRituals} from '../dist/puja-rituals.js';
import {clearSegment} from '../dist/movement.js';
import {updatePeople} from '../dist/scene-life.js';
import * as THREE from '../dist/assets/three.module.js';

const canvasContext=new Proxy({},{get:(o,k)=>o[k]??(()=>{}),set:(o,k,v)=>(o[k]=v,true)});
globalThis.document={createElement:()=>({width:1024,height:256,getContext:()=>canvasContext}),createElementNS:()=>{const events={};return {width:1536,height:1024,addEventListener:(key,cb)=>events[key]=cb,removeEventListener(){},set src(v){queueMicrotask(()=>events.load?.());}};},fonts:{ready:Promise.resolve()}};
Object.assign(globalThis,{innerWidth:1440,innerHeight:900,devicePixelRatio:1,matchMedia:()=>({matches:false}),addEventListener(){},requestAnimationFrame(){}});
globalThis.MockRenderer=class{setPixelRatio(){}setSize(){}render(scene,camera){scene.updateMatrixWorld(true);camera.updateMatrixWorld(true);assert(scene.children.length>100);assert(camera.isPerspectiveCamera);} };
const source=(await fs.readFile(new URL('../dist/world.js',import.meta.url),'utf8'))
 .replace(/from '(\.\/[^']+)'/g,(_,url)=>'from '+JSON.stringify(pathToFileURL(path.resolve('dist',url)).href))
 .replace('new THREE.WebGLRenderer(','new globalThis.MockRenderer(');
 const {PujoWorld}=await import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'));
let world,puja,chantCount=0;

test('bench cat clears the existing neighbours and leaves a nearby petting position reachable',async()=>{
 const {CAT_SPOT,canPetCat}=await import('../dist/bench-cat.js');
 const w=new PujoWorld({addEventListener(){},setPointerCapture(){}},{onReady(){}});
 assert(w.benchCat);assert.equal(w.people.length,74);
 for(const p of w.people)assert(Math.hypot(p.g.position.x-CAT_SPOT.x,p.g.position.z-CAT_SPOT.z)>p.radius+.29,`Cat must clear ${p.characterId||p.pose}`);
 const spot={x:CAT_SPOT.x+.95,z:CAT_SPOT.z+.25};assert(clearSegment(spot,spot,w.obstacles()));assert(canPetCat(spot,{started:true}));
 const pending=w.go([spot.x,1.9,spot.z],[CAT_SPOT.x,1,CAT_SPOT.z]);
 for(let i=0;i<800&&w.target;i++)w.frame(w.last+50);
 await pending;assert(!w.target);assert(canPetCat(w.camera.position,{started:true}));
});

test('every shared visitor rig is barefoot, with skin-coloured feet and toes',()=>{
 const w=new PujoWorld({addEventListener(){},setPointerCapture(){}},{onReady(){}}),rituals=new PujaRituals(w);
 const portrait=w.person(0,20,{pose:'portrait'});
 for(const p of [...w.people,...rituals.actors,portrait])for(const leg of p.legs){
  const foot=leg.getObjectByName('bare-foot'),toes=leg.getObjectByName('bare-toes');assert(foot&&toes);assert.equal(foot.material.color.getHexString(),new THREE.Color(p.skin).getHexString());assert.equal(toes.material,foot.material);assert.equal(leg.children.length,3);
 }
});

test('kurta shoulders have continuous cloth coverage across scales and arm poses',()=>{
 const w=new PujoWorld({addEventListener(){},setPointerCapture(){}},{onReady(){}});
 for(const p of w.people.filter(p=>p!==w.priest&&p.body.getObjectByName('kurta-body'))){
  const shirt=p.body.getObjectByName('kurta-body');assert.equal(shirt.material,p.arms[0].children[0].material);
  const cover=new THREE.Box3().setFromObject(shirt);for(const arm of p.arms)assert(cover.intersectsBox(new THREE.Box3().setFromObject(arm.children[0])));
 }
});

test('initial crowd and queue dispersal keep body and held-phone footprints separate',async()=>{
 const w=new PujoWorld({addEventListener(){},setPointerCapture(){}},{onReady(){}});w.started=true;w.camera.position.set(4.7,1.9,15.65);
 const check=p=>{for(const other of w.people){if(other===p||other.ritualHidden)continue;const gap=Math.hypot(p.g.position.x-other.g.position.x,p.g.position.z-other.g.position.z)-p.radius-other.radius;assert(gap>-.003,`Crowd overlap ${p.characterId||p.queueId||p.pose} / ${other.characterId||other.queueId||other.pose}: ${gap}`);}};
 w.people.filter(p=>p.batched).forEach(check);
 let entered=false;const pending=w.joinQueue().then(()=>entered=true);
 for(let frame=0;frame<1400&&w.queueRun;frame++){w.frame(w.last+50);w.queuePeople.forEach(check);}
 assert(w.hasEntered);await pending;assert(entered);assert.equal(w.queueRun,null);assert(w.queuePeople.every(p=>p.queueArrived));
});

test('photo visitors hold their phone with bent elbows and put it away during a greeting',()=>{
 const w=new PujoWorld({addEventListener(){},setPointerCapture(){}},{onReady(){}}),photos=w.people.filter(p=>p.pose==='photo');
 const checkGrip=p=>{for(const arm of p.photoArms.arms){
  const palm=arm.palm.getWorldPosition(new THREE.Vector3()),elbow=arm.elbow.getWorldPosition(new THREE.Vector3());
  const localPalm=p.body.worldToLocal(palm.clone());p.body.worldToLocal(elbow);
  assert(elbow.y<localPalm.y-.20,'Elbow stays below the phone instead of pointing straight forward');
  assert(Math.abs(elbow.x)<.36,'Elbows stay close to the torso instead of a sideways T pose');
  p.phone.worldToLocal(palm);assert(Math.abs(Math.abs(palm.x)-.155)<1e-8);assert(Math.abs(palm.y+.01)<1e-8);assert(Math.abs(palm.z)<1e-8);
 }};
 assert(photos.length>2);photos.forEach(checkGrip);
 for(let i=0;i<120;i++){updatePeople(w,.05);photos.forEach(checkGrip);}
 const riya=w.characters.get('photographer');w.greet('photographer');updatePeople(w,.05);assert(!riya.phone.visible);assert(riya.arms.every(a=>!a.visible));
 for(let i=0;i<100;i++)updatePeople(w,.05);assert(riya.phone.visible);assert(riya.arms.every(a=>a.visible));checkGrip(riya);
});

test('courtyard visitors wander with pauses, avoid people and leave the central aisle clear',()=>{
 const w=new PujoWorld({addEventListener(){},setPointerCapture(){}},{onReady(){}});w.started=true;w.camera.position.set(0,2.1,-5);
 const walkers=w.people.filter(p=>p.courtyardWalker),starts=walkers.map(p=>p.g.position.clone()),travel=walkers.map(()=>0);let steps=false,pauses=false;
 assert(walkers.length>=6);assert(walkers.every(p=>p.pose==='idle'&&!p.characterId&&p.queueId===undefined));
 for(let frame=0;frame<800;frame++){
  updatePeople(w,.05);
  for(const [i,p] of walkers.entries()){
   travel[i]=Math.max(travel[i],p.g.position.distanceTo(starts[i]));steps||=p.walking;pauses||=!p.walking;
   assert(clearSegment(p.g.position,p.g.position,w.obstacles(p),p.radius),'Wandering must clear other visitors and solid props');
   assert(Math.hypot(p.g.position.x-w.camera.position.x,p.g.position.z-w.camera.position.z)>p.radius+.36);
   assert(Math.abs(p.g.position.x)>1.7&&Math.abs(p.g.position.x)<7.5&&p.g.position.z<-1.5);
  }
 }
 assert(travel.filter(d=>d>.35).length>=6,JSON.stringify(travel));assert(steps&&pauses);
 w.reduced=true;const stopped=walkers.map(p=>p.g.position.clone());for(let i=0;i<80;i++)updatePeople(w,.05);walkers.forEach((p,i)=>assert(p.g.position.equals(stopped[i])));
 w.reduced=false;const rituals=w.rituals=new PujaRituals(w);w.hasEntered=true;w.camera.position.set(0,2.1,-15.1);rituals.setMode('ashtami');assert(rituals.action('start',true));
 const staging=walkers.map(p=>p.g.position.clone());for(let i=0;i<80;i++)updatePeople(w,.05);walkers.forEach((p,i)=>assert(p.g.position.equals(staging[i])));
});
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

test('queue figures advance ahead of the player and entry finishes behind the same neighbour',async()=>{world.camera.position.set(4.7,1.9,15.65);world.hasEntered=false;const first=world.queuePeople.at(-1);let count=9,observedSteps=false;const pending=world.joinQueue(s=>{observedSteps||=world.queuePeople.some(p=>p.legs.some(l=>Math.abs(l.rotation.x)>.1));assert(s.ahead<=count);count=s.ahead;assert.equal(first,world.queuePeople.at(-1));assert(first.g.position.distanceTo(world.camera.position)>.65);});let now=performance.now();for(let i=0;i<650;i++){now+=50;world.frame(now);}await pending;assert(world.hasEntered);assert(!world.locked);assert.equal(count,0);assert(observedSteps);});
test('stall vendors are raised above lowered counters and decoration detail uses reusable textures',()=>{assert.equal(world.vendorPeople.size,6);for(const p of world.vendorPeople.values())assert(p.g.position.y+1.87>2);assert.equal(world.alponas[0].geometry.parameters.width,6.4);const windows=[];world.scene.traverse(o=>{if(o.name==='khorkhori-window')windows.push(o);});assert.equal(windows.length,8);assert(world.people.filter(p=>p.batched).length>=35);});
test('all guided destinations remain reachable around the expanded crowd',async()=>{const {PLACES}=await import('../dist/game-state.js');world.queueRun=null;world.hasEntered=true;world.camera.position.set(0,2,-5);for(const p of PLACES){const pending=world.go(p.position,p.look);assert(world.target,`${p.id} must have a safe route`);let now=world.last;for(let i=0;i<800&&world.target;i++){now+=50;world.frame(now);assert(clearSegment(world.camera.position,world.camera.position,world.obstacles()),'guided movement must not overlap people or counters');}assert(!world.target,`${p.id} must arrive`);await pending;assert(Math.hypot(world.camera.position.x-p.position[0],world.camera.position.z-p.position[2])<1.9);const id=p.id==='balloons'?'game':p.id,a=world.characterPosition(id);if(a)assert(Math.hypot(world.camera.position.x-a[0],world.camera.position.z-a[2])<=2.65,`${id} seller must be within reach after guided arrival`);}});

test('greeting joins both palms, bows the head and releases the gesture afterwards',()=>{const p=world.characters.get('neighbour');world.greet('neighbour');let now=world.last;for(let i=0;i<20;i++){now+=50;world.frame(now);}assert(p.gesture.visible);assert(p.head.rotation.x>.08);assert(p.palms[0].position.distanceTo(p.palms[1].position)<.07);assert(p.arms.every(a=>!a.visible));for(let i=0;i<100;i++){now+=50;world.frame(now);}assert(!p.gesture.visible);assert(p.arms.every(a=>a.visible));world.conversationId=null;});
test('crowd rigs breathe, look around and walk without overlapping the player',()=>{world.started=true;world.camera.position.set(0,2,20);const p=world.people.find(p=>p.walkPoints);p.walkWait=0;p.walkIndex=1;const before=p.g.position.clone(),head=p.head.rotation.y;let now=world.last;for(let i=0;i<40;i++){now+=50;world.frame(now);}assert(p.g.position.distanceTo(before)>.05);assert.notEqual(p.head.rotation.y,head);assert(p.instances.length>5);assert(Math.hypot(p.g.position.x-world.camera.position.x,p.g.position.z-world.camera.position.z)>.65);});
test('game seller clears the target board and interaction anchors follow actual sellers',async()=>{const THREE=await import('../dist/assets/three.module.js');const board=new THREE.Box3().setFromObject(world.balloonBoard),seller=world.vendorPeople.get('game'),body=new THREE.Box3().setFromObject(seller.g);assert(!body.intersectsBox(board));for(const [id,p] of world.vendorPeople){const a=world.characterPosition(id);assert.equal(a[0],p.g.position.x);assert.equal(a[2],p.g.position.z);}assert.equal(world.taxi.name,'kolkata-ambassador-taxi');assert.equal(world.streetLamps.length,8);});
test('full altar image fits beneath the canopy and fireworks use one fixed particle pool',()=>{assert(world.altar);assert.equal(world.altar.geometry.parameters.width,12);assert.equal(world.altar.position.y+world.altar.geometry.parameters.height/2,8.25);const pool=world.fireworks.positions;world.startFireworks();let now=world.last;for(let i=0;i<100;i++){now+=50;world.frame(now);}assert.equal(world.fireworks.positions,pool);assert(pool.every(Number.isFinite));assert(pool.some((v,i)=>i%3===1&&v>12));world.stopFireworks();assert(!world.fireworks.points.visible);});

test('the priest never greets or turns away from Maa; Arjun stays ahead of the line',()=>{assert(world.volunteer.g.position.z<world.queuePeople[0].home.z);world.conversationId=null;world.greet('priest');assert.equal(world.conversationId,null);let now=world.last;for(let i=0;i<120;i++){now+=50;world.frame(now);}const p=world.priest,dx=-p.g.position.x,dz=-21.25-p.g.position.z;assert((Math.sin(p.g.rotation.y)*dx+Math.cos(p.g.rotation.y)*dz)/Math.hypot(dx,dz)>.99);assert(p.nonInteractable);assert(!p.gesture);});
test('additions reuse floor art and keep non-interactive performers separate',()=>{assert.equal(world.extraDhakis.length,2);assert(world.extraDhakis.every(p=>p.nonInteractable&&p.pose==='dhak'));assert(world.conchPerson.nonInteractable);assert(world.addedAlponas.length>=60);assert.equal(world.alponaBatches.length,6);assert.equal(world.alponaBatches.reduce((n,m)=>n+m.count,0),world.alponas.length+world.addedAlponas.length);assert.equal(new Set(world.addedAlponas.map(m=>m.material)).size,6);assert(world.addedAlponas.some(m=>m.position.z<0));for(const m of world.addedAlponas){assert.equal(m.geometry,world.alponas[0].geometry);assert(world.alponaPalette.includes(m.material));assert.equal(m.material.toneMapped,false);assert.equal(m.position.y,m.position.z<0?.408:.035);}for(const p of [...world.extraDhakis,world.conchPerson])for(const other of world.people.filter(o=>o!==p))assert(Math.hypot(p.g.position.x-other.g.position.x,p.g.position.z-other.g.position.z)>p.radius+other.radius);});
test('portrait framing keeps the pandal and avatar; wave points away from the face',async()=>{const THREE=await import('../dist/assets/three.module.js');const {setPortrait}=await import('../dist/photo-booth.js');world.scene.updateMatrixWorld(true);for(const x of [-10.8,10.8])for(const y of [.2,11.9]){const p=new THREE.Vector3(x,y,0).project(world.portraitCamera);assert(Math.abs(p.x)<.96&&Math.abs(p.y)<.96);}const count=world.people.length;for(const outfit of ['sari','dhoti'])for(const pose of ['namaskar','wave','relaxed']){const p=setPortrait(world,{outfit,pose});assert.equal(world.people.length,count);assert(!p.g.visible);if(pose==='wave'){p.g.updateMatrixWorld(true);const hand=p.arms[1].getObjectByName('human-hand').getWorldPosition(new THREE.Vector3());assert(hand.x>.32);}}});

// Functional checks for the independent models and street-life branch.
test('every street visitor uses the human rig; crowd variation shares silhouette geometry',()=>{
 assert(world.people.every(p=>p.human&&p.head&&p.legs.length===2));
 const crowd=world.people.filter(p=>p.batched);assert(new Set(crowd.map(p=>p.skin)).size>=3);assert(crowd.some(p=>p.age==='elder'));assert(new Set(crowd.map(p=>p.g.scale.y)).size>=4);
 const hands=world.people.flatMap(p=>p.arms.map(a=>a.getObjectByName('human-hand')));assert(hands.every(Boolean));
 assert.equal(new Set(hands.flatMap(h=>h.children.filter(o=>o.geometry===world.geometries.fingers).map(o=>o.geometry))).size,1);
});
test('vendor hands over a real serving, keeps it visible while walking, and reuses bounded models',async()=>{
 const {STALL_MENUS}=await import('../dist/neighbourhood.js');puja.setMode('saptami');world.started=true;world.locked=false;world.target=null;
 for(const [shop,menu] of Object.entries(STALL_MENUS))for(const item of menu.items){
  const v=world.vendorPeople.get(shop);world.camera.position.set(v.g.position.x+(v.g.position.x<0?2:-2),1.9,v.g.position.z);world.camera.updateMatrixWorld();
  assert(world.presentPurchase(shop,item));world.frame(world.last+50);assert(world.purchase.vendor.armPose.arms[1].posed);
  const prop=world.purchase.prop,hand=v.arms[1].getObjectByName('human-hand').getWorldPosition(new THREE.Vector3());assert(prop.position.distanceTo(hand)<.06);
  for(let i=0;i<42;i++)world.frame(world.last+50);assert(prop.servingHand.visible);assert(!v.armPose.arms[1].posed);
  const local=world.camera.worldToLocal(prop.position.clone());assert(local.z<-.7&&local.z>-.9);assert(local.y<-.35);
 }
 assert(world.servingModels.size<=7);const count=world.servingModels.size;world.camera.position.set(-8.55,1.9,10);assert(world.presentPurchase('tea',STALL_MENUS.tea.items[0]));assert.equal(world.servingModels.size,count);
 world.camera.position.set(0,1.9,26);assert(!world.presentPurchase('tea',STALL_MENUS.tea.items[0]));assert(!world.presentPurchase('tea',{id:'unknown'}));world.putAwayPurchase();assert(!world.purchase);assert([...world.servingModels.values()].every(p=>!p.parent));
});
test('painting replaces one reusable floor texture and its camera frames the art and pandal',async()=>{
 const {addMotif,ART_SPOT}=await import('../dist/alpona-corner.js');const stamps=[];addMotif(stamps);assert(world.obstacles().some(o=>o.x===-6.3&&o.z===5.5&&o.radius>=.7));const material=world.personalAlpona.material,geometry=world.personalAlpona.geometry,texture=material.map;
 for(let i=0;i<12;i++)assert(world.applyAlpona(stamps));assert.equal(world.personalAlpona.material,material);assert.equal(material.map,texture);assert.equal(world.personalAlpona.geometry,geometry);assert.equal(world.artStamps.length,1);assert(!world.applyAlpona([{design:'bad'}]));
 world.artCamera.updateMatrixWorld();for(const v of [...[-1.7,1.7].flatMap(x=>[-1.7,1.7].map(z=>new THREE.Vector3(ART_SPOT.x+x,.06,ART_SPOT.z+z))),...[-10.8,10.8].flatMap(x=>[.2,11.9].map(y=>new THREE.Vector3(x,y,0))),new THREE.Vector3(0,6,-21)]){v.project(world.artCamera);assert(Math.abs(v.x)<1&&Math.abs(v.y)<1&&v.z>0&&v.z<1);}
});
test('new held servings respect ritual cameras and reduced-motion poses',async()=>{
 const {STALL_MENUS}=await import('../dist/neighbourhood.js');world.camera.position.set(-8.55,1.9,10);world.reduced=true;assert(world.presentPurchase('tea',STALL_MENUS.tea.items[0]));world.frame(world.last+50);const prop=world.purchase.prop,position=prop.position.clone();world.frame(world.last+50);assert(prop.position.equals(position));assert(!world.purchase.vendor.armPose.arms[1].posed);world.renderCamera=world.artCamera;world.frame(world.last+50);assert(!prop.visible);world.renderCamera=null;world.ritualLocked=true;world.frame(world.last+50);assert(!prop.visible);world.ritualLocked=false;world.putAwayPurchase();world.reduced=false;
});

test('distant visitors omit fine details, hidden visitors submit no instances, and soles stay planted',()=>{
 puja.setMode('saptami');world.camera.position.set(0,2,20);world.frame(world.last+50);const near=world.visitorBatches.reduce((n,m)=>n+m.count,0);world.camera.position.set(0,2,90);world.frame(world.last+50);const far=world.visitorBatches.reduce((n,m)=>n+m.count,0);assert(far<near);
 const crowd=world.people.filter(p=>p.batched);crowd.forEach(p=>p.ritualHidden=true);world.frame(world.last+50);assert(world.visitorBatches.every(m=>m.count===0&&!m.visible));crowd.forEach(p=>p.ritualHidden=false);world.frame(world.last+50);
 const p=world.people.find(p=>p.walkPoints);world.camera.position.set(0,2,20);for(let i=0;i<40;i++){world.frame(world.last+50);p.g.updateWorldMatrix(true,true);for(const leg of p.legs){const bounds=new THREE.Box3().setFromObject(leg);assert(bounds.min.y>=p.g.position.y-.015,'A swinging sandal must stay above the paving');}}
});
test('drumsticks stay in the palms and arati dish stays supported throughout animation',()=>{
 puja.setMode('saptami');world.reduced=false;world.putAwayPurchase();const dhaki=world.characters.get('dhaki');
 for(let frame=0;frame<200;frame++){
  world.frame(world.last+50);
  for(let i=0;i<2;i++){
   const palm=dhaki.arms[i].getObjectByName('human-hand').getWorldPosition(new THREE.Vector3()),stick=dhaki.sticks[i];
   const a=stick.localToWorld(new THREE.Vector3(0,-.5,0)),b=stick.localToWorld(new THREE.Vector3(0,.5,0)),direction=b.clone().sub(a);
   const k=THREE.MathUtils.clamp(palm.clone().sub(a).dot(direction)/direction.lengthSq(),0,1);assert(palm.distanceTo(a.addScaledVector(direction,k))<.015);
  }
  const palm=world.priest.arms[1].getObjectByName('human-hand').getWorldPosition(new THREE.Vector3());world.priestLamp.worldToLocal(palm);
  const gap=Math.hypot(Math.max(0,Math.hypot(palm.x,palm.z)-.25),Math.max(0,Math.abs(palm.y)-.025));assert(gap<.025);
 }
 puja.setMode('ashtami');world.frame(world.last+50);assert(!world.priest.armPose.arms[1].posed);
 for(const rest of world.priest.armPose.arms[1].rest){assert(rest.object.position.equals(rest.position));assert(rest.object.scale.equals(rest.scale));}
 puja.setMode('saptami');
});
test('basket size changes its contents while the same player hand keeps its size',async()=>{
 const {STALL_MENUS}=await import('../dist/neighbourhood.js');puja.setMode('saptami');world.reduced=true;world.camera.position.set(8.55,1.9,7);world.camera.updateMatrixWorld();const sizes=[];
 for(const id of ['jhuri-small','jhuri-large']){
  assert(world.presentPurchase('flowers',STALL_MENUS.flowers.items.find(i=>i.id===id)));world.frame(world.last+50);
  const prop=world.purchase.prop;sizes.push({hand:new THREE.Box3().setFromObject(prop.servingHand).getSize(new THREE.Vector3()),basket:new THREE.Box3().setFromObject(prop.contents).getSize(new THREE.Vector3())});
 }
 assert(sizes[0].hand.distanceTo(sizes[1].hand)<1e-8);assert(Math.abs(sizes[1].basket.x/sizes[0].basket.x-1.6)<1e-8);world.putAwayPurchase();world.reduced=false;
});
test('carried servings yield to Anjali and sindoor hands and return afterwards',async()=>{
 const {STALL_MENUS}=await import('../dist/neighbourhood.js');puja.setMode('saptami');world.camera.position.set(8.55,1.9,7);world.camera.updateMatrixWorld();assert(world.presentPurchase('flowers',STALL_MENUS.flowers.items.find(i=>i.id==='jhuri-large')));for(let i=0;i<40;i++)world.frame(world.last+50);const prop=world.purchase.prop;
 puja.setMode('ashtami');world.camera.position.set(...puja.target().position);assert(puja.action('start',true));ritualUntil('ready');assert(puja.handRig.visible);assert(!prop.visible);
 puja.leave();world.frame(world.last+50);assert(!puja.handRig.visible);assert(prop.visible);
 puja.setMode('dashami');world.camera.position.set(...puja.target().position);assert(puja.action('start',true));assert(puja.action('perform',true));world.frame(world.last+50);assert(puja.handRig.visible);assert(!prop.visible);
 ritualUntil('playing');assert(!puja.handRig.visible);assert(prop.visible);world.putAwayPurchase();puja.setMode('saptami');
});
test('greeting releases vendor handoff ownership and smoothly completes delivery',async()=>{
 const {STALL_MENUS}=await import('../dist/neighbourhood.js');puja.setMode('saptami');world.camera.position.set(-8.55,1.9,10);world.camera.updateMatrixWorld();assert(world.presentPurchase('tea',STALL_MENUS.tea.items[0]));world.frame(world.last+50);
 const purchase=world.purchase,vendor=purchase.vendor,position=purchase.prop.position.clone();assert(vendor.armPose.arms[1].posed);world.greet('tea');assert(!vendor.armPose.arms[1].posed);assert(purchase.start.distanceTo(position)<1e-8);
 world.frame(world.last+50);assert(vendor.gesture.visible);assert(vendor.arms.every(a=>!a.visible));assert(!vendor.armPose.arms[1].posed);assert(purchase.prop.visible);assert(purchase.elapsed>=1.15);
 for(let i=0;i<20;i++)world.frame(world.last+50);assert(purchase.prop.servingHand.visible);assert(!vendor.armPose.arms[1].posed);world.putAwayPurchase();vendor.greetingUntil=0;world.conversationId=null;world.frame(world.last+50);
});
test('all three dhakis keep hands and shafts outside the barrel and tap the outer skin',()=>{
 puja.setMode('saptami');world.reduced=false;const performers=[world.characters.get('dhaki'),...world.extraDhakis],closest=performers.map(()=>[Infinity,Infinity]);
 const inspect=()=>performers.map((p,index)=>p.sticks.map((stick,arm)=>{
  const side=arm?1:-1,palm=p.arms[arm].getObjectByName('human-hand').getWorldPosition(new THREE.Vector3()),tip=stick.localToWorld(new THREE.Vector3(0,.5,0)),grip=stick.localToWorld(new THREE.Vector3(0,-.5,0));
  assert(p.armPose.arms[arm].posed);assert(palm.distanceTo(grip)<1e-8);assert(Math.abs(grip.distanceTo(tip)-.34)<1e-8);
  p.drum.worldToLocal(palm);p.drum.worldToLocal(tip);p.drum.worldToLocal(grip);
  assert(side*palm.x>.52,'Palm must remain outside the drum head and barrel');assert(side*tip.x>=.4625,'Stick tip must not pass through the outer skin');assert(side*grip.x>side*tip.x);
  assert(Math.hypot(tip.y,tip.z)<.30,'Beat lands inside the skin, clear of its rim');closest[index][arm]=Math.min(closest[index][arm],side*tip.x-(index?.46:.4625));
  return [...palm.toArray(),...tip.toArray()];
 }));
 for(let frame=0;frame<200;frame++){world.frame(world.last+50);inspect();}
 assert(closest.flat().every(gap=>gap<.004),'Each stick must reach its drum skin during a beat');
 world.reduced=true;world.frame(world.last+50);const still=inspect();world.frame(world.last+500);assert.deepEqual(inspect(),still);world.reduced=false;
});

test('jump lifts the walking camera, lands at its original height and resets on interruptions',async()=>{
 world.stop();world.cancelMove();puja.setMode('saptami');world.started=true;world.queueRun=null;world.camera.position.set(0,1.9,24);
 assert(world.jump());world.frame(world.last+50);assert(world.camera.position.y>1.9);assert(!world.jump());
 for(let i=0;i<20;i++)world.frame(world.last+50);assert(Math.abs(world.camera.position.y-1.9)<1e-10);assert(!world.jumpMotion.active);
 assert(world.jump());world.frame(world.last+50);world.stop();assert(Math.abs(world.camera.position.y-1.9)<1e-10);assert(!world.jumpMotion.active);
 assert(world.jump());world.frame(world.last+50);await world.go([0,1.9,25],[0,2,0],{immediate:true});assert(!world.jumpMotion.active);assert.equal(world.camera.position.y,1.9);
 for(const flag of ['locked','suspended','ritualLocked']){world[flag]=true;assert(!world.jump());world[flag]=false;}
 world.renderCamera=puja.camera;assert(!world.jump());world.renderCamera=null;
 puja.setMode('ashtami');world.hasEntered=true;world.camera.position.set(...puja.target().position);assert(puja.action('start',true));assert(!world.jump());ritualUntil('ready');assert(!world.jump());
 puja.leave();puja.setMode('dashami');world.camera.position.set(...puja.target().position);assert(puja.action('start',true));assert(puja.action('perform',true));assert(!world.jump(),'Dashami contact blocks jumping before its first render');
 puja.setMode('saptami');assert(world.jump());world.stop();world.started=false;
});

test('all six shop counters block walking and jumping while their front approaches stay reachable',async()=>{
 world.stop();world.cancelMove();puja.setMode('saptami');world.started=true;world.hasEntered=true;world.queueRun=null;assert.equal(world.staticObstacles.length,6);
 for(const o of world.staticObstacles){
  const normal={x:Math.sin(o.rotation),z:Math.cos(o.rotation)};world.camera.position.set(o.x+normal.x*1.8,1.9,o.z+normal.z*1.8);world.yaw=o.rotation;world.setMoveInput(0,1);assert(world.jump());
  for(let i=0;i<40;i++)world.frame(world.last+50);world.stop();
  const dx=world.camera.position.x-o.x,dz=world.camera.position.z-o.z;assert(dx*normal.x+dz*normal.z>=o.halfZ+.345-1e-8,`${o.kind} must remain solid during jumps`);
  await world.go([o.x,1.9,o.z],[0,2,0],{immediate:true});const p=world.camera.position;assert(clearSegment(p,p,[o]));
 }
 world.stop();world.started=false;
});

test('guided walking replans around a new blocker without crossing it or replacing the promise',async()=>{
 world.stop();world.cancelMove();puja.setMode('saptami');world.queueRun=null;world.hasEntered=true;world.started=false;world.camera.position.set(-3,1.9,24);world.yaw=world.pitch=0;
 const obstacles=world.obstacles,blockers=[];world.obstacles=()=>blockers;
 try{const pending=world.go([3,1.9,24],[3,1.9,0]),target=world.target;assert.equal(target.waypoints.length,1);const look=[target.yaw,target.pitch];blockers.push({x:0,z:24,radius:.65});
  for(let i=0;i<300&&world.target;i++){world.frame(world.last+50);assert(clearSegment(world.camera.position,world.camera.position,blockers),'replanning must retain collision safety');}
  await pending;assert(!world.target);assert(target.replans>0&&target.replans<=6);assert(Math.hypot(world.camera.position.x-3,world.camera.position.z-24)<.035);assert.deepEqual([target.yaw,target.pitch],look);assert(Math.abs(world.yaw-target.yaw)<.01);
 }finally{world.cancelMove();world.obstacles=obstacles;}
});

test('a permanently blocked guided trip stops after bounded retries and settles its promise safely',async()=>{
 world.stop();world.cancelMove();world.camera.position.set(0,1.9,24);const obstacles=world.obstacles,blockers=[];world.obstacles=()=>blockers;
 try{const pending=world.go([0,1.9,20],[0,1.9,0]),target=world.target;blockers.push({x:0,z:22,halfX:20,halfZ:.5,rotation:0});
  for(let i=0;i<250&&world.target;i++){world.frame(world.last+50);assert(clearSegment(world.camera.position,world.camera.position,blockers));}
  assert(!world.target,'a blocked trip must release its waiter');assert.equal(await pending,false);assert.equal(target.replans,6);assert(world.camera.position.z>=22.845-1e-8);
 }finally{world.cancelMove();world.obstacles=obstacles;}
});
