import * as THREE from './assets/three.module.js';

// The clear end of the existing tea-stall bench; no new bench or crowd changes.
export const CAT_SPOT={x:-7.8,y:.625,z:9.45};
export const CAT_PET_DISTANCE=1.6;
export function canPetCat(position,{started=false,inputPaused=false,queuing=false,renderCamera=false,travelling=false}={}){
 return !!position&&started&&!inputPaused&&!queuing&&!renderCamera&&!travelling&&position.z>1&&Math.hypot(position.x-CAT_SPOT.x,position.z-CAT_SPOT.z)<=CAT_PET_DISTANCE;
}

export class BenchCat{
 constructor(w){
  this.w=w;this.near=false;this.lastMeow=-Infinity;this.petLeft=0;this.lastPet=-Infinity;
  const g=this.group=new THREE.Group();g.name='tea-bench-para-cat';g.position.set(CAT_SPOT.x,CAT_SPOT.y,CAT_SPOT.z);g.rotation.y=0;w.scene.add(g);
  const ginger='#c68a50',stripe='#9b653e',cream='#f1e5ce',pink='#c88e88';
  // Cat-only smooth geometry: the street's shared models are untouched.
  const fur=new THREE.SphereGeometry(1,24,16);
  const ball=(color,pos,size,parent=g,extra={})=>w.mesh(fur,color,pos,size,parent,{roughness:.92,...extra});
  const stroke=(points,radius,color,parent=g)=>w.mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points.map(p=>new THREE.Vector3(...p))),16,radius,5,false),color,[0,0,0],null,parent);
  this.body=ball(ginger,[0,.16,-.055],[.19,.16,.32]);this.body.name='cat-body';
  ball(cream,[0,.165,.17],[.115,.14,.14]);
  for(const side of [-1,1]){ball(ginger,[side*.105,.073,.20],[.063,.068,.18]);ball(cream,[side*.105,.043,.325],[.065,.043,.073]);}
  // Fine stripes follow the fur surface instead of sticking out of the sides.
  for(const z of [-.21,-.08,.05]){
   const section=Math.sqrt(1-((z+.055)/.32)**2),points=[];
   for(let i=0;i<=16;i++){const angle=.13*Math.PI+i*.74*Math.PI/16;points.push([.192*section*Math.cos(angle),.16+.162*section*Math.sin(angle),z+.008*Math.sin(angle*2)]);}
   stroke(points,.0045,stripe);
  }
  const head=this.head=new THREE.Group();head.rotation.order='YXZ';head.position.set(0,.36,.24);g.add(head);
  ball(ginger,[0,0,0],[.155,.14,.14],head);
  const earShape=new THREE.Shape();earShape.moveTo(-.062,0);earShape.quadraticCurveTo(-.045,.07,-.015,.13);earShape.quadraticCurveTo(0,.153,.012,.13);earShape.quadraticCurveTo(.042,.08,.060,.005);earShape.quadraticCurveTo(0,-.015,-.062,0);
  const earGeo=new THREE.ExtrudeGeometry(earShape,{depth:.026,bevelEnabled:true,bevelSegments:2,steps:1,bevelSize:.006,bevelThickness:.006,curveSegments:6});
  this.eyes=[];
  for(const side of [-1,1]){
   const ear=w.mesh(earGeo,ginger,[side*.10,.075,-.028],null,head);ear.rotation.z=-side*.20;
   const inner=w.mesh(earGeo,pink,[side*.10,.085,.008],[.59,.70,.25],head);inner.rotation.z=-side*.20;
   ball(cream,[side*.041,-.040,.125],[.059,.040,.032],head);
   const eye=ball('#a9b77a',[side*.064,.026,.124],[.036,.031,.014],head,{roughness:.25});eye.name='cat-eye';
   const pupil=ball('#252b24',[side*.064,.026,.139],[.014,.024,.005],head,{roughness:.2});
   ball('#fff4dd',[-.30,.30,.90],[.29,.21,.28],pupil,{roughness:.15});
   this.eyes.push([eye,pupil]);
   for(let i=0;i<3;i++)stroke([[side*.045,-.043,.148],[side*.11,-.036-i*.012,.148],[side*(.18+i*.008),-.015-i*.028,.133]],.0012,cream,head);
   stroke([[side*.107,.005,.096],[side*.126,-.009,.075]],.0035,stripe,head);
   stroke([[side*.032,.090,.103],[side*.022,.066,.121],[0,.082,.115]],.0035,stripe,head);
  }
  ball(pink,[0,-.027,.163],[.019,.013,.010],head);
  stroke([[0,-.037,.153],[0,-.049,.151]],.0025,stripe,head);
  for(const side of [-1,1])stroke([[0,-.049,.151],[side*.015,-.059,.148],[side*.026,-.051,.146]],.002,stripe,head);
  const collar=w.mesh(new THREE.TorusGeometry(.103,.012,8,28),'#983f35',[0,.265,.20],null,g);collar.rotation.x=.38;
  this.bell=ball('#c9a455',[0,.225,.30],[.033,.035,.031],g,{metalness:.65,roughness:.3});this.bell.name='cat-collar-bell';
  w.rod([-.014,.218,.326],[.014,.218,.326],.0025,'#665332',g);
  const curve=new THREE.CatmullRomCurve3([new THREE.Vector3(.08,.10,-.28),new THREE.Vector3(.21,.07,-.37),new THREE.Vector3(.23,.06,-.13),new THREE.Vector3(.20,.055,.03)]);
  this.tail=w.mesh(new THREE.TubeGeometry(curve,20,.032,8,false),ginger,[0,0,0],null,g);this.tail.name='cat-curled-tail';
  // A connected arm reaches from the viewer, strokes behind the ears, then withdraws.
  this.hand=new THREE.Group();this.hand.name='petting-hand';this.hand.visible=false;w.scene.add(this.hand);
  this.palm=new THREE.Group();this.palm.name='petting-palm';this.hand.add(this.palm);
  ball('#b38a65',[0,0,0],[.060,.024,.079],this.palm);
  for(let i=0;i<4;i++)ball('#b38a65',[-.041+i*.027,0,-.084],[.012,.016,.037],this.palm);
  ball('#b38a65',[-.060,-.002,-.017],[.020,.020,.045],this.palm);
  this.forearm=w.cyl('#b38a65',[0,0,0],[.037,1,.037],this.hand);this.forearm.name='petting-forearm';
  this.upperArm=w.cyl('#b38a65',[0,0,0],[.045,1,.045],this.hand);
  this.elbowMesh=ball('#b38a65',[0,0,0],[.043,.043,.043],this.hand);
  this.viewer=new THREE.Vector3();this.localViewer=new THREE.Vector3();this.touchPoint=new THREE.Vector3();this.home=new THREE.Vector3();this.armStart=new THREE.Vector3();this.elbow=new THREE.Vector3();this.elbowLocal=new THREE.Vector3();this.wrist=new THREE.Vector3();this.segment=new THREE.Vector3();this.up=new THREE.Vector3(0,1,0);this.headQuaternion=new THREE.Quaternion();this.viewerQuaternion=new THREE.Quaternion();this.crownQuaternion=new THREE.Quaternion();this.handSideQuaternion=new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0,1,0),-Math.PI/2);this.crownNormal=new THREE.Vector3();

 }
 pet(position,options,now){
  if(!canPetCat(position,options)||this.petLeft>0||now-this.lastPet<2.5)return false;
  this.petLeft=2.2;this.lastPet=now;return true;
 }
 update(position,dt,now,{enabled=false}={}){
  const distance=Math.hypot(position.x-CAT_SPOT.x,position.z-CAT_SPOT.z);
  if(distance>2.8)this.near=false;
  let meow=false;
  if(enabled&&!this.near&&distance<=2.1){this.near=true;if(now-this.lastMeow>=12){this.lastMeow=now;meow=true;}}
  if(!enabled||distance>CAT_PET_DISTANCE){this.petLeft=0;this.hand.visible=false;}
  if(this.petLeft>0)this.petLeft=Math.max(0,this.petLeft-dt);const petting=this.petLeft>1e-6;
  const moving=!this.w.reduced,elapsed=2.2-this.petLeft;
  this.viewer.set(position.x,Number.isFinite(position.y)?position.y:1.9,position.z);
  this.group.updateWorldMatrix(true,false);this.localViewer.copy(this.viewer);this.group.worldToLocal(this.localViewer);this.localViewer.sub(this.head.position);
  const watching=enabled&&distance<=2.1,yaw=watching?Math.atan2(this.localViewer.x,this.localViewer.z):0;
  const pitch=watching?THREE.MathUtils.clamp(-Math.atan2(this.localViewer.y,Math.hypot(this.localViewer.x,this.localViewer.z)),-1.1,.12):0;
  const blend=moving?1-Math.exp(-Math.max(0,dt)*7):1;
  this.head.rotation.y+=Math.atan2(Math.sin(yaw-this.head.rotation.y),Math.cos(yaw-this.head.rotation.y))*blend;
  this.head.rotation.x+=(pitch-this.head.rotation.x)*blend;
  this.head.rotation.z=petting?(moving?Math.sin(elapsed*3)*.025:.025):0;
  this.tail.rotation.y=moving?Math.sin(now*(petting?2:.7))*(petting?.04:.018):0;
  this.bell.rotation.z=petting&&moving?Math.sin(now*4)*.08:0;
  const blink=petting&&moving?1-.83*Math.exp(-(((elapsed-1.05)/.16)**2)):1;
  for(const [eye,pupil] of this.eyes){eye.scale.y=.031*(petting?.88:1)*blink;pupil.scale.y=.024*(petting?.88:1)*blink;}
  this.hand.visible=petting&&moving;
  if(this.hand.visible){
   this.head.updateWorldMatrix(true,false);this.head.getWorldQuaternion(this.headQuaternion);
   this.viewerQuaternion.copy(this.w.camera?.quaternion||this.group.quaternion);
   const reach=THREE.MathUtils.smoothstep(elapsed,0,.40)*(1-THREE.MathUtils.smoothstep(elapsed,1.85,2.2));
   const strokePhase=THREE.MathUtils.clamp((elapsed-.40)/1.45,0,1)*Math.PI*3;
   this.elbow.set(.72,-.22,-.50).applyQuaternion(this.viewerQuaternion).add(this.viewer);this.elbowLocal.copy(this.elbow);this.head.worldToLocal(this.elbowLocal);
   const side=Math.sign(this.elbowLocal.x)||1;this.handSideQuaternion.setFromAxisAngle(this.up,side*Math.PI/2);
   const x=side*.035,z=-.045-.035*(.5-.5*Math.cos(strokePhase)),y=.14*Math.sqrt(1-(x/.155)**2-(z/.14)**2);
   this.crownNormal.set(x/(.155*.155),y/(.14*.14),z/(.14*.14)).normalize();this.crownQuaternion.setFromUnitVectors(this.up,this.crownNormal);this.headQuaternion.multiply(this.crownQuaternion).multiply(this.handSideQuaternion);
   this.touchPoint.set(x,y,z).addScaledVector(this.crownNormal,.026);this.head.localToWorld(this.touchPoint);
   this.home.set(.24,-.62,-.28).applyQuaternion(this.viewerQuaternion).add(this.viewer);
   this.palm.position.lerpVectors(this.home,this.touchPoint,reach);this.palm.position.y+=Math.sin(Math.PI*reach)*.07;
   this.palm.quaternion.copy(this.viewerQuaternion).slerp(this.headQuaternion,reach);
   this.armStart.set(.33,-.60,.12).applyQuaternion(this.viewerQuaternion).add(this.viewer);
   this.wrist.set(.006,.010,.070).applyQuaternion(this.palm.quaternion).add(this.palm.position);
   this.elbowMesh.position.copy(this.elbow);
   this.poseArm(this.upperArm,this.armStart,this.elbow);this.poseArm(this.forearm,this.elbow,this.wrist);
  }

  return meow;
 }
 poseArm(mesh,from,to){this.segment.copy(to).sub(from);const length=this.segment.length();mesh.position.copy(from).add(to).multiplyScalar(.5);mesh.scale.y=length;if(length>1e-8)mesh.quaternion.setFromUnitVectors(this.up,this.segment.divideScalar(length));}

}

export class CatSound{
 constructor(){this.audio=null;}
 meow(){try{this.audio??=new Audio('./assets/cat-meow.ogg');if(!this.audio.paused)return;this.audio.volume=.42;this.audio.currentTime=0;this.audio.play().catch(()=>{});}catch{/* Audio support must never affect the tour. */}}
 stop(){this.audio?.pause();if(this.audio)this.audio.currentTime=0;}
}
