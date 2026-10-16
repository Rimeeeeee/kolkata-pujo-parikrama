import * as THREE from './assets/three.module.js';
import {CHARACTERS} from './neighbourhood.js';
import {moveAmongPeople} from './movement.js';

export function buildStreetDetails(w){
 // A continuous lane and occupied far end replace the empty reverse view.
 w.box('#615752',[0,-.04,36],[23,.06,30]);
 for(const [x,h,col] of [[-9,13,'#a38c73'],[-3.4,10.8,'#78877b'],[3.4,12,'#b29a80'],[9,14,'#a47a68']]){
  w.box(col,[x,h/2,44],[6,h,2]);w.box('#d0b694',[x,h,43.8],[6.4,.26,2.4]);
  for(let level=0;level<3;level++)for(const offset of [-1.5,1.5]){const y=2.2+level*3.2;w.box('#354d43',[x+offset,y,42.94],[1.25,1.9,.1]);for(let sl=0;sl<7;sl++)w.box('#6f7c66',[x+offset,y-.7+sl*.23,42.85],[1.16,.055,.05]);w.box('#d3bd96',[x+offset,y-1.05,42.75],[1.55,.14,.4]);}
 }
 w.text('শুভ শারদীয়া',[0,6.3,40.7],6,.75,{bg:'#8e3f32'});
 w.streetLamps=[];for(const side of [-1,1])for(const z of [6,17,29,38]){
  const g=new THREE.Group();g.name='kolkata-street-lamp';g.position.set(side*11.2,0,z);w.scene.add(g);w.streetLamps.push(g);
  w.cyl('#354a43',[0,.2,0],[.24,.4,.24],g);w.cyl('#3c5147',[0,2.95,0],[.075,5.5,.075],g);for(const y of [.5,1,4.9,5.3])w.cyl('#8c9c7f',[0,y,0],[.12,.1,.12],g);
  for(const dir of [-1,1]){w.rod([0,5.3,0],[dir*.65,5.75,0],.04,'#3c5147',g);w.rod([dir*.65,5.75,0],[dir*.92,5.45,0],.04,'#3c5147',g);w.box('#394a40',[dir*.92,5.05,0],[.5,.08,.5],g);w.box('#f0c77e',[dir*.92,5.32,0],[.32,.48,.32],g,{emissive:'#efb965',emissiveIntensity:1.1});w.mesh('cone','#354a43',[dir*.92,5.68,0],[.36,.27,.36],g);}
 }
 for(const z of [31,36,40]){const pts=[];for(let i=0;i<=24;i++){const x=-11+i*22/24,y=7.5-Math.sin(i*Math.PI/24)*1.2;pts.push([x,y,z]);if(i%2===0)w.bulb([x,y-.12,z],i%4?'#e8b96b':'#e39a71',.07);}w.line(pts,'#514840');for(const side of [-1,1])w.flowers([side*10.9,6.2,z],[side*6.5,6.5,z],.22);}
 buildTaxi(w);
}

function buildTaxi(w){
 const t=new THREE.Group();t.name='kolkata-ambassador-taxi';t.position.set(-7.8,.1,31);t.rotation.y=Math.PI+.14;w.scene.add(t);w.taxi=t;
 const yellow='#e5b72f',chrome='#bcc4bd',blue='#284e87';
 const shape=new THREE.Shape();shape.moveTo(-.72,-.19);shape.lineTo(.72,-.19);shape.quadraticCurveTo(.91,-.19,.91,0);shape.lineTo(.91,.22);shape.quadraticCurveTo(.91,.4,.72,.4);shape.lineTo(-.72,.4);shape.quadraticCurveTo(-.91,.4,-.91,.22);shape.lineTo(-.91,0);shape.quadraticCurveTo(-.91,-.19,-.72,-.19);
 const body=new THREE.Mesh(new THREE.ExtrudeGeometry(shape,{depth:3.65,bevelEnabled:true,bevelSegments:3,steps:1,bevelSize:.12,bevelThickness:.12}),w.mat(yellow,{roughness:.42,metalness:.18}));body.position.set(0,.6,-1.9);t.add(body);
 w.ball(yellow,[0,1.27,-.28],[.86,.65,1.15],t);w.box('#51696b',[0,1.4,.67],[1.46,.50,.04],t);w.box('#51696b',[0,1.4,-1.22],[1.4,.43,.04],t);
 for(const side of [-1,1]){w.box('#526868',[side*.84,1.37,-.25],[.035,.44,1.54],t);w.box(yellow,[side*.86,1.38,-.25],[.065,.51,.10],t);w.box(blue,[side*.99,.85,-.08],[.025,.105,3.65],t);w.box(chrome,[side*.9,1.1,-.65],[.04,.035,.22],t);w.ball(chrome,[side*1.04,1.17,.74],[.13,.085,.14],t);for(const z of [-1.19,1.15]){w.ball(yellow,[side*.84,.64,z],[.27,.43,.52],t);const tire=w.cyl('#292d2d',[side*.98,.38,z],[.37,.18,.37],t);tire.rotation.z=Math.PI/2;const hub=w.cyl(chrome,[side*1.085,.38,z],[.22,.02,.22],t);hub.rotation.z=Math.PI/2;}
  const sign=w.text('NO REFUSAL',[side*1.015,.97,-.12],1.4,.16,{bg:null,fg:'#243e69',font:'DM Sans',parent:t,size:64});sign.rotation.y=side*Math.PI/2;
 }
 w.box('#353d3d',[0,.76,1.92],[1,.44,.07],t);for(let i=0;i<9;i++)w.box(chrome,[-.44+i*.11,.76,1.975],[.035,.37,.025],t);
 for(const x of [-.67,.67]){w.ball(chrome,[x,.87,1.91],[.22,.22,.12],t);w.ball('#eee2b3',[x,.87,2.0],[.16,.16,.045],t,{emissive:'#e6d4a5',emissiveIntensity:.5});w.box('#bd6536',[x,.57,1.98],[.19,.08,.04],t);}
 for(const z of [-2.03,2.07])w.box(chrome,[0,.4,z],[1.96,.12,.13],t);
 w.text('WB 04 · 2026',[0,.49,2.15],.7,.16,{bg:'#dbc342',fg:'#242a2c',font:'DM Sans',parent:t,size:68});w.text('TAXI',[0,1.99,-.26],.62,.23,{bg:'#eac846',fg:'#243d65',font:'DM Sans',parent:t,size:80});
}

export function installPeopleLife(w){
 w.characters=new Map();w.lifeTime=0;w.crowdTick=0;
 for(const [id,c] of Object.entries(CHARACTERS)){
  const candidates=id==='photographer'?w.people.filter(p=>p.pose==='photo'):w.people;
  const p=w.vendorPeople.get(id)||candidates.reduce((a,b)=>Math.hypot(b.g.position.x-c.position[0],b.g.position.z-c.position[2])<Math.hypot(a.g.position.x-c.position[0],a.g.position.z-c.position[2])?b:a);
  p.characterId=id;w.characters.set(id,p);
 }
 for(const p of w.people){
  p.home=p.g.position.clone();p.restYaw=p.g.rotation.y;p.restArms=p.arms.map(a=>a.rotation.clone());
  p.head=new THREE.Group();p.head.position.y=1.68;const parts=p.body.children.filter(o=>o.position.y>=1.65);p.body.add(p.head);for(const o of parts){o.position.y-=1.68;p.head.add(o);}
  p.legs=[];for(const side of [-1,1]){const parts=p.body.children.filter(o=>o.isMesh&&o.position.y<.4&&Math.sign(o.position.x)===side);if(parts.length){const leg=new THREE.Group();leg.position.set(side*.12,.39,0);p.body.add(leg);for(const part of parts){part.position.sub(leg.position);leg.add(part);}p.legs.push(leg);}}
  if(p.characterId&&!p.nonInteractable){const gesture=new THREE.Group();gesture.name='namaskar-hands';gesture.visible=false;p.body.add(gesture);p.gesture=gesture;p.gestureRods=Array.from({length:4},()=>w.cyl('#a77b57',[0,0,0],[.06,.3,.06],gesture));p.palms=[-1,1].map(side=>w.ball('#a77b57',[side*.025,1.45,.36],[.028,.105,.06],gesture));}
 }
 const walkers=w.people.filter(p=>p.batched&&p.g.position.z>20).slice(-3);for(const [i,p] of walkers.entries()){p.walkPoints=[{x:p.home.x,z:p.home.z},{x:p.home.x+(p.home.x>0?-.8:.8),z:p.home.z-1.2}];p.walkIndex=i%2;p.walkWait=i*1.1;}
}

export function greetPerson(w,id){const p=w.characters.get(id);if(!p||p.nonInteractable)return;if(p.pose==='dhak'){w.conversationId=id;return;}p.greetingUntil=w.lifeTime+4.5;p.greetingStart=w.lifeTime;w.conversationId=id;}
export function characterPosition(w,id){const p=w.characters.get(id);return p?[p.g.position.x,p.g.position.y+2.22*p.g.scale.y,p.g.position.z]:null;}

export function updatePeople(w,dt){
 w.lifeTime+=dt;w.crowdTick+=dt;const refresh=w.crowdTick>=1/24;if(refresh)w.crowdTick=0;
 for(const p of w.people){
  const t=w.lifeTime,phase=t+p.seed,queueActive=p.queueId!==undefined&&w.queueRun;
  const greeting=Math.max(0,(p.greetingUntil||0)-t);
  if(p.walkPoints&&!w.reduced&&!greeting&&!w.target&&w.started&&!w.locked&&!w.conversationId){p.walkWait-=dt;if(p.walkWait<=0){const target=p.walkPoints[p.walkIndex],dist=Math.hypot(target.x-p.g.position.x,target.z-p.g.position.z),step=Math.min(dist,.65*dt);const others=w.people.filter(o=>o!==p).map(o=>({x:o.g.position.x,z:o.g.position.z,radius:o.radius}));others.push({x:w.camera.position.x,z:w.camera.position.z,radius:.36});const safe=moveAmongPeople(p.g.position,{x:p.g.position.x+(target.x-p.g.position.x)*step/(dist||1),z:p.g.position.z+(target.z-p.g.position.z)*step/(dist||1)},others,p.radius);p.g.rotation.y=Math.atan2(safe.x-p.g.position.x,safe.z-p.g.position.z);p.g.position.x=safe.x;p.g.position.z=safe.z;if(dist<.08){p.walkIndex=1-p.walkIndex;p.walkWait=2.5;}p.walking=dist>.08;}else p.walking=false;}else p.walking=false;
  if(!w.reduced&&!queueActive){p.body.position.y=Math.sin(phase*1.7)*.018+(p.walking?Math.abs(Math.sin(t*6))*.025:0);p.head.rotation.y=Math.sin(phase*.48)*.13;p.head.rotation.x=Math.sin(phase*.72)*.035;p.body.rotation.z=Math.sin(phase*.7)*.014;
   p.legs.forEach((leg,i)=>leg.rotation.x=p.walking?Math.sin(t*6+i*Math.PI)*.35:0);
   if(['idle','photo','pray'].includes(p.pose))for(let i=0;i<2;i++){p.arms[i].rotation.x=p.restArms[i].x+Math.sin(phase*(p.walking?6:1.15)+i*Math.PI)*(p.walking?.3:.055);p.arms[i].rotation.z=p.restArms[i].z+Math.sin(phase*.8+i)*.035;}
  }
  if(p.pose==='arati')p.g.rotation.y=Math.atan2(-p.g.position.x,-21.25-p.g.position.z);
  if(p.gesture){p.gesture.visible=greeting>0;p.arms.forEach(a=>a.visible=!greeting);if(greeting){const age=t-p.greetingStart,k=w.reduced?1:Math.min(1,age/.55,greeting/.55);const facing=Math.atan2(w.camera.position.x-p.g.position.x,w.camera.position.z-p.g.position.z);p.g.rotation.y=facing;p.head.rotation.x=.12*k;for(let sideIndex=0;sideIndex<2;sideIndex++){const side=sideIndex?1:-1,shoulder=new THREE.Vector3(side*.23,1.48,0),elbow=new THREE.Vector3(side*.32,1.09,.19*k),hand=new THREE.Vector3(side*(.31*(1-k)+.025*k),1.02+.43*k,.045+.315*k);p.palms[sideIndex].position.copy(hand);const points=[[shoulder,elbow],[elbow,hand]];points.forEach(([a,b],j)=>{const rod=p.gestureRods[sideIndex*2+j],v=b.clone().sub(a);rod.position.copy(a).add(b).multiplyScalar(.5);rod.scale.y=v.length();rod.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),v.normalize());});}}}
  if(p.batched&&refresh){p.g.updateWorldMatrix(true,true);for(const ref of p.instances||[]){ref.mesh.setMatrixAt(ref.index,ref.object.matrixWorld);ref.mesh.instanceMatrix.needsUpdate=true;}}
 }
}

export function createFireworks(w){
 const count=6*96,positions=new Float32Array(count*3),colors=new Float32Array(count*3);positions.fill(-100);const palette=['#eec976','#d98d93','#8fcebf','#b3a0dc','#e1ac6b','#bdd897'];
 for(let i=0;i<count;i++){const c=new THREE.Color(palette[Math.floor(i/96)]);colors.set([c.r,c.g,c.b],i*3);}
 const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.BufferAttribute(positions,3).setUsage(THREE.DynamicDrawUsage));geometry.setAttribute('color',new THREE.BufferAttribute(colors,3));const points=new THREE.Points(geometry,new THREE.PointsMaterial({size:.11,vertexColors:true,transparent:true,opacity:.88,depthWrite:false}));points.name='street-fireworks';points.frustumCulled=false;points.visible=false;w.scene.add(points);w.fireworks={points,positions,elapsed:0,active:false};
}
export function updateFireworks(w,dt){const f=w.fireworks;if(!f?.active)return;f.elapsed+=dt;for(let group=0;group<6;group++){const age=w.reduced?2.3:(f.elapsed+group*1.07)%7,cx=(group-2.5)*4.5,cy=15+(group%3)*2.3,cz=48+(group%2)*6;for(let j=0;j<96;j++){const i=(group*96+j)*3,a=j*2.39996,v=1-2*(j+.5)/96,r=Math.sqrt(1-v*v),burst=age-1.5;let x=cx,y=-100,z=cz;if(age<1.5){if(j<12){y=3+age/1.5*(cy-3)-j*.1;x+=Math.sin(age*4)*.06;}}else if(burst<3.4){const spread=2.8*burst;x+=Math.cos(a)*r*spread;y=cy+v*spread-.63*burst*burst;z+=Math.sin(a)*r*spread;}f.positions[i]=x;f.positions[i+1]=y;f.positions[i+2]=z;}}f.points.geometry.attributes.position.needsUpdate=true;}
