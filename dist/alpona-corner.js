import * as THREE from './assets/three.module.js';
import {ALPONA_DESIGNS,paintAlpona} from './alpona.js';
export const ART_SPOT={x:-3.8,z:7};
export const ART_COLOURS={rice:'#ffffff',gold:'#f6c158',vermilion:'#ef7358',leaf:'#85d5b0'};
export const ART_LIMIT=24;
export function addMotif(stamps,{design='lotus',colour='rice',x=.5,y=.5,size=.7}={}){
 if(stamps.length>=ART_LIMIT||!ALPONA_DESIGNS.includes(design)||!Object.hasOwn(ART_COLOURS,colour)||![x,y,size].every(Number.isFinite)||size<.12||size>.9||x<0||x>1||y<0||y>1)return false;
 // Keep every motif within the square, even at its edges.
 stamps.push({design,colour,size,x:Math.max(size/2,Math.min(1-size/2,x)),y:Math.max(size/2,Math.min(1-size/2,y))});return true;
}
export function drawDesign(canvas,stamps,{preview=false}={}){
 canvas.width=canvas.height=768;const c=canvas.getContext('2d');c.clearRect(0,0,768,768);
 if(preview){c.fillStyle='#66534b';c.fillRect(0,0,768,768);}
 for(const stamp of stamps){c.save();c.translate((stamp.x-stamp.size/2)*768,(stamp.y-stamp.size/2)*768);c.scale(stamp.size*1.5,stamp.size*1.5);paintAlpona(c,stamp.design,{white:ART_COLOURS[stamp.colour],accent:stamp.colour==='gold'?'#fff8df':'#f6c158'});c.restore();}
 return canvas;
}
export function buildAlponaCorner(w){
 const g=new THREE.Group();g.name='alpona-painting-corner';g.position.set(-6.3,0,5.5);w.scene.add(g);w.artBench=g;
 w.box('#855e44',[0,.43,0],[1.25,.1,.65],g);for(const side of [-1,1])w.box('#644b3b',[side*.47,.2,0],[.08,.4,.5],g);
 for(const [i,colour] of Object.values(ART_COLOURS).entries()){w.cyl('#a26c48',[-.45+i*.30,.52,0],[.11,.08,.11],g);w.cyl(colour,[-.45+i*.30,.565,0],[.09,.015,.09],g);}
 w.rod([-.45,.51,.22],[.25,.54,.22],.018,'#c5ab76',g);w.text('আলপনা আঁকি',[0,1.12,0],1.6,.34,{bg:'#7d4334',parent:g,size:80});
 const texture=new THREE.CanvasTexture(document.createElement('canvas'));texture.colorSpace=THREE.SRGBColorSpace;texture.anisotropy=8;
 const material=new THREE.MeshBasicMaterial({map:texture,transparent:true,depthWrite:false,toneMapped:false,fog:false,side:THREE.DoubleSide,forceSinglePass:true});
 w.personalAlpona=new THREE.Mesh(new THREE.PlaneGeometry(3.4,3.4),material);w.personalAlpona.name='your-painted-alpona';w.personalAlpona.rotation.x=-Math.PI/2;w.personalAlpona.position.set(ART_SPOT.x,.055,ART_SPOT.z);w.personalAlpona.visible=false;w.scene.add(w.personalAlpona);w.artStamps=[];
 // Reserve a clear patch; neighbouring decorative tiles must not show through it.
 for(const batch of w.alponaBatches){const tiles=[...w.alponas,...w.addedAlponas].filter(m=>m.material===batch.material);tiles.forEach((tile,i)=>{const r=tile.geometry.parameters.width*tile.scale.x/2;if(Math.abs(tile.position.x-ART_SPOT.x)<r+1.7&&Math.abs(tile.position.z-ART_SPOT.z)<r+1.7)batch.setMatrixAt(i,new THREE.Matrix4().makeScale(0,0,0));});batch.instanceMatrix.needsUpdate=true;}
 w.artCamera=new THREE.PerspectiveCamera(64,1.5,.1,100);w.artCamera.position.set(-3.8,6.4,18.8);w.artCamera.lookAt(-.6,3.2,-2);w.scene.add(w.artCamera);
}
export function applyAlpona(w,stamps){
 if(!w.personalAlpona||!stamps.length||stamps.length>ART_LIMIT)return false;
 const clean=[];for(const s of stamps)if(!addMotif(clean,s))return false;
 w.artStamps=clean;drawDesign(w.personalAlpona.material.map.image,clean);w.personalAlpona.material.map.needsUpdate=true;w.personalAlpona.visible=true;return true;
}
export function captureAlpona(w){
 if(!w.personalAlpona.visible)throw new Error('Complete your alpona first');
 const width=1440,height=960,target=new THREE.WebGLRenderTarget(width,height);target.texture.colorSpace=THREE.SRGBColorSpace;
 const prior=w.renderer.getRenderTarget(),hidden=[w.companionBalloon,w.purchase?.prop,w.photoRig].filter(Boolean).map(o=>[o,o.visible]);hidden.forEach(([o])=>o.visible=false);
 try{w.renderer.setRenderTarget(target);w.renderer.render(w.scene,w.artCamera);const pixels=new Uint8Array(width*height*4);w.renderer.readRenderTargetPixels(target,0,0,width,height,pixels);const canvas=document.createElement('canvas');canvas.width=width;canvas.height=height;const c=canvas.getContext('2d'),data=c.createImageData(width,height);for(let y=0;y<height;y++)data.data.set(pixels.subarray((height-1-y)*width*4,(height-y)*width*4),y*width*4);c.putImageData(data,0,0);return canvas;}
 finally{w.renderer.setRenderTarget(prior);target.dispose();hidden.forEach(([o,visible])=>o.visible=visible);}
}
