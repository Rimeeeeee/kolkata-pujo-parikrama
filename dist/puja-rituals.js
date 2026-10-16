import * as THREE from './assets/three.module.js';
import {PUJA_MODES,newPuja,nearXZ,transitionPuja,pujaControls} from './puja-state.js';
import {RitualArms} from './ritual-arms.js';

const FLOWER_TARGET=new THREE.Vector3(.12,3.55,-21.12);
const SINDOOR_PAIRS=[[0,5],[1,2],[3,4]];
const smooth=(a,b,value)=>THREE.MathUtils.smoothstep(value,a,b);
function segmentClearanceSquared(a,b,point){
 const x=b.x-a.x,z=b.z-a.z,length=x*x+z*z;
 const k=length?THREE.MathUtils.clamp(((point.x-a.x)*x+(point.z-a.z)*z)/length,0,1):0;
 return (a.x+x*k-point.x)**2+(a.z+z*k-point.z)**2;
}
export class PujaRituals{
 constructor(w,{onChant=()=>{}}={}){
  this.w=w;this.onChant=onChant;this.state=newPuja();this.root=new THREE.Group();this.root.name='puja-rituals';w.scene.add(this.root);this.hidden=new Map();this.actors=[];this.time=0;this.priestRest=w.priest.arms.map(a=>a.rotation.clone());this.priestYaw=w.priest.g.rotation.y;
  this.night={background:w.scene.background.clone(),fog:w.scene.fog.color.clone(),density:w.scene.fog.density,exposure:w.renderer.toneMappingExposure};this.lights=[];this.glows=[];
  w.scene.traverse(o=>{if(o.isLight)this.lights.push({o,intensity:o.intensity,color:o.color.clone(),ground:o.groundColor?.clone()});if(o.material?.emissiveIntensity>0&&o.material.emissive?.getHex()>0&&!this.glows.some(m=>m.o===o.material))this.glows.push({o:o.material,intensity:o.material.emissiveIntensity,color:o.material.color.clone()});});
  for(let i=0;i<12;i++){
   const p=w.person(0,-12,{sari:i<7,outfit:i<7?'#eee0c5':['#b65a42','#d6b983','#6e8980','#c5a29f','#d6b983'][i-7],pose:'idle'});w.people.splice(w.people.indexOf(p),1);this.root.add(p.g);p.active=false;p.role='';p.g.name=i===0?'paromita-di':'ritual-visitor';if(i<7){const border=w.box('#a53231',[-.12,1.18,.22],[.075,.88,.025],p.body);border.rotation.z=-.18;}p.armPose=new RitualArms(p);p.bowls=p.arms.map(a=>this.dhunuchi(a));p.flowers=this.flowers(p.body);p.flowers.position.set(0,1.20,.35);p.marks=this.sindoor(p.body);this.actors.push(p);
  }
  const before=new Set(w.scene.children);w.batchPeople(this.actors);this.batches=w.scene.children.filter(o=>!before.has(o)&&o.isInstancedMesh);for(const mesh of this.batches){mesh.name='instanced-ritual-visitors';mesh.frustumCulled=false;this.root.add(mesh);}
  this.handRig=new THREE.Group();this.handRig.name='your-offering-hands';this.handRig.position.set(0,-.40,-.88);w.camera.add(this.handRig);
  this.hands=[];for(const side of [-1,1]){const hand=new THREE.Group();this.handRig.add(hand);this.hands.push(hand);w.ball('#b38a65',[side*.12,0,0],[.10,.035,.13],hand);for(let i=0;i<4;i++)w.ball('#b38a65',[side*(.055+i*.031),.015,-.10],[.018,.026,.075],hand);}
  this.handFlowers=this.flowers(this.handRig);this.handFlowers.position.y=.06;this.handSindoor=w.ball('#c12c38',[.12,.045,-.10],[.06,.012,.04],this.handRig);this.handSindoor.visible=false;this.flight=this.flowers(this.root);this.flightStart=new THREE.Vector3();this.flightEnd=new THREE.Vector3();
  this.offerings=Array.from({length:3},(_,i)=>{const g=this.flowers(this.root);g.position.copy(FLOWER_TARGET).add(new THREE.Vector3((i-1)*.21,-.04,0));g.scale.setScalar(.75);return g;});
  this.idolSindoor=new THREE.Group();this.idolSindoor.name='maa-sindoor-marks';this.root.add(this.idolSindoor);for(const x of [-.16,.16])w.ball('#b42a2e',[x,6.32,-21.225],[.065,.035,.004],this.idolSindoor,{transparent:true,opacity:.76});w.ball('#b42a2e',[0,6.64,-21.225],[.018,.06,.004],this.idolSindoor);
  this.priestPalm=w.priest.arms[1].getObjectByName('human-hand');this.sindoorVisitor=null;this.contactPosition=new THREE.Vector3();this.contactViewer=new THREE.Vector3();this.point=new THREE.Vector3();this.handTarget=new THREE.Vector3();
  this.camera=new THREE.PerspectiveCamera(56,w.camera.aspect,.1,100);this.camera.position.set(0,4.1,2.8);this.camera.lookAt(0,2,-8);this.setMode('saptami');
 }
 flowers(parent){const g=new THREE.Group();g.name='puja-flowers';parent.add(g);for(let i=0;i<7;i++){const a=i*2.4,x=Math.cos(a)*.075,z=Math.sin(a)*.065,y=.02+Math.sin(i)*.012,color=i%2?'#edbd45':'#e37a30';this.w.ball('#d8992b',[x,y+.01,z],[.018,.014,.018],g);for(let j=0;j<6;j++){const angle=j*Math.PI/3;const petal=this.w.ball(color,[x+Math.cos(angle)*.025,y,z+Math.sin(angle)*.025],[.026,.012,.019],g);petal.rotation.y=-angle;}}for(const side of [-1,1]){const leaf=this.w.ball('#5e8549',[side*.055,-.02,.02],[.033,.009,.10],g);leaf.rotation.y=side*.5;}return g;}
 sindoor(parent){const g=new THREE.Group();g.name='cheek-sindoor';parent.add(g);for(const side of [-1,1])this.w.ball('#be3036',[side*.10,1.81,.14],[.035,.017,.012],g);return g;}
 dhunuchi(parent){
  const w=this.w,g=new THREE.Group();g.name='terracotta-dhunuchi';g.position.set(.05,-.43,.06);parent.add(g);
  const shape=w.geometries.dhunuchi??=new THREE.LatheGeometry([[.035,0],[.04,.15],[.13,.19],[.21,.29],[.23,.34],[.20,.35],[.11,.27]].map(([x,y])=>new THREE.Vector2(x,y)),14);
  w.mesh(shape,'#a35b38',[0,0,0],null,g);w.cyl('#5e3829',[0,.285,0],[.155,.035,.155],g);for(let i=0;i<4;i++)w.ball('#cb7439',[Math.cos(i*2)*.09,.31,Math.sin(i*2)*.09],[.035,.02,.035],g,{emissive:'#d76c27',emissiveIntensity:.7});
  g.smoke=[];for(let i=0;i<3;i++){const puff=w.ball('#ddd4c1',[0,.4+i*.18,0],[.10,.12,.10],g,{transparent:true,opacity:.16,depthWrite:false});g.smoke.push(puff);}return g;
 }
 active(index,x,z,role){const p=this.actors[index];p.active=true;p.role=role;p.g.position.set(x,.4,z);p.home=p.g.position.clone();p.g.rotation.y=Math.PI;return p;}
 hideBase(x,z,radius){for(const p of this.w.people){if(p.characterId||p.nonInteractable||Math.hypot(p.g.position.x-x,p.g.position.z-z)>radius)continue;if(!this.hidden.has(p))this.hidden.set(p,p.g.visible);p.ritualHidden=true;if(!p.batched)p.g.visible=false;}}
 restoreBase(){for(const [p,visible] of this.hidden){p.ritualHidden=false;if(!p.batched)p.g.visible=visible;}this.hidden.clear();}
 lighting(daylight){const w=this.w,n=this.night;w.scene.background.set(daylight?'#bbd9e9':n.background);w.scene.fog.color.set(daylight?'#c2d6df':n.fog);w.scene.fog.density=daylight?.006:n.density;w.renderer.toneMappingExposure=daylight?1.03:n.exposure;
  for(const {o,intensity,color,ground} of this.lights){o.intensity=daylight?(o.isPointLight?0:o.isHemisphereLight?3.2:3.1):intensity;o.color.copy(daylight?new THREE.Color(o.isHemisphereLight?'#e5f1ff':'#fff2d7'):color);if(ground)o.groundColor.copy(daylight?new THREE.Color('#aa9276'):ground);}
  for(const {o,intensity,color} of this.glows){o.emissiveIntensity=daylight?0:intensity;o.color.copy(daylight?new THREE.Color('#bcb3a0'):color);}
 }
 setMode(mode){if(!PUJA_MODES[mode])return false;this.restoreBase();this.sindoorVisitor=null;this.actors.forEach(p=>{p.armPose.restore();p.active=false;p.flowers.visible=false;p.marks.visible=false;p.bowls.forEach(b=>b.visible=false);});this.state=newPuja(mode);this.w.pujaMode=mode;this.w.ritualLocked=false;this.w.renderCamera=null;if(!PUJA_MODES[mode].fireworks)this.w.stopFireworks();this.lighting(PUJA_MODES[mode].daylight);this.w.priestLamp.visible=mode==='saptami';this.idolSindoor.visible=mode==='dashami';this.handRig.visible=false;this.flight.visible=false;this.offerings.forEach(g=>g.visible=false);if(mode==='dashami')this.active(0,-1.8,-17.1,'host');this.w.priest.arms.forEach((a,i)=>a.rotation.copy(this.priestRest[i]));this.w.priest.g.rotation.y=this.priestYaw;this.flush();return true;}
 context(entered,blocked=false){const position=this.w.camera.position;return {entered,blocked,nearPriest:nearXZ(position,this.w.priest.g.position),nearDhaki:nearXZ(position,this.w.characters.get('dhaki').g.position),nearHost:nearXZ(position,this.actors[0].g.position),nearDancers:this.actors.some(p=>p.active&&p.role==='dancer'&&nearXZ(position,p.g.position,2.1)),nearWomen:this.actors.some(p=>p.active&&['woman','host'].includes(p.role)&&nearXZ(position,p.g.position,2.1))};}
 controls(entered,blocked){return pujaControls(this.state,this.context(entered,blocked));}
 action(action,entered,blocked=false){const old=this.state,next=transitionPuja(old,action,this.context(entered,blocked));if(next.phase===old.phase&&next.joined===old.joined)return false;this.state=next;
  if(action==='start')this.gather();if(next.phase==='offering'){this.handFlowers.getWorldPosition(this.flightStart);this.flightEnd.copy(FLOWER_TARGET);}
  if(next.mode==='navami'&&next.joined){this.w.stop();this.w.ritualLocked=true;this.w.renderCamera=this.camera;const p=this.active(11,0,-3.2,'player');p.g.rotation.y=Math.PI;}
  if(next.mode==='dashami'&&next.phase==='applying'){
   this.sindoorVisitor=this.actors.filter(p=>p.active&&['woman','host'].includes(p.role)).sort((a,b)=>a.g.position.distanceToSquared(this.w.camera.position)-b.g.position.distanceToSquared(this.w.camera.position))[0];
   if(!this.stageSindoor(this.sindoorVisitor)){this.state=old;this.sindoorVisitor=null;return false;}
  }
  this.flush();return true;
 }
 gather(){const s=this.state;this.actors.forEach(p=>p.active=false);
  if(s.mode==='ashtami'){this.hideBase(0,-14.4,5.1);[[-1.8,-14.6],[1.8,-14.6],[-3,-13.1],[3,-13.1],[0,-12.4]].forEach(([x,z],i)=>{const p=this.active([1,2,7,8,9][i],x,z,'anjali');p.spawn=p.home.clone().add(new THREE.Vector3(x<0?-1:1,0,1.2));});}
  if(s.mode==='navami'){this.hideBase(0,-6,5.3);[1,2,7,8,9].forEach((index,i)=>{const a=i*Math.PI*2/5;const p=this.active(index,Math.cos(a)*2.05,-6+Math.sin(a)*2.05,'dancer');p.angle=a;});[[-3.8,-3.1],[3.8,-3.1],[0,-10.4]].forEach(([x,z],i)=>this.active([3,4,10][i],x,z,'audience'));}
  if(s.mode==='dashami'){this.hideBase(0,-14.4,5.4);this.active(0,-1.8,-17.1,'host').pairYaw=Math.PI/2;[[-3.4,-16],[-2.7,-16],[1.5,-15],[2.2,-15],[-1.1,-17.1]].forEach(([x,z],i)=>{this.active(i+1,x,z,'woman').pairYaw=i%2?-Math.PI/2:Math.PI/2;});this.actors[5].pairYaw=-Math.PI/2;}
 }
 leave(){const mode=this.state.mode;this.state=transitionPuja(this.state,'leave');this.sindoorVisitor=null;this.w.ritualLocked=false;this.w.renderCamera=null;this.actors[11].active=false;if(mode==='ashtami'){this.restoreBase();this.actors.forEach(p=>p.active=false);this.handRig.visible=false;this.flight.visible=false;this.offerings.forEach(g=>g.visible=false);}this.flush();}
 obstacles(){return this.actors.filter(p=>p.active).map(p=>({x:p.g.position.x,z:p.g.position.z,radius:.34}));}
 target(){return this.state.mode==='ashtami'?{position:[0,2.1,-15.1],look:[0,4.7,-21.25]}:this.state.mode==='navami'?(this.state.started?{position:[0,2.1,-2.9],look:[0,1.5,-6]}:{position:[-4.8,2.1,-6.2],look:[-6.5,2,-7.7]}):{position:[-1.8,2.1,-14.9],look:[-.8,4.6,-20.5]};}
 marker(){if(this.state.phase!=='idle')return null;const p=this.state.mode==='ashtami'?this.w.priest:this.state.mode==='navami'?this.w.characters.get('dhaki'):this.actors[0];return [p.g.position.x,2.8,p.g.position.z];}
 decoratePortrait(p){if(this.state.mode==='dashami'&&this.state.applied)this.sindoor(p.body);}
 stageSindoor(visitor){
  const viewer=this.w.camera.position,home=visitor.home;
  const angle=Math.atan2(home.z-viewer.z,home.x-viewer.x);
  const neighbours=this.actors.filter(p=>p.active&&p!==visitor);
  const playerClearance=Math.min(.68,Math.hypot(home.x-viewer.x,home.z-viewer.z));
  // Keep the complete out-and-back segment clear, not only its contact endpoint.
  // Small angular alternatives retain the same reachable .70 contact distance.
  for(let attempt=0;attempt<=252;attempt++){
   const offset=attempt?Math.ceil(attempt/2)*.025*(attempt%2?1:-1):0;
   this.contactPosition.set(viewer.x+Math.cos(angle+offset)*.70,.4,viewer.z+Math.sin(angle+offset)*.70);
   if(segmentClearanceSquared(home,this.contactPosition,viewer)+1e-10<playerClearance**2)continue;
   if(neighbours.some(p=>segmentClearanceSquared(home,this.contactPosition,p.home)<.6801**2))continue;
   this.contactViewer.copy(viewer);return true;
  }
  return false;
 }
 sindoorMotion(){
  if(this.state.phase!=='applying')return {approach:0,contact:0};
  if(this.w.reduced)return {approach:1,contact:1};
  const k=this.state.elapsed/1.8;
  return {approach:smooth(0,.25,k)*(1-smooth(.80,1,k)),contact:smooth(.28,.42,k)*(1-smooth(.64,.78,k))};
 }
 poseSindoor(t,motion){
  const s=this.state,w=this.w,visitor=s.phase==='applying'?this.sindoorVisitor:null;
  for(const [pairIndex,pair] of SINDOOR_PAIRS.entries())for(const [member,index] of pair.entries()){
   const p=this.actors[index],partner=this.actors[pair[1-member]];
   if(!p.active)continue;
   if(!s.started){p.armPose.restore();continue;}
   let reach=0;
   if(s.started){
    if(p===visitor){
     this.point.copy(this.contactPosition).sub(this.contactViewer);this.point.y=0;this.point.normalize();
     const x=this.point.x,z=this.point.z;
     this.handTarget.copy(w.camera.position).addScaledVector(this.point,.10);this.handTarget.x+=z*.08;this.handTarget.z-=x*.08;this.handTarget.y-=.04;
     reach=motion.contact;
    }else if(partner!==visitor){
     const cycle=w.reduced?.5:((t+pairIndex*.6)%5.6)/2.8;
     const turn=Math.floor(cycle),k=cycle-turn;
     if(turn===member)reach=w.reduced?1:smooth(0,.28,k)*(1-smooth(.72,1,k));
     partner.marks.children[1].getWorldPosition(this.handTarget);
    }
   }
   for(let arm=0;arm<2;arm++){
    this.point.set((arm?1:-1)*.29,1.04,.14);p.body.localToWorld(this.point);
    if(arm===0&&reach)this.point.lerp(this.handTarget,reach);
    p.armPose.pose(arm,this.point);
   }
  }
  if(visitor){
   visitor.marks.children[1].getWorldPosition(this.point);w.camera.worldToLocal(this.point);this.point.x-=.12;
   this.handRig.position.lerp(this.point,motion.contact);
  }
 }
 update(dt,t){
  if(this.state.mode==='saptami')return;
  this.time+=dt;const w=this.w;
  // A manual step cancels contact; the neighbour never chases the visitor.
  if(this.state.phase==='applying'&&w.camera.position.distanceToSquared(this.contactViewer)>.0016)this.state=transitionPuja(this.state,'leave');
  const old=this.state;this.state=transitionPuja(old,'tick',{...this.context(w.hasEntered),dt});const s=this.state,motion=this.sindoorMotion();
  if(old.phase!==s.phase&&s.phase==='chanting')this.onChant();
  this.handRig.visible=s.mode==='ashtami'&&s.started&&!['complete','gathering'].includes(s.phase)||s.mode==='dashami'&&s.phase==='applying';this.handRig.position.set(s.mode==='dashami'?.12:0,-.40,-.88);this.handRig.rotation.x=s.mode==='dashami'?Math.PI/2:0;this.hands[0].visible=s.mode!=='dashami';this.handSindoor.visible=s.mode==='dashami';this.handFlowers.visible=s.mode==='ashtami'&&['chanting','ready'].includes(s.phase);this.flight.visible=s.mode==='ashtami'&&['receiving','offering'].includes(s.phase);
  const priest=w.priest;
  priest.g.rotation.y=s.mode==='ashtami'&&s.phase==='receiving'?Math.atan2(w.camera.position.x-priest.g.position.x,w.camera.position.z-priest.g.position.z):Math.atan2(-priest.g.position.x,-21.25-priest.g.position.z);
  priest.arms[0].rotation.x=s.phase==='receiving'?-.9:-.25;priest.arms[1].rotation.x=s.phase==='receiving'?-1.05:-.25;
  if(s.mode==='ashtami'){
   if(s.phase==='receiving'){this.priestPalm.localToWorld(this.flightStart.set(0,0,1.4));this.handFlowers.getWorldPosition(this.flightEnd);}
   if(this.flight.visible){const k=Math.min(1,s.elapsed/(s.phase==='receiving'?1.5:1.15));this.flight.position.lerpVectors(this.flightStart,this.flightEnd,k);this.flight.position.y+=Math.sin(k*Math.PI)*(s.phase==='offering'?1.1:.22);}
   const count=s.phase==='complete'?3:Math.max(0,s.round-1);this.offerings.forEach((g,i)=>g.visible=i<count);
  }
  this.w.ritualLocked=s.mode==='navami'&&s.joined;this.camera.aspect=w.camera.aspect;this.camera.updateProjectionMatrix();
  for(const [i,p] of this.actors.entries()){
   const dance=['dancer','player'].includes(p.role),female=['host','woman'].includes(p.role);p.flowers.visible=p.role==='anjali';p.marks.visible=female&&s.started;
   p.bowls.forEach(b=>b.visible=dance);if(!p.active)continue;
   const phase=t*2.8+i*.9;p.g.position.y=.4;p.body.position.y=0;p.body.rotation.z=0;if(p.role==='anjali'&&p.spawn)p.g.position.lerpVectors(p.spawn,p.home,s.phase==='gathering'?Math.min(1,s.elapsed/1.1):1);
   if(dance&&w.reduced){p.g.position.copy(p.home);p.g.rotation.y=Math.PI;}
   if(dance&&!w.reduced){p.g.position.x=p.home.x+Math.sin(phase)*.14;p.g.position.z=p.home.z+Math.cos(phase)*.12;p.g.rotation.y=Math.PI+Math.sin(phase*.65)*.45;p.body.position.y=Math.abs(Math.sin(phase*1.6))*.11;p.body.rotation.z=Math.sin(phase)*.12;}
   if(female){p.g.position.copy(p.home);if(p===this.sindoorVisitor&&s.phase==='applying')p.g.position.lerp(this.contactPosition,motion.approach);p.g.rotation.y=p===this.sindoorVisitor&&s.phase==='applying'?Math.atan2(w.camera.position.x-p.g.position.x,w.camera.position.z-p.g.position.z):s.started?p.pairYaw:0;}
   else {p.armPose.restore();p.arms.forEach((a,j)=>{a.rotation.x=dance?-1.05+(w.reduced?0:Math.sin(phase+j*2)*.42):p.role==='anjali'?-.9:0;a.rotation.z=dance?(j?-.5:.5)+(w.reduced?0:Math.sin(phase*.8)*.3):0;});}
   p.bowls.forEach((b,j)=>{if(!dance)return;b.rotation.x=-p.arms[j].rotation.x;b.smoke.forEach((puff,k)=>{const age=w.reduced?k*.25:(t*.45+k*.33+i*.05)%1;puff.position.set(w.reduced?0:Math.sin(t+k)*.06,.38+age*.65,w.reduced?0:Math.cos(t+k)*.05);puff.scale.setScalar(.07+age*.1);});});
  }
  if(s.mode==='dashami')this.poseSindoor(t,motion);
  this.batchElapsed=(this.batchElapsed||0)+dt;if(this.batchElapsed>=1/24){this.batchElapsed=0;this.flush();}
 }
 flush(){
  for(const mesh of this.batches)mesh.count=0;
  for(const p of this.actors){if(!p.active)continue;p.g.updateWorldMatrix(true,true);for(const ref of p.instances||[]){let visible=true;for(let o=ref.object;o&&o!==p.g;o=o.parent)if(!o.visible){visible=false;break;}if(visible)ref.mesh.setMatrixAt(ref.mesh.count++,ref.object.matrixWorld);}}
  for(const mesh of this.batches){mesh.visible=mesh.count>0;mesh.instanceMatrix.needsUpdate=true;}
 }
}
