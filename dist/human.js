import * as THREE from './assets/three.module.js';

// Shared geometry, jointed limbs and layered cloth keep the crowd inexpensive.
export function createHuman(w,x,z,{outfit='#c18c54',sari=false,pose='idle',scale=1,rotation=0,hair,skin,priest=false}={}){
 const seed=Math.abs(Math.round(x*7+z*11));skin??=['#b78662','#9b694c','#c39470','#84583f'][seed%4];hair??=seed%9===0?'#817b70':'#252426';
 const g=new THREE.Group();g.position.set(x,z<1?.4:0,z);g.rotation.y=rotation;g.scale.setScalar(scale);g.name='jointed-human';w.scene.add(g);const body=new THREE.Group();g.add(body);
 const border=sari?'#d7b469':'#d9c49d';
 if(sari){
  w.mesh((w.geometries.sari??=new THREE.CylinderGeometry(.18,.285,.87,12)),outfit,[0,.62,0],null,body);w.ball(outfit,[0,1.29,0],[.222,.285,.135],body);w.cyl(border,[0,1.06,0],[.185,.045,.145],body);
  const pallu=w.box(outfit,[-.075,1.23,.145],[.17,.76,.045],body);pallu.rotation.z=-.39;const trim=w.box(border,[-.14,1.24,.173],[.025,.75,.014],body);trim.rotation.z=-.39;w.box(outfit,[-.19,1.19,-.135],[.17,.75,.055],body);
  for(let i=0;i<5;i++)w.box(i%2?border:outfit,[-.08+i*.034,.62,.252],[.013,.75,.016],body);w.cyl(border,[0,.20,0],[.28,.045,.28],body);
 }else{
  w.ball(outfit,[0,1.29,0],[.235,.285,.145],body);w.mesh((w.geometries.kurta??=new THREE.CylinderGeometry(.205,.25,.55,12)),outfit,[0,1.005,0],null,body);
  for(const side of [-1,1]){w.mesh((w.geometries.dhoti??=new THREE.CylinderGeometry(.105,.13,.64,10)),priest?'#f0e5ce':'#e0d1af',[side*.115,.45,0],null,body);w.box('#d1bda0',[side*.09,.5,.125],[.018,.59,.018],body);}w.box('#e9ddc4',[0,.55,.14],[.09,.62,.025],body);
  for(let i=0;i<3;i++)w.ball(border,[0,1.43-i*.12,.146],[.013,.013,.01],body);for(const side of [-1,1]){const collar=w.box(border,[side*.055,1.52,.10],[.09,.06,.035],body);collar.rotation.z=side*.3;}
 }
 const head=new THREE.Group();head.position.y=1.62;body.add(head);head.name='head-and-face';w.cyl(skin,[0,-.015,0],[.065,.15,.065],head);w.ball(skin,[0,.18,.012],[.145,.19,.138],head);
 const cap=w.mesh((w.geometries.hairCap??=new THREE.SphereGeometry(1,12,8,0,Math.PI*2,0,Math.PI*.52)),hair,[0,.205,-.025],[.151,.18,.145],head);cap.rotation.x=-.12;
 for(const side of [-1,1]){w.ball(skin,[side*.146,.17,0],[.027,.043,.025],head);w.ball('#e5dcc9',[side*.052,.205,.135],[.031,.014,.01],head);w.ball('#292722',[side*.052,.205,.144],[.012,.014,.006],head);const brow=w.box(hair,[side*.054,.239,.133],[.061,.012,.012],head);brow.rotation.z=side*.08;if(sari)w.ball('#c6a05c',[side*.15,.113,.02],[.015,.025,.012],head);}
 w.ball(skin,[0,.155,.151],[.024,.042,.032],head);w.box('#7c4a3c',[0,.098,.135],[.052,.009,.012],head);
 if(sari){w.ball(hair,[0,.17,-.158],[.105,.10,.07],head);w.ball('#a63e31',[0,.28,.133],[.012,.014,.008],head);}
 const arms=[],forearms=[],hands=[];for(const side of [-1,1]){const a=new THREE.Group();a.position.set(side*.215,1.48,0);body.add(a);w.ball(outfit,[side*.025,-.035,0],[.075,.10,.075],a);w.rod([side*.015,-.07,0],[side*.045,-.255,.01],.055,sari?skin:outfit,a);w.ball(skin,[side*.045,-.255,.01],[.055,.057,.055],a);const f=new THREE.Group();f.position.set(side*.045,-.255,.01);f.rotation.x=-.18;a.add(f);w.rod([0,0,0],[0,-.21,.025],.047,skin,f);const hand=w.ball(skin,[0,-.255,.033],[.045,.075,.028],f);w.ball(skin,[-side*.042,-.23,.037],[.022,.035,.023],f);arms.push(a);forearms.push(f);hands.push(hand);}
 const legs=[];for(const side of [-1,1]){const l=new THREE.Group();l.position.set(side*.115,.38,0);body.add(l);w.cyl(skin,[0,-.20,0],[.052,.28,.052],l);w.box('#4d3e32',[0,-.335,.065],[.13,.055,.25],l);w.box(skin,[0,-.30,.055],[.105,.045,.18],l);w.box('#967149',[0,-.267,.10],[.11,.018,.033],l);legs.push(l);}
 if(pose==='photo'){arms.forEach(a=>a.rotation.x=-1.1);forearms.forEach(a=>a.rotation.x=-.6);w.box('#292d31',[0,1.5,.49],[.29,.16,.035],body);w.box('#7e9aa7',[0,1.5,.514],[.22,.105,.012],body,{emissive:'#829aaa',emissiveIntensity:.2});}
 if(pose==='pray'){for(let i=0;i<2;i++){arms[i].rotation.x=-.9;arms[i].rotation.z=i?.45:-.45;}w.rod([-.14,1.25,.28],[0,1.41,.34],.045,skin,body);w.rod([.14,1.25,.28],[0,1.41,.34],.045,skin,body);}
 if(priest){w.box('#b16e49',[-.14,1.25,.16],[.10,.72,.03],body);w.rod([-.18,1.49,.16],[.17,.95,.17],.011,'#f1e6cb',body);w.ball('#a14935',[0,.27,.142],[.012,.036,.006],head);}
 const p={g,body,head,arms,forearms,hands,legs,pose,seed:x*3+z,radius:.30*scale,skin,sari};w.people.push(p);return p;
}
