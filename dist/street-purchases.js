import * as THREE from './assets/three.module.js';
import {STALL_MENUS} from './neighbourhood.js';
import {withinReach} from './interaction.js';
import {RitualArms} from './ritual-arms.js';

function model(w,kind){
 const g=new THREE.Group();g.name=`serving-${kind}`;
 const terracotta='#a95e3d',leaf='#698142';
 if(['tea','doi'].includes(kind)){
  const geo=w.geometries.bhaar??=new THREE.LatheGeometry([[0,0],[.085,0],[.12,.20],[.105,.21],[.09,.035],[0,.035]].map(p=>new THREE.Vector2(...p)),16);
  w.mesh(geo,terracotta,[0,0,0],null,g);w.cyl(kind==='tea'?'#70472c':'#eed9b2',[0,.18,0],[.101,.01,.101],g);
  for(const y of [.03,.08,.13]){const rim=w.mesh(w.geometries.bhaarRim??=new THREE.TorusGeometry(.10,.004,4,16),'#c18455',[0,y,0],[.85+y,1,.85+y],g);rim.rotation.x=Math.PI/2;}
 }else if(kind==='jhalmuri'){
  w.mesh(w.geometries.muriCone??=new THREE.ConeGeometry(.16,.38,12,1,true),'#d6bd91',[0,.18,0],null,g).rotation.z=Math.PI;
  w.cyl('#e2cc95',[0,.36,0],[.15,.018,.15],g);for(let i=0;i<14;i++)w.ball(i%4?'#f1dfb2':leaf,[Math.sin(i*2.4)*.12,.38,Math.cos(i*2.4)*.12],[.014,.012,.025],g);
 }else if(kind==='flowers'){
  w.cyl('#a77d43',[0,.06,0],[.24,.12,.24],g);for(const y of [.02,.07,.12]){const rim=w.mesh(w.geometries.basketRim??=new THREE.TorusGeometry(.24,.009,4,20),'#dfbc7b',[0,y,0],null,g);rim.rotation.x=Math.PI/2;}
  for(let i=0;i<12;i++){const a=i*2.4,x=Math.sin(a)*.18,z=Math.cos(a)*.18;w.ball(i%2?'#f1ad2e':'#df6535',[x,.14,z],[.055,.045,.055],g);w.ball(leaf,[x,.12,z],[.025,.01,.09],g);}
  const handle=w.mesh(w.geometries.basketHandle??=new THREE.TorusGeometry(.235,.012,5,20,Math.PI),'#d7ad63',[0,.10,0],null,g);handle.name='woven-basket-handle';
 }else{
  w.ball(leaf,[0,.02,0],[.26,.035,.21],g);
  for(let i=0;i<(kind==='sandesh'?3:5);i++){const a=i*2.4,x=Math.sin(a)*.15,z=Math.cos(a)*.12;w.ball(kind==='fuchka'?'#c18c43':'#f2dfb5',[x,.08,z],kind==='sandesh'?[.066,.032,.06]:[.06,.055,.06],g);if(kind==='fuchka')w.ball('#665334',[x,.126,z],[.027,.009,.026],g);}
 }
 const hand=new THREE.Group();hand.name='your-serving-hand';g.add(hand);g.servingHand=hand;
 w.ball('#b38a65',[0,-.025,.045],[.085,.032,.12],hand);w.ball('#b38a65',[-.075,.015,.03],[.028,.027,.07],hand);
 w.rod([.025,-.045,.10],[.08,-.10,.29],.05,'#b38a65',hand);
 for(let i=0;i<4;i++)w.ball('#b38a65',[-.055+i*.035,-.008,-.055],[.014,.025,.06],hand);
 return g;
}
function kindFor(shop,id){return shop==='flowers'?'flowers':shop==='tea'?'tea':shop==='jhalmuri'?'jhalmuri':shop==='fuchka'?'fuchka':id==='mishti-doi'?'doi':id==='sandesh'?'sandesh':'roshogolla';}
export function presentPurchase(w,shop,item){
 const vendor=w.vendorPeople.get(shop),valid=STALL_MENUS[shop]?.items.find(i=>i.id===item?.id);
 if(!vendor||!valid||w.locked||w.ritualLocked||!withinReach(w.camera.position,vendor.g.position,{entered:w.hasEntered}))return false;
 putAwayPurchase(w);const kind=kindFor(shop,item.id);w.servingModels??=new Map();let prop=w.servingModels.get(kind);
 if(!prop){prop=model(w,kind);w.servingModels.set(kind,prop);}w.scene.add(prop);prop.visible=true;prop.scale.setScalar(shop==='flowers'?{'jhuri-small':.75,'jhuri-medium':1,'jhuri-large':1.2}[item.id]:1);
 vendor.greetingUntil=0;if(vendor.gesture)vendor.gesture.visible=false;vendor.arms.forEach(a=>a.visible=true);vendor.armPose??=new RitualArms(vendor);
 w.purchase={shop,item:valid,prop,vendor,elapsed:0,start:new THREE.Vector3(),end:new THREE.Vector3()};updatePurchase(w,0);return true;
}
export function putAwayPurchase(w){if(!w.purchase)return;w.purchase.vendor.armPose?.restore();w.purchase.prop.removeFromParent();w.purchase=null;}
export function updatePurchase(w,dt){
 const p=w.purchase;if(!p)return;p.elapsed+=dt;const {prop,vendor}=p;
 // Put serving hands away during a ritual and third-person camera shots.
 prop.visible=!w.ritualLocked&&!w.renderCamera;
 prop.servingHand.visible=w.reduced||p.elapsed>=1.85;
 const target=new THREE.Vector3(.30,1.30,.51);vendor.body.localToWorld(target);
 if(p.elapsed<1.15&&!w.reduced){vendor.armPose.pose(1,target);vendor.body.updateWorldMatrix(true,true);vendor.arms[1].getObjectByName('human-hand').getWorldPosition(p.start);p.start.y+=.04;}
 else vendor.armPose.restore();
 const x=Math.min(.32,.52*Math.tan(w.camera.fov*Math.PI/360)*w.camera.aspect);
 p.end.set(x,-.39,-.83).applyMatrix4(w.camera.matrixWorld);
 if(p.elapsed<1.15&&!w.reduced){prop.position.copy(p.start);prop.quaternion.copy(vendor.g.quaternion);}
 else{const k=w.reduced?1:THREE.MathUtils.smoothstep(p.elapsed,1.15,1.85);prop.position.lerpVectors(p.start,p.end,k);prop.quaternion.copy(w.camera.quaternion);if(!w.reduced)prop.position.y+=Math.sin(p.elapsed*1.7)*.004;}
}
