import * as THREE from './assets/three.module.js';

const SKINS=['#a77b57','#b88a65','#895d43','#c69873'];
const HAIR=['#292526','#40332c','#56504a','#b0a99b'];
// One shared silhouette per garment; cloth detail never creates a geometry per visitor.
function garment(w,key,points){return w.geometries[key]??=new THREE.LatheGeometry(points.map(p=>new THREE.Vector2(...p)),16);}
export function addNamaskar(w,body,skin,outfit,z=.34){
 for(const side of [-1,1]){
  const a=[side*.215,1.48,0],sleeve=[side*.257,1.28,.08],elbow=[side*.30,1.09,.15];
  w.ball(outfit,a,[.073,.08,.075],body);w.rod(a,sleeve,.059,outfit,body);w.rod(sleeve,elbow,.05,skin,body);w.ball(skin,elbow,[.052,.052,.052],body);w.rod(elbow,[side*.025,1.43,z],.043,skin,body);
  const palm=w.ball(skin,[side*.025,1.47,z],[.025,.085,.045],body);w.mesh(w.geometries.fingers,skin,[0,.2,0],[1,.8,.6],palm).rotation.z=Math.PI;
 }
}
export function makePerson(w,x,z,{outfit='#c18c54',sari=false,pose='idle',scale=1,rotation=0,hair,skin,priest=false,appearance=0,age='adult',build=1}={}){
 if(scale<.8)age='child';
 skin??=SKINS[Math.abs(appearance)%SKINS.length];hair??=HAIR[age==='elder'?3:Math.abs(appearance)%3];
 const g=new THREE.Group(),body=new THREE.Group();g.name='human-puja-visitor';g.position.set(x,z<1?.4:0,z);g.rotation.y=rotation;g.scale.set(scale*build,scale,scale);g.add(body);w.scene.add(g);
 const trim='#d8b06a',dhoti=priest?'#eee1c5':'#e6d5b3';
 if(sari){
  w.mesh(garment(w,'sari-draped',[[0,.18],[.29,.18],[.32,.26],[.30,.55],[.255,.91],[.23,1.14],[.205,1.25],[0,1.25]]),outfit,[0,0,0],null,body);
  w.ball(outfit,[0,1.37,0],[.245,.29,.175],body);
  for(let i=0;i<5;i++){const f=w.rod([-.09+i*.037,.23,.322],[(-.09+i*.037)*.7,1.10,.24],.012,i%2?trim:outfit,body);f.name='sari-pleat';f.userData.fineDetail=true;}
  const pallu=w.mesh(garment(w,'sari-pallu',[[0,-.40],[.09,-.40],[.105,-.15],[.095,.15],[.065,.36],[0,.36]]),outfit,[-.16,1.2,.24],[1,1,.40],body);pallu.rotation.z=-.26;
  const border=w.rod([-.27,.82,.29],[-.065,1.58,.18],.018,trim,body);border.name='pallu-border';
  const hem=w.mesh(w.geometries.sariHem??=new THREE.TorusGeometry(.30,.018,5,32),trim,[0,.235,0],null,body);hem.rotation.x=Math.PI/2;
 }else{
  w.mesh(garment(w,'kurta-tailored',[[0,.72],[.27,.72],[.27,.80],[.22,1.10],[.205,1.40],[.22,1.52],[.15,1.60],[0,1.60]]),outfit,[0,0,0],[1,1,.78],body);
  for(const side of [-1,1]){w.ball(dhoti,[side*.115,.53,0],[.13,.32,.16],body);for(let i=0;i<2;i++)w.rod([side*(.06+i*.07),.26,.13],[side*(.04+i*.07),.77,.14],.012,'#bba987',body);}
  w.box(trim,[0,1.34,.178],[.027,.37,.018],body);for(const y of [1.23,1.35,1.47])w.ball('#795d3f',[0,y,.191],[.012,.012,.008],body);
  for(const side of [-1,1])w.rod([side*.035,1.60,.09],[side*.105,1.54,.155],.018,outfit,body);
 }
 // Separate leg pivots keep the soles on the floor during breathing and gestures.
 const legs=[];for(const side of [-1,1]){const leg=new THREE.Group();leg.position.set(side*.115,.37,0);body.add(leg);legs.push(leg);w.cyl(skin,[0,-.18,0],[.055,.29,.06],leg);w.ball('#48362b',[0,-.325,.06],[.082,.035,.15],leg);w.rod([-.06,-.295,.06],[.06,-.295,.06],.014,'#96764c',leg);}
 w.cyl(skin,[0,1.65,0],[.065,.16,.065],body);
 // The face remains at the ritual's calibrated cheek and palm contact height.
 const head=new THREE.Group();head.position.y=1.68;body.add(head);
 const face=(color,pos,size)=>{const mesh=w.ball(color,[pos[0],pos[1]-1.68,pos[2]],size,head);mesh.userData.fineDetail=Math.max(...size)<.06;return mesh;};
 const faceGeo=w.geometries['human-face']??=new THREE.SphereGeometry(1,20,14);
 w.mesh(faceGeo,skin,[0,.17,.018],[.145,.19,.14],head);face(skin,[0,1.73,.065],[.094,.06,.07]);face(skin,[0,1.85,.16],[.025,.04,.04]);
 for(const side of [-1,1]){
  face(skin,[side*.145,1.85,.01],[.025,.043,.028]);face('#f1e4d5',[side*.055,1.89,.143],[.025,.012,.009]);face('#302821',[side*.055,1.89,.153],[.009,.011,.006]);
  w.rod([side*.03,.245,.145],[side*.083,.24,.129],.007,hair,head);
  if(sari)face(trim,[side*.15,1.80,.02],[.018,.035,.018]);
  if(age==='elder'){w.rod([side*.078,.206,.142],[side*.113,.195,.121],.003,'#795943',head);w.rod([side*.024,.29,.12],[side*.08,.285,.11],.003,'#795943',head);}
 }
 if(age==='child')head.scale.setScalar(1.08);
 if(age==='elder'&&appearance%2===0){for(const side of [-1,1])w.mesh(w.geometries.spectacles??=new THREE.TorusGeometry(.036,.004,4,16),'#645f53',[side*.055,.21,.157],null,head).userData.fineDetail=true;w.rod([-.018,.21,.16],[.018,.21,.16],.004,'#645f53',head);}
 const smile=w.geometries.smile??=new THREE.TubeGeometry(new THREE.QuadraticBezierCurve3(new THREE.Vector3(-.03,.102,.151),new THREE.Vector3(0,.083,.158),new THREE.Vector3(.03,.102,.151)),8,.0035,4,false);
 w.mesh(smile,'#7c4d3e',[0,0,0],null,head).name='soft-smile';
 if(sari){face('#a13a30',[0,1.95,.15],[.011,.014,.007]);face(hair,[0,2.005,-.055],[.146,.095,.145]);face(hair,[.035,1.88,-.16],[.092,.10,.09]);for(const side of [-1,1])face(hair,[side*.126,1.94,-.03],[.028,.11,.11]);}
 else{
  face(hair,[0,1.94,-.075],[.139,.105,.091]);
  face(hair,[0,2.005,-.025],[.15,.07,.132]);face(hair,[appearance%2?.07:-.06,1.98,.067],[.09,.045,.072]);
  if(appearance%3===1||age==='elder')for(const side of [-1,1])face(hair,[side*.028,1.805,.149],[.035,.012,.009]);
 }
 const arms=[];for(const side of [-1,1]){
  const arm=new THREE.Group();arm.position.set(side*.23,1.48,0);body.add(arm);
  // First six meshes form the stable RitualArms contract (shoulder, upper arm,
  // elbow, forearm, palm, thumb). Finger detail is a child of the palm.
  w.ball(priest?skin:outfit,[0,-.02,0],[.075,.09,.08],arm);w.rod([0,0,0],[side*.04,-.24,.015],.06,priest?skin:outfit,arm);
  w.ball(skin,[side*.04,-.24,.015],[.055,.055,.055],arm);w.rod([side*.04,-.24,.015],[side*.06,-.43,.05],.045,skin,arm);
  const hand=w.ball(skin,[side*.06,-.48,.05],[.044,.078,.025],arm);hand.name='human-hand';w.ball(skin,[side*.025,-.455,.078],[.018,.04,.018],arm);
  // A shared indexed finger mesh replaces four separate draw submissions.
  if(!w.geometries.fingers){const verts=[],indices=[];for(let i=0;i<4;i++){const geo=w.geometries.sphere.clone();geo.scale(.17,.40-(i===3?.1:0),.65);geo.translate((i-1.5)*.43,-.65,0);const offset=verts.length/3;verts.push(...geo.attributes.position.array);indices.push(...Array.from(geo.index.array,j=>j+offset));geo.dispose();}const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(verts,3));geo.setIndex(indices);geo.computeVertexNormals();w.geometries.fingers=geo;}
  w.mesh(w.geometries.fingers,skin,[0,0,0],null,hand).userData.fineDetail=true;
  if(sari){const ring=w.mesh(w.geometries.bangle??=new THREE.TorusGeometry(1,.14,5,12),trim,[0,.75,0],[1.2,.58,2.1],hand);ring.rotation.x=Math.PI/2;}
  arms.push(arm);
 }
 if(pose==='photo'){arms.forEach(a=>a.rotation.x=-1.5);w.box('#292d31',[0,1.6,.54],[.27,.15,.035],body);w.box('#728d9d',[0,1.6,.562],[.22,.11,.01],body);}
 if(pose==='pray'){arms.forEach(a=>a.visible=false);addNamaskar(w,body,skin,outfit,.30);}
 if(priest){w.box('#b66541',[-.14,1.25,.2],[.11,.75,.04],body);w.rod([-.18,1.55,.22],[.19,.9,.22],.012,'#f1ddac',body);face('#934438',[0,1.95,.151],[.012,.035,.009]);}
 const person={g,body,head,legs,arms,pose,human:true,skin,hair,age,appearance,seed:x*3+z,radius:.30*scale*Math.max(1,build)};w.people.push(person);return person;
}
