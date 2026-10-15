import * as THREE from './assets/three.module.js';
export function buildRitualExtras(w){
 w.extraDhakis=[];for(const [x,z,phase] of [[-7.8,-3.9,0],[7.8,-3.9,1.4]]){
  const p=w.person(x,z,{outfit:phase?'#b8734c':'#d9c7a5',pose:'dhak',rotation:x<0?.5:-.5});p.nonInteractable=true;w.extraDhakis.push(p);const drum=new THREE.Group();drum.position.set(0,.9,.48);drum.rotation.z=.2;p.body.add(drum);
  const barrel=w.mesh((w.geometries.dhakBarrel??=new THREE.CylinderGeometry(.31,.33,.85,14)),'#984b33',[0,0,0],null,drum);barrel.rotation.z=Math.PI/2;
  for(const xx of [-.44,.44]){const skin=w.cyl('#ded0aa',[xx,0,0],[.335,.04,.335],drum);skin.rotation.z=Math.PI/2;}
  for(let i=0;i<8;i++){const a=i*Math.PI/4;w.rod([-.43,Math.cos(a)*.33,Math.sin(a)*.33],[.43,Math.cos(a+.45)*.33,Math.sin(a+.45)*.33],.01,'#d8c7a2',drum);}
  w.rod([-.2,1.5,0],[.34,.93,.48],.03,'#b46846',p.body);
  for(let i=0;i<2;i++)w.rod([0,-.43,0],[0,-.43,.44],.012,'#d7c099',p.arms[i]);
  for(let i=0;i<5;i++)w.ball('#ece0c4',[-.35,.33+i*.05,.04+i*.03],[.045,.28,.025],drum);
  w.animations.push(t=>{if(!w.reduced)for(let i=0;i<2;i++)p.arms[i].rotation.x=-.7+Math.sin(t*14+phase+i*Math.PI)*.38;});
 }
 const p=w.person(7.9,-6.3,{outfit:'#eee1c9',sari:true,pose:'shankha',rotation:Math.PI-.45});p.nonInteractable=true;w.conchPerson=p;
 const red=w.box('#a43b30',[-.08,1.24,.18],[.16,.75,.035],p.body);red.rotation.z=-.39;
 p.arms[0].rotation.set(-1.55,0,-.38);p.arms[1].rotation.set(-1.55,0,.38);p.forearms.forEach(f=>f.rotation.x=-1.05);for(const side of [-1,1])w.ball(p.skin,[side*.12,1.66,.42],[.043,.065,.035],p.body);
 const shell=new THREE.Group();shell.name='shankha-shell';shell.position.set(0,1.74,.30);p.body.add(shell);w.ball('#e9dfc4',[0,0,.12],[.15,.11,.22],shell);const tip=w.mesh('cone','#eee4cd',[0,.015,.32],[.1,.24,.1],shell);tip.rotation.x=Math.PI/2;
 for(let i=0;i<4;i++){const spiral=new THREE.Mesh(new THREE.TorusGeometry(.10-i*.02,.012,5,18),w.mat('#c9bfa7'));spiral.rotation.y=Math.PI/2;spiral.position.set(.14,0,.1);shell.add(spiral);}w.cyl('#cfb99c',[0,-.025,-.07],[.04,.09,.04],shell).rotation.x=Math.PI/2;
 w.animations.push(t=>{if(!w.reduced){const breath=Math.sin(t*.6);shell.rotation.x=breath*.012;p.head.rotation.x=.035+breath*.02;}});
}
