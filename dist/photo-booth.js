import * as THREE from './assets/three.module.js';
import {postcardName} from './fairground-state.js';
export const PHOTO_SPOT={camera:[0,1.65,14.5],stand:[0,0,9.5],visit:[0,1.9,17],look:[0,4.1,0]};
export function buildPhotoBooth(w){
 const rig=new THREE.Group();rig.name='pandal-photo-camera';rig.position.set(0,0,14.5);w.scene.add(rig);w.photoRig=rig;
 for(const a of [0,Math.PI*2/3,Math.PI*4/3])w.rod([0,1.5,0],[Math.cos(a)*.45,.03,Math.sin(a)*.45],.025,'#454b49',rig);
 w.box('#303d3d',[0,1.63,0],[.45,.29,.20],rig);const lens=w.cyl('#56676b',[0,1.63,-.17],[.105,.18,.105],rig);lens.rotation.x=Math.PI/2;w.ball('#7597a1',[0,1.63,-.27],[.08,.08,.018],rig);
 w.text('পুজোর ছবি',[0,1.98,0],1.05,.22,{bg:'#7c4535',parent:rig,size:73});
 w.portraitCamera=new THREE.PerspectiveCamera(64,1.5,.1,100);w.portraitCamera.position.set(...PHOTO_SPOT.camera);w.portraitCamera.lookAt(...PHOTO_SPOT.look);w.scene.add(w.portraitCamera);
}
export function setPortrait(w,{outfit='sari',pose='namaskar'}={}){
 if(w.portraitActor)w.scene.remove(w.portraitActor.g);
 const p=w.person(...[PHOTO_SPOT.stand[0],PHOTO_SPOT.stand[2]],{outfit:outfit==='sari'?'#a94437':'#e5cc98',sari:outfit==='sari',pose:'portrait',rotation:0});w.people.splice(w.people.indexOf(p),1);p.g.position.y=0;p.g.name='your-photo-avatar';p.g.visible=false;p.portraitOutfit=outfit;p.portraitPose=pose;
 if(outfit==='sari'){const trim=w.box('#f0ddbc',[-.08,1.24,.17],[.13,.74,.03],p.body);trim.rotation.z=-.39;}
 if(pose==='namaskar'){p.arms.forEach(a=>a.visible=false);for(const side of [-1,1]){w.rod([side*.215,1.48,0],[side*.30,1.09,.15],.055,'#a77b57',p.body);w.rod([side*.30,1.09,.15],[side*.025,1.43,.34],.045,'#a77b57',p.body);w.ball('#a77b57',[side*.025,1.47,.34],[.025,.09,.05],p.body);}}
 else if(pose==='wave'){p.arms[1].rotation.z=2.35;}
 else{p.arms[0].rotation.z=-.15;p.arms[1].rotation.x=-.35;}
 w.portraitActor=p;return p;
}
export function capturePortrait(w,options){
 setPortrait(w,options);const width=1440,height=960,target=new THREE.WebGLRenderTarget(width,height);target.texture.colorSpace=THREE.SRGBColorSpace;
 const prior=w.renderer.getRenderTarget(),balloon=w.companionBalloon,balloonVisible=balloon?.visible;w.portraitActor.g.visible=true;w.photoRig.visible=false;if(balloon)balloon.visible=false;
 try{w.renderer.setRenderTarget(target);w.renderer.render(w.scene,w.portraitCamera);const pixels=new Uint8Array(width*height*4);w.renderer.readRenderTargetPixels(target,0,0,width,height,pixels);const canvas=document.createElement('canvas');canvas.width=width;canvas.height=height;const ctx=canvas.getContext('2d'),data=ctx.createImageData(width,height);for(let y=0;y<height;y++)data.data.set(pixels.subarray((height-1-y)*width*4,(height-y)*width*4),y*width*4);ctx.putImageData(data,0,0);return canvas;}
 finally{w.renderer.setRenderTarget(prior);target.dispose();w.portraitActor.g.visible=false;w.photoRig.visible=true;if(balloon)balloon.visible=balloonVisible;}
}
export function drawPortraitCard(canvas,source,name='',outfit='sari'){
 canvas.width=1440;canvas.height=1120;const ctx=canvas.getContext('2d');ctx.fillStyle='#f4e9d1';ctx.fillRect(0,0,1440,1120);ctx.drawImage(source,0,0,source.width,source.height,35,35,1370,913.333);ctx.fillStyle='#754031';ctx.font='italic 48px "Cormorant Garamond",serif';ctx.fillText('My Kolkata Pujo evening.',55,1010);const clean=postcardName(name);ctx.font='26px "Noto Serif Bengali",serif';ctx.fillText(clean?`${clean} · ${outfit==='sari'?'Sari':'Dhoti kurta'}`:outfit==='sari'?'Sari · শারদীয়ার স্মৃতি':'Dhoti kurta · শারদীয়ার স্মৃতি',58,1052,1300);ctx.font='12px "DM Sans",sans-serif';ctx.fillStyle='#8e7960';ctx.fillText('PUJO PARIKRAMA  /  KOLKATA  /  SHUBHO SHARODIYA',58,1092);return canvas.toDataURL('image/png');
}
