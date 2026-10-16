import * as THREE from './assets/three.module.js';

export function buildRequestedAdditions(w){
 // Reuse the original floor artwork. Existing alpona and floor geometry stay intact.
 w.addedAlponas=[];const original=w.alponas[0];const shopBorders=[[-8.15,10],[-8.15,19],[-8.15,25],[8.15,7],[8.15,14.9],[8.15,25]].flatMap(([x,z])=>[-1.15,1.15].map(offset=>[x,z+offset,.65]));
 for(const [x,z,size] of [[0,5.9,3.7],[0,9.5,2.5],[-8.15,10.7,1.7],[-8.15,19.7,1.7],[-8.15,25.6,1.7],[8.15,7.5,1.7],[8.15,15.2,1.7],[8.15,25.6,1.7],...([3.25,6.15].flatMap(x=>[2,5,8,11,14,16.5].map(z=>[x,z,.8]))),...shopBorders]){const m=original.clone();m.scale.setScalar(size/original.geometry.parameters.width);m.position.set(x,.03,z);m.name='added-lane-alpona';w.scene.add(m);w.addedAlponas.push(m);}
 w.extraDhakis=[];for(const [x,z,phase] of [[-8.3,-4.8,0],[8.3,-4.8,1.4]]){
  const p=w.person(x,z,{outfit:phase?'#b8734c':'#d9c7a5',pose:'dhak',rotation:x<0?.5:-.5});p.nonInteractable=true;w.extraDhakis.push(p);const drum=new THREE.Group();drum.position.set(0,.95,.48);drum.rotation.z=.2;p.body.add(drum);
  const barrel=w.mesh((w.geometries.extraDhak??=new THREE.CylinderGeometry(.31,.33,.85,14)),'#984b33',[0,0,0],null,drum);barrel.rotation.z=Math.PI/2;
  for(const xx of [-.44,.44]){const skin=w.cyl('#ded0aa',[xx,0,0],[.335,.04,.335],drum);skin.rotation.z=Math.PI/2;}
  for(let i=0;i<8;i++){const a=i*Math.PI/4;w.rod([-.43,Math.cos(a)*.33,Math.sin(a)*.33],[.43,Math.cos(a+.45)*.33,Math.sin(a+.45)*.33],.01,'#d8c7a2',drum);}
  w.rod([-.2,1.6,0],[.34,.93,.48],.03,'#b46846',p.body);for(let i=0;i<2;i++)w.rod([0,-.43,0],[0,-.43,.44],.012,'#d7c099',p.arms[i]);
  for(let i=0;i<5;i++)w.ball('#ece0c4',[-.35,.33+i*.05,.04+i*.03],[.045,.28,.025],drum);
  w.animations.push(t=>{if(!w.reduced)for(let i=0;i<2;i++)p.arms[i].rotation.x=-.7+Math.sin(t*14+phase+i*Math.PI)*.38;});
 }
 const p=w.person(8.3,-8.2,{outfit:'#eee1c9',sari:true,pose:'shankha',rotation:-Math.PI/2});p.nonInteractable=true;w.conchPerson=p;
 const border=w.box('#a43b30',[-.1,1.25,.24],[.13,.76,.035],p.body);border.rotation.z=-.25;p.arms.forEach(a=>a.visible=false);
 for(const side of [-1,1]){w.rod([side*.23,1.48,0],[side*.31,1.48,.22],.06,'#a77b57',p.body);w.rod([side*.31,1.48,.22],[side*.12,1.78,.37],.05,'#a77b57',p.body);w.ball('#a77b57',[side*.12,1.78,.37],[.055,.07,.045],p.body);}
 const shell=new THREE.Group();shell.name='shankha-shell';shell.position.set(0,1.83,.30);p.body.add(shell);w.ball('#e9dfc4',[0,0,.12],[.15,.11,.22],shell);const tip=w.mesh('cone','#eee4cd',[0,.015,.32],[.10,.24,.10],shell);tip.rotation.x=Math.PI/2;for(let i=0;i<4;i++){const spiral=new THREE.Mesh(new THREE.TorusGeometry(.10-i*.02,.012,5,18),w.mat('#c9bfa7'));spiral.rotation.y=Math.PI/2;spiral.position.set(.14,0,.1);shell.add(spiral);}
 w.animations.push(t=>{if(!w.reduced)shell.rotation.x=Math.sin(t*.6)*.015;});
}
