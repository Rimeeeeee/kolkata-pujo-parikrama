import * as THREE from './assets/three.module.js';
import {buildRequestedAdditions} from './pujo-additions.js';
import {alponaMaterials} from './alpona.js';
import {makePerson} from './human-model.js';
import {RitualArms} from './ritual-arms.js';
import {installDhakPerformance} from './dhak-performance.js';
import {presentPurchase,putAwayPurchase,updatePurchase} from './street-purchases.js';
import {buildAlponaCorner,applyAlpona,captureAlpona} from './alpona-corner.js';
import {buildPhotoBooth,capturePortrait} from './photo-booth.js';
import {constrainWalk} from './game-state.js';
import {queueSnapshot,moveAmongPeople,crowdPath,WALK_SPEED,JumpMotion} from './movement.js';
import {buildStreetDetails,installPeopleLife,greetPerson,characterPosition,poseWalkingLegs,updatePeople,createFireworks,updateFireworks} from './scene-life.js';

export class PujoWorld {
 constructor(canvas,{onFrame,onMove,onReady,onFail}){
  this.canvas=canvas;this.onFrame=onFrame;this.onMove=onMove;this.onReady=onReady;this.onFail=onFail;this.animations=[];this.people=[];this.keys=new Set();this.moveInput={right:0,forward:0};this.jumpMotion=new JumpMotion();this.started=false;this.hasEntered=false;this.reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
  this.scene=new THREE.Scene();this.scene.background=new THREE.Color('#363342');this.scene.fog=new THREE.FogExp2('#39313d',.017);
  this.camera=new THREE.PerspectiveCamera(innerWidth<650?62:54,innerWidth/innerHeight,.1,100);this.camera.position.set(3,3.2,25);this.scene.add(this.camera);this.yaw=.1;this.pitch=-.025;this.target=null;
  try{this.renderer=new THREE.WebGLRenderer({canvas,antialias:true,preserveDrawingBuffer:true,powerPreference:'high-performance'});}catch(e){onFail(e);return;}
  this.renderer.setPixelRatio(Math.min(devicePixelRatio,Math.min(innerWidth,innerHeight)<650?1.25:1.5));this.renderer.setSize(innerWidth,innerHeight);this.renderer.outputColorSpace=THREE.SRGBColorSpace;this.renderer.toneMapping=THREE.ACESFilmicToneMapping;this.renderer.toneMappingExposure=1.4;
  this.materials=new Map();this.geometries={box:new THREE.BoxGeometry(1,1,1),sphere:new THREE.SphereGeometry(1,12,8),cylinder:new THREE.CylinderGeometry(1,1,1,12),cone:new THREE.ConeGeometry(1,1,12)};
  this.scene.add(new THREE.HemisphereLight('#dad0e8','#59402c',2.2));const moon=new THREE.DirectionalLight('#fff1d4',2.5);moon.position.set(-8,16,13);this.scene.add(moon);
  this.point('#ffb15b',100,25,0,6,-8);this.point('#ffc86d',65,24,0,7,3);this.point('#ffb35c',55,14,-10,3.5,10);this.point('#ffce8b',40,12,10,3,12);
  this.buildStreet();buildStreetDetails(this);this.batchStreet();this.buildPandal();this.buildStalls();this.buildPeople();buildRequestedAdditions(this);this.buildAtmosphere();installPeopleLife(this);buildPhotoBooth(this);buildAlponaCorner(this);createFireworks(this);this.bind();this.last=performance.now();this.frame(performance.now());
  document.fonts?.ready.then(()=>{for(const refresh of this.textRefresh||[])refresh();});
  this.onReady();
 }
 mat(color,extra={}){const key=color+JSON.stringify(extra);if(!this.materials.has(key))this.materials.set(key,new THREE.MeshStandardMaterial({color,roughness:.8,...extra}));return this.materials.get(key);}
 mesh(geo,color,pos,scale,parent=this.scene,extra={}){const m=new THREE.Mesh(typeof geo==='string'?this.geometries[geo]:geo,this.mat(color,extra));m.position.set(...pos);if(scale)m.scale.set(...scale);parent.add(m);return m;}
 box(color,pos,scale,parent,extra){return this.mesh('box',color,pos,scale,parent,extra);}
 ball(color,pos,scale,parent,extra){return this.mesh('sphere',color,pos,scale,parent,extra);}
 cyl(color,pos,scale,parent,extra){return this.mesh('cylinder',color,pos,scale,parent,extra);}
 point(color,intensity,range,x,y,z){const l=new THREE.PointLight(color,intensity,range,2);l.position.set(x,y,z);this.scene.add(l);return l;}
 line(points,color='#b89965',parent=this.scene,width=1){const g=new THREE.BufferGeometry().setFromPoints(points.map(p=>new THREE.Vector3(...p)));const m=new THREE.Line(g,new THREE.LineBasicMaterial({color,linewidth:width}));parent.add(m);return m;}
 rod(a,b,r,color,parent=this.scene){const av=new THREE.Vector3(...a),bv=new THREE.Vector3(...b),v=bv.clone().sub(av);const m=this.cyl(color,av.add(bv).multiplyScalar(.5).toArray(),[r,v.length(),r],parent);m.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),v.normalize());return m;}
 text(text,pos,w=3,h=.7,{bg='#7f342c',fg='#f7e7bd',font='Noto Serif Bengali',size=85,parent=this.scene}={}){
  const c=document.createElement('canvas');c.width=1024;c.height=256;const ctx=c.getContext('2d');const tex=new THREE.CanvasTexture(c);tex.colorSpace=THREE.SRGBColorSpace;
  const draw=()=>{ctx.clearRect(0,0,1024,256);if(bg){ctx.fillStyle=bg;ctx.fillRect(0,0,1024,256);ctx.strokeStyle='#d0ad71';ctx.lineWidth=7;ctx.strokeRect(12,12,1000,232);}ctx.fillStyle=fg;ctx.textAlign='center';ctx.textBaseline='middle';ctx.font=`500 ${size}px "${font}",serif`;ctx.fillText(text,512,135,960);tex.needsUpdate=true;};draw();(this.textRefresh??=[]).push(draw);
  const m=new THREE.Mesh(new THREE.PlaneGeometry(w,h),new THREE.MeshBasicMaterial({map:tex,transparent:true,side:THREE.DoubleSide}));m.position.set(...pos);parent.add(m);return m;
 }
 flowers(a,b,spacing=.18,parent=this.scene){const av=new THREE.Vector3(...a),bv=new THREE.Vector3(...b);const n=Math.max(1,Math.ceil(av.distanceTo(bv)/spacing));const inst=new THREE.InstancedMesh(this.geometries.sphere,this.mat('#e99d31'),n);const d=new THREE.Object3D();for(let i=0;i<n;i++){d.position.lerpVectors(av,bv,i/n);d.position.y-=Math.sin(i/n*Math.PI)*.2;d.scale.setScalar(.11);d.updateMatrix();inst.setMatrixAt(i,d.matrix);}parent.add(inst);return inst;}
 arch(x,y,z,r,t,color,parent=this.scene){const a=new THREE.Mesh(new THREE.TorusGeometry(r,t,8,32,Math.PI),this.mat(color));a.position.set(x,y,z);parent.add(a);return a;}
 bulb(pos,color='#ffcf7d',radius=.055,parent=this.scene){return this.ball(color,pos,[radius,radius*1.2,radius],parent,{emissive:color,emissiveIntensity:2});}
 buildStreet(){
  this.box('#77655b',[0,-.3,6],[36,.5,65]);this.box('#5a514f',[0,-.03,13.5],[23,.05,30]);
  // Small uneven stone joints in the lane.
  const joints=[];for(let z=-1;z<30;z+=1.7){joints.push([-11,.01,z],[11,.01,z]);this.line([[-11,.01,z],[11,.01,z]],'#6d6057');}for(let x=-10;x<11;x+=2.5)this.line([[x,.015,-1],[x,.015,29]],'#635a55');
  for(const side of [-1,1]){
   this.box('#9d8a72',[side*12,.13,14],[1.6,.25,35]);
   for(let i=0;i<5;i++){
    const z=24-i*9;const h=[10.8,12.5,10,13,11][i];const colors=side<0?['#a98772','#b8a080','#71837b','#c2a88d','#a47566']:['#9c9c88','#ba967a','#aa8879','#89958e','#bc9f83'];
    this.box(colors[i],[side*16,h/2,z],[7,h,8.6]);this.box('#cfb79a',[side*16,h+.15,z],[7.4,.25,8.9]);
    for(let level=0;level<3;level++)for(let j=0;j<2;j++){
     const wy=2.1+level*3.1,wz=z-2+j*3.8,xx=side*12.46;
     this.box('#4e5750',[xx,wy,wz],[.1,1.85,1.2]);this.box('#cfb79a',[xx-side*.04,wy+1,wz],[.16,.15,1.5]);
     for(let sl=0;sl<6;sl++)this.box('#677066',[xx-side*.075,wy-.65+sl*.25,wz],[.1,.045,1.1]);
     this.box('#c4ad8d',[xx-side*.13,wy-1,wz],[.35,.14,1.6]);
     if(level===1){this.box('#8a7765',[xx-side*.55,wy-1.1,wz],[1,.15,2]);for(let rail=0;rail<6;rail++)this.cyl('#464b43',[xx-side*1,wy-.65,wz-.85+rail*.34],[.025,.9,.025]);this.rod([xx-side*1,wy-.2,wz-1],[xx-side*1,wy-.2,wz+1],.035,'#464b43');}
    }
    for(let pipe=0;pipe<2;pipe++)this.cyl('#736d60',[side*12.4,h/2,z-3.6+pipe*7.2],[.055,h,.055]);
   }
  }
  // Overhead wiring and festive strings with drooping profiles.
  for(let z=2;z<=27;z+=5.5){const points=[];for(let i=0;i<=32;i++){let x=-12+24*i/32,y=8.7-1.8*Math.sin(i/32*Math.PI);points.push([x,y,z]);if(i%2===0)this.bulb([x,y-.15,z],i%4?'#ffce81':'#f7e2af',.065);}this.line(points,'#4e4443');}
  for(const side of [-1,1]){for(let z=1;z<28;z+=2.5)this.bulb([side*11.8,6.2,z],'#ffb75d',.045);this.line([[side*11.8,6.3,1],[side*11.8,6.3,28]],'#4a3c33');}

 }
 buildPandal(){
  const cream='#d7b98a',ivory='#e4d0a8',red='#8d3c32',deep='#74382e',gold='#bb8d48';
  this.box('#a38460',[0,.12,-10],[22,.35,24]);this.box('#d4b98c',[0,.32,-10],[20.4,.12,23]);
  for(let z=-21;z<=1;z+=1.5)this.line([[-10.2,.39,z],[10.2,.39,z]],'#b3946b');for(let x=-9;x<=9;x+=1.5)this.line([[x,.39,-21],[x,.39,1]],'#b3946b');
  // Rice-paste lotus alpona: large, flat textures keep intricate linework inexpensive.
  this.alponas=[];for(const [z,size] of [[-6,6.4],[-13,5.2],[2.6,4.2]])this.alpona(z,size);
  // Cream courtyard walls with red pilasters and classical Bengali arched bays.
  for(const side of [-1,1]){
   this.box(cream,[side*10.4,4.3,-10.5],[.5,8,22]);this.box(deep,[side*10.06,1,-10.5],[.12,1.2,22]);
   for(let z=0;z>=-20;z-=5){this.column(side*9.9,z,ivory,red);this.box(red,[side*10.04,7.6,z-2.5],[.22,.3,5]);if(z>-20)this.windowBay(side,z-2.5,red);}

  }
  // Front facade: three open bays, a central high arch and red cornices.
  for(let x of [-10,-5,5,10])this.column(x,.2,ivory,red);
  this.arch(0,4.7,.2,5,.25,ivory);this.arch(0,4.7,.28,4.55,.1,gold);
  for(let x of [-7.5,7.5]){this.arch(x,4.7,.2,2.5,.19,ivory);this.arch(x,4.7,.25,2.2,.06,gold);}
  this.box(cream,[0,9.6,0],[21,.7,.7]);this.box(red,[0,9.18,.12],[21.7,.18,.9]);this.box(ivory,[0,10.04,0],[22,.17,1]);this.box(red,[0,10.26,0],[21.2,.25,.8]);
  this.box(cream,[0,10.8,-.2],[12,.8,.6]);this.box(red,[0,11.28,-.2],[12.7,.18,.9]);this.box(cream,[0,11.6,-.2],[6,.45,.5]);this.box(gold,[0,11.9,-.2],[6.4,.16,.6]);
  this.text('শুভ শারদীয়া',[0,10.78,.17],8.2,.6,{bg:null,fg:'#74352c',size:87});
  this.text('পাড়ার সর্বজনীন দুর্গোৎসব',[0,9.63,.4],10,.5,{bg:null,fg:'#74352c',size:72});
  for(let x=-10;x<=10;x+=.65)this.flowers([x,9.1,.5],[x,8.65-Math.abs(Math.sin(x))*.3,.5]);
  this.flowers([-4.8,4.6,.55],[-4.8,.5,.55]);this.flowers([4.8,4.6,.55],[4.8,.5,.55]);
  for(let i=0;i<=32;i++){const a=i/32*Math.PI;this.bulb([Math.cos(a)*5.2,4.7+Math.sin(a)*5.2,.45],'#ffcc75',.055);}
  for(let x of [-7.5,7.5])for(let i=0;i<=16;i++){const a=i/16*Math.PI;this.bulb([x+Math.cos(a)*2.7,4.7+Math.sin(a)*2.7,.4],'#ffcc75',.045);}
  // Canopy fabric and restrained brass detailing.
  this.box('#67382f',[0,8.6,-11],[20.5,.15,21]);for(let x=-8;x<=8;x+=4)this.box('#ac8050',[x,8.48,-10.7],[.06,.04,21]);
  for(let z=-4;z>-20;z-=5){this.flowers([-9.8,7.5,z],[0,7.4,z],.2);this.flowers([0,7.4,z],[9.8,7.5,z],.2);}
  this.jharbati();
  this.box(red,[0,4.7,-21.65],[20.5,8.8,.5]);this.box('#813a30',[0,1,-20.2],[15,1.4,2.6]);this.box('#c4a16a',[0,1.75,-19.9],[15.5,.15,3.1]);
  // Painted surrounds bridge the image to the real stage beneath the canopy.
  for(const side of [-1,1]){this.box('#85392f',[side*8.1,4.4,-21.1],[3.95,7.9,.12]);this.box('#c39e61',[side*6.11,4.35,-21.06],[.10,7.95,.10]);this.flowers([side*6.28,8.25,-21],[side*6.28,1.7,-21]);}this.box('#cba66d',[0,8.35,-21.05],[12.5,.20,.12]);
  const loader=new THREE.TextureLoader();loader.load('./assets/idol.png?v=ten-arms-kartick-grip',tex=>{tex.colorSpace=THREE.SRGBColorSpace;tex.anisotropy=4;const altar=new THREE.Mesh(new THREE.PlaneGeometry(12,8),new THREE.MeshBasicMaterial({map:tex}));altar.name='complete-idol-ensemble';altar.position.set(0,4.25,-21.25);this.altar=altar;this.scene.add(altar);},undefined,()=>this.text('মা দুর্গা',[0,4.5,-21.1],10,3,{bg:'#7e2f29',fg:'#ffe7ad'}));
  for(let x of [-8.7,8.7]){this.column(x,-20.3,ivory,red);this.flowers([x,7.7,-19.9],[x,1.7,-19.9]);this.lamp(x*.82,.45,-17.6,1.4);}
  for(let x=-5.4;x<=5.5;x+=1.2)this.lamp(x,1.8,-18.8,.35);
  // Banana plants at the gateway.
  for(let x of [-9,9])this.banana(x,0,1.5);
  // Bamboo queue barriers to the right; the volunteer opens the route.
  for(let x of [3.3,6.1]){for(let z=2;z<15;z+=2.5)this.cyl('#bc9c67',[x,.65,z],[.055,1.3,.055]);for(let y of [.5,1.05])this.rod([x,y,2],[x,y,14.5],.035,'#c1a06c');}
  this.text('প্রবেশ →',[4.7,1.5,14.7],2,.55,{size:80});this.text('EXIT',[ -7.6,2.9,.65],1.6,.45,{font:'DM Sans',bg:'#597360',size:70});
 }
 column(x,z,cream,red){this.cyl(cream,[x,3.7,z],[.43,6.5,.43]);this.cyl(red,[x,.7,z],[.6,.7,.6]);this.cyl(cream,[x,7,z],[.67,.35,.67]);this.cyl(red,[x,7.3,z],[.75,.2,.75]);this.box(cream,[x,7.6,z],[1.55,.3,1.5]);this.cyl('#c29f68',[x,1.2,z],[.49,.12,.49]);}
 lantern(x,y,z){this.cyl('#9b7240',[x,y,z],[.27,.08,.27]);this.cyl('#e5b975',[x,y+.36,z],[.23,.62,.23],undefined,{emissive:'#e7a756',emissiveIntensity:.6});this.cyl('#8b613c',[x,y+.72,z],[.3,.07,.3]);this.rod([x,y+.75,z],[x,8.5,z],.015,'#6b5038');}
 jharbati(){
  const chandelier=new THREE.Group();chandelier.name='overhead-jharbati';chandelier.position.set(0,8.08,-8.5);this.scene.add(chandelier);this.chandelier=chandelier;
  this.rod([0,.48,0],[0,-.32,0],.035,'#bc9953',chandelier);this.ball('#b18c48',[0,-.27,0],[.16,.13,.16],chandelier);
  const ring=new THREE.Mesh(new THREE.TorusGeometry(.94,.035,8,40),this.mat('#cba65f',{metalness:.6,roughness:.3}));ring.rotation.x=Math.PI/2;ring.position.y=-.1;chandelier.add(ring);
  for(let i=0;i<8;i++){const a=i/8*Math.PI*2,x=Math.cos(a)*1.05,z=Math.sin(a)*1.05;this.rod([0,-.26,0],[x,-.1,z],.027,'#ba944f',chandelier);this.cyl('#cba45a',[x,.02,z],[.07,.2,.07],chandelier);this.bulb([x,.18,z],'#ffdfa0',.065,chandelier);this.rod([x,-.13,z],[x,-.42,z],.009,'#ceb78d',chandelier);this.mesh(new THREE.OctahedronGeometry(.06),'#e5dbc3',[x,-.48,z],[.65,1.5,.65],chandelier,{metalness:.25,roughness:.15});}
  this.ball('#e1c179',[0,-.43,0],[.08,.12,.08],chandelier,{emissive:'#c7a45d',emissiveIntensity:.2});
 }
 lamp(x,y,z,h=1){this.cyl('#a57e37',[x,y+.05,z],[.2*h,.1*h,.2*h]);this.cyl('#b18943',[x,y+.5*h,z],[.05*h,.9*h,.05*h]);this.cyl('#b18b48',[x,y+.93*h,z],[.3*h,.08*h,.3*h]);for(let i=0;i<5;i++){const a=i/5*Math.PI*2;const f=this.ball('#ffcf69',[x+Math.cos(a)*.23*h,y+1.04*h,z+Math.sin(a)*.23*h],[.035*h,.1*h,.035*h],undefined,{emissive:'#ff9f26',emissiveIntensity:3});this.animations.push(t=>{f.scale.y=.08*h+Math.sin(t*12+i)*.025*h;});}}
 banana(x,y,z){this.cyl('#655b36',[x,y+.3,z],[.42,.6,.42]);this.cyl('#9b9c52',[x,y+1.7,z],[.09,2.8,.09]);for(let i=0;i<6;i++){const a=i/6*Math.PI*2;const leaf=this.ball('#4b7550',[x+Math.cos(a)*.6,y+2.9+(i%2)*.4,z+Math.sin(a)*.6],[.22,1.2,.075]);leaf.rotation.set(Math.sin(a)*.65,0,-Math.cos(a)*.65);}}
 buildStalls(){
  this.stalls=[];
  this.stall(-10,10,'#9d4b35','হারুদার চা',Math.PI/2,'tea');this.stall(10,12,'#5e7770','বেলুন ফাটান',-Math.PI/2,'game');this.stall(-10,19,'#a98144','দাদার ফুচকা',Math.PI/2,'fuchka');
  this.stall(-10,25,'#71825d','মশলা ঝালমুড়ি',Math.PI/2,'jhalmuri');this.stall(10,25,'#a45b70','মিতালির মিষ্টি',-Math.PI/2,'mishti');this.stall(10,7,'#89713f','বেলাদির ফুল',-Math.PI/2,'flowers');
  const tea=new THREE.Group();tea.position.set(-10,0,10);tea.rotation.y=Math.PI/2;this.scene.add(tea);
  this.cyl('#4e514e',[0,1.28,.3],[.33,.5,.33],tea,{metalness:.5,roughness:.3});const handle=new THREE.Mesh(new THREE.TorusGeometry(.23,.035,6,16),this.mat('#4b4a43'));handle.position.set(.33,1.8,.3);tea.add(handle);this.cyl('#79766a',[0,1.58,.3],[.23,.05,.23],tea);this.ball('#463e35',[0,1.65,.3],[.06,.06,.06],tea);
  for(let i=0;i<8;i++)this.cyl('#b78150',[-1.1+(i%4)*.3,1.13,.2+Math.floor(i/4)*.3],[.07,.14,.07],tea);
  this.box('#b79558',[.9,1.25,-.2],[.6,.32,.5],tea);this.text('CHA · ₹10',[0,2.7,-.8],2,.45,{bg:'#483d31',fg:'#f3dcb1',font:'DM Sans',parent:tea,size:85});
  const steam=[];for(let i=0;i<8;i++){const p=this.ball('#ded6bc',[-9.5,2.3+i*.11,10],[.04,.04,.04],undefined,{transparent:true,opacity:.15});steam.push(p);}this.animations.push(t=>steam.forEach((p,i)=>{p.position.y=2.05+((t*.22+i*.11)%.9);p.position.x=-9.5+Math.sin(t+i)*.07;p.material.opacity=.13;}));
  // Clay tea cups and bench by the stall.
  this.box('#73513b',[-7.8,.55,8.6],[.5,.15,2.6]);for(let z of [7.7,9.5])this.box('#5f4938',[-7.8,.25,z],[.3,.5,.15]);
  // Three dimensional balloon board at the game stall.
  const board=new THREE.Group();this.balloonBoard=board;board.name='balloon-target-board';board.position.set(10.6,2.15,12);board.rotation.y=-Math.PI/2;this.scene.add(board);this.box('#966b42',[0,0,0],[3.4,1.9,.12],board);this.box('#bd985d',[0,1,0],[3.7,.14,.2],board);this.box('#bd985d',[0,-1,0],[3.7,.14,.2],board);
  const colors=['#c4655a','#d7af56','#698e98','#9a759c','#79946a'];for(let row=0;row<2;row++)for(let col=0;col<5;col++){const bx=-1.25+col*.62,by=-.46+row*.88;this.ball(colors[(col+row)%5],[bx,by,.16],[.21,.29,.16],board,{roughness:.4});const knot=this.mesh('cone',colors[(col+row)%5],[bx,by-.29,.16],[.04,.07,.04],board);knot.rotation.z=Math.PI;}
  this.text('12 CORKS · AIM & FIRE',[0,-1.25,.15],3.1,.3,{bg:'#6a3c2c',font:'DM Sans',parent:board,size:75});
  // Balloon seller's bunch, each tethered to a hand.
  const bunch=new THREE.Group();bunch.position.set(7.8,1.2,19);this.scene.add(bunch);for(let i=0;i<9;i++){const a=i*2.399,r=.45+Math.floor(i/4)*.2;const p=[Math.cos(a)*r,2.2+Math.sin(i*1.3)*.5,Math.sin(a)*r];this.ball(colors[i%5],p,[.27,.36,.25],bunch,{roughness:.4});this.line([[0,0,0],p],'#c1b6a2',bunch);}this.animations.push(t=>{bunch.rotation.z=Math.sin(t*.7)*.035;});
 }
 stall(x,z,color,label,rotation,kind){const s=new THREE.Group();s.name='stall-'+kind;s.userData.kind=kind;s.position.set(x,0,z);s.rotation.y=rotation;this.scene.add(s);this.stalls.push(s);
  (this.staticObstacles??=[]).push({kind:'stall-'+kind,x:x+Math.sin(rotation)*.05,z:z+Math.cos(rotation)*.05,halfX:2.05,halfZ:.9,rotation});
  this.box('#765038',[0,.48,0],[3.9,.96,1.6],s);this.box('#b28b55',[0,1.01,.05],[4.1,.1,1.8],s);this.box('#624732',[0,2.1,-.8],[4,2.5,.1],s);for(let xx of [-1.9,1.9])this.cyl('#ad8c5a',[xx,1.9,.7],[.035,3.8,.035],s);
  const roof=this.box(color,[0,3.7,0],[4.8,.16,2.8],s);roof.rotation.x=.08;
  for(let i=0;i<8;i++)this.box(i%2?color:'#d3b58a',[-2.1+i*.6,3.51,1.35],[.6,.3,.08],s);this.text(label,[0,3.05,1],3.8,.7,{bg:color,parent:s,size:88});
  for(let i=0;i<5;i++)this.bulb([-1.6+i*.8,3.4,1.1],'#ffe4a0',.05,s);
  const prices={tea:'CHA · ₹10',fuchka:'FUCHKA · ₹30',jhalmuri:'JHALMURI · ₹25',mishti:'MISHTI · ₹20',flowers:'PHULER JHURI · ₹30 / 60 / 100',game:'12 CORKS · 45 SECONDS'};
  this.text(prices[kind],[0,.60,.83],3.25,.44,{bg:color,fg:'#f3dfb6',font:'DM Sans',parent:s,size:69});
  if(kind==='fuchka'){
   this.cyl('#b6a685',[-.8,1.35,.1],[.46,.6,.46],s,{metalness:.4});this.cyl('#6a553b',[-.8,1.66,.1],[.4,.03,.4],s);this.box('#c6b18b',[.65,1.22,.1],[1.4,.28,.8],s);
   for(let i=0;i<22;i++)this.ball('#c69c5d',[.16+(i%5)*.22,1.43+Math.floor(i/10)*.13,-.15+Math.floor(i/5)%2*.28],[.13,.11,.12],s);this.cyl('#738355',[-1.45,1.2,.45],[.23,.08,.23],s);
  }
  if(kind==='jhalmuri'){
   for(let i=0;i<5;i++){this.cyl('#c9b584',[-1.35+i*.65,1.45,.05],[.24,.83,.24],s);this.cyl('#b19558',[-1.35+i*.65,1.89,.05],[.27,.06,.27],s);this.cyl(['#c2a477','#8d9a55','#bb7849','#d5b05b','#927653'][i],[-1.35+i*.65,1.53,.05],[.245,.4,.245],s);}
   for(let i=0;i<3;i++){const cone=this.mesh('cone','#ddc79f',[-.8+i*.6,1.3,.62],[.13,.4,.13],s);cone.rotation.z=Math.PI;}
  }
  if(kind==='mishti'){
   this.box('#d1b889',[0,1.08,.05],[3.3,.1,1.2],s);for(let x of [-1.6,1.2])this.box('#b89b6d',[x,1.46,.58],[.04,.75,.04],s);
   this.box('#bad0c5',[0,1.46,.64],[3.2,.65,.025],s,{transparent:true,opacity:.18,roughness:.12});this.box('#e4d3ae',[0,1.83,.05],[3.35,.06,1.3],s);
   for(let i=0;i<24;i++){const col=i%8,row=Math.floor(i/8);this.ball(i<8?'#e9e0bf':i<16?'#bb8250':'#d9bc7b',[-1.33+col*.38,1.26,-.35+row*.34],[.13,.12,.13],s);}
  }
  if(kind==='flowers'){
   for(let i=0;i<3;i++){const xx=-1.2+i*1.2,r=.25+i*.09;this.cyl('#aa7e4d',[xx,1.18,.3],[r,.22+i*.07,r],s);for(let k=0;k<4;k++){const hoop=new THREE.Mesh(new THREE.TorusGeometry(r,.012,4,20),this.mat('#d4b47a'));hoop.rotation.x=Math.PI/2;hoop.position.set(xx,1.1+k*.055,.3);s.add(hoop);}for(let j=0;j<9+i*3;j++)this.ball(j%3?'#e9b54e':'#eee3bd',[xx+Math.sin(j*2.4)*r*.7,1.34+i*.04,Math.cos(j*2.4)*r*.7+.3],[.075,.065,.075],s);this.ball('#638053',[xx+r*.5,1.34,.3],[.12,.025,.08],s);}

   for(let xx of [-1.5,-.9,.9,1.1])this.flowers([xx,2.8,-.6],[xx,1.5,-.6],.13,s);
  }
  // Small Bengali chalk menu and flower garland distinguish each shopfront.
  this.flowers([-1.8,3.45,1.4],[1.8,3.45,1.4],.2,s);
 }
 batchStreet(){
  this.scene.updateMatrixWorld(true);const groups=new Map();this.scene.traverse(o=>{if(!o.isMesh||o.isInstancedMesh||!Object.values(this.geometries).includes(o.geometry))return;const key=o.geometry.uuid+o.material.uuid,b=groups.get(key)||{geo:o.geometry,mat:o.material,objects:[]};b.objects.push(o);groups.set(key,b);});for(const b of groups.values()){if(b.objects.length<3)continue;const mesh=new THREE.InstancedMesh(b.geo,b.mat,b.objects.length);mesh.name='instanced-street';b.objects.forEach((o,i)=>{mesh.setMatrixAt(i,o.matrixWorld);o.visible=false;});this.scene.add(mesh);}
 }
 alpona(z,size){
  this.alponaPalette??=alponaMaterials();const material=this.alponaPalette[this.alponas.length%this.alponaPalette.length];
  const mesh=new THREE.Mesh(new THREE.PlaneGeometry(size,size),material);mesh.rotation.x=-Math.PI/2;mesh.position.set(0,z>0?.035:.408,z);mesh.name='rice-paste-alpona';this.scene.add(mesh);this.alponas.push(mesh);
 }
 windowBay(side,z,red){
  if(!this.shutterTexture){const c=document.createElement('canvas');c.width=512;c.height=768;const x=c.getContext('2d');x.fillStyle='#233c36';x.fillRect(0,0,512,768);for(let i=0;i<30;i++){x.fillStyle=i%3?'#476456':'#536d5c';x.fillRect(18,20+i*24,476,15);x.fillStyle='#162b27';x.fillRect(18,35+i*24,476,5);}x.fillStyle='#b89757';for(const yy of [190,570])for(const xx of [27,472])x.fillRect(xx,yy,12,27);this.shutterTexture=new THREE.CanvasTexture(c);this.shutterTexture.colorSpace=THREE.SRGBColorSpace;}
  const w=new THREE.Group();w.name='khorkhori-window';w.position.set(side*10.08,0,z);w.rotation.y=-side*Math.PI/2;this.scene.add(w);
  this.box('#3d4940',[0,3.8,.03],[2.85,3.65,.10],w);for(const xx of [-1.55,1.55]){this.box(red,[xx,3.8,.12],[.20,4.1,.25],w);this.box('#e0c79b',[xx,3.8,.24],[.065,3.9,.08],w);}for(const yy of [1.78,5.82])this.box(red,[0,yy,.1],[3.4,.22,.28],w);
  for(const xx of [-.71,.71]){const panel=new THREE.Mesh(new THREE.PlaneGeometry(1.32,3.45),new THREE.MeshStandardMaterial({map:this.shutterTexture,roughness:.9}));panel.position.set(xx,3.8,.12);w.add(panel);this.box('#61705a',[xx,3.8,.15],[.07,3.5,.06],w);this.ball('#bfa064',[xx+(xx<0?.44:-.44),3.5,.23],[.035,.08,.025],w);}
  this.arch(0,5.8,.12,1.48,.12,red,w);for(let i=0;i<7;i++){const a=i*Math.PI/6;this.rod([0,5.8,.15],[Math.cos(a)*1.35,5.8+Math.sin(a)*1.35,.15],.025,'#665c46',w);}this.box('#e0c59b',[0,1.6,.2],[3.55,.16,.55],w);
 }
 batchPeople(people){
  this.scene.updateMatrixWorld(true);const batches=new Map(),built=[];for(const p of people){p.instances=[];p.g.traverse(object=>{if(!object.isMesh)return;const key=object.geometry.uuid+object.material.uuid,b=batches.get(key)||{geometry:object.geometry,material:object.material,entries:[]};b.entries.push({person:p,object});batches.set(key,b);});p.batched=true;p.g.visible=false;}
  for(const b of batches.values()){const mesh=new THREE.InstancedMesh(b.geometry,b.material,b.entries.length);mesh.name='instanced-visitors';mesh.frustumCulled=false;built.push(mesh);mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);b.entries.forEach(({person,object},index)=>{mesh.setMatrixAt(index,object.matrixWorld);person.instances.push({mesh,index,object});});this.scene.add(mesh);}
  return built;
 }

 person(x,z,options={}){return makePerson(this,x,z,options);}
 buildPeople(){
  const colors=['#b95448','#b59a5c','#597b78','#d6b78a','#867197','#b08b6b','#72917c'];
  // Each queue figure has a permanent identity and follows the same curved path.
  this.queuePeople=[];const initial=queueSnapshot(0);for(let i=0;i<9;i++){const q=initial.people[i],p=this.person(q.x,q.z,{outfit:colors[i%7],sari:i%3===0,rotation:q.yaw,scale:i===5?.78:.95});p.queueId=i;this.queuePeople.push(p);}
  this.volunteer=this.person(3.4,1.7,{outfit:'#c6b494',rotation:0});this.text('VOLUNTEER',[0,1.35,.24],.40,.12,{bg:'#784c36',font:'DM Sans',size:55,parent:this.volunteer.body});
  this.person(-3.2,17.8,{outfit:'#b75949',sari:true,rotation:.3});this.person(-4,18.3,{outfit:'#e1c798',appearance:1,rotation:2.2});this.person(-2.9,19.5,{outfit:'#6c8c85',scale:.6,rotation:2.7});
  this.vendorPeople=new Map();for(const [id,x,z,sari] of [['tea',-10.55,10,false],['game',9.7,14.9,false],['fuchka',-10.55,19,false],['jhalmuri',-10.55,25,false],['mishti',10.55,25,true],['flowers',10.55,7,true]]){const p=this.person(x,z,{outfit:colors[this.vendorPeople.size],sari,appearance:this.vendorPeople.size+1,age:id==='tea'?'elder':'adult',rotation:x<0?Math.PI/2:-Math.PI/2});p.g.position.y=.22;p.vendor=true;this.vendorPeople.set(id,p);}
  this.person(7.6,19,{outfit:'#6e8a85',rotation:.1});
  const streetSpots=[[-7.2,23.8],[7.4,25.7],[7.8,24.6],[-7.6,8.7],[-6.8,8.3],[1.5,23],[-5.8,25.8],[3.5,21.4],[6.8,16],[-6,14],[-4.5,11.5],[2,26],[-2,25]];
  const staticPeople=[];streetSpots.forEach(([x,z],i)=>staticPeople.push(this.person(x,z,{outfit:colors[i%7],sari:i%3===0,appearance:i,age:i%5===0?'elder':'adult',build:[.94,1.08,1][i%3],scale:i===2?.65:[.94,1.04,1][i%3],rotation:i*.8})));
  // Families and photographers leave a clear walking aisle and queue exit routes.
  const spots=[];for(const side of [-1,1])for(let row=0;row<6;row++)for(let col=0;col<3;col++){const x=side*(2.3+col*2.1),z=-3-row*2.15;if(Math.hypot(x+6.5,z+7.7)<1.3)continue;if([[-4.6,-7],[4.5,-7],[-5.4,-9],[5.4,-9],[-4.5,-11.5],[4.5,-11.5],[-6.8,-14],[6.8,-14],[-3,-15.5]].some(([a,b])=>Math.hypot(x-a,z-b)<.85))continue;spots.push([x,z]);}
  spots.push([-7.7,-15.8],[7.7,-15.8],[-5.8,-16],[5.8,-16],[-2.3,-16],[2.3,-16]);
  spots.forEach(([x,z],i)=>staticPeople.push(this.person(x,z,{outfit:colors[i%7],sari:i%3===0,appearance:i,age:i%6===0?'elder':'adult',build:[.96,1.08,1][i%3],pose:i%4===0?'photo':i%3===0?'pray':'idle',rotation:Math.PI+(i%3-.9)*.2,scale:i===8?.68:[.95,1.04,1][i%3]})));
  this.person(-3,-10,{outfit:'#867197',sari:true,pose:'photo',rotation:Math.PI});
  this.visitorBatches=this.batchPeople(staticPeople);
  // Bengali priest, dhoti and uttariya, facing Maa and circling the arati lamp.
  const priest=this.person(.35,-17.5,{outfit:'#e6d6b4',priest:true,rotation:Math.atan2(-.35,-3.75),pose:'arati'});this.priest=priest;priest.nonInteractable=true;priest.arms[1].rotation.x=-1.3;
  const lampGroup=new THREE.Group();priest.body.add(lampGroup);this.cyl('#b39745',[0,0,0],[.25,.05,.25],lampGroup);for(let i=0;i<5;i++){const a=i/5*Math.PI*2;this.ball('#ffe5a0',[Math.cos(a)*.18,.12,Math.sin(a)*.18],[.035,.13,.035],lampGroup,{emissive:'#ffb13a',emissiveIntensity:3});}
  priest.armPose=new RitualArms(priest);const lampGrip=new THREE.Vector3();this.priestLamp=lampGroup;
  this.animations.push(t=>{
   if(this.pujaMode&&this.pujaMode!=='saptami'){priest.armPose.restore();return;}
   const phase=this.reduced?0:t*1.7;
   lampGrip.set(.30+Math.sin(phase)*.11,1.40+Math.cos(phase)*.09,.43);priest.body.localToWorld(lampGrip);priest.armPose.pose(1,lampGrip);
   const arm=priest.armPose.arms[1];arm.palm.rotation.x=Math.PI/2;arm.thumb.position.copy(arm.thumbOffset).applyQuaternion(arm.palm.quaternion).add(arm.palm.position);
   priest.body.worldToLocal(lampGrip);lampGroup.position.copy(lampGrip);lampGroup.position.y+=.04;
  });
  // Dhaki with a suspended cylindrical dhak, carrying strap, ropes and two curved sticks.
  const dhaki=this.person(-6.5,-7.7,{outfit:'#dfcbac',rotation:.55,pose:'dhak'});const drum=new THREE.Group();dhaki.body.add(drum);drum.position.set(0,.95,.48);drum.rotation.z=.27;const barrel=this.mesh(new THREE.CylinderGeometry(.31,.33,.85,16), '#97452e',[0,0,0],null,drum);barrel.rotation.z=Math.PI/2;
  for(let xx of [-.44,.44]){const head=this.cyl('#d5bd87',[xx,0,0],[.34,.045,.34],drum);head.rotation.z=Math.PI/2;const rim=new THREE.Mesh(new THREE.TorusGeometry(.34,.025,6,20),this.mat('#c9a66a'));rim.rotation.y=Math.PI/2;rim.position.x=xx;drum.add(rim);}for(let i=0;i<10;i++){const a=i/10*Math.PI*2;this.rod([-.42,Math.cos(a)*.33,Math.sin(a)*.33],[.42,Math.cos(a+.5)*.33,Math.sin(a+.5)*.33],.012,'#e0caa2',drum);}
  this.rod([-.22,1.6,0],[.38,.9,.48],.035,'#ad6045',dhaki.body);installDhakPerformance(this,dhaki,drum);
  const plumes=new THREE.Group();plumes.position.set(-.35,0,0);drum.add(plumes);for(let i=0;i<7;i++)this.ball('#efdfba',[0,.45+i*.06,-.1+i*.055],[.06,.35,.025],plumes);
 }
 buildAtmosphere(){
  // Floating dust catches the warm light without obstructing the courtyard.
  const positions=new Float32Array(180*3);for(let i=0;i<180;i++){positions[i*3]=(Math.sin(i*89.13)*.5+.5)*22-11;positions[i*3+1]=(Math.sin(i*31.7)*.5+.5)*8;positions[i*3+2]=(Math.cos(i*17.3)*.5+.5)*44-21;}
  const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.BufferAttribute(positions,3));const dust=new THREE.Points(geo,new THREE.PointsMaterial({color:'#e4bb77',size:.028,transparent:true,opacity:.45}));this.scene.add(dust);this.animations.push(t=>{if(!this.reduced)dust.position.y=Math.sin(t*.15)*.15;});
  // Brass bell at the entrance.
  this.cyl('#b58e48',[-4.3,7.3,.2],[.02,1,.02]);this.mesh(new THREE.CylinderGeometry(.12,.28,.36,16),'#bd9954',[-4.3,6.7,.2]);this.ball('#a98446',[-4.3,6.48,.2],[.055,.07,.055]);
 }
 setCompanionBalloon(hex){
  if(this.companionBalloon){this.camera.remove(this.companionBalloon);this.companionBalloon.traverse(o=>{if(o.material&&o.userData.ownedMaterial)o.material.dispose();});this.companionBalloon=null;}
  if(!hex)return;const group=new THREE.Group();group.name='your-balloon';this.camera.add(group);group.position.set(1.05,.38,-2.05);
  const skin=new THREE.MeshPhysicalMaterial({color:hex,roughness:.24,metalness:.05,clearcoat:.8,clearcoatRoughness:.15});const balloon=new THREE.Mesh(this.geometries.sphere,skin);balloon.scale.set(.205,.27,.19);balloon.userData.ownedMaterial=true;group.add(balloon);const knot=this.mesh('cone',hex,[0,-.29,0],[.035,.055,.035],group);knot.rotation.z=Math.PI;
  this.line([[0,-.32,0],[-.025,-.65,.03],[-.2,-1.25,.3]],'#e4d1a9',group);this.companionBalloon=group;
 }
 bind(){
  this.resize=()=>{this.camera.aspect=innerWidth/innerHeight;this.camera.fov=innerWidth<650?62:54;this.camera.updateProjectionMatrix();this.renderer.setPixelRatio(Math.min(devicePixelRatio,Math.min(innerWidth,innerHeight)<650?1.25:1.5));this.renderer.setSize(innerWidth,innerHeight);};addEventListener('resize',this.resize);
  this.canvas.addEventListener('pointerdown',e=>{if(!this.started||this.locked||this.ritualLocked)return;this.drag={x:e.clientX,y:e.clientY,id:e.pointerId};this.cancelMove();this.canvas.setPointerCapture(e.pointerId);});
  this.canvas.addEventListener('pointermove',e=>{if(!this.drag)return;this.yaw-=(e.clientX-this.drag.x)*.004;this.pitch=Math.max(-.65,Math.min(.6,this.pitch-(e.clientY-this.drag.y)*.003));this.drag.x=e.clientX;this.drag.y=e.clientY;});
  const release=()=>{this.drag=null;};this.canvas.addEventListener('pointerup',release);this.canvas.addEventListener('pointercancel',release);
 }
 presentPurchase(shop,item){return presentPurchase(this,shop,item);}
 putAwayPurchase(){putAwayPurchase(this);}
 applyAlpona(stamps){return applyAlpona(this,stamps);}
 captureAlpona(){return captureAlpona(this);}
 capturePortrait(options){return capturePortrait(this,options);}
 characterPosition(id){return characterPosition(this,id);}
 greet(id){greetPerson(this,id);}
 startFireworks(){this.fireworks.elapsed=0;this.fireworks.active=true;this.fireworks.points.visible=true;updateFireworks(this,0);}
 stopFireworks(){this.fireworks.active=false;this.fireworks.points.visible=false;}
 obstacles(ignorePerson){const obstacles=this.people.filter(p=>p!==ignorePerson&&!p.ritualHidden).map(p=>({x:p.g.position.x,z:p.g.position.z,radius:p.radius}));if(this.artBench)obstacles.push({x:-6.3,z:5.5,radius:.72});if(this.photoRig)obstacles.push({x:0,z:14.5,radius:.47});return obstacles.concat(this.staticObstacles||[],this.rituals?.obstacles()||[]);}
 joinQueue(onUpdate=()=>{}){this.stop();this.cancelMove();this.locked=true;return new Promise(resolve=>{this.queueRun={elapsed:0,resolve,onUpdate,released:false};});}
 updateQueue(dt){const run=this.queueRun;if(!run)return;run.elapsed+=dt;const snap=queueSnapshot(run.elapsed);this.queuePeople.forEach((p,i)=>{const q=snap.people[i],stepping=Math.hypot(p.g.position.x-q.x,p.g.position.z-q.z)>.0001;poseWalkingLegs(p,run.elapsed*9+i,stepping&&!this.reduced);p.g.position.set(q.x,q.z<1?.4:0,q.z);p.g.rotation.y=q.yaw;if(!this.reduced){p.arms[0].rotation.x=Math.sin(run.elapsed*9+i)*.15;p.arms[1].rotation.x=-Math.sin(run.elapsed*9+i)*.15;}});
  if(!run.released){this.camera.position.set(snap.player.x,snap.player.z<1?2.1:1.9,snap.player.z);this.yaw=snap.player.yaw+Math.PI;this.pitch=.04;run.onUpdate(snap);if(snap.done){this.hasEntered=true;this.locked=false;run.released=true;run.resolve();}}
  if(snap.settled)this.queueRun=null;
 }
 go(position,look,{immediate=false}={}){this.cancelMove();this.cancelJump();const p=new THREE.Vector3(...position),goal=p.clone(),l=new THREE.Vector3(...look),v=l.clone().sub(p).normalize(),yaw=Math.atan2(-v.x,-v.z),pitch=Math.asin(v.y);const walkable=({x,z})=>{const [a,b]=constrainWalk(x,z,this.hasEntered);return Math.abs(a-x)<.02&&Math.abs(b-z)<.02;};const waypoints=crowdPath(this.camera.position,p,this.obstacles(),walkable);if(!waypoints.length)return Promise.resolve();const end=waypoints.at(-1);p.x=end.x;p.z=end.z;if(immediate){this.camera.position.copy(p);this.yaw=yaw;this.pitch=pitch;return Promise.resolve();}return new Promise(resolve=>{this.target={p,goal,yaw,pitch,resolve,waypoints,walkable,index:0,bestDistance:Infinity,stalledFor:0,replans:0};});}
 updateGuidedMove(dt){
  const tar=this.target;if(!tar)return;
  const waypoint=tar.waypoints[tar.index],from=this.camera.position,dist=Math.hypot(waypoint.x-from.x,waypoint.z-from.z),step=Math.min(dist,dt*5.5),next=moveAmongPeople(from,{x:from.x+(waypoint.x-from.x)*step/(dist||1),z:from.z+(waypoint.z-from.z)*step/(dist||1)},this.obstacles());
  from.x=next.x;from.z=next.z;from.y+=(tar.p.y-from.y)*Math.min(1,dt*5);
  const angle=Math.atan2(Math.sin(tar.yaw-this.yaw),Math.cos(tar.yaw-this.yaw));this.yaw+=angle*Math.min(1,dt*4);this.pitch+=(tar.pitch-this.pitch)*Math.min(1,dt*4);
  const remaining=Math.hypot(from.x-waypoint.x,from.z-waypoint.z);
  if(remaining<.035){
   if(tar.index<tar.waypoints.length-1){tar.index++;tar.bestDistance=Infinity;tar.stalledFor=0;}
   else if(Math.abs(angle)<.01){this.target=null;tar.resolve();}
   return;
  }
  tar.stalledFor+=dt;if(remaining<tar.bestDistance-.025){tar.bestDistance=remaining;tar.stalledFor=0;}
  if(tar.stalledFor<.8)return;
  // A visitor or counter can invalidate a planned segment. Retry from the
  // actual collision-safe position, keeping the same destination and promise.
  if(tar.replans>=6){this.target=null;tar.resolve(false);return;}
  tar.replans++;tar.stalledFor=0;
  const waypoints=crowdPath(from,tar.goal,this.obstacles(),tar.walkable);
  if(waypoints.length){tar.waypoints=waypoints;tar.index=0;tar.bestDistance=Infinity;const end=waypoints.at(-1);tar.p.x=end.x;tar.p.z=end.z;}
 }
 cancelMove(){if(this.target){const resolve=this.target.resolve;this.target=null;resolve();}}
 setKey(key,down){if(down&&!this.locked)this.keys.add(key);else this.keys.delete(key);if(down&&!this.locked)this.cancelMove();}
 setMoveInput(right,forward){if(this.locked||this.suspended||this.ritualLocked||!Number.isFinite(right)||!Number.isFinite(forward)){this.moveInput={right:0,forward:0};return;}const length=Math.max(1,Math.hypot(right,forward));this.moveInput={right:right/length,forward:forward/length};if(right||forward)this.cancelMove();}
 jumpBlocked(){const s=this.rituals?.state;return this.locked||this.suspended||this.ritualLocked||!!this.renderCamera||!!this.rituals?.handRig?.visible||(s?.mode==='ashtami'&&s.started&&s.phase!=='complete')||(s?.mode==='dashami'&&s.phase==='applying');}
 canJump(){return this.started&&!this.jumpBlocked()&&!this.jumpMotion.active;}
 jump(){if(!this.canJump())return false;this.cancelMove();return this.jumpMotion.start();}
 cancelJump(){this.camera.position.y-=this.jumpMotion.height;this.jumpMotion.reset();}
 stop(){this.keys.clear();this.moveInput={right:0,forward:0};this.drag=null;this.cancelJump();}
 project(pos){const v=new THREE.Vector3(...pos).project(this.camera);return {x:(v.x*.5+.5)*innerWidth,y:(-.5*v.y+.5)*innerHeight,visible:v.z>0&&v.z<1&&Math.abs(v.x)<.94&&Math.abs(v.y)<.85};}
 frame(now){
  if(this.suspended){this.last=now;requestAnimationFrame(n=>this.frame(n));return;}
  const dt=Math.min((now-this.last)/1000,.05);this.last=now;const t=now/1000;
  this.camera.position.y-=this.jumpMotion.height;
  this.updateQueue(dt);updatePeople(this,dt);updateFireworks(this,dt);
  this.updateGuidedMove(dt);
  if(this.started&&!this.locked&&!this.ritualLocked&&(this.keys.size||this.moveInput.right||this.moveInput.forward)){let {forward,right}=this.moveInput;for(let k of this.keys){if(['w','arrowup','forward'].includes(k))forward++;if(['s','arrowdown','back'].includes(k))forward--;if(['d','arrowright','right'].includes(k))right++;if(['a','arrowleft','left'].includes(k))right--;}
   const norm=Math.max(1,Math.hypot(forward,right)),speed=dt*WALK_SPEED;const x=this.camera.position.x+(-Math.sin(this.yaw)*forward+Math.cos(this.yaw)*right)*speed/norm,z=this.camera.position.z+(-Math.cos(this.yaw)*forward-Math.sin(this.yaw)*right)*speed/norm;const [nx,nz]=constrainWalk(x,z,this.hasEntered);const safe=moveAmongPeople(this.camera.position,{x:nx,z:nz},this.obstacles());this.camera.position.x=safe.x;this.camera.position.z=safe.z;this.camera.position.y+=( (nz<1?2.1:1.9)-this.camera.position.y)*dt*6;if(z<1&&!this.hasEntered)this.onMove?.('queue');
  }
  if(this.jumpBlocked())this.jumpMotion.reset();
  this.camera.position.y+=this.jumpMotion.step(dt);
  this.camera.rotation.set(this.pitch,this.yaw,0,'YXZ');
  if(this.companionBalloon){this.companionBalloon.position.x=Math.min(1.05,.68*2.05*Math.tan(this.camera.fov*Math.PI/360)*this.camera.aspect);if(!this.reduced){this.companionBalloon.position.y=.38+Math.sin(t*1.5)*.035;this.companionBalloon.rotation.z=Math.sin(t*.8)*.045;}}
  for(const anim of this.animations)anim(t);
  this.rituals?.update(dt,t);this.camera.updateMatrixWorld();updatePurchase(this,dt);this.renderer.render(this.scene,this.renderCamera||this.camera);this.onFrame?.(this.camera.position,t);requestAnimationFrame(n=>this.frame(n));
 }
 screenshot(){this.renderer.render(this.scene,this.renderCamera||this.camera);return this.canvas;}
}
