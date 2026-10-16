import * as THREE from './assets/three.module.js';

const SEGMENT=.35;
const REACH=SEGMENT*2;
const WRIST_TO_PALM=.05;
const EPSILON=1e-8;

// Pose the existing meshes; their geometry and instance references stay unchanged.
export class RitualArms{
 constructor(person,{elbowPole=[.6,-.3,.25]}={}){
  this.person=person;
  this.elbowPole=new THREE.Vector3(...elbowPole);
  this.arms=person.arms.map((group,index)=>{
   const [shoulder,upper,elbow,forearm,palm,thumb]=group.children;
   if(!shoulder||!upper?.isMesh||!elbow||!forearm?.isMesh||palm?.name!=='human-hand'||!thumb)throw new Error('RitualArms needs the existing human arm rig');
   return {group,shoulder,upper,elbow,forearm,palm,thumb,side:index?1:-1,posed:false,
    restRotation:group.rotation.clone(),
    rest:group.children.slice(0,6).map(object=>({object,position:object.position.clone(),quaternion:object.quaternion.clone(),scale:object.scale.clone()})),
    thumbOffset:thumb.position.clone().sub(palm.position),target:new THREE.Vector3()};
  });
  this.target=new THREE.Vector3();this.direction=new THREE.Vector3();this.pole=new THREE.Vector3();this.elbow=new THREE.Vector3();this.wrist=new THREE.Vector3();this.segment=new THREE.Vector3();this.origin=new THREE.Vector3();this.up=new THREE.Vector3(0,1,0);
 }
 pose(index,targetWorld){
  const arm=this.arms[index];
  if(!arm||!targetWorld||!Number.isFinite(targetWorld.x)||!Number.isFinite(targetWorld.y)||!Number.isFinite(targetWorld.z))return false;
  const {group}=arm;
  this.person.body.updateWorldMatrix(true,false);
  this.target.copy(targetWorld);this.person.body.worldToLocal(this.target);this.target.sub(group.position).divide(group.scale);
  const distance=this.target.length();
  // Leave unreachable poses at rest instead of implying that a clamped palm touched.
  if(!Number.isFinite(distance)||distance>REACH+EPSILON){this.restoreArm(arm);return false;}
  group.rotation.set(0,0,0);
  this.direction.copy(this.target);if(distance>EPSILON)this.direction.divideScalar(distance);else this.direction.set(0,0,1);
  this.pole.set(arm.side*this.elbowPole.x,this.elbowPole.y,this.elbowPole.z).addScaledVector(this.direction,-this.pole.dot(this.direction));
  if(this.pole.lengthSq()<EPSILON){this.pole.set(0,-1,0).addScaledVector(this.direction,this.direction.y);if(this.pole.lengthSq()<EPSILON)this.pole.set(1,0,0);}
  this.pole.normalize();
  const along=distance*.5,height=Math.sqrt(Math.max(0,SEGMENT*SEGMENT-along*along));
  this.elbow.copy(this.direction).multiplyScalar(along).addScaledVector(this.pole,height);
  this.placeRod(arm.upper,this.origin,this.elbow);
  arm.elbow.position.copy(this.elbow);
  this.segment.copy(this.target).sub(this.elbow).normalize();this.wrist.copy(this.target).addScaledVector(this.segment,-WRIST_TO_PALM);
  this.placeRod(arm.forearm,this.elbow,this.wrist);
  arm.palm.position.copy(this.target);arm.palm.quaternion.identity();
  arm.thumb.position.copy(this.target).add(arm.thumbOffset);arm.thumb.quaternion.copy(arm.rest[5].quaternion);
  arm.target.copy(targetWorld);arm.posed=true;
  return true;
 }
 placeRod(mesh,start,end){
  this.segment.copy(end).sub(start);const length=this.segment.length();
  mesh.position.copy(start).add(end).multiplyScalar(.5);mesh.scale.y=length;
  if(length>EPSILON)mesh.quaternion.setFromUnitVectors(this.up,this.segment.divideScalar(length));else mesh.quaternion.identity();
 }
 restoreArm(arm){
  if(!arm.posed)return;
  arm.group.rotation.copy(arm.restRotation);
  for(const {object,position,quaternion,scale} of arm.rest){object.position.copy(position);object.quaternion.copy(quaternion);object.scale.copy(scale);}
  arm.posed=false;
 }
 restore(){for(const arm of this.arms)this.restoreArm(arm);}
}
