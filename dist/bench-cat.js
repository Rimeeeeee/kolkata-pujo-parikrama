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
  const ginger='#bf7a42',stripe='#845136',cream='#eee0c3',pink='#b77772';
  // A lean domestic shorthair, curled on the plank, with white socks and tabby marks.
  this.body=w.ball(ginger,[0,.165,-.055],[.19,.165,.33],g);this.body.name='cat-body';
  w.ball(cream,[0,.17,.17],[.12,.145,.15],g);
  for(const side of [-1,1]){w.ball(ginger,[side*.11,.075,.20],[.065,.07,.19],g);w.ball(cream,[side*.11,.045,.33],[.068,.045,.075],g);}
  const head=this.head=new THREE.Group();head.position.set(0,.36,.24);g.add(head);
  w.ball(ginger,[0,0,0],[.145,.13,.13],head);
  for(const side of [-1,1]){
   const ear=w.mesh('cone',ginger,[side*.10,.13,-.018],[.072,.16,.055],head);ear.rotation.z=-side*.18;
   const inside=w.mesh('cone',pink,[side*.10,.14,.016],[.041,.105,.012],head);inside.rotation.z=-side*.18;
   w.ball(cream,[side*.047,-.04,.115],[.063,.045,.037],head);
   const eye=w.ball('#a8b66d',[side*.065,.028,.111],[.034,.025,.013],head);eye.name='cat-eye';
   const pupil=w.ball('#292a22',[side*.065,.028,.123],[.006,.022,.005],head);
   (this.eyes??=[]).push([eye,pupil]);
   for(let i=0;i<2;i++)w.rod([side*.05,-.04,.139],[side*(.17+i*.025),-.02-i*.035,.12],.002,cream,head);
   for(let i=0;i<3;i++){const mark=w.ball(stripe,[side*.178,.16,-.20+i*.13],[.012,.065,.027],g);mark.rotation.x=-.25;}
   const cheek=w.rod([side*.098,-.006,.09],[side*.13,-.025,.07],.009,stripe,head);cheek.name='tabby-cheek';
  }
  w.ball(pink,[0,-.025,.15],[.023,.016,.013],head);
  w.rod([0,-.04,.145],[0,-.058,.14],.003,stripe,head);
  for(const side of [-1,1])w.rod([0,.065,.124],[side*.025,.10,.092],.009,stripe,head);
  const collar=w.mesh(new THREE.TorusGeometry(.103,.014,5,20),'#983f35',[0,.265,.20],null,g);collar.rotation.x=.38;
  const bell=this.bell=w.ball('#c9a455',[0,.225,.30],[.033,.035,.031],g,{metalness:.65,roughness:.3});bell.name='cat-collar-bell';
  w.rod([-.014,.218,.326],[.014,.218,.326],.003,'#665332',g);
  const curve=new THREE.CatmullRomCurve3([new THREE.Vector3(.08,.10,-.28),new THREE.Vector3(.21,.07,-.37),new THREE.Vector3(.23,.06,-.13),new THREE.Vector3(.20,.055,.03)]);
  this.tail=w.mesh(new THREE.TubeGeometry(curve,14,.034,6,false),ginger,[0,0,0],null,g);this.tail.name='cat-curled-tail';
  // Only visible during a user-triggered stroke; never a movement/camera lock.
  this.hand=new THREE.Group();this.hand.name='petting-hand';this.hand.visible=false;w.scene.add(this.hand);
  w.ball('#b38a65',[0,0,0],[.065,.026,.095],this.hand);for(let i=0;i<4;i++)w.ball('#b38a65',[-.045+i*.03,0,-.095],[.013,.019,.045],this.hand);
  w.ball('#b38a65',[-.067,-.005,-.02],[.022,.024,.05],this.hand);
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
  const petting=this.petLeft>0;if(petting)this.petLeft=Math.max(0,this.petLeft-dt);
  const moving=!this.w.reduced;
  this.head.rotation.z=petting?(moving?Math.sin((2.2-this.petLeft)*4)*.075:.07):0;
  this.tail.rotation.y=moving?Math.sin(now*(petting?3:.7))*(petting?.09:.025):0;
  this.bell.rotation.z=petting&&moving?Math.sin(now*5)*.12:0;
  for(const [eye,pupil] of this.eyes){eye.scale.y=petting?.005:.025;pupil.scale.y=petting?.003:.022;}
  this.hand.visible=petting&&moving;
  if(this.hand.visible){this.group.updateWorldMatrix(true,false);this.hand.position.copy(this.group.localToWorld(new THREE.Vector3(0,.35,.06+Math.sin((2.2-this.petLeft)*5)*.08)));this.hand.rotation.y=this.group.rotation.y;}
  return meow;
 }
}

export class CatSound{
 constructor(){this.audio=null;}
 meow(){try{this.audio??=new Audio('./assets/cat-meow.ogg');if(!this.audio.paused)return;this.audio.volume=.42;this.audio.currentTime=0;this.audio.play().catch(()=>{});}catch{/* Audio support must never affect the tour. */}}
 stop(){this.audio?.pause();if(this.audio)this.audio.currentTime=0;}
}
