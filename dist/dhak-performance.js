import * as THREE from './assets/three.module.js';
import {RitualArms} from './ritual-arms.js';

export function installDhakPerformance(w,person,drum,{phase=0,color='#d7b875'}={}){
 person.drum=drum;person.armPose=new RitualArms(person);person.sticks=[];
 const gripOffset=new THREE.Vector3(.10,.03,-.30).normalize().multiplyScalar(.34);
 const tip=new THREE.Vector3(),grip=new THREE.Vector3(),direction=new THREE.Vector3(),up=new THREE.Vector3(0,1,0);
 for(let i=0;i<2;i++){
  const stick=w.rod([0,0,0],[0,.34,0],.012,color,person.body);stick.name='dhak-stick';person.sticks.push(stick);
 }
 w.animations.push(t=>{
  for(let i=0;i<2;i++){
   const side=i?1:-1,lift=w.reduced?0:(1+Math.sin(t*14+phase+i*Math.PI))*.5;
   // The tip taps the outer skin. The grip remains beyond that end plane,
   // so neither a hand nor the shaft sweeps through the solid barrel.
   tip.set(side*(.463+lift*.04),.20+lift*.02,.15);
   grip.copy(tip);grip.x+=side*gripOffset.x;grip.y+=gripOffset.y;grip.z+=gripOffset.z;
   drum.localToWorld(tip);drum.localToWorld(grip);
   if(!person.armPose.pose(i,grip))continue;
   person.arms[i].getObjectByName('human-hand').getWorldPosition(grip);
   person.body.worldToLocal(tip);person.body.worldToLocal(grip);
   const stick=person.sticks[i];direction.copy(tip).sub(grip);const length=direction.length();
   stick.position.copy(tip).add(grip).multiplyScalar(.5);stick.scale.y=length;stick.quaternion.setFromUnitVectors(up,direction.divideScalar(length));
  }
 });
}
